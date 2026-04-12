import ThemeSwitcher from "@/components/ThemeSwitcher"
import ClerkUserButton from "@/components/ui/clerkUserButton"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

export function AppTopbar() {
  return (
    <header
      role="banner"
      aria-label="Application"
      className={cn(
        "sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/80"
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <SidebarTrigger className="shrink-0" />
        <Separator orientation="vertical" className="h-6 shrink-0" />
        <span className="truncate text-sm font-semibold tracking-tight text-foreground">
          FlaQ
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <ThemeSwitcher />
        <ClerkUserButton />
      </div>
    </header>
  )
}
