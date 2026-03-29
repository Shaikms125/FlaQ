import { Button } from "@/components/ui/button"

import { Show, SignInButton, SignUpButton, UserButton } from '@clerk/react'

export default function Home() {
  return (
    <div className="flex min-h-svh p-6">
      <header>
        <Show when="signed-out">
          <SignInButton />
          <SignUpButton />
        </Show>
        <Show when="signed-in">
          <UserButton />
        </Show>
      </header>
      <div className="flex max-w-md min-w-0 flex-col gap-4 text-sm leading-loose">
        <div>
          <h1 className="font-medium">Welcome to Quiz AI!</h1>
          <p>You may now add components and start building.</p>
          <p>We've already added the button component for you.</p>
          <Button className="mt-2">Button</Button>
        </div>
        <div className="font-mono text-xs text-muted-foreground">
          (Press <kbd>d</kbd> to toggle dark mode)
        </div>
      </div>
    </div>
  )
}
