import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Brain, Clock, FileQuestion, ArrowRight, Home, Filter, Sparkles, BookOpen, GraduationCap, User } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";

import { fetchQuizzes, Quiz } from "@/lib/quizLoader";

const SUBJECTS = [
  "All Subjects", "English", "Mathematics", "Science", "Physics", "Chemistry", "Biology",
  "History", "Geography", "Civics", "Computer Science", "Hindi", "Sanskrit",
  "Economics", "Accountancy", "Business Studies", "General Knowledge",
  "Environmental Studies", "Physical Education", "Fine Arts", "Psychology"
];

const CLASSES = ["All Classes", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th", "11th", "12th"];

import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";

const QuizList = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState("All Subjects");
  const [selectedClass, setSelectedClass] = useState("All Classes");
  const [selectedTeacher, setSelectedTeacher] = useState("All Educators");

  useEffect(() => {
    const loadAllQuizzes = async () => {
      setIsLoading(true);
      try {
        const q = query(collection(db, "quizzes"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        const fetchedQuizzes = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Quiz[];

        setQuizzes(fetchedQuizzes);
      } catch (error: any) {
        console.error("Error fetching quizzes:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAllQuizzes();
  }, []);

  const teachers = ["All Educators", ...Array.from(new Set(quizzes.map(q => q.teacherName).filter(Boolean)))];

  const filteredQuizzes = quizzes.filter(quiz => {
    const subjectMatch = selectedSubject === "All Subjects" || quiz.subject === selectedSubject;
    const classMatch = selectedClass === "All Classes" || quiz.class === selectedClass;
    const teacherMatch = selectedTeacher === "All Educators" || quiz.teacherName === selectedTeacher;
    return subjectMatch && classMatch && teacherMatch;
  });

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <Navbar />

      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* Selection / Filter Panel */}
        <Card className="p-5 md:p-8 rounded-[2.5rem] border-0 bg-secondary/30 shadow-soft ring-1 ring-border/50 mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="flex items-center gap-2 mb-6 ml-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/80">Customize Your Workspace</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <GraduationCap className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Select Grade Level</span>
              </div>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="rounded-2xl border-2 border-border/10 h-14 font-extrabold text-foreground bg-white/50 focus:ring-primary/10">
                  <SelectValue placeholder="All Classes" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-0 shadow-strong ring-1 ring-border/50 p-2">
                  {CLASSES.map(c => (
                    <SelectItem key={c} value={c} className="rounded-xl font-bold py-3 text-sm">{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Select Domain / Subject</span>
              </div>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger className="rounded-2xl border-2 border-border/10 h-14 font-extrabold text-foreground bg-white/50 focus:ring-primary/10">
                  <SelectValue placeholder="All Subjects" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-0 shadow-strong ring-1 ring-border/50 p-2 max-h-[300px]">
                  {SUBJECTS.map(s => (
                    <SelectItem key={s} value={s} className="rounded-xl font-bold py-3 text-sm">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <User className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Filter by Educator</span>
              </div>
              <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                <SelectTrigger className="rounded-2xl border-2 border-border/10 h-14 font-extrabold text-foreground bg-white/50 focus:ring-primary/10">
                  <SelectValue placeholder="All Educators" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-0 shadow-strong ring-1 ring-border/50 p-2 max-h-[300px]">
                  {teachers.map(t => (
                    <SelectItem key={t} value={t} className="rounded-xl font-bold py-3 text-sm">{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-6" />
            <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground animate-pulse">Scanning Registry...</p>
          </div>
        ) : filteredQuizzes.length === 0 ? (
          <Card className="p-8 md:p-20 rounded-[3rem] shadow-soft text-center border-0 bg-background ring-1 ring-border/50 max-w-2xl mx-auto">
            <div className="w-20 h-20 bg-secondary rounded-[2rem] flex items-center justify-center mx-auto mb-8">
              <Filter className="w-10 h-10 text-primary/30" />
            </div>
            <h2 className="text-2xl font-black mb-3 tracking-tight text-foreground">No Modules Found</h2>
            <p className="text-muted-foreground text-lg mb-10 font-medium">Try adjusting your filters or search criteria.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => { setSelectedSubject("All Subjects"); setSelectedClass("All Classes"); setSelectedTeacher("All Educators"); }}
                variant="outline"
                className="rounded-full px-10 h-14 font-bold border-2 border-secondary hover:bg-primary hover:text-white hover:border-primary transition-all text-foreground bg-transparent"
              >
                Reset Filters
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredQuizzes.map((quiz) => (
              <Card
                key={quiz.id}
                className="group overflow-hidden rounded-[2.5rem] border-0 bg-background shadow-soft hover:shadow-strong transition-all cursor-pointer ring-1 ring-border/50 relative"
                onClick={() => navigate(`/quiz/${quiz.id}`)}
              >
                <div className="p-6 md:p-8 pb-10">
                  <div className="flex justify-between items-start mb-8">
                    <div className="w-12 h-12 bg-secondary rounded-2xl flex items-center justify-center group-hover:bg-primary transition-all duration-300">
                      <Brain className="w-6 h-6 text-primary group-hover:text-white transition-colors" />
                    </div>
                    {quiz.class && (
                      <Badge className="bg-primary/10 text-primary border-0 rounded-lg px-2 py-0.5 text-[9px] font-black uppercase tracking-wider">
                        {quiz.class}
                      </Badge>
                    )}
                  </div>

                  <h3 className="text-xl font-bold mb-3 tracking-tight text-foreground group-hover:text-primary transition-colors line-clamp-2 min-h-[3.5rem]">{quiz.title}</h3>

                  {quiz.subject && (
                    <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-6 opacity-60">
                      {quiz.subject}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2 mb-8">
                    <Badge variant="outline" className="border-border/40 bg-transparent rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground group-hover:border-primary/20 transition-colors">
                      <FileQuestion className="w-3 h-3 mr-1.5" />
                      {quiz.questionCount} Items
                    </Badge>
                    {quiz.timer > 0 && (
                      <Badge variant="outline" className="border-border/40 bg-transparent rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground group-hover:border-primary/20 transition-colors">
                        <Clock className="w-3 h-3 mr-1.5" />
                        {Math.floor(quiz.timer / 60)}m
                      </Badge>
                    )}
                  </div>

                  {quiz.teacherName && (
                    <div className="flex items-center gap-2 mb-8 mt-[-10px] opacity-80">
                      <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center">
                        <User className="w-3 h-3 text-primary" />
                      </div>
                      <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{quiz.teacherName}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-6 border-t border-border/10">
                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.1em] opacity-0 group-hover:opacity-100 translate-x-[-10px] group-hover:translate-x-0 transition-all duration-300">
                      Initialize Quiz
                    </span>
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center group-hover:bg-primary transition-all duration-300 shadow-sm">
                      <ArrowRight className="w-5 h-5 text-primary group-hover:text-white transition-all" />
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default QuizList;
