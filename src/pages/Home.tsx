import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { QuizCard } from "@/components/quiz/QuizCard";
import { Skeleton } from "@/components/ui/skeleton";
import { IconNotebook, IconWand, IconUsersGroup } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router";

export default function Home() {
  const navigate = useNavigate();
  const quizzesResult = useQuery(api.quiz.getQuizzes, {
    paginationOpts: { numItems: 6, cursor: null }, // Limit to 6 for the overview
  });
  const classes = useQuery(api.classes.getMyClasses);

  const isLoading = quizzesResult === undefined || classes === undefined;
  const quizzes = quizzesResult?.page ?? [];

  return (
    <div className="flex flex-1 flex-col gap-8 p-6 lg:p-10 max-w-7xl mx-auto w-full">
      {/* Header Section */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's a quick overview of your classes and recent quizzes.
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div 
          className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 flex flex-col gap-4 hover:border-primary/30 transition-colors cursor-pointer"
          onClick={() => navigate("/my-quizzes")}
        >
          <div className="flex items-center gap-3">
             <div className="p-2 bg-primary/10 rounded-lg">
               <IconNotebook className="size-6 text-primary" />
             </div>
             <h3 className="font-semibold text-lg">Your Quizzes</h3>
          </div>
          <div>
            <p className="text-3xl font-bold">{isLoading ? "-" : quizzes.length}</p>
            <p className="text-sm text-muted-foreground mt-1">Generated or created quizzes</p>
          </div>
        </div>

        <div 
          className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 flex flex-col gap-4 hover:border-primary/30 transition-colors cursor-pointer"
          onClick={() => navigate("/classes")}
        >
          <div className="flex items-center gap-3">
             <div className="p-2 bg-primary/10 rounded-lg">
               <IconUsersGroup className="size-6 text-primary" />
             </div>
             <h3 className="font-semibold text-lg">Your Classes</h3>
          </div>
          <div>
            <p className="text-3xl font-bold">{isLoading ? "-" : classes.length}</p>
            <p className="text-sm text-muted-foreground mt-1">Active class enrollments</p>
          </div>
        </div>
      </div>

      <div className="w-full h-px bg-border my-2" />

      {/* Recent Quizzes Section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight">Recent Quizzes</h2>
          {quizzes.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => navigate("/my-quizzes")}>
              View all
            </Button>
          )}
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-3 rounded-xl border p-6">
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
          <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-xl border border-dashed p-12 bg-muted/10">
            <div className="flex size-16 items-center justify-center rounded-full bg-muted">
              <IconNotebook className="size-8 text-muted-foreground" />
            </div>
            <div className="text-center">
              <h2 className="text-lg font-semibold">No quizzes yet</h2>
              <p className="mt-1 text-sm text-muted-foreground max-w-sm">
                Get started by generating your first quiz using AI, or create one manually.
              </p>
            </div>
            <Button onClick={() => navigate("/generate")} className="mt-4">
              <IconWand className="mr-2 size-4" />
              Generate Quiz
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
    </div>
  );
}
