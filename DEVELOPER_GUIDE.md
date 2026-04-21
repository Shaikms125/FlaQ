# Developer Guide - Quick Start for AI Agents

## Current Features

Quiz AI is a **full-featured quiz platform with AI generation**. Here's what's implemented:

- ✅ **AI Quiz Generation** - Generate quizzes with OpenRouter API (Llama, Gemini, Hermes fallbacks)
- ✅ **Quiz Management** - Create, edit, publish, delete quizzes
- ✅ **Question Editor** - Add, edit, reorder questions with multiple-choice options
- ✅ **Public Quiz Taking** - Students take quizzes via unique access codes
- ✅ **Attempt Tracking** - Record answers, scores, and attempt history
- ✅ **Results & Analytics** - View scores by student, question breakdown
- ✅ **Quiz Sharing** - Publish publicly/privately, set availability windows
- ✅ **Quiz Settings** - Configure time limits, attempt restrictions, auto-grading
- ✅ **Authentication** - Clerk-based auth with user profiles
- ✅ **Class Infrastructure** - Classes with invite codes, role-based access (backend ready)
- ✅ **Dashboard** - Home overview with recent quizzes and stats
- ✅ **Quiz Editor UI** - Full-featured question and settings editor
- ✅ **Theme Support** - Light/dark mode with persistent preference
- ✅ **Timer & Progress** - Countdown timer, progress tracking
- ✅ **UI Component Library** - 20+ shadcn/ui components

**Not Yet Implemented (Planned):**
- 🔄 Class features UI (backend ready)
- 🔄 Student rosters and class analytics
- 🔄 Certificates
- 🔄 Quiz export/import

See `FEATURES.md` for detailed feature documentation.

## Getting Oriented Quickly

### First Time? Read These in Order:
1. **This file** - You are here
2. `PROJECT_STRUCTURE.md` - Directory layout
3. `PROJECT_ARCHITECTURE.md` - How everything connects
4. `src/components/README.md` - UI component guide
5. `convex/BACKEND_GUIDE.md` - Backend logic guide

### Project Type
- **Stack**: React 19 + TypeScript + Vite + Convex + Clerk + shadcn/ui
- **Purpose**: AI-powered quiz generation, management, and taking
- **Deployment**: Frontend on Vercel/similar, Backend on Convex
- **Database**: Convex real-time document database

## File Locations

```
Feature Implementation          → Look In
───────────────────────────────────────────────
Create/Edit Quiz UI             src/pages/GenerateQuiz.tsx, QuizEditor.tsx
Quiz display/cards              src/components/quiz/
Database schema                 convex/schema.ts
Quiz queries/mutations          convex/quiz.ts
User authentication             convex/auth.config.ts
Styling/theme                   src/components/ThemeProvider.tsx
Navigation/routing              src/App.tsx
```

## Common Tasks for AI Agents

### ❓ "Add a new field to quizzes"
1. Update `convex/schema.ts` - add field to `quizzes` table
2. Update `convex/quiz.ts` - add to creation/update mutations
3. Update UI in `src/components/quiz/` - display/edit field
4. Update tests if applicable

### ❓ "Create a new query to fetch quizzes by tag"
1. Design data model in `convex/schema.ts` (add `tags` field)
2. Add index: `.index("by_tags", ["tags"])`
3. Write query in `convex/quiz.ts`:
```tsx
export const getQuizzesByTag = query({
  args: { tag: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("quizzes")
      .withIndex("by_tags", q => q.eq("tags", args.tag))
      .collect();
  },
});
```
4. Use in React: `useQuery(api.quiz.getQuizzesByTag, { tag: "math" })`

### ❓ "Display loading skeletons for a list"
```tsx
import { Skeleton } from "@/components/ui/skeleton";

{isLoading && (
  <div className="grid gap-4">
    {Array.from({ length: 3 }).map((_, i) => (
      <div key={i} className="flex gap-3 p-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <Skeleton className="h-4 w-full" />
      </div>
    ))}
  </div>
)}
```

### ❓ "Protect a route from unauthenticated users"
```tsx
// src/pages/MyPage.tsx
import ProtectedLayout from "@/layouts/ProtectedLayout";

export default function MyPage() {
  return (
    <ProtectedLayout>
      <div>{/* page content */}</div>
    </ProtectedLayout>
  );
}
```

