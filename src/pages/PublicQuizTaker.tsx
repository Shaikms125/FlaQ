import { useParams, useNavigate } from "react-router";
import { useQuery, useMutation, useConvexAuth } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
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
} from "@tabler/icons-react";
import { useState, useCallback } from "react";

type QuizState = "loading" | "ready" | "taking" | "finished";

interface SelectedAnswers {
  [questionId: string]: string;
}

interface QuizResult {
  score: number;
  total: number;
  percentage: number;
  answers: {
    questionId: string;
    question: string;
    selected: string;
    correct: boolean;
  }[];
}

export default function PublicQuizTaker() {
  const { accessCode } = useParams<{ accessCode: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useConvexAuth();

  const quizData = useQuery(
    api.quiz.getPublicQuizByAccessCode,
    accessCode ? { accessCode } : "skip"
  );

  const submitAttempt = useMutation(api.attempts.submitAttempt);

  const [quizState, setQuizState] = useState<QuizState>("ready");
  const [selectedAnswers, setSelectedAnswers] = useState<SelectedAnswers>({});
  const [result, setResult] = useState<QuizResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleStartQuiz = () => {
    setQuizState("taking");
    setSelectedAnswers({});
    setResult(null);
    setSubmitted(false);
  };

  const handleSelectAnswer = (questionId: string, optionText: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionText,
    }));
  };

  const handleFinishQuiz = useCallback(() => {
    if (!quizData) return;

    // Calculate score locally (we don't have isCorrect so we can't know — 
    // the real scoring happens server-side on submit)
    const answers = quizData.questions.map((q) => ({
      questionId: q._id,
      question: q.question,
      selected: selectedAnswers[q._id] ?? "",
      correct: false, // We don't know until submission
    }));

    setResult({
      score: 0,
      total: quizData.questions.length,
      percentage: 0,
      answers,
    });
    setQuizState("finished");
  }, [quizData, selectedAnswers]);

  const handleSubmitScore = async () => {
    if (!quizData || !isAuthenticated) return;

    setSubmitting(true);
    try {
      // We need the full questions with correct answers to score
      // The server will score this based on questionId lookups
      const answers = quizData.questions.map((q) => ({
        questionId: q._id as Id<"questions">,
        selectedOptionText: selectedAnswers[q._id] ?? "",
      }));

      const submissionResult = await submitAttempt({
        quizId: quizData._id as Id<"quizzes">,
        isPractice: false,
        answers,
      });

      setResult({
        score: submissionResult.score,
        total: submissionResult.total,
        percentage: submissionResult.percentage,
        answers: quizData.questions.map((q) => ({
          questionId: q._id,
          question: q.question,
          selected: selectedAnswers[q._id] ?? "",
          correct: false, // We'll just show the score for now
        })),
      });

      setSubmitted(true);
      // The server calculated the real score - we don't refetch but show success
      console.log("Attempt submitted:", submissionResult.attemptId);
    } catch (e) {
      console.error("Failed to submit attempt:", e);
    } finally {
      setSubmitting(false);
    }
  };

  // Loading
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

  const answeredCount = Object.keys(selectedAnswers).length;
  const totalQuestions = quizData.questions.length;
  const allAnswered = answeredCount === totalQuestions;

  // Ready / start screen
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
              </div>

              {!isAuthenticated && (
                <div className="rounded-lg border border-border bg-muted/30 p-3 text-center">
                  <p className="text-sm text-muted-foreground">
                    You can take this quiz without logging in, but you'll need to
                    sign in to submit your score.
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

  // Taking the quiz
  if (quizState === "taking") {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        {/* Timer */}
        {quizData.timeLimitSeconds && (
          <QuizTimer
            timeLimitSeconds={quizData.timeLimitSeconds}
            onTimeUp={handleFinishQuiz}
          />
        )}

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
                    const isSelected = selectedAnswers[q._id] === opt.text;
                    return (
                      <button
                        key={oIndex}
                        onClick={() => handleSelectAnswer(q._id, opt.text)}
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

          {/* Submit button */}
          <div className="sticky bottom-4 flex justify-center">
            <Button
              size="lg"
              onClick={handleFinishQuiz}
              disabled={!allAnswered}
              className="shadow-lg"
            >
              <IconCheck data-icon="inline-start" />
              {allAnswered
                ? "Finish Quiz"
                : `Answer all questions (${answeredCount}/${totalQuestions})`}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Finished — show results
  if (quizState === "finished" && result) {
    return (
      <div className="flex min-h-screen flex-col items-center bg-background p-6">
        <div className="w-full max-w-2xl">
          <Card className="mb-6">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Quiz Complete!</CardTitle>
              <CardDescription>{quizData.title}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-6 py-4">
                <div className="relative flex size-32 items-center justify-center rounded-full border-8 border-muted">
                  <div className="flex flex-col items-center">
                    <span className="text-3xl font-bold">{result.score}</span>
                    <span className="text-sm text-muted-foreground">/ {result.total}</span>
                  </div>
                  {/* Progress ring simulation with absolute SVG if needed, but simple is okay for now */}
                </div>

                <div className="text-center">
                  <p className="text-xl font-semibold">
                    {result.percentage}% Correct
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    You answered {answeredCount} out of {totalQuestions} questions
                  </p>
                </div>

                {!submitted && (
                  <div className="flex flex-col gap-2">
                    {isAuthenticated ? (
                      <Button
                        onClick={handleSubmitScore}
                        disabled={submitting}
                        size="lg"
                      >
                        <IconSend data-icon="inline-start" />
                        {submitting ? "Submitting..." : "Submit Score"}
                      </Button>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <p className="text-sm text-muted-foreground">
                          Sign in to submit your score to the quiz creator
                        </p>
                        <Button
                          onClick={() => navigate(`/signin?redirect=/quiz/${accessCode}`)}
                          size="lg"
                        >
                          <IconLogin data-icon="inline-start" />
                          Sign In to Submit
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {submitted && (
                  <Badge variant="default" className="text-base px-4 py-2">
                    <IconCheck data-icon="inline-start" />
                    Score Submitted Successfully!
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Review answers */}
          <h2 className="mb-4 text-lg font-semibold">Your Answers</h2>
          <div className="flex flex-col gap-4">
            {result.answers.map((a, i) => (
              <Card key={a.questionId}>
                <CardContent className="pt-6">
                  <div className="flex flex-col gap-2">
                    <p className="font-medium">
                      {i + 1}. {a.question}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        Your answer:
                      </span>
                      <Badge variant="secondary">
                        {a.selected || "Not answered"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="my-6 flex justify-center gap-4">
            <Button variant="outline" onClick={handleStartQuiz}>
              Retake Quiz
            </Button>
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
