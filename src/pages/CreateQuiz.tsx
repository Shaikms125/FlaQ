import { useState } from "react";
import { useAction, useMutation } from "convex/react";
import { useNavigate } from "react-router";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  IconWand,
  IconLoader2,
  IconPencil,
  IconArrowLeft,
  IconBulb,
  IconSchool,
  IconClock,
  IconGlobe,
  IconLock,
  IconCheck,
  IconListNumbers,
  IconCalendar,
} from "@tabler/icons-react";

type CreationFlow = "take-test" | "create-quiz";

export default function CreateQuiz() {
  const navigate = useNavigate();
  const generateQuiz = useAction(api.quiz.generateQuiz);
  const saveQuiz = useMutation(api.quiz.saveQuiz);

  // Shared fields
  const [flow, setFlow] = useState<CreationFlow>("take-test");
  const [prompt, setPrompt] = useState("");
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number>(0);
  const [numQuestions, setNumQuestions] = useState<number>(5);
  const [loading, setLoading] = useState(false);

  // Create Quiz (Flow B) specific
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [isManual, setIsManual] = useState(false);
  const [manualTitle, setManualTitle] = useState("");
  const [availableFrom, setAvailableFrom] = useState("");
  const [availableTo, setAvailableTo] = useState("");

  // Preview state
  const [previewData, setPreviewData] = useState<{
    title: string;
    questions: {
      question: string;
      options: string[];
      answerIndex: number;
      explanation: string;
    }[];
  } | null>(null);

  // ─── Helpers ────────────────────────────────────────────────
  const parseDateTime = (val: string) => (val ? new Date(val).getTime() : undefined);

  // ─── Flow A: Take a Test ────────────────────────────────────
  const handleTakeTest = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a topic or prompt.");
      return;
    }
    setLoading(true);
    try {
      const generated = await generateQuiz({ prompt, numQuestions });
      const result = await saveQuiz({
        prompt,
        title: generated.title,
        questions: generated.questions,
        isPublic: true,
        allowUnlimitedAttempts: true,
        timeLimitSeconds: timeLimitMinutes > 0 ? timeLimitMinutes * 60 : undefined,
      });
      toast.success("Quiz created! Starting now...");
      navigate(`/quiz/${result.accessCode}`);
    } catch (e) {
      toast.error("Failed to generate quiz: " + (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // ─── Flow B: Create a Quiz (Manual) ─────────────────────────
  const handleCreateManual = async () => {
    if (!manualTitle.trim()) {
      toast.error("Please enter a quiz title.");
      return;
    }
    setLoading(true);
    try {
      const result = await saveQuiz({
        title: manualTitle,
        description: description || undefined,
        questions: [],
        isPublic,
        allowUnlimitedAttempts: true,
        timeLimitSeconds: timeLimitMinutes > 0 ? timeLimitMinutes * 60 : undefined,
        availableFrom: isPublic ? parseDateTime(availableFrom) : undefined,
        availableTo: isPublic ? parseDateTime(availableTo) : undefined,
      });
      toast.success("Quiz created! Add your questions now.");
      navigate(`/my-quizzes/${result.quizId}/edit`);
    } catch (e) {
      toast.error("Failed to create quiz: " + (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // ─── Flow B: Create a Quiz (AI) ─────────────────────────────
  const handleGenerateForCreation = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a topic or prompt.");
      return;
    }
    setLoading(true);
    try {
      const generated = await generateQuiz({ prompt, numQuestions });
      setPreviewData(generated);
      toast.success("Quiz generated! Review and save below.");
    } catch (e) {
      toast.error("Failed to generate quiz: " + (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGeneratedQuiz = async () => {
    if (!previewData) return;
    setLoading(true);
    try {
      const result = await saveQuiz({
        prompt,
        title: previewData.title,
        description: description || undefined,
        questions: previewData.questions,
        isPublic,
        allowUnlimitedAttempts: true,
        timeLimitSeconds: timeLimitMinutes > 0 ? timeLimitMinutes * 60 : undefined,
        availableFrom: isPublic ? parseDateTime(availableFrom) : undefined,
        availableTo: isPublic ? parseDateTime(availableTo) : undefined,
      });
      toast.success("Quiz saved!");
      navigate(`/my-quizzes/${result.quizId}/edit`);
    } catch (e) {
      toast.error("Failed to save quiz: " + (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // ─── Preview editing ────────────────────────────────────────
  const handlePreviewQuestionChange = (qIndex: number, value: string) => {
    if (!previewData) return;
    const updated = { ...previewData, questions: [...previewData.questions] };
    updated.questions[qIndex] = { ...updated.questions[qIndex], question: value };
    setPreviewData(updated);
  };

  const handlePreviewOptionChange = (qIndex: number, oIndex: number, value: string) => {
    if (!previewData) return;
    const updated = { ...previewData, questions: [...previewData.questions] };
    const q = { ...updated.questions[qIndex], options: [...updated.questions[qIndex].options] };
    q.options[oIndex] = value;
    updated.questions[qIndex] = q;
    setPreviewData(updated);
  };

  const handlePreviewAnswerChange = (qIndex: number, oIndex: number) => {
    if (!previewData) return;
    const updated = { ...previewData, questions: [...previewData.questions] };
    updated.questions[qIndex] = { ...updated.questions[qIndex], answerIndex: oIndex };
    setPreviewData(updated);
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <IconArrowLeft />
        </Button>
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">Create New Quiz</h1>
          <p className="text-sm text-muted-foreground">
            Choose how you want to create your quiz.
          </p>
        </div>
      </div>

      {/* Flow selector */}
      <div className="mx-auto grid w-full max-w-3xl grid-cols-2 gap-4">
        <button
          onClick={() => { setFlow("take-test"); setPreviewData(null); }}
          className={`flex flex-col items-center gap-3 rounded-xl border-2 p-6 transition-all ${
            flow === "take-test"
              ? "border-primary bg-primary/5 shadow-md"
              : "border-border hover:border-primary/40 hover:bg-muted/30"
          }`}
        >
          <div className={`flex size-12 items-center justify-center rounded-full ${
            flow === "take-test" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          }`}>
            <IconBulb className="size-6" />
          </div>
          <div className="text-center">
            <p className="font-semibold">Take a Test</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Self-study mode — generate & take immediately
            </p>
          </div>
        </button>

        <button
          onClick={() => { setFlow("create-quiz"); setPreviewData(null); }}
          className={`flex flex-col items-center gap-3 rounded-xl border-2 p-6 transition-all ${
            flow === "create-quiz"
              ? "border-primary bg-primary/5 shadow-md"
              : "border-border hover:border-primary/40 hover:bg-muted/30"
          }`}
        >
          <div className={`flex size-12 items-center justify-center rounded-full ${
            flow === "create-quiz" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          }`}>
            <IconSchool className="size-6" />
          </div>
          <div className="text-center">
            <p className="font-semibold">Create a Quiz</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Teacher mode — create, configure & share
            </p>
          </div>
        </button>
      </div>

      {/* Form content */}
      <div className="mx-auto w-full max-w-3xl">
        {/* ═══════ FLOW A: Take a Test ═══════ */}
        {flow === "take-test" && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-5">
                {/* Prompt — prominent with icon label */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="flow-a-prompt" className="flex items-center gap-2 text-base font-semibold">
                    <IconWand className="size-5 text-primary" />
                    What do you want to be quizzed on?
                  </Label>
                  <Textarea
                    id="flow-a-prompt"
                    placeholder="e.g. React hooks and closures, World War II battles, Python data structures..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={3}
                    className="resize-none text-base"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="flow-a-questions" className="flex items-center gap-1.5">
                      <IconListNumbers className="size-4 text-muted-foreground" />
                      Number of Questions
                    </Label>
                    <Select value={String(numQuestions)} onValueChange={(v) => setNumQuestions(Number(v))}>
                      <SelectTrigger id="flow-a-questions" className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[5, 10, 15, 20, 25, 30].map((n) => (
                          <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="flow-a-time" className="flex items-center gap-1.5">
                      <IconClock className="size-4 text-muted-foreground" />
                      Time Limit
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="flow-a-time"
                        type="number"
                        min={0}
                        max={180}
                        value={timeLimitMinutes}
                        onChange={(e) => setTimeLimitMinutes(parseInt(e.target.value) || 0)}
                        className="w-24"
                      />
                      <span className="text-sm text-muted-foreground">min (0 = none)</span>
                    </div>
                  </div>
                </div>

                <Button
                  size="lg"
                  className="mt-2 w-full"
                  onClick={handleTakeTest}
                  disabled={loading || !prompt.trim()}
                >
                  {loading ? (
                    <>
                      <IconLoader2 className="mr-2 size-5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <IconWand className="mr-2 size-5" />
                      Generate & Start Quiz
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ═══════ FLOW B: Create a Quiz ═══════ */}
        {flow === "create-quiz" && !previewData && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-5">
                {/* Manual toggle — FIRST */}
                <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-4">
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="manual-toggle" className="flex items-center gap-1.5 font-medium">
                      <IconPencil className="size-4" />
                      Fully Manual Quiz
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Create all questions yourself — no AI generation.
                    </p>
                  </div>
                  <Switch
                    id="manual-toggle"
                    checked={isManual}
                    onCheckedChange={setIsManual}
                  />
                </div>

                {/* Prompt (AI mode only) — prominent with icon */}
                {!isManual && (
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="flow-b-prompt" className="flex items-center gap-2 text-base font-semibold">
                      <IconWand className="size-5 text-primary" />
                      What should the quiz be about?
                    </Label>
                    <Textarea
                      id="flow-b-prompt"
                      placeholder="e.g. World War II history covering major battles and leaders..."
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      rows={3}
                      className="resize-none text-base"
                    />
                  </div>
                )}

                {/* Manual title (manual mode only) */}
                {isManual && (
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="manual-title" className="flex items-center gap-2 text-base font-semibold">
                      <IconPencil className="size-5 text-primary" />
                      Quiz Title
                    </Label>
                    <Input
                      id="manual-title"
                      placeholder="Enter a title for your quiz..."
                      value={manualTitle}
                      onChange={(e) => setManualTitle(e.target.value)}
                      className="text-base"
                    />
                  </div>
                )}

                {/* Settings row */}
                <div className="grid grid-cols-2 gap-4">
                  {!isManual && (
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="flow-b-questions" className="flex items-center gap-1.5">
                        <IconListNumbers className="size-4 text-muted-foreground" />
                        Number of Questions
                      </Label>
                      <Select value={String(numQuestions)} onValueChange={(v) => setNumQuestions(Number(v))}>
                        <SelectTrigger id="flow-b-questions" className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[5, 10, 15, 20, 25, 30].map((n) => (
                            <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="flow-b-time" className="flex items-center gap-1.5">
                      <IconClock className="size-4 text-muted-foreground" />
                      Time Limit
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="flow-b-time"
                        type="number"
                        min={0}
                        max={180}
                        value={timeLimitMinutes}
                        onChange={(e) => setTimeLimitMinutes(parseInt(e.target.value) || 0)}
                        className="w-24"
                      />
                      <span className="text-sm text-muted-foreground">min</span>
                    </div>
                  </div>
                </div>

                {/* Public/Private toggle */}
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="public-toggle" className="flex items-center gap-1.5 font-medium">
                      {isPublic ? (
                        <IconGlobe className="size-4 text-chart-2" />
                      ) : (
                        <IconLock className="size-4 text-muted-foreground" />
                      )}
                      Visibility
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {isPublic
                        ? "Anyone with the link can take this quiz"
                        : "Only you and class members can access"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={isPublic ? "default" : "secondary"}>
                      {isPublic ? "Public" : "Private"}
                    </Badge>
                    <Switch
                      id="public-toggle"
                      checked={isPublic}
                      onCheckedChange={setIsPublic}
                    />
                  </div>
                </div>

                {/* Availability window (only when public) */}
                {isPublic && (
                  <div className="flex flex-col gap-3 rounded-lg border p-4">
                    <Label className="flex items-center gap-1.5 font-medium">
                      <IconCalendar className="size-4 text-muted-foreground" />
                      Availability Window (optional)
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Set when the quiz becomes available and when it expires. Leave blank for always available.
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="available-from" className="text-xs text-muted-foreground">
                          Available From
                        </Label>
                        <Input
                          id="available-from"
                          type="datetime-local"
                          value={availableFrom}
                          onChange={(e) => setAvailableFrom(e.target.value)}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="available-to" className="text-xs text-muted-foreground">
                          Available Until
                        </Label>
                        <Input
                          id="available-to"
                          type="datetime-local"
                          value={availableTo}
                          onChange={(e) => setAvailableTo(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Action button */}
                {isManual ? (
                  <Button
                    size="lg"
                    className="mt-2 w-full"
                    onClick={handleCreateManual}
                    disabled={loading || !manualTitle.trim()}
                  >
                    {loading ? (
                      <>
                        <IconLoader2 className="mr-2 size-5 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <IconPencil className="mr-2 size-5" />
                        Create Quiz
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    className="mt-2 w-full"
                    onClick={handleGenerateForCreation}
                    disabled={loading || !prompt.trim()}
                  >
                    {loading ? (
                      <>
                        <IconLoader2 className="mr-2 size-5 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <IconWand className="mr-2 size-5" />
                        Generate Quiz
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ═══════ FLOW B: Preview & Save ═══════ */}
        {flow === "create-quiz" && previewData && (
          <div className="flex flex-col gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold">{previewData.title}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {previewData.questions.length} questions generated — review and edit before saving.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setPreviewData(null)}
                  >
                    <IconArrowLeft className="mr-2 size-4" />
                    Back
                  </Button>
                </div>

                {/* Description — shown only in preview (before save) */}
                <div className="mt-4 flex flex-col gap-2">
                  <Label htmlFor="preview-desc">Description (optional)</Label>
                  <Textarea
                    id="preview-desc"
                    placeholder="Add a description for quiz takers..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    className="resize-none"
                  />
                </div>
              </CardContent>
            </Card>

            {previewData.questions.map((q, qIndex) => (
              <Card key={qIndex}>
                <CardContent className="pt-6">
                  <div className="flex flex-col gap-4">
                    <Label className="text-base font-semibold">Question {qIndex + 1}</Label>
                    <Textarea
                      value={q.question}
                      onChange={(e) => handlePreviewQuestionChange(qIndex, e.target.value)}
                      rows={2}
                      className="resize-none"
                    />
                    <div className="flex flex-col gap-2">
                      <Label>Options</Label>
                      {q.options.map((opt, oIndex) => (
                        <div key={oIndex} className="flex items-center gap-2">
                          <Button
                            variant={oIndex === q.answerIndex ? "default" : "outline"}
                            size="icon"
                            className="size-8 shrink-0"
                            onClick={() => handlePreviewAnswerChange(qIndex, oIndex)}
                            title={
                              oIndex === q.answerIndex
                                ? "Correct answer"
                                : "Set as correct answer"
                            }
                          >
                            {oIndex === q.answerIndex ? (
                              <IconCheck className="size-4" />
                            ) : (
                              <span className="text-xs font-semibold">
                                {String.fromCharCode(65 + oIndex)}
                              </span>
                            )}
                          </Button>
                          <Input
                            value={opt}
                            onChange={(e) =>
                              handlePreviewOptionChange(qIndex, oIndex, e.target.value)
                            }
                            className="flex-1"
                          />
                        </div>
                      ))}
                    </div>
                    {q.explanation && (
                      <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
                        <strong>Explanation:</strong> {q.explanation}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Save buttons */}
            <div className="sticky bottom-4 flex justify-center gap-4">
              <Button
                variant="outline"
                size="lg"
                onClick={() => setPreviewData(null)}
                disabled={loading}
              >
                Discard & Regenerate
              </Button>
              <Button
                size="lg"
                onClick={handleSaveGeneratedQuiz}
                disabled={loading}
                className="shadow-lg"
              >
                {loading ? (
                  <>
                    <IconLoader2 className="mr-2 size-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <IconCheck className="mr-2 size-5" />
                    Save Quiz
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
