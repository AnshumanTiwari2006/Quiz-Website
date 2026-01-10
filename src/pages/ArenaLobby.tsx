import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Zap, Play, ArrowLeft, ShieldCheck, Crown, User as UserIcon, Trash2, Brain } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { doc, onSnapshot, updateDoc, collection, setDoc, deleteDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const ArenaLobby = () => {
    const { code } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const { user, profile } = useAuth();
    const [session, setSession] = useState<any>(null);
    const [participants, setParticipants] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!code) return;

        // Session Listener
        const sessionRef = doc(db, "arena_sessions", code.toUpperCase());
        const unsubscribeSession = onSnapshot(sessionRef, (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                setSession(data);
                if (data.status === "active") {
                    navigate(`/arena/${code}/match`);
                }
            } else {
                toast({ title: "Session Disbanded", description: "This Arena no longer exists." });
                navigate("/");
            }
            setLoading(false);
        });

        // Participants Listener
        const participantsRef = collection(db, "arena_sessions", code.toUpperCase(), "participants");
        const unsubscribeParticipants = onSnapshot(participantsRef, (snapshot) => {
            const pList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setParticipants(pList);
        });

        // Join as participant if not already in
        const joinSession = async () => {
            if (user && code) {
                const pRef = doc(db, "arena_sessions", code.toUpperCase(), "participants", user.uid);
                await setDoc(pRef, {
                    name: profile?.name || user.email || "Unknown",
                    photoURL: profile?.photoURL || "",
                    score: 0,
                    joinedAt: new Date().toISOString(),
                    isHost: user.uid === session?.hostId
                });
            }
        };

        joinSession();

        return () => {
            unsubscribeSession();
            unsubscribeParticipants();
        };
    }, [code, user, profile, navigate, toast, session?.hostId]);

    const handleStart = async () => {
        if (!code) return;
        const sessionRef = doc(db, "arena_sessions", code.toUpperCase());
        await updateDoc(sessionRef, {
            status: "active",
            startTime: new Date().toISOString()
        });
    };

    const handleDisband = async () => {
        if (!code) return;
        if (window.confirm("Are you sure you want to disband this Arena?")) {
            const sessionRef = doc(db, "arena_sessions", code.toUpperCase());
            await deleteDoc(sessionRef);
            navigate("/");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center">
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-6" />
                <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground animate-pulse">Syncing Arena State...</p>
            </div>
        );
    }

    const isHost = user?.uid === session?.hostId;

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />
            <main className="max-w-4xl mx-auto px-6 py-12">
                <div className="grid md:grid-cols-3 gap-8 items-start">

                    {/* Left: Session Info */}
                    <div className="md:col-span-1 space-y-6">
                        <Card className="p-8 rounded-[2.5rem] border-0 bg-primary text-primary-foreground shadow-strong relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12 blur-xl" />
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2">Invite Code</p>
                            <h2 className="text-5xl font-black tracking-tighter mb-8">{code?.toUpperCase()}</h2>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                                        <Brain className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[8px] font-black uppercase opacity-60">Module</p>
                                        <p className="text-sm font-bold truncate">{session?.quizTitle}</p>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {isHost ? (
                            <Button
                                onClick={handleStart}
                                className="w-full h-16 rounded-2xl bg-foreground text-background font-black text-sm uppercase tracking-[0.2em] shadow-soft hover:scale-[1.02] transition-all border-0 gap-3"
                            >
                                <Play className="w-5 h-5 fill-current" />
                                Start Battle
                            </Button>
                        ) : (
                            <Card className="p-6 rounded-3xl border-0 bg-secondary/30 text-center ring-1 ring-border/50">
                                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4 text-primary">
                                    <ShieldCheck className="w-5 h-5" />
                                </div>
                                <p className="text-xs font-bold text-foreground">Waiting for Host</p>
                                <p className="text-[10px] text-muted-foreground mt-1">Stand by for synchronized authorization.</p>
                            </Card>
                        )}

                        {isHost && (
                            <Button
                                variant="ghost"
                                onClick={handleDisband}
                                className="w-full text-[10px] font-bold uppercase tracking-widest text-destructive hover:bg-destructive/10 h-12 rounded-xl border border-destructive/20"
                            >
                                <Trash2 className="w-3.5 h-3.5 mr-2" /> Disband Arena
                            </Button>
                        )}
                    </div>

                    {/* Right: Participant List */}
                    <div className="md:col-span-2">
                        <div className="flex items-center justify-between mb-8 px-2">
                            <div className="flex items-center gap-3">
                                <Users className="w-5 h-5 text-primary" />
                                <h2 className="text-xl font-black uppercase tracking-widest text-foreground">Scholar Circle</h2>
                            </div>
                            <Badge className="bg-primary/10 text-primary border-0 rounded-full px-4 h-8 flex items-center justify-center font-black text-xs">
                                {participants.length} Active
                            </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {participants.map((p) => (
                                <Card key={p.id} className="p-4 rounded-3xl border-0 bg-white shadow-soft flex items-center gap-4 ring-1 ring-border/30 hover:ring-primary/20 transition-all group">
                                    <div className="relative">
                                        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-secondary/50 group-hover:border-primary/20 transition-all">
                                            {p.photoURL ? (
                                                <img src={p.photoURL} alt={p.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full bg-secondary/30 flex items-center justify-center font-black text-primary text-xs uppercase">
                                                    {p.name[0]}
                                                </div>
                                            )}
                                        </div>
                                        {p.isHost && (
                                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-400 rounded-full border-2 border-white flex items-center justify-center shadow-sm">
                                                <Crown className="w-2.5 h-2.5 text-white fill-white" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-black text-foreground truncate">{p.name}</p>
                                        <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground opacity-60">
                                            {p.isHost ? "Grandmaster" : "Contender"}
                                        </p>
                                    </div>
                                </Card>
                            ))}
                            {Array.from({ length: Math.max(0, 4 - participants.length) }).map((_, i) => (
                                <div key={i} className="p-4 rounded-3xl border-2 border-dashed border-border/20 flex items-center gap-4 opacity-30">
                                    <div className="w-12 h-12 rounded-full bg-secondary/30 border-2 border-secondary/10" />
                                    <div className="h-6 w-24 bg-secondary/20 rounded-md" />
                                </div>
                            ))}
                        </div>

                        <div className="mt-12 bg-primary/5 rounded-[2.5rem] p-8 border border-primary/10 relative overflow-hidden">
                            <Zap className="absolute right-8 top-1/2 -translate-y-1/2 w-24 h-24 text-primary/5" />
                            <h4 className="text-lg font-black tracking-tight mb-2">Pro Tip</h4>
                            <p className="text-sm text-muted-foreground leading-relaxed font-medium max-w-md">
                                In the Arena, speed matters as much as accuracy. The faster you answer correctly, the higher you'll climb on the real-time leaderboard.
                            </p>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
};

export default ArenaLobby;
