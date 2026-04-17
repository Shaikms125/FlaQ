import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { IconTrash, IconCheck } from "@tabler/icons-react";
import { useState, useEffect, useRef, useCallback } from "react";

interface QuestionData {
  _id: Id<"questions">;
  question: string;
  explanation: string;
  answer: number;          // 0-based index of the correct option
  orderIndex: number;
  options: { text: string; isCorrect: boolean }[];
}

interface QuestionEditorProps {
  questionData: QuestionData;
  index: number;
}

export function QuestionEditor({ questionData, index }: QuestionEditorProps) {
  const [question, setQuestion] = useState(questionData.question);
  const [explanation, setExplanation] = useState(questionData.explanation);
  const [answer, setAnswer] = useState(questionData.answer);
  const [options, setOptions] = useState(questionData.options);
  const [hasChanges, setHasChanges] = useState(false);

  const updateQuestion = useMutation(api.quiz.updateQuestion);
  const deleteQuestion = useMutation(api.quiz.deleteQuestion);

  // Track if we have unsaved changes
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-save with debounce
  const scheduleAutoSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    setHasChanges(true);
    saveTimeoutRef.current = setTimeout(() => {
      performSave();
    }, 1500);
  }, []);

  const performSave = async () => {
    try {
      await updateQuestion({
        questionId: questionData._id,
        question,
        explanation,
        answer,
        options: options.map((opt, i) => ({
          text: opt.text,
          isCorrect: i === answer,
        })),
      });
      setHasChanges(false);
    } catch (e) {
      toast.error("Failed to save question: " + (e as Error).message);
    }
  };

  // Save on unmount if there are pending changes
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Auto-save via beforeunload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (hasChanges) {
        performSave();
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasChanges, question, explanation, answer, options]);

  const handleQuestionChange = (value: string) => {
    setQuestion(value);
    scheduleAutoSave();
  };

  const handleExplanationChange = (value: string) => {
    setExplanation(value);
    scheduleAutoSave();
  };

  const handleOptionChange = (optionIndex: number, value: string) => {
    setOptions((prev) =>
      prev.map((opt, i) =>
        i === optionIndex ? { ...opt, text: value } : opt
      )
    );
    scheduleAutoSave();
  };

  const handleSetCorrect = (optionIndex: number) => {
    setAnswer(optionIndex);
    setOptions((prev) =>
      prev.map((opt, i) => ({ ...opt, isCorrect: i === optionIndex }))
    );
    scheduleAutoSave();
  };

  const handleDelete = async () => {
    try {
      await deleteQuestion({ questionId: questionData._id });
      toast.success("Question deleted.");
    } catch (e) {
      toast.error("Failed to delete question: " + (e as Error).message);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            Question {index + 1}
            {hasChanges && (
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                (unsaved)
              </span>
            )}
          </CardTitle>
          <AlertDialog>
            <AlertDialogTrigger
              render={
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                  <IconTrash />
                </Button>
              }
            />
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Question</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete Question {index + 1}? This
                  action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor={`question-${questionData._id}`}>Question</Label>
            <Textarea
              id={`question-${questionData._id}`}
              value={question}
              onChange={(e) => handleQuestionChange(e.target.value)}
              rows={2}
              className="resize-none"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Options (click to mark correct)</Label>
            {options.map((opt, oIndex) => (
              <div key={oIndex} className="flex items-center gap-2">
                <Button
                  variant={oIndex === answer ? "default" : "outline"}
                  size="icon"
                  className="size-8 shrink-0"
                  onClick={() => handleSetCorrect(oIndex)}
                  title={oIndex === answer ? "Correct answer" : "Set as correct answer"}
                >
                  {oIndex === answer ? (
                    <IconCheck />
                  ) : (
                    <span className="text-xs font-semibold">
                      {String.fromCharCode(65 + oIndex)}
                    </span>
                  )}
                </Button>
                <Input
                  value={opt.text}
                  onChange={(e) => handleOptionChange(oIndex, e.target.value)}
                  className="flex-1"
                />
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor={`explanation-${questionData._id}`}>Explanation</Label>
            <Textarea
              id={`explanation-${questionData._id}`}
              value={explanation}
              onChange={(e) => handleExplanationChange(e.target.value)}
              rows={2}
              className="resize-none"
              placeholder="Explain why the correct answer is right..."
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
