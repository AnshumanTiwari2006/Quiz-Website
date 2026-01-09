import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { Brain, Lock, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AdminLogin = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    if (username === "Rajiv Kumar Tiwari" && password === "abic@123") {
      localStorage.setItem("adminLoggedIn", "true");
      toast({
        title: "Welcome back!",
        description: "Successfully logged in as Admin",
      });
      navigate("/admin/dashboard");
    } else {
      toast({
        title: "Login Failed",
        description: "Invalid username or password",
        variant: "destructive",
      });
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
          <h1 className="text-3xl font-bold mb-3 tracking-tight text-foreground">System Access</h1>
          <p className="text-muted-foreground font-bold uppercase tracking-widest text-[10px] opacity-70">Administrative Terminal</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-[10px] uppercase font-bold tracking-widest text-primary/80 ml-1">Identity</Label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-primary/40 w-5 h-5" />
              <Input
                id="username"
                type="text"
                placeholder="Full Name"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="pl-12 rounded-2xl border-2 border-border/10 h-16 text-lg font-bold focus:ring-primary/20 transition-all placeholder:text-muted-foreground/30 shadow-inner bg-white/50"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-[10px] uppercase font-bold tracking-widest text-primary/80 ml-1">Key Token</Label>
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

          <Button
            type="submit"
            className="w-full bg-primary text-primary-foreground rounded-2xl h-16 shadow-strong hover:scale-[1.02] transition-all text-lg font-bold border-0"
          >
            Authorize Access
          </Button>
        </form>

        <div className="mt-8 text-center">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="rounded-full font-bold text-xs uppercase tracking-widest text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all px-6 py-2"
          >
            ← Back to Landing
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default AdminLogin;
