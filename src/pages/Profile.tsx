import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { updateProfile, updatePassword, sendEmailVerification } from "firebase/auth";
import { doc, updateDoc, collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import {
    User, Mail, Lock, ShieldCheck, GraduationCap,
    ArrowLeft, KeyRound, CheckCircle2, AlertCircle,
    History, Clock, ShieldAlert, Calendar, Brain
} from "lucide-react";

const Profile = () => {
    const { user, profile } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();

    const [name, setName] = useState(profile?.name || "");
    const [loading, setLoading] = useState(false);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    // Quiz History State
    const [quizHistory, setQuizHistory] = useState<any[]>([]);
    const [historyLoading, setHistoryLoading] = useState(true);

    useEffect(() => {
        const loadHistory = async () => {
            if (!user) return;
            setHistoryLoading(true);
            try {
                const q = query(
                    collection(db, "scores"),
                    where("userId", "==", user.uid)
                );
                const snap = await getDocs(q);
                let data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                // Manual sort if orderBy requires complex index
                data.sort((a: any, b: any) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
                setQuizHistory(data);
            } catch (error) {
                console.error("Error loading history:", error);
            } finally {
                setHistoryLoading(false);
            }
        };
        loadHistory();
    }, [user]);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setLoading(true);

        try {
            await updateDoc(doc(db, "users", user.uid), {
                name: name,
            });
            await updateProfile(user, { displayName: name });
            toast({ title: "Profile Updated", description: "Your details have been synchronized." });
        } catch (error: any) {
            toast({ title: "Update Failed", description: error.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        if (newPassword !== confirmPassword) {
            toast({ title: "Mismatch", description: "Passwords do not match.", variant: "destructive" });
            return;
        }
        if (newPassword.length < 6) {
            toast({ title: "Weak Password", description: "Security requires at least 6 characters.", variant: "destructive" });
            return;
        }

        setLoading(true);
        try {
            await updatePassword(user, newPassword);
            setNewPassword("");
            setConfirmPassword("");
            toast({ title: "Security Updated", description: "Your password has been changed." });
        } catch (error: any) {
            toast({ title: "Security Error", description: "Please re-login to change sensitive data.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const resendVerification = async () => {
        if (!user) return;
        try {
            await sendEmailVerification(user);
            toast({ title: "Verification Sent", description: "Check your inbox for the link." });
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    const initials = profile?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || "?";

    return (
        <div className="min-h-screen bg-background text-foreground pb-20">
            <Navbar />

            <main className="max-w-4xl mx-auto px-6 py-12">
                <div className="flex items-center justify-between mb-10">
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 rounded-full bg-primary/10 border-4 border-primary/20 flex items-center justify-center font-black text-primary text-3xl shadow-strong">
                            {initials}
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">{profile?.name}</h1>
                            <p className="text-muted-foreground flex items-center gap-2 mt-1">
                                {profile?.role === "teacher" ? <ShieldCheck className="w-4 h-4 text-primary" /> : <GraduationCap className="w-4 h-4 text-primary" />}
                                <span className="uppercase text-[10px] font-bold tracking-widest">{profile?.role} Account</span>
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8 mb-12">
                    {/* Information Section */}
                    <Card className="p-8 rounded-[2.5rem] border-0 shadow-soft ring-1 ring-border/50 relative overflow-hidden h-fit">
                        <div className="absolute top-0 left-0 w-2 h-full bg-primary/20" />
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <User className="w-5 h-5 text-primary" /> Identity Settings
                        </h2>

                        <form onSubmit={handleUpdateProfile} className="space-y-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-bold tracking-widest text-primary/80 ml-1">Full Name</Label>
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="rounded-2xl border-2 border-border/10 h-14 font-bold bg-white/50"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground ml-1">Email (Primary)</Label>
                                <div className="h-14 flex items-center justify-between px-4 bg-secondary/20 rounded-2xl font-bold text-muted-foreground border border-dashed border-border/50 overflow-hidden">
                                    <span className="truncate">{user?.email}</span>
                                    {user?.emailVerified ? (
                                        <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 ml-2" />
                                    ) : (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={resendVerification}
                                            className="ml-2 text-primary h-8 hover:bg-primary/10 rounded-lg text-[10px] font-bold uppercase tracking-widest shrink-0"
                                        >
                                            Verify Now
                                        </Button>
                                    )}
                                </div>
                            </div>
                            <Button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground rounded-2xl h-14 font-bold shadow-strong transition-all">
                                Save Details
                            </Button>
                        </form>
                    </Card>

                    {/* Security Section */}
                    <Card className="p-8 rounded-[2.5rem] border-0 shadow-soft ring-1 ring-border/50 relative overflow-hidden h-fit">
                        <div className="absolute top-0 right-0 w-2 h-full bg-destructive/10" />
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <KeyRound className="w-5 h-5 text-primary" /> Security & Access
                        </h2>

                        <form onSubmit={handleChangePassword} className="space-y-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-bold tracking-widest text-primary/80 ml-1">New Password</Label>
                                <Input
                                    type="password"
                                    placeholder="••••••••"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="rounded-2xl border-2 border-border/10 h-14 font-bold bg-white/50"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-bold tracking-widest text-primary/80 ml-1">Confirm New Password</Label>
                                <Input
                                    type="password"
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="rounded-2xl border-2 border-border/10 h-14 font-bold bg-white/50"
                                />
                            </div>

                            <div className="bg-amber-500/5 p-4 rounded-2xl border border-amber-500/10 flex gap-3">
                                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                <p className="text-[10px] font-medium leading-relaxed text-amber-700/80 uppercase tracking-wider">
                                    Updating your password will require you to log back in on all devices for security.
                                </p>
                            </div>

                            <Button type="submit" disabled={loading} variant="outline" className="w-full border-2 border-primary/20 hover:border-primary rounded-2xl h-14 font-bold transition-all">
                                Update Password
                            </Button>
                        </form>
                    </Card>
                </div>

                {/* Quiz History Section */}
                <Card id="history" className="p-8 md:p-12 rounded-[2.5rem] border-0 shadow-strong ring-1 ring-border/50 bg-background relative overflow-hidden scroll-mt-24">
                    <div className="absolute top-0 left-0 w-2 h-full bg-primary" />
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
                        <div>
                            <h2 className="text-2xl font-black tracking-tight flex items-center gap-3">
                                <History className="w-6 h-6 text-primary" /> Quiz History
                            </h2>
                            <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest mt-1">Your performance logs across all modules</p>
                        </div>
                        <div className="bg-primary/5 px-4 py-2 rounded-xl ring-1 ring-primary/10">
                            <p className="text-[10px] font-black uppercase tracking-widest text-primary/60">Total Attempts</p>
                            <p className="text-xl font-black text-primary">{quizHistory.length}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {historyLoading ? (
                            <div className="py-20 flex flex-col items-center justify-center text-muted-foreground/40">
                                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
                                <p className="text-[10px] font-bold uppercase tracking-widest">Loading Records...</p>
                            </div>
                        ) : quizHistory.length === 0 ? (
                            <div className="py-20 text-center bg-secondary/10 rounded-[2rem] border-2 border-dashed border-border/20">
                                <Brain className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
                                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">No Quizzes Attempted Yet</p>
                                <Button
                                    variant="link"
                                    onClick={() => navigate('/quizzes')}
                                    className="text-primary mt-2 font-black text-[10px] uppercase tracking-tighter"
                                >
                                    Browse Library →
                                </Button>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {quizHistory.map((item: any) => (
                                    <div
                                        key={item.id}
                                        className="p-5 rounded-3xl bg-secondary/5 ring-1 ring-border/20 hover:bg-secondary/10 transition-all group flex flex-col md:flex-row md:items-center justify-between gap-6"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${item.isCheated ? "bg-destructive/10" : "bg-primary/10"}`}>
                                                {item.isCheated ? <ShieldAlert className="w-6 h-6 text-destructive" /> : <History className="w-6 h-6 text-primary" />}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg tracking-tight group-hover:text-primary transition-colors">{item.quizTitle}</h3>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" /> {new Date(item.timestamp).toLocaleDateString()}
                                                    </p>
                                                    <span className="w-1 h-1 bg-border/50 rounded-full" />
                                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                                                        <Clock className="w-3 h-3" /> {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between md:justify-end gap-8">
                                            <div className="text-right">
                                                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 mb-0.5">Efficiency</p>
                                                <p className={`text-2xl font-black tracking-tighter ${item.isCheated ? "text-destructive" : "text-primary"}`}>
                                                    {item.isCheated ? "MOD" : `${Math.round(item.percentage)}%`}
                                                </p>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => navigate(`/quiz/${item.quizId}`)}
                                                className="rounded-xl border border-border/20 hover:bg-primary hover:text-white transition-all"
                                            >
                                                <ArrowLeft className="w-4 h-4 rotate-180 text-primary group-hover:text-white" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </Card>

                <div className="mt-12 text-center">
                    <Button variant="ghost" onClick={() => navigate(-1)} className="rounded-full font-bold text-[10px] uppercase tracking-widest text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all px-8 py-3 h-auto">
                        ← Return to Previous Page
                    </Button>
                </div>
            </main>
        </div>
    );
};

export default Profile;
