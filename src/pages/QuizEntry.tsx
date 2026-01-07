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
    <div className="min-h-screen gradient-bg flex items-center justify-center p-6">
      <Card className="w-full max-w-md p-8 rounded-3xl shadow-strong border-0 bg-white/90 backdrop-blur animate-scale-in">
        <div className="text-center mb-8">
          <div className="w-20 h-20 gradient-primary rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-medium animate-pulse-slow">
            <Brain className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2">{quiz.title}</h1>
          <p className="text-muted-foreground">Get ready to test your knowledge!</p>
        </div>

        <div className="mb-8 p-4 bg-muted/50 rounded-2xl">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-sm text-muted-foreground">Questions</p>
              <p className="text-2xl font-bold">{quiz.questionCount}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Time Limit</p>
              <p className="text-2xl font-bold">
                {quiz.timer > 0 ? `${Math.floor(quiz.timer / 60)} min` : "No Limit"}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleStart} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">Your Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                id="name"
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="pl-10 rounded-xl border-2 h-12"
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full gradient-primary text-white rounded-xl h-12 text-base shadow-medium hover:shadow-strong transition-all hover:scale-105"
          >
            Start Quiz
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Button
            variant="ghost"
            onClick={() => navigate('/quizzes')}
            className="text-sm rounded-full"
          >
            ← Back to Quizzes
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default QuizEntry;
