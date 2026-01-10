import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Brain, Plus, Trash2, ArrowLeft, Upload, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Papa from "papaparse";
import { useAuth } from "@/contexts/AuthContext";
import { collection, addDoc, doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Question {
  id: string;
  type: "mcq" | "oneword" | "flashcard" | "truefalse" | "match" | "multi_mcq";
  question: string;
  image?: string;
  options?: string[];
  answer: string;
  points: number;
  front?: string;
  back?: string;
  pairs?: { left: string; right: string }[];
}

const SUBJECTS = [
  "English", "Mathematics", "Science", "Physics", "Chemistry", "Biology",
  "History", "Geography", "Civics", "Computer Science", "Hindi", "Sanskrit",
  "Economics", "Accountancy", "Business Studies", "General Knowledge",
  "Environmental Studies", "Physical Education", "Fine Arts", "Psychology"
];

const CLASSES = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th", "11th", "12th"];

const CreateQuiz = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, loading: authLoading } = useAuth();

  const [title, setTitle] = useState("");
  const [quizType, setQuizType] = useState<"mcq" | "oneword" | "flashcard" | "mixed" | "truefalse" | "match" | "multi_mcq">("mcq");
  const [timer, setTimer] = useState(0);
  const [subject, setSubject] = useState("");
  const [targetClass, setTargetClass] = useState("");
  const [teacherName, setTeacherName] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [quizImage, setQuizImage] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const quizImageInputRef = useRef<HTMLInputElement>(null);

  const { quizId } = useParams();
  const isEditing = !!quizId;

  useEffect(() => {
    if (!authLoading) {
      const hasAccess = ["teacher", "admin", "moderator", "viewer"].includes(profile?.role || "");
      if (!user || !hasAccess) {
        toast({
          title: "Access Denied",
          description: "You do not have the required permissions for this action.",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      // Auto-fill teacher name if not set
      if (!teacherName && profile?.name) {
        setTeacherName(profile.name);
      }
    }

    if (isEditing) {
      const loadQuizData = async () => {
        try {
          const docRef = doc(db, "quizzes", quizId as string);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const quiz = docSnap.data();
            setTitle(quiz.title);
            setQuizType(quiz.type as any);
            setTimer(quiz.timer);
            setQuestions(quiz.questions || []);
            setSubject(quiz.subject || "");
            setTargetClass(quiz.class || "");
            setTeacherName(quiz.teacherName || "");
            setQuizImage(quiz.image || "");
          } else {
            toast({
              title: "Quiz not found",
              description: "The quiz you are trying to edit does not exist",
              variant: "destructive",
            });
            navigate("/admin/quizzes");
          }
        } catch (error: any) {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
        }
      };
      loadQuizData();
    }
  }, [navigate, quizId, isEditing, toast, user, profile, authLoading, teacherName]);

  const addQuestion = () => {
    const newQuestion: Question = {
      id: Date.now().toString(),
      type: quizType === "mixed" ? "mcq" : quizType,
      question: "",
      options: (quizType === "mcq" || quizType === "mixed" || quizType === "multi_mcq") ? ["", "", "", ""] :
        quizType === "truefalse" ? ["True", "False"] : undefined,
      answer: "",
      points: 10,
      pairs: quizType === "match" ? [{ left: "", right: "" }] : undefined,
    };
    setQuestions([...questions, newQuestion]);
  };

  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const newQuestions: Question[] = results.data
          .map((row: any, index: number) => {
            const type = (row.type || "mcq").toLowerCase().trim() as any;
            const q: Question = {
              id: (Date.now() + index).toString(),
              type: ["mcq", "oneword", "flashcard", "truefalse", "match", "multi_mcq"].includes(type) ? type : "mcq",
              question: (row.question || "").trim(),
              answer: (row.answer || "").trim(),
              points: parseInt(row.points) || 10,
            };

            if (q.type === "mcq" || q.type === "multi_mcq") {
              q.options = row.options ? row.options.split("|").map((opt: string) => opt.trim()) : ["", "", "", ""];
            } else if (q.type === "truefalse") {
              q.options = ["True", "False"];
            } else if (q.type === "flashcard") {
              q.front = q.question;
              q.back = q.answer;
            }

            return q;
          })
          .filter((newQ) => {
            // Only add if not already in the list (by question text)
            return !questions.some(q => q.question.toLowerCase().trim() === newQ.question.toLowerCase().trim());
          });

        if (newQuestions.length === 0) {
          toast({
            title: "Import Information",
            description: "No new unique questions found in CSV.",
          });
        } else {
          setQuestions([...questions, ...newQuestions]);
          toast({
            title: "Import Success",
            description: `Successfully imported ${newQuestions.length} unique questions.`,
          });
        }
        if (fileInputRef.current) fileInputRef.current.value = "";
      },
      error: (error) => {
        toast({
          title: "Import Failed",
          description: error.message,
          variant: "destructive",
        });
      }
    });
  };

  const updateQuestion = (id: string, field: string, value: any) => {
    setQuestions(questions.map(q => {
      if (q.id === id) {
        if (field === "") return { ...q, ...value };
        return { ...q, [field]: value };
      }
      return q;
    }));
  };

  const updateOption = (id: string, index: number, value: string) => {
    setQuestions(questions.map(q =>
      q.id === id && q.options ? { ...q, options: q.options.map((opt, i) => i === index ? value : opt) } : q
    ));
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const handleImageUpload = (id: string, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      updateQuestion(id, "image", result);
    };
    reader.readAsDataURL(file);
  };

  const handleQuizImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setQuizImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const saveQuiz = async () => {
    if (!title || questions.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please add a title and at least one question",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    const quizData = {
      title,
      type: quizType,
      timer,
      subject,
      class: targetClass,
      teacherName,
      teacherId: user?.uid,
      teacherPhoto: profile?.photoURL || "",
      questionCount: questions.length,
      image: quizImage,
      questions,
      updatedAt: new Date().toISOString(),
    };

    try {
      if (isEditing) {
        await updateDoc(doc(db, "quizzes", quizId as string), quizData);
      } else {
        await addDoc(collection(db, "quizzes"), {
          ...quizData,
          createdAt: new Date().toISOString(),
        });
      }

      toast({
        title: "Success!",
        description: isEditing ? "Quiz updated successfully" : "Quiz created successfully",
      });
      navigate("/admin/quizzes");
    } catch (error: any) {
      toast({
        title: "Failed to save",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <Navbar
        extraLinks={[
          { label: "Deploy Quiz", onClick: saveQuiz, icon: Save }
        ]}
      />

      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">{isEditing ? "Edit Quiz" : "Create New Quiz"}</h2>
            <p className="text-sm text-muted-foreground font-medium">Configuration Panel and Question Designer</p>
          </div>
          <Button
            variant="ghost"
            onClick={() => navigate('/admin/dashboard')}
            className="rounded-full font-bold text-xs uppercase tracking-widest text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all px-6 hidden md:flex"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Cancel
          </Button>
        </div>

        <Card className="p-8 rounded-[2.5rem] border-0 bg-background shadow-soft ring-1 ring-border/50 mb-10 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-2 h-full bg-primary" />
          <div className="flex flex-col md:flex-row gap-10">
            <div className="flex-1 space-y-8">
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Basic Information</h2>
              <div className="space-y-3">
                <Label htmlFor="title" className="text-[10px] uppercase font-bold tracking-widest text-primary/80 ml-1">Quiz Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter a descriptive title..."
                  className="rounded-2xl border-2 border-border/10 h-14 text-lg font-bold focus:ring-primary/10 transition-all placeholder:text-muted-foreground/20 shadow-inner bg-white/50"
                />
              </div>
            </div>

            <div className="w-full md:w-64 space-y-3">
              <Label className="text-[10px] uppercase font-bold tracking-widest text-primary/80 ml-1">Quiz Thumbnail</Label>
              <div
                onClick={() => quizImageInputRef.current?.click()}
                className="group relative w-full h-40 rounded-3xl border-2 border-dashed border-border/20 bg-secondary/10 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-all overflow-hidden"
              >
                {quizImage ? (
                  <>
                    <img src={quizImage} alt="Quiz preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <p className="text-white text-[10px] font-bold uppercase tracking-widest">Change Image</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                      <Plus className="w-5 h-5 text-primary" />
                    </div>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Upload Cover</p>
                  </>
                )}
                <input
                  type="file"
                  ref={quizImageInputRef}
                  onChange={(e) => e.target.files?.[0] && handleQuizImageUpload(e.target.files[0])}
                  className="hidden"
                  accept="image/*"
                />
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mt-8">
            <div className="space-y-3">
              <Label htmlFor="type" className="text-[10px] uppercase font-bold tracking-widest text-primary/80 ml-1">Question Logic</Label>
              <Select value={quizType} onValueChange={(value: any) => setQuizType(value)}>
                <SelectTrigger className="rounded-2xl border-2 border-border/10 h-14 font-bold text-foreground bg-white/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-0 shadow-strong ring-1 ring-border/50 p-2">
                  <SelectItem value="mcq" className="rounded-xl font-bold py-3 text-sm">Multiple Choice</SelectItem>
                  <SelectItem value="multi_mcq" className="rounded-xl font-bold py-3 text-sm">Multiple Answer MCQ</SelectItem>
                  <SelectItem value="oneword" className="rounded-xl font-bold py-3 text-sm">Short Answer</SelectItem>
                  <SelectItem value="flashcard" className="rounded-xl font-bold py-3 text-sm">Flashcards</SelectItem>
                  <SelectItem value="truefalse" className="rounded-xl font-bold py-3 text-sm">True / False</SelectItem>
                  <SelectItem value="match" className="rounded-xl font-bold py-3 text-sm">Matching</SelectItem>
                  <SelectItem value="mixed" className="rounded-xl font-bold py-3 text-sm">Mixed Types</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label htmlFor="timer" className="text-[10px] uppercase font-bold tracking-widest text-primary/80 ml-1">Time Limit (Sec)</Label>
              <Input
                id="timer"
                type="number"
                value={timer}
                onChange={(e) => setTimer(parseInt(e.target.value) || 0)}
                placeholder="300"
                className="rounded-2xl border-2 border-border/10 h-14 font-bold focus:ring-primary/10 shadow-inner bg-white/50"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="subject" className="text-[10px] uppercase font-bold tracking-widest text-primary/80 ml-1">Subject (Recommended)</Label>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger className="rounded-2xl border-2 border-border/10 h-14 font-bold text-foreground bg-white/50">
                  <SelectValue placeholder="Select Subject" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-0 shadow-strong ring-1 ring-border/50 p-2">
                  {SUBJECTS.map(s => (
                    <SelectItem key={s} value={s} className="rounded-xl font-bold py-3 text-sm">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label htmlFor="class" className="text-[10px] uppercase font-bold tracking-widest text-primary/80 ml-1">Grade / Class (Recommended)</Label>
              <Select value={targetClass} onValueChange={setTargetClass}>
                <SelectTrigger className="rounded-2xl border-2 border-border/10 h-14 font-bold text-foreground bg-white/50">
                  <SelectValue placeholder="Select Class" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-0 shadow-strong ring-1 ring-border/50 p-2">
                  {CLASSES.map(c => (
                    <SelectItem key={c} value={c} className="rounded-xl font-bold py-3 text-sm">{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3 md:col-span-2">
              <Label htmlFor="teacher" className="text-[10px] uppercase font-bold tracking-widest text-primary/80 ml-1">Educator / Teacher Name (Optional)</Label>
              <Input
                id="teacher"
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                placeholder="Enter name..."
                className="rounded-2xl border-2 border-border/10 h-14 font-bold focus:ring-primary/10 shadow-inner bg-white/50"
              />
            </div>
          </div>
        </Card>

        {/* Questions */}
        <div className="mb-12">
          <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4 px-2">
            <h2 className="text-xl font-bold tracking-tight text-foreground">Questions ({questions.length})</h2>
            <div className="flex gap-2 w-full sm:w-auto">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleCSVUpload}
                accept=".csv"
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="flex-1 sm:flex-none rounded-2xl h-12 font-bold text-[10px] uppercase tracking-widest border-2 border-secondary text-muted-foreground hover:bg-secondary transition-all bg-white"
              >
                <Upload className="mr-2 h-3.5 w-3.5" />
                Import CSV
              </Button>
              <Button onClick={addQuestion} className="flex-1 sm:flex-none bg-primary text-primary-foreground rounded-2xl h-12 shadow-md font-bold text-[10px] uppercase tracking-widest border-0">
                <Plus className="mr-2 h-3.5 w-3.5" />
                Add Question
              </Button>
            </div>
          </div>

          <div className="space-y-6">
            {questions.map((q, index) => (
              <Card key={q.id} className="p-0 overflow-hidden rounded-[2.5rem] border-0 bg-background shadow-soft ring-1 ring-border/50 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="flex items-center justify-between py-4 px-4 md:px-8 bg-secondary/20 border-b border-border/10">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-xs text-primary">
                      {index + 1}
                    </div>
                    {quizType === "mixed" && (
                      <Select
                        value={q.type}
                        onValueChange={(val: any) => {
                          const updates: any = { type: val };
                          if ((val === "mcq" || val === "multi_mcq") && (!q.options || q.options.length === 0)) updates.options = ["", "", "", ""];
                          if (val === "truefalse") updates.options = ["True", "False"];
                          if (val === "match" && (!q.pairs || q.pairs.length === 0)) updates.pairs = [{ left: "", right: "" }];
                          updateQuestion(q.id, "", updates);
                        }}
                      >
                        <SelectTrigger className="w-[140px] h-9 rounded-full text-[10px] font-bold uppercase tracking-widest bg-white/80 border-border/20 shadow-sm">
                          <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-0 shadow-strong ring-1 ring-border/50 p-1">
                          <SelectItem value="mcq" className="rounded-xl text-[10px] font-bold uppercase tracking-widest py-2">MCQ</SelectItem>
                          <SelectItem value="multi_mcq" className="rounded-xl text-[10px] font-bold uppercase tracking-widest py-2">Multi-MCQ</SelectItem>
                          <SelectItem value="oneword" className="rounded-xl text-[10px] font-bold uppercase tracking-widest py-2">Short Answer</SelectItem>
                          <SelectItem value="flashcard" className="rounded-xl text-[10px] font-bold uppercase tracking-widest py-2">Flashcard</SelectItem>
                          <SelectItem value="truefalse" className="rounded-xl text-[10px] font-bold uppercase tracking-widest py-2">True/False</SelectItem>
                          <SelectItem value="match" className="rounded-xl text-[10px] font-bold uppercase tracking-widest py-2">Match It</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeQuestion(q.id)}
                    className="text-destructive hover:bg-destructive/10 h-10 w-10 p-0 rounded-full transition-all"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="p-8 md:p-10">
                  {q.type === "flashcard" ? (
                    <div className="grid md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground opacity-70 ml-1">Front Side</Label>
                        <Textarea
                          value={q.front || ""}
                          onChange={(e) => updateQuestion(q.id, "front", e.target.value)}
                          placeholder="Term or concept..."
                          className="rounded-2xl border-2 border-border/10 min-h-[140px] p-5 font-bold focus:bg-white bg-white/50 shadow-inner"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground opacity-70 ml-1">Back Side</Label>
                        <Textarea
                          value={q.back || ""}
                          onChange={(e) => updateQuestion(q.id, "back", e.target.value)}
                          placeholder="Definition or answer..."
                          className="rounded-2xl border-2 border-border/10 min-h-[140px] p-5 font-bold focus:bg-white bg-white/50 shadow-inner"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      <div className="space-y-3">
                        <Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground opacity-70 ml-1">Question Prompt</Label>
                        <Textarea
                          value={q.question}
                          onChange={(e) => updateQuestion(q.id, "question", e.target.value)}
                          placeholder="Enter your question here..."
                          className="rounded-2xl border-2 border-border/10 min-h-[100px] p-5 md:p-6 text-base md:text-xl font-bold focus:bg-white bg-white/50 shadow-inner leading-relaxed"
                        />
                      </div>

                      <div className="space-y-3">
                        <Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground opacity-70 ml-1">Illustrative Image (Optional)</Label>
                        <div className="flex items-start gap-6">
                          <div
                            onClick={() => {
                              const input = document.getElementById(`img-input-${q.id}`) as HTMLInputElement;
                              input.click();
                            }}
                            className="w-32 h-32 md:w-40 md:h-40 shrink-0 rounded-[2rem] border-2 border-dashed border-border/20 bg-secondary/5 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-all overflow-hidden relative group"
                          >
                            {q.image ? (
                              <>
                                <img src={q.image} alt="Question Illustrative" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <Trash2 className="w-5 h-5 text-white" onClick={(e) => {
                                    e.stopPropagation();
                                    updateQuestion(q.id, "image", "");
                                  }} />
                                </div>
                              </>
                            ) : (
                              <>
                                <Plus className="w-5 h-5 text-primary/40 group-hover:scale-110 transition-transform" />
                                <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60 mt-2">Add Image</p>
                              </>
                            )}
                          </div>
                          <div className="flex-1 space-y-4 pt-2">
                            <p className="text-[10px] font-medium text-muted-foreground leading-relaxed">
                              Add an image to provide context, diagrams, or visual cues for this question. Ideal for Science, Geography, or Geometry modules.
                            </p>
                            <Input
                              type="file"
                              id={`img-input-${q.id}`}
                              className="hidden"
                              accept="image/*"
                              onChange={(e) => e.target.files?.[0] && handleImageUpload(q.id, e.target.files[0])}
                            />
                            {q.image && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateQuestion(q.id, "image", "")}
                                className="rounded-full h-8 text-[9px] font-bold uppercase tracking-widest border-destructive/20 text-destructive hover:bg-destructive hover:text-white"
                              >
                                Remove Image
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>

                      {(q.type === "mcq" || q.type === "multi_mcq") && q.options && (
                        <div className="grid md:grid-cols-2 gap-4">
                          {q.options.map((opt, i) => (
                            <div key={i} className="relative group">
                              <div className="absolute left-4 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-secondary flex items-center justify-center text-[10px] font-bold text-primary transition-all group-focus-within:bg-primary group-focus-within:text-white">
                                {String.fromCharCode(65 + i)}
                              </div>
                              <Input
                                value={opt}
                                onChange={(e) => updateOption(q.id, i, e.target.value)}
                                placeholder={`Option ${i + 1}`}
                                className="pl-14 rounded-xl border-2 border-border/10 h-12 font-bold focus:ring-primary/10 bg-white/50"
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      {q.type === "match" && (
                        <div className="space-y-6">
                          <div className="flex items-center justify-between border-b border-border/10 pb-4">
                            <h4 className="text-[10px] uppercase font-bold tracking-widest text-primary/80">Matching Pairs</h4>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const newPairs = [...(q.pairs || []), { left: "", right: "" }];
                                updateQuestion(q.id, "pairs", newPairs);
                              }}
                              className="rounded-full h-8 px-4 font-bold text-[10px] uppercase tracking-widest border-secondary text-primary hover:bg-primary hover:text-white hover:border-primary transition-all"
                            >
                              <Plus className="mr-1.5 h-3 w-3" /> Add Pair
                            </Button>
                          </div>
                          <div className="space-y-3">
                            {(q.pairs || []).map((pair, pIdx) => (
                              <div key={pIdx} className="flex gap-3 items-center group/pair animate-in fade-in slide-in-from-left-2 transition-all">
                                <Input
                                  placeholder="Source"
                                  value={pair.left}
                                  onChange={(e) => {
                                    const newPairs = [...(q.pairs || [])];
                                    newPairs[pIdx].left = e.target.value;
                                    updateQuestion(q.id, "pairs", newPairs);
                                  }}
                                  className="rounded-xl border-2 border-border/10 h-12 font-bold bg-white/50 focus:bg-white"
                                />
                                <div className="w-10 flex justify-center opacity-20 group-focus-within/pair:opacity-100 transition-opacity">
                                  <ArrowLeft className="rotate-180 w-4 h-4" />
                                </div>
                                <Input
                                  placeholder="Target"
                                  value={pair.right}
                                  onChange={(e) => {
                                    const newPairs = [...(q.pairs || [])];
                                    newPairs[pIdx].right = e.target.value;
                                    updateQuestion(q.id, "pairs", newPairs);
                                  }}
                                  className="rounded-xl border-2 border-border/10 h-12 font-bold bg-white/50 focus:bg-white"
                                />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={(q.pairs || []).length <= 1}
                                  onClick={() => {
                                    const newPairs = (q.pairs || []).filter((_, i) => i !== pIdx);
                                    updateQuestion(q.id, "pairs", newPairs);
                                  }}
                                  className="text-destructive/50 hover:text-destructive hover:bg-destructive/10 h-10 w-10 p-0 rounded-full"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="grid md:grid-cols-2 gap-8 pt-6 border-t border-border/10">
                        {q.type !== "match" && (
                          <div className="space-y-3">
                            <Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground opacity-70 ml-1">Correct Answer</Label>
                            {q.type === "truefalse" ? (
                              <Select
                                value={q.answer}
                                onValueChange={(val) => updateQuestion(q.id, "answer", val)}
                              >
                                <SelectTrigger className="rounded-xl border-2 border-border/10 h-14 font-bold text-primary bg-white/50">
                                  <SelectValue placeholder="Select correct option" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-0 shadow-strong p-1">
                                  <SelectItem value="True" className="rounded-xl font-bold py-3 text-sm text-green-600">True</SelectItem>
                                  <SelectItem value="False" className="rounded-xl font-bold py-3 text-sm text-destructive">False</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <Input
                                value={q.answer}
                                onChange={(e) => updateQuestion(q.id, "answer", e.target.value)}
                                placeholder={q.type === "mcq" ? "Type the exact text..." : q.type === "multi_mcq" ? "Separate with | (e.g. Option 1|Option 2)" : "Correct answer..."}
                                className="rounded-xl border-2 border-border/10 h-14 font-bold bg-white/50 focus:bg-white focus:ring-primary/10"
                              />
                            )}
                          </div>
                        )}
                        <div className="space-y-3">
                          <Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground opacity-70 ml-1">Points Value</Label>
                          <Input
                            type="number"
                            value={q.points}
                            onChange={(e) => updateQuestion(q.id, "points", parseInt(e.target.value) || 0)}
                            className="rounded-xl border-2 border-border/10 h-14 font-bold bg-white/50 text-center"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>

        <Button
          onClick={saveQuiz}
          size="lg"
          className="w-full bg-primary text-primary-foreground rounded-[2rem] h-16 shadow-strong hover:bg-secondary hover:text-primary hover:scale-[1.01] transition-all text-xl font-bold tracking-tight border-0"
        >
          {isEditing ? "Save Changes" : "Deploy Quiz Module"}
        </Button>
      </main>
    </div >
  );
};

export default CreateQuiz;
