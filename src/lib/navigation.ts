import { matchPath, type Location } from "react-router"

export type BreadcrumbItem = {
  label: string
  href: string
}

type BreadcrumbContext = {
  location: Location
  className?: string
  quizTitle?: string
}

type BreadcrumbRoute = {
  pattern: string
  build: (context: BreadcrumbContext) => BreadcrumbItem[]
}

const unknownClassLabel = "Class"
const unknownQuizLabel = "Quiz"

const breadcrumbRoutes: BreadcrumbRoute[] = [
  {
    pattern: "/",
    build: () => [{ label: "Home", href: "/" }],
  },
  {
    pattern: "/generate",
    build: ({ location, className }) => {
      const classId = new URLSearchParams(location.search).get("classId")

      if (classId) {
        return [
          { label: "Classes", href: "/classes" },
          { label: className ?? unknownClassLabel, href: `/classes/${classId}` },
          { label: "Create Quiz", href: `/generate?classId=${classId}` },
        ]
      }

      return [{ label: "Create Quiz", href: "/generate" }]
    },
  },
  {
    pattern: "/my-quizzes",
    build: () => [{ label: "My Quizzes", href: "/my-quizzes" }],
  },
  {
    pattern: "/my-quizzes/:quizId/edit",
    build: ({ location, quizTitle }) => {
      const match = matchPath("/my-quizzes/:quizId/edit", location.pathname)
      const quizId = match?.params.quizId

      return [
        { label: "My Quizzes", href: "/my-quizzes" },
        {
          label: quizTitle ?? unknownQuizLabel,
          href: quizId ? `/my-quizzes/${quizId}/edit` : location.pathname,
        },
        { label: "Edit", href: location.pathname },
      ]
    },
  },
  {
    pattern: "/my-quizzes/:quizId/scores",
    build: ({ location, quizTitle }) => {
      const match = matchPath("/my-quizzes/:quizId/scores", location.pathname)
      const quizId = match?.params.quizId

      return [
        { label: "My Quizzes", href: "/my-quizzes" },
        {
          label: quizTitle ?? unknownQuizLabel,
          href: quizId ? `/my-quizzes/${quizId}/edit` : location.pathname,
        },
        { label: "Scores", href: location.pathname },
      ]
    },
  },
  {
    pattern: "/classes",
    build: () => [{ label: "Classes", href: "/classes" }],
  },
  {
    pattern: "/classes/:classId",
    build: ({ location, className }) => [
      { label: "Classes", href: "/classes" },
      { label: className ?? unknownClassLabel, href: location.pathname },
    ],
  },
]

export function getBreadcrumbItems(context: BreadcrumbContext) {
  const route = breadcrumbRoutes.find(({ pattern }) =>
    matchPath({ path: pattern, end: true }, context.location.pathname)
  )

  return route?.build(context) ?? [{ label: "FlaQ", href: context.location.pathname }]
}
