import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Brain, User, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import { getQuizById } from "@/lib/quizLoader";

const QuizEntry = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [quiz, setQuiz] = useState<any>(null);

  useEffect(() => {
    const loadQuiz = async () => {
      if (quizId) {
        const found = await getQuizById(quizId);
        if (found) {
          setQuiz(found);
        } else {
          toast({
            title: "Quiz Not Found",
            description: "This quiz doesn't exist",
            variant: "destructive",
          });
          navigate("/quizzes");
        }
      }
    };
    loadQuiz();
  }, [quizId, navigate, toast]);

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter your name to continue",
        variant: "destructive",
      });
      return;
    }

    sessionStorage.setItem("studentName", name);
    navigate(`/quiz/${quizId}/play`);
  };

  if (!quiz) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <p className="text-lg">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-lg p-12 rounded-[2.5rem] border-0 bg-white shadow-strong ring-1 ring-border/50 animate-in fade-in zoom-in duration-500">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-soft">
            <Brain className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-extrabold mb-3 tracking-tight">{quiz.title}</h1>
          <p className="text-muted-foreground font-medium uppercase tracking-[0.2em] text-[10px]">Academic Assessment Entry</p>
        </div>

        <div className="mb-10 p-6 bg-primary/5 rounded-2xl border border-primary/10">
          <div className="grid grid-cols-2 gap-8 text-center divide-x divide-primary/10">
            <div>
              <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/60 mb-2">Total Items</p>
              <p className="text-3xl font-black text-primary">{quiz.questionCount}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/60 mb-2">Allocated Time</p>
              <p className="text-3xl font-black text-primary">
                {quiz.timer > 0 ? `${Math.floor(quiz.timer / 60)}m` : "∞"}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleStart} className="space-y-8">
          <div className="space-y-3">
            <Label htmlFor="name" className="text-[11px] uppercase font-bold tracking-widest text-primary/70 ml-1">Candidate Credentials</Label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-primary/40 w-5 h-5" />
              <Input
                id="name"
                type="text"
                autoFocus
                placeholder="Enter Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="pl-12 rounded-2xl border-2 border-border/50 h-16 text-lg font-bold focus:ring-primary/20 transition-all placeholder:text-muted-foreground/30 shadow-inner"
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-primary text-primary-foreground rounded-2xl h-16 shadow-strong hover:bg-primary/95 transition-all text-lg font-black tracking-tight"
          >
            AUTHORIZE & START
            <ArrowRight className="ml-3 h-5 w-5" />
          </Button>
        </form>

        <div className="mt-10 text-center">
          <Button
            variant="ghost"
            onClick={() => navigate('/quizzes')}
            className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors h-auto py-2"
          >
            ← Cancel Assessment
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default QuizEntry;
