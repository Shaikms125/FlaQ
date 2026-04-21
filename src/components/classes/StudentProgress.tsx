import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export function StudentProgress({ classId }: { classId: Id<"classes"> }) {
  const currentUser = useQuery(api.users.current);
  
  // @ts-ignore - Convex hasn't generated the type yet on user's machine locally
  const progress = useQuery(
    api.class_analytics.getStudentProgress,
    currentUser ? { classId, studentId: currentUser._id } : "skip"
  );

  if (!currentUser || progress === undefined) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Progress</CardTitle>
        <CardDescription>Your attempt history for this class</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Quiz</TableHead>
              <TableHead>Score</TableHead>
              <TableHead className="text-right">Date Taken</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {progress.attemptHistory.filter((a: any): a is NonNullable<typeof a> => !!a).map((attempt: any) => (
              <TableRow key={attempt._id}>
                <TableCell className="font-medium">{attempt.quizTitle}</TableCell>
                <TableCell>
                  <Badge variant={attempt.percentage >= 70 ? "default" : attempt.percentage >= 50 ? "secondary" : "destructive"}>
                    {Math.round(attempt.percentage)}%
                  </Badge>
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {new Date(attempt.startedAt).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
            {progress.attemptHistory.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">
                  You haven't taken any quizzes for this class yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
