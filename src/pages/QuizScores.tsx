import { useParams, useNavigate } from "react-router";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { IconArrowLeft, IconUsers } from "@tabler/icons-react";

export default function QuizScores() {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();

  const quizData = useQuery(
    api.quiz.getQuizWithQuestions,
    quizId ? { quizId: quizId as Id<"quizzes"> } : "skip"
  );

  const attempts = useQuery(
    api.quiz.getQuizAttemptsWithUsers,
    quizId ? { quizId: quizId as Id<"quizzes"> } : "skip"
  );

  if (!quizId) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <p className="text-muted-foreground">Quiz not found.</p>
      </div>
    );
  }

  const isLoading = quizData === undefined || attempts === undefined;

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (quizData === null) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
        <p className="text-lg font-semibold">Quiz not found</p>
      </div>
    );
  }

  const totalQuestions = quizData.questions.length;

  const getScoreBadgeVariant = (percentage: number) => {
    if (percentage >= 80) return "default";
    if (percentage >= 50) return "secondary";
    return "destructive";
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">Quiz Scores</h1>
          <p className="text-sm text-muted-foreground">{quizData.title}</p>
        </div>
      </div>

      {/* Stats summary */}
      <div className="flex flex-wrap gap-4">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total Attempts</p>
          <p className="text-2xl font-bold">{attempts.length}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Average Score</p>
          <p className="text-2xl font-bold">
            {attempts.length > 0
              ? Math.round(
                  attempts.reduce((sum, a) => sum + a.percentage, 0) /
                    attempts.length
                )
              : 0}
            %
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Questions</p>
          <p className="text-2xl font-bold">{totalQuestions}</p>
        </div>
      </div>

      {/* Scores table */}
      {attempts.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-12">
          <div className="flex size-16 items-center justify-center rounded-full bg-muted">
            <IconUsers className="size-8 text-muted-foreground" />
          </div>
          <div className="text-center">
            <h2 className="text-lg font-semibold">No submissions yet</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Share your quiz to start receiving submissions.
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-center">Score</TableHead>
                <TableHead className="text-center">Percentage</TableHead>
                <TableHead>Submitted</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attempts.map((attempt) => (
                <TableRow key={attempt._id}>
                  <TableCell className="font-medium">
                    {attempt.studentName}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {attempt.studentEmail}
                  </TableCell>
                  <TableCell className="text-center">
                    {attempt.score}/{totalQuestions}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={getScoreBadgeVariant(attempt.percentage)}>
                      {attempt.percentage}%
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {attempt.submittedAt
                      ? new Date(attempt.submittedAt).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )
                      : "In progress"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
