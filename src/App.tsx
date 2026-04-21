import { createBrowserRouter, RouterProvider } from "react-router"
import RootLayout from "@/layouts/RootLayout"
import SignInPage from "@/pages/SignIn"
import SignUpPage from "@/pages/SignUp"
import ProtectedLayout from "./layouts/ProtectedLayout"
import MainLayout from "./layouts/MainLayout"
import Home from "./pages/Home"
import MyQuizzes from "./pages/MyQuizzes"
import QuizEditor from "./pages/QuizEditor"
import QuizScores from "./pages/QuizScores"
import PublicQuizTaker from "./pages/PublicQuizTaker"
import GenerateQuiz from "./pages/GenerateQuiz"
import ClassesDashboard from "./pages/ClassesDashboard"
import ClassDetail from "./pages/ClassDetail"

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
      // Public quiz route — no authentication required
      {
        path: "quiz/:accessCode",
        element: <PublicQuizTaker />,
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
                path: "generate",
                element: <GenerateQuiz />,
              },
              {
                path: "my-quizzes",
                element: <MyQuizzes />,
              },
              {
                path: "my-quizzes/:quizId/edit",
                element: <QuizEditor />,
              },
              {
                path: "my-quizzes/:quizId/scores",
                element: <QuizScores />,
              },
              {
                path: "classes",
                element: <ClassesDashboard />,
              },
              {
                path: "classes/:classId",
                element: <ClassDetail />,
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
