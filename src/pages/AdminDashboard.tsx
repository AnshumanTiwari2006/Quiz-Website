import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Brain, Plus, List, LogOut, Award, ShieldAlert, Users, History, CheckCircle2, XCircle, Mail, Calendar, FileSpreadsheet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Papa from "papaparse";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, loading: authLoading } = useAuth();

  const [quizCount, setQuizCount] = useState(0);
  const [attemptedCount, setAttemptedCount] = useState(0);
  const [totalStudents, setTotalStudents] = useState(0);
  const [completedToday, setCompletedToday] = useState(0);
  const [cheatedCount, setCheatedCount] = useState(0);

  const [scores, setScores] = useState<any[]>([]);
  const [cheatedScores, setCheatedScores] = useState<any[]>([]);

  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailTitle, setDetailTitle] = useState("");
  const [detailType, setDetailType] = useState<"attempted" | "cheated" | "today" | "joined">("attempted");
  const [detailList, setDetailList] = useState<any[]>([]);

  useEffect(() => {
    if (!authLoading && (!user || profile?.role !== "teacher")) {
      navigate("/admin/login");
      return;
    }

    const loadStats = async () => {
      try {
        // Quizzes created by this teacher
        const qQuizzes = query(collection(db, "quizzes"), where("teacherId", "==", user?.uid));
        const snapQuizzes = await getDocs(qQuizzes);
        const uniqueQuizTitles = new Set(snapQuizzes.docs.map(doc => doc.data().title.trim().toLowerCase()));
        setQuizCount(uniqueQuizTitles.size);

        // Total students registered in the whole app
        const qAllStudents = query(collection(db, "users"), where("role", "==", "student"));
        const snapAllStudents = await getDocs(qAllStudents);
        setTotalStudents(snapAllStudents.size);

        // Scores for THIS teacher's quizzes
        const qScores = query(collection(db, "scores"), where("teacherId", "==", user?.uid));
        const snapScores = await getDocs(qScores);
        let allTeacherScores = snapScores.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];

        // Memory sort by timestamp descending
        allTeacherScores.sort((a, b) =>
          new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()
        );

        setScores(allTeacherScores);

        // Students who attempted (unique by userId)
        const successfulAttempts = allTeacherScores.filter(s => !s.isCheated);
        const uniqueAttempted = new Set(successfulAttempts.map(s => s.userId || s.userName));
        setAttemptedCount(uniqueAttempted.size);

        // Cheated Students
        const cheatedList = allTeacherScores.filter(s => s.isCheated);
        setCheatedScores(cheatedList);
        const uniqueCheated = new Set(cheatedList.map(s => s.userId || s.userName));
        setCheatedCount(uniqueCheated.size);

        // Completed Today (Local date matching)
        const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
        const dailyScores = successfulAttempts.filter(s => {
          const scoreDate = new Date(s.timestamp || "").toLocaleDateString('en-CA');
          return scoreDate === today;
        });
        setCompletedToday(dailyScores.length);

      } catch (error) {
        console.error("Error loading dashboard stats:", error);
        toast({
          title: "Dashboard Error",
          description: "Could not sync latest stats. Please refresh.",
          variant: "destructive"
        });
      }
    };

    if (user) {
      loadStats();
    }
  }, [navigate, user, profile, authLoading]);

  const showDetails = (type: "attempted" | "cheated" | "today" | "joined") => {
    setDetailType(type);
    if (type === "attempted") {
      setDetailTitle("Student Attempts");
      const uniqueMap = new Map();
      scores.filter(s => !s.isCheated).forEach(s => {
        const key = s.userId || s.userName;
        if (!uniqueMap.has(key)) uniqueMap.set(key, s);
      });
      setDetailList(Array.from(uniqueMap.values()));
    } else if (type === "cheated") {
      setDetailTitle("Integrity Violations");
      setDetailList(cheatedScores);
    } else if (type === "today") {
      setDetailTitle("Completed Today");
      const todayStr = new Date().toISOString().split('T')[0];
      setDetailList(scores.filter(s => !s.isCheated && (s.timestamp || "").startsWith(todayStr)));
    }
    setIsDetailOpen(true);
  };

  const exportScores = () => {
    if (scores.length === 0) return toast({ title: "No data to export" });

    const exportData = scores.map(s => ({
      Student: s.userName,
      Email: s.userEmail,
      Quiz: s.quizTitle,
      Score: `${Math.round(s.percentage)}%`,
      Date: new Date(s.timestamp).toLocaleString(),
      Status: s.isCheated ? "FLAGGED/CHEATED" : "VALID"
    }));

    const csv = Papa.unparse(exportData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `student_scores_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Scoreboard Exported", description: "CSV file generated successfully." });
  };

  const dashboardStats = [
    { label: "Your Modules", value: quizCount, icon: Brain, color: "text-primary", bg: "bg-primary/5" },
    { label: "Students Attempted", value: attemptedCount, icon: Award, color: "text-green-600", bg: "bg-green-50", onClick: () => showDetails("attempted") },
    { label: "Students Joined", value: totalStudents, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Cheated", value: cheatedCount, icon: ShieldAlert, color: "text-destructive", bg: "bg-destructive/5", onClick: () => showDetails("cheated") },
    { label: "Completed Today", value: completedToday, icon: History, color: "text-orange-600", bg: "bg-orange-50", onClick: () => showDetails("today") },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black tracking-tight mb-2">Educator Central</h1>
            <p className="text-muted-foreground font-bold uppercase tracking-widest text-[10px] opacity-70">Analytical Dashboard & Performance Metrics</p>
          </div>
          <Button
            className="rounded-2xl h-12 px-6 font-bold bg-primary shadow-soft gap-2"
            onClick={exportScores}
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export Scoreboard
          </Button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-16">
          {dashboardStats.map((stat, index) => (
            <Card
              key={index}
              className={`p-5 rounded-3xl border-0 ${stat.bg} shadow-soft hover:shadow-medium transition-all group ring-1 ring-border/50 relative overflow-hidden ${stat.onClick ? "cursor-pointer active:scale-95" : ""}`}
              onClick={stat.onClick}
            >
              <div className="flex flex-col items-center text-center relative z-10">
                <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center mb-3 ring-1 ring-white/50 shadow-sm`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-1">{stat.label}</p>
                <p className={`text-3xl font-black ${stat.color} tracking-tight`}>{stat.value}</p>
              </div>
            </Card>
          ))}
        </div>

        <div className="space-y-6">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-2">Management Operations</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <Card
              className="p-8 rounded-[2.5rem] border-0 bg-background shadow-soft hover:shadow-medium hover:ring-primary/10 transition-all cursor-pointer ring-1 ring-border/50 group"
              onClick={() => navigate('/admin/create')}
            >
              <div className="flex items-start gap-6">
                <div className="w-14 h-14 bg-secondary rounded-xl flex items-center justify-center group-hover:bg-primary transition-colors duration-300">
                  <Plus className="w-7 h-7 text-primary group-hover:text-primary-foreground transition-colors duration-300" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2 tracking-tight group-hover:text-primary transition-colors text-foreground">Create New Quiz</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed font-medium group-hover:text-foreground/80 transition-colors">
                    Initialize a new assessment module with custom questions and logic.
                  </p>
                </div>
              </div>
            </Card>

            <Card
              className="p-8 rounded-[2.5rem] border-0 bg-background shadow-soft hover:shadow-medium hover:ring-primary/10 transition-all cursor-pointer ring-1 ring-border/50 group"
              onClick={() => navigate('/admin/quizzes')}
            >
              <div className="flex items-start gap-6">
                <div className="w-14 h-14 bg-secondary rounded-xl flex items-center justify-center group-hover:bg-primary transition-colors duration-300">
                  <List className="w-7 h-7 text-primary group-hover:text-primary-foreground transition-colors duration-300" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2 tracking-tight group-hover:text-primary transition-colors text-foreground">Manage Quizzes</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed font-medium group-hover:text-foreground/80 transition-colors">
                    Review, Edit, or Delete existing quiz modules from the system registry.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto rounded-3xl border-0 shadow-strong p-8 ring-1 ring-border/40">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-black tracking-tight">{detailTitle}</DialogTitle>
            <DialogDescription className="font-medium text-muted-foreground">Detailed activity logs for your assessment modules.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {detailList.length === 0 ? (
              <div className="py-12 text-center">
                <History className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                <p className="text-sm font-bold text-muted-foreground tracking-widest uppercase">No Records Found</p>
              </div>
            ) : (
              detailList.map((item, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-secondary/20 ring-1 ring-border/10 flex items-center justify-between group hover:bg-secondary/30 transition-all">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.isCheated ? "bg-destructive/10" : "bg-primary/10"}`}>
                      {item.isCheated ? <ShieldAlert className="w-5 h-5 text-destructive" /> : <CheckCircle2 className="w-5 h-5 text-primary" />}
                    </div>
                    <div>
                      <p className="font-bold text-foreground flex items-center gap-2">
                        {item.userName || "Unknown"}
                        {item.isCheated && <span className="text-[8px] font-black uppercase text-destructive px-2 py-0.5 bg-destructive/10 rounded-full tracking-tighter">Banned</span>}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-2">
                        <Brain className="w-3 h-3" /> {item.quizTitle || "Untitled Quiz"}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-2">
                        <Mail className="w-3 h-3" /> {item.userEmail || "No Email recorded"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 justify-end mb-1">
                      <Award className="w-3.5 h-3.5 text-primary" />
                      <p className="font-black text-primary tracking-tighter text-lg">{item.isCheated ? "0%" : `${Math.round(item.percentage || 0)}%`}</p>
                    </div>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1 justify-end">
                      <Calendar className="w-3 h-3" /> {new Date(item.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
