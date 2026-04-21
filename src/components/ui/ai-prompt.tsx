"use client";

import { ArrowRight, Bot, Check, ChevronDown, Clock, Hand, ListOrdered, Sparkles } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { useAutoResizeTextarea } from "@/hooks/use-auto-resize-textarea";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface AIPromptProps {
  placeholder?: string;
  headerText?: string;
  headerAction?: string;
  onSubmit?: (
    value: string, 
    settings: { timeLimitMinutes: number; numQuestions: number; isManual: boolean }
  ) => void;
  className?: string;
  hideManualToggle?: boolean;
}

const TIME_LIMIT_OPTIONS = [0, 5, 10, 15, 30, 60];
const NUM_QUESTIONS_OPTIONS = [5, 10, 15, 20, 25, 30];

export default function AIPrompt({
  placeholder = "What do you want to be quizzed on?",
  headerText = "FlaQ AI is ready",
  headerAction = "Generate Now!",
  onSubmit,
  className,
  hideManualToggle = false,
}: AIPromptProps) {
  const [value, setValue] = useState("");
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 72,
    maxHeight: 300,
  });
  
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(0);
  const [numQuestions, setNumQuestions] = useState(10);
  const [isManual, setIsManual] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (!isManual && !value.trim()) return;
    onSubmit?.(value, { timeLimitMinutes, numQuestions, isManual });
    setValue("");
    adjustHeight(true);
  };

  const formatTimeLimit = (mins: number) => mins === 0 ? "No Time Limit" : `${mins} mins`;

  return (
    <div className={cn("w-full py-4", className)}>
      <div className="rounded-2xl bg-black/5 p-1.5 pt-4 dark:bg-white/5">
        <div className="mx-2 mb-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-black dark:text-white" />
            <h3 className="text-black text-xs tracking-tighter dark:text-white/90">
              {headerText}
            </h3>
            <p className="text-black text-xs tracking-tighter dark:text-white/90 hidden sm:block">
              {headerAction}
            </p>
          </div>
          
          {!hideManualToggle && (
            <div className="flex items-center gap-2">
              <Switch 
                id="manual-mode" 
                checked={isManual}
                onCheckedChange={setIsManual}
              />
              <Label htmlFor="manual-mode" className="text-xs cursor-pointer flex items-center gap-1.5 text-black tracking-tighter dark:text-white/90">
                <Hand className="size-3.5" />
                Manual edit only
              </Label>
            </div>
          )}
        </div>

        <div className="relative">
          <div className="relative flex flex-col">
            <div className="overflow-y-auto" style={{ maxHeight: "400px" }}>
              <Textarea
                className={cn(
                  "w-full resize-none rounded-xl rounded-b-none border-none bg-black/5 px-4 py-3 placeholder:text-black/70 focus-visible:ring-0 focus-visible:ring-offset-0 dark:bg-white/5 dark:text-white dark:placeholder:text-white/70",
                  "min-h-[72px]"
                )}
                id="ai-input"
                onChange={(e) => {
                  setValue(e.target.value);
                  adjustHeight();
                }}
                onKeyDown={handleKeyDown}
                placeholder={isManual ? "Manual mode selected. No prompt needed! Just hit generate." : placeholder}
                ref={textareaRef}
                value={value}
                disabled={isManual}
              />
            </div>

            <div className="flex h-14 items-center rounded-b-xl bg-black/5 dark:bg-white/5">
              <div className="absolute right-3 bottom-3 left-3 flex w-[calc(100%-24px)] items-center justify-between">
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                  
                  {/* Time Limit Selector */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        className="flex h-8 items-center gap-1 rounded-md pr-2 pl-1 text-xs hover:bg-black/10 focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:ring-offset-0 dark:text-white dark:hover:bg-white/10"
                        variant="ghost"
                        disabled={isManual}
                      >
                         <div className="flex items-center gap-1">
                           <Clock className="size-3.5" />
                           {formatTimeLimit(timeLimitMinutes)}
                           <ChevronDown className="h-3 w-3 opacity-50" />
                         </div>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      className={cn(
                        "min-w-[10rem]",
                        "border-black/10 dark:border-white/10",
                        "bg-gradient-to-b from-white via-white to-neutral-100 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-800"
                      )}
                    >
                      {TIME_LIMIT_OPTIONS.map((opt) => (
                        <DropdownMenuItem
                          key={opt}
                          onClick={() => setTimeLimitMinutes(opt)}
                          className="flex items-center justify-between gap-2 cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                             <Clock className="h-4 w-4 opacity-50" />
                             <span>{formatTimeLimit(opt)}</span>
                          </div>
                          {timeLimitMinutes === opt && (
                            <Check className="h-4 w-4 text-blue-500" />
                          )}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <div className="mx-0.5 h-4 w-px bg-black/10 dark:bg-white/10" />

                  {/* Num Questions Selector */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        className="flex h-8 items-center gap-1 rounded-md pr-2 pl-1 text-xs hover:bg-black/10 focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:ring-offset-0 dark:text-white dark:hover:bg-white/10"
                        variant="ghost"
                        disabled={isManual}
                      >
                         <div className="flex items-center gap-1">
                           <ListOrdered className="size-3.5" />
                           {numQuestions} Questions
                           <ChevronDown className="h-3 w-3 opacity-50" />
                         </div>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      className={cn(
                        "min-w-[10rem]",
                        "border-black/10 dark:border-white/10",
                        "bg-gradient-to-b from-white via-white to-neutral-100 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-800"
                      )}
                    >
                      {NUM_QUESTIONS_OPTIONS.map((opt) => (
                        <DropdownMenuItem
                          key={opt}
                          onClick={() => setNumQuestions(opt)}
                          className="flex items-center justify-between gap-2 cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                             <ListOrdered className="h-4 w-4 opacity-50" />
                             <span>{opt} Questions</span>
                          </div>
                          {numQuestions === opt && (
                            <Check className="h-4 w-4 text-blue-500" />
                          )}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                </div>
                
                <button
                  aria-label="Send message"
                  className={cn(
                    "rounded-lg bg-black/5 p-2 dark:bg-white/5 transition-all text-black dark:text-white",
                    "hover:bg-black/10 focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:ring-offset-0 dark:hover:bg-white/10"
                  )}
                  disabled={!isManual && !value.trim()}
                  type="button"
                  onClick={handleSubmit}
                >
                  <ArrowRight
                    className={cn(
                      "h-4 w-4 transition-opacity duration-200 dark:text-white",
                      (isManual || value.trim()) ? "opacity-100" : "opacity-30"
                    )}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
