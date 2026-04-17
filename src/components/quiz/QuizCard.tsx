import type { Id } from "../../../convex/_generated/dataModel";
import { useNavigate } from "react-router";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ShareDialog } from "@/components/quiz/ShareDialog";
import { DeleteQuizDialog } from "@/components/quiz/DeleteQuizDialog";
import {
  IconPencil,
  IconChartBar,
  IconClock,
  IconUsers,
} from "@tabler/icons-react";

interface QuizCardProps {
  quiz: {
    _id: Id<"quizzes">;
    title: string;
    description?: string;
    isPublic: boolean;
    isPublished: boolean;
    accessCode: string;
    timeLimitSeconds?: number;
    allowUnlimitedAttempts: boolean;
    maxAttempts?: number;
    createdAt: number;
  };
  questionCount: number;
  attemptCount: number;
}

export function QuizCard({ quiz, questionCount, attemptCount }: QuizCardProps) {
  const navigate = useNavigate();

  const formattedDate = new Date(quiz.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex-1">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="line-clamp-2 text-base">{quiz.title}</CardTitle>
          <Badge variant={quiz.isPublic ? "default" : "secondary"} className="shrink-0">
            {quiz.isPublic ? "Public" : "Private"}
          </Badge>
        </div>
        {quiz.description && (
          <CardDescription className="line-clamp-2">
            {quiz.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span>{questionCount} question{questionCount !== 1 ? "s" : ""}</span>
          <Separator orientation="vertical" className="h-4" />
          <span className="flex items-center gap-1">
            <IconUsers className="size-4" />
            {attemptCount} attempt{attemptCount !== 1 ? "s" : ""}
          </span>
          {quiz.timeLimitSeconds && (
            <>
              <Separator orientation="vertical" className="h-4" />
              <span className="flex items-center gap-1">
                <IconClock className="size-4" />
                {Math.floor(quiz.timeLimitSeconds / 60)} min
              </span>
            </>
          )}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{formattedDate}</p>
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2 border-t pt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/my-quizzes/${quiz._id}/edit`)}
        >
          <IconPencil data-icon="inline-start" />
          Edit
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/my-quizzes/${quiz._id}/scores`)}
        >
          <IconChartBar data-icon="inline-start" />
          Scores
        </Button>
        <ShareDialog
          quizId={quiz._id}
          accessCode={quiz.accessCode}
          isPublic={quiz.isPublic}
        />
        <DeleteQuizDialog quizId={quiz._id} quizTitle={quiz.title} />
      </CardFooter>
    </Card>
  );
}
