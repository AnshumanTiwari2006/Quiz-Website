import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { GraduationCap, Users, Brain, Zap } from "lucide-react";

import Navbar from "@/components/Navbar";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
            Expert Learning Platform
          </Badge>
          <h2 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight leading-tight text-foreground">
            Master Knowledge through <br />
            <span className="text-primary italic">Expert Quizzing.</span>
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto mb-10 font-medium">
            An elite educational infrastructure designed for efficiency. Test concepts and master subjects through intuitive, structured assessments.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              onClick={() => navigate('/quizzes')}
              className="bg-primary text-primary-foreground rounded-full px-8 py-6 text-base font-bold shadow-soft hover:bg-secondary hover:text-primary transition-all border-0"
            >
              Explore Library
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
              className="rounded-full px-8 py-6 text-base border-2 border-secondary bg-transparent text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all font-bold"
            >
              Meet the Creator
            </Button>
          </div>
        </div>

        {/* Features Grid - Floral White Boxes */}
        <div className="grid md:grid-cols-3 gap-6 mb-20">
          <Card className="p-6 rounded-3xl border-0 bg-background shadow-soft hover:shadow-medium hover:ring-primary/20 transition-all group ring-1 ring-border/50">
            <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary transition-colors">
              <GraduationCap className="w-6 h-6 text-foreground group-hover:text-primary-foreground transition-colors" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-foreground tracking-tight">Multiple Formats</h3>
            <p className="text-sm text-muted-foreground leading-relaxed font-medium">
              MCQ, One-word, and Flashcard systems designed for deep conceptual retention.
            </p>
          </Card>

          <Card className="p-6 rounded-3xl border-0 bg-background shadow-soft hover:shadow-medium hover:ring-primary/20 transition-all group ring-1 ring-border/50">
            <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary transition-colors">
              <Zap className="w-6 h-6 text-foreground group-hover:text-primary-foreground transition-colors" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-foreground tracking-tight">Timed Proficiency</h3>
            <p className="text-sm text-muted-foreground leading-relaxed font-medium">
              Enhance decision-making under pressure with precision-tuned assessment timers.
            </p>
          </Card>

          <Card className="p-6 rounded-3xl border-0 bg-background shadow-soft hover:shadow-medium hover:ring-primary/20 transition-all group ring-1 ring-border/50">
            <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary transition-colors">
              <Users className="w-6 h-6 text-foreground group-hover:text-primary-foreground transition-colors" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-foreground tracking-tight">Analytical Insights</h3>
            <p className="text-sm text-muted-foreground leading-relaxed font-medium">
              Performance metrics and instant feedback provide actionable learning outcomes.
            </p>
          </Card>
        </div>

        {/* About Us Section */}
        <div id="about" className="mb-20 scroll-mt-24">
          <Card className="p-8 rounded-[2.5rem] border-0 bg-background shadow-soft ring-1 ring-border/50 overflow-hidden hover:ring-primary/20 transition-all">
            <div className="grid md:grid-cols-2 gap-10 items-center">
              <div className="relative group">
                <div className="absolute inset-0 bg-primary/20 rounded-[2rem] blur-2xl group-hover:bg-primary/30 transition-all" />
                <img
                  src="/photo-creator.jpeg"
                  alt="Creator"
                  className="rounded-[2rem] w-full h-[400px] object-cover relative z-10 shadow-soft grayscale hover:grayscale-0 transition-all duration-700"
                />
              </div>
              <div className="space-y-6">
                <Badge className="bg-primary/10 text-primary border-0 rounded-full px-4 py-1 text-[10px] font-bold uppercase tracking-widest">
                  Behind the Spark
                </Badge>
                <h3 className="text-4xl font-bold tracking-tight text-foreground leading-snug">
                  Engineered for <br /><span className="text-primary italic">Excellence.</span>
                </h3>
                <p className="text-muted-foreground leading-relaxed font-medium">
                  Scholar Synergy was envisioned as more than just a testing tool. It was built to bridge the gap between passive learning and active mastery.
                </p>
                <div className="pt-4 border-t border-border/40">
                  <p className="text-lg font-bold text-foreground">Lead Architect</p>
                  <p className="text-xs font-bold uppercase tracking-widest text-primary/60">Visionary behind Scholar Synergy</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* CTA Section - Smaller */}
        <div className="text-center mb-20 px-4">
          <Card className="p-10 rounded-[2.5rem] border-0 bg-primary text-primary-foreground shadow-strong relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24 blur-3xl" />
            <div className="relative z-10">
              <h3 className="text-3xl font-bold mb-4 tracking-tight text-white">Ready to Advance?</h3>
              <p className="text-base mb-8 opacity-90 max-w-lg mx-auto font-medium leading-relaxed text-white">
                Join a community of professionals and students utilizing high-fidelity assessment tools.
              </p>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => navigate('/quizzes')}
                className="rounded-full px-10 py-6 text-base font-bold shadow-lg bg-white text-primary hover:bg-white/10 hover:text-white transition-all border-0"
              >
                Browse Library
              </Button>
            </div>
          </Card>
        </div>

        {/* Contact Us Section */}
        <div id="contact" className="mb-20 scroll-mt-24">
          <div className="text-center mb-10">
            <Badge className="bg-primary/5 text-primary border-0 rounded-full px-4 py-1 text-[10px] font-bold uppercase tracking-widest mb-4">
              Communications Registry
            </Badge>
            <h3 className="text-3xl font-bold tracking-tight text-foreground">Connect with Our Hub</h3>
          </div>

          <Card className="p-6 md:p-12 rounded-[2.5rem] border-0 bg-secondary/30 shadow-soft ring-1 ring-border/50 relative overflow-hidden group hover:ring-primary/20 transition-all">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="text-center md:text-left">
                <h4 className="text-2xl font-bold mb-6 tracking-tight text-foreground">Have a Query?</h4>
                <p className="text-muted-foreground leading-relaxed font-medium mb-8 max-w-md mx-auto md:mx-0">
                  Whether you need technical support, have a feature request, or want to collaborate, our communication lines are always open for elite users.
                </p>
                <div className="space-y-4 max-w-sm mx-auto md:mx-0">
                  <div className="flex items-center gap-5 p-4 rounded-2xl bg-white/50 border border-white/80 shadow-sm group/item hover:border-primary/20 transition-all">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover/item:bg-primary group-hover/item:text-white transition-all shrink-0">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <p className="text-[9px] md:text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Response Speed</p>
                      <p className="text-xs md:text-sm font-bold text-foreground">Typically within 24 Hours</p>
                    </div>
                  </div>
                  <a
                    href="mailto:anshumantiwari2006@gmail.com"
                    className="flex items-center gap-5 p-4 rounded-2xl bg-white/50 border border-white/80 shadow-sm group/item hover:border-primary/20 transition-all cursor-pointer overflow-hidden"
                  >
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover/item:bg-primary group-hover/item:text-white transition-all shrink-0">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div className="text-left overflow-hidden">
                      <p className="text-[9px] md:text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Direct Mailbox</p>
                      <p className="text-xs md:text-sm font-bold text-primary truncate max-w-full">anshumantiwari2006@gmail.com</p>
                    </div>
                  </a>
                </div>
              </div>

              <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-soft border-0 ring-1 ring-border/50 text-center relative z-10 w-full max-w-sm mx-auto">
                <Brain className="w-10 h-10 md:w-12 md:h-12 text-primary/20 mx-auto mb-6" />
                <h4 className="text-lg md:text-xl font-bold mb-3 tracking-tight">Priority Message Submission</h4>
                <p className="text-xs md:text-sm text-muted-foreground mb-8 leading-relaxed font-medium px-2 md:px-4">
                  Fill out our priority transmission form with any attachments you'd like us to review.
                </p>
                <Button
                  onClick={() => navigate('/contact')}
                  className="w-full bg-primary text-white rounded-full py-6 md:py-8 text-xs md:text-sm font-black uppercase tracking-[0.2em] shadow-strong hover:bg-secondary hover:text-primary hover:scale-[1.02] active:scale-[0.98] transition-all border-0"
                >
                  Open Official Channel
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto px-6 py-8 border-t border-border/50 text-center text-muted-foreground font-medium text-[10px] uppercase tracking-widest">
        <p>© 2024 Scholar Synergy. Professional Assessment Infrastructure.</p>
      </footer>
    </div>
  );
};

export default Index;
