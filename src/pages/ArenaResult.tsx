import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Users, Home, ArrowRight, Zap, GraduationCap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { doc, getDoc, collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion } from "framer-motion";

const ArenaResult = () => {
    const { code } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [participants, setParticipants] = useState<any[]>([]);
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadResults = async () => {
            if (!code) return;
            try {
                const sessionRef = doc(db, "arena_sessions", code.toUpperCase());
                const sessionSnap = await getDoc(sessionRef);
                if (sessionSnap.exists()) {
                    setSession(sessionSnap.data());
                }

                const pRef = collection(db, "arena_sessions", code.toUpperCase(), "participants");
                const q = query(pRef, orderBy("score", "desc"));
                const pSnap = await getDocs(q);
                setParticipants(pSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            } catch (error) {
                console.error("Results load failure", error);
            } finally {
                setLoading(false);
            }
        };

        loadResults();
    }, [code]);

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center">
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-6" />
                <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Compiling Final Rankings...</p>
            </div>
        );
    }

    const podium = participants.slice(0, 3);
    const others = participants.slice(3);
    const userRank = participants.findIndex(p => p.id === user?.uid) + 1;
    const userScore = participants.find(p => p.id === user?.uid)?.score || 0;

    return (
        <div className="min-h-screen bg-background text-foreground pb-20">
            <Navbar />

            <main className="max-w-4xl mx-auto px-6 py-12">
                <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-4 py-1.5 mb-6">
                        <Trophy className="w-4 h-4 text-amber-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">Battle Concluded</span>
                    </div>
                    <h1 className="text-5xl font-black mb-4 tracking-tight">Arena Standings</h1>
                    <p className="text-muted-foreground font-medium uppercase tracking-[0.2em] text-[10px] opacity-70">
                        Official Synchronization Report: {session?.quizTitle}
                    </p>
                </div>

                {/* Podium */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end mb-16">
                    {/* 2nd Place */}
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="order-2 md:order-1"
                    >
                        {podium[1] && (
                            <Card className="p-8 rounded-[2.5rem] border-0 bg-white shadow-soft transition-all ring-1 ring-border/50 text-center relative overflow-hidden h-64 flex flex-col justify-center">
                                <div className="absolute top-0 inset-x-0 h-1.5 bg-slate-400" />
                                <div className="w-16 h-16 rounded-full overflow-hidden mx-auto mb-4 border-4 border-slate-100 shadow-md">
                                    {podium[1].photoURL ? <img src={podium[1].photoURL} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-100 flex items-center justify-center font-black text-slate-400">{podium[1].name[0]}</div>}
                                </div>
                                <h3 className="font-bold text-lg truncate mb-1">{podium[1].name}</h3>
                                <p className="text-2xl font-black text-slate-500 mb-2">{podium[1].score}</p>
                                <Badge className="bg-slate-100 text-slate-500 border-0 rounded-lg mx-auto uppercase text-[9px] font-black tracking-widest">🥈 Silver Tier</Badge>
                            </Card>
                        )}
                    </motion.div>

                    {/* 1st Place */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="order-1 md:order-2"
                    >
                        {podium[0] && (
                            <Card className="p-10 rounded-[3rem] border-0 bg-white shadow-strong transition-all ring-2 ring-amber-500/20 text-center relative overflow-hidden h-80 flex flex-col justify-center scale-105 z-10">
                                <div className="absolute top-0 inset-x-0 h-2 bg-amber-500" />
                                <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-6 border-4 border-amber-100 shadow-lg ring-4 ring-amber-500/10">
                                    {podium[0].photoURL ? <img src={podium[0].photoURL} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-amber-500 flex items-center justify-center font-black text-white text-3xl">{podium[0].name[0]}</div>}
                                </div>
                                <h3 className="font-bold text-2xl truncate mb-1">{podium[0].name}</h3>
                                <p className="text-4xl font-black text-amber-500 mb-4">{podium[0].score}</p>
                                <Badge className="bg-amber-500 text-white border-0 rounded-xl mx-auto uppercase text-[10px] font-black tracking-[0.2em] px-4 py-1.5 shadow-soft">🏆 Grandmaster</Badge>
                            </Card>
                        )}
                    </motion.div>

                    {/* 3rd Place */}
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="order-3"
                    >
                        {podium[2] && (
                            <Card className="p-8 rounded-[2.5rem] border-0 bg-white shadow-soft transition-all ring-1 ring-border/50 text-center relative overflow-hidden h-56 flex flex-col justify-center">
                                <div className="absolute top-0 inset-x-0 h-1.5 bg-orange-400" />
                                <div className="w-14 h-14 rounded-full overflow-hidden mx-auto mb-3 border-4 border-orange-100 shadow-md">
                                    {podium[2].photoURL ? <img src={podium[2].photoURL} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-orange-100 flex items-center justify-center font-black text-orange-400">{podium[2].name[0]}</div>}
                                </div>
                                <h3 className="font-bold text-base truncate mb-1">{podium[2].name}</h3>
                                <p className="text-xl font-black text-orange-500 mb-2">{podium[2].score}</p>
                                <Badge className="bg-orange-100 text-orange-500 border-0 rounded-lg mx-auto uppercase text-[8px] font-black tracking-widest">🥉 Bronze Tier</Badge>
                            </Card>
                        )}
                    </motion.div>
                </div>

                {/* Others */}
                <div className="space-y-4 mb-20">
                    {others.map((p, idx) => (
                        <motion.div
                            key={p.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 + idx * 0.1 }}
                        >
                            <Card className="p-5 rounded-3xl border-0 bg-secondary/10 flex items-center justify-between group hover:bg-secondary/20 transition-all">
                                <div className="flex items-center gap-5">
                                    <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center font-black text-muted-foreground ring-1 ring-border/30">
                                        {idx + 4}
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white">
                                            {p.photoURL ? <img src={p.photoURL} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-secondary/50 flex items-center justify-center font-black text-xs text-muted-foreground">{p.name[0]}</div>}
                                        </div>
                                        <div>
                                            <p className="font-bold text-foreground truncate max-w-[150px]">{p.name}</p>
                                            <p className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest">Elite Contender</p>
                                        </div>
                                    </div>
                                </div>
                                <p className="font-black text-lg text-primary tabular-nums">{p.score}</p>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                {/* Bottom Stats Card */}
                <Card className="p-10 rounded-[3rem] border-0 bg-foreground text-background shadow-strong relative overflow-hidden mb-12">
                    <Zap className="absolute right-10 top-1/2 -translate-y-1/2 w-48 h-48 text-white/5" />
                    <div className="grid md:grid-cols-3 gap-12 text-center relative z-10">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 mb-2">My Rank</p>
                            <div className="flex items-center justify-center gap-3">
                                <Medal className="w-6 h-6 text-amber-400" />
                                <p className="text-4xl font-black text-white">#{userRank}</p>
                            </div>
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 mb-2">Final Magnitude</p>
                            <p className="text-4xl font-black text-white">{userScore}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 mb-2">Competitors</p>
                            <p className="text-4xl font-black text-white">{participants.length}</p>
                        </div>
                    </div>
                </Card>

                <div className="flex flex-col md:flex-row gap-4 justify-center">
                    <Button
                        onClick={() => navigate('/')}
                        className="rounded-full h-16 px-10 bg-primary text-primary-foreground font-black uppercase tracking-widest text-xs border-0 shadow-soft hover:scale-[1.05] transition-all"
                    >
                        <Home className="mr-3 w-4 h-4" /> Return to Hub
                    </Button>
                    <Button
                        onClick={() => navigate('/quizzes')}
                        variant="ghost"
                        className="rounded-full h-16 px-10 border-2 border-border/50 font-black uppercase tracking-widest text-xs hover:bg-secondary transition-all"
                    >
                        Browse More Modules <ArrowRight className="ml-3 w-4 h-4" />
                    </Button>
                </div>
            </main>
        </div>
    );
};

export default ArenaResult;
