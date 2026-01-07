import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { GraduationCap, Users, Brain, Zap } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen gradient-bg">
      {/* Header */}
      <header className="p-6">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-12 h-12 gradient-primary rounded-2xl flex items-center justify-center shadow-medium">
              <Brain className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              ABIC Quizzz
            </h1>
          </div>
          <Button 
            variant="outline" 
            onClick={() => navigate('/admin/login')}
            className="rounded-full border-2 hover:shadow-medium transition-all"
          >
            Admin Login
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-6 py-12">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Learn. Play. <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Excel.</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Experience the most engaging way to test knowledge and master concepts through interactive quizzes
          </p>
          <Button 
            size="lg" 
            onClick={() => navigate('/quizzes')}
            className="gradient-primary text-white rounded-full px-8 py-6 text-lg shadow-strong hover:scale-105 transition-all"
          >
            <Zap className="mr-2 h-5 w-5" />
            Start Quiz Now
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="p-8 rounded-3xl shadow-soft hover:shadow-strong transition-all hover:scale-105 border-0 bg-white/80 backdrop-blur">
            <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center mb-4">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-3">Multiple Formats</h3>
            <p className="text-muted-foreground">
              MCQs, one-word answers, and interactive flashcards - learn the way you want
            </p>
          </Card>

          <Card className="p-8 rounded-3xl shadow-soft hover:shadow-strong transition-all hover:scale-105 border-0 bg-white/80 backdrop-blur">
            <div className="w-16 h-16 gradient-accent rounded-2xl flex items-center justify-center mb-4">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-3">Timed Challenges</h3>
            <p className="text-muted-foreground">
              Beat the clock and compete for the best scores with dynamic timers
            </p>
          </Card>

          <Card className="p-8 rounded-3xl shadow-soft hover:shadow-strong transition-all hover:scale-105 border-0 bg-white/80 backdrop-blur">
            <div className="w-16 h-16 gradient-success rounded-2xl flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-3">Instant Results</h3>
            <p className="text-muted-foreground">
              Get immediate feedback and track your progress with detailed score reports
            </p>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="p-12 rounded-3xl shadow-strong border-0 gradient-primary text-white">
            <h3 className="text-3xl font-bold mb-4">Ready to Test Your Knowledge?</h3>
            <p className="text-lg mb-6 opacity-90">
              Join thousands of learners making education fun and engaging
            </p>
            <Button 
              size="lg"
              onClick={() => navigate('/quizzes')}
              className="bg-white text-primary hover:bg-white/90 rounded-full px-8 py-6 text-lg shadow-lg hover:scale-105 transition-all"
            >
              Browse Quizzes
            </Button>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-6 py-8 text-center text-muted-foreground">
        <p>© 2024 ABIC Quizzz. Created by Rajiv Kumar Tiwari</p>
      </footer>
    </div>
  );
};

export default Index;
