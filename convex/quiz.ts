import { action, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";

// ─── AI GENERATION (unchanged) ──────────────────────────────────

export const generateQuiz = action({
  args: { prompt: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated call to generateQuiz");
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error("Missing OpenRouter API Key");
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b:free",
        messages: [
          {
            role: "system",
            content: `You are an expert quiz generator. Generate a multiple-choice quiz based on the user's prompt. 
Respond ONLY with a valid JSON array of question objects. Do not include any markdown formatting like \`\`\`json.
Each object must have exactly these keys:
- "question": string (the question text)
- "options": array of exactly 4 strings (the possible answers)
- "answer": string (the correct answer, must exactly match one of the options)
- "explanation": string (a brief explanation of why the answer is correct)`
          },
          {
            role: "user",
            content: args.prompt
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error("Failed to generate quiz: " + response.statusText);
    }

    const data = await response.json();
    let questions;
    try {
      let content = data.choices[0].message.content.trim();
      // Remove any markdown fencing if present
      if (content.startsWith("```json")) {
        content = content.replace(/^```json\s*/, "").replace(/\s*```$/, "");
      } else if (content.startsWith("```")) {
        content = content.replace(/^```\s*/, "").replace(/\s*```$/, "");
      }
      
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        questions = parsed;
      } else if (parsed.questions && Array.isArray(parsed.questions)) {
        questions = parsed.questions;
      } else {
        throw new Error("Invalid format. Ensure it's an array.");
      }
    } catch (e) {
      throw new Error("Failed to parse quiz response: " + (e as Error).message);
    }
    
    return questions as {
      question: string;
      options: string[];
      answer: string;
      explanation: string;
    }[];
  }
});

// ─── SAVE QUIZ ──────────────────────────────────────────────────
// Inserts quiz metadata, then questions with embedded options

export const saveQuiz = mutation({
  args: {
    prompt: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    questions: v.array(
      v.object({
        question: v.string(),
        options: v.array(v.string()),
        answer: v.string(),
        explanation: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated call to saveQuiz");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("byExternalId", (q) => q.eq("externalId", identity.subject))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    // Generate a unique 6-character access code
    const accessCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const quizId = await ctx.db.insert("quizzes", {
      userId: user._id,
      prompt: args.prompt,
      title: args.title,
      description: args.description,
      isPublished: false,
      allowUnlimitedAttempts: true,
      accessCode,
      accessLink: `/quiz/${accessCode}`,
      createdAt: Date.now(),
    });

    // Insert each question with options embedded
    for (let i = 0; i < args.questions.length; i++) {
      const q = args.questions[i];

      await ctx.db.insert("questions", {
        quizId,
        question: q.question,
        explanation: q.explanation ?? "",
        answer: q.answer,
        orderIndex: i,
        options: q.options.map((text) => ({
          text,
          isCorrect: text === q.answer,
        })),
      });
    }

    return quizId;
  }
});

// ─── GET QUIZZES (paginated) ────────────────────────────────────

export const getQuizzes = query({
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
      .query("quizzes")
      .withIndex("byUserId", (q) => q.eq("userId", user._id))
      .order("desc")
      .paginate(args.paginationOpts);
  }
});

// ─── GET SINGLE QUIZ WITH QUESTIONS ─────────────────────────────

export const getQuizWithQuestions = query({
  args: { quizId: v.id("quizzes") },
  handler: async (ctx, args) => {
    const quiz = await ctx.db.get(args.quizId);
    if (!quiz) return null;

    const questions = await ctx.db
      .query("questions")
      .withIndex("byQuizId", (q) => q.eq("quizId", args.quizId))
      .collect();

    // Sort by orderIndex
    questions.sort((a, b) => a.orderIndex - b.orderIndex);

    return {
      ...quiz,
      questions,
    };
  }
});

// ─── UPDATE QUIZ METADATA ───────────────────────────────────────

export const updateQuiz = mutation({
  args: {
    quizId: v.id("quizzes"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    isPublished: v.optional(v.boolean()),
    timeLimitSeconds: v.optional(v.number()),
    availableFrom: v.optional(v.number()),
    availableTo: v.optional(v.number()),
    allowUnlimitedAttempts: v.optional(v.boolean()),
    maxAttempts: v.optional(v.number()),
    classId: v.optional(v.id("classes")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("byExternalId", (q) => q.eq("externalId", identity.subject))
      .unique();
      
    if (!user) {
      throw new Error("User not found");
    }

    const quiz = await ctx.db.get(args.quizId);
    if (!quiz || quiz.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    const { quizId, ...updates } = args;

    // Remove undefined values so we only patch what's provided
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );

    if (Object.keys(cleanUpdates).length > 0) {
      await ctx.db.patch(quizId, cleanUpdates);
    }
  }
});

// ─── DELETE QUIZ (cascade) ──────────────────────────────────────

export const deleteQuiz = mutation({
  args: { quizId: v.id("quizzes") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("byExternalId", (q) => q.eq("externalId", identity.subject))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    const quiz = await ctx.db.get(args.quizId);
    if (!quiz || quiz.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    // Delete all questions (options are embedded, no separate deletion needed)
    const questions = await ctx.db
      .query("questions")
      .withIndex("byQuizId", (q) => q.eq("quizId", args.quizId))
      .collect();

    for (const question of questions) {
      await ctx.db.delete(question._id);
    }

    // Delete all attempts for this quiz
    const attempts = await ctx.db
      .query("quiz_attempts")
      .withIndex("byQuizId", (q) => q.eq("quizId", args.quizId))
      .collect();

    for (const attempt of attempts) {
      await ctx.db.delete(attempt._id);
    }

    // Finally delete the quiz itself
    await ctx.db.delete(args.quizId);
  }
});
