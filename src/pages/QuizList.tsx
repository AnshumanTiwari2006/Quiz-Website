import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Brain, Clock, FileQuestion, ArrowRight, Home } from "lucide-react";

import { fetchQuizzes, Quiz } from "@/lib/quizLoader";

const QuizList = () => {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAllQuizzes = async () => {
      setIsLoading(true);
      const staticQuizzes = await fetchQuizzes();

      const stored = localStorage.getItem("quizzes");
      const localQuizzes = stored ? JSON.parse(stored) : [];

      // Combine them, avoiding duplicates by ID
      const combined = [...staticQuizzes];
      localQuizzes.forEach((lq: Quiz) => {
        if (!combined.find(sq => sq.id === lq.id)) {
          combined.push(lq);
        }
      });

      setQuizzes(combined);
      setIsLoading(false);
    };

    loadAllQuizzes();
  }, []);

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "mcq": return "gradient-primary";
      case "oneword": return "gradient-accent";
      case "flashcard": return "gradient-success";
      default: return "gradient-primary";
    }
  };

  return (
    <div className="min-h-screen gradient-bg">
      {/* Header */}
      <header className="p-6 border-b border-border/40 bg-white/50 backdrop-blur">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 gradient-primary rounded-2xl flex items-center justify-center shadow-medium">
              <Brain className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold">Available Quizzes</h1>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            className="rounded-full border-2 hover:shadow-medium transition-all"
          >
            <Home className="mr-2 h-4 w-4" />
            Home
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-xl text-muted-foreground animate-pulse">Loading quizzes...</p>
          </div>
        ) : quizzes.length === 0 ? (
          <Card className="p-12 rounded-3xl shadow-soft text-center border-0 bg-white/80 backdrop-blur">
            <FileQuestion className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">No Quizzes Available</h2>
            <p className="text-muted-foreground">Check back later for new quizzes!</p>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.map((quiz) => (
              <Card
                key={quiz.id}
                className="p-6 rounded-3xl shadow-soft hover:shadow-strong transition-all border-0 bg-white/80 backdrop-blur group cursor-pointer"
                onClick={() => navigate(`/quiz/${quiz.id}`)}
              >
                <div className={`w-full h-32 ${getTypeColor(quiz.type)} rounded-2xl mb-4 flex items-center justify-center shadow-medium group-hover:scale-105 transition-transform`}>
                  <Brain className="w-12 h-12 text-white" />
                </div>

                <h3 className="text-xl font-bold mb-2">{quiz.title}</h3>

                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="secondary" className="rounded-full">
                    {quiz.type}
                  </Badge>
                  <Badge variant="outline" className="rounded-full">
                    <FileQuestion className="w-3 h-3 mr-1" />
                    {quiz.questionCount} Questions
                  </Badge>
                  {quiz.timer > 0 && (
                    <Badge variant="outline" className="rounded-full">
                      <Clock className="w-3 h-3 mr-1" />
                      {Math.floor(quiz.timer / 60)} min
                    </Badge>
                  )}
                </div>

                <Button
                  className="w-full gradient-primary text-white rounded-xl shadow-medium hover:shadow-strong transition-all group-hover:scale-105"
                >
                  Start Quiz
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default QuizList;
