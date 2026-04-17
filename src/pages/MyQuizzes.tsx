import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { QuizCard } from "@/components/quiz/QuizCard";
import { Skeleton } from "@/components/ui/skeleton";
import { IconNotebook, IconWand } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router";

export default function MyQuizzes() {
  const quizzesResult = useQuery(api.quiz.getQuizzes, {
    paginationOpts: { numItems: 50, cursor: null },
  });

  const navigate = useNavigate();
  const isLoading = quizzesResult === undefined;
  const quizzes = quizzesResult?.page ?? [];

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">My Quizzes</h1>
          <p className="text-sm text-muted-foreground">
            Manage your generated quizzes — edit, share, and track scores.
          </p>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-3 rounded-lg border p-6">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-full" />
              <div className="flex gap-2 pt-2">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-16" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && quizzes.length === 0 && (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-12">
          <div className="flex size-16 items-center justify-center rounded-full bg-muted">
            <IconNotebook className="size-8 text-muted-foreground" />
          </div>
          <div className="text-center">
            <h2 className="text-lg font-semibold">No quizzes yet</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Generate your first quiz using the sidebar button to get started.
            </p>
          </div>
          <Button onClick={() => navigate("/")} className="mt-2">
            <IconWand data-icon="inline-start" />
            Generate Your First Quiz
          </Button>
        </div>
      )}

      {/* Quiz grid */}
      {!isLoading && quizzes.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quizzes.map((quiz) => (
            <QuizCard
              key={quiz._id}
              quiz={quiz}
              questionCount={quiz.questionCount ?? 0}
              attemptCount={quiz.attemptCount ?? 0}
            />
          ))}
        </div>
      )}
    </div>
  );
}
