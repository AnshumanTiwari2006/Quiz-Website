import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Brain,
    Upload,
    Zap,
    FileText,
    Settings2,
    Sparkles,
    CheckCircle2,
    ChevronRight,
    RefreshCw,
    ShieldAlert,
    History,
    Users,
    TrendingUp,
    Layout,
    ArrowRight,
    Search,
    Type,
    Layers,
    AlertCircle,
    Trash2,
    ArrowLeft,
    Plus,
    Check
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, doc, getDoc, setDoc } from "firebase/firestore";

const AIGenerator = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const { user, profile } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [sessionId, setSessionId] = useState<string | null>(null);
    const [recentSessions, setRecentSessions] = useState<any[]>([]);
    const [file, setFile] = useState<File | null>(null);

    const [config, setConfig] = useState({
        mcq: 10,
        tf: 10,
        multi: 3,
        flash: 5,
        match: 2,
        totalQuestions: 90
    });

    // Generation State
    const [isGenerating, setIsGenerating] = useState(false);
    const [genStage, setGenStage] = useState<"idle" | "easy" | "moderate" | "hard" | "complete">("idle");
    const [generatedQuiz, setGeneratedQuiz] = useState<any>({ easy: [], moderate: [], hard: [] });
    const [extractedText, setExtractedText] = useState("");
    const [activeViewStage, setActiveViewStage] = useState<"easy" | "moderate" | "hard">("easy");

    useEffect(() => {
        if (!user) return;
        const fetchSessions = async () => {
            try {
                const { getDocs, query, collection, where, orderBy, limit } = await import("firebase/firestore");
                const q = query(
                    collection(db, "ai_sessions"),
                    where("teacherId", "==", user.uid),
                    limit(20)
                );
                const querySnapshot = await getDocs(q);
                const sessions = querySnapshot.docs
                    .map(doc => ({ id: doc.id, ...doc.data() } as any))
                    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
                setRecentSessions(sessions);
            } catch (e) {
                console.error("Error fetching sessions:", e);
            }
        };
        fetchSessions();
    }, [user, sessionId, genStage]);

    const updateGeneratedQuestion = (stage: "easy" | "moderate" | "hard", index: number, field: string, value: any) => {
        setGeneratedQuiz((prev: any) => {
            const next = { ...prev };
            const stageQuestions = [...next[stage]];
            stageQuestions[index] = { ...stageQuestions[index], [field]: value };
            next[stage] = stageQuestions;
            return next;
        });
    };

    const updateGeneratedOption = (stage: "easy" | "moderate" | "hard", qIndex: number, optIndex: number, value: string) => {
        setGeneratedQuiz((prev: any) => {
            const next = { ...prev };
            const stageQuestions = [...next[stage]];
            const question = { ...stageQuestions[qIndex] };
            const newOptions = [...(question.options || [])];
            newOptions[optIndex] = value;
            question.options = newOptions;
            stageQuestions[qIndex] = question;
            next[stage] = stageQuestions;
            return next;
        });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0];
        if (selected) {
            setFile(selected);
            setGenStage("idle");
            setGeneratedQuiz({ easy: [], moderate: [], hard: [] });
            setExtractedText("");
        }
    };

    const runGenerationPass = async (stage: "easy" | "moderate" | "hard") => {
        setIsGenerating(true);
        try {
            // 1. ADMIN RESTRICTION CHECK
            if (profile?.aiRestricted) {
                toast({ title: "Access Revoked", description: "The Master Admin has restricted your AI Architect access.", variant: "destructive" });
                setIsGenerating(false);
                return;
            }

            // 2. DAILY QUOTA CHECK (9 Tiers Total)
            const today = new Date().toISOString().split('T')[0];
            const todaySessions = recentSessions.filter(s => s.updatedAt.startsWith(today));
            const totalTiersGenerated = todaySessions.reduce((acc, s) => {
                const quiz = s.generatedQuiz || {};
                return acc + (quiz.easy?.length > 0 ? 1 : 0) + (quiz.moderate?.length > 0 ? 1 : 0) + (quiz.hard?.length > 0 ? 1 : 0);
            }, 0);

            if (totalTiersGenerated >= 9) {
                toast({ title: "Daily Limit Reached", description: "You have used your 9 daily generation credits.", variant: "destructive" });
                setIsGenerating(false);
                return;
            }

            // 3. CONCURRENCY LOCK (No two teachers at once)
            const lockRef = doc(db, "system", "ai_lock");
            const lockSnap = await getDoc(lockRef);

            if (lockSnap.exists() && lockSnap.data().active) {
                const startTime = lockSnap.data().timestamp?.toMillis() || 0;
                const activeTeacher = lockSnap.data().teacherName || "Another Educator";
                if (Date.now() - startTime < 5 * 60 * 1000) {
                    toast({
                        title: "Architect Busy",
                        description: `${activeTeacher} is currently designing a quiz. Please wait 5 minutes.`,
                        variant: "destructive"
                    });
                    setIsGenerating(false);
                    return;
                }
            }

            // Aggressively clear any stale locks
            await setDoc(lockRef, {
                active: true,
                teacherId: user?.uid,
                teacherName: profile?.name || user?.email,
                timestamp: serverTimestamp()
            });

            const formData = new FormData();
            if (file && file instanceof File) {
                formData.append('file', file);
            }
            if (extractedText) {
                formData.append('text', extractedText);
            }

            formData.append('stage', stage);

            // Pass existing questions as context for Moderate/Hard tiers
            const existingContent = Object.values(generatedQuiz).flat();
            if (existingContent.length > 0) {
                formData.append('context', JSON.stringify(existingContent));
            }

            Object.entries(config).forEach(([key, val]) => formData.append(key, val.toString()));

            const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
            const response = await fetch(`${API_BASE}/api/generate-quiz`, {
                method: 'POST',
                headers: {
                    'x-user-id': user?.uid || 'anonymous',
                    'x-user-role': profile?.role || 'guest'
                },
                body: formData,
                signal: AbortSignal.timeout(120000) // 2 minute timeout for complex Hindi OCR
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || "AI Architect failed to respond");
            }

            const data = await response.json();

            // VALIDATION: Check if extraction failed on backend
            if (data.extractedText && data.extractedText.includes("ERROR: PDF extraction failed")) {
                toast({
                    title: "Extraction Failed",
                    description: "The document is too complex or scanned. Subsequent stages will fail.",
                    variant: "destructive"
                });
                // Stop the flow 
                setIsGenerating(false);
                return;
            }

            const newGeneratedQuiz = { ...generatedQuiz, [stage]: data.questions };
            setGeneratedQuiz(newGeneratedQuiz);

            if (data.extractedText) setExtractedText(data.extractedText);

            setGenStage(stage);
            setActiveViewStage(stage);

            // AUTO-SAVE SESSION (Sanitized)
            if (user) {
                const sessionPayload = JSON.parse(JSON.stringify({
                    fileName: file?.name || "Document",
                    extractedText: data.extractedText || extractedText,
                    generatedQuiz: newGeneratedQuiz,
                    genStage: stage,
                    updatedAt: new Date().toISOString(),
                    teacherId: user.uid
                }));

                if (sessionId) {
                    await setDoc(doc(db, "ai_sessions", sessionId), sessionPayload, { merge: true });
                } else {
                    const docRef = await addDoc(collection(db, "ai_sessions"), {
                        ...sessionPayload,
                        createdAt: new Date().toISOString()
                    });
                    setSessionId(docRef.id);
                }
            }

            toast({
                title: `Tier Complete: ${stage.toUpperCase()}`,
                description: `Review the results and proceed.`,
                className: "bg-primary text-white border-0 shadow-lg"
            });

        } catch (error: any) {
            console.error(error);
            toast({ title: "Pass Failed", description: error.message || "Verify backend is active and Gemini Key is set.", variant: "destructive" });
        } finally {
            await setDoc(doc(db, "system", "ai_lock"), { active: false });
            setIsGenerating(false);
        }
    };

    const handleDeploy = async () => {
        if (!user) return;
        try {
            const stages: ("easy" | "moderate" | "hard")[] = ["easy", "moderate", "hard"];
            let deployedCount = 0;

            for (const s of stages) {
                const questions = generatedQuiz[s];
                if (!questions || questions.length === 0) continue;

                console.log(`[Deploy] Processing ${s} tier with ${questions.length} questions.`);

                // SANITATION: Deep clean all fields to prevent Firestore serialization errors
                const sanitizedQuestions = questions.map((q: any, idx: number) => {
                    const type = String(q.type || 'mcq');
                    const clean: any = {
                        id: String(q.id || `ai_${s}_${Date.now()}_${idx}`),
                        type: type,
                        question: String(q.question || q.front || 'Untitled Question'),
                        points: Number(q.points) || 10,
                        answer: "" // Placeholder, updated below
                    };

                    if (type === 'mcq' || type === 'multi_mcq') {
                        clean.options = Array.isArray(q.options) ? q.options.map(String) : ["", "", "", ""];
                        clean.answer = Array.isArray(q.answer) ? q.answer.join(', ') : String(q.answer || '');
                    } else if (type === 'truefalse') {
                        clean.answer = String(q.answer || 'True');
                        clean.options = ['True', 'False'];
                    } else if (type === 'match') {
                        clean.pairs = Array.isArray(q.pairs) ? q.pairs.map((p: any) => ({
                            left: String(p.left || ''),
                            right: String(p.right || '')
                        })) : [];
                        clean.answer = "Match the following items correctly";
                    } else if (type === 'flashcard') {
                        clean.front = String(q.front || q.question || '');
                        clean.back = String(q.back || '');
                        clean.answer = clean.back;
                    } else if (type === 'oneword') {
                        clean.answer = String(q.answer || '');
                    }

                    return clean;
                });

                const quizPayload = JSON.parse(JSON.stringify({
                    title: `AI ${s.toUpperCase()}: ${file?.name?.split('.')[0] || 'Generated Module'}`,
                    questions: sanitizedQuestions,
                    questionCount: sanitizedQuestions.length,
                    type: "mixed",
                    timer: 0,
                    image: "",
                    subject: "AI Generated",
                    class: "General",
                    level: s.charAt(0).toUpperCase() + s.slice(1),
                    teacherId: String(user.uid),
                    teacherName: String(profile?.name || user.email || 'Teacher'),
                    teacherPhoto: String(profile?.photoURL || ""),
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }));

                console.log(`[Deploy] Attempting Firestore push for ${s} tier...`);
                await addDoc(collection(db, "quizzes"), quizPayload);
                deployedCount++;
            }

            if (deployedCount === 0) return;

            toast({
                title: `${deployedCount} Quizzes Deployed`,
                description: "Cloud Registry synchronized successfully. You can continue with other tiers.",
                className: "bg-primary text-white border-0 shadow-lg"
            });
            // REMOVED: navigate("/admin/quizzes"); - User wants to continue from here
        } catch (e: any) {
            console.error("CRITICAL DEPLOYMENT FAILURE:", e);
            toast({
                title: "Failed to save",
                description: `System Error: ${e.message || "Unknown Firestore failure"}. Please check your internet or permissions.`,
                variant: "destructive"
            });
        }
    };

    const loadSession = async (session: any) => {
        // AUTOMATIC STORAGE JANITOR (Purge text older than 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const isOld = new Date(session.updatedAt) < sevenDaysAgo;

        if (isOld && (session.extractedText || session.fileVisuals)) {
            console.log("[Janitor] Purging heavy document data for session:", session.id);
            const { updateDoc, doc } = await import("firebase/firestore");
            await updateDoc(doc(db, "ai_sessions", session.id), {
                extractedText: "[PURGED: Storage Management]",
                fileVisuals: null,
                janitorPurged: true
            });
            session.extractedText = "[PURGED: Storage Management]";
        }

        setSessionId(session.id);
        setGeneratedQuiz(session.generatedQuiz);
        setExtractedText(session.extractedText);
        setGenStage(session.genStage);
        setFile({ name: session.fileName } as any);
        toast({ title: "Session Restored", description: `Loaded: ${session.fileName}` });
    };

    const handleDeleteSession = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        try {
            const { deleteDoc, doc } = await import("firebase/firestore");
            await deleteDoc(doc(db, "ai_sessions", id));
            setRecentSessions(prev => prev.filter(s => s.id !== id));
            if (sessionId === id) {
                setSessionId(null);
                setFile(null);
                setGeneratedQuiz({ easy: [], moderate: [], hard: [] });
                setGenStage("idle");
            }
            toast({ title: "Session Purged", description: "Architectural history updated successfully." });
        } catch (error: any) {
            toast({ title: "Delete Failed", description: error.message, variant: "destructive" });
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground animate-in fade-in duration-500 pb-20">
            <Navbar />
            <div className="flex">
                {/* Session Sidebar (Left) */}
                <aside className="w-80 h-[calc(100vh-64px)] overflow-y-auto border-r border-border/10 bg-secondary/5 hidden sm:block p-6 space-y-8">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Architect Sessions</h3>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setGenStage("idle");
                                setSessionId(null);
                                setFile(null);
                                setGeneratedQuiz({ easy: [], moderate: [], hard: [] });
                            }}
                            className="h-7 w-7 p-0 rounded-lg hover:bg-primary/10 text-primary"
                        >
                            <Plus className="w-4 h-4" />
                        </Button>
                    </div>

                    <div className="space-y-3">
                        {recentSessions.length === 0 ? (
                            <div className="p-8 text-center rounded-2xl border-2 border-dashed border-border/5">
                                <History className="w-8 h-8 text-muted-foreground/20 mx-auto mb-3" />
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">No Past Sessions</p>
                            </div>
                        ) : (
                            recentSessions.map((s) => (
                                <Card
                                    key={s.id}
                                    onClick={() => loadSession(s)}
                                    className={`p-4 rounded-2xl cursor-pointer border-0 transition-all hover:scale-[1.02] group relative ${sessionId === s.id ? 'bg-primary text-white shadow-lg' : 'bg-white hover:bg-primary/5 ring-1 ring-border/5'}`}
                                >
                                    <div className="flex gap-3 items-start pr-8">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${sessionId === s.id ? 'bg-white/20' : 'bg-primary/10'}`}>
                                            <FileText className={`w-4 h-4 ${sessionId === s.id ? 'text-white' : 'text-primary'}`} />
                                        </div>
                                        <div className="overflow-hidden flex-1">
                                            <p className={`text-[11px] font-black truncate ${sessionId === s.id ? 'text-white' : 'text-foreground'}`}>{s.fileName}</p>
                                            <div className="flex items-center justify-between mt-1">
                                                <p className={`text-[9px] font-medium truncate ${sessionId === s.id ? 'text-white/60' : 'text-muted-foreground'}`}>{new Date(s.updatedAt).toLocaleDateString()}</p>
                                                <div className="flex gap-1">
                                                    {['easy', 'moderate', 'hard'].map(t => (
                                                        <div key={t} className={`w-1 h-1 rounded-full ${s.generatedQuiz?.[t]?.length > 0 ? (sessionId === s.id ? 'bg-white' : 'bg-primary') : 'bg-muted-foreground/20'}`} />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Detailed Stats Overlay on Hover */}
                                    <div className={`absolute bottom-2 right-4 text-[8px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-40 transition-opacity ${sessionId === s.id ? 'text-white' : 'text-primary'}`}>
                                        {(s.generatedQuiz?.easy?.length || 0) + (s.generatedQuiz?.moderate?.length || 0) + (s.generatedQuiz?.hard?.length || 0)} QUESTIONS
                                    </div>

                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => handleDeleteSession(e, s.id)}
                                        className={`absolute right-2 top-2 h-7 w-7 p-0 rounded-lg opacity-0 group-hover:opacity-100 transition-all ${sessionId === s.id ? 'hover:bg-white/20 text-white' : 'hover:bg-destructive/10 text-destructive'}`}
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </Button>
                                </Card>
                            ))
                        )}
                    </div>
                </aside>

                <main className="flex-1 max-w-7xl mx-auto px-6 py-12">
                    {/* Master Header Style */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <Brain className="w-5 h-5 text-primary" />
                                </div>
                                <h1 className="text-4xl font-black tracking-tight">AI Quiz Architect</h1>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                <p className="text-muted-foreground font-bold uppercase tracking-widest text-[10px] opacity-70 italic">Platform-Level Adaptive Assessment Engine</p>
                            </div>
                        </div>
                        <Badge className="bg-primary text-white border-0 rounded-2xl h-10 px-8 font-black uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-primary/20">
                            <Zap className="w-4 h-4 fill-current" />
                            Model Optimized: Gemini 2.5 Flash-Lite
                        </Badge>
                    </div>

                    {genStage === "idle" ? (
                        <div className="space-y-12">
                            {/* Summary Stats Strip (Like Master Dashboard) */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                {[
                                    {
                                        label: "Architecture",
                                        value: "Gemini 2.5 Flash-Lite",
                                        icon: Brain,
                                        color: "text-primary",
                                        bg: "bg-primary/5"
                                    },
                                    { label: "Context Limit", value: "1M Tokens", icon: Layout, color: "text-primary", bg: "bg-primary/5" },
                                    { label: "Estimated Output", value: "90 Qs", icon: Zap, color: "text-amber-500", bg: "bg-amber-50/50" },
                                    { label: "Safety Rating", value: "Elite", icon: ShieldAlert, color: "text-green-600", bg: "bg-green-50/50" },
                                ].map((stat, i) => (
                                    <Card key={i} className={`p-6 rounded-[2.5rem] border-0 ${stat.bg} shadow-soft ring-1 ring-border/50 relative overflow-hidden group`}>
                                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                                            <stat.icon className="w-12 h-12" />
                                        </div>
                                        <div className="relative z-10">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-2">{stat.label}</p>
                                            <p className={`text-2xl font-black ${stat.color} tracking-tight`}>{stat.value}</p>
                                        </div>
                                    </Card>
                                ))}
                            </div>

                            <div className="grid lg:grid-cols-[1fr_400px] gap-8 animate-in slide-in-from-bottom-6 duration-1000">
                                <div className="space-y-8">
                                    <Card className="p-10 rounded-[3rem] border-0 bg-white shadow-strong ring-1 ring-border/50 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl" />
                                        <h3 className="text-xl font-black mb-8 flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                                                <Upload className="w-5 h-5 text-primary" />
                                            </div>
                                            Deployment Payload (Document)
                                        </h3>

                                        <div
                                            onClick={() => fileInputRef.current?.click()}
                                            className={`group relative cursor-pointer border-2 border-dashed rounded-[2.5rem] p-16 transition-all flex flex-col items-center gap-6 ${file ? 'border-primary/40 bg-primary/5' : 'hover:border-primary/30 hover:bg-secondary/20 border-border/50'}`}
                                        >
                                            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf,.docx,.txt" />

                                            <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center transition-all ${file ? 'bg-primary text-white shadow-strong rotate-6' : 'bg-secondary text-muted-foreground group-hover:bg-primary group-hover:text-white'}`}>
                                                <FileText className="w-10 h-10" />
                                            </div>

                                            <div className="text-center">
                                                <p className="text-2xl font-black mb-2">{file ? file.name : "Inject Assessment Logic"}</p>
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">PDF, DOCX, or TXT (Max 15MB)</p>
                                            </div>

                                            {file && (
                                                <Badge className="bg-success text-white border-0 rounded-full px-6 py-2 text-[10px] font-black uppercase tracking-widest animate-in zoom-in">
                                                    Payload Loaded
                                                </Badge>
                                            )}
                                        </div>
                                    </Card>

                                    <Card className="p-10 rounded-[3rem] border-0 bg-white shadow-strong ring-1 ring-border/50">
                                        <h3 className="text-xl font-black mb-10 flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-2xl bg-blue-600/10 flex items-center justify-center">
                                                <Settings2 className="w-5 h-5 text-blue-600" />
                                            </div>
                                            Architectural Configuration
                                        </h3>

                                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-8">
                                            {[
                                                { label: "MCQ Count", key: "mcq", icon: Type },
                                                { label: "True/False", key: "tf", icon: AlertCircle },
                                                { label: "Multi-Select", key: "multi", icon: Layers },
                                                { label: "Flashcards", key: "flash", icon: Search },
                                                { label: "Matching", key: "match", icon: RefreshCw },
                                                { label: "Total Target", key: "totalQuestions", icon: Sparkles },
                                            ].map((item) => (
                                                <div key={item.key} className="space-y-3">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2">
                                                        <item.icon className="w-3.5 h-3.5" />
                                                        {item.label}
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={config[item.key as keyof typeof config]}
                                                        onChange={(e) => setConfig({ ...config, [item.key]: parseInt(e.target.value) || 0 })}
                                                        className="w-full bg-secondary/30 rounded-2xl h-14 px-6 font-black text-lg focus:ring-4 focus:ring-primary/10 transition-all outline-none border-0 shadow-inner"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </Card>
                                </div>

                                <div className="space-y-6">
                                    <Card className="p-10 rounded-[3.5rem] bg-primary text-white shadow-strong relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-110 transition-transform" />
                                        <div className="relative z-10">
                                            <Badge className="bg-white/20 text-white border-0 rounded-full px-4 py-1.5 text-[10px] font-black uppercase tracking-widest mb-8">
                                                Generation Protocol
                                            </Badge>
                                            <h4 className="text-3xl font-black tracking-tight mb-8">Execute Three-Pass Build</h4>

                                            <div className="space-y-6 mb-12">
                                                {[
                                                    { label: "Language Mode", val: "Auto-Adaptive", color: "text-blue-200" },
                                                    { label: "Generation Style", val: "Sequential Tiered", color: "text-amber-200" },
                                                    { label: "Output Schema", val: "Strict JSON V2", color: "text-green-200" }
                                                ].map((r, i) => (
                                                    <div key={i} className="flex justify-between items-center border-b border-white/10 pb-4">
                                                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">{r.label}</span>
                                                        <span className={`text-[11px] font-black uppercase tracking-widest ${r.color}`}>{r.val}</span>
                                                    </div>
                                                ))}
                                            </div>

                                            <Button
                                                onClick={() => runGenerationPass("easy")}
                                                disabled={!file || isGenerating}
                                                className="w-full bg-primary text-white hover:bg-primary/90 h-16 rounded-[2rem] text-lg font-bold shadow-xl shadow-primary/20 group transition-all"
                                            >
                                                {isGenerating ? (
                                                    <div className="flex items-center gap-3">
                                                        <RefreshCw className="w-5 h-5 animate-spin" />
                                                        Architecting...
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-3">
                                                        Initialize Core Analysis
                                                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                                    </div>
                                                )}
                                            </Button>
                                        </div>
                                    </Card>

                                    <Card className="p-8 rounded-[3rem] border-0 bg-secondary/30 ring-1 ring-border/10">
                                        <h5 className="text-[11px] font-black uppercase tracking-widest mb-6 flex items-center gap-2">
                                            <Layout className="w-4 h-4 text-primary" />
                                            Architecture Principles
                                        </h5>
                                        <div className="space-y-6">
                                            {[
                                                { title: "Bloom's Alignment", desc: "Questions are mapped across 6 cognitive levels." },
                                                { title: "Distractor Logic", desc: "AI generates scientifically plausible wrong answers." },
                                                { title: "Hind-Eng Fusion", desc: "Native support for bilingual document structures." }
                                            ].map((p, i) => (
                                                <div key={i} className="space-y-1">
                                                    <p className="text-[10px] font-black text-foreground">{p.title}</p>
                                                    <p className="text-[9px] text-muted-foreground font-medium">{p.desc}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </Card>

                                    <Card className="p-8 rounded-[3rem] border-0 bg-primary/5 ring-1 ring-primary/10 relative overflow-hidden">
                                        <Sparkles className="absolute -bottom-4 -right-4 w-20 h-20 text-primary/10 rotate-12" />
                                        <h5 className="text-[11px] font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <RefreshCw className="w-4 h-4 text-primary" />
                                            Deployment Logs
                                        </h5>
                                        <div className="space-y-4">
                                            {[
                                                "Awaiting source document...",
                                                "System ready for generation.",
                                                "Gemini Flash node connected."
                                            ].map((log, i) => (
                                                <div key={i} className="flex items-center gap-3 text-[10px] font-black text-muted-foreground/40">
                                                    <div className="w-1 h-1 rounded-full bg-primary/40" />
                                                    {log}
                                                </div>
                                            ))}
                                        </div>
                                    </Card>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-8 animate-in slide-in-from-bottom-6 duration-700">
                            {/* Process Control Center - Unified Design */}
                            <div className="bg-white p-10 rounded-[2.5rem] border-0 ring-1 ring-border/50 shadow-soft relative overflow-hidden">
                                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                                    <div>
                                        <div className="flex items-center gap-4 mb-4">
                                            <Badge className="bg-primary/10 text-primary border-0 rounded-full px-5 py-1.5 text-[9px] font-black uppercase tracking-widest">
                                                Architectural Review
                                            </Badge>
                                            <div className="flex gap-3">
                                                {["easy", "moderate", "hard"].map((s: any) => (
                                                    <div key={s} className="flex items-center gap-1.5">
                                                        <div className={`w-2 h-2 rounded-full transition-all duration-700 ${generatedQuiz[s].length > 0 ? 'bg-success shadow-[0_0_10px_#22c55e]' : 'bg-muted-foreground/20'}`} />
                                                        <span className={`text-[8px] font-black uppercase tracking-[0.1em] ${activeViewStage === s ? 'text-primary' : 'text-muted-foreground/40'}`}>{s}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <h2 className="text-3xl font-black tracking-tight mb-1 text-foreground">Review: {file?.name.split('.')[0]}</h2>
                                        <p className="text-muted-foreground font-medium uppercase tracking-[0.1em] text-[9px]">Status: <span className="text-success">Validated & Ready</span></p>
                                    </div>

                                    <div className="flex flex-wrap gap-3">
                                        {(genStage === "easy" || genStage === "moderate") && (
                                            <div className="flex gap-2">
                                                <Button
                                                    onClick={() => runGenerationPass(genStage === "easy" ? "moderate" : "hard")}
                                                    disabled={isGenerating}
                                                    className="bg-primary text-white hover:bg-primary/90 rounded-2xl px-6 h-12 font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-primary/20"
                                                >
                                                    {isGenerating ? <RefreshCw className="animate-spin w-4 h-4 mr-2" /> : null}
                                                    {genStage === "easy" ? "Stage 2: Moderate Intelligence" : "Stage 3: High Intelligence"}
                                                </Button>
                                            </div>
                                        )}

                                        <Button
                                            onClick={handleDeploy}
                                            disabled={isGenerating}
                                            className="bg-primary text-white hover:bg-primary/90 rounded-2xl px-8 h-12 font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 transition-all"
                                        >
                                            Deploy Active Modules ({generatedQuiz.easy.length + generatedQuiz.moderate.length + generatedQuiz.hard.length})
                                        </Button>

                                        <Button
                                            onClick={() => runGenerationPass(activeViewStage)}
                                            disabled={isGenerating}
                                            variant="outline"
                                            className="border-primary/20 text-primary rounded-2xl h-12 px-6 font-black text-[10px] uppercase tracking-widest hover:bg-primary/5 transition-all flex items-center gap-2"
                                        >
                                            <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                                            Remake {activeViewStage}
                                        </Button>

                                        <Button
                                            onClick={() => {
                                                setGenStage("idle");
                                                setSessionId(null);
                                                setFile(null);
                                                setGeneratedQuiz({ easy: [], moderate: [], hard: [] });
                                            }}
                                            variant="outline"
                                            className="border-primary/20 text-primary rounded-2xl h-12 px-6 font-black text-[10px] uppercase tracking-widest"
                                        >
                                            New Session
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Tier Selection Tabs */}
                            {/* Tier Selection Tabs */}
                            <div className="flex flex-col items-center mb-12">
                                <div className="flex p-1.5 bg-secondary/20 rounded-2xl w-fit ring-1 ring-border/10 mb-6">
                                    {(["easy", "moderate", "hard"] as const).map(s => (
                                        <button
                                            key={s}
                                            onClick={() => setActiveViewStage(s)}
                                            disabled={generatedQuiz[s].length === 0}
                                            className={`group relative px-10 h-14 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex flex-col items-center justify-center gap-0.5 ${activeViewStage === s ? 'bg-white text-primary shadow-medium' : 'text-muted-foreground/30 hover:text-muted-foreground'}`}
                                        >
                                            <div className="flex items-center gap-2">
                                                {s} TIER ({generatedQuiz[s].length})
                                                {activeViewStage === s && (
                                                    <RefreshCw
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            runGenerationPass(s);
                                                        }}
                                                        className={`w-3.5 h-3.5 hover:rotate-180 transition-all duration-500 cursor-pointer ${isGenerating ? 'animate-spin' : ''}`}
                                                    />
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                                <div className="flex justify-center gap-24">
                                    {[
                                        { t: "easy", d: "Recall & Recognition" },
                                        { t: "moderate", d: "Analysis & Application" },
                                        { t: "hard", d: "Evaluation & Synthesis" }
                                    ].map(info => (
                                        <p key={info.t} className={`text-[9px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${activeViewStage === info.t ? 'opacity-40 text-primary translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}`}>
                                            Focus: {info.d}
                                        </p>
                                    ))}
                                </div>
                            </div>

                            {/* Redesigned Review Area (Matching CreateQuiz.tsx screenshot) */}
                            <div className="max-w-5xl mx-auto space-y-8">
                                <div className="flex flex-col sm:flex-row items-center justify-between mb-2 gap-4 px-4">
                                    <h2 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-3">
                                        Analyze & Refine
                                        <Badge variant="outline" className="rounded-full border-primary/20 text-primary bg-primary/5 text-[9px] px-3 py-1 font-black">{activeViewStage.toUpperCase()}</Badge>
                                    </h2>
                                    <div className="flex gap-3">
                                        <Button onClick={() => {
                                            setGeneratedQuiz((prev: any) => {
                                                const next = { ...prev };
                                                next[activeViewStage] = [...next[activeViewStage], {
                                                    id: `new_${Date.now()}`,
                                                    type: "mcq",
                                                    question: "",
                                                    options: ["", "", "", ""],
                                                    answer: "",
                                                    points: 10
                                                }];
                                                return next;
                                            });
                                        }} className="bg-primary text-white rounded-2xl h-12 px-8 shadow-strong font-bold text-[10px] uppercase tracking-widest gap-2 hover:scale-[1.02] transition-all">
                                            <Plus className="h-4 w-4" />
                                            ADD MANUALLY
                                        </Button>
                                    </div>
                                </div>

                                <div className="space-y-10">
                                    {generatedQuiz[activeViewStage].map((q: any, i: number) => (
                                        <Card key={q.id || i} className="p-0 overflow-hidden rounded-[2.5rem] border-0 bg-background shadow-soft ring-1 ring-border/50 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                            <div className="flex items-center justify-between py-4 px-4 md:px-8 bg-secondary/10 border-b border-border/10">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-xs text-primary">
                                                        {i + 1}
                                                    </div>
                                                    <Select
                                                        value={q.type}
                                                        onValueChange={(val: any) => {
                                                            const updates: any = { type: val };
                                                            if ((val === "mcq" || val === "multi_mcq") && (!q.options || q.options.length === 0)) updates.options = ["", "", "", ""];
                                                            if (val === "truefalse") updates.options = ["True", "False"];
                                                            if (val === "match" && (!q.pairs || q.pairs.length === 0)) updates.pairs = [{ left: "", right: "" }];
                                                            updateGeneratedQuestion(activeViewStage, i, "type", val);
                                                            if (updates.options) updateGeneratedQuestion(activeViewStage, i, "options", updates.options);
                                                            if (updates.pairs) updateGeneratedQuestion(activeViewStage, i, "pairs", updates.pairs);
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
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setGeneratedQuiz((prev: any) => {
                                                            const next = { ...prev };
                                                            next[activeViewStage] = next[activeViewStage].filter((_: any, idx: number) => idx !== i);
                                                            return next;
                                                        });
                                                    }}
                                                    className="text-destructive hover:bg-destructive/10 h-10 w-10 p-0 rounded-full transition-all"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>

                                            <div className="p-8 md:p-10 space-y-8">
                                                {/* Question Prompt */}
                                                <div className="space-y-3">
                                                    <Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground opacity-70 ml-1">Question Prompt</Label>
                                                    <Textarea
                                                        value={q.question || q.front || ""}
                                                        onChange={(e) => updateGeneratedQuestion(activeViewStage, i, q.type === "flashcard" ? "front" : "question", e.target.value)}
                                                        placeholder="Educational prompt..."
                                                        className="rounded-2xl border-2 border-border/10 min-h-[100px] p-5 md:p-6 text-base md:text-xl font-bold focus:bg-white bg-white/50 shadow-inner leading-relaxed"
                                                    />
                                                </div>

                                                {/* Mock Image Area (Matches UI) */}
                                                <div className="space-y-3">
                                                    <Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground opacity-70 ml-1">Illustrative Image (Optional)</Label>
                                                    <div className="flex items-start gap-6">
                                                        <div className="w-32 h-32 md:w-40 md:h-40 shrink-0 rounded-[2rem] border-2 border-dashed border-border/20 bg-secondary/5 flex flex-col items-center justify-center cursor-not-allowed opacity-40">
                                                            <Plus className="w-5 h-5 text-primary/40" />
                                                            <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60 mt-2">Add Image</p>
                                                        </div>
                                                        <div className="flex-1 space-y-4 pt-2">
                                                            <p className="text-[10px] font-medium text-muted-foreground leading-relaxed">
                                                                Visual context for AI generations is currently read-only. Edit in Global Registry after deployment if needed.
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Type Specific Fields */}
                                                {(q.type === "mcq" || q.type === "multi_mcq") && q.options && (
                                                    <div className="grid md:grid-cols-2 gap-4">
                                                        {q.options.map((opt: string, optIdx: number) => (
                                                            <div key={optIdx} className="relative group">
                                                                <div className={`absolute left-4 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold transition-all ${q.answer === opt || (Array.isArray(q.answer) && q.answer.includes(opt)) ? 'bg-success text-white' : 'bg-secondary text-primary'}`}>
                                                                    {String.fromCharCode(65 + optIdx)}
                                                                </div>
                                                                <Input
                                                                    value={opt}
                                                                    onChange={(e) => updateGeneratedOption(activeViewStage, i, optIdx, e.target.value)}
                                                                    placeholder={`Option ${optIdx + 1}`}
                                                                    className="pl-14 rounded-xl border-2 border-border/10 h-12 font-bold focus:ring-primary/10 bg-white/50"
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {q.type === "flashcard" && (
                                                    <div className="space-y-3">
                                                        <Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground opacity-70 ml-1">Flashcard Back (Answer)</Label>
                                                        <Textarea
                                                            value={q.back}
                                                            onChange={(e) => updateGeneratedQuestion(activeViewStage, i, "back", e.target.value)}
                                                            className="rounded-2xl border-2 border-border/10 min-h-[140px] p-5 font-bold focus:bg-white bg-white/50 shadow-inner"
                                                        />
                                                    </div>
                                                )}

                                                {q.type === "match" && (
                                                    <div className="space-y-3">
                                                        <Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground opacity-70 ml-1">Matching Pairs</Label>
                                                        <div className="space-y-3">
                                                            {q.pairs?.map((p: any, pIdx: number) => (
                                                                <div key={pIdx} className="flex gap-4 items-center">
                                                                    <Input
                                                                        value={p.left}
                                                                        onChange={(e) => {
                                                                            const newPairs = [...q.pairs];
                                                                            newPairs[pIdx] = { ...newPairs[pIdx], left: e.target.value };
                                                                            updateGeneratedQuestion(activeViewStage, i, "pairs", newPairs);
                                                                        }}
                                                                        className="flex-1 rounded-xl border-2 border-border/10 font-bold bg-white/50 h-12"
                                                                    />
                                                                    <div className="text-muted-foreground opacity-30"><ArrowRight className="h-4 w-4" /></div>
                                                                    <Input
                                                                        value={p.right}
                                                                        onChange={(e) => {
                                                                            const newPairs = [...q.pairs];
                                                                            newPairs[pIdx] = { ...newPairs[pIdx], right: e.target.value };
                                                                            updateGeneratedQuestion(activeViewStage, i, "pairs", newPairs);
                                                                        }}
                                                                        className="flex-1 rounded-xl border-2 border-border/10 font-bold bg-white/50 h-12"
                                                                    />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Bottom Metadata (Answer & Points) */}
                                                <div className="grid md:grid-cols-2 gap-8 pt-6 border-t border-border/10">
                                                    {q.type !== "flashcard" && q.type !== "match" && (
                                                        <div className="space-y-3">
                                                            <Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground opacity-70 ml-1">Correct Answer</Label>
                                                            <div className="relative">
                                                                <Input
                                                                    value={Array.isArray(q.answer) ? q.answer.join(', ') : q.answer}
                                                                    onChange={(e) => {
                                                                        const val = q.type === "multi_mcq" ? e.target.value.split(',').map(s => s.trim()) : e.target.value;
                                                                        updateGeneratedQuestion(activeViewStage, i, "answer", val);
                                                                    }}
                                                                    className="rounded-xl border-2 border-border/10 h-14 font-bold bg-white/50 focus:bg-white text-success pr-10"
                                                                />
                                                                <Check className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-success" />
                                                            </div>
                                                        </div>
                                                    )}
                                                    <div className="space-y-3">
                                                        <Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground opacity-70 ml-1">Points Value</Label>
                                                        <Input
                                                            type="number"
                                                            value={q.points || 10}
                                                            onChange={(e) => updateGeneratedQuestion(activeViewStage, i, "points", parseInt(e.target.value) || 0)}
                                                            className="rounded-xl border-2 border-border/10 h-14 font-bold bg-white/50 text-center"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default AIGenerator;
