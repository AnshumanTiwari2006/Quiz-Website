import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Trash2, ArrowLeft, FileQuestion } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Quiz {
  id: string;
  title: string;
  type: string;
  timer: number;
  questionCount: number;
}

const ManageQuizzes = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("adminLoggedIn");
    if (!isLoggedIn) {
      navigate("/admin/login");
    }
    loadQuizzes();
  }, [navigate]);

  const loadQuizzes = () => {
    const stored = localStorage.getItem("quizzes");
    if (stored) {
      setQuizzes(JSON.parse(stored));
    }
  };

  const confirmDelete = (id: string) => {
    setDeleteId(id);
  };

  const deleteQuiz = () => {
    if (!deleteId) return;
    
    const updated = quizzes.filter(q => q.id !== deleteId);
    localStorage.setItem("quizzes", JSON.stringify(updated));
    setQuizzes(updated);
    setDeleteId(null);
    
    toast({
      title: "Quiz Deleted",
      description: "Quiz has been removed successfully",
    });
  };

  return (
    <div className="min-h-screen gradient-bg">
      <header className="p-6 border-b border-border/40 bg-white/50 backdrop-blur">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 gradient-primary rounded-2xl flex items-center justify-center shadow-medium">
              <Brain className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold">Manage Quizzes</h1>
          </div>
          <Button 
            variant="outline" 
            onClick={() => navigate('/admin/dashboard')}
            className="rounded-full border-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {quizzes.length === 0 ? (
          <Card className="p-12 rounded-3xl shadow-soft text-center border-0 bg-white/80 backdrop-blur">
            <FileQuestion className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">No Quizzes Created Yet</h2>
            <p className="text-muted-foreground mb-6">Create your first quiz to get started!</p>
            <Button 
              onClick={() => navigate('/admin/create')}
              className="gradient-primary text-white rounded-xl"
            >
              Create Quiz
            </Button>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.map((quiz) => (
              <Card 
                key={quiz.id}
                className="p-6 rounded-3xl shadow-soft hover:shadow-medium transition-all border-0 bg-white/80 backdrop-blur"
              >
                <h3 className="text-xl font-bold mb-3">{quiz.title}</h3>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="secondary" className="rounded-full">
                    {quiz.type}
                  </Badge>
                  <Badge variant="outline" className="rounded-full">
                    {quiz.questionCount} Questions
                  </Badge>
                  {quiz.timer > 0 && (
                    <Badge variant="outline" className="rounded-full">
                      {Math.floor(quiz.timer / 60)} min
                    </Badge>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button 
                    variant="outline"
                    onClick={() => navigate(`/admin/edit/${quiz.id}`)}
                    className="flex-1 rounded-xl border-2 hover:bg-muted"
                  >
                    Edit
                  </Button>
                  <Button 
                    variant="destructive"
                    onClick={() => confirmDelete(quiz.id)}
                    className="flex-1 rounded-xl"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the quiz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={deleteQuiz}
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ManageQuizzes;
