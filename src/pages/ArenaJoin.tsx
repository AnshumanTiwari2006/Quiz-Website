import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Zap, Users, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const ArenaJoin = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (code.length !== 6) {
            toast({
                title: "Invalid Code",
                description: "Please enter a valid 6-digit Arena code.",
                variant: "destructive",
            });
            return;
        }

        setLoading(true);
        try {
            const sessionRef = doc(db, "arena_sessions", code.toUpperCase());
            const sessionSnap = await getDoc(sessionRef);

            if (sessionSnap.exists()) {
                const sessionData = sessionSnap.data();
                if (sessionData.status === "finished") {
                    toast({
                        title: "Battle Ended",
                        description: "This Arena session has already concluded.",
                        variant: "destructive",
                    });
                } else {
                    navigate(`/arena/${code.toUpperCase()}/lobby`);
                }
            } else {
                toast({
                    title: "Session Not Found",
                    description: "No active Arena found with this code.",
                    variant: "destructive",
                });
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: "Failed to join Arena. Please try again.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />
            <main className="max-w-xl mx-auto px-6 py-24">
                <Card className="p-8 md:p-12 rounded-[3rem] border-0 bg-white shadow-strong ring-1 ring-border/50 animate-in fade-in zoom-in duration-500 text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-2xl" />

                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-soft">
                        <Zap className="w-8 h-8 text-primary fill-primary/20" />
                    </div>

                    <h1 className="text-3xl font-black mb-3 tracking-tight">Arena Access</h1>
                    <p className="text-muted-foreground font-bold uppercase tracking-[0.2em] text-[10px] mb-10">Enter 6-Digit Battle Code</p>

                    <form onSubmit={handleJoin} className="space-y-8">
                        <div className="space-y-3">
                            <Label htmlFor="code" className="text-[11px] uppercase font-bold tracking-widest text-primary/70 ml-1">Session Invitation</Label>
                            <Input
                                id="code"
                                type="text"
                                maxLength={6}
                                autoFocus
                                placeholder="X 2 Y 7 Z 9"
                                value={code}
                                onChange={(e) => setCode(e.target.value.toUpperCase())}
                                className="rounded-2xl border-2 border-border/50 h-20 text-4xl font-black tracking-[0.5em] text-center focus:ring-primary/20 transition-all placeholder:text-muted-foreground/10 shadow-inner uppercase"
                                required
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={loading || code.length !== 6}
                            className="w-full bg-primary text-primary-foreground rounded-2xl h-16 shadow-strong hover:bg-secondary hover:text-primary hover:scale-[1.02] transition-all text-lg font-black tracking-tight border-0"
                        >
                            {loading ? "AUTHORIZING..." : "ENTER BATTLE"}
                            {!loading && <ArrowRight className="ml-3 h-5 w-5" />}
                        </Button>
                    </form>

                    <div className="mt-12 pt-8 border-t border-border/10">
                        <div className="flex items-center justify-center gap-2 text-muted-foreground">
                            <Users className="w-4 h-4" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Real-time synchronized battle</span>
                        </div>
                    </div>
                </Card>
            </main>
        </div>
    );
};

export default ArenaJoin;
