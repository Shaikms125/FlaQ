import { createBrowserRouter, RouterProvider } from "react-router"
import RootLayout from "@/layouts/RootLayout"
import SignInPage from "@/pages/SignIn"
import SignUpPage from "@/pages/SignUp"
import ProtectedLayout from "./layouts/ProtectedLayout"
import MainLayout from "./layouts/MainLayout"
import About from "./pages/About"
import Home from "./pages/Home"

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      {
        path: "signin/*",
        element: <SignInPage />,
      },
      {
        path: "signup/*",
        element: <SignUpPage />,
      },
      {
        element: <ProtectedLayout />,
        children: [
          {
            path: "/",
            element: <MainLayout />,
            children: [
              {
                index: true,
                element: <Home />,
              },
              {
                path: "about",
                element: <About />,
              },
            ],
          },
        ]
      },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
