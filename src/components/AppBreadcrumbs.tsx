import { Fragment, useMemo } from "react"
import { useQuery } from "convex/react"
import { Link, useLocation, useParams, useSearchParams } from "react-router"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { cn } from "@/lib/utils"
import { getBreadcrumbItems } from "@/lib/navigation"

const breadcrumbLabelClassName =
  "inline-block max-w-[10ch] truncate align-bottom sm:max-w-[18ch] lg:max-w-[28ch]"

export function AppBreadcrumbs() {
  const location = useLocation()
  const params = useParams()
  const [searchParams] = useSearchParams()

  const routeClassId = params.classId
  const contextualClassId = searchParams.get("classId")
  const classId = routeClassId ?? contextualClassId
  const quizId = params.quizId

  const classData = useQuery(
    api.classes.getClassDetails,
    classId ? { classId: classId as Id<"classes"> } : "skip"
  )
  const quizData = useQuery(
    api.quiz.getQuizWithQuestions,
    quizId ? { quizId: quizId as Id<"quizzes"> } : "skip"
  )

  const items = useMemo(
    () =>
      getBreadcrumbItems({
        location,
        className: classData?.name,
        quizTitle: quizData?.title,
      }),
    [classData?.name, location, quizData?.title]
  )

  return (
    <Breadcrumb className="min-w-0">
      <BreadcrumbList className="flex-nowrap overflow-hidden">
        {items.map((item, index) => {
          const isLast = index === items.length - 1

          return (
            <Fragment key={`${item.href}-${index}`}>
              <BreadcrumbItem className="min-w-0">
                {isLast ? (
                  <BreadcrumbPage
                    className={breadcrumbLabelClassName}
                    title={item.label}
                  >
                    {item.label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink
                    className={cn(breadcrumbLabelClassName, "block")}
                    title={item.label}
                    render={<Link to={item.href}>{item.label}</Link>}
                  />
                )}
              </BreadcrumbItem>
              {!isLast && (
                <BreadcrumbSeparator className="shrink-0" />
              )}
            </Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