### ❓ "Add a new admin feature"
1. Create component in `src/components/admin-panel/MyFeature.tsx`
2. Check permissions in backend mutation:
```tsx
export const adminAction = mutation({
  args: { ... },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    // Check if user is admin
    const user = await ctx.db.get(userId);
    if (!user.isAdmin) throw new Error("Unauthorized");
    // ... proceed
  },
});
```
3. Use in component with `useMutation`

## Code Style & Conventions

### TypeScript
```tsx
// ✅ Always use interfaces for component props
interface ButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export const MyButton: React.FC<ButtonProps> = ({ onClick, disabled }) => {
  return <button onClick={onClick} disabled={disabled}>Click</button>;
};
```

### React Hooks
```tsx
// ✅ Use hooks at top level
export function MyComponent() {
  const [state, setState] = useState(null);
  const quizzes = useQuery(api.quiz.getQuizzes);
  const mutation = useMutation(api.quiz.createQuiz);
  
  return <div>{/* JSX */}</div>;
}
```

### Styling
```tsx
// ✅ Use Tailwind classes
<div className="flex items-center gap-4 p-6 rounded-lg bg-card">
  <span className="font-semibold">Title</span>
</div>

// ✅ For complex styles, use shadcn components
import { Button } from "@/components/ui/button";
<Button variant="outline" size="sm">Click</Button>
```

### Imports
```tsx
// ✅ Use path aliases
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";

// ❌ Avoid relative paths
import { api } from "../../../convex/_generated/api";
```

## Running Commands

```bash
# Start dev server
npm run dev              # Frontend at localhost:5173

# Type checking
npm run typecheck       # Catch TS errors before runtime

# Formatting
npm run format          # Fix code style

# Linting
npm run lint            # Check code quality

# Building
npm run build           # Production build
```

## Environment Variables

Create `.env.local` in project root:
```
VITE_CONVEX_URL=https://your-app.convex.cloud
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
```

## Debugging Tips

### "useQuery returns undefined"
This is **normal**—it's loading. Check with:
```tsx
const data = useQuery(...);
if (data === undefined) return <LoadingSkeleton />;
// data is now safely defined
```

### "Convex mutation failed"
Check:
1. Are all required arguments provided?
2. Is the user authenticated?
3. Is the database schema correct?
4. Check Convex dashboard logs

### "Component not found error"
Verify import path uses `@/`:
```tsx
// ✅ Correct
import { MyComponent } from "@/components/quiz/MyComponent";

// ❌ Wrong—breaks often
import { MyComponent } from "./MyComponent";
```

## Performance Notes

1. **Pagination**: Use for large lists (default 6-10 items/page)
2. **Memoization**: Use `React.memo` for expensive renders
3. **Bundles**: Vite auto-code-splits components
4. **Real-time**: Convex handles optimization internally

## Testing (Future)

Plan to add:
- Vitest for unit tests
- React Testing Library for component tests
- E2E tests with Playwright

For now, manual testing and type checking via TypeScript.

## Security Checklist

- [ ] Authentication checks in backend mutations
- [ ] Input validation for all user inputs
- [ ] Sensitive data not logged to console
- [ ] Environment variables not hardcoded
- [ ] CORS properly configured for Convex

## Common Mistakes to Avoid

❌ **Inline object creation in deps:**
```tsx
// Bad - creates new object every render
useEffect(() => {
  // ...
}, [{ key: "value" }]);

// Good - stable reference
const config = { key: "value" };
useEffect(() => {
  // ...
}, [config]);
```

❌ **Mutating state directly:**
```tsx
// Bad
state.items.push(newItem);

// Good
setState([...state.items, newItem]);
```

❌ **Not handling undefined query results:**
```tsx
// Bad - crashes when undefined
const quiz = useQuery(...);
return <div>{quiz.title}</div>;

// Good
const quiz = useQuery(...);
if (!quiz) return <Loading />;
return <div>{quiz.title}</div>;
```

## Links

- **Convex Docs**: https://docs.convex.dev
- **Clerk Docs**: https://clerk.com/docs
- **shadcn/ui**: https://ui.shadcn.com
- **React Router**: https://reactrouter.com
- **Tailwind**: https://tailwindcss.com

## Still Confused?

See specific guides:
- `PROJECT_STRUCTURE.md` for file locations
- `PROJECT_ARCHITECTURE.md` for how components connect
- `src/components/README.md` for UI patterns
- `convex/BACKEND_GUIDE.md` for backend patterns
