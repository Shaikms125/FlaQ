import logo from "@/assets/flaq.svg"
import { useNavigate, useLocation } from "react-router"
import { QuizGeneratorModal } from "@/components/QuizGeneratorModal"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { IconNotebook, IconHome } from "@tabler/icons-react"

export default function AppSidebar() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader className="border-b border-sidebar-border/50 bg-sidebar/50 backdrop-blur-sm">
        <div className="flex items-center gap-3 px-4 py-3 transition-all group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2">
          <div className="flex aspect-square size-9 items-center justify-center rounded-xl bg-linear-to-br from-indigo-500 via-purple-500 to-pink-500 ring-1 ring-white/10">
            <img src={logo} alt="FlaQ Logo" className="size-6 brightness-0 invert" />
          </div>
          <div className="flex flex-col gap-0 group-data-[collapsible=icon]:hidden">
            <span className="text-xl font-bold tracking-tight text-sidebar-foreground">
              FlaQ
            </span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <QuizGeneratorModal />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Home"
                  data-active={location.pathname === "/"}
                  onClick={() => navigate("/")}
                >
                  <IconHome />
                  <span>Home</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="My Quizzes"
                  data-active={location.pathname.startsWith("/my-quizzes")}
                  onClick={() => navigate("/my-quizzes")}
                >
                  <IconNotebook />
                  <span>My Quizzes</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
