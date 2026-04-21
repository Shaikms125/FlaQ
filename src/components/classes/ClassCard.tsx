import { Link } from "react-router-dom";
import { Card, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Users } from "lucide-react";

interface ClassCardProps {
  id: string;
  name: string;
  description?: string;
  role: "teacher" | "student";
}

export function ClassCard({ id, name, description, role }: ClassCardProps) {
  return (
    <Link to={`/classes/${id}`} className="block transition-transform hover:scale-[1.02] h-full">
      <Card className="h-full flex flex-col justify-between hover:border-primary/50 group">
        <CardHeader>
          <div className="flex justify-between items-start gap-4">
            <CardTitle className="text-xl line-clamp-2 group-hover:text-primary transition-colors">{name}</CardTitle>
            <Badge variant={role === "teacher" ? "default" : "secondary"} className="shrink-0">
              {role === "teacher" ? "Teacher" : "Student"}
            </Badge>
          </div>
          {description && (
            <CardDescription className="line-clamp-3 mt-2">{description}</CardDescription>
          )}
        </CardHeader>
        <CardFooter className="text-sm text-muted-foreground pt-4 border-t mt-auto">
          <div className="flex items-center gap-2 pt-2">
            {role === "teacher" ? <BookOpen size={16} /> : <Users size={16} />}
            <span>View Class details</span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
