import { Outlet } from "react-router"
import { ConvexProvider, ConvexReactClient } from "convex/react"
import { ClerkProvider, useAuth } from "@clerk/react-router"
import { ConvexProviderWithClerk } from "convex/react-clerk"
import { ThemeProvider } from "@/components/ThemeProvider"

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ?? ""
if (!PUBLISHABLE_KEY) {
  console.error(
    "Missing Clerk publishable key. Add VITE_CLERK_PUBLISHABLE_KEY to .env"
  )
}

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string)

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <ThemeProvider>
          <ConvexProvider client={convex}>
            <Outlet />
          </ConvexProvider>
        </ThemeProvider>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  )
}
