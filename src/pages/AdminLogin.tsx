import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate, useLocation } from "react-router-dom";
import { Lock, Mail, ShieldCheck, GraduationCap, Chrome } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, db, googleProvider } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const AdminLogin = () => {
  const [role, setRole] = useState<"student" | "teacher">("student");
  const [teacherCode, setTeacherCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const from = location.state?.from?.pathname || null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (role === "teacher" && teacherCode !== "T-ABIC-EDU") {
      toast({ title: "Authorized Personnel Only", description: "Invalid teacher verification code.", variant: "destructive" });
      return;
    }

    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const userDoc = await getDoc(doc(db, "users", user.uid));

      if (userDoc.exists()) {
        const userData = userDoc.data();

        if (userData.isLocked) {
          await auth.signOut();
          toast({ title: "Access Restricted", description: "Account closed.", variant: "destructive" });
          setLoading(false);
          return;
        }

        toast({ title: "Welcome back!", description: `Logged in as ${userData.name}` });

        if (from) {
          navigate(from, { replace: true });
        } else if (userData.role === "admin") {
          navigate("/admin/master-dashboard");
        } else if (userData.role === "teacher" || userData.role === "moderator" || userData.role === "viewer") {
          navigate("/admin/dashboard");
        } else {
          navigate("/quizzes");
        }
      } else {
        toast({ title: "Profile missing", description: "Please complete your signup.", variant: "destructive" });
        navigate("/signup");
      }
    } catch (error: any) {
      toast({ title: "Login Failed", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    if (role === "teacher" && teacherCode !== "T-ABIC-EDU") {
      toast({ title: "Invalid Code", description: "Teacher verification code is incorrect.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        toast({ title: "Welcome back!", description: `Logged in as ${userData.name}` });
        if (from) {
          navigate(from, { replace: true });
        } else if (userData.role === "admin") {
          navigate("/admin/master-dashboard");
        } else {
          navigate((userData.role === "teacher" || userData.role === "moderator" || userData.role === "viewer") ? "/admin/dashboard" : "/quizzes");
        }
      } else {
        const profileData = {
          uid: user.uid,
          email: user.email,
          name: user.displayName || "Scholar",
          role: role,
          createdAt: new Date().toISOString()
        };
        await setDoc(doc(db, "users", user.uid), profileData);

        toast({ title: "Welcome!", description: "Account created successfully" });
        if (role === "teacher") {
          navigate("/profile", { state: { highlightMandatory: true } });
        } else {
          navigate("/quizzes");
        }
      }
    } catch (error: any) {
      toast({ title: "Google Login Failed", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-lg p-10 md:p-12 rounded-[2.5rem] border-0 bg-background shadow-soft ring-1 ring-border/50 animate-in fade-in zoom-in duration-500 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-full bg-primary" />

        <div className="text-center mb-10">
          <div className="w-16 h-16 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
            <img src="/School-logo.png" alt="School Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl font-bold mb-3 tracking-tight text-foreground">Scholar Synergy</h1>
          <p className="text-muted-foreground font-bold uppercase tracking-widest text-[10px] opacity-70">Secure Authorization Portal</p>
        </div>

        <div className="flex flex-col items-center gap-6 py-4 border-y border-border/10 mb-8">
          <RadioGroup defaultValue="student" onValueChange={(v) => setRole(v as any)} className="flex gap-12">
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="student" id="student" className="w-5 h-5" />
              <Label htmlFor="student" className="text-lg font-bold flex items-center gap-2 cursor-pointer border-0 shadow-none">
                <GraduationCap className="w-5 h-5 text-primary" /> Student
              </Label>
            </div>
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="teacher" id="teacher" className="w-5 h-5" />
              <Label htmlFor="teacher" className="text-lg font-bold flex items-center gap-2 cursor-pointer border-0 shadow-none">
                <ShieldCheck className="w-5 h-5 text-primary" /> Teacher
              </Label>
            </div>
          </RadioGroup>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {role === "teacher" && (
            <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
              <Label htmlFor="teacherCode" className="text-[10px] uppercase font-bold tracking-widest text-primary/80 ml-1">Teacher Verification Code</Label>
              <Input
                id="teacherCode"
                placeholder="Enter Code"
                value={teacherCode}
                onChange={(e) => setTeacherCode(e.target.value)}
                className="rounded-2xl border-2 border-border/10 h-16 text-lg font-bold focus:ring-primary/20 transition-all placeholder:text-muted-foreground/30 shadow-inner bg-white/50"
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-[10px] uppercase font-bold tracking-widest text-primary/80 ml-1">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-primary/40 w-5 h-5" />
              <Input
                id="email"
                type="email"
                placeholder="email@school.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-12 rounded-2xl border-2 border-border/10 h-16 text-lg font-bold focus:ring-primary/20 transition-all placeholder:text-muted-foreground/30 shadow-inner bg-white/50"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-[10px] uppercase font-bold tracking-widest text-primary/80 ml-1">Password</Label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-primary/40 w-5 h-5" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-12 rounded-2xl border-2 border-border/10 h-16 text-lg font-bold focus:ring-primary/20 transition-all placeholder:text-muted-foreground/30 shadow-inner bg-white/50"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground rounded-2xl h-16 shadow-strong hover:bg-secondary hover:text-primary hover:scale-[1.02] transition-all text-lg font-bold border-0"
            >
              {loading ? "Authorizing..." : "Sign In"}
            </Button>

            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border/10"></span></div>
              <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest"><span className="bg-background px-4 text-muted-foreground">Verification Gateway</span></div>
            </div>

            <Button
              type="button"
              onClick={handleGoogleAuth}
              disabled={loading}
              variant="outline"
              className="w-full h-16 rounded-2xl border-2 border-border/10 font-bold hover:bg-secondary/20 transition-all flex items-center justify-center gap-3 bg-transparent text-foreground"
            >
              <Chrome className="w-5 h-5 text-[#4285F4]" />
              Continue with Gmail
            </Button>
          </div>
        </form>

        <div className="mt-8 flex flex-col gap-4 text-center">
          <p className="text-sm text-muted-foreground font-medium">
            New to the synergy?{" "}
            <Button variant="link" className="p-0 h-auto font-bold text-primary" onClick={() => navigate('/signup')}>
              Sign up today
            </Button>
          </p>
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="rounded-full font-bold text-[10px] uppercase tracking-widest text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all px-6 py-2 mx-auto"
          >
            ← Back to Mission Home
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default AdminLogin;
