import { action, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

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
- "answer": string (the correct answer, must beautifully match one of the options)`
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
        throw new Error("Invalid format format. Ensure it's an array.");
      }
    } catch (e) {
      throw new Error("Failed to parse quiz response: " + (e as Error).message);
    }
    
    return questions as { question: string, options: string[], answer: string }[];
  }
});

export const saveQuiz = mutation({
  args: {
    prompt: v.string(),
    questions: v.array(
      v.object({
        question: v.string(),
        options: v.array(v.string()),
        answer: v.string(),
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

    const quizId = await ctx.db.insert("quizzes", {
      userId: user._id,
      prompt: args.prompt,
      questions: args.questions,
    });

    return quizId;
  }
});

export const getQuizzes = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("byExternalId", (q) => q.eq("externalId", identity.subject))
      .unique();

    if (!user) {
      return [];
    }

    return await ctx.db
      .query("quizzes")
      .withIndex("byUserId", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();
  }
});

export const updateQuiz = mutation({
  args: {
    quizId: v.id("quizzes"),
    questions: v.array(
      v.object({
        question: v.string(),
        options: v.array(v.string()),
        answer: v.string(),
      })
    ),
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

    await ctx.db.patch(args.quizId, {
      questions: args.questions,
    });
  }
});
