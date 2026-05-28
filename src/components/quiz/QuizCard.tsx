import type { Id } from "../../../convex/_generated/dataModel";
import { useNavigate } from "react-router";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ShareQuiz } from "@/components/quiz/ShareQuiz";
import { DeleteQuizDialog } from "@/components/quiz/DeleteQuizDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  IconChartBar,
  IconClock,
  IconDotsVertical,
  IconPencil,
  IconShare,
  IconTrash,
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
    availableFrom?: number;
    availableTo?: number;
    createdAt: number;
  };
  questionCount: number;
  attemptCount: number;
}

export function QuizCard({ quiz, questionCount, attemptCount }: QuizCardProps) {
  const navigate = useNavigate();
  const [shareOpen, setShareOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const formattedDate = new Date(quiz.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const handleCardClick = () => {
    navigate(`/quiz/${quiz.accessCode}`);
  };

  const stopPropagation = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <Card
      className="cursor-pointer transition-colors hover:border-primary/50 hover:shadow-sm overflow-hidden pt-6 pb-0 gap-4"
      onClick={handleCardClick}
    >
      <CardHeader className="pb-0">
        <div className="flex justify-between items-start gap-2">
          <div className="flex min-w-0 flex-1 flex-col">
            <CardTitle className="line-clamp-1 text-sm">
              {quiz.title}
            </CardTitle>
            {quiz.description && (
              <CardDescription className="line-clamp-1 mt-0.5 text-xs">
                {quiz.description}
              </CardDescription>
            )}
          </div>

          <div className="shrink-0" onClick={stopPropagation}>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-transparent"
                    aria-label="More options"
                    onClick={stopPropagation}
                  >
                    <IconDotsVertical className="size-4" />
                  </Button>
                }
              />
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShareOpen(true)}>
                  <IconShare className="size-4" />
                  Share
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => setDeleteOpen(true)}
                >
                  <IconTrash className="size-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <ShareQuiz
              quizId={quiz._id}
              quizTitle={quiz.title}
              accessCode={quiz.accessCode}
              isPublic={quiz.isPublic}
              allowUnlimitedAttempts={quiz.allowUnlimitedAttempts}
              availableFrom={quiz.availableFrom}
              availableTo={quiz.availableTo}
              open={shareOpen}
              onOpenChange={setShareOpen}
              trigger={null}
            />

            <DeleteQuizDialog
              quizId={quiz._id}
              quizTitle={quiz.title}
              open={deleteOpen}
              onOpenChange={setDeleteOpen}
              trigger={null}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-muted-foreground">
          <span>
            {questionCount} question{questionCount !== 1 ? "s" : ""}
          </span>
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
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {formattedDate}
          </span>
          <Badge
            variant={quiz.isPublic ? "default" : "secondary"}
            className="shrink-0 h-5 text-xs px-2"
          >
            {quiz.isPublic ? "Public" : "Private"}
          </Badge>
          {!quiz.isPublished && (
            <Badge
              variant="outline"
              className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20 shrink-0 h-5 text-xs px-2"
            >
              Draft
            </Badge>
          )}
        </div>
      </CardContent>

      {/* ── Action buttons flush to card bottom ── */}
      <div
        className="-mx-6 mt-auto flex border-t border-border/50"
        onClick={stopPropagation}
      >
        <Button
          variant="ghost"
          className="flex-1 rounded-none rounded-bl-xl text-sm min-h-10 py-2.5"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/my-quizzes/${quiz._id}/edit`);
          }}
        >
          <IconPencil className="size-4" />
          Edit
        </Button>
        <div className="w-px bg-border/50" />
        <Button
          variant="ghost"
          className="flex-1 rounded-none rounded-br-xl text-sm min-h-10 py-2.5"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/my-quizzes/${quiz._id}/scores`);
          }}
        >
          <IconChartBar className="size-4" />
          Scores
        </Button>
      </div>
    </Card>
  );
}