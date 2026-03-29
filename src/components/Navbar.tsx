import { Link, useLocation } from "react-router"
import ClerkUSerButton from "./ui/clerkUserButton"

export default function Navigation() {
  const location = useLocation()

  return (
    <nav className="bg-gray-100 p-4 dark:bg-gray-800">
      <div className="container mx-auto flex space-x-4">
        <Link
          to="/"
          className={`rounded-md px-3 py-2 text-sm font-medium ${
            location.pathname === "/"
              ? "bg-blue-600 text-white"
              : "text-gray-700 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700"
          }`}
        >
          Home
        </Link>
        <Link
          to="about"
          className={`rounded-md px-3 py-2 text-sm font-medium`}
        >
          About
        </Link>
        <Link
          to="/signin"
          className={`rounded-md px-3 py-2 text-sm font-medium `}
        >
          Sign In
        </Link>
        <Link
          to="/signup"
          className={`rounded-md px-3 py-2 text-sm font-medium `}
        >
          Sign Up
        </Link>
        <ClerkUSerButton />
      </div>
    </nav>
  )
}
