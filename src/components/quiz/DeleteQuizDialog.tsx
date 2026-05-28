import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { IconTrash } from "@tabler/icons-react";
import { useState } from "react";

interface DeleteQuizDialogProps {
  quizId: Id<"quizzes">;
  quizTitle: string;
  trigger?: React.ReactElement | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function DeleteQuizDialog({ quizId, quizTitle, trigger, open: controlledOpen, onOpenChange }: DeleteQuizDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = (v: boolean) => {
    onOpenChange?.(v);
    setInternalOpen(v);
  };

  const [deleting, setDeleting] = useState(false);
  const deleteQuiz = useMutation(api.quiz.deleteQuiz);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteQuiz({ quizId });
      setOpen(false);
    } catch (e) {
      console.error("Failed to delete quiz:", e);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      {trigger !== null && (
        <AlertDialogTrigger
          render={
            trigger ?? (
              <Button variant="destructive" size="sm">
                <IconTrash data-icon="inline-start" />
                Delete
              </Button>
            )
          }
        />
      )}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Quiz</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>&ldquo;{quizTitle}&rdquo;</strong>?
            This will permanently remove the quiz, all its questions, and all
            submitted attempts. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={deleting}>
            {deleting ? "Deleting..." : "Delete Quiz"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
