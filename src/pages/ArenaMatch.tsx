import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Zap, Clock, Trophy, Users, ShieldAlert, ArrowRight, Brain, CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { doc, onSnapshot, updateDoc, collection, getDoc, runTransaction } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";

const ArenaMatch = () => {
    const { code } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const { user, profile } = useAuth();

    const [session, setSession] = useState<any>(null);
    const [participants, setParticipants] = useState<any[]>([]);
    const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
    const [timeLeft, setTimeLeft] = useState(30);
    const [currentQuestion, setCurrentQuestion] = useState<any>(null);
    const [hasAnswered, setHasAnswered] = useState(false);
    const [answerStatus, setAnswerStatus] = useState<"none" | "correct" | "incorrect">("none");
    const [loading, setLoading] = useState(true);

    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!code || !user) return;

        // Session Listener
        const sessionRef = doc(db, "arena_sessions", code.toUpperCase());
        const unsubscribeSession = onSnapshot(sessionRef, async (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setSession(data);

                if (data.status === "finished") {
                    navigate(`/arena/${code}/result`);
                    return;
                }

                // Load Questions if not loaded
                if (quizQuestions.length === 0) {
                    const quizRef = doc(db, "quizzes", data.quizId);
                    const quizSnap = await getDoc(quizRef);
                    if (quizSnap.exists()) {
                        setQuizQuestions(quizSnap.data().questions || []);
                    }
                }
            } else {
                navigate("/");
            }
            setLoading(false);
        });

        // Participants Listener
        const participantsRef = collection(db, "arena_sessions", code.toUpperCase(), "participants");
        const unsubscribeParticipants = onSnapshot(participantsRef, (snapshot) => {
            const pList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
            setParticipants(pList.sort((a, b) => b.score - a.score));
        });

        return () => {
            unsubscribeSession();
            unsubscribeParticipants();
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [code, user, navigate]);

    // Handle Question Changes
    useEffect(() => {
        if (session && quizQuestions.length > 0) {
            const q = quizQuestions[session.currentQuestionIndex];
            setCurrentQuestion(q);
            setHasAnswered(false);
            setAnswerStatus("none");
            setTimeLeft(session.settings?.timePerQuestion || 30);

            if (timerRef.current) clearInterval(timerRef.current);
            timerRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        if (timerRef.current) clearInterval(timerRef.current);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
    }, [session?.currentQuestionIndex, quizQuestions]);

    const handleAnswer = async (selectedAnswer: string) => {
        if (hasAnswered || timeLeft === 0 || !user || !session) return;

        const isCorrect = selectedAnswer === currentQuestion.answer;
        setHasAnswered(true);
        setAnswerStatus(isCorrect ? "correct" : "incorrect");

        // Scoring Logic: 
        // Base Points: 50
        // Speed Multiplier: Remaining Time % of base
        // Max Points: 100
        let points = 0;
        if (isCorrect) {
            const timeBonus = Math.floor((timeLeft / (session.settings?.timePerQuestion || 30)) * 50);
            points = 50 + timeBonus;
        }

        try {
            const pRef = doc(db, "arena_sessions", code!.toUpperCase(), "participants", user.uid);
            await runTransaction(db, async (transaction) => {
                const pSnap = await transaction.get(pRef);
                if (!pSnap.exists()) return;
                const newScore = (pSnap.data().score || 0) + points;
                transaction.update(pRef, { score: newScore, lastAnswerCorrect: isCorrect });
            });
        } catch (e) {
            console.error("Score update failed:", e);
        }
    };

    const handleNextQuestion = async () => {
        if (!session || user?.uid !== session.hostId) return;

        const isLast = session.currentQuestionIndex === quizQuestions.length - 1;
        const sessionRef = doc(db, "arena_sessions", code!.toUpperCase());

        if (isLast) {
            await updateDoc(sessionRef, { status: "finished" });
        } else {
            await updateDoc(sessionRef, {
                currentQuestionIndex: session.currentQuestionIndex + 1
            });
        }
    };

    if (loading || !currentQuestion) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center">
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-6" />
                <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Synchronizing Battleground...</p>
            </div>
        );
    }

    const isHost = user?.uid === session.hostId;
    const isTeacher = profile?.role === "teacher" || profile?.role === "admin";
    const canPlay = !isTeacher || !isHost; // Teachers who host don't play? Or maybe they can.

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            <Navbar />

            <main className="flex-grow grid grid-cols-1 lg:grid-cols-4 gap-0 h-[calc(100vh-80px)] overflow-hidden">

                {/* Left: Scoreboard (Synchronized) */}
                <div className="lg:col-span-1 border-r border-border/10 bg-secondary/5 hidden lg:flex flex-col p-6 overflow-y-auto">
                    <div className="flex items-center gap-3 mb-8 px-2">
                        <Trophy className="w-5 h-5 text-amber-500" />
                        <h2 className="text-sm font-black uppercase tracking-widest">Live Standings</h2>
                    </div>

                    <div className="space-y-3">
                        <AnimatePresence mode="popLayout">
                            {participants.map((p, idx) => (
                                <motion.div
                                    key={p.id}
                                    layout
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className={`p-4 rounded-2xl flex items-center justify-between transition-all ${p.id === user?.uid ? "bg-primary text-primary-foreground shadow-lg scale-[1.02]" : "bg-white shadow-soft ring-1 ring-border/50"}`}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border-2 border-white/20">
                                            {p.photoURL ? (
                                                <img src={p.photoURL} alt={p.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full bg-secondary/50 flex items-center justify-center font-black text-[10px] uppercase">
                                                    {p.name[0]}
                                                </div>
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold truncate">{p.name}</p>
                                            <p className={`text-[8px] font-black uppercase tracking-widest ${p.id === user?.uid ? "opacity-60" : "text-muted-foreground/60"}`}>
                                                Rank #{idx + 1}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="font-black text-sm tabular-nums">{p.score}</p>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Center: Match Area */}
                <div className="lg:col-span-2 p-6 md:p-12 overflow-y-auto flex flex-col items-center">
                    <div className="w-full max-w-2xl">
                        {/* Header Stats */}
                        <div className="flex justify-between items-center mb-12">
                            <Badge className="bg-primary/10 text-primary border-0 rounded-full px-4 h-8 font-black text-[10px] uppercase tracking-widest">
                                Question {session.currentQuestionIndex + 1} of {quizQuestions.length}
                            </Badge>

                            <div className="flex items-center gap-4">
                                <Users className="w-4 h-4 text-muted-foreground" />
                                <span className="text-xs font-black tabular-nums">{participants.length}</span>
                            </div>

                            <div className="flex items-center gap-2">
                                <Clock className={`w-4 h-4 ${timeLeft < 5 ? "text-destructive animate-pulse" : "text-primary"}`} />
                                <span className={`text-xl font-black tabular-nums ${timeLeft < 5 ? "text-destructive" : "text-foreground"}`}>
                                    {timeLeft}s
                                </span>
                            </div>
                        </div>

                        {/* Question Card */}
                        <Card className="p-8 md:p-12 rounded-[3.5rem] border-0 bg-white shadow-strong mb-12 ring-1 ring-border/50 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-2 bg-secondary/20">
                                <motion.div
                                    className="h-full bg-primary"
                                    initial={{ width: "100%" }}
                                    animate={{ width: `${(timeLeft / (session.settings?.timePerQuestion || 30)) * 100}%` }}
                                    transition={{ duration: 1, ease: "linear" }}
                                />
                            </div>

                            {currentQuestion.image && (
                                <div className="w-full h-64 rounded-3xl overflow-hidden mb-8 shadow-soft ring-1 ring-primary/10">
                                    <img src={currentQuestion.image} alt="Question Context" className="w-full h-full object-cover" />
                                </div>
                            )}

                            <h3 className="text-2xl md:text-3xl font-black tracking-tight leading-tight text-foreground">
                                {currentQuestion.question}
                            </h3>
                        </Card>

                        {/* Options */}
                        {canPlay ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {currentQuestion.options?.map((option: string, idx: number) => {
                                    const isCorrect = option === currentQuestion.answer;
                                    const isSelected = hasAnswered; // Simplified for MVP

                                    return (
                                        <Button
                                            key={idx}
                                            disabled={hasAnswered || timeLeft === 0}
                                            onClick={() => handleAnswer(option)}
                                            className={`h-20 rounded-2xl border-2 text-lg font-bold transition-all p-6 ${hasAnswered
                                                ? isCorrect
                                                    ? "bg-success/10 border-success text-success scale-[1.02]"
                                                    : "bg-destructive/5 border-border/50 text-muted-foreground opacity-50"
                                                : "bg-white border-border/50 text-foreground hover:border-primary hover:bg-primary/5 hover:scale-[1.02]"
                                                } border-0 shadow-soft relative overflow-hidden`}
                                        >
                                            <span className="relative z-10">{option}</span>
                                            {hasAnswered && isCorrect && <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 text-success z-10" />}
                                        </Button>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-secondary/10 rounded-[2.5rem] border-2 border-dashed border-border/50">
                                <ShieldAlert className="w-12 h-12 text-primary/30 mx-auto mb-4" />
                                <p className="text-lg font-black text-foreground">Grandmaster Monitoring Mode</p>
                                <p className="text-sm text-muted-foreground font-medium">You are currently observing and controlling the pace of this Arena.</p>
                            </div>
                        )}

                        {/* Status Message */}
                        <AnimatePresence>
                            {hasAnswered && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`mt-12 p-6 rounded-3xl flex items-center justify-between ${answerStatus === "correct" ? "bg-success/5 border border-success/20" : "bg-destructive/5 border border-destructive/20"}`}
                                >
                                    <div className="flex items-center gap-4">
                                        {answerStatus === "correct" ? (
                                            <div className="w-10 h-10 bg-success rounded-full flex items-center justify-center text-white">
                                                <Zap className="w-6 h-6 fill-current" />
                                            </div>
                                        ) : (
                                            <div className="w-10 h-10 bg-destructive rounded-full flex items-center justify-center text-white">
                                                <ShieldAlert className="w-6 h-6" />
                                            </div>
                                        )}
                                        <div>
                                            <p className="font-black text-lg">
                                                {answerStatus === "correct" ? "Excellent Precision!" : "Critical Failure"}
                                            </p>
                                            <p className="text-xs font-bold text-muted-foreground opacity-70">
                                                Waiting for the host to authorize the next item.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Synchronized State</p>
                                        <p className="text-sm font-black text-primary animate-pulse">STAND BY</p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Host Next Control */}
                        {isHost && (
                            <div className="mt-12 flex justify-center">
                                <Button
                                    onClick={handleNextQuestion}
                                    className="rounded-full bg-foreground text-background h-14 px-10 font-black uppercase tracking-[0.2em] shadow-strong hover:scale-105 transition-all gap-3"
                                >
                                    Authorize Next Question
                                    <ArrowRight className="w-5 h-5" />
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Mobile Standings (Fixed bottom or separate) */}
                <div className="lg:col-span-1 border-l border-border/10 bg-secondary/5 hidden lg:flex flex-col p-6 items-center justify-center text-center">
                    <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center mb-6 text-primary">
                        <Zap className="w-10 h-10 fill-primary/20" />
                    </div>
                    <h4 className="text-lg font-black tracking-tight mb-2">Arena Meta</h4>
                    <p className="text-xs text-muted-foreground font-medium leading-relaxed max-w-[200px]">
                        The leaderboard updates instantly. Watch your rivals in real-time as they fight for the top spot.
                    </p>
                </div>

            </main>
        </div>
    );
};

export default ArenaMatch;
