import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mail, Sparkles, Send, Zap, ShieldCheck } from "lucide-react";
import Navbar from "@/components/Navbar";

const Contact = () => {
    const navigate = useNavigate();

    const openGmail = () => {
        const subject = encodeURIComponent("Scholar Synergy - Support Request");
        const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=anshumantiwari2006@gmail.com&su=${subject}`;
        const mailtoUrl = `mailto:anshumantiwari2006@gmail.com?subject=${subject}`;

        const newWindow = window.open(gmailUrl, '_blank');
        if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
            window.location.href = mailtoUrl;
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground pb-20">
            <Navbar />

            <main className="max-w-4xl mx-auto px-6 py-16">
                <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="inline-flex items-center gap-2 bg-primary/5 border border-primary/10 rounded-full px-4 py-1.5 mb-6">
                        <Sparkles className="w-3.5 h-3.5 text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary">Official Channel</span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black mb-4 tracking-tight leading-tight">Direct Support Access</h2>
                    <p className="text-muted-foreground text-lg max-w-xl mx-auto leading-relaxed">
                        We've simplified our communication. No more forms—just a direct, secure line between you and the development team.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 items-start">
                    <Card className="p-10 rounded-[3rem] border-0 bg-background shadow-strong ring-1 ring-border/50 relative overflow-hidden animate-in fade-in slide-in-from-left-8 duration-1000">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[5rem] -mr-10 -mt-10 blur-2xl" />
                        <div className="relative z-10 space-y-8">
                            <div>
                                <h3 className="text-2xl font-bold mb-4">Why Direct Mail?</h3>
                                <p className="text-muted-foreground text-sm leading-relaxed font-medium">
                                    Forms can be restrictive. By using your own mail client, you can:
                                </p>
                            </div>

                            <ul className="space-y-4">
                                <li className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-secondary/50 flex items-center justify-center shrink-0">
                                        <Zap className="w-5 h-5 text-primary" />
                                    </div>
                                    <p className="text-sm font-bold text-foreground py-2">Keep a history of your message in your own "Sent" folder.</p>
                                </li>
                                <li className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-secondary/50 flex items-center justify-center shrink-0">
                                        <Send className="w-5 h-5 text-primary" />
                                    </div>
                                    <p className="text-sm font-bold text-foreground py-2">Attach multiple high-resolution files and documents easily.</p>
                                </li>
                                <li className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-secondary/50 flex items-center justify-center shrink-0">
                                        <ShieldCheck className="w-5 h-5 text-primary" />
                                    </div>
                                    <p className="text-sm font-bold text-foreground py-2">Communicate through an encrypted, trusted mail provider.</p>
                                </li>
                            </ul>

                            <div className="pt-6 border-t border-border/50 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full overflow-hidden grayscale ring-2 ring-primary/20">
                                    <img src="/photo-creator.jpeg" alt="Creator" className="object-cover w-full h-full" />
                                </div>
                                <div>
                                    <p className="text-xs font-black uppercase tracking-widest text-primary">Anshuman Tiwari</p>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Lead Developer</p>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-10 rounded-[3rem] border-0 bg-primary text-white shadow-strong animate-in fade-in slide-in-from-right-8 duration-1000 flex flex-col items-center justify-center text-center space-y-10 group min-h-[450px]">
                        <div className="w-24 h-24 bg-white/10 rounded-[2rem] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-500">
                            <Mail className="w-12 h-12 text-white" />
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-3xl font-black tracking-tight">Launch Mailbox</h3>
                            <p className="opacity-80 text-sm font-medium leading-relaxed px-6">
                                Clicking the button below will automatically open your Gmail or default mail app pre-addressed to our lead developer.
                            </p>
                        </div>

                        <Button
                            onClick={openGmail}
                            className="w-full bg-white text-primary rounded-full py-10 text-base font-black uppercase tracking-[0.2em] shadow-lg hover:scale-[1.05] active:scale-[0.95] transition-all border-0"
                        >
                            Open Official Channel
                        </Button>

                        <div className="space-y-2">
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Direct Address</p>
                            <p className="text-lg font-bold">anshumantiwari2006@gmail.com</p>
                        </div>
                    </Card>
                </div>
            </main>
        </div>
    );
};

export default Contact;
