import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Zap, Plus, Search, Filter, Clock, FileQuestion, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { collection, getDocs, query, orderBy, doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const ArenaCreate = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const { user, profile } = useAuth();
    const [quizzes, setQuizzes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [creatingSession, setCreatingSession] = useState(false);

    useEffect(() => {
        const loadQuizzes = async () => {
            try {
                const q = query(collection(db, "quizzes"), orderBy("updatedAt", "desc"));
                const querySnapshot = await getDocs(q);
                const loadedQuizzes = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setQuizzes(loadedQuizzes);
            } catch (error: any) {
                toast({
                    title: "Error",
                    description: "Failed to load quizzes",
                    variant: "destructive",
                });
            } finally {
                setLoading(false);
            }
        };

        loadQuizzes();
    }, [toast]);

    const generateArenaCode = () => {
        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // No I, O, 0, 1 for clarity
        let code = "";
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    };

    const handleHost = async (quiz: any) => {
        if (!user) {
            toast({ title: "Authentication Required", description: "Please log in to host an Arena." });
            return;
        }

        setCreatingSession(true);
        const code = generateArenaCode();

        try {
            const sessionData = {
                code,
                quizId: quiz.id,
                quizTitle: quiz.title,
                hostId: user.uid,
                hostName: profile?.name || user.email || "Unknown Host",
                hostPhoto: profile?.photoURL || "",
                status: "waiting", // waiting, active, finished
                currentQuestionIndex: 0,
                participantCount: 0,
                createdAt: new Date().toISOString(),
                isTeacherSession: profile?.role === "teacher" || profile?.role === "admin",
                settings: {
                    timePerQuestion: quiz.timer || 30,
                    showLeaderboard: true,
                    manualPace: false
                }
            };

            await setDoc(doc(db, "arena_sessions", code), sessionData);
            navigate(`/arena/${code}/lobby`);
        } catch (error: any) {
            toast({
                title: "Creation Failed",
                description: "Could not initialize Arena session.",
                variant: "destructive",
            });
        } finally {
            setCreatingSession(false);
        }
    };

    const filteredQuizzes = quizzes.filter(q =>
        q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.subject?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />
            <main className="max-w-6xl mx-auto px-6 py-12">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
                    <div>
                        <div className="inline-flex items-center gap-2 bg-primary/5 border border-primary/10 rounded-full px-4 py-1.5 mb-4">
                            <Zap className="w-3.5 h-3.5 text-primary fill-primary/20" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary">Arena Dispatch</span>
                        </div>
                        <h1 className="text-4xl font-black tracking-tight mb-2">Host a Battle</h1>
                        <p className="text-muted-foreground font-medium uppercase tracking-widest text-[10px] opacity-70">Initialize a real-time synchronized assessment</p>
                    </div>

                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search modules..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full h-12 pl-12 pr-6 rounded-2xl bg-secondary/30 border-0 focus:ring-2 focus:ring-primary/20 transition-all font-medium text-sm"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24">
                        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-6" />
                        <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground animate-pulse">Accessing Library...</p>
                    </div>
                ) : filteredQuizzes.length === 0 ? (
                    <div className="text-center py-24 bg-secondary/10 rounded-[3rem] border-2 border-dashed border-border/50">
                        <Brain className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
                        <p className="text-lg font-bold text-muted-foreground">No matching modules found.</p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredQuizzes.map((quiz) => (
                            <Card
                                key={quiz.id}
                                className="group p-6 rounded-[2.5rem] border-0 bg-white shadow-soft hover:shadow-strong transition-all cursor-pointer ring-1 ring-border/50 relative overflow-hidden flex flex-col"
                            >
                                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12 blur-xl group-hover:bg-primary/10 transition-colors" />

                                <div className="mb-6 flex justify-between items-start">
                                    <div className="w-12 h-12 bg-secondary rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                                        <Brain className="w-6 h-6" />
                                    </div>
                                    <Badge className="bg-primary/10 text-primary border-0 rounded-lg text-[9px] font-black uppercase tracking-widest">
                                        {quiz.class || "All Levels"}
                                    </Badge>
                                </div>

                                <div className="flex-grow">
                                    <h3 className="text-xl font-black mb-2 tracking-tight line-clamp-2 min-h-[3.5rem] group-hover:text-primary transition-colors">{quiz.title}</h3>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-6">{quiz.subject || "General"}</p>

                                    <div className="flex flex-wrap gap-2 mb-8">
                                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/50 text-[10px] font-bold text-muted-foreground">
                                            <FileQuestion className="w-3 h-3" />
                                            {quiz.questionCount} Items
                                        </div>
                                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/50 text-[10px] font-bold text-muted-foreground">
                                            <Clock className="w-3 h-3" />
                                            {quiz.timer || 30}s/q
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    onClick={() => handleHost(quiz)}
                                    disabled={creatingSession}
                                    className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-black text-[10px] uppercase tracking-[0.2em] shadow-soft hover:scale-[1.02] transition-all border-0 gap-2"
                                >
                                    <Zap className="w-3.5 h-3.5 fill-current" />
                                    {creatingSession ? "INITIALIZING..." : "LAUNCH BATTLE"}
                                </Button>
                            </Card>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default ArenaCreate;
