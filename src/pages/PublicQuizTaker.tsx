import { useParams, useNavigate } from "react-router";
import { useQuery, useMutation, useConvexAuth } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";
import { QuizTimer } from "@/components/quiz/QuizTimer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  IconCheck,
  IconSend,
  IconLogin,
  IconClock,
  IconLock,
  IconCircleCheck,
  IconCalendarOff,
  IconHourglass,
} from "@tabler/icons-react";
import { useState, useCallback, useEffect, useRef } from "react";

// ─── Constants ────────────────────────────────────────────────
const PENDING_SUBMISSION_KEY = "pendingQuizSubmission";

type QuizState = "loading" | "ready" | "taking" | "finished" | "already-taken";

// Selected answers are stored by index (number), keyed by questionId
interface SelectedAnswers {
  [questionId: string]: number;
}

interface ScoreResult {
  score: number;
  total: number;
  percentage: number;
}

export default function PublicQuizTaker() {
  const { accessCode } = useParams<{ accessCode: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: isAuthLoading } = useConvexAuth();

  const quizData = useQuery(
    api.quiz.getPublicQuizByAccessCode,
    accessCode ? { accessCode } : "skip"
  );

  const submitAttempt = useMutation(api.attempts.submitAttempt);

  const [quizState, setQuizState] = useState<QuizState>("ready");
  const [selectedAnswers, setSelectedAnswers] = useState<SelectedAnswers>({});
  const [scoreResult, setScoreResult] = useState<ScoreResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const pendingSubmissionHandled = useRef(false);

  // ─── Check for existing attempt (single-attempt mode) ───────
  const existingAttempt = useQuery(
    api.attempts.getMyAttemptForQuiz,
    quizData && isAuthenticated
      ? { quizId: quizData._id as Id<"quizzes"> }
      : "skip"
  );

  // If user has already taken a single-attempt quiz, show read-only
  useEffect(() => {
    if (
      quizData &&
      !quizData.allowUnlimitedAttempts &&
      existingAttempt &&
      isAuthenticated
    ) {
      setQuizState("already-taken");
      setScoreResult({
        score: existingAttempt.score,
        total: existingAttempt.answers.length,
        percentage: existingAttempt.percentage,
      });
      // Restore their answers for read-only display
      const restored: SelectedAnswers = {};
      for (const ans of existingAttempt.answers) {
        restored[ans.questionId] = ans.selectedOptionIndex;
      }
      setSelectedAnswers(restored);
    }
  }, [quizData, existingAttempt, isAuthenticated]);

  // ─── Auto-submit pending submission after auth return ───────
  useEffect(() => {
    if (pendingSubmissionHandled.current) return;
    if (isAuthLoading) return;
    if (!isAuthenticated) return;
    if (!quizData) return;

    const pendingRaw = localStorage.getItem(PENDING_SUBMISSION_KEY);
    if (!pendingRaw) return;

    try {
      const pending = JSON.parse(pendingRaw);
      // Verify it's for this quiz and not stale (< 1 hour)
      if (
        pending.accessCode === accessCode &&
        Date.now() - pending.timestamp < 3600000
      ) {
        pendingSubmissionHandled.current = true;
        // Auto submit
        const answers = Object.entries(pending.answers).map(
          ([questionId, selectedOptionIndex]) => ({
            questionId: questionId as Id<"questions">,
            selectedOptionIndex: selectedOptionIndex as number,
          })
        );

        setSubmitting(true);
        submitAttempt({
          quizId: quizData._id as Id<"quizzes">,
          isPractice: false,
          answers,
        })
          .then((result) => {
            setScoreResult({
              score: result.score,
              total: result.total,
              percentage: result.percentage,
            });
            setSubmitted(true);
            setQuizState("finished");
            // Restore answers for display
            setSelectedAnswers(pending.answers);
            localStorage.removeItem(PENDING_SUBMISSION_KEY);
            toast.success("Quiz submitted successfully!");
          })
          .catch((e) => {
            toast.error("Failed to auto-submit: " + (e as Error).message);
            localStorage.removeItem(PENDING_SUBMISSION_KEY);
          })
          .finally(() => {
            setSubmitting(false);
          });
      } else {
        // Stale or wrong quiz — clean up
        localStorage.removeItem(PENDING_SUBMISSION_KEY);
      }
    } catch {
      localStorage.removeItem(PENDING_SUBMISSION_KEY);
    }
  }, [isAuthenticated, isAuthLoading, quizData, accessCode]);

  // ─── Use scoreQuiz for client-side scoring (unlimited mode) ──
  const scoreAnswers = useQuery(
    api.quiz.scoreQuiz,
    quizData && quizState === "finished" && !scoreResult && quizData.allowUnlimitedAttempts
      ? {
          quizId: quizData._id as Id<"quizzes">,
          answers: Object.entries(selectedAnswers).map(([questionId, selectedOptionIndex]) => ({
            questionId: questionId as Id<"questions">,
            selectedOptionIndex,
          })),
        }
      : "skip"
  );

  // Set score when scoreQuiz returns
  useEffect(() => {
    if (scoreAnswers && !scoreResult && quizState === "finished") {
      setScoreResult({
        score: scoreAnswers.score,
        total: scoreAnswers.total,
        percentage: scoreAnswers.percentage,
      });
    }
  }, [scoreAnswers, scoreResult, quizState]);

  const handleStartQuiz = () => {
    setQuizState("taking");
    setSelectedAnswers({});
    setScoreResult(null);
    setSubmitted(false);
  };

  const handleSelectAnswer = (questionId: string, optionIndex: number) => {
    if (quizState !== "taking") return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const handleFinishQuiz = useCallback(() => {
    if (!quizData) return;
    setQuizState("finished");

    if (!quizData.allowUnlimitedAttempts) {
      // Single attempt mode: don't show score, require auth
      // scoreResult stays null — no score shown
    }
    // For unlimited mode, the scoreQuiz query will fire and populate scoreResult
  }, [quizData]);

  // ─── Submit score (requires auth) ───────────────────────────
  const handleSubmitScore = async () => {
    if (!quizData || !isAuthenticated) return;

    setSubmitting(true);
    try {
      const answers = Object.entries(selectedAnswers).map(
        ([questionId, selectedOptionIndex]) => ({
          questionId: questionId as Id<"questions">,
          selectedOptionIndex,
        })
      );

      const result = await submitAttempt({
        quizId: quizData._id as Id<"quizzes">,
        isPractice: false,
        answers,
      });

      setScoreResult({
        score: result.score,
        total: result.total,
        percentage: result.percentage,
      });
      setSubmitted(true);
      toast.success("Score submitted successfully!");
    } catch (e) {
      toast.error("Failed to submit: " + (e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Sign in to submit (caches data in localStorage) ────────
  const handleSignInToSubmit = () => {
    if (!quizData || !accessCode) return;

    // Cache the submission data before redirecting
    localStorage.setItem(
      PENDING_SUBMISSION_KEY,
      JSON.stringify({
        quizId: quizData._id,
        accessCode,
        answers: selectedAnswers,
        timestamp: Date.now(),
      })
    );

    navigate(`/signin?redirect=/quiz/${accessCode}`);
  };

  // ─── Loading state ──────────────────────────────────────────
  if (quizData === undefined) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-64 w-full max-w-2xl" />
      </div>
    );
  }

  // Quiz not found or not public
  if (quizData === null) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Quiz Not Found</h1>
          <p className="mt-2 text-muted-foreground">
            This quiz doesn't exist or is not publicly available.
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate("/")}>
          Go Home
        </Button>
      </div>
    );
  }

  // Quiz not yet available
  if (quizData.status === "not-yet") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6">
        <div className="flex size-20 items-center justify-center rounded-full bg-muted">
          <IconHourglass className="size-10 text-muted-foreground" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold">{quizData.title}</h1>
          <p className="mt-2 text-muted-foreground">
            This quiz is not available yet.
          </p>
          {quizData.availableFrom && (
            <p className="mt-1 text-sm font-medium">
              Available from: {new Date(quizData.availableFrom).toLocaleString()}
            </p>
          )}
        </div>
        <Button variant="outline" onClick={() => navigate("/")}>
          Go Home
        </Button>
      </div>
    );
  }

  // Quiz expired
  if (quizData.status === "expired") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6">
        <div className="flex size-20 items-center justify-center rounded-full bg-destructive/10">
          <IconCalendarOff className="size-10 text-destructive" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold">{quizData.title}</h1>
          <p className="mt-2 text-muted-foreground">
            This quiz is no longer available.
          </p>
          {quizData.availableTo && (
            <p className="mt-1 text-sm font-medium">
              Expired on: {new Date(quizData.availableTo).toLocaleString()}
            </p>
          )}
        </div>
        <Button variant="outline" onClick={() => navigate("/")}>
          Go Home
        </Button>
      </div>
    );
  }

  const answeredCount = Object.keys(selectedAnswers).length;
  const totalQuestions = quizData.questions.length;
  const allAnswered = answeredCount === totalQuestions;

  // ─── Already Taken (single attempt, read-only) ──────────────
  if (quizState === "already-taken" && scoreResult) {
    return (
      <div className="flex min-h-screen flex-col items-center bg-background p-6">
        <div className="w-full max-w-2xl">
          <Card className="mb-6">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
                <IconLock className="size-8 text-muted-foreground" />
              </div>
              <CardTitle className="text-2xl">Already Taken</CardTitle>
              <CardDescription>
                You have already taken this quiz. Here are your results.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="relative flex size-32 items-center justify-center rounded-full border-8 border-muted">
                  <div className="flex flex-col items-center">
                    <span className="text-3xl font-bold">{scoreResult.score}</span>
                    <span className="text-sm text-muted-foreground">/ {scoreResult.total}</span>
                  </div>
                </div>
                <p className="text-xl font-semibold">{scoreResult.percentage}% Correct</p>
              </div>
            </CardContent>
          </Card>

          {/* Read-only answers */}
          <h2 className="mb-4 text-lg font-semibold">Your Answers (read-only)</h2>
          <div className="flex flex-col gap-4">
            {quizData.questions.map((q, qIndex) => (
              <Card key={q._id}>
                <CardContent className="pt-6">
                  <p className="mb-3 font-medium">
                    {qIndex + 1}. {q.question}
                  </p>
                  <div className="flex flex-col gap-2">
                    {q.options.map((opt, oIndex) => {
                      const wasSelected = selectedAnswers[q._id] === oIndex;
                      return (
                        <div
                          key={oIndex}
                          className={`flex items-center gap-3 rounded-lg border p-3 ${
                            wasSelected
                              ? "border-primary bg-primary/5"
                              : "border-border opacity-60"
                          }`}
                        >
                          <span
                            className={`flex size-7 shrink-0 items-center justify-center rounded-full border text-sm font-semibold ${
                              wasSelected
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border"
                            }`}
                          >
                            {String.fromCharCode(65 + oIndex)}
                          </span>
                          <span className="text-sm">{opt.text}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="my-6 flex justify-center">
            <Button variant="outline" onClick={() => navigate("/")}>
              Go Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Ready / start screen ──────────────────────────────────
  if (quizState === "ready") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{quizData.title}</CardTitle>
            {quizData.description && (
              <CardDescription className="text-base">
                {quizData.description}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2 rounded-lg bg-muted/50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Questions</span>
                  <span className="font-semibold">{quizData.questionCount}</span>
                </div>
                {quizData.timeLimitSeconds && (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-sm text-muted-foreground">
                      <IconClock className="size-4" />
                      Time Limit
                    </span>
                    <span className="font-semibold">
                      {Math.floor(quizData.timeLimitSeconds / 60)} min
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Attempts</span>
                  <span className="font-semibold">
                    {quizData.allowUnlimitedAttempts ? "Unlimited" : "Single"}
                  </span>
                </div>
              </div>

              {!isAuthenticated && !quizData.allowUnlimitedAttempts && (
                <div className="rounded-lg border border-border bg-muted/30 p-3 text-center">
                  <p className="text-sm text-muted-foreground">
                    This is a single-attempt quiz. You'll need to sign in to
                    submit your answers and view your score.
                  </p>
                </div>
              )}

              <Button size="lg" className="w-full" onClick={handleStartQuiz}>
                Start Quiz
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Taking the quiz ───────────────────────────────────────
  if (quizState === "taking") {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        {/* Timer — cap to remaining availability window if needed */}
        {quizData.timeLimitSeconds && (() => {
          let effectiveLimit = quizData.timeLimitSeconds;
          if (quizData.availableTo) {
            const remainingSeconds = Math.max(0, Math.floor((quizData.availableTo - Date.now()) / 1000));
            effectiveLimit = Math.min(effectiveLimit, remainingSeconds);
          }
          return effectiveLimit > 0 ? (
          <QuizTimer
            timeLimitSeconds={effectiveLimit}
            onTimeUp={handleFinishQuiz}
          />
          ) : null;
        })()}

        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
          {/* Progress */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{quizData.title}</span>
              <span>
                {answeredCount}/{totalQuestions} answered
              </span>
            </div>
            <Progress value={(answeredCount / totalQuestions) * 100} />
          </div>

          {/* Questions */}
          {quizData.questions.map((q, qIndex) => (
            <Card key={q._id}>
              <CardHeader>
                <CardTitle className="text-base">
                  {qIndex + 1}. {q.question}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2">
                  {q.options.map((opt, oIndex) => {
                    const isSelected = selectedAnswers[q._id] === oIndex;
                    return (
                      <button
                        key={oIndex}
                        onClick={() => handleSelectAnswer(q._id, oIndex)}
                        className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                          isSelected
                            ? "border-primary bg-primary/5 text-foreground"
                            : "border-border hover:bg-muted/50"
                        }`}
                      >
                        <span
                          className={`flex size-7 shrink-0 items-center justify-center rounded-full border text-sm font-semibold ${
                            isSelected
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border"
                          }`}
                        >
                          {String.fromCharCode(65 + oIndex)}
                        </span>
                        <span className="text-sm">{opt.text}</span>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Finish button */}
          <div className="sticky bottom-4 flex justify-center">
            <Button
              size="lg"
              onClick={handleFinishQuiz}
              disabled={!allAnswered}
              className="shadow-lg"
            >
              <IconCheck data-icon="inline-start" />
              {allAnswered
                ? "Finish"
                : `Answer all questions (${answeredCount}/${totalQuestions})`}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Finished ──────────────────────────────────────────────
  if (quizState === "finished") {
    const isUnlimited = quizData.allowUnlimitedAttempts;
    const isSingleAttempt = !isUnlimited;

    return (
      <div className="flex min-h-screen flex-col items-center bg-background p-6">
        <div className="w-full max-w-2xl">
          <Card className="mb-6">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">
                {submitted ? "Submitted!" : "Quiz Complete!"}
              </CardTitle>
              <CardDescription>{quizData.title}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-6 py-4">
                {/* ═══ Scenario A: Single Attempt ═══ */}
                {isSingleAttempt && !scoreResult && !submitted && (
                  <div className="flex flex-col items-center gap-4">
                    <div className="flex size-20 items-center justify-center rounded-full bg-muted">
                      <IconLock className="size-10 text-muted-foreground" />
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-semibold">Sign in to see your score</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        This is a single-attempt quiz. Sign in to submit your
                        answers and view your results.
                      </p>
                    </div>
                    {isAuthenticated ? (
                      <Button
                        onClick={handleSubmitScore}
                        disabled={submitting}
                        size="lg"
                      >
                        <IconSend data-icon="inline-start" />
                        {submitting ? "Submitting..." : "Submit & View Score"}
                      </Button>
                    ) : (
                      <Button onClick={handleSignInToSubmit} size="lg">
                        <IconLogin data-icon="inline-start" />
                        Sign In to Submit
                      </Button>
                    )}
                  </div>
                )}

                {/* ═══ Score display (both scenarios, after scoring) ═══ */}
                {scoreResult && (
                  <>
                    {submitted && (
                      <div className="flex size-16 items-center justify-center rounded-full bg-chart-2/10">
                        <IconCircleCheck className="size-10 text-chart-2" />
                      </div>
                    )}
                    <div className="relative flex size-32 items-center justify-center rounded-full border-8 border-muted">
                      <div className="flex flex-col items-center">
                        <span className="text-3xl font-bold">{scoreResult.score}</span>
                        <span className="text-sm text-muted-foreground">
                          / {scoreResult.total}
                        </span>
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-semibold">
                        {scoreResult.percentage}% Correct
                      </p>
                    </div>

                    {submitted && (
                      <Badge variant="default" className="px-4 py-2 text-base">
                        <IconCheck data-icon="inline-start" />
                        Score Submitted Successfully!
                      </Badge>
                    )}
                  </>
                )}

                {/* ═══ Scenario B: Unlimited Attempts — optional submit ═══ */}
                {isUnlimited && scoreResult && !submitted && (
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-sm text-muted-foreground">
                      Want to save your score?
                    </p>
                    {isAuthenticated ? (
                      <Button
                        onClick={handleSubmitScore}
                        disabled={submitting}
                        variant="outline"
                        size="lg"
                      >
                        <IconSend data-icon="inline-start" />
                        {submitting ? "Submitting..." : "Submit Scores"}
                      </Button>
                    ) : (
                      <Button onClick={handleSignInToSubmit} variant="outline" size="lg">
                        <IconLogin data-icon="inline-start" />
                        Sign In to Submit
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Review answers (only if we have a score / unlimited mode) */}
          {scoreResult && (
            <>
              <h2 className="mb-4 text-lg font-semibold">Your Answers</h2>
              <div className="flex flex-col gap-4">
                {quizData.questions.map((q, qIndex) => (
                  <Card key={q._id}>
                    <CardContent className="pt-6">
                      <div className="flex flex-col gap-2">
                        <p className="font-medium">
                          {qIndex + 1}. {q.question}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            Your answer:
                          </span>
                          <Badge variant="secondary">
                            {selectedAnswers[q._id] !== undefined
                              ? q.options[selectedAnswers[q._id]]?.text ?? "Unknown"
                              : "Not answered"}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}

          <div className="my-6 flex justify-center gap-4">
            {isUnlimited && (
              <Button variant="outline" onClick={handleStartQuiz}>
                Retake Quiz
              </Button>
            )}
            <Button variant="outline" onClick={() => navigate("/")}>
              Go Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
