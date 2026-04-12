import { IconDeviceDesktop, IconMoon, IconSun } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTheme } from "@/components/ThemeProvider"
import { cn } from "@/lib/utils"

export default function ThemeSwitcher() {
  const { setTheme, resolvedTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="icon-sm" className="size-8 rounded-md">
            <IconSun
              className={cn(
                "transition-all",
                resolvedTheme === "dark"
                  ? "-rotate-90 scale-0"
                  : "rotate-0 scale-100"
              )}
            />
            <IconMoon
              className={cn(
                "absolute transition-all",
                resolvedTheme === "dark"
                  ? "rotate-0 scale-100"
                  : "rotate-90 scale-0"
              )}
            />
            <span className="sr-only">Toggle theme</span>
          </Button>
        }
      />
      <DropdownMenuContent side="top" align="end" className="w-40">
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => setTheme("light")}>
            <IconSun />
            Light
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme("dark")}>
            <IconMoon />
            Dark
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme("system")}>
            <IconDeviceDesktop />
            System
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
