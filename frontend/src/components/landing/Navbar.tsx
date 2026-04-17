"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import TransitionLink from "@/components/ui/TransitionLink";
import { Activity, Menu, X, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const Navbar = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { theme, setTheme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Evitar desajuste de hidratación
    if (!mounted) return null;

    return (
        <nav
            className={cn(
                "fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 py-4",
                isScrolled ? "bg-background/80 backdrop-blur-md border-b border-border py-3" : "bg-transparent"
            )}
        >
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform shadow-[0_0_20px_rgba(56,189,248,0.3)]">
                        <Activity className="text-accent-foreground w-6 h-6" />
                    </div>
                    <span className="text-2xl font-bold tracking-tight text-foreground">
                        Field<span className="text-accent">IQ</span>
                    </span>
                </Link>

                {/* Desktop Menu */}
                <div className="hidden md:flex items-center gap-8">
                    {["Características", "Cómo Funciona", "IA", "Precios"].map((item) => (
                        <Link
                            key={item}
                            href={`#${item.toLowerCase().replace(" ", "-")}`}
                            className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-accent transition-colors"
                        >
                            {item}
                        </Link>
                    ))}
                </div>

                <div className="hidden md:flex items-center gap-6">
                    <button
                        onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                        className={cn(
                            "p-2 rounded-xl transition-colors border",
                            resolvedTheme === "dark"
                                ? "bg-slate-800 text-yellow-400 border-slate-700 hover:bg-slate-700"
                                : "bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200"
                        )}
                        aria-label="Toggle Theme"
                    >
                        {resolvedTheme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
                    </button>

                    <div className="flex items-center gap-4">
                        <TransitionLink
                            href="/login"
                            className="text-sm font-medium text-foreground hover:text-accent transition-colors"
                        >
                            Iniciar Sesión
                        </TransitionLink>
                        <TransitionLink
                            href="/register"
                            className="bg-accent hover:bg-accent/90 text-accent-foreground px-5 py-2.5 rounded-full text-sm font-bold transition-all shadow-lg hover:shadow-accent/20"
                        >
                            Comenzar Gratis
                        </TransitionLink>
                    </div>
                </div>

                {/* Mobile Menu Button Container */}
                <div className="flex items-center gap-4 md:hidden">
                    <button
                        onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                        className={cn(
                            "p-2 rounded-xl transition-colors border",
                            resolvedTheme === "dark"
                                ? "bg-slate-800 text-yellow-400 border-slate-700 hover:bg-slate-700"
                                : "bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200"
                        )}
                    >
                        {resolvedTheme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
                    </button>
                    <button
                        className="text-foreground p-2"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? <X /> : <Menu />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="md:hidden absolute top-full left-0 right-0 bg-background border-b border-border p-6 flex flex-col gap-4 animate-in fade-in slide-in-from-top-4">
                    {["Características", "Cómo Funciona", "IA", "Precios"].map((item) => (
                        <Link
                            key={item}
                            href={`#${item.toLowerCase().replace(" ", "-")}`}
                            className="text-lg font-medium text-slate-600 dark:text-slate-300"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            {item}
                        </Link>
                    ))}
                    <div className="flex flex-col gap-3 pt-4 border-t border-border">
                        <TransitionLink href="/login" className="text-center py-2 text-foreground">
                            Iniciar Sesión
                        </TransitionLink>
                        <TransitionLink
                            href="/register"
                            className="bg-accent text-accent-foreground text-center py-3 rounded-full font-bold"
                        >
                            Comenzar Gratis
                        </TransitionLink>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
