import { useState } from "react";
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
  /** Custom trigger. Defaults to a gear-icon button. Pass null to control via open/onOpenChange. */
  trigger?: React.ReactElement | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
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
  open: controlledOpen,
  onOpenChange,
}: QuizSettingsDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = (v: boolean) => {
    onOpenChange?.(v);
    setInternalOpen(v);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger !== null && (
        <DialogTrigger
          render={
            trigger ?? (
              <Button variant="outline" size="icon" aria-label="Quiz settings">
                <IconSettings />
              </Button>
            )
          }
        />
      )}
      <DialogContent className="sm:max-w-lg max-h-[85dvh] overflow-y-auto">
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
