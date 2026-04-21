# Convex Backend Guide

## Overview
All backend logic for Quiz AI lives in the `convex/` directory. The backend is serverless—no traditional server management needed.

## File Organization

| File | Purpose |
|------|---------|
| `schema.ts` | Database table definitions |
| `auth.config.ts` | Clerk authentication setup |
| `quiz.ts` | Quiz queries, mutations, and actions |
| `users.ts` | User-related backend logic |
| `attempts.ts` | Quiz attempt tracking and scoring |
| `classes.ts` | Class management (WIP) |
| `http.ts` | HTTP endpoints for webhooks |

## Database Schema

### Tables in `schema.ts`

**users**
```ts
{
  _id: Id<"users">,
  clerkId: string,        // Unique Clerk user ID
  email: string,
  name?: string,
  avatar?: string,
  createdAt: number,      // Timestamp
}
```

**quizzes**
```ts
{
  _id: Id<"quizzes">,
  userId: Id<"users">,    // Owner
  title: string,
  description?: string,
  questionCount: number,
  attemptCount: number,
  isPublic: boolean,
  createdAt: number,
}
```

**questions**
```ts
{
  _id: Id<"questions">,
  quizId: Id<"quizzes">,  // Parent quiz
  text: string,
  type: "multiple-choice" | "essay" | "true-false",
  options?: string[],     // For MC and T/F
  correctAnswer: string,
  explanation?: string,
  order: number,          // Question sequence
}
```

**attempts**
```ts
{
  _id: Id<"attempts">,
  userId: Id<"users">,
  quizId: Id<"quizzes">,
  answers: Record<Id<"questions">, string>,  // questionId -> answer
  score: number,          // Percentage
  completedAt: number,    // Timestamp
}
```

## Function Types

### Queries (Read-only, Real-time)
```tsx
// convex/quiz.ts
export const getQuizzes = query({
  args: {
    paginationOpts: v.object({
      numItems: v.number(),
      cursor: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    // Real-time subscription—updates when data changes
    return await ctx.db
      .query("quizzes")
      .collect();
  },
});
```

**Usage in React:**
```tsx
const quizzes = useQuery(api.quiz.getQuizzes, { paginationOpts: {...} });
```

### Mutations (Write operations)
```tsx
export const createQuiz = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    
    return await ctx.db.insert("quizzes", {
      userId,
      title: args.title,
      description: args.description,
      questionCount: 0,
      attemptCount: 0,
      isPublic: false,
      createdAt: Date.now(),
    });
  },
});
```

**Usage in React:**
```tsx
const mutation = useMutation(api.quiz.createQuiz);
await mutation({ title: "New Quiz" });
```

### Actions (External API calls, AI generation)
```tsx
export const generateQuizFromText = action({
  args: {
    text: v.string(),
    numQuestions: v.number(),
  },
  handler: async (ctx, args) => {
    // Can make external API calls (e.g., OpenAI)
    // Then store results via mutation
    const response = await fetch("https://api.openai.com/...", {
      method: "POST",
      body: JSON.stringify({ prompt: args.text }),
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
    });
    
    const questions = await response.json();
    
    // Now write to database
    return questions;
  },
});
```

## Authentication

### Requiring Authenticated User
```tsx
import { auth } from "./_generated/server";

export const myMutation = mutation({
  args: { ... },
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    const userId = identity.subject; // Clerk user ID
    
    // ... rest of logic
  },
});
```

### Helper: `requireUser(ctx)`
Create a utility in `convex/lib/auth.ts`:
```tsx
import { QueryCtx, MutationCtx, ActionCtx } from "./_generated/server";

export async function requireUser(
  ctx: QueryCtx | MutationCtx | ActionCtx
): Promise<Id<"users">> {
  const identity = await ctx.auth.getUserIdentity();
  
  if (!identity) {
    throw new Error("Unauthenticated");
  }
  
  // Find or create user
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) =>
      q.eq("clerkId", identity.subject)
    )
    .first();
  
  if (!user) {
    return await ctx.db.insert("users", {
      clerkId: identity.subject,
      email: identity.email!,
      name: identity.name,
      createdAt: Date.now(),
    });
  }
  
  return user._id;
}
```

## Indexes

Add indexes in `schema.ts` for frequently queried fields:
```tsx
export default defineSchema({
  quizzes: defineTable({
    userId: v.id("users"),
    title: v.string(),
    // ...
  })
    .index("by_userId", ["userId"])  // For "get my quizzes"
    .index("by_public", ["isPublic"]),  // For "get public quizzes"
});
```

## Error Handling

```tsx
export const validateQuiz = mutation({
  args: {
    quizId: v.id("quizzes"),
  },
  handler: async (ctx, args) => {
    const quiz = await ctx.db.get(args.quizId);
    
    if (!quiz) {
      throw new ConvexError("Quiz not found");
    }
    
    const userId = await requireUser(ctx);
    
    if (quiz.userId !== userId) {
      throw new ConvexError("Not authorized");
    }
    
    return quiz;
  },
});
```

## Transactions

Mutations are atomic—all-or-nothing:
```tsx
export const deleteQuizWithQuestions = mutation({
  args: {
    quizId: v.id("quizzes"),
  },
  handler: async (ctx, args) => {
    // Delete questions first
    const questions = await ctx.db
      .query("questions")
      .withIndex("by_quiz_id", (q) =>
        q.eq("quizId", args.quizId)
      )
      .collect();
    
    for (const q of questions) {
      await ctx.db.delete(q._id);
    }
    
    // Then delete quiz
    await ctx.db.delete(args.quizId);
  },
});
```

## Best Practices

1. **Validate Input**: Always validate `args` with `v` validators
2. **Check Auth**: Always call `requireUser()` for private operations
3. **Use Indexes**: Add indexes for `withIndex()` queries
4. **Handle Errors**: Use `ConvexError` for user-facing errors
5. **Return Types**: Use TypeScript's type inference for return types
6. **Environment Variables**: Store secrets in `.env.local` for local dev

## Development Workflow

```bash
# Start Convex dev mode (watches for changes)
npx convex dev

# Deploy to production
npx convex deploy

# View dashboard
npx convex dashboard
```

## Common Patterns

### Paginated Query
```tsx
export const getQuizzes = query({
  args: {
    paginationOpts: v.object({
      numItems: v.number(),
      cursor: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("quizzes")
      .paginate(args.paginationOpts);
  },
});
```

### Real-time Subscription
```tsx
// Automatically subscribes and re-fetches
const quizzes = useQuery(api.quiz.getQuizzes);
```

### Batch Operations
```tsx
export const batchDeleteQuizzes = mutation({
  args: {
    quizIds: v.array(v.id("quizzes")),
  },
  handler: async (ctx, args) => {
    for (const id of args.quizIds) {
      await ctx.db.delete(id);
    }
  },
});
```

## See Also
- [Convex Docs](https://docs.convex.dev)
- [Clerk Integration](https://docs.convex.dev/auth/clerk)
- `schema.ts` for database design
- `http.ts` for webhook handling
