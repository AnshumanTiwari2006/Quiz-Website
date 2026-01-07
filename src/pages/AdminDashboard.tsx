import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Brain, Plus, List, LogOut, Award } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [quizCount, setQuizCount] = useState(0);

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("adminLoggedIn");
    if (!isLoggedIn) {
      navigate("/admin/login");
    }

    const stored = localStorage.getItem("quizzes");
    if (stored) {
      setQuizCount(JSON.parse(stored).length);
    }
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
    <div className="min-h-screen gradient-bg">
      {/* Header */}
      <header className="p-6 border-b border-border/40 bg-white/50 backdrop-blur">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 gradient-primary rounded-2xl flex items-center justify-center shadow-medium">
              <Brain className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">Welcome back, Rajiv</p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="rounded-full border-2 hover:shadow-medium transition-all"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="p-6 rounded-2xl shadow-soft hover:shadow-medium transition-all border-0 bg-white/80 backdrop-blur">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                  <p className="text-4xl font-bold">{stat.value}</p>
                </div>
                <div className={`w-14 h-14 ${stat.color} rounded-2xl flex items-center justify-center shadow-medium`}>
                  <stat.icon className="w-7 h-7 text-white" />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <Card
            className="p-8 rounded-3xl shadow-soft hover:shadow-strong transition-all border-0 bg-white/80 backdrop-blur cursor-pointer group"
            onClick={() => navigate('/admin/create')}
          >
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center shadow-medium group-hover:scale-110 transition-transform">
                <Plus className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Create New Quiz</h3>
                <p className="text-muted-foreground">
                  Build engaging quizzes with MCQs, one-word answers, and flashcards
                </p>
              </div>
            </div>
          </Card>

          <Card
            className="p-8 rounded-3xl shadow-soft hover:shadow-strong transition-all border-0 bg-white/80 backdrop-blur cursor-pointer group"
            onClick={() => navigate('/admin/quizzes')}
          >
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 gradient-accent rounded-2xl flex items-center justify-center shadow-medium group-hover:scale-110 transition-transform">
                <List className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Manage Quizzes</h3>
                <p className="text-muted-foreground">
                  View, edit, or delete existing quizzes from your collection
                </p>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
