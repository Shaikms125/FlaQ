import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function TeacherAnalytics({ classId }: { classId: Id<"classes"> }) {
  // @ts-ignore - Convex hasn't generated the type yet on user's machine locally
  const analytics = useQuery(api.class_analytics.getClassAnalytics, { classId });

  if (analytics === undefined) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <div className="grid gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Class-wide Average</CardDescription>
            <CardTitle className="text-4xl text-primary">
              {Math.round(analytics.classAverage)}%
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Published Quizzes</CardDescription>
            <CardTitle className="text-4xl">{analytics.totalQuizzes}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quiz Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quiz Topic</TableHead>
                <TableHead className="text-right">Completions</TableHead>
                <TableHead className="text-right">Avg. Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analytics.quizAnalytics.filter((qa: any): qa is NonNullable<typeof qa> => !!qa).map((qa: any) => (
                <TableRow key={qa.quizId}>
                  <TableCell className="font-medium">{qa.title}</TableCell>
                  <TableCell className="text-right">{qa.completions}</TableCell>
                  <TableCell className="text-right">
                    <span className={qa.averagePercentage >= 70 ? "text-green-600" : qa.averagePercentage >= 50 ? "text-amber-600" : "text-destructive"}>
                      {Math.round(qa.averagePercentage)}%
                    </span>
                  </TableCell>
                </TableRow>
              ))}
              {analytics.quizAnalytics.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">
                    No quizzes found or no attempts yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
