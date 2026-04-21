import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ClassCard } from "@/components/classes/ClassCard";
import { CreateClassDialog } from "@/components/classes/CreateClassDialog";
import { JoinClassDialog } from "@/components/classes/JoinClassDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardFooter } from "@/components/ui/card";
import { BookOpen } from "lucide-react";

export default function ClassesDashboard() {
  const classes = useQuery(api.classes.getMyClasses);

  return (
    <div className="container mx-auto py-8 max-w-7xl px-4 md:px-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Classes Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Manage your classes, assignments, and student progress in one place.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <JoinClassDialog />
          <CreateClassDialog />
        </div>
      </div>

      {classes === undefined ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="h-44 flex flex-col justify-between border-muted/60">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-5 w-16" />
                </div>
                <Skeleton className="h-4 w-full mt-3 opacity-70" />
                <Skeleton className="h-4 w-5/6 mt-2 opacity-70" />
              </CardHeader>
              <CardFooter className="pt-0 pb-4 border-t mt-auto text-muted-foreground">
                <Skeleton className="h-4 w-32 mt-4" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : classes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border rounded-xl bg-card/50 shadow-sm border-dashed">
          <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
            <BookOpen className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">No Classes Yet</h2>
          <p className="text-muted-foreground max-w-md mb-8">
            You aren't enrolled in or managing any classes yet. Join an existing class or create a new one to get started.
          </p>
          <div className="flex items-center gap-4">
            <JoinClassDialog />
            <CreateClassDialog />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
          {classes.filter((c): c is NonNullable<typeof c> => !!c).map((c) => (
            <ClassCard
              key={c._id}
              id={c._id}
              name={c.name}
              description={c.description}
              role={c.role as "teacher" | "student"}
            />
          ))}
        </div>
      )}
    </div>
  );
}
