import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  role: "user" | "ai" | "system";
  content?: string;
  children?: ReactNode;
}

export function ChatMessage({ role, content, children }: ChatMessageProps) {
  if (role === "system") {
    return (
      <div className="flex justify-center py-2">
        <div className="rounded-full bg-muted px-4 py-1.5 text-xs text-muted-foreground">
          {content}
        </div>
      </div>
    );
  }

  if (role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm text-primary-foreground">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div
        className={cn(
          "max-w-[85%] rounded-2xl rounded-bl-md bg-muted px-4 py-2.5 text-sm",
          children ? "min-w-[200px]" : ""
        )}
      >
        {content && <p>{content}</p>}
        {children}
      </div>
    </div>
  );
}

export function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-muted px-4 py-3">
        <span className="size-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:0ms]" />
        <span className="size-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:150ms]" />
        <span className="size-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:300ms]" />
      </div>
    </div>
  );
}
