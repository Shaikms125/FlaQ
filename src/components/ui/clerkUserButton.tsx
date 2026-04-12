import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

function ClerkUserButton() {
  return (
    <div className="flex shrink-0 items-center justify-end gap-2">
      <Show when="signed-out">
        <SignInButton>
          <Button variant="outline" size="sm" className="h-8 shadow-xs">
            Sign in
          </Button>
        </SignInButton>
        <SignUpButton>
          <Button variant="default" size="sm" className="h-8">
            Sign up
          </Button>
        </SignUpButton>
      </Show>
      <Show when="signed-in">
        <UserButton
          appearance={{
            elements: {
              userButtonTrigger: cn(
                "flex size-8 shrink-0 items-center justify-center rounded-md border border-border bg-background shadow-xs outline-none",
                "hover:bg-muted focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              ),
              userButtonAvatarBox: "size-7",
            },
          }}
        />
      </Show>
    </div>
  )
}

export default ClerkUserButton
