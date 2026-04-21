# Components Directory

## Overview
Reusable React components organized by feature domain.

## Structure

### `ui/` - Shadcn/UI Components
Pre-built, accessible UI primitives. **Do not modify directly** (use shadcn CLI to update).
- `button.tsx` - Action button
- `card.tsx` - Card container
- `dialog.tsx` - Modal dialog
- `input.tsx` - Text input field
- `select.tsx` - Dropdown select
- `table.tsx` - Data table
- `avatar.tsx` - User avatar
- `badge.tsx` - Status badge
- `tabs.tsx` - Tab navigation
- `skeleton.tsx` - Loading placeholder
- And more...

### `quiz/` - Quiz Feature Components
Components specific to quiz functionality:
- `QuizCard.tsx` - Quiz summary card (title, stats, actions)
- `ChatInterface.tsx` - AI chat for quiz generation
- `ChatMessage.tsx` - Individual chat message
- `QuizSettingsDialog.tsx` - Quiz configuration modal
- `QuizSettingsPanel.tsx` - Quiz settings editor
- `QuizTimer.tsx` - Countdown timer for timed quizzes
- `ReusableQuestionsEditor.tsx` - Multi-question editor
- `DeleteQuizDialog.tsx` - Confirmation dialog
- `ShareQuiz.tsx` - Quiz sharing interface
- `QuizCreationSuccess.tsx` - Success feedback

**Usage:**
```tsx
import { QuizCard } from "@/components/quiz/QuizCard";

<QuizCard 
  quiz={quizData} 
  questionCount={5} 
  attemptCount={3} 
/>
```

### `admin-panel/` - Admin Features
Admin-only components for dashboard and management.
- Add new components as admin features develop

### Layout Components
Located in root:
- `AppSidebar.tsx` - Left navigation sidebar
- `AppTopbar.tsx` - Header with user menu
- `ThemeProvider.tsx` - Dark/light mode provider
- `ThemeSwitcher.tsx` - Theme toggle button

## Component Patterns

### Controlled Components
Always accept `value` and `onChange` props:
```tsx
interface InputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function MyInput({ value, onChange, placeholder }: InputProps) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  );
}
```

### With Convex Integration
```tsx
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function QuizList() {
  const quizzes = useQuery(api.quiz.getQuizzes);
  
  if (quizzes === undefined) {
    return <Skeleton />;
  }
  
  return (
    <div>
      {quizzes.map((quiz) => (
        <QuizCard key={quiz._id} quiz={quiz} />
      ))}
    </div>
  );
}
```

### With State Management
```tsx
import { useQuizStore } from "@/hooks/useQuizStore";

export function QuizSelector() {
  const { selectedQuiz, setSelectedQuiz } = useQuizStore();
  
  return (
    <select value={selectedQuiz?._id} onChange={...}>
      {/* options */}
    </select>
  );
}
```

## Styling

- **Tailwind CSS**: Use utility classes
- **CSS-in-JS**: Via Tailwind's `@apply` directive when needed
- **shadcn/ui**: Extends Tailwind with component classes
- **Theme**: Supports light/dark via `next-themes`

## Adding New Components

1. Create file in appropriate subdirectory
2. Name with PascalCase (e.g., `MyComponent.tsx`)
3. Export named export: `export function MyComponent() { ... }`
4. Add TypeScript interfaces for props
5. Document props in JSDoc comments

Example:
```tsx
// src/components/quiz/MyFeature.tsx
import { FC } from "react";

interface MyFeatureProps {
  title: string;
  onAction: () => void;
}

/**
 * Brief description of what this component does.
 * @param props - Component props
 */
export const MyFeature: FC<MyFeatureProps> = ({ title, onAction }) => {
  return (
    <div className="...">
      {title}
      <button onClick={onAction}>Action</button>
    </div>
  );
};
```

## Import Paths

Always use path aliases:
```tsx
// ✅ Good
import { Button } from "@/components/ui/button";
import { QuizCard } from "@/components/quiz/QuizCard";

// ❌ Avoid
import { Button } from "../../../components/ui/button";
```

## Testing Components

Components should be:
- Pure (same props → same output)
- Stateless when possible (lift state to parent)
- Testable with React Testing Library

## Common Gotchas

- **Lazy Loading**: Convex queries can be `undefined` during load
- **Re-renders**: Avoid inline object literals in props
- **Event Handlers**: Always use `useCallback` for stable references
- **Dependencies**: Keep dependency arrays in `useEffect` precise
