import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { toast } from "sonner";
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
import { Separator } from "@/components/ui/separator";
import {
  IconShare,
  IconCopy,
  IconCheck,
  IconGlobe,
  IconLock,
  IconBrandX,
  IconBrandWhatsapp,
  IconMail,
  IconInfinity,
  IconCalendar,
} from "@tabler/icons-react";

interface ShareQuizProps {
  quizId: Id<"quizzes">;
  quizTitle: string;
  accessCode: string;
  isPublic: boolean;
  allowUnlimitedAttempts: boolean;
  availableFrom?: number;
  availableTo?: number;
  trigger?: React.ReactElement;
}

export function ShareQuiz({
  quizId,
  quizTitle,
  accessCode,
  isPublic: initialIsPublic,
  allowUnlimitedAttempts: initialUnlimited,
  availableFrom: initialAvailableFrom,
  availableTo: initialAvailableTo,
  trigger,
}: ShareQuizProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [publicState, setPublicState] = useState(initialIsPublic);
  const [unlimitedState, setUnlimitedState] = useState(initialUnlimited);
  const [availableFrom, setAvailableFrom] = useState(
    initialAvailableFrom ? new Date(initialAvailableFrom).toISOString().slice(0, 16) : ""
  );
  const [availableTo, setAvailableTo] = useState(
    initialAvailableTo ? new Date(initialAvailableTo).toISOString().slice(0, 16) : ""
  );
  const updateQuiz = useMutation(api.quiz.updateQuiz);

  const shareUrl = `${window.location.origin}/quiz/${accessCode}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTogglePublic = async (checked: boolean) => {
    setPublicState(checked);
    try {
      await updateQuiz({ quizId, isPublic: checked });
      toast.success(checked ? "Quiz is now public" : "Quiz is now private");
    } catch (e) {
      toast.error("Failed to update visibility: " + (e as Error).message);
      setPublicState(!checked);
    }
  };

  const handleToggleUnlimited = async (checked: boolean) => {
    setUnlimitedState(checked);
    try {
      await updateQuiz({ quizId, allowUnlimitedAttempts: checked });
      toast.success(checked ? "Unlimited attempts enabled" : "Limited to single attempt");
    } catch (e) {
      toast.error("Failed to update attempts: " + (e as Error).message);
      setUnlimitedState(!checked);
    }
  };

  const handleAvailabilityChange = async (field: "availableFrom" | "availableTo", value: string) => {
    if (field === "availableFrom") setAvailableFrom(value);
    else setAvailableTo(value);

    if (!value) return;

    try {
      const timestamp = new Date(value).getTime();
      await updateQuiz({ quizId, [field]: timestamp });
    } catch {
      toast.error("Failed to update availability");
    }
  };

  const twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Try this quiz: ${quizTitle}`)}&url=${encodeURIComponent(shareUrl)}`;
  const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(`Try this quiz: ${quizTitle}\n${shareUrl}`)}`;
  const emailShareUrl = `mailto:?subject=${encodeURIComponent(`Quiz: ${quizTitle}`)}&body=${encodeURIComponent(`Try this quiz!\n\n${shareUrl}`)}`;

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
            Manage access and share &ldquo;{quizTitle}&rdquo; with others.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <Label htmlFor="share-public-toggle" className="flex items-center gap-1.5">
                {publicState ? (
                  <IconGlobe className="size-4 text-chart-2" />
                ) : (
                  <IconLock className="size-4 text-muted-foreground" />
                )}
                Public Access
              </Label>
              <p className="text-sm text-muted-foreground">
                {publicState ? "Anyone with the link can access" : "Private access only"}
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
            <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-top-4">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <Label htmlFor="share-unlimited-toggle" className="flex items-center gap-1.5">
                    <IconInfinity className="size-4" />
                    Unlimited Attempts
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {unlimitedState
                      ? "Users can re-take for practice"
                      : "Single attempt only"}
                  </p>
                </div>
                <Switch
                  id="share-unlimited-toggle"
                  checked={unlimitedState}
                  onCheckedChange={handleToggleUnlimited}
                />
              </div>

              <Separator />

              <div className="flex flex-col gap-2">
                <Label className="flex items-center gap-1.5 font-medium text-sm">
                  <IconCalendar className="size-4 text-muted-foreground" />
                  Availability Window
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <Label className="text-[10px] text-muted-foreground uppercase">From</Label>
                    <Input
                      type="datetime-local"
                      value={availableFrom}
                      onChange={(e) => handleAvailabilityChange("availableFrom", e.target.value)}
                      className="text-xs"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-[10px] text-muted-foreground uppercase">Until</Label>
                    <Input
                      type="datetime-local"
                      value={availableTo}
                      onChange={(e) => handleAvailabilityChange("availableTo", e.target.value)}
                      className="text-xs"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex flex-col gap-2">
                <Label htmlFor="share-link">Share Link</Label>
                <div className="flex items-center gap-2">
                  <Input id="share-link" value={shareUrl} readOnly className="flex-1" />
                  <Button variant="outline" size="icon" onClick={handleCopy}>
                    {copied ? <IconCheck className="text-chart-2" /> : <IconCopy />}
                  </Button>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label className="text-sm">Share via</Label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(twitterShareUrl, "_blank", "noopener,noreferrer")}
                  >
                    <IconBrandX className="size-4" />
                    <span className="ml-1.5 text-xs">X</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(whatsappShareUrl, "_blank", "noopener,noreferrer")}
                  >
                    <IconBrandWhatsapp className="size-4" />
                    <span className="ml-1.5 text-xs">WhatsApp</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(emailShareUrl, "_blank")}
                  >
                    <IconMail className="size-4" />
                    <span className="ml-1.5 text-xs">Email</span>
                  </Button>
                </div>
              </div>
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
