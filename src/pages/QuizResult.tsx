import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Brain, Trophy, Home, RotateCcw, CheckCircle2, XCircle } from "lucide-react";

const QuizResult = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [resultData, setResultData] = useState<any>(null);
  const [studentName, setStudentName] = useState("");

  useEffect(() => {
    const name = sessionStorage.getItem("studentName");
    const storedResult = sessionStorage.getItem("quizResult");

    if (!name || !storedResult) {
      navigate(`/quiz/${quizId}`);
      return;
    }

    setStudentName(name);
    setResultData(JSON.parse(storedResult));

    // Clear storage immediately after loading into state
    // This ensures that a page refresh will reset the application state
    sessionStorage.removeItem("quizResult");
  }, [quizId, navigate]);

  if (!resultData) return null;

  const { score, total, details, quizTitle } = resultData;
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

  const getGrade = () => {
    if (percentage >= 90) return { grade: "A+", color: "gradient-success", message: "Outstanding!" };
    if (percentage >= 80) return { grade: "A", color: "gradient-primary", message: "Excellent!" };
    if (percentage >= 70) return { grade: "B", color: "gradient-primary", message: "Great Job!" };
    if (percentage >= 60) return { grade: "C", color: "gradient-accent", message: "Good Effort!" };
    return { grade: "D", color: "bg-destructive", message: "Keep Practicing!" };
  };

  const status = getGrade();

  const handleRetake = () => {
    sessionStorage.removeItem("quizResult");
    navigate(`/quiz/${quizId}/play`);
  };

  const handleHome = () => {
    sessionStorage.removeItem("quizResult");
    navigate('/quizzes');
  };

  return (
    <div className="min-h-screen gradient-bg py-12 px-6">
      <div className="max-w-4xl mx-auto space-y-8 animate-scale-in">
        <Card className="p-8 md:p-12 rounded-3xl shadow-strong border-0 bg-white/90 backdrop-blur">
          <div className="text-center mb-8">
            <div className={`w-24 h-24 ${status.color} rounded-full flex items-center justify-center mx-auto mb-6 shadow-strong animate-bounce-slow`}>
              <Trophy className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-2">{status.message}</h1>
            <p className="text-xl text-muted-foreground">Well done, {studentName}! You've completed <strong>{quizTitle}</strong></p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-center mb-10">
            <div className="p-8 bg-gradient-to-br from-muted/50 to-muted/30 rounded-3xl text-center">
              <div className={`inline-block w-28 h-28 ${status.color} rounded-full flex items-center justify-center shadow-strong mb-4`}>
                <span className="text-4xl font-bold text-white">{status.grade}</span>
              </div>
              <p className="text-5xl font-bold mb-1">{percentage}%</p>
              <p className="text-lg text-muted-foreground">{score} / {total} points</p>
            </div>

            <div className="space-y-6">
              <h3 className="text-xl font-bold">Performance Summary</h3>
              <div className="space-y-4">
                <div className="w-full bg-muted rounded-full h-4 overflow-hidden">
                  <div
                    className={`${status.color} h-full rounded-full transition-all duration-1000 ease-out`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <p className="text-sm text-muted-foreground italic">
                  Overall accuracy across all attempted questions.
                </p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Button
              onClick={handleRetake}
              size="lg"
              variant="outline"
              className="rounded-2xl border-2 h-16 text-lg font-bold hover:bg-muted"
            >
              <RotateCcw className="mr-2 h-5 w-5" />
              Retake Quiz
            </Button>
            <Button
              onClick={handleHome}
              size="lg"
              className="gradient-primary text-white rounded-2xl shadow-medium hover:shadow-strong transition-all h-16 text-lg font-bold"
            >
              <Brain className="mr-2 h-5 w-5" />
              Try Another Quiz
            </Button>
          </div>
        </Card>

        {/* Detailed Breakdown */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold px-2">Detailed Review</h2>
          <div className="grid gap-4">
            {details.map((item: any, idx: number) => (
              <Card key={idx} className="p-6 rounded-2xl border-0 bg-white/80 backdrop-blur shadow-soft flex items-start gap-4 transition-all hover:scale-[1.01]">
                {item.isCorrect ? (
                  <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0 mt-1" />
                ) : (
                  <XCircle className="w-6 h-6 text-destructive shrink-0 mt-1" />
                )}
                <div className="space-y-1">
                  <p className="font-bold text-lg">{item.question}</p>
                  <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm mt-3">
                    <p>
                      <span className="text-muted-foreground mr-2">Your Answer:</span>
                      <span className={item.isCorrect ? "text-green-600 font-medium" : "text-destructive font-medium"}>
                        {item.userAnswer}
                      </span>
                    </p>
                    {!item.isCorrect && (
                      <p>
                        <span className="text-muted-foreground mr-2">Correct Answer:</span>
                        <span className="text-green-600 font-medium">{item.correctAnswer}</span>
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div className="text-center pb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            <Home className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default QuizResult;

