import { useParams, useNavigate } from "react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";
import { QuestionEditor } from "@/components/quiz/QuestionEditor";
import { QuizSettingsPanel } from "@/components/quiz/QuizSettingsPanel";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  IconArrowLeft,
  IconPlus,
} from "@tabler/icons-react";
import { useState, useEffect, useRef, useCallback } from "react";

export default function QuizEditor() {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();

  const quizData = useQuery(
    api.quiz.getQuizWithQuestions,
    quizId ? { quizId: quizId as Id<"quizzes"> } : "skip"
  );

  const updateQuiz = useMutation(api.quiz.updateQuiz);
  const addQuestion = useMutation(api.quiz.addQuestion);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [hasMetaChanges, setHasMetaChanges] = useState(false);

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const questionsEndRef = useRef<HTMLDivElement | null>(null);
  const prevQuestionCount = useRef<number>(0);

  // Sync state when quiz data loads
  useEffect(() => {
    if (quizData) {
      setTitle(quizData.title);
      setDescription(quizData.description ?? "");
    }
  }, [quizData]);

  // Scroll to bottom when a new question is added
  useEffect(() => {
    if (quizData && quizData.questions.length > prevQuestionCount.current) {
      // A question was added — scroll to it
      setTimeout(() => {
        questionsEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
    if (quizData) {
      prevQuestionCount.current = quizData.questions.length;
    }
  }, [quizData?.questions.length]);

  // Auto-save metadata with debounce
  const scheduleMetaSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    setHasMetaChanges(true);
    saveTimeoutRef.current = setTimeout(async () => {
      if (!quizId) return;
      try {
        await updateQuiz({
          quizId: quizId as Id<"quizzes">,
          title,
          description: description || undefined,
        });
        setHasMetaChanges(false);
      } catch (e) {
        toast.error("Failed to save quiz metadata: " + (e as Error).message);
      }
    }, 1500);
  }, [quizId, title, description, updateQuiz]);

  // Save on beforeunload
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (hasMetaChanges && quizId) {
        await updateQuiz({
          quizId: quizId as Id<"quizzes">,
          title,
          description: description || undefined,
        });
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasMetaChanges, quizId, title, description, updateQuiz]);

  // Cleanup timeout on unmount and trigger save
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      // Save on unmount if there are pending changes
      if (hasMetaChanges && quizId) {
        updateQuiz({
          quizId: quizId as Id<"quizzes">,
          title,
          description: description || undefined,
        });
      }
    };
  }, []);

  const handleTitleChange = (value: string) => {
    setTitle(value);
    scheduleMetaSave();
  };

  const handleDescriptionChange = (value: string) => {
    setDescription(value);
    scheduleMetaSave();
  };

  const handleAddQuestion = async () => {
    if (!quizId) return;
    try {
      await addQuestion({
        quizId: quizId as Id<"quizzes">,
        question: "New question",
        explanation: "",
        answer: 0,
        options: [
          { text: "Option A", isCorrect: true },
          { text: "Option B", isCorrect: false },
          { text: "Option C", isCorrect: false },
          { text: "Option D", isCorrect: false },
        ],
      });
    } catch (e) {
      toast.error("Failed to add question: " + (e as Error).message);
    }
  };

  if (!quizId) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <p className="text-muted-foreground">Quiz not found.</p>
      </div>
    );
  }

  if (quizData === undefined) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-24 w-full" />
        <div className="flex flex-col gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (quizData === null) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
        <p className="text-lg font-semibold">Quiz not found</p>
        <p className="text-sm text-muted-foreground">
          This quiz may have been deleted.
        </p>
        <Button variant="outline" onClick={() => navigate("/my-quizzes")}>
          <IconArrowLeft data-icon="inline-start" />
          Back to My Quizzes
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/my-quizzes")}
        >
          <IconArrowLeft />
        </Button>
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">Edit Quiz</h1>
          <p className="text-sm text-muted-foreground">
            Changes are automatically saved
            {hasMetaChanges && (
              <span className="ml-1 text-xs">(saving...)</span>
            )}
          </p>
        </div>
      </div>

      <Tabs defaultValue="questions" className="flex-1">
        <TabsList>
          <TabsTrigger value="questions">Questions</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="questions" className="mt-6">
          <div className="mx-auto flex max-w-3xl flex-col gap-6">
            {/* Quiz metadata */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="quiz-title">Title</Label>
                <Input
                  id="quiz-title"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Quiz title..."
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="quiz-description">Description (optional)</Label>
                <Textarea
                  id="quiz-description"
                  value={description}
                  onChange={(e) => handleDescriptionChange(e.target.value)}
                  placeholder="Describe your quiz..."
                  rows={2}
                  className="resize-none"
                />
              </div>
            </div>

            {/* Questions */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  Questions ({quizData.questions.length})
                </h2>
                <Button variant="outline" size="sm" onClick={handleAddQuestion}>
                  <IconPlus data-icon="inline-start" />
                  Add Question
                </Button>
              </div>

              {quizData.questions.map((q, i) => (
                <QuestionEditor
                  key={q._id}
                  questionData={q}
                  index={i}
                />
              ))}

              {quizData.questions.length === 0 && (
                <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed p-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    No questions yet. Add your first question to get started.
                  </p>
                  <Button variant="outline" onClick={handleAddQuestion}>
                    <IconPlus data-icon="inline-start" />
                    Add Question
                  </Button>
                </div>
              )}

              {/* Scroll anchor */}
              <div ref={questionsEndRef} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <div className="mx-auto max-w-2xl">
            <QuizSettingsPanel
              quizId={quizId as Id<"quizzes">}
              isPublic={quizData.isPublic}
              timeLimitSeconds={quizData.timeLimitSeconds}
              allowUnlimitedAttempts={quizData.allowUnlimitedAttempts}
              maxAttempts={quizData.maxAttempts}
              availableFrom={quizData.availableFrom}
              availableTo={quizData.availableTo}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
