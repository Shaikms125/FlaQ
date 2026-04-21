import { useParams, useNavigate } from "react-router";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";
import { ReusableQuestionsEditor, type ReusableQuestionData } from "@/components/quiz/ReusableQuestionsEditor";
import { QuizSettingsDialog } from "@/components/quiz/QuizSettingsDialog";
import { ShareQuiz } from "@/components/quiz/ShareQuiz";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  //IconArrowLeft,
  IconSettings,
  IconTrash,
  IconRefresh,
  IconShare,
  IconDeviceFloppy,
  IconPlayerPlay,
  IconLoader2,
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
  const updateQuestion = useMutation(api.quiz.updateQuestion);
  const deleteQuestion = useMutation(api.quiz.deleteQuestion);
  const deleteQuizMut = useMutation(api.quiz.deleteQuiz);
  const generateQuiz = useAction(api.quiz.generateQuiz);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [hasMetaChanges, setHasMetaChanges] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (quizData) {
      setTitle(quizData.title);
      setDescription(quizData.description ?? "");
    }
  }, [quizData]);

  const scheduleMetaSave = useCallback(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    setHasMetaChanges(true);
    saveTimeoutRef.current = setTimeout(async () => {
      if (!quizId) return;
      try {
        await updateQuiz({ quizId: quizId as Id<"quizzes">, title, description: description || undefined });
        setHasMetaChanges(false);
      } catch (e) { toast.error("Failed to save: " + (e as Error).message); }
    }, 1500);
  }, [quizId, title, description, updateQuiz]);

  useEffect(() => {
    const h = () => { if (hasMetaChanges && quizId) updateQuiz({ quizId: quizId as Id<"quizzes">, title, description: description || undefined }); };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [hasMetaChanges, quizId, title, description, updateQuiz]);

  useEffect(() => () => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    if (hasMetaChanges && quizId) updateQuiz({ quizId: quizId as Id<"quizzes">, title, description: description || undefined });
  }, []);

  const handleSave = async () => {
    if (!quizId || !quizData) return;
    setSaving(true);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    try {
      const updates: any = { 
        quizId: quizId as Id<"quizzes">, 
        title, 
        description: description || undefined 
      };

      // Auto-publish if it belongs to a class and is still a draft
      if (quizData.classId && !quizData.isPublished) {
        updates.isPublished = true;
      }

      await updateQuiz(updates);
      setHasMetaChanges(false);
      toast.success(updates.isPublished ? "Quiz published to class!" : "Quiz saved!");
    } catch (e) { toast.error("Failed to save: " + (e as Error).message); }
    finally { setSaving(false); }
  };

  const handleDiscard = async () => {
    if (!quizId || !window.confirm("Discard this quiz permanently?")) return;
    try { await deleteQuizMut({ quizId: quizId as Id<"quizzes"> }); toast.success("Quiz discarded."); navigate("/my-quizzes"); }
    catch (e) { toast.error("Failed: " + (e as Error).message); }
  };

  const handleRegenerate = async () => {
    if (!quizData || !quizId || !window.confirm("Replace all questions with new AI-generated ones?")) return;
    setRegenerating(true);
    try {
      const result = await generateQuiz({ prompt: quizData.prompt || title, numQuestions: quizData.questions.length || 5 });
      for (const q of quizData.questions) await deleteQuestion({ questionId: q._id });
      for (const q of result.questions) {
        await addQuestion({
          quizId: quizId as Id<"quizzes">, question: q.question, explanation: q.explanation ?? "", answer: q.answerIndex,
          options: q.options.map((text: string, idx: number) => ({ text, isCorrect: idx === q.answerIndex })),
        });
      }
      if (result.title !== title) { setTitle(result.title); await updateQuiz({ quizId: quizId as Id<"quizzes">, title: result.title }); }
      toast.success("Quiz regenerated!");
    } catch (e) { toast.error("Failed: " + (e as Error).message); }
    finally { setRegenerating(false); }
  };

  const handleQuestionUpdate = async (_i: number, q: ReusableQuestionData) => {
    if (!q._id) return;
    try { await updateQuestion({ questionId: q._id as Id<"questions">, question: q.question, explanation: q.explanation, answer: q.answer, options: q.options }); }
    catch (e) { toast.error("Failed to save question: " + (e as Error).message); }
  };

  const handleQuestionDelete = async (index: number) => {
    const q = quizData?.questions[index];
    if (!q) return;
    try { await deleteQuestion({ questionId: q._id }); toast.success("Deleted."); }
    catch (e) { toast.error("Failed: " + (e as Error).message); }
  };

  const handleQuestionAdd = async () => {
    if (!quizId) return;
    try { await addQuestion({ quizId: quizId as Id<"quizzes">, question: "New question", explanation: "", answer: 0, options: [{ text: "Option A", isCorrect: true }, { text: "Option B", isCorrect: false }, { text: "Option C", isCorrect: false }, { text: "Option D", isCorrect: false }] }); }
    catch (e) { toast.error("Failed: " + (e as Error).message); }
  };

  // ─── Guards ────────────────────────────────────────────────────
  if (!quizId) return <div className="flex flex-1 items-center justify-center p-6"><p className="text-muted-foreground">Quiz not found.</p></div>;

  if (quizData === undefined) return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      <Skeleton className="h-8 w-48" /><Skeleton className="h-10 w-full" /><Skeleton className="h-24 w-full" />
      {[1, 2, 3].map((i) => <Skeleton key={i} className="h-48 w-full" />)}
    </div>
  );

  if (quizData === null) return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
      <p className="text-lg font-semibold">Quiz not found</p>
      <p className="text-sm text-muted-foreground">This quiz may have been deleted.</p>
    </div>
  );

  // Shared props to avoid repeating them
  const shareProps = { quizId: quizId as Id<"quizzes">, quizTitle: quizData.title, accessCode: quizData.accessCode, isPublic: quizData.isPublic, allowUnlimitedAttempts: quizData.allowUnlimitedAttempts, availableFrom: quizData.availableFrom, availableTo: quizData.availableTo };
  const settingsProps = { quizId, isPublic: quizData.isPublic, timeLimitSeconds: quizData.timeLimitSeconds, allowUnlimitedAttempts: quizData.allowUnlimitedAttempts, maxAttempts: quizData.maxAttempts, availableFrom: quizData.availableFrom, availableTo: quizData.availableTo };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 sm:gap-6 sm:p-6">
      {/* Header row */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <h1 className="text-lg sm:text-xl font-bold tracking-tight truncate">Edit Quiz</h1>
          {!quizData.isPublished && (
            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Draft</Badge>
          )}
        </div>

        {/* Desktop toolbar */}
        <div className="hidden md:flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRegenerate} disabled={regenerating}>
            {regenerating ? <IconLoader2 className="size-4 mr-1.5 animate-spin" /> : <IconRefresh className="size-4 mr-1.5" />}
            {regenerating ? "Regenerating..." : "Regenerate"}
          </Button>
          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleDiscard}>
            <IconTrash className="size-4 mr-1.5" />Discard
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <ShareQuiz {...shareProps} trigger={<Button variant="outline" size="sm"><IconShare className="size-4 mr-1.5" />Share</Button>} />
          <Button variant="outline" size="sm" onClick={handleSave} disabled={saving}>
            {saving ? <IconLoader2 className="size-4 mr-1.5 animate-spin" /> : <IconDeviceFloppy className="size-4 mr-1.5" />}Save
          </Button>
          <QuizSettingsDialog {...settingsProps} />
        </div>
      </div>

      {/* Mobile toolbar */}
      <div className="flex flex-col gap-2 md:hidden">
        <Button variant="outline" className="w-full" onClick={handleRegenerate} disabled={regenerating}>
          {regenerating ? <IconLoader2 className="size-4 mr-1.5 animate-spin" /> : <IconRefresh className="size-4 mr-1.5" />}
          {regenerating ? "Regenerating..." : "Regenerate Quiz"}
        </Button>
        <div className="grid grid-cols-3 gap-2">
          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleDiscard}>
            <IconTrash className="size-4 mr-1" />Discard
          </Button>
          <ShareQuiz {...shareProps} trigger={<Button variant="outline" size="sm" className="w-full"><IconShare className="size-4 mr-1" />Share</Button>} />
          <Button variant="outline" size="sm" onClick={handleSave} disabled={saving}>
            {saving ? <IconLoader2 className="size-4 mr-1 animate-spin" /> : <IconDeviceFloppy className="size-4 mr-1" />}Save
          </Button>
        </div>
        <QuizSettingsDialog {...settingsProps} trigger={<Button variant="outline" size="sm" className="w-full"><IconSettings className="size-4 mr-1.5" />Quiz Settings</Button>} />
      </div>

      <Separator />

      {/* Content */}
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="quiz-title">Title</Label>
            <Input id="quiz-title" value={title} onChange={(e) => { setTitle(e.target.value); scheduleMetaSave(); }} placeholder="Quiz title..." />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="quiz-description">Description (optional)</Label>
            <Textarea id="quiz-description" value={description} onChange={(e) => { setDescription(e.target.value); scheduleMetaSave(); }} placeholder="Describe your quiz..." rows={2} className="resize-none" />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Questions ({quizData.questions.length})</h2>
          <ReusableQuestionsEditor
            questions={quizData.questions as ReusableQuestionData[]}
            onChange={() => {}}
            onQuestionUpdate={handleQuestionUpdate}
            onQuestionDelete={handleQuestionDelete}
            onQuestionAdd={handleQuestionAdd}
          />
        </div>

        <div className="flex justify-center py-6">
          <Button size="lg" className="w-full max-w-sm" onClick={() => window.open(`/quiz/${quizData.accessCode}`, "_blank")}>
            <IconPlayerPlay className="size-5 mr-2 fill-current" />Start Test
          </Button>
        </div>
      </div>
    </div>
  );
}
