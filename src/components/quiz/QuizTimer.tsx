import { useState, useEffect, useCallback } from "react";
import { Progress } from "@/components/ui/progress";
import { IconClock } from "@tabler/icons-react";

interface QuizTimerProps {
  timeLimitSeconds: number;
  onTimeUp: () => void;
}

export function QuizTimer({ timeLimitSeconds, onTimeUp }: QuizTimerProps) {
  const [secondsLeft, setSecondsLeft] = useState(timeLimitSeconds);

  const handleTimeUp = useCallback(() => {
    onTimeUp();
  }, [onTimeUp]);

  useEffect(() => {
    if (secondsLeft <= 0) {
      handleTimeUp();
      return;
    }

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [secondsLeft, handleTimeUp]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const percentLeft = (secondsLeft / timeLimitSeconds) * 100;

  const isUrgent = percentLeft <= 20;
  const isWarning = percentLeft <= 50 && !isUrgent;

  return (
    <div className="sticky top-14 z-10 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center gap-4">
        <div className="flex items-center gap-2">
          <IconClock
            className={
              isUrgent
                ? "text-destructive"
                : isWarning
                  ? "text-chart-4"
                  : "text-muted-foreground"
            }
          />
          <span
            className={`font-mono text-lg font-bold tabular-nums ${
              isUrgent
                ? "text-destructive"
                : isWarning
                  ? "text-chart-4"
                  : "text-foreground"
            }`}
          >
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </span>
        </div>
        <Progress
          value={percentLeft}
          className="flex-1"
        />
      </div>
    </div>
  );
}
