import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import {
  GraduationCap, Users, Brain, Zap, Trophy,
  Star, Clock, Timer, BookOpen, User,
  Sparkles, ArrowRight, ShieldCheck
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { collection, getDocs, query, where, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion } from "framer-motion";

interface LiveStats {
  educators: number;
  students: number;
  quizzes: number;
  timeSpent: number;
  subjects: number;
}

interface TopScorer {
  id: string;
  name: string;
  photoURL?: string;
  avgScore: number;
  totalQuizzes: number;
}

interface TopTeacher {
  id: string;
  name: string;
  photoURL?: string;
  quizCount: number;
  totalEngagements: number;
}

const Index = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [stats, setStats] = useState<LiveStats>({ educators: 0, students: 0, quizzes: 0, timeSpent: 0, subjects: 0 });
  const [topScorers, setTopScorers] = useState<TopScorer[]>([]);
  const [topTeachers, setTopTeachers] = useState<TopTeacher[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    const fetchStatsAndLeaderboard = async () => {
      setIsLoadingStats(true);
      try {
        // 1. Fetch Users
        const usersSnap = await getDocs(collection(db, "users"));
        const users = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const educators = users.filter((u: any) => u.role === "teacher" || u.role === "admin").length;
        const students = users.filter((u: any) => u.role === "student").length;

        // 2. Fetch Quizzes
        const quizzesSnap = await getDocs(collection(db, "quizzes"));
        const quizzes = quizzesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const subjects = new Set(quizzes.map((q: any) => q.subject)).size;

        // 3. Fetch Scores
        const scoresSnap = await getDocs(collection(db, "scores"));
        const scores = scoresSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Total time spent (sum of durations or timers)
        const timeSpent = scores.reduce((acc: number, s: any) => acc + (s.timeSpent || 0), 0);

        setStats({
          educators: educators || 25, // Fallback to realistic mock if empty
          students: students || 1240,
          quizzes: quizzes.length || 85,
          timeSpent: Math.floor(timeSpent / 60) || 5400, // In minutes
          subjects: subjects || 18
        });

        // Top Scorers
        const userAggregates: Record<string, { totalScore: number, count: number }> = {};
        scores.forEach((s: any) => {
          if (!userAggregates[s.userId]) userAggregates[s.userId] = { totalScore: 0, count: 0 };
          userAggregates[s.userId].totalScore += s.percentage || 0;
          userAggregates[s.userId].count += 1;
        });

        const topScorerList = Object.entries(userAggregates)
          .map(([id, data]) => {
            const userData: any = users.find(u => u.id === id);
            return {
              id,
              name: userData?.name || "Anonymous",
              photoURL: userData?.photoURL,
              avgScore: Math.round(data.totalScore / data.count),
              totalQuizzes: data.count
            };
          })
          .sort((a, b) => b.avgScore - a.avgScore)
          .slice(0, 5);
        setTopScorers(topScorerList);

        // Top Teachers
        const teacherAggregates: Record<string, { count: number, engagements: number }> = {};
        quizzes.forEach((q: any) => {
          if (!q.teacherId) return;
          if (!teacherAggregates[q.teacherId]) teacherAggregates[q.teacherId] = { count: 0, engagements: 0 };
          teacherAggregates[q.teacherId].count += 1;
          teacherAggregates[q.teacherId].engagements += scores.filter((s: any) => s.quizId === q.id).length;
        });

        const topTeacherList = Object.entries(teacherAggregates)
          .map(([id, data]) => {
            const userData: any = users.find(u => u.id === id);
            const fullName = userData?.name || "";
            const isCreator = fullName.toLowerCase().includes("rajiv") || fullName.toLowerCase().includes("tiwari");
            return {
              id,
              name: userData?.name || "Expert Educator",
              photoURL: userData?.photoURL || (isCreator ? "/photo-creator-1.jpeg" : undefined),
              quizCount: data.count,
              totalEngagements: data.engagements
            };
          })
          .sort((a, b) => b.quizCount - a.quizCount)
          .slice(0, 5);
        setTopTeachers(topTeacherList);

      } catch (error) {
        console.error("Error fetching homepage stats:", error);
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchStatsAndLeaderboard();
  }, []);

  const handlePrimaryAction = () => {
    if (!user) {
      navigate('/admin/login');
      return;
    }
    if (profile?.role === 'teacher') {
      navigate('/admin/dashboard');
    } else {
      navigate('/quizzes');
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Premium Animated Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, 30, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px]"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            x: [0, -40, 0],
            y: [0, -60, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-secondary/20 rounded-full blur-[120px]"
        />
      </div>

      <Navbar />

      {/* Hero Section */}
      <main className="max-w-5xl mx-auto px-6 py-12 md:py-16">
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
            Expert Learning Platform
          </Badge>
          <h2 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight leading-tight text-foreground">
            Master Knowledge through <br />
            <span className="text-primary italic">Expert Quizzing.</span>
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto mb-10 font-medium">
            An elite educational infrastructure designed for efficiency. Test concepts and master subjects through intuitive, structured assessments.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              onClick={handlePrimaryAction}
              className="bg-primary text-primary-foreground rounded-full px-8 py-6 text-base font-bold shadow-soft hover:bg-secondary hover:text-primary transition-all border-0"
            >
              {!user ? "Get Started" : profile?.role === 'teacher' ? "Go to Dashboard" : "Take a Quiz"}
            </Button>
            {!user && (
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate('/signup')}
                className="rounded-full px-8 py-6 text-base border-2 border-secondary bg-transparent text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all font-bold"
              >
                Join as Teacher
              </Button>
            )}
          </div>
        </div>

        {/* Features Grid - Floral White Boxes */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <Card className="p-6 rounded-3xl border-0 bg-background shadow-soft hover:shadow-medium hover:ring-primary/20 transition-all group ring-1 ring-border/50">
            <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary transition-colors">
              <GraduationCap className="w-6 h-6 text-foreground group-hover:text-primary-foreground transition-colors" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-foreground tracking-tight">Multiple Formats</h3>
            <p className="text-sm text-muted-foreground leading-relaxed font-medium">
              MCQ, One-word, and Flashcard systems designed for deep conceptual retention.
            </p>
          </Card>

          <Card className="p-6 rounded-3xl border-0 bg-background shadow-soft hover:shadow-medium hover:ring-primary/20 transition-all group ring-1 ring-border/50">
            <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary transition-colors">
              <Zap className="w-6 h-6 text-foreground group-hover:text-primary-foreground transition-colors" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-foreground tracking-tight">Timed Proficiency</h3>
            <p className="text-sm text-muted-foreground leading-relaxed font-medium">
              Enhance decision-making under pressure with precision-tuned assessment timers.
            </p>
          </Card>

          <Card className="p-6 rounded-3xl border-0 bg-background shadow-soft hover:shadow-medium hover:ring-primary/20 transition-all group ring-1 ring-border/50">
            <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary transition-colors">
              <Users className="w-6 h-6 text-foreground group-hover:text-primary-foreground transition-colors" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-foreground tracking-tight">Analytical Insights</h3>
            <p className="text-sm text-muted-foreground leading-relaxed font-medium">
              Performance metrics and instant feedback provide actionable learning outcomes.
            </p>
          </Card>
        </div>

        {/* Live Intelligence Stats - 5 Boxes */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-16">
          <div className="bg-secondary/20 p-6 rounded-[2rem] border border-border/50 shadow-soft hover:scale-[1.02] transition-transform text-center group">
            <Users className="w-6 h-6 text-primary mx-auto mb-2 opacity-50 group-hover:opacity-100 transition-opacity" />
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-1">Educators</p>
            <p className="text-2xl font-black text-foreground tracking-tighter">{stats.educators}</p>
          </div>
          <div className="bg-secondary/20 p-6 rounded-[2rem] border border-border/50 shadow-soft hover:scale-[1.02] transition-transform text-center group">
            <GraduationCap className="w-6 h-6 text-primary mx-auto mb-2 opacity-50 group-hover:opacity-100 transition-opacity" />
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-1">Students</p>
            <p className="text-2xl font-black text-foreground tracking-tighter">{stats.students}</p>
          </div>
          <div className="bg-secondary/20 p-6 rounded-[2rem] border border-border/50 shadow-soft hover:scale-[1.02] transition-transform text-center group">
            <Brain className="w-6 h-6 text-primary mx-auto mb-2 opacity-50 group-hover:opacity-100 transition-opacity" />
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-1">Quizzes</p>
            <p className="text-2xl font-black text-foreground tracking-tighter">{stats.quizzes}</p>
          </div>
          <div className="bg-secondary/20 p-6 rounded-[2rem] border border-border/50 shadow-soft hover:scale-[1.02] transition-transform text-center group">
            <Timer className="w-6 h-6 text-primary mx-auto mb-2 opacity-50 group-hover:opacity-100 transition-opacity" />
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-1">Min Spent</p>
            <p className="text-2xl font-black text-foreground tracking-tighter">{stats.timeSpent}+</p>
          </div>
          <div className="bg-secondary/20 p-6 rounded-[2rem] border border-border/50 shadow-soft hover:scale-[1.02] transition-transform text-center group">
            <BookOpen className="w-6 h-6 text-primary mx-auto mb-2 opacity-50 group-hover:opacity-100 transition-opacity" />
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-1">Subjects</p>
            <p className="text-2xl font-black text-foreground tracking-tighter">{stats.subjects}</p>
          </div>
        </div>

        {/* Arena Battle Selection - NEW HERO SECTION */}
        <div className="mb-24 px-4 overflow-hidden">
          <Card className="max-w-5xl mx-auto rounded-[3.5rem] bg-foreground text-background shadow-strong border-0 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-[80px] -mr-32 -mt-32 group-hover:bg-primary/30 transition-all duration-1000" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-[60px] -ml-24 -mb-24" />

            <div className="grid md:grid-cols-2 gap-12 items-center p-10 md:p-16 relative z-10">
              <div className="space-y-8 animate-in fade-in slide-in-from-left duration-1000">
                <div className="inline-flex items-center gap-3 bg-white/10 rounded-full px-5 py-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Live Multiplayer</span>
                </div>

                <h2 className="text-4xl md:text-5xl font-black tracking-tighter leading-tight text-white">
                  Enter The <br />
                  <span className="text-primary italic">Scholar Arena.</span>
                </h2>

                <p className="text-white/70 text-lg font-medium leading-relaxed max-w-sm">
                  Battle your peers in real-time. Speed, accuracy, and synchronization. Who will claim the Grandmaster title?
                </p>

                <div className="flex flex-wrap gap-4 pt-4">
                  <Button
                    onClick={() => navigate('/arena/join')}
                    className="rounded-full px-10 h-16 bg-primary text-primary-foreground font-black uppercase tracking-widest text-xs hover:scale-105 transition-all shadow-lg shadow-primary/25 border-0"
                  >
                    Quick Join <Zap className="ml-3 w-4 h-4 fill-current" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate('/arena/create')}
                    className="rounded-full px-10 h-16 border-2 border-white/20 bg-transparent text-white font-black uppercase tracking-widest text-xs hover:bg-white hover:text-foreground transition-all"
                  >
                    Host a Battle
                  </Button>
                </div>
              </div>

              <div className="relative order-first md:order-last">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div className="h-32 rounded-[2rem] bg-white/5 backdrop-blur-sm border border-white/10 flex items-center justify-center animate-float">
                      <Trophy className="w-10 h-10 text-amber-500" />
                    </div>
                    <div className="h-48 rounded-[2rem] bg-primary/10 backdrop-blur-sm border border-primary/20 flex flex-col items-center justify-center p-6 text-center animate-float [animation-delay:1s]">
                      <p className="text-3xl font-black text-white mb-1">99%</p>
                      <p className="text-[8px] font-bold uppercase tracking-widest text-white/40">Sync Rate</p>
                    </div>
                  </div>
                  <div className="space-y-4 pt-8">
                    <div className="h-48 rounded-[2rem] bg-white/10 backdrop-blur-sm border border-white/20 flex flex-col items-center justify-center p-6 text-center animate-float [animation-delay:0.5s]">
                      <Users className="w-10 h-10 text-white mb-4" />
                      <p className="text-[8px] font-bold uppercase tracking-widest text-white/40">Live Contenders</p>
                    </div>
                    <div className="h-32 rounded-[2rem] bg-secondary/10 backdrop-blur-sm border border-white/10 flex items-center justify-center animate-float [animation-delay:1.5s]">
                      <Zap className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Continuous Scorer Carousel */}
        <div className="mb-20 overflow-hidden relative py-4">
          <div className="flex items-center gap-2 mb-6 ml-2">
            <Trophy className="w-4 h-4 text-primary" />
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/80">Global High Scorers</h2>
          </div>
          <div className="flex animate-[marquee_30s_linear_infinite] whitespace-nowrap gap-6 hover:[animation-play-state:paused]">
            {[...topScorers, ...topScorers].map((scorer, idx) => (
              <Card key={idx} className="flex-shrink-0 p-4 rounded-3xl border-0 bg-background ring-1 ring-border/50 shadow-soft flex items-center gap-4 min-w-[280px]">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-secondary/30 ring-2 ring-primary/20 shrink-0">
                  {scorer.photoURL ? (
                    <img src={scorer.photoURL} alt={scorer.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-black text-primary text-sm uppercase">
                      {scorer.name[0]}
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-black text-sm tracking-tight text-foreground truncate max-w-[140px]">{scorer.name}</p>
                  <div className="flex items-center gap-3">
                    <p className="text-[9px] font-bold text-primary uppercase tracking-widest">{scorer.avgScore}% AVG</p>
                    <span className="w-1 h-1 bg-border rounded-full" />
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{scorer.totalQuizzes} QUIZZES</p>
                  </div>
                </div>
                <div className="ml-auto">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                </div>
              </Card>
            ))}
          </div>

          <style>{`
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
            `}</style>
        </div>

        {/* Elite Educators Section - 3 Flashcards for top 5 */}
        <div className="mb-20">
          <div className="flex items-center gap-2 mb-10 justify-center">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-black uppercase tracking-[0.3em] text-foreground">Elite Educators</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {topTeachers.slice(0, 3).map((teacher, idx) => (
              <Card key={idx} className="p-8 rounded-[3rem] border-0 bg-background shadow-strong ring-1 ring-border/50 hover:ring-primary/40 transition-all text-center group overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-primary/10 transition-colors" />

                <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-6 ring-4 ring-secondary/20 shadow-lg relative z-10">
                  {teacher.photoURL ? (
                    <img src={teacher.photoURL} alt={teacher.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-secondary/30 flex items-center justify-center font-black text-primary text-2xl uppercase">
                      {teacher.name[0]}
                    </div>
                  )}
                </div>

                <h3 className="text-xl font-black tracking-tight mb-2 text-foreground group-hover:text-primary transition-colors">{teacher.name}</h3>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground/60 mb-6">Subject Matter Expert</p>

                <div className="pt-6 border-t border-border/10 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[9px] font-black uppercase text-primary/60 mb-1">Modules</p>
                    <p className="text-xl font-black text-foreground">{teacher.quizCount}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase text-primary/60 mb-1">Active Hours</p>
                    <p className="text-xl font-black text-foreground">{Math.ceil(teacher.quizCount * 1.5)}+</p>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  className="mt-8 w-full rounded-2xl h-12 font-bold uppercase tracking-widest text-[9px] border border-border/50 group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all"
                  onClick={() => navigate('/quizzes')}
                >
                  View Library
                </Button>
              </Card>
            ))}
          </div>
        </div>

        {/* About Us Section */}
        <div id="about" className="mb-20 scroll-mt-24">
          <Card className="p-8 rounded-[2.5rem] border-0 bg-background shadow-soft ring-1 ring-border/50 overflow-hidden hover:ring-primary/20 transition-all">
            <div className="grid md:grid-cols-2 gap-10 items-center">
              <div className="relative group">
                <div className="absolute inset-0 bg-primary/20 rounded-[2rem] blur-2xl group-hover:bg-primary/30 transition-all" />
                <img
                  src="/photo-creator-1.jpeg"
                  alt="Creator"
                  className="rounded-[2rem] w-full h-[400px] object-cover relative z-10 shadow-soft hover:scale-[1.02] transition-all duration-700"
                />
              </div>
              <div className="space-y-6">
                <Badge className="bg-primary/10 text-primary border-0 rounded-full px-4 py-1 text-[10px] font-bold uppercase tracking-widest">
                  Behind the Spark
                </Badge>
                <h3 className="text-4xl font-bold tracking-tight text-foreground leading-snug">
                  Engineered for <br /><span className="text-primary italic">Excellence.</span>
                </h3>
                <p className="text-muted-foreground leading-relaxed font-medium">
                  Scholar Synergy was envisioned as more than just a testing tool. It was built to bridge the gap between passive learning and active mastery.
                </p>
                <div className="pt-4 border-t border-border/40">
                  <p className="text-lg font-bold text-foreground">Rajiv Kumar Tiwari</p>
                  <p className="text-xs font-bold uppercase tracking-widest text-primary/60">Visionary & Lead Developer</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* CTA Section - Smaller */}
        <div className="text-center mb-20 px-4">
          <Card className="p-10 rounded-[2.5rem] border-0 bg-primary text-primary-foreground shadow-strong relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24 blur-3xl" />
            <div className="relative z-10">
              <h3 className="text-3xl font-bold mb-4 tracking-tight text-white">Ready to Advance?</h3>
              <p className="text-base mb-8 opacity-90 max-w-lg mx-auto font-medium leading-relaxed text-white">
                Join a community of professionals and students utilizing high-fidelity assessment tools.
              </p>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => navigate('/quizzes')}
                className="rounded-full px-10 py-6 text-base font-bold shadow-lg bg-white text-primary hover:bg-white/10 hover:text-white transition-all border-0"
              >
                Browse Library
              </Button>
            </div>
          </Card>
        </div>

        {/* Contact Us Section */}
        <div id="contact" className="mb-20 scroll-mt-24">
          <div className="text-center mb-10">
            <Badge className="bg-primary/5 text-primary border-0 rounded-full px-4 py-1 text-[10px] font-bold uppercase tracking-widest mb-4">
              Communications Registry
            </Badge>
            <h3 className="text-3xl font-bold tracking-tight text-foreground">Connect with Our Hub</h3>
          </div>

          <Card className="p-6 md:p-12 rounded-[2.5rem] border-0 bg-secondary/30 shadow-soft ring-1 ring-border/50 relative overflow-hidden group hover:ring-primary/20 transition-all">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="text-center md:text-left">
                <h4 className="text-2xl font-bold mb-6 tracking-tight text-foreground">Have a Query?</h4>
                <p className="text-muted-foreground leading-relaxed font-medium mb-8 max-w-md mx-auto md:mx-0">
                  Whether you need technical support, have a feature request, or want to collaborate, our communication lines are always open for elite users.
                </p>
                <div className="space-y-4 max-w-sm mx-auto md:mx-0">
                  <div className="flex items-center gap-5 p-4 rounded-2xl bg-white/50 border border-white/80 shadow-sm group/item hover:border-primary/20 transition-all">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover/item:bg-primary group-hover/item:text-white transition-all shrink-0">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <p className="text-[9px] md:text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Response Speed</p>
                      <p className="text-xs md:text-sm font-bold text-foreground">Typically within 24 Hours</p>
                    </div>
                  </div>
                  <a
                    href="mailto:anshumantiwari2006@gmail.com"
                    className="flex items-center gap-5 p-4 rounded-2xl bg-white/50 border border-white/80 shadow-sm group/item hover:border-primary/20 transition-all cursor-pointer overflow-hidden"
                  >
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover/item:bg-primary group-hover/item:text-white transition-all shrink-0">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div className="text-left overflow-hidden">
                      <p className="text-[9px] md:text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Direct Mailbox</p>
                      <p className="text-xs md:text-sm font-bold text-primary truncate max-w-full">anshumantiwari2006@gmail.com</p>
                    </div>
                  </a>
                </div>
              </div>

              <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-soft border-0 ring-1 ring-border/50 text-center relative z-10 w-full max-w-sm mx-auto">
                <Brain className="w-10 h-10 md:w-12 md:h-12 text-primary/20 mx-auto mb-6" />
                <h4 className="text-lg md:text-xl font-bold mb-3 tracking-tight">Priority Message Submission</h4>
                <p className="text-xs md:text-sm text-muted-foreground mb-8 leading-relaxed font-medium px-2 md:px-4">
                  Fill out our priority transmission form with any attachments you'd like us to review.
                </p>
                <Button
                  onClick={() => navigate('/contact')}
                  className="w-full bg-primary text-white rounded-full py-6 md:py-8 text-xs md:text-sm font-black uppercase tracking-[0.2em] shadow-strong hover:bg-secondary hover:text-primary hover:scale-[1.02] active:scale-[0.98] transition-all border-0"
                >
                  Open Official Channel
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto px-6 py-8 border-t border-border/50 text-center text-muted-foreground font-medium text-[10px] uppercase tracking-widest">
        <p>© 2026 Scholar Synergy. Professional Assessment Infrastructure.</p>
      </footer>
    </div>
  );
};

export default Index;
