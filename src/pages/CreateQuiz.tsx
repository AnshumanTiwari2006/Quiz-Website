import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Brain, Plus, Trash2, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Question {
  id: string;
  type: "mcq" | "oneword" | "flashcard";
  question: string;
  options?: string[];
  answer: string;
  points: number;
  front?: string;
  back?: string;
}

const CreateQuiz = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [quizType, setQuizType] = useState<"mcq" | "oneword" | "flashcard" | "mixed">("mcq");
  const [timer, setTimer] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);

  const { quizId } = useParams();
  const isEditing = !!quizId;

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("adminLoggedIn");
    if (!isLoggedIn) {
      navigate("/admin/login");
    }

    if (isEditing) {
      const stored = localStorage.getItem("quizzes");
      if (stored) {
        const quizzes = JSON.parse(stored);
        const quiz = quizzes.find((q: any) => q.id === quizId);
        if (quiz) {
          setTitle(quiz.title);
          setQuizType(quiz.type);
          setTimer(quiz.timer);
          setQuestions(quiz.questions);
        } else {
          toast({
            title: "Quiz not found",
            description: "The quiz you are trying to edit does not exist",
            variant: "destructive",
          });
          navigate("/admin/quizzes");
        }
      }
    }
  }, [navigate, quizId, isEditing]);

  const addQuestion = () => {
    const newQuestion: Question = {
      id: Date.now().toString(),
      type: quizType === "mixed" ? "mcq" : quizType,
      question: "",
      options: quizType === "mcq" || quizType === "mixed" ? ["", "", "", ""] : undefined,
      answer: "",
      points: 10,
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (id: string, field: string, value: any) => {
    setQuestions(questions.map(q =>
      q.id === id ? { ...q, [field]: value } : q
    ));
  };

  const updateOption = (id: string, index: number, value: string) => {
    setQuestions(questions.map(q =>
      q.id === id && q.options ? { ...q, options: q.options.map((opt, i) => i === index ? value : opt) } : q
    ));
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const saveQuiz = () => {
    if (!title || questions.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please add a title and at least one question",
        variant: "destructive",
      });
      return;
    }

    const quizData = {
      id: isEditing ? quizId : Date.now().toString(),
      title,
      type: quizType,
      timer,
      questionCount: questions.length,
      questions,
    };

    const stored = localStorage.getItem("quizzes");
    let quizzes = stored ? JSON.parse(stored) : [];

    if (isEditing) {
      quizzes = quizzes.map((q: any) => q.id === quizId ? quizData : q);
    } else {
      quizzes.push(quizData);
    }

    localStorage.setItem("quizzes", JSON.stringify(quizzes));

    toast({
      title: "Success!",
      description: isEditing ? "Quiz updated successfully" : "Quiz created successfully",
    });
    navigate("/admin/quizzes");
  };

  return (
    <div className="min-h-screen gradient-bg">
      <header className="p-6 border-b border-border/40 bg-white/50 backdrop-blur">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 gradient-primary rounded-2xl flex items-center justify-center shadow-medium">
              <Brain className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold">{isEditing ? "Edit Quiz" : "Create New Quiz"}</h1>
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

      <main className="container mx-auto px-6 py-8 max-w-4xl">
        <Card className="p-8 rounded-3xl shadow-soft border-0 bg-white/90 backdrop-blur mb-6">
          <h2 className="text-xl font-bold mb-6">Quiz Details</h2>

          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Quiz Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Math Basics"
                className="rounded-xl mt-2"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Quiz Type</Label>
                <Select value={quizType} onValueChange={(value: any) => setQuizType(value)}>
                  <SelectTrigger className="rounded-xl mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mcq">Multiple Choice</SelectItem>
                    <SelectItem value="oneword">One Word</SelectItem>
                    <SelectItem value="flashcard">Flashcards</SelectItem>
                    <SelectItem value="mixed">Mixed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="timer">Timer (seconds, 0 for no timer)</Label>
                <Input
                  id="timer"
                  type="number"
                  value={timer}
                  onChange={(e) => setTimer(parseInt(e.target.value) || 0)}
                  placeholder="300"
                  className="rounded-xl mt-2"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Questions */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Questions ({questions.length})</h2>
            <Button onClick={addQuestion} className="gradient-primary text-white rounded-xl">
              <Plus className="mr-2 h-4 w-4" />
              Add Question
            </Button>
          </div>

          {questions.map((q, index) => (
            <Card key={q.id} className="p-6 rounded-3xl shadow-soft border-0 bg-white/90 backdrop-blur mb-4">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold">Question {index + 1}</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeQuestion(q.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {q.type === "flashcard" ? (
                <>
                  <div className="space-y-4">
                    <div>
                      <Label>Front</Label>
                      <Textarea
                        value={q.front || ""}
                        onChange={(e) => updateQuestion(q.id, "front", e.target.value)}
                        placeholder="Question or term"
                        className="rounded-xl mt-2"
                      />
                    </div>
                    <div>
                      <Label>Back</Label>
                      <Textarea
                        value={q.back || ""}
                        onChange={(e) => updateQuestion(q.id, "back", e.target.value)}
                        placeholder="Answer or definition"
                        className="rounded-xl mt-2"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-4">
                    <div>
                      <Label>Question</Label>
                      <Textarea
                        value={q.question}
                        onChange={(e) => updateQuestion(q.id, "question", e.target.value)}
                        placeholder="Enter your question"
                        className="rounded-xl mt-2"
                      />
                    </div>

                    {q.type === "mcq" && q.options && (
                      <div>
                        <Label>Options</Label>
                        <div className="space-y-2 mt-2">
                          {q.options.map((opt, i) => (
                            <Input
                              key={i}
                              value={opt}
                              onChange={(e) => updateOption(q.id, i, e.target.value)}
                              placeholder={`Option ${i + 1}`}
                              className="rounded-xl"
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label>Correct Answer</Label>
                        <Input
                          value={q.answer}
                          onChange={(e) => updateQuestion(q.id, "answer", e.target.value)}
                          placeholder={q.type === "mcq" ? "e.g., Option 2" : "Enter answer"}
                          className="rounded-xl mt-2"
                        />
                      </div>
                      <div>
                        <Label>Points</Label>
                        <Input
                          type="number"
                          value={q.points}
                          onChange={(e) => updateQuestion(q.id, "points", parseInt(e.target.value) || 0)}
                          className="rounded-xl mt-2"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </Card>
          ))}
        </div>

        <Button
          onClick={saveQuiz}
          size="lg"
          className="w-full gradient-primary text-white rounded-xl shadow-strong hover:scale-105 transition-all"
        >
          {isEditing ? "Update Quiz" : "Create Quiz"}
        </Button>
      </main>
    </div>
  );
};

export default CreateQuiz;
