# Quiz AI - Project Structure Guide

## Quick Overview
- **Type**: Full-stack React + TypeScript web application
- **Frontend**: React 19 + Vite + Tailwind CSS + shadcn/ui
- **Backend**: Convex (serverless backend)
- **Authentication**: Clerk
- **Database**: Convex real-time database
- **Deployment**: Vite for frontend, Convex for backend

## Current Features at a Glance
- AI-powered quiz generation with multiple model fallbacks
- Quiz creation, editing, and publishing
- Public quiz taking with access codes
- Attempt tracking and scoring
- Results analytics and reporting
- Quiz sharing with availability windows
- Configurable quiz settings (time limits, attempt restrictions)
- Clerk-based authentication with user profiles
- Class management infrastructure (backend ready)
- Dashboard with recent quizzes and stats
- Theme support (light/dark mode)
- Timer and progress tracking

## Directory Structure

```
quiz-ai/
├── convex/                 # Convex backend (queries, mutations, actions)
├── src/                    # Frontend React application
│   ├── components/         # Reusable React components
│   ├── pages/              # Page-level components (routed)
│   ├── hooks/              # Custom React hooks
│   ├── layouts/            # Layout wrapper components
│   ├── lib/                # Utility functions
│   ├── assets/             # Static assets
│   └── App.tsx             # Main app component
├── public/                 # Static files (favicons, etc.)
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── vite.config.ts          # Vite bundler configuration
└── components.json         # shadcn/ui configuration
```

## Key Files

| File | Purpose |
|------|---------|
| `convex/schema.ts` | Database schema definitions |
| `convex/quiz.ts` | Quiz-related queries/mutations |
| `convex/users.ts` | User management |
| `convex/attempts.ts` | Quiz attempt tracking |
| `convex/auth.config.ts` | Clerk authentication setup |
| `src/App.tsx` | Route definitions and app layout |
| `src/useCurrentUser.ts` | Hook for accessing current user |
| `src/hooks/useQuizStore.ts` | Quiz state management |

## Navigation for AI Agents

### To Add a New Feature:
1. **Database schema**: Check `convex/schema.ts`
2. **Backend logic**: Add to appropriate `convex/*.ts` file
3. **UI components**: Create in `src/components/`
4. **Page**: Create in `src/pages/`
5. **State management**: Use `convex/react` hooks or `useQuizStore`

### To Understand Data Flow:
1. Frontend queries use `useQuery` from `convex/react`
2. Mutations use `useMutation` from `convex/react`
3. Data automatically syncs in real-time
4. See `src/useCurrentUser.ts` for auth example

### To Modify Authentication:
- Clerk setup: `convex/auth.config.ts`
- User queries: `convex/users.ts`
- Frontend auth: `src/useCurrentUser.ts`

## File Naming Conventions

- **Pages**: PascalCase, e.g., `Home.tsx`, `QuizEditor.tsx`
- **Components**: PascalCase, e.g., `QuizCard.tsx`, `ChatInterface.tsx`
- **Hooks**: camelCase with `use` prefix, e.g., `useQuizStore.ts`
- **Utilities**: camelCase, e.g., `utils.ts`
- **Convex functions**: File names match domain (quiz.ts, users.ts, etc.)

## Important Dependencies

| Package | Purpose |
|---------|---------|
| `convex` | Backend API client and types |
| `@clerk/react-router` | Authentication provider |
| `react-router` | Client-side routing |
| `shadcn/ui` | Pre-built accessible UI components |
| `next-themes` | Theme management (light/dark mode) |
| `@tabler/icons-react` | Icon library |

## Development Workflow

```bash
npm run dev          # Start dev server (localhost:5173)
npm run build        # Build for production
npm run typecheck    # Check TypeScript types
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
```

## Architecture Principles

1. **Real-time first**: Use Convex subscriptions for live updates
2. **Type safety**: Leverage TypeScript and Convex type generation
3. **Separation of concerns**: Business logic in Convex, UI in React
4. **Component composition**: Build features from shadcn/ui primitives
5. **Authenticated routes**: Use `ProtectedLayout` for protected pages

## Common Patterns

### Querying Data
```tsx
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

const data = useQuery(api.quiz.getQuizzes, {
  paginationOpts: { numItems: 10, cursor: null }
});
```

### Mutations
```tsx
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

const mutation = useMutation(api.quiz.createQuiz);
await mutation({ title: "My Quiz" });
```

### Protected Pages
```tsx
import ProtectedLayout from "@/layouts/ProtectedLayout";

export default function MyPage() {
  return (
    <ProtectedLayout>
      {/* Page content */}
    </ProtectedLayout>
  );
}
```

## See Also
- `convex/README.md` - Backend-specific documentation
- `src/components/README.md` - Component library overview
- `PROJECT_ARCHITECTURE.md` - Detailed architecture explanation
