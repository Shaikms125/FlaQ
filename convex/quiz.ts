import { action, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";

// ─── AI GENERATION ──────────────────────────────────────────────

// Ordered by reliability / quota. Keep several `:free` models so a
// single upstream 429 doesn't take down generation.
const MODEL_FALLBACKS = [
  "apodex/apodex-1.1-mini:free",
  "deepseek/deepseek-v4-flash:free",
  "minimax/minimax-m2.5:free",
  "google/gemma-4-31b-it:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "qwen/qwen3-235b-a22b:free",
  "mistralai/mistral-small-3.1-24b-instruct:free",
];

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRateLimitError(message: string) {
  const m = message.toLowerCase();
  return (
    m.includes("429") ||
    m.includes("rate-limited") ||
    m.includes("rate limited") ||
    m.includes("too many requests") ||
    m.includes("temporarily rate-limited")
  );
}

async function callOpenRouter(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userPrompt: string,
) {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      // OpenRouter recommends these; missing referer/title can mean
      // stricter rate limits on free-tier keys.
      "HTTP-Referer": "https://quiz-ai.app",
      "X-Title": "Quiz AI",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 4000,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`${response.status} ${response.statusText}${body ? ` — ${body.slice(0, 500)}` : ""}`);
  }

  return response.json();
}

// Retry a single model a few times on 429s with exponential backoff
// before moving on to the next fallback model.
async function callModelWithRetries(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userPrompt: string,
  maxRetries = 2,
) {
  let lastError: unknown = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await callOpenRouter(apiKey, model, systemPrompt, userPrompt);
    } catch (e) {
      lastError = e;
      const message = (e as Error)?.message ?? "";
      // Only retry rate limits — other errors (401, 400, bad JSON)
      // won't fix themselves by retrying the same model.
      if (isRateLimitError(message) && attempt < maxRetries) {
        const backoffMs = 2000 * (attempt + 1);
        console.warn(
          `Model ${model} rate-limited (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${backoffMs}ms...`
        );
        await sleep(backoffMs);
        continue;
      }
      throw e;
    }
  }
  throw lastError as Error;
}

function parseQuizResponse(data: any, optionCount: number) {
  const content: string | undefined = data?.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("Model returned an empty response. Trying next model...");
  }

  let cleaned = content;
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.replace(/^```json\s*/, "").replace(/\s*```$/, "");
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```\s*/, "").replace(/\s*```$/, "");
  }

  // Models sometimes wrap JSON in prose — extract the JSON object/array.
  const jsonStart = Math.min(
    ...["{", "["].map((c) => {
      const i = cleaned.indexOf(c);
      return i === -1 ? Infinity : i;
    })
  );
  const jsonEndObj = cleaned.lastIndexOf("}");
  const jsonEndArr = cleaned.lastIndexOf("]");
  const jsonEnd = Math.max(jsonEndObj, jsonEndArr);
  if (jsonStart !== Infinity && jsonEnd > jsonStart) {
    cleaned = cleaned.slice(jsonStart, jsonEnd + 1);
  }

  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error("Model returned invalid JSON. Trying next model...");
  }

  let result: {
    title: string;
    questions: {
      question: string;
      options: string[];
      answerIndex: number;
      explanation: string;
    }[];
  };

  if (parsed.title && Array.isArray(parsed.questions)) {
    result = parsed;
  } else if (Array.isArray(parsed)) {
    result = { title: "Generated Quiz", questions: parsed };
  } else {
    throw new Error("Invalid format. Expected { title, questions } or an array.");
  }

  for (const q of result.questions) {
    if (typeof q.answerIndex !== "number" || q.answerIndex < 0 || q.answerIndex >= q.options.length) {
      if ("answer" in q && typeof (q as any).answer === "string") {
        const idx = q.options.indexOf((q as any).answer);
        q.answerIndex = idx >= 0 ? idx : 0;
      } else {
        q.answerIndex = 0;
      }
    }
  }

  return result;
}

