import { useState, useEffect, useRef, useCallback } from "react";
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
import { IconTrash, IconCheck, IconPlus } from "@tabler/icons-react";

export interface ReusableQuestionData {
  _id?: string;
  question: string;
  explanation: string;
  answer: number; // 0-based index of the correct option
  options: { text: string; isCorrect: boolean }[];
  isNew?: boolean;
}

interface BaseQuestionEditorProps {
  questionData: ReusableQuestionData;
  index: number;
  onChange: (updated: ReusableQuestionData) => void;
  onDelete: () => void;
}

function BaseQuestionEditor({ questionData, index, onChange, onDelete }: BaseQuestionEditorProps) {
  const [question, setQuestion] = useState(questionData.question);
  const [explanation, setExplanation] = useState(questionData.explanation);
  const [answer, setAnswer] = useState(questionData.answer);
  const [options, setOptions] = useState(questionData.options);

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync when parent data changes completely (like switching tests)
  useEffect(() => {
    setQuestion(questionData.question);
    setExplanation(questionData.explanation);
    setAnswer(questionData.answer);
    setOptions(questionData.options);
  }, [questionData]);

  const scheduleChange = useCallback(
    (q: string, e: string, ans: number, opts: { text: string; isCorrect: boolean }[]) => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        onChange({
          ...questionData,
          question: q,
          explanation: e,
          answer: ans,
          options: opts,
        });
      }, 1000);
    },
    [onChange, questionData]
  );

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  const handleQuestionChange = (value: string) => {
    setQuestion(value);
    scheduleChange(value, explanation, answer, options);
  };

  const handleExplanationChange = (value: string) => {
    setExplanation(value);
    scheduleChange(question, value, answer, options);
  };

  const handleOptionChange = (optionIndex: number, value: string) => {
    const newOptions = options.map((opt, i) =>
      i === optionIndex ? { ...opt, text: value } : opt
    );
    setOptions(newOptions);
    scheduleChange(question, explanation, answer, newOptions);
  };

  const handleSetCorrect = (optionIndex: number) => {
    setAnswer(optionIndex);
    const newOptions = options.map((opt, i) => ({
      ...opt,
      isCorrect: i === optionIndex,
    }));
    setOptions(newOptions);
    // Setting correct answer usually triggers immediate feedback, so we might want to bypass debounce.
    // For simplicity, we just debounce it too.
    scheduleChange(question, explanation, optionIndex, newOptions);
  };


  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Question {index + 1}</CardTitle>
          <AlertDialog>
            <AlertDialogTrigger render={
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                <IconTrash />
              </Button>
            } />
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Question</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete Question {index + 1}? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>Question</Label>
            <Textarea
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
            <Label>Explanation</Label>
            <Textarea
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

interface ReusableQuestionsEditorProps {
  questions: ReusableQuestionData[];
  onChange: (questions: ReusableQuestionData[]) => void;
  onQuestionUpdate?: (index: number, updated: ReusableQuestionData) => void;
  onQuestionDelete?: (index: number) => void;
  onQuestionAdd?: () => void;
}

export function ReusableQuestionsEditor({
  questions,
  onChange,
  onQuestionUpdate,
  onQuestionDelete,
  onQuestionAdd,
}: ReusableQuestionsEditorProps) {
  const handleUpdate = (index: number, updated: ReusableQuestionData) => {
    if (onQuestionUpdate) {
      onQuestionUpdate(index, updated);
      return;
    }
    const newQuestions = [...questions];
    newQuestions[index] = updated;
    onChange(newQuestions);
  };

  const handleDelete = (index: number) => {
    if (onQuestionDelete) {
      onQuestionDelete(index);
      return;
    }
    const newQuestions = questions.filter((_, i) => i !== index);
    onChange(newQuestions);
  };

  const handleAdd = () => {
    if (onQuestionAdd) {
      onQuestionAdd();
      return;
    }
    const newQ: ReusableQuestionData = {
      question: "New question",
      explanation: "",
      answer: 0,
      options: [
        { text: "Option A", isCorrect: true },
        { text: "Option B", isCorrect: false },
        { text: "Option C", isCorrect: false },
        { text: "Option D", isCorrect: false },
      ],
      isNew: true,
    };
    onChange([...questions, newQ]);
  };

  return (
    <div className="flex flex-col gap-4">
      {questions.map((q, i) => (
        <BaseQuestionEditor
          key={q._id || i}
          questionData={q}
          index={i}
          onChange={(updated) => handleUpdate(i, updated)}
          onDelete={() => handleDelete(i)}
        />
      ))}

      <Button variant="outline" size="lg" className="mt-4 w-full border-dashed" onClick={handleAdd}>
        <IconPlus data-icon="inline-start" />
        Add Question
      </Button>
    </div>
  );
}
