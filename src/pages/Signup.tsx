import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { createUserWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db, googleProvider } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { User, Mail, Lock, ShieldCheck, GraduationCap, Chrome } from "lucide-react";

const Signup = () => {
    const [role, setRole] = useState<"student" | "teacher">("student");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [schoolCode, setSchoolCode] = useState("");
    const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
    const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
    const [studentClass, setStudentClass] = useState("");
    const [schoolName, setSchoolName] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [physicalAddress, setPhysicalAddress] = useState("");
    const [customSubject, setCustomSubject] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();
    const { toast } = useToast();

    const from = location.state?.from?.pathname || null;

    const subjects = ["Mathematics", "Science", "History", "English", "Geography", "Computer Science", "Other"];
    const classes = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th", "11th", "12th"];

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (role === "teacher") {
            if (schoolCode !== "T-ABIC-EDU") {
                toast({ title: "Invalid Code", description: "Only authorized teachers can sign up.", variant: "destructive" });
                setLoading(false);
                return;
            }
            if (phoneNumber.length < 10 || selectedSubjects.length === 0 || selectedClasses.length === 0) {
                toast({ title: "Missing Info", description: "Phone, Subjects, and Classes are mandatory for teachers.", variant: "destructive" });
                setLoading(false);
                return;
            }
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            const finalSubjects = selectedSubjects.includes("Other")
                ? [...selectedSubjects.filter(s => s !== "Other"), customSubject]
                : selectedSubjects;

            const profileData = {
                uid: user.uid,
                email,
                name,
                role,
                school: schoolName,
                phone: phoneNumber,
                address: physicalAddress,
                ...(role === "teacher"
                    ? { subjects: finalSubjects.filter(Boolean), classes: selectedClasses }
                    : { schoolClass: studentClass }),
                createdAt: new Date().toISOString()
            };

            await setDoc(doc(db, "users", user.uid), profileData);

            toast({ title: "Welcome!", description: "Account created successfully" });

            if (from) {
                navigate(from, { replace: true });
            } else {
                navigate(role === "teacher" ? "/admin/dashboard" : "/quizzes");
            }
        } catch (error: any) {
            toast({ title: "Signup Failed", description: error.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleAuth = async () => {
        setLoading(true);
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;

            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (!userDoc.exists()) {
                // Initial profile for Google users
                const profileData = {
                    uid: user.uid,
                    email: user.email,
                    name: user.displayName || "Scholar",
                    role: role,
                    school: schoolName,
                    phone: phoneNumber,
                    address: physicalAddress,
                    createdAt: new Date().toISOString()
                };
                await setDoc(doc(db, "users", user.uid), profileData);

                toast({ title: "Welcome!", description: "Account created. Please complete your profile." });
                navigate("/profile", { state: { highlightMandatory: role === "teacher" } });
                return;
            }

            toast({ title: "Welcome!", description: "Authenticated with Google" });
            if (from) {
                navigate(from, { replace: true });
            } else {
                navigate(role === "teacher" ? "/admin/dashboard" : "/quizzes");
            }
        } catch (error: any) {
            toast({ title: "Google Auth Failed", description: error.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
            <Card className="w-full max-w-2xl p-10 md:p-12 rounded-[2.5rem] border-0 bg-background shadow-strong ring-1 ring-border/50 animate-in fade-in zoom-in duration-500 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-2 h-full bg-primary" />

                <div className="text-center mb-10">
                    <div className="w-16 h-16 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                        <img src="/School-logo.png" alt="School Logo" className="w-full h-full object-contain" />
                    </div>
                    <h1 className="text-3xl font-bold mb-3 tracking-tight text-foreground">Join Scholar Synergy</h1>
                    <p className="text-muted-foreground font-bold uppercase tracking-widest text-[10px] opacity-70">Complete your academic profile</p>
                </div>

                <form onSubmit={handleSignup} className="space-y-8">
                    <div className="flex flex-col items-center gap-6 py-4 border-y border-border/10">
                        <Label className="text-[11px] uppercase font-bold tracking-[0.2em] text-primary/80">Select Account Type</Label>
                        <RadioGroup defaultValue="student" onValueChange={(v) => setRole(v as any)} className="flex gap-12">
                            <div className="flex items-center space-x-3">
                                <RadioGroupItem value="student" id="student" className="w-5 h-5" />
                                <Label htmlFor="student" className="text-lg font-bold flex items-center gap-2 cursor-pointer">
                                    <GraduationCap className="w-5 h-5 text-primary" /> Student
                                </Label>
                            </div>
                            <div className="flex items-center space-x-3">
                                <RadioGroupItem value="teacher" id="teacher" className="w-5 h-5" />
                                <Label htmlFor="teacher" className="text-lg font-bold flex items-center gap-2 cursor-pointer">
                                    <ShieldCheck className="w-5 h-5 text-primary" /> Teacher
                                </Label>
                            </div>
                        </RadioGroup>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-[10px] uppercase font-bold tracking-widest text-primary/80 ml-1">Full Name</Label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-primary/40 w-5 h-5" />
                                    <Input id="name" placeholder="John Doe" required value={name} onChange={(e) => setName(e.target.value)} className="pl-12 rounded-2xl border-2 border-border/10 h-16 text-lg font-bold bg-white/50" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-[10px] uppercase font-bold tracking-widest text-primary/80 ml-1">Email Address</Label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-primary/40 w-5 h-5" />
                                    <Input id="email" type="email" placeholder="email@school.com" required value={email} onChange={(e) => setEmail(e.target.value)} className="pl-12 rounded-2xl border-2 border-border/10 h-16 text-lg font-bold bg-white/50" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-[10px] uppercase font-bold tracking-widest text-primary/80 ml-1">Secure Password</Label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-primary/40 w-5 h-5" />
                                    <Input id="password" type="password" placeholder="••••••••" required value={password} onChange={(e) => setPassword(e.target.value)} className="pl-12 rounded-2xl border-2 border-border/10 h-16 text-lg font-bold bg-white/50" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="school" className="text-[10px] uppercase font-bold tracking-widest text-primary/80 ml-1">Academic Institution</Label>
                                <Input id="school" placeholder="Enter School Name" value={schoolName} onChange={(e) => setSchoolName(e.target.value)} className="rounded-2xl border-2 border-border/10 h-16 text-lg font-bold bg-white/50" />
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="phone" className="text-[10px] uppercase font-bold tracking-widest text-primary/80 ml-1">Phone</Label>
                                    <Input id="phone" placeholder="+91..." value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="rounded-2xl border-2 border-border/10 h-16 text-lg font-bold bg-white/50" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="address" className="text-[10px] uppercase font-bold tracking-widest text-primary/80 ml-1">Location</Label>
                                    <Input id="address" placeholder="City" value={physicalAddress} onChange={(e) => setPhysicalAddress(e.target.value)} className="rounded-2xl border-2 border-border/10 h-16 text-lg font-bold bg-white/50" />
                                </div>
                            </div>
                            {role === "teacher" ? (
                                <>
                                    <div className="space-y-2">
                                        <Label htmlFor="code" className="text-[10px] uppercase font-bold tracking-widest text-primary/80 ml-1">Verification Code</Label>
                                        <Input id="code" placeholder="Enter Teacher Code" required value={schoolCode} onChange={(e) => setSchoolCode(e.target.value)} className="rounded-2xl border-2 border-border/10 h-16 text-lg font-bold bg-white/50" />
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-[10px] uppercase font-bold tracking-widest text-primary/80 ml-1">Specialization & Grades (Mandatory)</Label>
                                        <div className="p-4 bg-secondary/10 rounded-2xl border border-border/10 space-y-4">
                                            <div className="grid grid-cols-2 gap-2">
                                                <p className="col-span-2 text-[9px] font-bold uppercase text-muted-foreground mb-1">Select Subjects</p>
                                                {subjects.map(s => (
                                                    <div key={s} className="flex items-center space-x-2">
                                                        <Checkbox id={`sub-${s}`} onCheckedChange={(checked) => setSelectedSubjects(prev => checked ? [...prev, s] : prev.filter(p => p !== s))} />
                                                        <Label htmlFor={`sub-${s}`} className="text-[10px] font-bold">{s}</Label>
                                                    </div>
                                                ))}
                                            </div>

                                            {selectedSubjects.includes("Other") && (
                                                <div className="pt-2 animate-in slide-in-from-top-2">
                                                    <Input
                                                        placeholder="Specify your subject"
                                                        value={customSubject}
                                                        onChange={(e) => setCustomSubject(e.target.value)}
                                                        className="h-10 rounded-xl border-2 border-primary/20 text-xs font-bold"
                                                    />
                                                </div>
                                            )}

                                            <div className="grid grid-cols-3 gap-2 border-t border-border/10 pt-4">
                                                <p className="col-span-3 text-[9px] font-bold uppercase text-muted-foreground mb-1">Select Classes</p>
                                                {classes.map(c => (
                                                    <div key={c} className="flex items-center space-x-2">
                                                        <Checkbox id={`cls-${c}`} onCheckedChange={(checked) => setSelectedClasses(prev => checked ? [...prev, c] : prev.filter(p => p !== c))} />
                                                        <Label htmlFor={`cls-${c}`} className="text-[10px] font-bold">{c}</Label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="space-y-2">
                                    <Label htmlFor="studentClass" className="text-[10px] uppercase font-bold tracking-widest text-primary/80 ml-1">Current Class</Label>
                                    <select
                                        id="studentClass"
                                        className="w-full h-16 px-4 bg-white/50 border-2 border-border/10 rounded-2xl text-lg font-bold focus:ring-primary/20 transition-all outline-none"
                                        value={studentClass}
                                        onChange={(e) => setStudentClass(e.target.value)}
                                        required
                                    >
                                        <option value="">Select Grade</option>
                                        {classes.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col gap-4 pt-6">
                        <Button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground rounded-2xl h-16 shadow-strong hover:bg-secondary hover:text-primary hover:scale-[1.02] transition-all text-lg font-bold border-0">
                            {loading ? "Creating Profile..." : "Create Account"}
                        </Button>

                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-border/10"></span>
                            </div>
                            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest">
                                <span className="bg-background px-4 text-muted-foreground/60">Authentication Bridge</span>
                            </div>
                        </div>

                        <Button type="button" onClick={handleGoogleAuth} disabled={loading} variant="outline" className="w-full h-16 rounded-2xl border-2 border-border/10 font-bold hover:bg-secondary/20 transition-all flex items-center justify-center gap-3">
                            <Chrome className="w-5 h-5 text-[#4285F4]" />
                            Continue with Gmail
                        </Button>
                    </div>
                </form>

                <div className="mt-8 text-center flex flex-col gap-3">
                    <p className="text-sm text-muted-foreground font-medium">
                        Already dynamic? <Button variant="link" className="p-0 h-auto font-bold text-primary" onClick={() => navigate('/admin/login')}>Sign In</Button>
                    </p>
                    <Button variant="ghost" onClick={() => navigate('/')} className="rounded-full font-bold text-[10px] uppercase tracking-widest text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all px-6 py-2 mx-auto">
                        ← Back to Mission Control
                    </Button>
                </div>
            </Card>
        </div>
    );
};

export default Signup;
