import { useParams, Link } from "react-router-dom";
import { toast } from "sonner";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LayoutDashboard, Users, Activity, Play, Edit, BarChart, Plus, Trash } from "lucide-react";
import { TeacherAnalytics } from "@/components/classes/TeacherAnalytics";
import { StudentProgress } from "@/components/classes/StudentProgress";

export default function ClassDetail() {
  const { classId } = useParams<{ classId: Id<"classes"> }>();
  const deleteQuiz = useMutation(api.quiz.deleteQuiz);

  const data = useQuery(api.classes.getClassDetails, {
    classId: classId as Id<"classes">,
  });

  if (data === undefined) {
    return (
      <div className="container mx-auto py-8 max-w-7xl px-4 md:px-6">
        <Skeleton className="h-12 w-1/3 mb-4" />
        <Skeleton className="h-6 w-1/4 mb-8" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  const { name, description, role, roster, quizzes } = data;
  const isTeacher = role === "teacher";

  return (
    <div className="container mx-auto py-8 max-w-7xl px-4 md:px-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold tracking-tight">{name}</h1>
            <Badge variant={isTeacher ? "default" : "secondary"}>
              {isTeacher ? "Teacher" : "Student"}
            </Badge>
          </div>
          {description && <p className="text-muted-foreground max-w-2xl">{description}</p>}
        </div>

        {isTeacher && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button 
              onClick={() => {
                navigator.clipboard.writeText(data.inviteCode);
                toast.success("Invite code copied to clipboard!");
              }}
              className="flex flex-col items-center sm:items-end gap-1 px-4 py-2 bg-muted/50 rounded-lg border border-border/50 hover:bg-muted transition-colors cursor-pointer group w-full sm:w-auto"
              title="Click to copy invite code"
            >
              <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground group-hover:text-primary transition-colors">Class Invite Code</span>
              <span className="text-xl font-mono font-bold text-primary tracking-widest">{data.inviteCode}</span>
            </button>
            <Button
              className="h-12 px-6 gap-2 font-semibold w-full sm:w-auto"
              render={
                <Link to={`/generate?classId=${classId}`}>
                  <Plus size={20} /> Create Class Quiz
                </Link>
              }
            />
          </div>
        )}
      </div>

      <Tabs defaultValue="stream" className="w-full">
        <TabsList className="mb-6 h-auto min-h-12 bg-muted/30 p-1 flex-wrap sm:flex-nowrap justify-start overflow-x-auto">
          <TabsTrigger value="stream" className="flex items-center gap-2 text-sm sm:text-base px-4 sm:px-6 py-2">
            <LayoutDashboard size={18} /> Quizzes
          </TabsTrigger>
          <TabsTrigger value="members" className="flex items-center gap-2 text-sm sm:text-base px-4 sm:px-6 py-2">
            <Users size={18} /> Members
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2 text-sm sm:text-base px-4 sm:px-6 py-2 whitespace-nowrap">
            <Activity size={18} /> {isTeacher ? "Class Analytics" : "My Progress"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stream" className="animate-in fade-in zoom-in-95 duration-200">
          <div className="grid gap-4">
            {quizzes.length === 0 ? (
              <Card className="py-12 text-center bg-muted/20 border-dashed">
                <CardDescription className="text-lg">No quizzes assigned to this class yet.</CardDescription>
              </Card>
            ) : (
              quizzes.filter((q): q is NonNullable<typeof q> => !!q).map((quiz) => (
                <Card key={quiz._id} className="hover:border-primary/30 transition-colors">
                  <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-xl mb-1 truncate">{quiz.title}</CardTitle>
                      {quiz.description && (
                        <CardDescription className="line-clamp-2">{quiz.description}</CardDescription>
                      )}
                    </div>
                    {isTeacher ? (
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs"
                          render={
                            <Link to={`/my-quizzes/${quiz._id}/scores`}>
                              <BarChart size={14} className="mr-1.5" /> Analytics
                            </Link>
                          }
                        />
                        <Button
                          size="sm"
                          className="h-8 text-xs"
                          render={
                            <Link to={`/my-quizzes/${quiz._id}/edit`}>
                              <Edit size={14} className="mr-1.5" /> Edit
                            </Link>
                          }
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            if (window.confirm("Permanently delete this quiz?")) {
                              deleteQuiz({ quizId: quiz._id });
                              toast.success("Quiz deleted.");
                            }
                          }}
                        >
                          <Trash size={14} />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        className="w-full sm:w-auto"
                        onClick={() => window.open(`/quiz/${quiz.accessCode}`, "_blank")}
                      >
                        <Play size={16} className="mr-2" /> Take Quiz
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="text-xs sm:text-sm text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 mt-1">
                      {quiz.timeLimitSeconds && (
                        <span className="flex items-center gap-1.5">
                          Time: {Math.round(quiz.timeLimitSeconds / 60)} mins
                        </span>
                      )}
                      <span className="flex items-center gap-1.5">
                        Attempts: {quiz.allowUnlimitedAttempts ? "Unlimited" : `${quiz.maxAttempts || 1} Remaining`}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="members" className="animate-in fade-in zoom-in-95 duration-200">
          <Card>
            <CardHeader>
              <CardTitle>Class Members</CardTitle>
              <CardDescription>{roster.length} members total</CardDescription>
            </CardHeader>
            <CardContent className="p-0 sm:p-6">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[200px]">User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="hidden sm:table-cell">Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* Sort: Teachers first, then alphabetical by name */}
                    {[...roster].filter((m): m is NonNullable<typeof m> => !!m).sort((a, b) => {
                      if (a.role !== b.role) return a.role === "teacher" ? -1 : 1;
                      return a.name.localeCompare(b.name);
                    }).map((member) => (
                      <TableRow key={member._id}>
                        <TableCell className="flex items-center gap-3 py-4">
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarImage src={member.imageUrl} alt={member.name} />
                            <AvatarFallback>{member.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col min-w-0">
                            <span className="font-medium truncate">{member.name}</span>
                            <span className="text-xs text-muted-foreground truncate">{member.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={member.role === "teacher" ? "default" : "secondary"}>
                            {member.role === "teacher" ? "Teacher" : "Student"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm hidden sm:table-cell">
                          {new Date(member.joinedAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="animate-in fade-in zoom-in-95 duration-200">
          {isTeacher ? (
            <TeacherAnalytics classId={classId as Id<"classes">} />
          ) : (
            <StudentProgress classId={classId as Id<"classes">} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
