import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Trash2, ArrowLeft, FileQuestion, Download, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { fetchQuizzes, Quiz } from "@/lib/quizLoader";
import Navbar from "@/components/Navbar";
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

interface ManagedQuiz extends Quiz {
  isStatic?: boolean;
}

const ManageQuizzes = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [quizzes, setQuizzes] = useState<ManagedQuiz[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("adminLoggedIn");
    if (!isLoggedIn) {
      navigate("/admin/login");
    }
    loadQuizzes();
  }, [navigate]);

  const loadQuizzes = async () => {
    const staticQuizzes = await fetchQuizzes();
    const formattedStatic: ManagedQuiz[] = staticQuizzes.map(q => ({ ...q, isStatic: true }));

    const stored = localStorage.getItem("quizzes");
    const localQuizzes: ManagedQuiz[] = stored ? JSON.parse(stored) : [];

    // Combine them, avoiding duplicates by ID (Static first, then add local if not already there)
    const combined = [...formattedStatic];
    localQuizzes.forEach(lq => {
      if (!combined.find(sq => sq.id === lq.id)) {
        combined.push(lq);
      }
    });

    setQuizzes(combined);
  };

  const confirmDelete = (id: string) => {
    setDeleteId(id);
  };

  const deleteQuiz = () => {
    if (!deleteId) return;

    const updated = quizzes.filter(q => q.id !== deleteId);
    localStorage.setItem("quizzes", JSON.stringify(updated.filter(q => !q.isStatic)));
    setQuizzes(updated);
    setDeleteId(null);

    toast({
      title: "Quiz Deleted",
      description: "Quiz has been removed successfully",
    });
  };

  const exportToJson = () => {
    const data = { quizzes };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "quizzes.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Export Ready",
      description: "Quizzes exported to JSON. Replace 'public/quizzes.json' with this file.",
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <Navbar
        extraLinks={[
          { label: "Export JSON", onClick: exportToJson, icon: Download }
        ]}
      />

      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Manage Quizzes</h2>
            <p className="text-sm text-muted-foreground font-medium">Inventory Control and Registry Management</p>
          </div>
          <Button
            variant="ghost"
            onClick={() => navigate('/admin/dashboard')}
            className="rounded-full font-bold text-xs uppercase tracking-widest text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all px-6 hidden md:flex"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>

        {quizzes.length === 0 ? (
          <Card className="p-12 rounded-[2.5rem] shadow-soft text-center border-0 bg-background ring-1 ring-border/50 max-w-2xl mx-auto box-content">
            <FileQuestion className="w-16 h-16 text-primary/20 mx-auto mb-6" />
            <h2 className="text-2xl font-bold mb-3 tracking-tight text-foreground">No Quizzes Found</h2>
            <p className="text-muted-foreground text-base mb-8 font-medium">Create your first quiz to begin tracking performance.</p>
            <Button
              onClick={() => navigate('/admin/create')}
              className="bg-primary text-primary-foreground rounded-full px-10 h-14 font-bold tracking-tight shadow-strong hover:scale-[1.05] transition-all border-0"
            >
              Create New Quiz
            </Button>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.map((quiz) => (
              <Card
                key={quiz.id}
                className="p-6 rounded-3xl shadow-soft border-0 bg-background ring-1 ring-border/50 group hover:ring-primary/20 transition-all"
              >
                <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary transition-all duration-300">
                  {quiz.isStatic ? (
                    <Lock className="w-5 h-5 text-primary group-hover:text-white" />
                  ) : (
                    <FileQuestion className="w-5 h-5 text-primary group-hover:text-white" />
                  )}
                </div>
                <h3 className="text-xl font-bold mb-4 tracking-tight text-foreground group-hover:text-primary transition-colors line-clamp-2 min-h-[3.5rem]">{quiz.title}</h3>

                <div className="flex flex-wrap gap-2 mb-8">
                  <Badge className="bg-secondary text-primary border-0 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest group-hover:bg-primary/10 transition-colors">
                    {quiz.isStatic ? "System" : "Custom"}
                  </Badge>
                  <Badge variant="outline" className="border-border/40 bg-transparent rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground group-hover:border-primary/20 transition-colors">
                    {quiz.questionCount} Items
                  </Badge>
                </div>

                <div className="flex gap-2 pt-6 border-t border-border/20">
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/admin/edit/${quiz.id}`)}
                    className="flex-1 rounded-xl border-secondary font-bold text-[10px] uppercase tracking-widest hover:bg-primary hover:text-white hover:border-primary transition-all h-10 text-foreground"
                  >
                    Edit
                  </Button>
                  {!quiz.isStatic ? (
                    <Button
                      variant="ghost"
                      onClick={() => confirmDelete(quiz.id)}
                      className="flex-1 rounded-xl text-destructive hover:bg-destructive hover:text-white font-bold text-[10px] uppercase tracking-widest h-10 transition-all"
                    >
                      <Trash2 className="mr-2 h-3.5 w-3.5" />
                      Purge
                    </Button>
                  ) : (
                    <div className="flex-1 text-center py-2 text-[8px] font-bold uppercase tracking-tight text-muted-foreground/50 italic flex items-center justify-center gap-2">
                      Locked Registry
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="rounded-[2rem] border-0 ring-1 ring-border/50 shadow-strong p-8">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black tracking-tight">System Confirmation Required</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground font-medium text-lg leading-relaxed pt-2">
              This operation is irreversible. All module data and associated performance metrics will be permanently purged from the registry.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-6 gap-3">
            <AlertDialogCancel className="rounded-full px-8 h-14 font-bold border-2">ABORT</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteQuiz}
              className="rounded-full px-8 h-14 bg-destructive text-destructive-foreground hover:bg-destructive/90 font-black"
            >
              CONFIRM PURGE
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ManageQuizzes;
