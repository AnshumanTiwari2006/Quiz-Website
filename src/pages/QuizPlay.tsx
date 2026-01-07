import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Clock, CheckCircle2, ChevronRight, ChevronLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import FlashcardComponent from "@/components/FlashcardComponent";
import { getQuizById } from "@/lib/quizLoader";

const QuizPlay = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [quiz, setQuiz] = useState<any>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [studentName, setStudentName] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const name = sessionStorage.getItem("studentName");
    if (!name) {
      navigate(`/quiz/${quizId}`);
      return;
    }
    setStudentName(name);

    const loadQuiz = async () => {
      setIsLoading(true);
      if (quizId) {
        const found = await getQuizById(quizId);
        if (found) {
          setQuiz(found);
          setTimeLeft(found.timer);
        } else {
          toast({
            title: "Error",
            description: "Quiz not found",
            variant: "destructive",
          });
          navigate("/quizzes");
        }
      }
      setIsLoading(false);
    };

    loadQuiz();
  }, [quizId, navigate]);

  useEffect(() => {
    if (timeLeft > 0 && quiz) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeLeft, quiz]);

  const handleAnswer = (questionId: string, answer: string) => {
    // Just update the answer, NO feedback logic here
    setAnswers({ ...answers, [questionId]: answer });
  };

  const handleSubmit = () => {
    let score = 0;
    const details = quiz.questions.map((q: any) => {
      if (q.type === "flashcard") return null;

      const userAnswer = (answers[q.id] || "").toLowerCase().trim();
      const correctAnswer = q.answer.toLowerCase().trim();
      const isCorrect = userAnswer === correctAnswer;

      if (isCorrect) {
        score += q.points;
      }

      return {
        question: q.question,
        userAnswer: answers[q.id] || "No Answer",
        correctAnswer: q.answer,
        isCorrect
      };
    }).filter(Boolean);

    const totalPoints = quiz.questions.reduce((acc: number, q: any) =>
      q.type !== "flashcard" ? acc + q.points : acc, 0);

    // Using sessionStorage temporarily for the result page, 
    // but the user's "reset on refresh" rule will be handled 
    // by clearing these or ensuring the Result page handles it.
    sessionStorage.setItem("quizResult", JSON.stringify({
      score,
      total: totalPoints,
      details,
      quizTitle: quiz.title
    }));

    navigate(`/quiz/${quizId}/result`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen gradient-bg flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xl text-muted-foreground">Loading your quiz...</p>
      </div>
    );
  }

  if (!quiz) return null;

  const currentQuestion = quiz.questions[currentIndex];
  const isLastQuestion = currentIndex === quiz.questions.length - 1;

  return (
    <div className="min-h-screen gradient-bg">
      <header className="p-6 border-b border-border/40 bg-white/50 backdrop-blur sticky top-0 z-10">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center shadow-medium">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold truncate max-w-[200px] md:max-w-md">{quiz.title}</h1>
                <p className="text-xs text-muted-foreground">Candidate: {studentName}</p>
              </div>
            </div>
            {quiz.timer > 0 && (
              <Badge
                variant={timeLeft < 60 ? "destructive" : "outline"}
                className={`rounded-full px-4 py-1.5 transition-colors ${timeLeft < 60 ? 'animate-pulse' : ''}`}
              >
                <Clock className="mr-2 h-4 w-4" />
                <span className="font-mono text-sm">
                  {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                </span>
              </Badge>
            )}
          </div>
          <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
            <div
              className="gradient-primary h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${((currentIndex + 1) / quiz.questions.length) * 100}%` }}
            />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-3xl">
        <div className="mb-6 flex justify-between items-center">
          <Badge variant="secondary" className="rounded-full px-4 py-1">
            Question {currentIndex + 1} of {quiz.questions.length}
          </Badge>
          <span className="text-sm font-medium text-muted-foreground italic">
            {currentQuestion.type === 'mcq' ? 'Select the best option' :
              currentQuestion.type === 'oneword' ? 'Type your answer' : 'Flashcard Study'}
          </span>
        </div>

        <div className="mb-8 min-h-[400px]">
          {currentQuestion.type === "flashcard" ? (
            <FlashcardComponent
              front={currentQuestion.front || ""}
              back={currentQuestion.back || ""}
            />
          ) : (
            <Card className="p-8 md:p-12 rounded-3xl shadow-strong border-0 bg-white/95 backdrop-blur animate-in fade-in slide-in-from-bottom-4">
              <h2 className="text-2xl md:text-3xl font-bold mb-10 leading-tight">{currentQuestion.question}</h2>

              {currentQuestion.type === "mcq" && currentQuestion.options && (
                <div className="space-y-4">
                  {currentQuestion.options.map((option: string, index: number) => (
                    <Button
                      key={index}
                      variant={answers[currentQuestion.id] === option ? "default" : "outline"}
                      onClick={() => handleAnswer(currentQuestion.id, option)}
                      className={`w-full justify-start text-left h-auto py-5 px-7 rounded-2xl transition-all border-2 ${answers[currentQuestion.id] === option
                          ? "bg-primary text-white border-primary shadow-medium scale-[1.02]"
                          : "hover:border-primary/50 hover:bg-primary/5"
                        }`}
                    >
                      <span className="flex items-center gap-4">
                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${answers[currentQuestion.id] === option ? 'bg-white/20' : 'bg-muted'
                          }`}>
                          {String.fromCharCode(65 + index)}
                        </span>
                        <span className="text-lg">{option}</span>
                      </span>
                    </Button>
                  ))}
                </div>
              )}

              {currentQuestion.type === "oneword" && (
                <div className="relative group">
                  <input
                    type="text"
                    autoFocus
                    value={answers[currentQuestion.id] || ""}
                    onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
                    placeholder="Type your answer here..."
                    className="w-full p-6 bg-muted/30 border-2 border-transparent rounded-2xl text-xl focus:outline-none focus:border-primary focus:bg-white transition-all shadow-inner"
                  />
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 text-primary opacity-0 group-focus-within:opacity-100 transition-opacity">
                    <Brain className="w-6 h-6 animate-pulse" />
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>

        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => setCurrentIndex(currentIndex - 1)}
            disabled={currentIndex === 0}
            className="rounded-xl px-4 md:px-8 h-14"
          >
            <ChevronLeft className="mr-2 h-5 w-5" />
            <span className="hidden md:inline">Previous</span>
          </Button>

          <div className="flex-1" />

          {isLastQuestion ? (
            <Button
              onClick={handleSubmit}
              className="gradient-primary text-white rounded-xl px-10 h-14 shadow-strong hover:scale-105 transition-all text-lg font-bold"
            >
              <CheckCircle2 className="mr-2 h-5 w-5" />
              Finish Quiz
            </Button>
          ) : (
            <Button
              onClick={() => setCurrentIndex(currentIndex + 1)}
              className="gradient-primary text-white rounded-xl px-10 h-14 shadow-medium hover:shadow-strong transition-all text-lg font-bold"
            >
              Next
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          )}
        </div>
      </main>
    </div>
  );
};

export default QuizPlay;

