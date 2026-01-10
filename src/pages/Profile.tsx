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
import { useLocation } from "react-router-dom";
import {
    User, Mail, Lock, ShieldCheck, GraduationCap,
    ArrowLeft, KeyRound, CheckCircle2, AlertCircle,
    History, Clock, ShieldAlert, Calendar, Brain, Camera, Upload,
    Building2, Phone, MapPin, X, PlusCircle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const Profile = () => {
    const { user, profile } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();
    const location = useLocation();

    const isHighlightMandatory = location.state?.highlightMandatory;

    const [name, setName] = useState(profile?.name || "");
    const [loading, setLoading] = useState(false);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [photoURL, setPhotoURL] = useState(profile?.photoURL || "");

    // Extended Profile Info
    const [school, setSchool] = useState(profile?.school || "");
    const [phone, setPhone] = useState(profile?.phone || "");
    const [address, setAddress] = useState(profile?.address || "");
    const [selectedSubjects, setSelectedSubjects] = useState<string[]>(profile?.subjects || []);
    const [selectedClasses, setSelectedClasses] = useState<string[]>(profile?.classes || []);
    const [customSubject, setCustomSubject] = useState("");
    const [showOtherInput, setShowOtherInput] = useState(false);

    const subjectsList = ["Mathematics", "Science", "History", "English", "Geography", "Computer Science", "Physics", "Chemistry", "Biology", "Economics", "Hindi", "Business Studies", "Accountancy", "Other"];
    const classesList = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th", "11th", "12th"];

    const [quizHistory, setQuizHistory] = useState<any[]>([]);
    const [historyLoading, setHistoryLoading] = useState(true);

    // Sync state when profile loads
    useEffect(() => {
        if (profile) {
            setName(profile.name || "");
            setPhotoURL(profile.photoURL || "");
            setSchool(profile.school || "");
            setPhone(profile.phone || "");
            setAddress(profile.address || "");
            setAddress(profile.address || "");
            setSelectedSubjects(profile.subjects || []);
            setSelectedClasses(profile.classes || []);

            // Detect if "Other" was used
            const hasOther = profile.subjects?.some(s => !subjectsList.filter(item => item !== "Other").includes(s));
            if (hasOther) {
                setShowOtherInput(true);
                const custom = profile.subjects?.find(s => !subjectsList.filter(item => item !== "Other").includes(s));
                if (custom) setCustomSubject(custom);
                if (!profile.subjects?.includes("Other")) {
                    setSelectedSubjects(prev => [...prev, "Other"]);
                }
            }
        }
    }, [profile]);

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

        if (profile?.role === "teacher") {
            if (!phone || selectedSubjects.length === 0 || selectedClasses.length === 0) {
                toast({ title: "Mandatory Fields", description: "Phone, Subjects, and Classes are required for teachers.", variant: "destructive" });
                return;
            }
        }

        setLoading(true);

        const finalSubjects = showOtherInput && customSubject
            ? [...selectedSubjects.filter(s => s !== "Other"), customSubject]
            : selectedSubjects.filter(s => s !== "Other");

        try {
            await updateDoc(doc(db, "users", user.uid), {
                name: name,
                photoURL: photoURL,
                school: school,
                phone: phone,
                address: address,
                subjects: finalSubjects.length > 0 ? finalSubjects : selectedSubjects,
                classes: selectedClasses
            });
            await updateProfile(user, { displayName: name });
            toast({ title: "Profile Synchronized", description: "All cloud records have been updated." });
        } catch (error: any) {
            toast({ title: "Update Failed", description: error.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const toggleItem = (item: string, list: string[], setList: (l: string[]) => void) => {
        if (list.includes(item)) {
            setList(list.filter(i => i !== item));
        } else {
            setList([...list, item]);
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Check original size (5MB limit)
            if (file.size > 5 * 1024 * 1024) {
                toast({ title: "File too large", description: "Maximum 5MB allowed for profile photos.", variant: "destructive" });
                return;
            }

            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    // Create a canvas for compression
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    // Constrain dimensions for web-ready profile pics
                    const max_size = 400;
                    if (width > height) {
                        if (width > max_size) {
                            height *= max_size / width;
                            width = max_size;
                        }
                    } else {
                        if (height > max_size) {
                            width *= max_size / height;
                            height = max_size;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);

                    // Compress to JPEG with 0.7 quality
                    // This keeps 5MB source files under ~100KB in the DB
                    const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
                    setPhotoURL(compressedBase64);
                    toast({ title: "Image Ready", description: "Photo optimized for cloud storage." });
                };
                img.src = event.target?.result as string;
            };
            reader.readAsDataURL(file);
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
                        <div className="relative group">
                            <div className="w-20 h-20 rounded-full bg-primary/10 border-4 border-primary/20 flex items-center justify-center font-black text-primary text-3xl shadow-strong overflow-hidden group-hover:border-primary transition-all">
                                {photoURL ? (
                                    <img src={photoURL} alt="Profile" className="w-full h-full object-cover" />
                                ) : initials}
                            </div>
                            <label className="absolute bottom-0 right-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:scale-110 transition-transform">
                                <Camera className="w-4 h-4" />
                                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                            </label>
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">{profile?.name}</h1>
                            <p className="text-muted-foreground flex items-center gap-2 mt-1">
                                {profile?.role === "teacher" ? <ShieldCheck className="w-4 h-4 text-primary" /> : <GraduationCap className="w-4 h-4 text-primary" />}
                                <span className="uppercase text-[10px] font-bold tracking-widest">{profile?.role} Account</span>
                            </p>
                            {profile?.subjects && profile.subjects.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                    {profile.subjects.map(s => <Badge key={s} variant="secondary" className="text-[8px] h-4 px-1.5 opacity-70">{s}</Badge>)}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8 mb-12">
                    {/* Information Section */}
                    <Card className="p-8 rounded-[2.5rem] border-0 shadow-soft ring-1 ring-border/50 relative overflow-hidden h-fit">
                        <div className="absolute top-0 left-0 w-2 h-full bg-primary/20" />
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <User className="w-5 h-5 text-primary" /> Identity Settings
                            {isHighlightMandatory && <Badge className="ml-2 bg-amber-500 text-white animate-pulse">Action Required</Badge>}
                        </h2>

                        <form onSubmit={handleUpdateProfile} className="space-y-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-bold tracking-widest text-primary/80 ml-1">Full Legal Name</Label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/40" />
                                    <Input
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="rounded-2xl border-2 border-border/10 h-14 pl-12 font-bold bg-white/50"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-bold tracking-widest text-primary/80 ml-1">School / Organization</Label>
                                <div className="relative">
                                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/40" />
                                    <Input
                                        value={school}
                                        onChange={(e) => setSchool(e.target.value)}
                                        placeholder="Enter Affiliated School"
                                        className="rounded-2xl border-2 border-border/10 h-14 pl-12 font-bold bg-white/50"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className={`text-[10px] uppercase font-bold tracking-widest ml-1 ${isHighlightMandatory ? "text-amber-500 animate-pulse" : "text-primary/80"}`}>Phone Number (Mandatory)</Label>
                                    <div className="relative">
                                        <Phone className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${isHighlightMandatory ? "text-amber-400" : "text-primary/40"}`} />
                                        <Input
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            placeholder="+91..."
                                            className={`rounded-2xl border-2 h-14 pl-12 font-bold bg-white/50 ${isHighlightMandatory ? "border-amber-200 ring-2 ring-amber-50" : "border-border/10"}`}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase font-bold tracking-widest text-primary/80 ml-1">Address / Location</Label>
                                    <div className="relative">
                                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/40" />
                                        <Input
                                            value={address}
                                            onChange={(e) => setAddress(e.target.value)}
                                            placeholder="City, Country"
                                            className="rounded-2xl border-2 border-border/10 h-14 pl-12 font-bold bg-white/50"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-border/10">
                                {["teacher", "admin", "moderator", "viewer"].includes(profile?.role || "") && (
                                    <>
                                        <div className="space-y-4 mb-6">
                                            <Label className={`text-[11px] uppercase font-black tracking-[0.15em] flex items-center gap-2 ${isHighlightMandatory ? "text-amber-600 animate-pulse" : "text-primary/70"}`}>
                                                <GraduationCap className="w-4 h-4" /> Academic Portfolio
                                            </Label>

                                            <div className="space-y-3">
                                                <p className="text-[9px] font-bold uppercase text-muted-foreground ml-1">Assigned Grade Levels</p>
                                                <div className={`flex flex-wrap gap-2 p-4 bg-primary/5 rounded-2xl border min-h-[60px] transition-all ${isHighlightMandatory ? "border-amber-300 bg-amber-50/30" : "border-primary/10"}`}>
                                                    {classesList.map(c => (
                                                        <Badge
                                                            key={c}
                                                            variant={selectedClasses.includes(c) ? "default" : "outline"}
                                                            className={`cursor-pointer h-8 text-[10px] font-bold transition-all shadow-none ${selectedClasses.includes(c) ? "bg-primary border-primary" : "hover:border-primary/40 bg-white"}`}
                                                            onClick={() => toggleItem(c, selectedClasses, setSelectedClasses)}
                                                        >
                                                            {c} {selectedClasses.includes(c) && <X className="ml-1 w-2.5 h-2.5" />}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <p className="text-[9px] font-bold uppercase text-muted-foreground ml-1">Subject Expertise</p>
                                                <div className={`flex flex-wrap gap-2 p-4 bg-primary/5 rounded-2xl border min-h-[60px] transition-all ${isHighlightMandatory ? "border-amber-300 bg-amber-50/30" : "border-primary/10"}`}>
                                                    {subjectsList.map(s => (
                                                        <Badge
                                                            key={s}
                                                            variant={selectedSubjects.includes(s) ? "default" : "outline"}
                                                            className={`cursor-pointer h-8 text-[10px] font-bold transition-all shadow-none ${selectedSubjects.includes(s) ? "bg-primary border-primary" : "hover:border-primary/40 bg-white"}`}
                                                            onClick={() => {
                                                                toggleItem(s, selectedSubjects, setSelectedSubjects);
                                                                if (s === "Other") setShowOtherInput(!showOtherInput);
                                                            }}
                                                        >
                                                            {s} {selectedSubjects.includes(s) && <X className="ml-1 w-2.5 h-2.5" />}
                                                        </Badge>
                                                    ))}
                                                </div>
                                                {showOtherInput && (
                                                    <div className="mt-2 animate-in slide-in-from-top-2">
                                                        <Input
                                                            placeholder="Specify Specialized Subject"
                                                            value={customSubject}
                                                            onChange={(e) => setCustomSubject(e.target.value)}
                                                            className="rounded-xl border-2 border-primary/20 h-12 text-sm font-bold bg-white"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground ml-1">Email Registry</Label>
                                <div className="h-14 flex items-center justify-between px-4 bg-secondary/20 rounded-2xl font-bold text-muted-foreground border border-dashed border-border/50 overflow-hidden">
                                    <span className="truncate text-xs">{user?.email}</span>
                                    {user?.emailVerified ? (
                                        <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 ml-2" />
                                    ) : (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={resendVerification}
                                            className="ml-2 text-primary h-8 hover:bg-primary/10 rounded-lg text-[10px] font-bold uppercase tracking-widest shrink-0"
                                        >
                                            Verify
                                        </Button>
                                    )}
                                </div>
                            </div>
                            <Button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground rounded-2xl h-16 font-extrabold shadow-strong hover:scale-[1.02] active:scale-[0.98] transition-all">
                                Update Expert Profile
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
