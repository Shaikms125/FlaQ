import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { IconShare, IconCopy, IconCheck } from "@tabler/icons-react";
import { useState } from "react";

interface ShareDialogProps {
  quizId: Id<"quizzes">;
  accessCode: string;
  isPublic: boolean;
  trigger?: React.ReactElement;
}

export function ShareDialog({ quizId, accessCode, isPublic, trigger }: ShareDialogProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [publicState, setPublicState] = useState(isPublic);
  const updateQuiz = useMutation(api.quiz.updateQuiz);

  const shareUrl = `${window.location.origin}/quiz/${accessCode}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTogglePublic = async (checked: boolean) => {
    setPublicState(checked);
    await updateQuiz({ quizId, isPublic: checked });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          trigger ?? (
            <Button variant="outline" size="sm">
              <IconShare data-icon="inline-start" />
              Share
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Quiz</DialogTitle>
          <DialogDescription>
            Make your quiz public so anyone with the link can take it.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <Label htmlFor="share-public-toggle">Public Access</Label>
              <p className="text-sm text-muted-foreground">
                Allow anyone with the link to take this quiz
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={publicState ? "default" : "secondary"}>
                {publicState ? "Public" : "Private"}
              </Badge>
              <Switch
                id="share-public-toggle"
                checked={publicState}
                onCheckedChange={handleTogglePublic}
              />
            </div>
          </div>

          {publicState && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="share-link">Share Link</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="share-link"
                  value={shareUrl}
                  readOnly
                  className="flex-1"
                />
                <Button variant="outline" size="icon" onClick={handleCopy}>
                  {copied ? (
                    <IconCheck className="text-chart-2" />
                  ) : (
                    <IconCopy />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Anyone with this link can take the quiz. They need to log in to submit their score.
              </p>
            </div>
          )}

          {!publicState && (
            <div className="rounded-lg border border-border bg-muted/50 p-4 text-center">
              <p className="text-sm text-muted-foreground">
                Toggle public access to generate a shareable link.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
