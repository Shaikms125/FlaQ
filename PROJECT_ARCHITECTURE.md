# Quiz AI - Architecture Documentation

## System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Frontend (React/Vite)                       │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Pages (Home, GenerateQuiz, QuizEditor, etc.)            │   │
│  │ ├─ Components (UI, Quiz, Admin)                         │   │
│  │ ├─ Hooks (useQuizStore, useCurrentUser)                 │   │
│  │ └─ Layouts (ProtectedLayout, MainLayout)                │   │
│  └──────────────────────────────────────────────────────────┘   │
└────────────────┬────────────────────────────────────────────────┘
                 │ HTTP/WebSocket
┌────────────────▼────────────────────────────────────────────────┐
│                    Clerk Authentication                          │
│              (Token validation & user identity)                  │
└────────────────┬────────────────────────────────────────────────┘
                 │ API Calls
┌────────────────▼────────────────────────────────────────────────┐
│                  Convex Backend (Serverless)                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Queries (read-only, real-time subscriptions)            │   │
│  │ Mutations (write operations)                            │   │
│  │ Actions (external API calls, AI generation)             │   │
│  └──────────────────────────────────────────────────────────┘   │
└────────────────┬────────────────────────────────────────────────┘
                 │ Database Operations
┌────────────────▼────────────────────────────────────────────────┐
│          Convex Database (Document-based, Real-time)             │
│  ├─ users                                                        │
│  ├─ quizzes                                                      │
│  ├─ questions                                                    │
│  ├─ attempts                                                     │
│  └─ classes (planned)                                            │
└─────────────────────────────────────────────────────────────────┘
```

## Data Models

### Database Tables (convex/schema.ts)
- **users** - User profiles (clerkId, email, name, avatar)
- **classes** - Class/group containers with invite codes
- **class_members** - Join table linking users to classes with roles
- **quizzes** - Quiz metadata (title, description, settings, timestamps)
- **questions** - Quiz questions with multiple-choice options
- **quiz_attempts** - Student responses, scores, and recorded answers

## Data Flow Examples

### Example 1: Create Quiz
```
User Input (GenerateQuiz page)
    ↓
useMutation(api.quiz.createQuiz)
    ↓
Convex: createQuiz action
    ├─ Validate input
    ├─ Call AI API via OpenRouter (with fallback models)
    └─ Store quiz + questions in database
    ↓
useQuery updates automatically
    ↓
Component re-renders with new quiz
```

### Example 2: Take Quiz
```
Load Quiz (PublicQuizTaker page)
    ↓
useQuery(api.quiz.getQuizByAccessCode)
    ↓
User answers questions (client-side)
    ↓
useMutation(api.attempts.recordAttempt)
    ↓
Convex: Calculate score based on answers
    ↓
Store attempt in database
    ↓
Display results with feedback
```

### Example 3: View Results
```
Navigate to QuizScores page
    ↓
useQuery(api.quiz.getQuizAttempts)
    ↓
Fetch all attempts for current user's quizzes
    ↓
Display results grid with student answers
    ↓
Show average score and attempt breakdown
```

## Module Responsibilities

### Frontend (`src/`)

#### Pages Layer
- **Home.tsx**: Dashboard overview, recent quizzes
- **GenerateQuiz.tsx**: AI quiz generation interface
- **QuizEditor.tsx**: Manual quiz creation/editing
- **MyQuizzes.tsx**: User's quiz list
- **PublicQuizTaker.tsx**: Taking a quiz
- **QuizScores.tsx**: Results and analytics
- **SignIn.tsx / SignUp.tsx**: Authentication pages

#### Components Layer
- **quiz/**: Quiz-specific components (QuizCard, ChatInterface, etc.)
- **admin-panel/**: Admin dashboard components
- **ui/**: shadcn/ui wrapper components
- **AppSidebar.tsx**: Main navigation
- **AppTopbar.tsx**: Header with user info

#### Hooks Layer
- **useQuizStore.ts**: Quiz state management (Zustand)
- **useCurrentUser.ts**: Current user context
- **use-auto-resize-textarea.ts**: Textarea auto-sizing
- **use-mobile.ts**: Responsive breakpoint detection

#### Layouts Layer
- **MainLayout.tsx**: Default layout with sidebar/topbar
- **ProtectedLayout.tsx**: Authenticated user only
- **RootLayout.tsx**: Root wrapper with providers

### Backend (`convex/`)

#### Schema (`schema.ts`)
Defines all database tables:
- `users`: User profiles
- `quizzes`: Quiz metadata
- `questions`: Quiz questions
- `attempts`: Quiz attempt records
- `classes`: (Planned) Class management

#### Domain Modules
- **quiz.ts**: Quiz CRUD, retrieval, pagination
- **users.ts**: User queries, profile management
- **attempts.ts**: Attempt recording, scoring
- **classes.ts**: Class management (WIP)

#### HTTP & Auth
- **http.ts**: HTTP endpoints for webhooks/external APIs
- **auth.config.ts**: Clerk authentication setup

## Real-Time Features

### Subscriptions
- Quiz updates trigger re-renders automatically
- User data stays in sync across tabs
- Real-time collaboration ready

### Implementation Pattern
```tsx
// Automatically subscribes and re-fetches when data changes
const data = useQuery(api.quiz.getQuizzes, args);
```

## State Management Strategy

### Local Component State
- Form inputs, UI toggles, loading states
- Use React `useState`

### Quiz State (Global)
- Current quiz selection, answers
- Use `useQuizStore` (Zustand store in `hooks/useQuizStore.ts`)

### Server State (Real-time)
- Quizzes, attempts, user data
- Use Convex `useQuery` and `useMutation`

### Auth State
- Current user, token
- Use `useCurrentUser` hook

## Authentication Flow

1. **Clerk Redirect**: Unauthenticated users redirected to sign-in
2. **Token Generation**: Clerk provides JWT token
3. **Convex Validation**: Backend validates token via `auth.config.ts`
4. **Protected Queries**: Only authenticated users can access
5. **User Context**: `useCurrentUser` provides user data

## Error Handling

- **Validation**: Input validation in both frontend and backend
- **Type Safety**: TypeScript prevents runtime type errors
- **Convex Errors**: Automatically thrown and catchable
- **UI Feedback**: Components display user-friendly messages

## Performance Considerations

1. **Pagination**: Quizzes paginated (default 6-10 items)
2. **Lazy Loading**: Components load data on demand
3. **Real-time Debouncing**: Use Convex's built-in optimization
4. **Vite Bundling**: Fast build and code splitting

## Security

1. **Authentication**: Clerk handles user verification
2. **Authorization**: Convex validates user permissions
3. **Secrets**: Environment variables for API keys
4. **CORS**: Configured for Convex endpoints

## Future Scalability

- **Classes**: Multi-user quiz administration
- **Webhooks**: External integrations via `http.ts`
- **File Storage**: Quiz assets and certificates
- **Export**: Quiz analytics and reporting
