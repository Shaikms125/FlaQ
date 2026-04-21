import { query } from "./_generated/server";
import { v } from "convex/values";

// ─── GET CLASS ANALYTICS (TEACHERS) ──────────────────────────────

export const getClassAnalytics = query({
  args: { classId: v.id("classes") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("byExternalId", (q) => q.eq("externalId", identity.subject))
      .unique();
    if (!user) throw new Error("User not found");

    // Verify teacher membership
    const membership = await ctx.db
      .query("class_members")
      .withIndex("byClassAndUser", (q) =>
        q.eq("classId", args.classId).eq("userId", user._id)
      )
      .unique();
    if (!membership || membership.role !== "teacher") {
      throw new Error("Unauthorized: Only teachers can view class analytics");
    }

    // Fetch all published quizzes for the class
    const quizzes = await ctx.db
      .query("quizzes")
      .withIndex("byClassId", (q) => q.eq("classId", args.classId))
      .collect();

    const publishedQuizzes = quizzes.filter((q) => q.isPublished);
    const quizIds = publishedQuizzes.map((q) => q._id);

    // Fetch all attempts for these quizzes
    const allAttempts: any[] = [];
    for (const qId of quizIds) {
      const attempts = await ctx.db
        .query("quiz_attempts")
        .withIndex("byQuizId", (q) => q.eq("quizId", qId))
        .collect();
      allAttempts.push(...attempts);
    }

    // Aggregate data per quiz
    const quizAnalytics = publishedQuizzes.map((quiz) => {
      const quizAttempts = allAttempts.filter(
        (a) => a.quizId === quiz._id && !a.isPractice
      );
      const completions = quizAttempts.length;
      const averagePercentage =
        completions > 0
          ? quizAttempts.reduce((sum, a) => sum + a.percentage, 0) / completions
          : 0;

      return {
        quizId: quiz._id,
        title: quiz.title,
        completions,
        averagePercentage,
      };
    });

    // Calculate class-wide average
    const totalRealAttempts = allAttempts.filter((a) => !a.isPractice);
    const classAverage =
      totalRealAttempts.length > 0
        ? totalRealAttempts.reduce((sum, a) => sum + a.percentage, 0) /
          totalRealAttempts.length
        : 0;

    return {
      quizAnalytics,
      classAverage,
      totalQuizzes: publishedQuizzes.length,
    };
  },
});

// ─── GET STUDENT PROGRESS (STUDENTS) ──────────────────────────────

export const getStudentProgress = query({
  args: {
    classId: v.id("classes"),
    studentId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("byExternalId", (q) => q.eq("externalId", identity.subject))
      .unique();
    if (!user) throw new Error("User not found");

    // Verify membership of the current user
    const membership = await ctx.db
      .query("class_members")
      .withIndex("byClassAndUser", (q) =>
        q.eq("classId", args.classId).eq("userId", user._id)
      )
      .unique();

    if (!membership) throw new Error("Not a member of this class");

    // Enforce permissions: students can only view their own progress
    if (membership.role === "student" && args.studentId !== user._id) {
      throw new Error("Unauthorized: Students can only view their own progress");
    }

    // Fetch quizzes for the class
    const quizzes = await ctx.db
      .query("quizzes")
      .withIndex("byClassId", (q) => q.eq("classId", args.classId))
      .collect();

    const quizIds = quizzes.map((q) => q._id);

    // Fetch attempts for the student
    const studentAttempts = await ctx.db
      .query("quiz_attempts")
      .withIndex("byStudentId", (q) => q.eq("studentId", args.studentId))
      .collect();

    // Filter attempts to only include those for the class's quizzes
    const classAttempts = studentAttempts.filter((a) =>
      quizIds.includes(a.quizId)
    );

    // Map attempts to include quiz title
    const attemptHistory = classAttempts
      .map((attempt) => {
        const quiz = quizzes.find((q) => q._id === attempt.quizId);
        return {
          ...attempt,
          quizTitle: quiz?.title || "Unknown Quiz",
        };
      })
      .sort((a, b) => b.startedAt - a.startedAt); // most recent first

    return {
      attemptHistory,
    };
  },
});