export const generateQuiz = action({
  args: {
    prompt: v.string(),
    numOptions: v.optional(v.number()),
    numQuestions: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated call to generateQuiz");
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error("Missing OpenRouter API Key");
    }

    const optionCount = args.numOptions ?? 4;
    const questionCount = args.numQuestions ?? 5;

    const systemPrompt = `You are an expert quiz generator. Generate a multiple-choice quiz based on the user's prompt.
Respond ONLY with a valid JSON object (no markdown fencing). The object must have:
- "title": string (a short, descriptive title for the quiz)
- "questions": array of exactly ${questionCount} question objects

Each question object must have exactly these keys:
- "question": string (the question text)
- "options": array of exactly ${optionCount} strings (the possible answers)
- "answerIndex": number (the 0-based index of the correct option in the options array)
- "explanation": string (a brief explanation of why the answer is correct)`;

    let lastError: Error | null = null;
    let rateLimitedCount = 0;

    for (const model of MODEL_FALLBACKS) {
      try {
        const data = await callModelWithRetries(apiKey, model, systemPrompt, args.prompt);
        return parseQuizResponse(data, optionCount);
      } catch (e) {
        lastError = e as Error;
        if (isRateLimitError(lastError.message)) rateLimitedCount++;
        console.warn(`Model ${model} failed, trying next fallback...`, lastError.message);
        // Small stagger between different models so we don't slam
        // OpenRouter with back-to-back requests on a throttled key.
        await sleep(1000);
      }
    }

    // All fallbacks exhausted — give the user an actionable message
    // instead of a raw "All AI models failed ... 429 ..." dump.
    if (rateLimitedCount > 0) {
      throw new Error(
        "AI is busy right now (rate limited). Please wait ~30 seconds and try again."
      );
    }
    throw new Error("All AI models failed to generate quiz. Last error: " + (lastError?.message ?? "unknown"));
  }
});

// ─── SAVE QUIZ ──────────────────────────────────────────────────
// Inserts quiz metadata, then questions with embedded options

