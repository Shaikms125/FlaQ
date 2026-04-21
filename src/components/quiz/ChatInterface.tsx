import { useState, useRef, useEffect } from "react";
import { useAction, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  IconWand,
  IconPencil,
  IconSend,
  IconCheck,
  IconShare,
  IconLoader2,
} from "@tabler/icons-react";
import { ChatMessage, TypingIndicator } from "@/components/quiz/ChatMessage";
import { QuizCreationSuccess } from "@/components/quiz/QuizCreationSuccess";
import {
  ReusableQuestionsEditor,
  type ReusableQuestionData,
} from "@/components/quiz/ReusableQuestionsEditor";

type ChatPhase = "idle" | "generating" | "preview" | "success";

interface ChatMessageData {
  id: string;
  role: "user" | "ai" | "system";
  content: string;
}

export function ChatInterface() {
  const generateQuiz = useAction(api.quiz.generateQuiz);
  const saveQuiz = useMutation(api.quiz.saveQuiz);

  const [phase, setPhase] = useState<ChatPhase>("idle");
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [inputValue, setInputValue] = useState("");

  const [isManual, setIsManual] = useState(false);
  const [manualTitle, setManualTitle] = useState("");
  const [numOptions, setNumOptions] = useState(4);
  const [numQuestions, setNumQuestions] = useState(10);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(0);

  const [previewData, setPreviewData] = useState<{
    title: string;
    questions: ReusableQuestionData[];
  } | null>(null);

  const [createdQuiz, setCreatedQuiz] = useState<{
    quizId: string;
    accessCode: string;
  } | null>(null);

  const [regenerating, setRegenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      const viewport = scrollRef.current.querySelector(
        "[data-slot='scroll-area-viewport']"
      );
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [messages, phase]);

  const addMessage = (role: ChatMessageData["role"], content: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setMessages((prev) => [...prev, { id, role, content }]);
  };

  const resetChat = () => {
    setPhase("idle");
    setMessages([]);
    setInputValue("");
    setManualTitle("");
    setPreviewData(null);
    setCreatedQuiz(null);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleSendAI = async () => {
    const prompt = inputValue.trim();
    const isRegenerate = phase === "preview";
    if (!isRegenerate && !prompt) return;

    if (!isRegenerate) {
      addMessage("user", prompt);
      setInputValue("");
    }
    setPhase("generating");
    setRegenerating(true);

    const effectivePrompt = isRegenerate
      ? messages.find((m) => m.role === "user")?.content ?? prompt
      : prompt;

    try {
      const generated = await generateQuiz({
        prompt: effectivePrompt,
        numOptions,
        numQuestions,
      });
      const mappedQuestions: ReusableQuestionData[] = generated.questions.map(
        (q) => ({
          question: q.question,
          explanation: q.explanation,
          answer: q.answerIndex,
          options: q.options.map((text, i) => ({
            text,
            isCorrect: i === q.answerIndex,
          })),
        })
      );

      setPreviewData({ title: generated.title, questions: mappedQuestions });
      if (!isRegenerate) {
        addMessage(
          "ai",
          `Generated "${generated.title}" with ${generated.questions.length} questions. Review and save below.`
        );
      } else {
        setMessages((prev) => [
          ...prev.slice(0, -1),
          { id: `${Date.now()}-regen`, role: "ai" as const, content: `Regenerated "${generated.title}" with ${generated.questions.length} questions. Review and save below.` },
        ]);
      }
      setPhase("preview");
    } catch (e) {
      addMessage(
        "ai",
        `Failed to generate quiz: ${(e as Error).message}. Please try again.`
      );
      setPhase(isRegenerate ? "preview" : "idle");
    } finally {
      setRegenerating(false);
    }
  };

  const handleCreateManual = async () => {
    const title = manualTitle.trim();
    if (!title) {
      toast.error("Please enter a quiz title.");
      return;
    }

    setSaving(true);
    try {
      const result = await saveQuiz({
        title,
        isPublic: false,
        allowUnlimitedAttempts: false,
        timeLimitSeconds:
          timeLimitMinutes > 0 ? timeLimitMinutes * 60 : undefined,
        questions: [],
      });
      setCreatedQuiz(result);
      addMessage("system", "Quiz created successfully!");
      setPhase("success");
      toast.success("Quiz created successfully!");
    } catch (e) {
      toast.error("Failed to create quiz: " + (e as Error).message);
      setPhase("idle");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveQuiz = async () => {
    if (!previewData) return;

    const questionsToSave = previewData.questions.map((q) => ({
      question: q.question,
      options: q.options.map((o) => o.text),
      answerIndex: q.answer,
      explanation: q.explanation,
    }));

    setSaving(true);
    try {
      const result = await saveQuiz({
        prompt: messages.find((m) => m.role === "user")?.content,
        title: previewData.title,
        questions: questionsToSave,
        isPublic: false,
        allowUnlimitedAttempts: false,
        timeLimitSeconds:
          timeLimitMinutes > 0 ? timeLimitMinutes * 60 : undefined,
      });
      setCreatedQuiz(result);
      addMessage("system", "Quiz saved successfully!");
      setPhase("success");
      toast.success("Quiz saved successfully!");
    } catch (e) {
      toast.error("Failed to save quiz: " + (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !isManual) {
      e.preventDefault();
      if (phase === "idle" && inputValue.trim()) {
        handleSendAI();
      }
    }
  };

  const canSend =
    phase === "idle" &&
    ((isManual && manualTitle.trim()) || (!isManual && inputValue.trim()));

  return (
    <div className="flex h-[calc(100vh-10rem)] flex-col rounded-xl border bg-card ring-1 ring-foreground/10">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <IconWand className="size-4 text-primary" />
          AI Quiz Generator
        </div>
        <div className="flex items-center gap-2">
          <Label
            htmlFor="manual-toggle"
            className="flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground"
          >
            <IconPencil className="size-3.5" />
            Manual Quiz
          </Label>
          <Switch
            id="manual-toggle"
            size="sm"
            checked={isManual}
            onCheckedChange={(checked) => {
              setIsManual(checked);
              if (checked) {
                setPhase("idle");
                setMessages([]);
                setPreviewData(null);
              } else {
                resetChat();
              }
            }}
          />
        </div>
      </div>

      <div className="flex items-center gap-3 border-b px-4 py-2">
        <div className="flex flex-col gap-1">
          <Label className="text-[10px] text-muted-foreground">Options</Label>
          <Select
            value={String(numOptions)}
            onValueChange={(v) => setNumOptions(Number(v))}
          >
            <SelectTrigger size="sm" className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[2, 3, 4, 5, 6].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-[10px] text-muted-foreground">Questions</Label>
          <Select
            value={String(numQuestions)}
            onValueChange={(v) => setNumQuestions(Number(v))}
          >
            <SelectTrigger size="sm" className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[5, 10, 15, 20, 25, 30].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n} questions
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-[10px] text-muted-foreground">Time</Label>
          <Select
            value={String(timeLimitMinutes)}
            onValueChange={(v) => setTimeLimitMinutes(Number(v))}
          >
            <SelectTrigger size="sm" className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">None</SelectItem>
              <SelectItem value="5">5 min</SelectItem>
              <SelectItem value="10">10 min</SelectItem>
              <SelectItem value="15">15 min</SelectItem>
              <SelectItem value="30">30 min</SelectItem>
              <SelectItem value="60">60 min</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <ScrollArea ref={scrollRef} className="flex-1 overflow-hidden">
        <div className="flex flex-col gap-3 p-4">
          {messages.length === 0 && !isManual && (
            <ChatMessage role="ai" content="What should the quiz be about? Describe a topic, subject, or specific content you'd like to test." />
          )}
          {messages.length === 0 && isManual && (
            <ChatMessage role="ai" content="Enter a title for your manual quiz. You can add questions later in the editor." />
          )}
          {messages.map((msg) => (
            <ChatMessage key={msg.id} role={msg.role} content={msg.content} />
          ))}
          {phase === "generating" && <TypingIndicator />}
          {phase === "preview" && previewData && (
            <ChatMessage role="ai">
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-2">
                  <Label className="text-xs font-semibold">Quiz Title</Label>
                  <Input
                    value={previewData.title}
                    onChange={(e) =>
                      setPreviewData({ ...previewData, title: e.target.value })
                    }
                    className="font-semibold text-sm"
                  />
                </div>
                <ReusableQuestionsEditor
                  questions={previewData.questions}
                  onChange={(q) =>
                    setPreviewData({ ...previewData, questions: q })
                  }
                />
                <Separator />
                <div className="flex items-center justify-between gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSendAI}
                    disabled={regenerating || saving}
                  >
                    {regenerating ? (
                      <IconLoader2 className="size-4 animate-spin" />
                    ) : (
                      <IconWand data-icon="inline-start" />
                    )}
                    Regenerate
                  </Button>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleSaveQuiz}
                      disabled={saving || regenerating}
                    >
                      {saving ? (
                        <IconLoader2 className="size-4 animate-spin" />
                      ) : (
                        <IconCheck data-icon="inline-start" />
                      )}
                      Save Quiz
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveQuiz}
                      disabled={saving || regenerating}
                    >
                      <IconShare data-icon="inline-start" />
                      Save & Share
                    </Button>
                  </div>
                </div>
              </div>
            </ChatMessage>
          )}
          {phase === "success" && createdQuiz && (
            <ChatMessage role="ai">
              <QuizCreationSuccess
                quizId={createdQuiz.quizId as any}
                accessCode={createdQuiz.accessCode}
                quizTitle={previewData?.title ?? manualTitle}
                isPublic={false}
                allowUnlimitedAttempts={false}
                onReset={resetChat}
              />
            </ChatMessage>
          )}
        </div>
      </ScrollArea>

      <div className="border-t p-3">
        {isManual ? (
          <div className="flex items-center gap-2">
            <Input
              ref={inputRef}
              placeholder="Enter quiz title..."
              value={manualTitle}
              onChange={(e) => setManualTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && manualTitle.trim() && phase === "idle") {
                  handleCreateManual();
                }
              }}
              disabled={saving}
            />
            <Button
              size="icon"
              onClick={handleCreateManual}
              disabled={!canSend || saving}
            >
              {saving ? (
                <IconLoader2 className="size-4 animate-spin" />
              ) : (
                <IconPencil className="size-4" />
              )}
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Input
              ref={inputRef}
              placeholder="Describe what the quiz should be about..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={phase !== "idle"}
            />
            <Button
              size="icon"
              onClick={handleSendAI}
              disabled={!canSend}
            >
              <IconSend className="size-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
