import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { IconClock, IconGlobe, IconLock } from "@tabler/icons-react";
import { useState, useRef, useCallback, useEffect } from "react";

interface QuizSettingsPanelProps {
  quizId: Id<"quizzes">;
  isPublic: boolean;
  timeLimitSeconds: number | undefined;
  allowUnlimitedAttempts: boolean;
  maxAttempts: number | undefined;
}

export function QuizSettingsPanel({
  quizId,
  isPublic,
  timeLimitSeconds,
  allowUnlimitedAttempts,
  maxAttempts,
}: QuizSettingsPanelProps) {
  const [publicState, setPublicState] = useState(isPublic);
  const [hasTimeLimit, setHasTimeLimit] = useState(!!timeLimitSeconds);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(
    timeLimitSeconds ? Math.floor(timeLimitSeconds / 60) : 10
  );
  const [unlimitedAttempts, setUnlimitedAttempts] = useState(allowUnlimitedAttempts);
  const [maxAttemptsValue, setMaxAttemptsValue] = useState(maxAttempts ?? 3);

  const updateQuiz = useMutation(api.quiz.updateQuiz);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleAutoSave = useCallback(
    (updates: Record<string, unknown>) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          await updateQuiz({ quizId, ...updates } as Parameters<typeof updateQuiz>[0]);
        } catch (e) {
          console.error("Failed to save settings:", e);
        }
      }, 800);
    },
    [quizId, updateQuiz]
  );

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  const handlePublicToggle = (checked: boolean) => {
    setPublicState(checked);
    scheduleAutoSave({ isPublic: checked });
  };

  const handleTimeLimitToggle = (checked: boolean) => {
    setHasTimeLimit(checked);
    scheduleAutoSave({
      timeLimitSeconds: checked ? timeLimitMinutes * 60 : undefined,
    });
  };

  const handleTimeLimitChange = (value: string) => {
    const mins = parseInt(value) || 0;
    setTimeLimitMinutes(mins);
    scheduleAutoSave({ timeLimitSeconds: mins * 60 });
  };

  const handleUnlimitedAttemptsToggle = (checked: boolean) => {
    setUnlimitedAttempts(checked);
    scheduleAutoSave({
      allowUnlimitedAttempts: checked,
      maxAttempts: checked ? undefined : maxAttemptsValue,
    });
  };

  const handleMaxAttemptsChange = (value: string) => {
    const val = parseInt(value) || 1;
    setMaxAttemptsValue(val);
    scheduleAutoSave({ maxAttempts: val });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Visibility */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            {publicState ? (
              <IconGlobe className="text-chart-2" />
            ) : (
              <IconLock className="text-muted-foreground" />
            )}
            Visibility
          </CardTitle>
          <CardDescription>
            Control who can access your quiz
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <Label htmlFor="settings-public-toggle">Public Access</Label>
              <p className="text-sm text-muted-foreground">
                Anyone with the link can take this quiz
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={publicState ? "default" : "secondary"}>
                {publicState ? "Public" : "Private"}
              </Badge>
              <Switch
                id="settings-public-toggle"
                checked={publicState}
                onCheckedChange={handlePublicToggle}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Time Limit */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <IconClock className="text-muted-foreground" />
            Time Limit
          </CardTitle>
          <CardDescription>
            Set a countdown timer for quiz takers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="settings-time-toggle">Enable Time Limit</Label>
              <Switch
                id="settings-time-toggle"
                checked={hasTimeLimit}
                onCheckedChange={handleTimeLimitToggle}
              />
            </div>
            {hasTimeLimit && (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  max={180}
                  value={timeLimitMinutes}
                  onChange={(e) => handleTimeLimitChange(e.target.value)}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">minutes</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Attempts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Attempt Limits</CardTitle>
          <CardDescription>
            How many times can someone take this quiz
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="settings-unlimited-toggle">Unlimited Attempts</Label>
              <Switch
                id="settings-unlimited-toggle"
                checked={unlimitedAttempts}
                onCheckedChange={handleUnlimitedAttemptsToggle}
              />
            </div>
            {!unlimitedAttempts && (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={maxAttemptsValue}
                  onChange={(e) => handleMaxAttemptsChange(e.target.value)}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">attempts max</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
