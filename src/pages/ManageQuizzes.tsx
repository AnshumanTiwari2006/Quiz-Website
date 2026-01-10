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
import { useAuth } from "@/contexts/AuthContext";
import { collection, getDocs, deleteDoc, doc, query, where, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface ManagedQuiz extends Quiz {
  isStatic?: boolean;
}

const ManageQuizzes = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, loading: authLoading } = useAuth();
  const [quizzes, setQuizzes] = useState<ManagedQuiz[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const isAdminRole = ["admin", "moderator", "viewer"].includes(profile?.role || "");
    const isTeacher = profile?.role === "teacher";

    if (!authLoading && (!user || (!isTeacher && !isAdminRole))) {
      navigate("/admin/login");
      return;
    }
    loadQuizzes();
  }, [navigate, user, profile, authLoading]);

  const loadQuizzes = async () => {
    if (!user) return;
    try {
      const q = query(collection(db, "quizzes"), where("teacherId", "==", user.uid));
      const querySnapshot = await getDocs(q);
      const firestoreQuizzes = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ManagedQuiz[];

      setQuizzes(firestoreQuizzes);
    } catch (error: any) {
      toast({ title: "Load Error", description: error.message, variant: "destructive" });
    }
  };

  const confirmDelete = (id: string) => {
    setDeleteId(id);
  };

  const deleteQuiz = async () => {
    if (!deleteId) return;

    try {
      await deleteDoc(doc(db, "quizzes", deleteId));
      setQuizzes(quizzes.filter(q => q.id !== deleteId));
      toast({
        title: "Cloud Registry Updated",
        description: "Quiz permanently purged from the database.",
      });
    } catch (error: any) {
      toast({ title: "Delete Error", description: error.message, variant: "destructive" });
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <Navbar />

      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Manage Quizzes</h2>
            <p className="text-sm text-muted-foreground font-medium">Cloud Inventory Control</p>
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
            <h2 className="text-2xl font-bold mb-3 tracking-tight text-foreground">No Cloud Quizzes</h2>
            <p className="text-muted-foreground text-base mb-8 font-medium">Create your first quiz to begin building your cloud inventory!</p>
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
                  <FileQuestion className="w-5 h-5 text-primary group-hover:text-white" />
                </div>
                <h3 className="text-xl font-bold mb-4 tracking-tight text-foreground group-hover:text-primary transition-colors line-clamp-2 min-h-[3.5rem]">{quiz.title}</h3>

                <div className="flex flex-wrap gap-2 mb-8">
                  <Badge className="bg-secondary text-primary border-0 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest group-hover:bg-primary/10 transition-colors">
                    Cloud Active
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
                  <Button
                    variant="ghost"
                    onClick={() => confirmDelete(quiz.id)}
                    className="flex-1 rounded-xl text-destructive hover:bg-destructive hover:text-white font-bold text-[10px] uppercase tracking-widest h-10 transition-all"
                  >
                    <Trash2 className="mr-2 h-3.5 w-3.5" />
                    Purge
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="rounded-[2rem] border-0 ring-1 ring-border/50 shadow-strong p-8">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black tracking-tight">Cloud Deletion Request</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground font-medium text-lg leading-relaxed pt-2">
              This will permanently remove the quiz from the cloud database. Students will no longer be able to take it.
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
