import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Brain, Menu, LogOut, Home, BookOpen, MessageSquare, LayoutDashboard, LucideIcon } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetClose } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface NavLink {
    label: string;
    path?: string;
    onClick?: () => void;
    icon: LucideIcon;
}

interface NavbarProps {
    extraLinks?: NavLink[];
}

const Navbar = ({ extraLinks = [] }: NavbarProps) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        setIsAdmin(!!localStorage.getItem("adminLoggedIn"));
    }, [location]);

    const handleLogout = () => {
        localStorage.removeItem("adminLoggedIn");
        setIsAdmin(false);
        navigate("/");
    };

    const navLinks: NavLink[] = [
        { label: "Home", path: "/", icon: Home },
        { label: "Library", path: "/quizzes", icon: BookOpen },
        { label: "Contact Us", path: "/contact", icon: MessageSquare },
    ];

    if (isAdmin) {
        navLinks.push({ label: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard });
    } else {
        navLinks.push({ label: "Admin Login", path: "/admin/login", icon: LayoutDashboard });
    }

    return (
        <header className="py-4 px-6 border-b border-border/50 bg-white/50 backdrop-blur-md sticky top-0 z-50">
            <div className="max-w-5xl mx-auto flex items-center justify-between">
                <div
                    className="flex items-center gap-3 cursor-pointer group"
                    onClick={() => navigate('/')}
                >
                    <div className="w-10 h-10 flex items-center justify-center shrink-0">
                        <img src="/School-logo.png" alt="School Logo" className="w-full h-full object-contain group-hover:scale-110 transition-transform" />
                    </div>
                    <h1 className="text-lg md:text-xl font-bold tracking-tight text-primary whitespace-nowrap">
                        Scholar Synergy
                    </h1>
                </div>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center gap-2">
                    {navLinks.map((link) => (
                        <Button
                            key={link.path || link.label}
                            variant="ghost"
                            onClick={() => link.path ? navigate(link.path) : link.onClick?.()}
                            className={cn(
                                "rounded-full font-bold text-[10px] uppercase tracking-widest transition-all px-4",
                                link.path && location.pathname === link.path
                                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                    : "text-muted-foreground hover:bg-primary hover:text-primary-foreground"
                            )}
                        >
                            {link.label}
                        </Button>
                    ))}
                    {extraLinks.map((link) => (
                        <Button
                            key={link.label}
                            onClick={link.onClick}
                            className="rounded-full bg-primary text-primary-foreground shadow-soft font-bold text-[10px] uppercase tracking-widest px-6 h-10 hover:scale-[1.02] transition-all border-0"
                        >
                            <link.icon className="mr-2 h-3.5 w-3.5" />
                            {link.label}
                        </Button>
                    ))}
                    {isAdmin && (
                        <Button
                            variant="ghost"
                            onClick={handleLogout}
                            className="rounded-full font-bold text-[10px] uppercase tracking-widest text-muted-foreground hover:bg-destructive hover:text-destructive-foreground transition-all px-4"
                        >
                            <LogOut className="h-3.5 w-3.5 mr-2" />
                            Sign Out
                        </Button>
                    )}
                </div>

                {/* Mobile Navigation */}
                <div className="md:hidden flex items-center gap-2">
                    {extraLinks.length > 0 && extraLinks.map((link) => (
                        <Button
                            key={link.label}
                            size="icon"
                            onClick={link.onClick}
                            className="rounded-full bg-primary text-primary-foreground h-9 w-9 shadow-soft"
                        >
                            <link.icon className="h-4 w-4" />
                        </Button>
                    ))}
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary group h-9 w-9">
                                <Menu className="h-5 w-5 text-primary group-hover:text-primary-foreground transition-colors" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="w-[300px] border-l-0 bg-background/95 backdrop-blur-lg">
                            <SheetHeader>
                                <SheetTitle className="text-left flex items-center gap-2 mb-8 border-b pb-4">
                                    <div className="w-10 h-10 flex items-center justify-center shrink-0">
                                        <img src="/School-logo.png" alt="School Logo" className="w-full h-full object-contain" />
                                    </div>
                                    <span className="text-primary font-bold tracking-tight">Scholar Synergy</span>
                                </SheetTitle>
                            </SheetHeader>
                            <nav className="flex flex-col gap-2 mt-4">
                                {navLinks.map((link) => (
                                    <SheetClose asChild key={link.path || link.label}>
                                        <Button
                                            variant="ghost"
                                            onClick={() => link.path ? navigate(link.path) : link.onClick?.()}
                                            className={cn(
                                                "justify-start h-12 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all px-4",
                                                link.path && location.pathname === link.path
                                                    ? "bg-primary text-primary-foreground shadow-soft"
                                                    : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
                                            )}
                                        >
                                            <link.icon className="h-4 w-4 mr-4" />
                                            {link.label}
                                        </Button>
                                    </SheetClose>
                                ))}

                                {extraLinks.map((link) => (
                                    <SheetClose asChild key={link.label}>
                                        <Button
                                            variant="ghost"
                                            onClick={link.onClick}
                                            className="justify-start h-12 rounded-2xl font-bold text-xs uppercase tracking-widest text-primary hover:bg-primary/10 transition-all px-4"
                                        >
                                            <link.icon className="h-4 w-4 mr-4" />
                                            {link.label}
                                        </Button>
                                    </SheetClose>
                                ))}

                                {location.pathname === '/' && (
                                    <>
                                        <SheetClose asChild>
                                            <Button
                                                variant="ghost"
                                                onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
                                                className="justify-start h-12 rounded-2xl font-bold text-xs uppercase tracking-widest text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all px-4"
                                            >
                                                <Brain className="h-4 w-4 mr-4" />
                                                About Us
                                            </Button>
                                        </SheetClose>
                                        <SheetClose asChild>
                                            <Button
                                                variant="ghost"
                                                onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
                                                className="justify-start h-12 rounded-2xl font-bold text-xs uppercase tracking-widest text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all px-4"
                                            >
                                                <MessageSquare className="h-4 w-4 mr-4" />
                                                Contact Us
                                            </Button>
                                        </SheetClose>
                                    </>
                                )}

                                {isAdmin && (
                                    <SheetClose asChild>
                                        <Button
                                            variant="ghost"
                                            onClick={handleLogout}
                                            className="justify-start h-12 rounded-2xl font-bold text-xs uppercase tracking-widest text-destructive hover:bg-destructive/10 hover:text-destructive transition-all mt-4 border-t pt-4 px-4"
                                        >
                                            <LogOut className="h-4 w-4 mr-4" />
                                            Sign Out
                                        </Button>
                                    </SheetClose>
                                )}
                            </nav>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </header>
    );
};

export default Navbar;
