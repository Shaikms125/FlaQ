import { useState } from "react";
import { useAction, useMutation } from "convex/react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";
import { IconBulb, IconWand, IconLoader2, IconSchool } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import AIPrompt from "@/components/ui/ai-prompt";
import { cn } from "@/lib/utils";
import { useQuery } from "convex/react";

export default function GenerateQuiz() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const classId = searchParams.get("classId") as Id<"classes"> | null;

  const generateQuiz = useAction(api.quiz.generateQuiz);
  const saveQuiz = useMutation(api.quiz.saveQuiz);

  const classData = useQuery(
    api.classes.getClassDetails,
    classId ? { classId: classId as Id<"classes"> } : "skip"
  );

  const [flow, setFlow] = useState<"take-test" | "generate-quiz">("generate-quiz");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (
    prompt: string,
    settings: { timeLimitMinutes: number; numQuestions: number; isManual: boolean }
  ) => {
    if (flow === "take-test" && settings.isManual) {
        toast.error("Manual mode is not supported for 'Take a Test'. Please provide a prompt.");
        return;
    }

    setLoading(true);
    let quizData: { 
      title: string; 
      questions: { 
        question: string; 
        options: string[]; 
        answerIndex: number; 
        explanation: string; 
      }[] 
    } = { title: "Draft Quiz", questions: [] };

    try {
      if (!settings.isManual) {
        toast.info("Generating quiz questions. This may take a moment...");
        const result = await generateQuiz({ 
            prompt, 
            numQuestions: settings.numQuestions 
        });
        quizData = result;
      }

      const savedQuiz = await saveQuiz({
        prompt: settings.isManual ? "Manual Quiz" : prompt,
        title: settings.isManual ? "Untitled Quiz" : quizData.title,
        questions: quizData.questions,
        isPublic: false, // Default to private
        isPublished: false, // Always start as draft for review
        classId: classId ?? undefined,
        allowUnlimitedAttempts: false,
        timeLimitSeconds:
          settings.timeLimitMinutes > 0 ? settings.timeLimitMinutes * 60 : undefined,
      });

      toast.success("Quiz prepared successfully!");

      if (flow === "take-test") {
        navigate(`/quiz/${savedQuiz.accessCode}`);
      } else {
        // Always go to editor to allow review before publishing
        navigate(`/my-quizzes/${savedQuiz.quizId}/edit`);
      }
    } catch (e) {
      toast.error("Failed to prepare quiz: " + (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // When creating for a class, lock to generate-quiz flow
  const isClassQuiz = !!classId;
  const showFlowSelector = !isClassQuiz;

  return (
    <div className="flex flex-1 flex-col items-center p-6 max-w-4xl mx-auto w-full gap-10 mt-10">
      <div className="flex flex-col items-center text-center gap-2">
        {isClassQuiz && classData && (
          <div className="flex items-center gap-2 mb-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium border border-primary/20">
            <IconSchool size={14} />
            Creating for class: {classData.name}
          </div>
        )}
        <h1 className="text-3xl font-bold tracking-tight">
          {isClassQuiz ? "Create Class Quiz" : "Create & Learn"}
        </h1>
        <p className="text-muted-foreground w-full max-w-md">
          {isClassQuiz
            ? "Generate a quiz for your class. You'll be able to review and edit it before publishing."
            : "Choose your path: Generate a quiz to edit and share later, or dive straight into a test to challenge yourself."}
        </p>
      </div>

      {showFlowSelector && (
        <div className="grid grid-cols-2 gap-6 w-full max-w-lg">
          <Button
            variant={flow === "take-test" ? "default" : "outline"}
            className={cn(
              "h-auto aspect-square flex flex-col gap-4 items-center justify-center rounded-2xl transition-all",
              flow === "take-test" ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : "hover:border-primary/50"
            )}
            onClick={() => setFlow("take-test")}
            disabled={loading}
          >
            <div className={cn(
                "p-4 rounded-full",
                flow === "take-test" ? "bg-primary-foreground/20" : "bg-muted"
            )}>
              <IconBulb className="size-8" />
            </div>
            <div className="flex flex-col items-center">
              <span className="text-lg font-semibold">Take a Test</span>
              <span className="text-xs font-normal opacity-80 pt-1">Test yourself instantly</span>
            </div>
          </Button>

          <Button
            variant={flow === "generate-quiz" ? "default" : "outline"}
            className={cn(
              "h-auto aspect-square flex flex-col gap-4 items-center justify-center rounded-2xl transition-all",
              flow === "generate-quiz" ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : "hover:border-primary/50"
            )}
            onClick={() => setFlow("generate-quiz")}
            disabled={loading}
          >
            <div className={cn(
                "p-4 rounded-full",
                flow === "generate-quiz" ? "bg-primary-foreground/20" : "bg-muted"
            )}>
              <IconWand className="size-8" />
            </div>
            <div className="flex flex-col items-center">
              <span className="text-lg font-semibold">Generate Quiz</span>
              <span className="text-xs font-normal opacity-80 pt-1">Create, edit, and share</span>
            </div>
          </Button>
        </div>
      )}

      <div className="w-full max-w-2xl relative">
        {loading ? (
             <div className="flex flex-col items-center justify-center py-12 gap-4 border rounded-2xl bg-muted/20">
                <IconLoader2 className="size-8 animate-spin text-primary" />
                <p className="text-sm font-medium animate-pulse">Processing your request...</p>
             </div>
        ) : (
            <AIPrompt 
                headerText={isClassQuiz ? "Provide a topic for your class quiz" : (flow === "generate-quiz" ? "Provide a topic to build a quiz" : "What do you want to test?")}
                headerAction={isClassQuiz ? "Generate Quiz" : (flow === "generate-quiz" ? "Let's build!" : "Start Test!")}
                placeholder={flow === "generate-quiz" || isClassQuiz ? "e.g. World War II History, Basic React Hooks..." : "e.g. JavaScript Promises, SAT Math..."}
                onSubmit={handleSubmit}
                hideManualToggle={flow === "take-test"}
            />
        )}
      </div>
    </div>
  );
}
