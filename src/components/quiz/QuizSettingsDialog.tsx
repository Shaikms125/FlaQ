import type { Id } from "../../../convex/_generated/dataModel";
import { QuizSettingsPanel } from "@/components/quiz/QuizSettingsPanel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { IconSettings } from "@tabler/icons-react";

interface QuizSettingsDialogProps {
  quizId: string;
  isPublic: boolean;
  timeLimitSeconds?: number;
  allowUnlimitedAttempts: boolean;
  maxAttempts?: number;
  availableFrom?: number;
  availableTo?: number;
  /** Custom trigger. Defaults to a gear-icon button. */
  trigger?: React.ReactElement;
}

export function QuizSettingsDialog({
  quizId,
  isPublic,
  timeLimitSeconds,
  allowUnlimitedAttempts,
  maxAttempts,
  availableFrom,
  availableTo,
  trigger,
}: QuizSettingsDialogProps) {
  return (
    <Dialog>
      <DialogTrigger
        render={
          trigger ?? (
            <Button variant="outline" size="icon">
              <IconSettings className="size-4" />
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Quiz Settings</DialogTitle>
          <DialogDescription>
            Configure visibility, time limits, and attempt rules.
          </DialogDescription>
        </DialogHeader>
        <QuizSettingsPanel
          quizId={quizId as Id<"quizzes">}
          isPublic={isPublic}
          timeLimitSeconds={timeLimitSeconds}
          allowUnlimitedAttempts={allowUnlimitedAttempts}
          maxAttempts={maxAttempts}
          availableFrom={availableFrom}
          availableTo={availableTo}
        />
      </DialogContent>
    </Dialog>
  );
}
