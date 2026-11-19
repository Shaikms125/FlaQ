import { useState } from "react"
import { Link, useNavigate, useLocation } from "react-router"
import { useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import { toast } from "sonner"
import logo from "@/assets/flaq.svg"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ShareQuiz } from "@/components/quiz/ShareQuiz"
import { DeleteQuizDialog } from "@/components/quiz/DeleteQuizDialog"
import {
  IconNotebook,
  IconHome,
  IconWand,
  IconSchool,
  IconDotsVertical,
  IconChevronRight,
  IconPencil,
  IconChartBar,
  IconShare,
  IconTrash,
  IconCopy,
} from "@tabler/icons-react"

type SidebarQuiz = {
  _id: Id<"quizzes">
  title: string
  accessCode: string
  isPublic: boolean
  allowUnlimitedAttempts: boolean
  availableFrom?: number
  availableTo?: number
}

type SidebarClass = {
  _id: Id<"classes">
  name: string
  inviteCode: string
  role: "teacher" | "student"
}

// Dimmer menu text; items brighten to accent-foreground on focus/hover (component handles it).
const itemMenuContentClassName = "text-foreground/75 ring-sidebar-border"

export default function AppSidebar() {
  const navigate = useNavigate()
  const location = useLocation()

  const quizzesResult = useQuery(api.quiz.getQuizzes, {
    paginationOpts: { cursor: null, numItems: 4 },
  })
  const classes = useQuery(api.classes.getMyClasses)

  const [shareTarget, setShareTarget] = useState<SidebarQuiz | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<SidebarQuiz | null>(null)

  const recentQuizzes = quizzesResult?.page.slice(0, 4) ?? []
  const recentClasses = classes?.slice(0, 4) ?? []

  const copyInviteCode = async (cls: SidebarClass) => {
    try {
      await navigator.clipboard.writeText(cls.inviteCode)
      toast.success(`Invite code for “${cls.name}” copied`)
    } catch {
      toast.error("Failed to copy invite code")
    }
  }

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader>
        <div className="flex items-center gap-2.5 px-2 py-1 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary shadow-xs">
            <img src={logo} alt="FlaQ Logo" className="size-4 brightness-0 invert" />
          </div>
          <div className="flex min-w-0 flex-col group-data-[collapsible=icon]:hidden">
            <span className="truncate text-sm leading-tight font-semibold tracking-tight">
              FlaQ
            </span>
            <span className="truncate text-xs leading-tight text-muted-foreground">
              Create, edit, and share
            </span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Create Quiz"
                  onClick={() => {
                    navigate("/generate")
                  }}
                  className="h-9 bg-sidebar-primary text-sidebar-primary-foreground shadow-xs hover:bg-sidebar-primary/90 hover:text-sidebar-primary-foreground data-active:bg-sidebar-primary data-active:text-sidebar-primary-foreground"
                >
                  <IconWand />
                  <span>Create Quiz</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Home"
                  isActive={location.pathname === "/"}
                  onClick={() => navigate("/")}
                >
                  <IconHome />
                  <span>Home</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* My Quizzes: button navigates, chevron toggles the section */}
              <Collapsible defaultOpen className="group/collapsible">
                <SidebarMenuItem>
                  <SidebarMenuButton
                    tooltip="My Quizzes"
                    isActive={location.pathname.startsWith("/my-quizzes")}
                    onClick={() => navigate("/my-quizzes")}
                  >
                    <IconNotebook />
                    <span>My Quizzes</span>
                  </SidebarMenuButton>
                  <CollapsibleTrigger render={
                    <SidebarMenuAction
                      aria-label="Toggle My Quizzes section"
                      className="group/toggle top-1 w-6"
                    >
                      <IconChevronRight className="origin-center transition-transform duration-200 group-data-[panel-open]/toggle:rotate-90" />
                    </SidebarMenuAction>
                  } />
                  <CollapsibleContent className="overflow-hidden transition-[height] duration-200 ease-out data-closed:opacity-0 data-open:opacity-100">
                    <SidebarMenuSub className="border-dotted border-l-2 border-sidebar-foreground/20">
                      {quizzesResult === undefined &&
                        [0, 1].map((i) => <SidebarMenuSkeleton key={i} className="ml-6 w-40" />)}
                      {quizzesResult !== undefined &&
                        recentQuizzes.map((quiz) => {
                          const to = `/my-quizzes/${quiz._id}/edit`
                          return (
                            <SidebarMenuSubItem key={quiz._id}>
                              <SidebarMenuSubButton
                                isActive={location.pathname.startsWith(`/my-quizzes/${quiz._id}`)}
                                className="pr-6 text-sidebar-foreground/70"
                                render={<Link to={to} title={quiz.title}>
                                  <span>{quiz.title}</span>
                                </Link>}
                              />
                              <DropdownMenu>
                                <DropdownMenuTrigger
                                  render={
                                    <SidebarMenuAction
                                      aria-label={`Options for ${quiz.title}`}
                                      className="text-sidebar-foreground/40 group-hover/menu-sub-item:text-sidebar-foreground group-focus-within/menu-sub-item:text-sidebar-foreground aria-expanded:text-sidebar-foreground"
                                    >
                                      <IconDotsVertical />
                                    </SidebarMenuAction>
                                  }
                                />
                                <DropdownMenuContent align="start" side="right" className={itemMenuContentClassName}>
                                  <DropdownMenuItem onClick={() => navigate(to)}>
                                    <IconPencil />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => navigate(`/my-quizzes/${quiz._id}/scores`)}>
                                    <IconChartBar />
                                    Scores
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => setShareTarget(quiz)}>
                                    <IconShare />
                                    Share
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem variant="destructive" onClick={() => setDeleteTarget(quiz)}>
                                    <IconTrash />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </SidebarMenuSubItem>
                          )
                        })}
                      {quizzesResult !== undefined && recentQuizzes.length === 0 && (
                        <SidebarMenuSubItem>
                          <span className="flex h-7 items-center px-2 text-xs text-muted-foreground">
                            No quizzes yet
                          </span>
                        </SidebarMenuSubItem>
                      )}
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton size="sm" className="text-muted-foreground" render={
                          <Link to="/my-quizzes">
                            <span>View all</span>
                          </Link>
                        } />
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              {/* Classes: button navigates, chevron toggles the section */}
              <Collapsible defaultOpen className="group/collapsible">
                <SidebarMenuItem>
                  <SidebarMenuButton
                    tooltip="Classes"
                    isActive={location.pathname.startsWith("/classes")}
                    onClick={() => navigate("/classes")}
                  >
                    <IconSchool />
                    <span>Classes</span>
                  </SidebarMenuButton>
                  <CollapsibleTrigger render={
                    <SidebarMenuAction
                      aria-label="Toggle Classes section"
                      className="group/toggle top-1 w-6"
                    >
                      <IconChevronRight className="origin-center transition-transform duration-200 group-data-[panel-open]/toggle:rotate-90" />
                    </SidebarMenuAction>
                  } />
                  <CollapsibleContent className="overflow-hidden transition-[height] duration-200 ease-out data-closed:opacity-0 data-open:opacity-100">
                    <SidebarMenuSub className="border-dotted border-l-2 border-sidebar-foreground/20">
                      {classes === undefined &&
                        [0, 1].map((i) => <SidebarMenuSkeleton key={i} className="ml-6 w-40" />)}
                      {classes !== undefined &&
                        recentClasses.map((cls) => {
                          const to = `/classes/${cls._id}`
                          return (
                            <SidebarMenuSubItem key={cls._id}>
                              <SidebarMenuSubButton
                                isActive={location.pathname.startsWith(`/classes/${cls._id}`)}
                                className="pr-6 text-sidebar-foreground/70"
                                render={<Link to={to} title={cls.name}>
                                  <span>{cls.name}</span>
                                </Link>}
                              />
                              <DropdownMenu>
                                <DropdownMenuTrigger
                                  render={
                                    <SidebarMenuAction
                                      aria-label={`Options for ${cls.name}`}
                                      className="text-sidebar-foreground/40 group-hover/menu-sub-item:text-sidebar-foreground group-focus-within/menu-sub-item:text-sidebar-foreground aria-expanded:text-sidebar-foreground"
                                    >
                                      <IconDotsVertical />
                                    </SidebarMenuAction>
                                  }
                                />
                                <DropdownMenuContent align="start" side="right" className={itemMenuContentClassName}>
                                  <DropdownMenuItem onClick={() => navigate(to)}>
                                    <IconSchool />
                                    Open
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => copyInviteCode(cls)}>
                                    <IconCopy />
                                    Copy invite code
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </SidebarMenuSubItem>
                          )
                        })}
                      {classes !== undefined && recentClasses.length === 0 && (
                        <SidebarMenuSubItem>
                          <span className="flex h-7 items-center px-2 text-xs text-muted-foreground">
                            No classes yet
                          </span>
                        </SidebarMenuSubItem>
                      )}
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton size="sm" className="text-muted-foreground" render={
                          <Link to="/classes">
                            <span>View all</span>
                          </Link>
                        } />
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />

      {/* Shared dialogs opened from the sidebar item menus */}
      {shareTarget && (
        <ShareQuiz
          quizId={shareTarget._id}
          quizTitle={shareTarget.title}
          accessCode={shareTarget.accessCode}
          isPublic={shareTarget.isPublic}
          allowUnlimitedAttempts={shareTarget.allowUnlimitedAttempts}
          availableFrom={shareTarget.availableFrom}
          availableTo={shareTarget.availableTo}
          open
          onOpenChange={(open) => {
            if (!open) setShareTarget(null)
          }}
          trigger={null}
        />
      )}
      {deleteTarget && (
        <DeleteQuizDialog
          quizId={deleteTarget._id}
          quizTitle={deleteTarget.title}
          open
          onOpenChange={(open) => {
            if (!open) setDeleteTarget(null)
          }}
          trigger={null}
        />
      )}
    </Sidebar>
  )
}
