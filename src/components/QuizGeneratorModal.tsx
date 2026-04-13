import { useState } from "react"
import { useAction, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Textarea } from "@/components/ui/textarea";
import { IconWand, IconLoader2, IconCheck, IconPencil } from "@tabler/icons-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function QuizGeneratorModal() {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [quizData, setQuizData] = useState<any[] | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const generateQuiz = useAction(api.quiz.generateQuiz);
  const saveQuiz = useMutation(api.quiz.saveQuiz);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setQuizData(null);
    setIsEditing(false);
    try {
      const generated = await generateQuiz({ prompt });
      setQuizData(generated);
    } catch (e) {
      console.error(e);
      alert("Failed to generate quiz. Check the console.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!quizData) return;
    setLoading(true);
    try {
      // Derive a title from the prompt (first 50 chars)
      const title = prompt.length > 50
        ? prompt.substring(0, 50).trim() + "..."
        : prompt.trim();

      await saveQuiz({ prompt, title, questions: quizData });
      setOpen(false); // Close dialog on success
      setPrompt("");
      setQuizData(null);
    } catch (e) {
      console.error(e);
      alert("Failed to save quiz");
    } finally {
      setLoading(false);
    }
  };

  const handleOptionChange = (qIndex: number, oIndex: number, value: string) => {
    if (!quizData) return;
    const newData = [...quizData];
    newData[qIndex].options[oIndex] = value;
    setQuizData(newData);
  };

  const handleQuestionChange = (qIndex: number, value: string) => {
    if (!quizData) return;
    const newData = [...quizData];
    newData[qIndex].question = value;
    setQuizData(newData);
  };
  
  const handleAnswerChange = (qIndex: number, value: string) => {
    if (!quizData) return;
    const newData = [...quizData];
    newData[qIndex].answer = value;
    setQuizData(newData);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <SidebarMenuItem>
        <DialogTrigger
          render={
            <SidebarMenuButton
              tooltip="Generate Quiz"
              className="border border-sidebar-border bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90 hover:text-sidebar-primary-foreground data-active:bg-sidebar-primary data-active:text-sidebar-primary-foreground"
            />
          }
        >
          <IconWand />
          <span className="truncate group-data-[collapsible=icon]:hidden">
            Generate Quiz
          </span>
        </DialogTrigger>
      </SidebarMenuItem>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate a New Quiz</DialogTitle>
          <DialogDescription>
            Enter a prompt describing what kind of quiz you want to generate.
          </DialogDescription>
        </DialogHeader>

        {!quizData && (
          <div className="grid gap-4 py-4">
            <Textarea
              placeholder="e.g. A 5-question quiz about React basics..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="resize-none"
              rows={4}
            />
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-8">
            <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-4 text-sm text-muted-foreground">This might take a moment...</p>
          </div>
        )}

        {quizData && !loading && (
          <div className="space-y-6 py-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Preview Quiz</h3>
              <Button variant="outline" size="sm" onClick={() => setIsEditing(!isEditing)}>
                <IconPencil className="mr-2 h-4 w-4" />
                {isEditing ? "Done Editing" : "Edit Quiz"}
              </Button>
            </div>
            {quizData.map((q, qIndex) => (
              <div key={qIndex} className="p-4 border rounded-lg space-y-4 bg-card text-card-foreground">
                <div className="space-y-2">
                  <Label>Question {qIndex + 1}</Label>
                  {isEditing ? (
                    <Input value={q.question} onChange={(e) => handleQuestionChange(qIndex, e.target.value)} />
                  ) : (
                    <p className="text-md font-medium">{q.question}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label>Options</Label>
                  {q.options.map((opt: string, oIndex: number) => (
                    <div key={oIndex} className="flex items-center gap-2">
                      <span className="text-sm font-semibold w-6">{String.fromCharCode(65 + oIndex)}.</span>
                      {isEditing ? (
                        <Input value={opt} onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)} />
                      ) : (
                        <span
                          className={
                            opt === q.answer
                              ? "text-sm font-bold text-chart-2"
                              : "text-sm"
                          }
                        >
                          {opt} {opt === q.answer && "(Correct Answer)"}
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {isEditing && (
                  <div className="space-y-2">
                    <Label className="text-chart-2">
                      Correct Answer (Must match an option exactly)
                    </Label>
                    <Input value={q.answer} onChange={(e) => handleAnswerChange(qIndex, e.target.value)} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          {!quizData ? (
             <Button onClick={handleGenerate} disabled={loading || !prompt.trim()}>
               <IconWand className="mr-2 h-4 w-4" />
               Generate
             </Button>
          ) : (
            <div className="flex gap-2 w-full justify-end">
              <Button variant="outline" onClick={() => setQuizData(null)} disabled={loading}>
                Discard
              </Button>
              <Button onClick={handleSave} disabled={loading}>
                <IconCheck className="mr-2 h-4 w-4" />
                Save Quiz
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
