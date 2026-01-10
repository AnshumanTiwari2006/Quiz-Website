import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Clock, CheckCircle2, ChevronRight, ChevronLeft, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import FlashcardComponent from "@/components/FlashcardComponent";
import Navbar from "@/components/Navbar";

const shuffleArray = (array: any[]) => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

import { useAuth } from "@/contexts/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const QuizPlay = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, loading: authLoading } = useAuth();
  const [quiz, setQuiz] = useState<any>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [flagged, setFlagged] = useState<Record<number, boolean>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [studentName, setStudentName] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Special state for matching type
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [shuffledMatchOptions, setShuffledMatchOptions] = useState<any[]>([]);

  // Refs for line drawing
  const leftRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const rightRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const [lineCoords, setLineCoords] = useState<any[]>([]);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please login to take this quiz.",
          variant: "destructive",
        });
        navigate("/admin/login");
        return;
      }
      setStudentName(profile?.name || user.email || "Student");
    }

    const loadQuiz = async () => {
      setIsLoading(true);
      if (quizId) {
        try {
          const docRef = doc(db, "quizzes", quizId);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const found = docSnap.data();
            // Deduplicate questions just in case the DB has duplicates
            if (found.questions) {
              const uniqueQuestions = Array.from(
                new Map(found.questions.map((q: any) => [q.question.trim().toLowerCase(), q])).values()
              );
              found.questions = uniqueQuestions;
              found.questionCount = uniqueQuestions.length;
            }
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
        } catch (error: any) {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
        }
      }
      setIsLoading(false);
    };

    if (!authLoading) {
      loadQuiz();
    }
  }, [quizId, navigate, toast, user, profile, authLoading]);

  useEffect(() => {
    const handleViolation = () => {
      if (document.hidden) {
        // Zero out all answers
        setAnswers({});

        toast({
          title: "Assessment Terminated",
          description: "SECURITY VIOLATION: Tab switching detected. Your exam has been closed, and a score of 0 has been recorded for this attempt.",
          variant: "destructive",
        });

        // Small delay to let the toast be seen before navigating
        setTimeout(() => {
          sessionStorage.setItem("quizResult", JSON.stringify({
            score: 0,
            total: quiz?.questions.length * 10 || 100,
            details: [],
            quizTitle: quiz?.title || "Assessment",
            isCheated: true,
            teacherId: quiz?.teacherId,
            teacherName: quiz?.teacherName
          }));
          navigate(`/quiz/${quizId}/result`);
        }, 100);
      }
    };

    document.addEventListener("visibilitychange", handleViolation);
    return () => document.removeEventListener("visibilitychange", handleViolation);
  }, [toast, navigate, quizId, quiz]);

  useEffect(() => {
    if (quiz) {
      const q = quiz.questions[currentIndex];
      if (q.type === 'match') {
        const rights = (q.pairs || []).map((p: any) => p.right);
        setShuffledMatchOptions(shuffleArray(rights));
      } else {
        setShuffledMatchOptions([]);
      }
    }
  }, [currentIndex, quiz]);

  const updateLines = () => {
    if (!containerRef.current || !quiz) return;
    const q = quiz.questions[currentIndex];
    if (q.type !== 'match') {
      setLineCoords([]);
      return;
    }

    const currentMatches = answers[q.id] || {};
    const newCoords: any[] = [];
    const containerRect = containerRef.current.getBoundingClientRect();

    Object.entries(currentMatches).forEach(([left, right]) => {
      const leftEl = leftRefs.current[left];
      const rightEl = rightRefs.current[right as string];

      if (leftEl && rightEl) {
        const leftRect = leftEl.getBoundingClientRect();
        const rightRect = rightEl.getBoundingClientRect();

        newCoords.push({
          x1: leftRect.right - containerRect.left,
          y1: leftRect.top + leftRect.height / 2 - containerRect.top,
          x2: rightRect.left - containerRect.left,
          y2: rightRect.top + rightRect.height / 2 - containerRect.top,
          color: 'hsl(var(--primary))'
        });
      }
    });
    setLineCoords(newCoords);
  };

  useEffect(() => {
    updateLines();
    window.addEventListener('resize', updateLines);
    return () => window.removeEventListener('resize', updateLines);
  }, [answers, currentIndex, quiz, shuffledMatchOptions]);

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

  const handleAnswer = (questionId: string, answer: any) => {
    setAnswers({ ...answers, [questionId]: answer });
  };

  const handleMatchClick = (side: 'left' | 'right', value: string, questionId: string) => {
    if (side === 'left') {
      setSelectedLeft(value);
    } else if (side === 'right' && selectedLeft) {
      const currentMatching = answers[questionId] || {};
      const newMatching = { ...currentMatching, [selectedLeft]: value };
      handleAnswer(questionId, newMatching);
      setSelectedLeft(null);
    }
  };

  const clearMatch = (questionId: string, leftKey: string) => {
    const currentMatching = { ...(answers[questionId] || {}) };
    delete currentMatching[leftKey];
    handleAnswer(questionId, currentMatching);
  };

  const handleSubmit = () => {
    let score = 0;
    const details = quiz.questions.map((q: any) => {
      if (q.type === "flashcard") return null;

      let isCorrect = false;
      let userAnswerStr = "";
      let correctAnswerStr = "";

      if (q.type === "mcq" || q.type === "oneword" || q.type === "truefalse") {
        const rawUserAnswer = (answers[q.id] || "").toString().trim();
        const rawCorrectAnswer = q.answer.toString().trim();

        userAnswerStr = rawUserAnswer;
        correctAnswerStr = rawCorrectAnswer;
        isCorrect = rawUserAnswer.toLowerCase() === rawCorrectAnswer.toLowerCase();
      } else if (q.type === "multi_mcq") {
        const userParts = (answers[q.id] || "").toString().split("|").filter(Boolean).map(s => s.trim().toLowerCase());
        const correctParts = q.answer.toString().split("|").filter(Boolean).map(s => s.trim().toLowerCase());

        const userSet = new Set(userParts);
        const correctSet = new Set(correctParts);

        isCorrect = userSet.size === correctSet.size && [...correctSet].every(val => userSet.has(val));
        userAnswerStr = userParts.join(", ");
        correctAnswerStr = correctParts.join(", ");
      } else if (q.type === "match") {
        const userMatched = answers[q.id] || {};
        const pairs = q.pairs || [];
        isCorrect = pairs.length > 0 && pairs.every((p: any) => userMatched[p.left] === p.right);

        userAnswerStr = pairs.map((p: any) => `${p.left} → ${userMatched[p.left] || '?'}`).join(", ");
        correctAnswerStr = pairs.map((p: any) => `${p.left} → ${p.right}`).join(", ");
      }

      if (isCorrect) score += q.points;

      return {
        question: q.question,
        image: q.image,
        userAnswer: userAnswerStr || "No Answer",
        correctAnswer: correctAnswerStr,
        isCorrect,
        type: q.type
      };
    }).filter(Boolean);

    const totalPoints = quiz.questions.reduce((acc: number, q: any) =>
      q.type !== "flashcard" ? acc + q.points : acc, 0);

    sessionStorage.setItem("quizResult", JSON.stringify({
      score,
      total: totalPoints,
      details,
      quizTitle: quiz.title,
      teacherId: quiz.teacherId,
      teacherName: quiz.teacherName
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
    <div className="min-h-screen bg-background pb-20">
      <Navbar />

      {/* Quiz Progress Bar & Header */}
      <div className="border-b border-border/10 bg-secondary/30 backdrop-blur-md sticky top-[73px] z-40 py-4 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div>
                <h2 className="text-lg font-bold tracking-tight text-foreground truncate max-w-[150px] md:max-w-md">{quiz.title}</h2>
                <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  Student: {studentName}
                </p>
              </div>
            </div>
            {quiz.timer > 0 && (
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.confirm("Abandon this assessment? No progress will be saved.") && navigate("/quizzes")}
                  className="rounded-full px-4 h-9 text-[10px] font-bold uppercase tracking-widest text-destructive hover:bg-destructive/10"
                >
                  Abandon Quiz
                </Button>
                <Badge
                  variant={timeLeft < 60 ? "destructive" : "secondary"}
                  className={`rounded-full px-4 py-1.5 font-mono text-xs border-0 ${timeLeft < 60 ? 'animate-pulse bg-destructive text-white' : 'bg-primary/10 text-primary'}`}
                >
                  <Clock className="mr-2 h-3.5 w-3.5" />
                  {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                </Badge>
              </div>
            )}
          </div>
          <div className="w-full bg-white/30 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-primary h-full rounded-full transition-all duration-700 ease-in-out"
              style={{ width: `${((currentIndex + 1) / quiz.questions.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="mb-8 flex justify-between items-center">
          <Badge variant="outline" className="rounded-full px-4 py-1.5 border-border/40 bg-white/50 font-bold text-[10px] uppercase tracking-widest text-foreground">
            Question {currentIndex + 1} of {quiz.questions.length}
          </Badge>
          <div className="flex items-center gap-4">
            <span className="text-[11px] uppercase font-bold tracking-widest text-muted-foreground/60 hidden sm:inline">
              {currentQuestion.type === 'mcq' ? 'Multiple Choice' :
                currentQuestion.type === 'truefalse' ? 'True / False' :
                  currentQuestion.type === 'oneword' ? 'Short Answer' :
                    currentQuestion.type === 'match' ? 'Matching' : 'Flashcard'}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFlagged(prev => ({ ...prev, [currentIndex]: !prev[currentIndex] }))}
              className={`rounded-full px-4 py-1 h-auto text-[10px] font-bold uppercase tracking-widest transition-all ${flagged[currentIndex] ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20'}`}
            >
              {flagged[currentIndex] ? 'Flagged' : 'Mark Review'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 lg:gap-12 items-start mb-12">
          <div className="lg:col-start-1 lg:row-start-1 w-full max-w-3xl min-w-0">
            <div className="">
              {currentQuestion.type === "flashcard" ? (
                <FlashcardComponent
                  front={currentQuestion.front || ""}
                  back={currentQuestion.back || ""}
                />
              ) : (
                <Card className="p-10 md:p-14 rounded-[2.5rem] border-0 bg-secondary/20 shadow-soft ring-1 ring-border/50 animate-in fade-in slide-in-from-bottom-2 duration-500 flex flex-col min-h-[400px]">
                  <div className="mb-10">
                    <h3 className="text-xl md:text-2xl font-bold tracking-tight leading-snug text-foreground break-words">{currentQuestion.question}</h3>
                  </div>

                  {currentQuestion.image && (
                    <div className="mb-10 group relative max-w-2xl mx-auto rounded-[2rem] overflow-hidden border-2 border-white/50 shadow-soft ring-1 ring-primary/10">
                      <img
                        src={currentQuestion.image}
                        alt="Question Context"
                        className="w-full h-auto max-h-[400px] object-contain bg-white/50 cursor-zoom-in hover:scale-[1.02] transition-transform duration-500"
                        onClick={() => window.open(currentQuestion.image, '_blank')}
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                        <p className="text-white text-[10px] font-bold uppercase tracking-widest bg-primary/80 px-4 py-2 rounded-full">Click to Expand</p>
                      </div>
                    </div>
                  )}

                  {(currentQuestion.type === "mcq" || currentQuestion.type === "multi_mcq") && currentQuestion.options && (
                    <div className="grid gap-4">
                      {currentQuestion.options.map((option: string, index: number) => {
                        const isSelected = currentQuestion.type === "mcq"
                          ? answers[currentQuestion.id] === option
                          : (answers[currentQuestion.id] || "").split("|").includes(option);

                        return (
                          <Button
                            key={index}
                            variant={isSelected ? "default" : "outline"}
                            onClick={() => {
                              if (currentQuestion.type === "mcq") {
                                handleAnswer(currentQuestion.id, option);
                              } else {
                                const current = answers[currentQuestion.id] || "";
                                const opts = current ? current.split("|") : [];
                                const idx = opts.indexOf(option);
                                if (idx > -1) opts.splice(idx, 1);
                                else opts.push(option);
                                handleAnswer(currentQuestion.id, opts.join("|"));
                              }
                            }}
                            className={`w-full justify-start text-left h-auto py-6 px-8 rounded-2xl transition-all border-2 group shadow-sm ${isSelected
                              ? "bg-primary text-primary-foreground border-primary shadow-medium scale-[1.01]"
                              : "bg-white/50 border-white/80 hover:border-primary/30 hover:bg-primary hover:text-white"
                              }`}
                          >
                            <span className="flex items-center gap-4 w-full">
                              <span className={`${isSelected ? "bg-white/20 text-white" : "bg-primary/10 text-primary"} w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-colors group-hover:bg-white/20 group-hover:text-white`}>
                                {currentQuestion.type === "multi_mcq" ? (
                                  <div className={`w-3 h-3 border-2 rounded ${isSelected ? "bg-white border-white" : "border-primary"} flex items-center justify-center`}>
                                    {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-sm" />}
                                  </div>
                                ) : String.fromCharCode(65 + index)}
                              </span>
                              <span className="flex-1 text-sm md:text-base font-bold tracking-tight break-words leading-relaxed whitespace-normal">{option}</span>
                            </span>
                          </Button>
                        );
                      })}
                    </div>
                  )}

                  {currentQuestion.type === "truefalse" && (
                    <div className="grid grid-cols-2 gap-8">
                      {["True", "False"].map((option) => (
                        <Button
                          key={option}
                          variant={answers[currentQuestion.id] === option ? "default" : "outline"}
                          onClick={() => handleAnswer(currentQuestion.id, option)}
                          className={`h-40 text-2xl font-bold uppercase tracking-widest rounded-[2rem] border-2 transition-all ${answers[currentQuestion.id] === option
                            ? "bg-primary text-primary-foreground border-primary shadow-strong"
                            : "bg-white/50 border-white/80 hover:border-primary/30 hover:bg-primary hover:text-white"
                            }`}
                        >
                          {option}
                        </Button>
                      ))}
                    </div>
                  )}

                  {currentQuestion.type === "oneword" && (
                    <div className="relative group max-w-2xl mx-auto w-full">
                      <input
                        type="text"
                        autoFocus
                        value={answers[currentQuestion.id] || ""}
                        onChange={(e) => handleAnswer(currentQuestion.id, e.target.value.toLowerCase())}
                        placeholder="Type your answer..."
                        className="w-full p-8 bg-white/50 border-2 border-white/80 rounded-[2rem] text-2xl font-bold focus:outline-none focus:border-primary focus:bg-white transition-all shadow-inner placeholder:text-muted-foreground/30 text-center text-foreground"
                      />
                    </div>
                  )}

                  {currentQuestion.type === "match" && (
                    <div className="space-y-12">
                      <div ref={containerRef} className="grid md:grid-cols-2 gap-16 relative">
                        <svg className="absolute inset-0 pointer-events-none w-full h-full z-0 overflow-visible">
                          {lineCoords.map((line, i) => (
                            <line
                              key={i}
                              x1={line.x1}
                              y1={line.y1}
                              x2={line.x2}
                              y2={line.y2}
                              stroke={line.color}
                              strokeWidth="3"
                              strokeLinecap="round"
                              className="animate-in fade-in transition-all duration-300"
                              style={{ strokeDasharray: '5,5' }}
                            />
                          ))}
                        </svg>

                        <div className="space-y-4 relative z-10">
                          <h4 className="font-bold text-center text-muted-foreground uppercase tracking-widest text-[9px] mb-6">Column A</h4>
                          {(currentQuestion.pairs || []).map((p: any, i: number) => (
                            <Button
                              key={i}
                              ref={(el) => (leftRefs.current[p.left] = el)}
                              onClick={() => handleMatchClick('left', p.left, currentQuestion.id)}
                              className={`w-full h-16 rounded-2xl text-lg font-bold shadow-sm transition-all border-2 ${selectedLeft === p.left ? 'bg-primary text-white border-primary scale-[1.02]'
                                : answers[currentQuestion.id]?.[p.left] ? 'bg-primary/10 text-primary border-primary/20 hover:bg-primary hover:text-white' : 'bg-white/50 border-white text-foreground hover:bg-primary hover:text-white hover:border-primary'}`}
                            >
                              {p.left}
                            </Button>
                          ))}
                        </div>

                        <div className="space-y-4 relative z-10">
                          <h4 className="font-bold text-center text-muted-foreground uppercase tracking-widest text-[9px] mb-6">Column B</h4>
                          {shuffledMatchOptions.map((option, i) => (
                            <Button
                              key={i}
                              ref={(el) => (rightRefs.current[option] = el)}
                              onClick={() => handleMatchClick('right', option, currentQuestion.id)}
                              className={`w-full h-16 rounded-2xl text-lg font-bold shadow-sm transition-all border-2 ${Object.values(answers[currentQuestion.id] || {}).includes(option)
                                ? 'bg-primary/10 text-primary border-primary/20 hover:bg-primary hover:text-white' : 'bg-white/50 border-white text-foreground hover:bg-primary hover:text-white hover:border-primary'}`}
                            >
                              {option}
                            </Button>
                          ))}
                        </div>
                      </div>

                      <div className="bg-white/30 rounded-[2rem] p-8 border border-white/50">
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(answers[currentQuestion.id] || {}).map(([left, right]) => (
                            <Badge key={left} className="pl-5 pr-2 py-3 bg-white text-primary border border-primary/10 rounded-full shadow-sm flex items-center gap-4">
                              <span className="font-bold text-xs uppercase">{left as string}</span>
                              <ArrowRight className="w-3 h-3 opacity-30" />
                              <span className="font-bold text-xs uppercase">{right as string}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => clearMatch(currentQuestion.id, left)}
                                className="h-6 w-6 p-0 rounded-full hover:bg-destructive hover:text-white"
                              >
                                ×
                              </Button>
                            </Badge>
                          ))}
                          {Object.keys(answers[currentQuestion.id] || {}).length === 0 && (
                            <p className="text-muted-foreground/40 text-xs font-bold uppercase tracking-widest italic py-2">Select items to form pairs</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              )}
            </div>
          </div>

          <div className="lg:col-start-1 lg:row-start-2 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 mt-4 lg:mt-8">
            <Button
              variant="ghost"
              onClick={() => setCurrentIndex(currentIndex - 1)}
              disabled={currentIndex === 0}
              className="w-full sm:w-auto rounded-full px-8 sm:px-10 h-14 sm:h-16 text-foreground hover:bg-primary hover:text-white transition-all font-bold text-sm sm:text-base order-2 sm:order-1"
            >
              <ChevronLeft className="mr-3 h-5 w-5" />
              Previous
            </Button>

            <div className="hidden sm:block flex-1" />

            {isLastQuestion ? (
              <Button
                onClick={handleSubmit}
                className="w-full sm:w-auto bg-primary text-primary-foreground rounded-full px-10 sm:px-12 h-14 sm:h-16 shadow-strong hover:bg-secondary hover:text-primary hover:scale-[1.05] transition-all text-lg sm:text-xl font-bold order-1 sm:order-2 border-0"
              >
                Finish Quiz
                <CheckCircle2 className="ml-3 h-6 w-6" />
              </Button>
            ) : (
              <Button
                onClick={() => setCurrentIndex(currentIndex + 1)}
                className="w-full sm:w-auto bg-primary text-primary-foreground rounded-full px-10 sm:px-12 h-14 sm:h-16 shadow-strong hover:bg-secondary hover:text-primary hover:scale-[1.05] transition-all text-lg sm:text-xl font-bold order-1 sm:order-2 border-0"
              >
                Next
                <ChevronRight className="ml-3 h-6 w-6" />
              </Button>
            )}
          </div>

          <aside className="lg:col-start-2 lg:row-start-1 lg:row-span-2 w-full lg:sticky lg:top-[180px] space-y-6">
            <Card className="p-6 rounded-[2rem] border-0 bg-secondary/50 shadow-soft ring-1 ring-border/30">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-6">Quiz Navigator</h3>
              <div className="grid grid-cols-5 md:grid-cols-8 lg:grid-cols-4 gap-2">
                {quiz.questions.map((q: any, idx: number) => {
                  const isAnswered = q.type === 'flashcard' ? true : !!answers[q.id];
                  const isFlagged = flagged[idx];
                  const isCurrent = currentIndex === idx;

                  return (
                    <button
                      key={idx}
                      onClick={() => setCurrentIndex(idx)}
                      className={`h-10 rounded-xl font-bold text-xs transition-all flex items-center justify-center border-2
                        ${isCurrent ? 'border-primary scale-110 shadow-md transform' : 'border-transparent'}
                        ${isFlagged ? 'bg-blue-500 text-white' :
                          isAnswered ? 'bg-green-500 text-white' : 'bg-white/50 text-muted-foreground/60 hover:bg-white'}
                      `}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
              <div className="mt-8 pt-6 border-t border-border/20 grid grid-cols-2 gap-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-green-500" />
                  <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Answered</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-blue-500" />
                  <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Review</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-white border border-border/20" />
                  <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Open</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full border-2 border-primary" />
                  <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Current</span>
                </div>
              </div>
            </Card>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default QuizPlay;
