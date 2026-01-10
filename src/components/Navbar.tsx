import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
    Brain, Menu, LogOut, Home, BookOpen,
    MessageSquare, LayoutDashboard, LucideIcon,
    User, History, Settings
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetClose } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

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
    const { user, profile, logout } = useAuth();

    const handleLogout = async () => {
        await logout();
        navigate("/");
    };

    const isTeacher = profile?.role === "teacher";
    const isAdminRole = ["admin", "moderator", "viewer"].includes(profile?.role || "");

    const navLinks: NavLink[] = [
        { label: "Home", path: "/", icon: Home },
        { label: "Library", path: "/quizzes", icon: BookOpen },
        { label: "Contact Us", path: "/contact", icon: MessageSquare },
    ];

    if (isAdminRole) {
        navLinks.push({ label: "Master Panel", path: "/admin/master-dashboard", icon: Settings });
    } else if (isTeacher) {
        navLinks.push({ label: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard });
    } else if (!user) {
        navLinks.push({ label: "Login", path: "/admin/login", icon: LayoutDashboard });
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

                    {user ? (
                        <div className="flex items-center gap-2 ml-2 pl-4 border-l border-border/20">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="w-10 h-10 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center font-black text-primary text-xs hover:bg-primary hover:text-white transition-all shadow-soft outline-none">
                                        {profile?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || <User className="w-4 h-4" />}
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56 rounded-[2rem] p-2 border-0 shadow-strong ring-1 ring-border/50 bg-background/95 backdrop-blur-md" align="end">
                                    <DropdownMenuLabel className="px-4 py-3 flex flex-col">
                                        <span className="text-sm font-bold text-foreground truncate">{profile?.name}</span>
                                        <span className="text-[10px] text-muted-foreground font-medium truncate italic">{user.email}</span>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator className="bg-border/50 mx-2" />
                                    <DropdownMenuItem
                                        onClick={() => navigate('/profile')}
                                        className="rounded-xl h-10 px-4 cursor-pointer focus:bg-primary/10 focus:text-primary font-bold text-[10px] uppercase tracking-widest gap-3 transition-colors"
                                    >
                                        <User className="w-3.5 h-3.5" /> Profile
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => {
                                            navigate('/profile');
                                            setTimeout(() => {
                                                document.getElementById('history')?.scrollIntoView({ behavior: 'smooth' });
                                            }, 100);
                                        }}
                                        className="rounded-xl h-10 px-4 cursor-pointer focus:bg-primary/10 focus:text-primary font-bold text-[10px] uppercase tracking-widest gap-3 transition-colors"
                                    >
                                        <History className="w-3.5 h-3.5" /> Quiz History
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator className="bg-border/50 mx-2" />
                                    <DropdownMenuItem
                                        onClick={handleLogout}
                                        className="rounded-xl h-10 px-4 cursor-pointer focus:bg-destructive/10 focus:text-destructive font-bold text-[10px] uppercase tracking-widest gap-3 transition-colors"
                                    >
                                        <LogOut className="w-3.5 h-3.5" /> Sign Out
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    ) : null}
                </div>

                {/* Mobile Navigation */}
                <div className="md:hidden flex items-center gap-3">
                    {user && (
                        <button
                            onClick={() => navigate('/profile')}
                            className="w-9 h-9 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center font-black text-primary text-[10px] shadow-soft"
                        >
                            {profile?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || <User className="w-4 h-4" />}
                        </button>
                    )}

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

                                {user && (
                                    <SheetClose asChild>
                                        <Button
                                            variant="ghost"
                                            onClick={() => {
                                                navigate('/profile');
                                                setTimeout(() => {
                                                    document.getElementById('history')?.scrollIntoView({ behavior: 'smooth' });
                                                }, 100);
                                            }}
                                            className="justify-start h-12 rounded-2xl font-bold text-xs uppercase tracking-widest text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all px-4"
                                        >
                                            <History className="h-4 w-4 mr-4" />
                                            Quiz History
                                        </Button>
                                    </SheetClose>
                                )}

                                {user && (
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
