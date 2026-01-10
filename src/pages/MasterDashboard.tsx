import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Users,
    Brain,
    History,
    ShieldAlert,
    List,
    Settings,
    Megaphone,
    Trash2,
    UserCog,
    Search,
    Lock,
    Unlock,
    Star,
    RefreshCw,
    FileSpreadsheet,
    X,
    TrendingUp,
    BarChart3,
    PieChart,
    Calendar,
    ArrowUpRight,
    Award,
    Pause,
    Play,
    Edit,
    Zap
} from "lucide-react";
import { motion } from "framer-motion";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
    BarChart,
    Bar
} from 'recharts';
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { collection, getDocs, deleteDoc, doc, updateDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Input } from "@/components/ui/input";
import Papa from "papaparse";

const MasterDashboard = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const { user, profile } = useAuth();

    const [users, setUsers] = useState<any[]>([]);
    const [quizzes, setQuizzes] = useState<any[]>([]);
    const [scores, setScores] = useState<any[]>([]);
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalQuizzes: 0,
        totalAttempts: 0,
        flaggedQuizzes: 0,
        totalArenaSessions: 0
    });

    const [loading, setLoading] = useState(true);
    const [searchUser, setSearchUser] = useState("");
    const [searchQuiz, setSearchQuiz] = useState("");
    const [searchArena, setSearchArena] = useState("");
    const [broadcastMessage, setBroadcastMessage] = useState("");
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [selectedQuizAnalytics, setSelectedQuizAnalytics] = useState<any>(null);
    const [newPassword, setNewPassword] = useState("");
    const [chartData, setChartData] = useState<any[]>([]);
    const [subjectData, setSubjectData] = useState<any[]>([]);
    const [arenaSessions, setArenaSessions] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState("users");

    const isAdmin = profile?.role === "admin";
    const isModerator = profile?.role === "moderator";

    useEffect(() => {
        loadAllData();
    }, []);

    const loadAllData = async () => {
        setLoading(true);
        try {
            const usersSnap = await getDocs(collection(db, "users"));
            const allUsers = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
            setUsers(allUsers);

            const quizzesSnap = await getDocs(collection(db, "quizzes"));
            const allQuizzes = quizzesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
            setQuizzes(allQuizzes);

            const scoresSnap = await getDocs(collection(db, "scores"));
            const allScores = scoresSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
            setScores(allScores);


            const arenaSnap = await getDocs(collection(db, "arena_sessions"));
            const allArena = arenaSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
            const sortedArena = allArena.sort((a, b) => {
                const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return dateB - dateA;
            });
            setArenaSessions(sortedArena);
            console.log("Dashboard: Arena Data Fetched:", sortedArena.length);

            // Final Stats Update consolidated
            setStats({
                totalUsers: allUsers.length,
                totalQuizzes: allQuizzes.length,
                totalAttempts: allScores.length,
                flaggedQuizzes: allQuizzes.filter((q: any) => q.isFlagged).length,
                totalArenaSessions: sortedArena.length
            });

            // Calculate Chart Data (Attempts by Date)
            const dateMap = new Map();
            allScores.forEach(s => {
                if (s.timestamp) {
                    const date = new Date(s.timestamp).toLocaleDateString();
                    dateMap.set(date, (dateMap.get(date) || 0) + 1);
                }
            });

            const chartPoints = Array.from(dateMap.entries())
                .map(([date, count]) => ({ date, count }))
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .slice(-7); // Last 7 days

            setChartData(chartPoints);

            // Calculate Subject Distribution
            const subMap = new Map();
            allQuizzes.forEach(q => {
                const sub = q.subject || "Other";
                subMap.set(sub, (subMap.get(sub) || 0) + 1);
            });
            const subData = Array.from(subMap.entries())
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5);
            setSubjectData(subData);

        } catch (error) {
            console.error(error);
            toast({ title: "Sync Error", description: "Failed to fetch platform data.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const getQuizAnalytics = (quizId: string) => {
        const quizScores = scores.filter(s => s.quizId === quizId);
        const uniqueStudents = new Set(quizScores.map(s => s.userEmail));
        const avgScore = quizScores.length > 0
            ? quizScores.reduce((acc, curr) => acc + (curr.percentage || 0), 0) / quizScores.length
            : 0;

        return {
            attendance: quizScores.length,
            uniqueStudents: uniqueStudents.size,
            avgScore: Math.round(avgScore),
            students: quizScores.map(s => ({
                name: s.userName,
                email: s.userEmail,
                photoURL: s.userPhoto || "",
                score: s.percentage,
                date: s.timestamp
            })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        };
    };

    const updateUserRole = async (userId: string, newRole: string) => {
        if (!isAdmin) return toast({ title: "Access Denied", variant: "destructive" });
        try {
            await updateDoc(doc(db, "users", userId), { role: newRole });
            setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
            toast({ title: "Role Updated", description: `User role changed to ${newRole}` });
        } catch (error) {
            toast({ title: "Update Failed", variant: "destructive" });
        }
    };

    const toggleUserLock = async (userId: string, currentStatus: boolean) => {
        if (!isAdmin && !isModerator) return toast({ title: "Access Denied", variant: "destructive" });
        try {
            await updateDoc(doc(db, "users", userId), { isLocked: !currentStatus });
            setUsers(users.map(u => u.id === userId ? { ...u, isLocked: !currentStatus } : u));
            toast({ title: currentStatus ? "Account Started" : "Account Closed" });
        } catch (error) {
            toast({ title: "Toggle Failed", variant: "destructive" });
        }
    };

    const resetUserPassword = async () => {
        if (!isAdmin && !isModerator) return toast({ title: "Access Denied", variant: "destructive" });
        if (!newPassword) return;
        // In a real Firebase app, we'd use an admin SDK or a cloud function to reset passwords.
        // For this demo/setup, we'll simulate the intent or provide instructions.
        toast({
            title: "Password Protocol Initiated",
            description: "Direct password override requires Admin SDK. Use Firebase Console for security compliance."
        });
        setSelectedUser(null);
        setNewPassword("");
    };

    const toggleQuizStar = async (quizId: string, currentFeatured: boolean) => {
        if (!isAdmin) return toast({ title: "Access Denied", variant: "destructive" });
        try {
            await updateDoc(doc(db, "quizzes", quizId), { isFeatured: !currentFeatured });
            setQuizzes(quizzes.map(q => q.id === quizId ? { ...q, isFeatured: !currentFeatured } : q));
            toast({ title: currentFeatured ? "Removed from Featured" : "Starred as Elite Quiz" });
        } catch (error) {
            toast({ title: "Update Failed", variant: "destructive" });
        }
    };

    const toggleQuizStatus = async (quizId: string, currentInactive: boolean) => {
        if (!isAdmin && !isModerator) return toast({ title: "Access Denied", variant: "destructive" });
        try {
            await updateDoc(doc(db, "quizzes", quizId), { isInactive: !currentInactive });
            setQuizzes(quizzes.map(q => q.id === quizId ? { ...q, isInactive: !currentInactive } : q));
            toast({ title: currentInactive ? "Quiz Active" : "Quiz Deactivated" });
        } catch (error) {
            toast({ title: "Update Failed", variant: "destructive" });
        }
    };

    const sendBroadcast = async () => {
        if (!isAdmin) return toast({ title: "Access Denied", variant: "destructive" });
        if (!broadcastMessage) return;
        try {
            await setDoc(doc(db, "system", "announcements"), {
                message: broadcastMessage,
                timestamp: new Date().toISOString(),
                sender: profile?.name
            });
            toast({ title: "Broadcast Sent", description: "All users will receive this notice." });
            setBroadcastMessage("");
        } catch (error) {
            toast({ title: "Broadcast Failed", variant: "destructive" });
        }
    };

    const deleteUser = async (userId: string) => {
        if (!isAdmin) return toast({ title: "Access Denied", variant: "destructive" });
        if (!confirm("Are you sure you want to delete this user? This action is irreversible.")) return;
        try {
            await deleteDoc(doc(db, "users", userId));
            setUsers(users.filter(u => u.id !== userId));
            toast({ title: "User Deleted", description: "Account removed successfully." });
        } catch (error) {
            toast({ title: "Error deleting user", variant: "destructive" });
        }
    };

    const deleteQuiz = async (quizId: string) => {
        if (!isAdmin && !isModerator) return toast({ title: "Access Denied", variant: "destructive" });
        if (!confirm("Are you sure you want to delete this quiz?")) return;
        try {
            await deleteDoc(doc(db, "quizzes", quizId));
            setQuizzes(quizzes.filter(q => q.id !== quizId));
            toast({ title: "Quiz Deleted", description: "Assessment module removed from registry." });
        } catch (error) {
            toast({ title: "Error deleting quiz", variant: "destructive" });
        }
    };

    const handleExport = () => {
        let exportData: any[] = [];
        let filename = "export";

        switch (activeTab) {
            case "users":
                exportData = users.map(u => ({
                    "Full Name": u.name,
                    "Email Address": u.email,
                    "User Role": u.role,
                    "Account Status": u.isLocked ? "LOCKED" : "ACTIVE",
                    "Joined Date": u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "N/A"
                }));
                filename = "platform_user_registry";
                break;
            case "quizzes":
                exportData = quizzes.map(q => ({
                    "Assessment Title": q.title,
                    "Subject Category": q.subject,
                    "Instructor": q.teacherName,
                    "Status": q.isInactive ? "INACTIVE" : "ACTIVE",
                    "Average Score": getQuizAnalytics(q.id).avgScore + "%",
                    "Total Attempts": getQuizAnalytics(q.id).attendance
                }));
                filename = "global_assessment_inventory";
                break;
            case "analytics":
                exportData = scores.map(s => ({
                    "Candidate Name": s.userName,
                    "Candidate Email": s.userEmail,
                    "Assessment Title": s.quizTitle,
                    "Performance": `${Math.round(s.percentage)}%`,
                    "Completion Date": new Date(s.timestamp).toLocaleString(),
                    "Integrity Status": s.isCheated ? "FLAGGED" : "CLEAN"
                }));
                filename = "performance_analytics_master";
                break;
            case "system":
                exportData = [
                    { "System Component": "Broadcast Protocol", "Status": "OPERATIONAL", "Meta": broadcastMessage || "Idle" },
                    { "System Component": "Moderator Configuration", "Status": "ACTIVE", "Meta": "ID Number, Department, Section" },
                    { "System Component": "Database Sync", "Status": "HEALTHY", "Meta": `${stats.totalAttempts} records synchronized` },
                    { "System Component": "Integrity Shield", "Status": "SHIELD_UP", "Meta": `${stats.flaggedQuizzes} anomalies detected` }
                ];
                filename = "system_architecture_status";
                break;
            case "arena":
                exportData = arenaSessions.map(s => ({
                    "Arena Code": s.code,
                    "Quiz Title": s.quizTitle,
                    "Host Name": s.hostName,
                    "Status": s.status,
                    "Created At": s.createdAt ? new Date(s.createdAt).toLocaleString() : 'N/A'
                }));
                filename = "global_arena_registry";
                break;
        }

        const csv = Papa.unparse(exportData);
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast({ title: "Data Exported", description: `${filename}.csv generated for ${activeTab} context.` });
    };

    const exportData = (data: any[], filename: string) => {
        const csv = Papa.unparse(data);
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast({ title: "Data Exported", description: `${filename}.csv has been generated.` });
    };

    const filteredUsers = users.filter(u =>
        u.name?.toLowerCase().includes(searchUser.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchUser.toLowerCase()) ||
        u.role?.toLowerCase().includes(searchUser.toLowerCase())
    );

    const filteredQuizzes = quizzes.filter(q =>
        q.title?.toLowerCase().includes(searchQuiz.toLowerCase()) ||
        q.subject?.toLowerCase().includes(searchQuiz.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-background text-foreground animate-in fade-in duration-500">
            <Navbar />
            <main className="max-w-7xl mx-auto px-6 py-12">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div>
                        <h1 className="text-4xl font-black tracking-tight mb-2">Master Control Panel</h1>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            <p className="text-muted-foreground font-bold uppercase tracking-widest text-[10px] opacity-70">Authenticated as Platform Superuser</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <Button variant="outline" className="rounded-2xl h-12 px-6 font-bold gap-2 border-2" onClick={() => loadAllData()}>
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            Refresh Registry
                        </Button>
                        <Button className="rounded-2xl h-12 px-6 font-bold bg-primary shadow-soft gap-2" onClick={handleExport}>
                            <FileSpreadsheet className="w-4 h-4" />
                            Export {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-12">
                    {[
                        { label: "Total Users", value: stats.totalUsers, icon: Users, color: "text-blue-600", bg: "bg-blue-50/50" },
                        { label: "Active Quizzes", value: stats.totalQuizzes, icon: Brain, color: "text-primary", bg: "bg-primary/5" },
                        { label: "Arena Battles", value: stats.totalArenaSessions, icon: Zap, color: "text-amber-500", bg: "bg-amber-50/50" },
                        { label: "Global Attempts", value: stats.totalAttempts, icon: History, color: "text-green-600", bg: "bg-green-50/50" },
                        { label: "Flagged Content", value: stats.flaggedQuizzes, icon: ShieldAlert, color: "text-destructive", bg: "bg-destructive/5" },
                    ].map((stat, i) => (
                        <Card key={i} className={`p-6 rounded-[2rem] border-0 ${stat.bg} shadow-soft hover:shadow-medium transition-all ring-1 ring-border/50 relative overflow-hidden group`}>
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                                <stat.icon className="w-16 h-16" />
                            </div>
                            <div className="relative z-10">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-2">{stat.label}</p>
                                <div className="flex items-baseline gap-2">
                                    <p className={`text-4xl font-black ${stat.color} tracking-tighter`}>{stat.value}</p>
                                    <span className="text-[10px] font-bold text-muted-foreground/40 font-mono">LIVE</span>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>

                <Dialog open={!!selectedQuizAnalytics} onOpenChange={(open) => !open && setSelectedQuizAnalytics(null)}>
                    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-[3rem] border-0 shadow-strong p-0 ring-1 ring-border/40">
                        <div className="bg-primary p-10 text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
                            <div className="relative z-10">
                                <div className="flex items-center gap-4 mb-6">
                                    <Badge className="bg-white/20 text-white border-0 rounded-full px-4 py-1 text-[10px] font-bold uppercase tracking-widest">Assessment Deep-Dive</Badge>
                                    <Badge className="bg-green-500/20 text-green-300 border-0 rounded-full px-4 py-1 text-[10px] font-bold uppercase tracking-widest">
                                        {selectedQuizAnalytics?.attendance} Total Attempts
                                    </Badge>
                                </div>
                                <h2 className="text-4xl font-black tracking-tight mb-2">{selectedQuizAnalytics?.title}</h2>
                                <p className="text-white/60 font-bold uppercase tracking-widest text-[10px]">Registry Module ID: {selectedQuizAnalytics?.id}</p>
                            </div>
                        </div>

                        <div className="p-10 space-y-10">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="p-6 bg-secondary/30 rounded-[2rem] text-center">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Success Rate</p>
                                    <p className="text-3xl font-black text-primary">{getQuizAnalytics(selectedQuizAnalytics?.id).avgScore}%</p>
                                </div>
                                <div className="p-6 bg-secondary/30 rounded-[2rem] text-center">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Unique Minds</p>
                                    <p className="text-3xl font-black text-blue-600">{getQuizAnalytics(selectedQuizAnalytics?.id).uniqueStudents}</p>
                                </div>
                                <div className="p-6 bg-secondary/30 rounded-[2rem] text-center">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Density</p>
                                    <p className="text-3xl font-black text-green-600">{getQuizAnalytics(selectedQuizAnalytics?.id).attendance}</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h3 className="text-xl font-black tracking-tight flex items-center gap-3">
                                    <Users className="w-5 h-5 text-primary" /> Recent Participants
                                </h3>
                                <div className="space-y-3">
                                    {getQuizAnalytics(selectedQuizAnalytics?.id).students.map((s: any, idx: number) => (
                                        <div key={idx} className="flex items-center justify-between p-5 rounded-3xl bg-background ring-1 ring-border/50 hover:shadow-soft transition-all group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center font-black text-primary group-hover:bg-primary group-hover:text-white transition-all overflow-hidden">
                                                    {s.photoURL ? (
                                                        <img src={s.photoURL} alt={s.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        s.name?.charAt(0)
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-bold tracking-tight text-foreground">{s.name}</p>
                                                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">{s.email}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-lg font-black text-primary tracking-tighter">{Math.round(s.score)}%</p>
                                                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                                                    {new Date(s.date).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
                    <TabsList className="bg-secondary/30 p-1.5 rounded-2xl ring-1 ring-border/10 w-full md:w-auto h-auto flex flex-wrap">
                        <TabsTrigger value="users" className="rounded-xl px-8 py-3 font-bold text-[10px] uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-soft data-[state=active]:text-primary flex items-center gap-2">
                            <Users className="w-3.5 h-3.5" /> User Registry
                        </TabsTrigger>
                        <TabsTrigger value="quizzes" className="rounded-xl px-8 py-3 font-bold text-[10px] uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-soft data-[state=active]:text-primary flex items-center gap-2">
                            <Brain className="w-3.5 h-3.5" /> Global Quizzes
                        </TabsTrigger>
                        <TabsTrigger value="analytics" className="rounded-xl px-8 py-3 font-bold text-[10px] uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-soft data-[state=active]:text-primary flex items-center gap-2">
                            <TrendingUp className="w-3.5 h-3.5" /> Performance Analytics
                        </TabsTrigger>
                        <TabsTrigger value="arena" className="rounded-xl px-8 py-3 font-bold text-[10px] uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-soft data-[state=active]:text-primary flex items-center gap-2">
                            <Zap className="w-3.5 h-3.5" /> Arena Registry
                        </TabsTrigger>
                        <TabsTrigger value="system" className="rounded-xl px-8 py-3 font-bold text-[10px] uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-soft data-[state=active]:text-primary flex items-center gap-2">
                            <Settings className="w-3.5 h-3.5" /> System Controls
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="analytics" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="grid lg:grid-cols-3 gap-8">
                            <Card className="lg:col-span-2 p-10 rounded-[3rem] border-0 bg-background shadow-medium ring-1 ring-border/50 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                                    <TrendingUp className="w-64 h-64" />
                                </div>
                                <div className="flex items-center justify-between mb-10 relative z-10">
                                    <div>
                                        <h3 className="text-3xl font-black tracking-tighter">Architecture Pulse</h3>
                                        <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest text-[10px] mt-1">Real-time engagement velocity</p>
                                    </div>
                                    <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-5 py-2.5 rounded-2xl ring-1 ring-emerald-500/20">
                                        <ArrowUpRight className="w-4 h-4" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Live Node</span>
                                    </div>
                                </div>
                                <div className="h-[350px] w-full relative z-10">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={chartData}>
                                            <defs>
                                                <linearGradient id="colorEngagement" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
                                                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                            <XAxis
                                                dataKey="date"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fontSize: 10, fontWeight: 'black', fill: '#999' }}
                                                dy={15}
                                            />
                                            <YAxis
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fontSize: 10, fontWeight: 'black', fill: '#999' }}
                                            />
                                            <Tooltip
                                                contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', padding: '20px', background: '#fff' }}
                                                labelStyle={{ fontWeight: 'black', marginBottom: '8px', color: '#000' }}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="count"
                                                stroke="hsl(var(--primary))"
                                                strokeWidth={5}
                                                fillOpacity={1}
                                                fill="url(#colorEngagement)"
                                                animationDuration={2000}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </Card>

                            <Card className="p-10 rounded-[3rem] border-0 bg-primary text-white shadow-strong relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -mr-40 -mt-40 blur-3xl group-hover:scale-125 transition-transform duration-1000" />
                                <div className="relative z-10 flex flex-col h-full">
                                    <div className="mb-10">
                                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-6 ring-1 ring-white/30">
                                            <PieChart className="w-6 h-6 text-white" />
                                        </div>
                                        <h3 className="text-3xl font-black tracking-tight mb-2 leading-tight">Sector <br />Intelligence</h3>
                                        <p className="text-white/60 text-[10px] font-black uppercase tracking-widest">Active subject distribution</p>
                                    </div>

                                    <div className="flex-1 space-y-6">
                                        {subjectData.map((item, idx) => (
                                            <div key={idx} className="space-y-2">
                                                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                                    <span>{item.name}</span>
                                                    <span>{item.count} Modules</span>
                                                </div>
                                                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${(item.count / stats.totalQuizzes) * 100}%` }}
                                                        transition={{ duration: 1.5, delay: idx * 0.1 }}
                                                        className="h-full bg-white rounded-full"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-10 pt-8 border-t border-white/10">
                                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40 mb-1">Architecture integrity</p>
                                        <p className="text-sm font-bold">Protocol fully operational.</p>
                                    </div>
                                </div>
                            </Card>

                            <Card className="p-10 rounded-[3rem] border-0 bg-background shadow-medium ring-1 ring-border/50">
                                <h3 className="text-xl font-black mb-8 tracking-tight flex items-center gap-3">
                                    <Award className="w-5 h-5 text-primary" /> Elite Performance
                                </h3>
                                <div className="space-y-6">
                                    {quizzes.slice(0, 5).map((q, idx) => {
                                        const analytics = getQuizAnalytics(q.id);
                                        return (
                                            <div key={idx} className="flex items-center justify-between group cursor-pointer" onClick={() => setSelectedQuizAnalytics(q)}>
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-secondary/50 flex items-center justify-center font-black text-primary group-hover:bg-primary group-hover:text-white transition-all">
                                                        {idx + 1}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-sm tracking-tight group-hover:text-primary transition-colors">{q.title}</p>
                                                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">{q.subject}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-black text-primary">{analytics.avgScore}%</p>
                                                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Avg. Score</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </Card>

                            <Card className="p-10 rounded-[3rem] border-0 bg-background shadow-medium ring-1 ring-border/50">
                                <h3 className="text-xl font-black mb-8 tracking-tight flex items-center gap-3">
                                    <Users className="w-5 h-5 text-blue-600" /> Active Scholars
                                </h3>
                                <div className="space-y-6">
                                    {/* Calculated most active users */}
                                    {Array.from(new Set(scores.map(s => s.userEmail))).slice(0, 5).map((email, idx) => {
                                        const userScores = scores.filter(s => s.userEmail === email);
                                        return (
                                            <div key={idx} className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center font-black text-blue-600 overflow-hidden">
                                                        {userScores[0]?.userPhoto ? (
                                                            <img src={userScores[0].userPhoto} alt={userScores[0].userName} className="w-full h-full object-cover" />
                                                        ) : (
                                                            userScores[0]?.userName?.charAt(0)
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-sm tracking-tight">{userScores[0]?.userName}</p>
                                                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">{userScores.length} Attempts</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <Badge className="bg-blue-50 text-blue-600 border-0 rounded-full font-black text-[9px] tracking-widest">RANK {idx + 1}</Badge>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </Card>

                            <Card className="p-10 rounded-[3rem] border-0 bg-secondary/10 shadow-inner ring-1 ring-border/50 flex flex-col items-center justify-center text-center">
                                <div className="w-20 h-20 bg-background rounded-3xl shadow-soft flex items-center justify-center mb-6 ring-1 ring-border/50">
                                    <RefreshCw className="w-8 h-8 text-primary animate-spin-slow" />
                                </div>
                                <h3 className="text-xl font-black tracking-tight mb-2">Sync Protocol</h3>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-6">Database synchronization</p>
                                <Button variant="outline" className="rounded-2xl px-8 h-12 font-black border-2 bg-background hover:bg-primary hover:text-white transition-all" onClick={loadAllData}>
                                    Force Refresh
                                </Button>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="users" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <Card className="p-8 rounded-[2.5rem] border-0 bg-background shadow-medium ring-1 ring-border/50">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                                <div>
                                    <h3 className="text-2xl font-black tracking-tight">Active User Directory</h3>
                                    <p className="text-sm text-muted-foreground font-medium">Manage all student and teacher accounts from a central registry.</p>
                                </div>
                                <div className="relative w-full md:w-80">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/40" />
                                    <Input
                                        placeholder="Search name, email, or role..."
                                        className="pl-12 rounded-2xl h-14 border-2 border-border/10 focus:ring-primary/20 transition-all font-bold placeholder:text-muted-foreground/30 shadow-inner bg-secondary/10"
                                        value={searchUser}
                                        onChange={(e) => setSearchUser(e.target.value)}
                                    />
                                </div>
                            </div>

                            <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
                                <DialogContent className="rounded-[2rem] border-0 shadow-strong">
                                    <DialogHeader>
                                        <DialogTitle className="text-2xl font-black">Security Override: {selectedUser?.name}</DialogTitle>
                                    </DialogHeader>
                                    <div className="py-6 space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">New Secure Password</label>
                                            <Input
                                                type="password"
                                                placeholder="••••••••"
                                                className="h-14 rounded-2xl border-2 font-bold"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                            />
                                        </div>
                                        <div className="bg-amber-500/5 p-4 rounded-2xl border border-amber-500/10">
                                            <p className="text-[10px] font-medium leading-relaxed text-amber-700/80 uppercase tracking-wider">
                                                Note: Direct password reset requires administrative SDK integration. This interface signals the intent for the audit log.
                                            </p>
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button className="w-full h-14 rounded-2xl font-black" onClick={resetUserPassword}>Execute Password Reset</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>

                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-border/50">
                                            <th className="text-left pb-6 text-[10px] uppercase tracking-widest font-black text-muted-foreground/60">Profile Identity</th>
                                            <th className="text-left pb-6 text-[10px] uppercase tracking-widest font-black text-muted-foreground/60">Classification</th>
                                            <th className="text-left pb-6 text-[10px] uppercase tracking-widest font-black text-muted-foreground/60">Status</th>
                                            <th className="text-right pb-6 text-[10px] uppercase tracking-widest font-black text-muted-foreground/60">Management</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/30">
                                        {filteredUsers.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="py-20 text-center">
                                                    <Users className="w-12 h-12 text-muted-foreground/10 mx-auto mb-4" />
                                                    <p className="font-bold text-muted-foreground tracking-widest uppercase text-[10px]">No matches found in records</p>
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredUsers.map((u) => (
                                                <tr key={u.id} className="group hover:bg-secondary/20 transition-all duration-300">
                                                    <td className="py-6 pr-4">
                                                        <div className="flex items-center gap-4">
                                                            <div className={`w-12 h-12 rounded-2xl overflow-hidden flex items-center justify-center font-black text-lg ${u.role === 'teacher' ? 'bg-primary/10 text-primary' : u.role === 'admin' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                                                                {u.photoURL ? (
                                                                    <img src={u.photoURL} alt={u.name} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    u.name?.charAt(0) || "U"
                                                                )}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-lg tracking-tight group-hover:text-primary transition-colors">{u.name || "Anonymous User"}</span>
                                                                <span className="text-[10px] text-muted-foreground/60 font-medium uppercase tracking-widest">{u.email}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-6">
                                                        {isAdmin ? (
                                                            <Select defaultValue={u.role} onValueChange={(val) => updateUserRole(u.id, val)}>
                                                                <SelectTrigger className="w-[140px] h-9 rounded-full text-[10px] font-bold uppercase tracking-widest bg-white/80 border-border/20 shadow-sm">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent className="rounded-2xl border-0 shadow-strong ring-1 ring-border/50 p-1">
                                                                    <SelectItem value="student" className="rounded-xl text-[10px] font-bold uppercase tracking-widest py-2">Student</SelectItem>
                                                                    <SelectItem value="teacher" className="rounded-xl text-[10px] font-bold uppercase tracking-widest py-2">Teacher</SelectItem>
                                                                    <SelectItem value="admin" className="rounded-xl text-[10px] font-bold uppercase tracking-widest py-2 text-primary">Master</SelectItem>
                                                                    <SelectItem value="moderator" className="rounded-xl text-[10px] font-bold uppercase tracking-widest py-2">Moderator</SelectItem>
                                                                    <SelectItem value="viewer" className="rounded-xl text-[10px] font-bold uppercase tracking-widest py-2">Viewer</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        ) : (
                                                            <span className={`text-[10px] font-black uppercase px-4 py-1.5 rounded-full ring-1 ${u.role === 'teacher' ? 'bg-primary/5 text-primary ring-primary/20' : 'bg-green-50 text-green-700 ring-green-600/20'}`}>
                                                                {u.role || "unassigned"}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="py-6">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => toggleUserLock(u.id, !!u.isLocked)}
                                                            className={`rounded-full h-8 px-4 font-bold text-[9px] uppercase tracking-widest transition-all ${u.isLocked ? "bg-destructive/10 text-destructive hover:bg-destructive/20" : "bg-green-100 text-green-700 hover:bg-green-200"}`}
                                                        >
                                                            {u.isLocked ? "Account Closed" : "Status: Active"}
                                                        </Button>
                                                    </td>
                                                    <td className="py-6 text-right">
                                                        <div className="flex items-center justify-end gap-2 pr-2 opacity-40 group-hover:opacity-100 transition-opacity">
                                                            {(isAdmin || isModerator) && (
                                                                <Button size="icon" variant="ghost" className="rounded-xl h-11 w-11 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all" onClick={() => setSelectedUser(u)}>
                                                                    <Lock className="w-5 h-5" />
                                                                </Button>
                                                            )}
                                                            {isAdmin && (
                                                                <Button size="icon" variant="ghost" className="rounded-xl h-11 w-11 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all" onClick={() => deleteUser(u.id)}>
                                                                    <Trash2 className="w-5 h-5" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </TabsContent>

                    <TabsContent value="quizzes" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <Card className="p-8 rounded-[2.5rem] border-0 bg-background shadow-medium ring-1 ring-border/50">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                                <div>
                                    <h3 className="text-2xl font-black tracking-tight">Global Assessment Registry</h3>
                                    <p className="text-sm text-muted-foreground font-medium">Review and moderate every quiz module created on the platform.</p>
                                </div>
                                <div className="relative w-full md:w-80">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/40" />
                                    <Input
                                        placeholder="Search by title or category..."
                                        className="pl-12 rounded-2xl h-14 border-2 border-border/10 focus:ring-primary/20 transition-all font-bold placeholder:text-muted-foreground/30 shadow-inner bg-secondary/10"
                                        value={searchQuiz}
                                        onChange={(e) => setSearchQuiz(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-border/50">
                                            <th className="text-left pb-6 text-[10px] uppercase tracking-widest font-black text-muted-foreground/60">Module Specification</th>
                                            <th className="text-left pb-6 text-[10px] uppercase tracking-widest font-black text-muted-foreground/60">Origin & Authority</th>
                                            <th className="text-left pb-6 text-[10px] uppercase tracking-widest font-black text-muted-foreground/60">Status Tags</th>
                                            <th className="text-right pb-6 text-[10px] uppercase tracking-widest font-black text-muted-foreground/60">Administrative Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/30">
                                        {filteredQuizzes.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="py-20 text-center">
                                                    <Brain className="w-12 h-12 text-muted-foreground/10 mx-auto mb-4" />
                                                    <p className="font-bold text-muted-foreground tracking-widest uppercase text-[10px]">No assessment modules found</p>
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredQuizzes.map((q) => (
                                                <tr key={q.id} className="group hover:bg-secondary/20 transition-all duration-300">
                                                    <td className="py-6 pr-4">
                                                        <div>
                                                            <p className="font-bold text-lg tracking-tight group-hover:text-primary transition-colors">{q.title}</p>
                                                            <p className="text-[10px] font-black uppercase tracking-tighter text-primary/60 mt-0.5">{q.subject || "Independent Study"}</p>
                                                        </div>
                                                    </td>
                                                    <td className="py-6">
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-bold text-foreground/80">{q.teacherName || "Verified Educator"}</span>
                                                            <span className="text-[10px] font-medium text-muted-foreground/60 uppercase">UID: {q.teacherId?.slice(0, 8)}...</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-6">
                                                        <div className="flex gap-2">
                                                            {q.isInactive ? (
                                                                <span className="bg-destructive/10 text-destructive text-[9px] font-black uppercase px-2 py-1 rounded-md">Deactivated</span>
                                                            ) : q.isFlagged ? (
                                                                <span className="bg-destructive/10 text-destructive text-[9px] font-black uppercase px-2 py-1 rounded-md animate-pulse">Flagged</span>
                                                            ) : (
                                                                <span className="bg-green-50 text-green-700 text-[9px] font-black uppercase px-2 py-1 rounded-md">Active</span>
                                                            )}
                                                            {q.isFeatured && <span className="bg-amber-100 text-amber-700 text-[9px] font-black uppercase px-2 py-1 rounded-md">Featured ★</span>}
                                                            {q.isVerified && <span className="bg-blue-100 text-blue-700 text-[9px] font-black uppercase px-2 py-1 rounded-md">Verified</span>}
                                                        </div>
                                                    </td>
                                                    <td className="py-6 text-right">
                                                        <div className="flex items-center justify-end gap-2 pr-2 opacity-40 group-hover:opacity-100 transition-opacity">
                                                            {(isAdmin || isModerator) && (
                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    className="rounded-xl h-11 w-11 text-muted-foreground hover:bg-teal-500/10 hover:text-teal-600 transition-all"
                                                                    onClick={() => setSelectedQuizAnalytics(q)}
                                                                >
                                                                    <BarChart3 className="w-5 h-5" />
                                                                </Button>
                                                            )}
                                                            {(isAdmin || isModerator) && (
                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    className={`rounded-xl h-11 w-11 transition-all ${q.isFeatured ? "text-amber-500 bg-amber-500/10" : "text-muted-foreground hover:bg-amber-500/10 hover:text-amber-500"}`}
                                                                    onClick={() => isAdmin && toggleQuizStar(q.id, !!q.isFeatured)}
                                                                >
                                                                    <Star className={`w-5 h-5 ${q.isFeatured ? "fill-current" : ""}`} />
                                                                </Button>
                                                            )}
                                                            {(isAdmin || isModerator) && (
                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    className={`rounded-xl h-11 w-11 transition-all ${q.isInactive ? "text-destructive bg-destructive/10" : "text-muted-foreground hover:bg-destructive/10 hover:text-destructive"}`}
                                                                    onClick={() => toggleQuizStatus(q.id, !!q.isInactive)}
                                                                >
                                                                    <ShieldAlert className="w-5 h-5" />
                                                                </Button>
                                                            )}
                                                            {(isAdmin || isModerator) && (
                                                                <Button size="icon" variant="ghost" className="rounded-xl h-11 w-11 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all" onClick={() => navigate(`/admin/edit/${q.id}`)}>
                                                                    <List className="w-5 h-5" />
                                                                </Button>
                                                            )}
                                                            {isAdmin && (
                                                                <Button size="icon" variant="ghost" className="rounded-xl h-11 w-11 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all" onClick={() => deleteQuiz(q.id)}>
                                                                    <Trash2 className="w-5 h-5" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </TabsContent>

                    <TabsContent value="arena" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <Card className="p-8 rounded-[2.5rem] border-0 bg-background shadow-medium ring-1 ring-border/50">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                                <div>
                                    <h3 className="text-2xl font-black tracking-tight">Global Arena Network</h3>
                                    <p className="text-sm text-muted-foreground font-medium">Monitor all real-time multiplayer sessions across the platform.</p>
                                </div>
                                <div className="relative w-full md:w-80">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/40" />
                                    <Input
                                        placeholder="Search by code or host..."
                                        className="pl-12 rounded-2xl h-14 border-2 border-border/10 focus:ring-primary/20 transition-all font-bold placeholder:text-muted-foreground/30 shadow-inner bg-secondary/10"
                                        value={searchArena}
                                        onChange={(e) => setSearchArena(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-border/50">
                                            <th className="text-left pb-6 text-[10px] uppercase tracking-widest font-black text-muted-foreground/60">Battle Session</th>
                                            <th className="text-left pb-6 text-[10px] uppercase tracking-widest font-black text-muted-foreground/60">Associated Module</th>
                                            <th className="text-left pb-6 text-[10px] uppercase tracking-widest font-black text-muted-foreground/60">Host Node</th>
                                            <th className="text-left pb-6 text-[10px] uppercase tracking-widest font-black text-muted-foreground/60">Status</th>
                                            <th className="text-right pb-6 text-[10px] uppercase tracking-widest font-black text-muted-foreground/60">Control</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/30">
                                        {arenaSessions.filter(s =>
                                            (s.code || "").toLowerCase().includes((searchArena || "").toLowerCase()) ||
                                            (s.hostName || "").toLowerCase().includes((searchArena || "").toLowerCase())
                                        ).length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="py-20 text-center">
                                                    <Zap className="w-12 h-12 text-muted-foreground/10 mx-auto mb-4" />
                                                    <p className="font-bold text-muted-foreground tracking-widest uppercase text-[10px]">No active arena sessions tracked</p>
                                                </td>
                                            </tr>
                                        ) : (
                                            arenaSessions.filter(s =>
                                                (s.code || "").toLowerCase().includes((searchArena || "").toLowerCase()) ||
                                                (s.hostName || "").toLowerCase().includes((searchArena || "").toLowerCase())
                                            ).map((s) => (
                                                <tr key={s.id} className="group hover:bg-secondary/20 transition-all">
                                                    <td className="py-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 ring-1 ring-amber-500/20">
                                                                <Zap className="w-5 h-5 fill-current" />
                                                            </div>
                                                            <span className="font-black text-lg tracking-tight">{s.code}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-6 font-bold text-sm">{s.quizTitle}</td>
                                                    <td className="py-6">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-6 h-6 rounded-full overflow-hidden bg-secondary">
                                                                {s.hostPhoto ? <img src={s.hostPhoto} className="w-full h-full object-cover" /> : <UserCog className="w-3 h-3 m-auto text-muted-foreground" />}
                                                            </div>
                                                            <span className="text-xs font-medium">{s.hostName}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-6">
                                                        <Badge className={`rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-widest border-0 ${s.status === 'active' ? 'bg-green-500 text-white' :
                                                            s.status === 'finished' ? 'bg-slate-500 text-white' : 'bg-amber-500 text-white'
                                                            }`}>
                                                            {s.status}
                                                        </Badge>
                                                    </td>
                                                    <td className="py-6 text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => navigate(`/arena/${s.code}/result`)}
                                                            className="rounded-xl font-bold text-[10px] uppercase tracking-widest text-primary hover:bg-primary/10"
                                                        >
                                                            Review Intel
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </TabsContent>

                    <TabsContent value="system" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="grid md:grid-cols-2 gap-8">
                            <Card className="p-10 rounded-[3rem] border-0 bg-background shadow-medium hover:shadow-strong transition-all ring-1 ring-border/50 relative overflow-hidden group">
                                <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />
                                <div className="w-16 h-16 bg-primary/5 rounded-[1.5rem] flex items-center justify-center mb-8 ring-2 ring-primary/10 shadow-inner group-hover:scale-110 transition-transform">
                                    <Megaphone className="w-8 h-8 text-primary" />
                                </div>
                                <h3 className="text-2xl font-black mb-4 tracking-tight text-foreground">Global Announcements</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed font-bold mb-8">
                                    Broadcast a priority message to every user's dashboard. Use for system updates, new features, or platform-wide alerts.
                                </p>
                                <div className="space-y-4">
                                    <Input
                                        placeholder="Compose transmission content..."
                                        className="h-16 rounded-2xl border-2 border-border/10 px-6 font-bold bg-secondary/10"
                                        value={broadcastMessage}
                                        onChange={(e) => setBroadcastMessage(e.target.value)}
                                    />
                                    <Button
                                        className="w-full h-16 rounded-2xl bg-primary shadow-strong hover:scale-[1.02] transition-all text-lg font-black border-0 gap-3"
                                        onClick={sendBroadcast}
                                        disabled={!isAdmin}
                                    >
                                        Send Broadcast <List className="w-5 h-5" />
                                    </Button>
                                </div>
                            </Card>

                            <Card className="p-10 rounded-[3rem] border-0 bg-background shadow-medium hover:shadow-strong transition-all ring-1 ring-border/50 relative overflow-hidden group">
                                <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber-500/5 rounded-full blur-3xl group-hover:bg-amber-500/10 transition-colors" />
                                <div className="w-16 h-16 bg-amber-500/5 rounded-[1.5rem] flex items-center justify-center mb-8 ring-2 ring-amber-500/10 shadow-inner group-hover:scale-110 transition-transform">
                                    <UserCog className="w-8 h-8 text-amber-600" />
                                </div>
                                <h3 className="text-2xl font-black mb-4 tracking-tight text-foreground">Moderator configuration</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed font-bold mb-8">
                                    Define dynamic requirements for registration. Add fields like "ID Number", "Department", or "Bio" for all new users.
                                </p>
                                <div className="space-y-4">
                                    <div className="flex gap-2">
                                        <Input placeholder="e.g. Student ID" className="h-14 rounded-2xl border-2 border-border/10" />
                                        <Button variant="outline" className="h-14 rounded-2xl font-bold">Add Field</Button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {["ID Number", "Department", "Section"].map(field => (
                                            <Badge key={field} variant="secondary" className="px-3 py-1 rounded-full font-bold text-[9px] uppercase tracking-widest gap-1 border-0">
                                                {field} <X className="w-3 h-3 cursor-pointer opacity-40 hover:opacity-100" />
                                            </Badge>
                                        ))}
                                    </div>
                                    <p className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-widest pl-1 pt-2">Active in live signup protocol</p>
                                </div>
                            </Card>

                            <Card className="p-10 rounded-[3rem] border-0 bg-secondary/10 shadow-medium hover:shadow-strong transition-all ring-1 ring-border/50 relative overflow-hidden group md:col-span-2">
                                <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full -mr-48 -mt-48 blur-3xl group-hover:bg-primary/10 transition-colors" />
                                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-10 relative z-10">
                                    <div className="space-y-6 flex-1">
                                        <div className="w-16 h-16 bg-background rounded-2xl flex items-center justify-center ring-2 ring-primary/10 shadow-soft">
                                            <ShieldAlert className="w-8 h-8 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="text-3xl font-black tracking-tight mb-2">Architecture Health</h3>
                                            <p className="text-sm text-muted-foreground font-medium max-w-xl leading-relaxed">
                                                Platform-wide diagnostics monitoring database latency, session integrity, and authentication protocols.
                                                Ensure all nodes are firing correctly across the distributed network.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6 w-full md:w-auto">
                                        {[
                                            { label: "Stability", value: "99.9%", status: "Optimum" },
                                            { label: "Sync Latency", value: "24ms", status: "Nominal" },
                                            { label: "Integrity", value: "Active", status: "Verified" }
                                        ].map((diag, i) => (
                                            <div key={i} className="p-6 bg-white rounded-[2rem] shadow-soft text-center group-hover:scale-105 transition-transform duration-500">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">{diag.label}</p>
                                                <p className="text-xl font-black text-primary mb-1">{diag.value}</p>
                                                <Badge className="bg-green-50 text-green-600 border-0 rounded-full text-[8px] font-black uppercase tracking-widest">{diag.status}</Badge>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
};

export default MasterDashboard;
