import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/react"

function ClerkUserButton() {
  return (
    <div>
      <Show when="signed-out">
        <SignInButton />
        <SignUpButton />
      </Show>
      <Show when="signed-in">
        <UserButton />
      </Show>
    </div>
  )
}

export default ClerkUserButton
