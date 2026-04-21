import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function CreateClassDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isInstitutional, setIsInstitutional] = useState(false);
  const [allowedDomain, setAllowedDomain] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createClass = useMutation(api.classes.createClass);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Class name is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const classId = await createClass({
        name: name.trim(),
        description: description.trim() || undefined,
        isInstitutional,
        allowedDomain: isInstitutional && allowedDomain.trim() ? allowedDomain.trim() : undefined,
      });

      toast.success("Class created successfully!");
      setOpen(false);
      // Reset form on success
      setName("");
      setDescription("");
      setIsInstitutional(false);
      setAllowedDomain("");

      // Navigate to the new class details page
      navigate(`/classes/${classId}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to create class");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Create Class
          </Button>
        }
      />
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create a New Class</DialogTitle>
            <DialogDescription>
              Create a class to assign quizzes and track student progress.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="name">
                Class Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Introduction to Physics"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this class about?"
                disabled={isSubmitting}
                className="resize-none"
              />
            </div>

            <div className="flex flex-row items-center justify-between rounded-lg border p-3 mt-2 hover:bg-accent/50 transition-colors">
              <div className="space-y-0.5">
                <Label htmlFor="institutional" className="cursor-pointer">Institutional Class</Label>
                <p className="text-xs text-muted-foreground mr-4">
                  Restrict access to users with a specific email domain.
                </p>
              </div>
              <Switch
                id="institutional"
                checked={isInstitutional}
                onCheckedChange={setIsInstitutional}
                disabled={isSubmitting}
              />
            </div>

            {isInstitutional && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                <Label htmlFor="domain">Allowed Domain</Label>
                <Input
                  id="domain"
                  value={allowedDomain}
                  onChange={(e) => setAllowedDomain(e.target.value)}
                  placeholder="e.g. @university.edu"
                  disabled={isSubmitting}
                />
                <p className="text-xs text-muted-foreground">
                  Only users with this email domain will be able to join via invite code.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Create Class
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
