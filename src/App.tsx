import { Button } from "@/components/ui/button"
import { useQuery } from "convex/react"
import { api } from "../convex/_generated/api"
import { Routes, Route, Link, useLocation } from "react-router-dom"
import { Show, SignInButton, SignUpButton, UserButton } from '@clerk/react'
import SignInPage from "./pages/SignIn"
import SignUpPage from "./pages/SignUp"

// Home Component
export function Home() {
  const tasks = useQuery(api.tasks.get)

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
      <div className="App">
        {tasks?.map(({ _id, text }) => (
          <Button key={_id}>{text}</Button>
        ))}
      </div>
    </div>
  )
}

// About Component
export function About() {
  return (
    <div className="flex min-h-svh p-6">
      <div className="flex max-w-md min-w-0 flex-col gap-4 text-sm leading-loose">
        <div>
          <h1 className="font-medium">About Quiz AI</h1>
          <p>This is the about page of your Quiz AI application.</p>
          <p>Use the navigation above to explore different sections.</p>
        </div>
      </div>
    </div>
  )
}

// Navigation Component
function Navigation() {
  const location = useLocation()
  
  return (
    <nav className="bg-gray-100 dark:bg-gray-800 p-4">
      <div className="container mx-auto flex space-x-4">
        <Link 
          to="/" 
          className={`px-3 py-2 rounded-md text-sm font-medium ${
            location.pathname === '/' 
              ? 'bg-blue-600 text-white' 
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          Home
        </Link>
        <Link 
          to="/about" 
          className={`px-3 py-2 rounded-md text-sm font-medium ${
            location.pathname === '/about' 
              ? 'bg-blue-600 text-white' 
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          About
        </Link>
        <Link 
          to="/sign-in" 
          className={`px-3 py-2 rounded-md text-sm font-medium ${
            location.pathname === '/sign-in' 
              ? 'bg-blue-600 text-white' 
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          Sign In
        </Link>
        <Link 
          to="/sign-up" 
          className={`px-3 py-2 rounded-md text-sm font-medium ${
            location.pathname === '/sign-up' 
              ? 'bg-blue-600 text-white' 
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          Sign Up
        </Link>
      </div>
    </nav>
  )
}

export function App() {
  return (
    <div className="App">
      <Navigation />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/sign-in" element={<SignInPage />} />
        <Route path="/sign-up" element={<SignUpPage />} />
      </Routes>
    </div>
  )
}

export default App
