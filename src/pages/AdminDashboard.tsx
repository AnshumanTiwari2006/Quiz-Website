import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Brain, Plus, List, LogOut, Award } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { fetchQuizzes } from "@/lib/quizLoader";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [quizCount, setQuizCount] = useState(0);

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("adminLoggedIn");
    if (!isLoggedIn) {
      navigate("/admin/login");
    }

    const loadCount = async () => {
      const staticQuizzes = await fetchQuizzes();
      const stored = localStorage.getItem("quizzes");
      const localQuizzes = stored ? JSON.parse(stored) : [];

      // Combine and deduplicate
      const combined = [...staticQuizzes];
      localQuizzes.forEach((lq: any) => {
        if (!combined.find(sq => sq.id === lq.id)) {
          combined.push(lq);
        }
      });

      setQuizCount(combined.length);
    };

    loadCount();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("adminLoggedIn");
    toast({
      title: "Logged out",
      description: "Successfully signed out",
    });
    navigate("/");
  };

  const stats = [
    { label: "Total Quizzes", value: quizCount.toString(), icon: List, color: "gradient-primary" },
    { label: "Active Students", value: "0", icon: Award, color: "gradient-accent" },
    { label: "Completed Today", value: "0", icon: Brain, color: "gradient-success" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header - Matching Landing Page Header */}
      <header className="py-4 px-6 border-b border-border/50 bg-white/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-soft">
              <Brain className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">Admin Dashboard</h1>
              <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground opacity-70">Administrator Access</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={() => navigate('/contact')}
              className="rounded-full font-bold text-xs uppercase tracking-widest text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all px-6"
            >
              Contact Us
            </Button>
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="rounded-full font-bold text-xs uppercase tracking-widest text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all px-6"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* Stats Grid - Floral White (bg-background) */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {stats.map((stat, index) => (
            <Card key={index} className="p-6 rounded-3xl border-0 bg-background shadow-soft hover:shadow-medium hover:ring-primary/20 transition-all group ring-1 ring-border/50 relative overflow-hidden">
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-2">{stat.label}</p>
                  <p className="text-4xl font-bold text-foreground tracking-tight">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 bg-secondary rounded-xl flex items-center justify-center group-hover:bg-primary transition-colors duration-300`}>
                  <stat.icon className="w-6 h-6 text-primary group-hover:text-primary-foreground transition-colors" />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-2">Management Operations</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <Card
              className="p-8 rounded-[2.5rem] border-0 bg-background shadow-soft hover:shadow-medium hover:ring-primary/10 transition-all cursor-pointer ring-1 ring-border/50 group"
              onClick={() => navigate('/admin/create')}
            >
              <div className="flex items-start gap-6">
                <div className="w-14 h-14 bg-secondary rounded-xl flex items-center justify-center group-hover:bg-primary transition-colors duration-300">
                  <Plus className="w-7 h-7 text-primary group-hover:text-primary-foreground transition-colors duration-300" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2 tracking-tight group-hover:text-primary transition-colors text-foreground">Create New Quiz</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed font-medium group-hover:text-foreground/80 transition-colors">
                    Initialize a new assessment module with custom questions and logic.
                  </p>
                </div>
              </div>
            </Card>

            <Card
              className="p-8 rounded-[2.5rem] border-0 bg-background shadow-soft hover:shadow-medium hover:ring-primary/10 transition-all cursor-pointer ring-1 ring-border/50 group"
              onClick={() => navigate('/admin/quizzes')}
            >
              <div className="flex items-start gap-6">
                <div className="w-14 h-14 bg-secondary rounded-xl flex items-center justify-center group-hover:bg-primary transition-colors duration-300">
                  <List className="w-7 h-7 text-primary group-hover:text-primary-foreground transition-colors duration-300" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2 tracking-tight group-hover:text-primary transition-colors text-foreground">Manage Quizzes</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed font-medium group-hover:text-foreground/80 transition-colors">
                    Review, Edit, or Delete existing quiz modules from the system registry.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
