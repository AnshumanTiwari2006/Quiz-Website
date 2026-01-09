import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Trophy, Home, RotateCcw, CheckCircle2, XCircle, Download, Award } from "lucide-react";
import Navbar from "@/components/Navbar";
import confetti from "canvas-confetti";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

import { useAuth } from "@/contexts/AuthContext";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const QuizResult = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [resultData, setResultData] = useState<any>(null);
  const [studentName, setStudentName] = useState("");
  const certificateRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);

  useEffect(() => {
    const storedResult = sessionStorage.getItem("quizResult");

    if (!storedResult) {
      navigate(`/quiz/${quizId}`);
      return;
    }

    const data = JSON.parse(storedResult);
    setResultData(data);
    setStudentName(profile?.name || user?.email || "Student");

    // Trigger confetti if score is high
    const percentage = data.total > 0 ? (data.score / data.total) * 100 : 0;
    if (percentage >= 80) {
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(function () {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);
    }

    // Save score to Firestore
    const saveScore = async () => {
      if (hasSaved || !user) return;
      try {
        await addDoc(collection(db, "scores"), {
          quizId,
          quizTitle: data.quizTitle,
          teacherId: data.teacherId || "",
          teacherName: data.teacherName || "",
          userId: user.uid,
          userName: profile?.name || user.displayName || "Student",
          userEmail: user.email,
          score: data.score,
          total: data.total,
          percentage: data.total > 0 ? (data.score / data.total) * 100 : 0,
          timestamp: new Date().toISOString(),
          isCheated: data.isCheated || false
        });
        setHasSaved(true);
      } catch (error) {
        console.error("Error saving score:", error);
      }
    };

    if (data && user) {
      saveScore();
    }
  }, [quizId, navigate, user, profile, hasSaved]);

  if (!resultData) return null;

  const { score, total, details, quizTitle, isCheated } = resultData;
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

  const downloadCertificate = async () => {
    if (!certificateRef.current || isCheated) return;
    setIsGenerating(true);

    try {
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#fffcf2"
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("landscape", "mm", "a4");
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${studentName}_${quizTitle}_Certificate.pdf`);
    } catch (error) {
      console.error("Certificate generation failed:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRetake = () => {
    sessionStorage.removeItem("quizResult");
    navigate(`/quiz/${quizId}/play`);
  };

  const handleHome = () => {
    sessionStorage.removeItem("quizResult");
    navigate('/quizzes');
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />

      {/* Hidden Certificate Template for PDF generation */}
      <div className="fixed left-[-9999px] top-0">
        <div
          ref={certificateRef}
          className="w-[1000px] h-[700px] bg-[#fffcf2] p-12 border-[20px] border-[#eb5e28] flex flex-col items-center justify-center text-center font-sans tracking-tight"
        >
          <div className="border-[2px] border-[#eb5e28]/20 p-8 w-full h-full flex flex-col items-center justify-between bg-white/50">
            <div className="flex flex-col items-center">
              <p className="text-[8px] font-bold text-[#403d39]/60 uppercase tracking-[0.4em] mb-0.5">The Institution of</p>
              <p className="text-lg font-black text-[#252422] uppercase tracking-[0.3em] mb-0.5">Aditya Birla Intermediate College</p>
              <p className="text-[9px] font-bold text-[#403d39]/60 uppercase tracking-[0.3em] mb-4">Renukoot, Sonebhadra</p>

              <Award className="w-16 h-16 text-[#eb5e28] mb-2" />
              <h1 className="text-3xl font-black text-[#252422] uppercase tracking-[0.2em] mb-4">Certificate of Excellence</h1>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-base text-[#403d39] uppercase font-bold tracking-widest">This is to certify that</p>
                <div className="flex flex-col items-center pt-4 pb-2">
                  <h2 className="text-5xl font-black text-[#252422] italic leading-tight mb-4">{studentName}</h2>
                  <div className="w-[80%] h-1 bg-[#eb5e28]" />
                </div>
              </div>
              <p className="text-base text-[#403d39] max-w-2xl mx-auto leading-relaxed">
                has successfully completed the assessment for <br />
                <span className="text-[#eb5e28] font-black underline decoration-2 underline-offset-8 uppercase">{quizTitle}</span>
              </p>
            </div>

            <div className="grid grid-cols-3 w-full border-t border-[#ccc5b9] pt-6 mt-4">
              <div className="flex flex-col items-center">
                <span className="text-[9px] uppercase font-bold text-[#403d39]/60 tracking-[0.3em] mb-1">Score Achieved</span>
                <span className="text-3xl font-black text-[#252422]">{percentage}%</span>
              </div>
              <div className="flex flex-col items-center justify-center">
                <Brain className="w-10 h-10 text-[#eb5e28]/50" />
                <span className="text-[8px] font-bold text-[#403d39]/40 uppercase tracking-widest mt-2">Scholar Synergy Platform</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[9px] uppercase font-bold text-[#403d39]/60 tracking-[0.3em] mb-1">Date Issued</span>
                <span className="text-xl font-bold text-[#252422]">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-6 py-16 space-y-16 animate-in fade-in duration-700">
        <Card className="p-12 md:p-20 rounded-[3rem] border-0 bg-background shadow-strong relative overflow-hidden ring-1 ring-border/50">
          <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full -mr-20 -mt-20 blur-3xl" />

          <div className="text-center mb-16 relative z-10">
            <div className={`w-24 h-24 ${isCheated ? 'bg-destructive' : 'bg-primary'} rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-md border-4 border-background`}>
              {isCheated ? <XCircle className="w-12 h-12 text-white" /> : <Trophy className="w-12 h-12 text-primary-foreground" />}
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-60 mb-4">
              {isCheated ? 'Security Breach Detected' : 'Assessment Module Finalized'}
            </p>
            <h1 className={`text-4xl md:text-5xl font-bold mb-4 tracking-tight ${isCheated ? 'text-destructive' : 'text-foreground'}`}>
              {isCheated ? 'Violation Detected' : 'Mission Accomplished'}
            </h1>
            <p className="text-lg text-muted-foreground font-medium max-w-lg mx-auto leading-relaxed">
              {isCheated
                ? "Academic integrity is paramount. This session was terminated due to a tab-switching violation."
                : `Evaluation complete for ${quizTitle}.`
              }
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-10 items-center mb-12 relative z-10">
            <div className={`p-10 bg-secondary/20 rounded-[2.5rem] text-center border-0 ring-1 ring-border/50 shadow-soft`}>
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4">Performance Index</div>
              <div className="text-6xl md:text-7xl font-black text-primary mb-4 tracking-tighter">{percentage}%</div>
              <div className="inline-flex items-center px-5 py-2 bg-background rounded-full text-[10px] font-bold text-foreground ring-1 ring-border/50 shadow-sm">
                {score} / {total} Total Credits
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                  <h3 className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Mastery Level</h3>
                  <span className="text-[10px] font-bold text-primary">{percentage}%</span>
                </div>
                <div className="w-full bg-secondary/30 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full transition-all duration-1000 ease-in-out"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-background rounded-2xl ring-1 ring-border/30">
                  <p className="text-[8px] font-bold text-muted-foreground uppercase mb-1 tracking-widest">Candidate</p>
                  <p className="text-sm font-bold text-foreground truncate">{studentName}</p>
                </div>
                {percentage >= 60 && !isCheated ? (
                  <Button
                    onClick={downloadCertificate}
                    disabled={isGenerating}
                    className="h-full bg-secondary text-primary hover:bg-primary hover:text-white rounded-2xl flex flex-col items-center justify-center border-0 transition-all group p-4"
                  >
                    <Download className="w-4 h-4 mb-1 group-hover:scale-110 transition-transform" />
                    <span className="text-[8px] font-bold uppercase tracking-widest">{isGenerating ? 'Engaging...' : 'Certificate'}</span>
                  </Button>
                ) : (
                  <div className="p-4 bg-secondary/10 rounded-2xl border-2 border-dashed border-border/20 flex flex-col items-center justify-center text-center">
                    <p className="text-[7px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">Locked</p>
                    <p className="text-[8px] font-bold text-muted-foreground/60 leading-tight">
                      {isCheated ? "Privacy Violation" : "Score 60%+ to unlock"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 relative z-10">
            <Button
              onClick={handleRetake}
              variant="outline"
              disabled={isCheated}
              className="rounded-2xl border-secondary h-14 text-sm font-bold hover:bg-primary hover:text-white hover:border-primary transition-all text-foreground bg-transparent"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset Evaluation
            </Button>
            <Button
              onClick={handleHome}
              className="bg-primary text-primary-foreground rounded-2xl shadow-md hover:scale-[1.02] hover:bg-primary/90 transition-all h-14 text-sm font-bold border-0"
            >
              <Home className="mr-2 h-4 w-4" />
              Exit to Dashboard
            </Button>
          </div>
        </Card>

        {/* Detailed Breakdown */}
        {!isCheated && percentage >= 61 && (
          <div className="space-y-6">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-4">Itemized Analysis</h2>
            <div className="grid gap-4">
              {details.map((item: any, idx: number) => (
                <Card key={idx} className="p-6 rounded-3xl border-0 bg-background shadow-soft flex flex-col gap-4 ring-1 ring-border/50 relative overflow-hidden">
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${item.isCorrect ? "bg-green-500" : "bg-destructive"} opacity-40`} />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center font-bold text-xs text-primary">
                        {idx + 1}
                      </span>
                      <Badge variant="outline" className="text-[8px] uppercase font-bold tracking-widest border-border/30 text-muted-foreground px-2 py-0.5 rounded-full bg-secondary/10">
                        {item.type}
                      </Badge>
                    </div>
                    {item.isCorrect ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-destructive" />
                    )}
                  </div>

                  <div className="space-y-4">
                    <p className="font-bold text-lg tracking-tight text-foreground line-clamp-2" title={item.question}>
                      {item.question}
                    </p>

                    <div className="grid md:grid-cols-2 gap-3">
                      <div className="p-4 rounded-xl bg-secondary/10 ring-1 ring-border/10">
                        <p className="text-[8px] uppercase font-bold text-muted-foreground opacity-50 mb-1 tracking-widest">Candidate Choice</p>
                        <p className={`font-bold text-sm ${item.isCorrect ? "text-green-600" : "text-destructive"}`}>
                          {item.userAnswer || "No Response"}
                        </p>
                      </div>
                      {!item.isCorrect && (
                        <div className="p-4 rounded-xl bg-green-500/5 ring-1 ring-green-500/10">
                          <p className="text-[8px] uppercase font-bold text-green-600/50 mb-1 tracking-widest">Expected Result</p>
                          <p className="font-bold text-sm text-green-600">{item.correctAnswer}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default QuizResult;
