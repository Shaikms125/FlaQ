import { Outlet } from "react-router"
import AppSidebar from "@/components/AppSidebar"
import { AppTopbar } from "@/components/AppTopbar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

export default function MainLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppTopbar />
        <main className="flex min-h-0 flex-1 flex-col">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