export const saveQuiz = mutation({
  args: {
    prompt: v.optional(v.string()),
    title: v.string(),
    description: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
    isPublished: v.optional(v.boolean()),
    timeLimitSeconds: v.optional(v.number()),
    allowUnlimitedAttempts: v.optional(v.boolean()),
    availableFrom: v.optional(v.number()),
    availableTo: v.optional(v.number()),
    classId: v.optional(v.id("classes")),
    questions: v.array(
      v.object({
        question: v.string(),
        options: v.array(v.string()),
        answerIndex: v.number(),
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
      isPublished: args.isPublished ?? false,
      isPublic: args.isPublic ?? false,
      allowUnlimitedAttempts: args.allowUnlimitedAttempts ?? false,
      timeLimitSeconds: args.timeLimitSeconds,
      availableFrom: args.availableFrom,
      availableTo: args.availableTo,
      classId: args.classId,
      accessCode,
      createdAt: Date.now(),
    });

    // Insert each question with options embedded
    for (let i = 0; i < args.questions.length; i++) {
      const q = args.questions[i];

      await ctx.db.insert("questions", {
        quizId,
        question: q.question,
        explanation: q.explanation ?? "",
        answer: q.answerIndex,
        orderIndex: i,
        options: q.options.map((text, optIdx) => ({
          text,
          isCorrect: optIdx === q.answerIndex,
        })),
      });
    }

    return { quizId, accessCode };
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

    const quizzes = await ctx.db
      .query("quizzes")
      .withIndex("byUserId", (q) => q.eq("userId", user._id))
      .order("desc")
      .paginate(args.paginationOpts);

    // Enrich with counts
    const page = await Promise.all(
      quizzes.page.map(async (quiz) => {
        const questions = await ctx.db
          .query("questions")
          .withIndex("byQuizId", (q) => q.eq("quizId", quiz._id))
          .collect();

        const attempts = await ctx.db
          .query("quiz_attempts")
          .withIndex("byQuizId", (q) => q.eq("quizId", quiz._id))
          .collect();

        return {
          ...quiz,
          questionCount: questions.length,
          attemptCount: attempts.length,
        };
      })
    );

    return { ...quizzes, page };
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
    isPublic: v.optional(v.boolean()),
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

// ─── GET PUBLIC QUIZ BY ACCESS CODE ─────────────────────────────
// No auth required — strips isCorrect from options to prevent cheating

export const getPublicQuizByAccessCode = query({
  args: { accessCode: v.string() },
  handler: async (ctx, args) => {
    const quiz = await ctx.db
      .query("quizzes")
      .withIndex("byAccessCode", (q) => q.eq("accessCode", args.accessCode))
      .unique();

    if (!quiz) return null;

    let isCreator = false;
    const identity = await ctx.auth.getUserIdentity();
    if (identity) {
      const user = await ctx.db
        .query("users")
        .withIndex("byExternalId", (q) => q.eq("externalId", identity.subject))
        .unique();
      if (user && user._id === quiz.userId) {
        isCreator = true;
      }
    }

    if (!quiz.isPublic && !isCreator) {
      // If quiz is not public, check if user is a member of the linked class
      if (quiz.classId && identity) {
        const user = await ctx.db
          .query("users")
          .withIndex("byExternalId", (q) => q.eq("externalId", identity.subject))
          .unique();
        if (user) {
          const membership = await ctx.db
            .query("class_members")
            .withIndex("byClassAndUser", (q) => 
              q.eq("classId", quiz.classId!).eq("userId", user._id)
            )
            .unique();
          if (!membership) return null;
        } else {
          return null;
        }
      } else {
        return null;
      }
    }

    // Check availability window
    const now = Date.now();
    if (!isCreator) {
      if (quiz.availableFrom && now < quiz.availableFrom) {
        return {
          _id: quiz._id,
          title: quiz.title,
          description: quiz.description,
          status: "not-yet" as const,
          availableFrom: quiz.availableFrom,
          availableTo: quiz.availableTo,
          timeLimitSeconds: quiz.timeLimitSeconds,
          allowUnlimitedAttempts: quiz.allowUnlimitedAttempts,
          accessCode: quiz.accessCode,
          questionCount: 0,
          questions: [],
          isCreator,
        };
      }
      if (quiz.availableTo && now > quiz.availableTo) {
        return {
          _id: quiz._id,
          title: quiz.title,
          description: quiz.description,
          status: "expired" as const,
          availableFrom: quiz.availableFrom,
          availableTo: quiz.availableTo,
          timeLimitSeconds: quiz.timeLimitSeconds,
          allowUnlimitedAttempts: quiz.allowUnlimitedAttempts,
          accessCode: quiz.accessCode,
          questionCount: 0,
          questions: [],
          isCreator,
        };
      }
    }

    const questions = await ctx.db
      .query("questions")
      .withIndex("byQuizId", (q) => q.eq("quizId", quiz._id))
      .collect();

    questions.sort((a, b) => a.orderIndex - b.orderIndex);

    // Strip isCorrect from options — quiz takers should not see correct answers
    const safeQuestions = questions.map((q) => ({
      _id: q._id,
      quizId: q.quizId,
      question: q.question,
      orderIndex: q.orderIndex,
      options: q.options.map((opt) => ({ text: opt.text })),
    }));

    return {
      _id: quiz._id,
      title: quiz.title,
      description: quiz.description,
      status: "available" as const,
      availableFrom: quiz.availableFrom,
      availableTo: quiz.availableTo,
      timeLimitSeconds: quiz.timeLimitSeconds,
      allowUnlimitedAttempts: quiz.allowUnlimitedAttempts,
      accessCode: quiz.accessCode,
      questionCount: questions.length,
      questions: safeQuestions,
      isCreator,
    };
  },
});

// ─── SCORE QUIZ (no auth required) ──────────────────────────────
// Accepts answers and returns score without persisting — used for
// immediate score display when allowUnlimitedAttempts is true

export const scoreQuiz = query({
  args: {
    quizId: v.id("quizzes"),
    answers: v.array(
      v.object({
        questionId: v.id("questions"),
        selectedOptionIndex: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const questions = await ctx.db
      .query("questions")
      .withIndex("byQuizId", (q) => q.eq("quizId", args.quizId))
      .collect();

    const questionMap = new Map(questions.map((q) => [q._id.toString(), q]));

    let correctCount = 0;
    const enrichedAnswers = args.answers.map((ans) => {
      const question = questionMap.get(ans.questionId.toString());
      const isCorrect = question ? question.answer === ans.selectedOptionIndex : false;
      if (isCorrect) correctCount++;
      return {
        questionId: ans.questionId,
        selectedOptionIndex: ans.selectedOptionIndex,
        isCorrect,
        correctOptionIndex: question?.answer, // EXPOSE THE RIGHT ANSWER!
      };
    });

    const totalQuestions = questions.length;
    const percentage = totalQuestions > 0
      ? Math.round((correctCount / totalQuestions) * 100)
      : 0;

    return {
      score: correctCount,
      total: totalQuestions,
      percentage,
      answers: enrichedAnswers,
    };
  },
});

// ─── UPDATE QUESTION ────────────────────────────────────────────

export const updateQuestion = mutation({
  args: {
    questionId: v.id("questions"),
    question: v.optional(v.string()),
    explanation: v.optional(v.string()),
    answer: v.optional(v.number()),
    options: v.optional(
      v.array(
        v.object({
          text: v.string(),
          isCorrect: v.boolean(),
        })
      )
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

    const existingQuestion = await ctx.db.get(args.questionId);
    if (!existingQuestion) throw new Error("Question not found");

    // Verify ownership via quiz
    const quiz = await ctx.db.get(existingQuestion.quizId);
    if (!quiz || quiz.userId !== user._id) throw new Error("Unauthorized");

    const { questionId, ...updates } = args;
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );

    if (Object.keys(cleanUpdates).length > 0) {
      await ctx.db.patch(questionId, cleanUpdates);
    }
  },
});

// ─── DELETE QUESTION ────────────────────────────────────────────

export const deleteQuestion = mutation({
  args: { questionId: v.id("questions") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("byExternalId", (q) => q.eq("externalId", identity.subject))
      .unique();
    if (!user) throw new Error("User not found");

    const question = await ctx.db.get(args.questionId);
    if (!question) throw new Error("Question not found");

    const quiz = await ctx.db.get(question.quizId);
    if (!quiz || quiz.userId !== user._id) throw new Error("Unauthorized");

    await ctx.db.delete(args.questionId);
  },
});

// ─── ADD QUESTION ───────────────────────────────────────────────

export const addQuestion = mutation({
  args: {
    quizId: v.id("quizzes"),
    question: v.string(),
    explanation: v.string(),
    answer: v.number(),
    options: v.array(
      v.object({
        text: v.string(),
        isCorrect: v.boolean(),
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
    if (!quiz || quiz.userId !== user._id) throw new Error("Unauthorized");

    // Get the next orderIndex
    const existingQuestions = await ctx.db
      .query("questions")
      .withIndex("byQuizId", (q) => q.eq("quizId", args.quizId))
      .collect();

    const maxOrder = existingQuestions.length > 0
      ? Math.max(...existingQuestions.map((q) => q.orderIndex))
      : -1;

    const questionId = await ctx.db.insert("questions", {
      quizId: args.quizId,
      question: args.question,
      explanation: args.explanation,
      answer: args.answer,
      orderIndex: maxOrder + 1,
      options: args.options,
    });

    return questionId;
  },
});

// ─── GET QUIZ ATTEMPTS WITH USER DETAILS (creator view) ─────────

export const getQuizAttemptsWithUsers = query({
  args: { quizId: v.id("quizzes") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("byExternalId", (q) => q.eq("externalId", identity.subject))
      .unique();
    if (!user) return [];

    // Verify the user owns this quiz
    const quiz = await ctx.db.get(args.quizId);
    if (!quiz || quiz.userId !== user._id) return [];

    const attempts = await ctx.db
      .query("quiz_attempts")
      .withIndex("byQuizId", (q) => q.eq("quizId", args.quizId))
      .order("desc")
      .collect();

    // Enrich with user details
    const enriched = await Promise.all(
      attempts.map(async (attempt) => {
        const student = await ctx.db.get(attempt.studentId);
        return {
          ...attempt,
          studentName: student?.name ?? "Unknown",
          studentEmail: student?.email ?? "",
        };
      })
    );

    return enriched;
  },
});

