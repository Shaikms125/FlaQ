import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";

// ─── SUBMIT ATTEMPT ─────────────────────────────────────────────

export const submitAttempt = mutation({
  args: {
    quizId: v.id("quizzes"),
    isPractice: v.boolean(),
    answers: v.array(
      v.object({
        questionId: v.id("questions"),
        selectedOptionIndex: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("byExternalId", (q) => q.eq("externalId", identity.subject))
      .unique();
    if (!user) throw new Error("User not found");

    const quiz = await ctx.db.get(args.quizId);
    if (!quiz) throw new Error("Quiz not found");

    // Fetch all questions for this quiz to verify answers
    const questions = await ctx.db
      .query("questions")
      .withIndex("byQuizId", (q) => q.eq("quizId", args.quizId))
      .collect();

    const questionMap = new Map(questions.map((q) => [q._id.toString(), q]));

    // Calculate score and enrich answers with isCorrect
    let correctCount = 0;
    const enrichedAnswers = args.answers.map((ans) => {
      const question = questionMap.get(ans.questionId.toString());
      const isCorrect = question ? question.answer === ans.selectedOptionIndex : false;
      if (isCorrect) correctCount++;
      return {
        questionId: ans.questionId,
        selectedOptionIndex: ans.selectedOptionIndex,
        isCorrect,
        correctOptionIndex: question?.answer, // EXPOSE INCORRECT/CORRECT OPTIONS TO CLIENT
      };
    });

    const totalQuestions = questions.length;
    const percentage = totalQuestions > 0
      ? Math.round((correctCount / totalQuestions) * 100)
      : 0;

    // Check for existing attempt (for upsert on unlimited attempts)
    const existingAttempts = await ctx.db
      .query("quiz_attempts")
      .withIndex("byStudentAndQuiz", (q) =>
        q.eq("studentId", user._id).eq("quizId", args.quizId)
      )
      .collect();

    if (quiz.allowUnlimitedAttempts) {
      // UPSERT: Replace previous attempt if one exists
      const existingAttempt = existingAttempts.find((a) => !a.isPractice || args.isPractice);
      if (existingAttempt) {
        await ctx.db.patch(existingAttempt._id, {
          isPractice: args.isPractice,
          score: correctCount,
          percentage,
          submittedAt: Date.now(),
          answers: enrichedAnswers,
        });

        return {
          attemptId: existingAttempt._id,
          score: correctCount,
          total: totalQuestions,
          percentage,
          answers: enrichedAnswers,
        };
      }
    } else {
      // Single attempt mode
      const isCreator = quiz.userId === user._id;

      if (isCreator) {
        // Creator can retake: upsert their latest attempt
        const existingAttempt = existingAttempts.find((a) => !a.isPractice);
        if (existingAttempt) {
          await ctx.db.patch(existingAttempt._id, {
            isPractice: args.isPractice,
            score: correctCount,
            percentage,
            submittedAt: Date.now(),
            answers: enrichedAnswers,
          });

          return {
            attemptId: existingAttempt._id,
            score: correctCount,
            total: totalQuestions,
            percentage,
            answers: enrichedAnswers,
          };
        }
      } else {
        // Check attempt limits (single attempt mode)
        if (!args.isPractice && quiz.maxAttempts) {
          const gradedAttempts = existingAttempts.filter((a) => !a.isPractice);
          if (gradedAttempts.length >= quiz.maxAttempts) {
            throw new Error("Maximum attempts reached for this quiz");
          }
        }
        // For single-attempt quizzes, block duplicate submissions
        if (!args.isPractice) {
          const alreadySubmitted = existingAttempts.some((a) => !a.isPractice);
          if (alreadySubmitted) {
            throw new Error("You have already submitted this quiz");
          }
        }
      }
    }

    const attemptId = await ctx.db.insert("quiz_attempts", {
      quizId: args.quizId,
      studentId: user._id,
      isPractice: args.isPractice,
      score: correctCount,
      percentage,
      startedAt: Date.now(),
      submittedAt: Date.now(),
      answers: enrichedAnswers,
    });

    return {
      attemptId,
      score: correctCount,
      total: totalQuestions,
      percentage,
      answers: enrichedAnswers,
    };
  },
});

// ─── GET MY ATTEMPT FOR A SPECIFIC QUIZ ─────────────────────────
// Returns the user's existing attempt for a quiz (for "already taken" detection)

export const getMyAttemptForQuiz = query({
  args: { quizId: v.id("quizzes") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("byExternalId", (q) => q.eq("externalId", identity.subject))
      .unique();
    if (!user) return null;

    const attempts = await ctx.db
      .query("quiz_attempts")
      .withIndex("byStudentAndQuiz", (q) =>
        q.eq("studentId", user._id).eq("quizId", args.quizId)
      )
      .collect();

    // Return the most recent non-practice attempt, or any attempt
    const graded = attempts.find((a) => !a.isPractice);
    return graded ?? attempts[0] ?? null;
  },
});

// ─── GET MY ATTEMPTS (paginated) ────────────────────────────────

export const getMyAttempts = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { page: [], isDone: true, continueCursor: "" };
    }

    const user = await ctx.db
      .query("users")
      .withIndex("byExternalId", (q) => q.eq("externalId", identity.subject))
      .unique();
    if (!user) {
      return { page: [], isDone: true, continueCursor: "" };
    }

    return await ctx.db
      .query("quiz_attempts")
      .withIndex("byStudentId", (q) => q.eq("studentId", user._id))
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

// ─── GET QUIZ ATTEMPTS — instructor view (paginated) ────────────

export const getQuizAttempts = query({
  args: {
    quizId: v.id("quizzes"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { page: [], isDone: true, continueCursor: "" };
    }

    const user = await ctx.db
      .query("users")
      .withIndex("byExternalId", (q) => q.eq("externalId", identity.subject))
      .unique();
    if (!user) {
      return { page: [], isDone: true, continueCursor: "" };
    }

    // Verify the user owns this quiz
    const quiz = await ctx.db.get(args.quizId);
    if (!quiz || quiz.userId !== user._id) {
      return { page: [], isDone: true, continueCursor: "" };
    }

    return await ctx.db
      .query("quiz_attempts")
      .withIndex("byQuizId", (q) => q.eq("quizId", args.quizId))
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

// ─── GET SINGLE ATTEMPT ────────────────────────────────────────

export const getAttempt = query({
  args: { attemptId: v.id("quiz_attempts") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const attempt = await ctx.db.get(args.attemptId);
    if (!attempt) return null;

    // Only the student or the quiz owner can view
    const user = await ctx.db
      .query("users")
      .withIndex("byExternalId", (q) => q.eq("externalId", identity.subject))
      .unique();
    if (!user) return null;

    if (attempt.studentId !== user._id) {
      const quiz = await ctx.db.get(attempt.quizId);
      if (!quiz || quiz.userId !== user._id) return null;
    }

    return attempt;
  },
});
