import { useAuth } from "@clerk/react-router"
import { Outlet, Navigate } from "react-router"
import { useCurrentUser } from "../useCurrentUser"

export default function ProtectedLayout() {
  const { isLoaded, userId } = useAuth()
  const { isLoading: isConvexLoading } = useCurrentUser()

  if (!isLoaded || isConvexLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        Loading...
      </div>
    )
  }
  if (!userId) {
    return <Navigate to="/signin" replace />
  }

  return <Outlet />
}
