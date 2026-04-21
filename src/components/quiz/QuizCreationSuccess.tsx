import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { ShareQuiz } from "@/components/quiz/ShareQuiz";
import { IconCheck, IconPlayerPlay, IconPencil, IconWand, IconShare } from "@tabler/icons-react";
import type { Id } from "../../../convex/_generated/dataModel";

interface QuizCreationSuccessProps {
  quizId: Id<"quizzes">;
  accessCode: string;
  quizTitle: string;
  isPublic: boolean;
  allowUnlimitedAttempts: boolean;
  onReset: () => void;
}

export function QuizCreationSuccess({
  quizId,
  accessCode,
  quizTitle,
  isPublic,
  allowUnlimitedAttempts,
  onReset,
}: QuizCreationSuccessProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center gap-4 py-2">
      <div className="flex size-12 items-center justify-center rounded-full bg-chart-2/20 text-chart-2 animate-in zoom-in-95 duration-300">
        <IconCheck className="size-6" />
      </div>
      <div className="text-center">
        <p className="font-semibold text-base">Quiz Created Successfully!</p>
        <p className="text-xs text-muted-foreground mt-0.5">{quizTitle}</p>
      </div>
      <div className="flex flex-col w-full gap-2">
        <ShareQuiz
          quizId={quizId}
          quizTitle={quizTitle}
          accessCode={accessCode}
          isPublic={isPublic}
          allowUnlimitedAttempts={allowUnlimitedAttempts}
          trigger={
            <Button variant="default" size="sm" className="w-full">
              <IconShare data-icon="inline-start" />
              Share & Settings
            </Button>
          }
        />
        <Button
          variant="secondary"
          size="sm"
          className="w-full"
          onClick={() => navigate(`/quiz/${accessCode}`)}
        >
          <IconPlayerPlay data-icon="inline-start" />
          Take Quiz Now
        </Button>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/my-quizzes/${quizId}/edit`)}
          >
            <IconPencil data-icon="inline-start" />
            Edit
          </Button>
          <Button variant="outline" size="sm" onClick={onReset}>
            <IconWand data-icon="inline-start" />
            New Quiz
          </Button>
        </div>
      </div>
    </div>
  );
}
