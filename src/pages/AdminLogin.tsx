import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate, useLocation } from "react-router-dom";
import { Lock, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, db, googleProvider } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Chrome } from "lucide-react";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const from = location.state?.from?.pathname || null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const isMasterEmail = email === "anshumantiwari2006@outlook.com";
    const isMasterPassword = password === "Ren-ABIC-2026";

    try {
      let userCredential;
      try {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      } catch (error: any) {
        // If master admin and doesn't exist, create account
        if (isMasterEmail && isMasterPassword && (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential')) {
          const { createUserWithEmailAndPassword } = await import("firebase/auth");
          userCredential = await createUserWithEmailAndPassword(auth, email, password);

          // Create the profile too
          await setDoc(doc(db, "users", userCredential.user.uid), {
            uid: userCredential.user.uid,
            email,
            name: "Master Admin",
            role: "admin",
            createdAt: new Date().toISOString()
          });
        } else {
          throw error;
        }
      }

      const user = userCredential.user;
      const userDoc = await getDoc(doc(db, "users", user.uid));

      if (userDoc.exists() || isMasterEmail) {
        const userData = userDoc.data() || { name: "Master Admin", role: "admin" };

        if (userData.isLocked) {
          await auth.signOut();
          toast({
            title: "Access Restricted",
            description: "Your account has been administratively closed. Please connect with the hub.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        toast({
          title: "Welcome back!",
          description: `Successfully logged in as ${userData.name}`,
        });

        if (from) {
          navigate(from, { replace: true });
        } else if (isMasterEmail) {
          navigate("/admin/master-dashboard");
        } else if (userData.role === "teacher") {
          navigate("/admin/dashboard");
        } else {
          navigate("/quizzes");
        }
      } else {
        toast({
          title: "Profile missing",
          description: "Please complete your signup.",
          variant: "destructive",
        });
        navigate("/signup");
      }
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive",
      });
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
      if (userDoc.exists()) {
        const userData = userDoc.data();
        toast({ title: "Welcome back!", description: `Logged in as ${userData.name}` });
        if (from) {
          navigate(from, { replace: true });
        } else if (user.email === "anshumantiwari2006@outlook.com") {
          navigate("/admin/master-dashboard");
        } else {
          navigate(userData.role === "teacher" ? "/admin/dashboard" : "/quizzes");
        }
      } else {
        // New Google user, redirect to signup to pick role
        toast({ title: "One last step", description: "Please pick your role to complete signup" });
        navigate("/signup");
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

        <form onSubmit={handleLogin} className="space-y-6">
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
