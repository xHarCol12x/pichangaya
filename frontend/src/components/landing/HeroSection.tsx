"use client";

import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ArrowRight, Play, TrendingUp, Users, Wallet } from "lucide-react";
import FloatingCard from "./FloatingCard";
import TransitionLink from "@/components/ui/TransitionLink";

const HeroSection = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const titleRef = useRef<HTMLHeadingElement>(null);
    const subtitleRef = useRef<HTMLParagraphElement>(null);
    const ctasRef = useRef<HTMLDivElement>(null);
    const dashboardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const tl = gsap.timeline({ defaults: { ease: "power3.out", duration: 1 } });

        tl.fromTo(
            titleRef.current,
            { y: 60, opacity: 0 },
            { y: 0, opacity: 1, delay: 0.2 }
        )
            .fromTo(
                subtitleRef.current,
                { y: 40, opacity: 0 },
                { y: 0, opacity: 1 },
                "-=0.6"
            )
            .fromTo(
                ctasRef.current,
                { y: 20, opacity: 0 },
                { y: 0, opacity: 1 },
                "-=0.6"
            )
            .fromTo(
                dashboardRef.current,
                { scale: 0.95, opacity: 0, y: 100 },
                { scale: 1, opacity: 1, y: 0, duration: 1.2 },
                "-=0.8"
            );
    }, []);

    return (
        <section
            ref={containerRef}
            className="relative pt-32 pb-20 overflow-hidden min-h-screen flex flex-col items-center justify-center hero-gradient"
        >
            <div
                className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
                style={{
                    backgroundImage: "linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)",
                    backgroundSize: "60px 60px",
                }}
            />
            {/* Background Orbs */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[128px] -z-10" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[128px] -z-10" />

            <div className="max-w-7xl mx-auto px-6 text-center z-10">
                <h1
                    ref={titleRef}
                    className="text-5xl md:text-8xl font-black tracking-tight mb-8 leading-[1.1] text-foreground"
                >
                    Gestión Deportiva <br />
                    <span className="text-gradient">Inteligente</span>
                </h1>

                <p
                    ref={subtitleRef}
                    className="text-xl md:text-2xl text-slate-500 dark:text-slate-400 max-w-3xl mx-auto mb-10 leading-relaxed"
                >
                    Optimiza la operación de tu club con IA. Reservas automatizadas, pagos simplificados y analítica avanzada en una sola plataforma.
                </p>

                <div
                    ref={ctasRef}
                    className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20"
                >
                    <TransitionLink
                        href="/register"
                        className="group bg-accent text-accent-foreground px-8 py-4 rounded-full text-lg font-bold flex items-center gap-2 transition-transform hover:scale-105"
                    >
                        Comenzar Gratis
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </TransitionLink>
                    <button className="group glass text-foreground px-8 py-4 rounded-full text-lg font-bold flex items-center gap-2 hover:bg-black/5 dark:hover:bg-white/10 transition-all">
                        <Play className="w-5 h-5 fill-foreground" />
                        Ver Demo
                    </button>
                </div>

                {/* Mockup Dashboard Area */}
                <div className="relative w-full max-w-5xl mx-auto">
                    <div
                        ref={dashboardRef}
                        className="relative glass rounded-3xl p-4 md:p-8 aspect-video md:aspect-[21/9] group shadow-2xl z-20"
                    >
                        {/* Background Image Wrapper (keeps border radius clean without clipping floating cards) */}
                        <div className="absolute inset-0 rounded-3xl overflow-hidden -z-10">
                            <img
                                src="https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1200&auto=format&fit=crop"
                                alt="Elite Sports Field"
                                className="absolute inset-0 w-full h-full object-cover opacity-20 dark:opacity-50 group-hover:scale-110 transition-transform duration-1000"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                        </div>

                        <div className="relative w-full h-full border border-border rounded-2xl overflow-hidden bg-background/80 dark:bg-slate-950/40 backdrop-blur-md">
                            <div className="w-full h-12 bg-foreground/5 dark:bg-white/10 border-b border-border flex items-center px-4 gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-400" />
                                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                                <div className="w-3 h-3 rounded-full bg-green-400" />
                                <span className="text-[10px] text-slate-500 dark:text-slate-300 font-bold ml-2 uppercase tracking-widest">FieldIQ Control Center</span>
                            </div>
                            <div className="p-4 md:p-6 h-full overflow-hidden flex flex-col">
                                <div className="grid grid-cols-6 gap-4 mb-6">
                                    <div className="col-span-2 space-y-3">
                                        <div className="h-4 w-24 bg-accent/20 rounded-lg" />
                                        <div className="h-20 bg-foreground/5 dark:bg-white/5 border border-border dark:border-white/5 rounded-xl p-3 flex flex-col justify-center gap-2">
                                            <div className="h-2 w-full bg-foreground/10 dark:bg-white/10 rounded-full" />
                                            <div className="h-2 w-2/3 bg-foreground/10 dark:bg-white/10 rounded-full" />
                                        </div>
                                    </div>
                                    <div className="col-span-4 h-28 bg-foreground/5 dark:bg-white/5 border border-border dark:border-white/5 rounded-xl flex items-end p-4 gap-2">
                                        {[40, 70, 45, 90, 65, 80, 50, 85, 95, 60, 75, 55].map((h, i) => (
                                            <div key={i} className="flex-1 bg-accent/30 dark:bg-accent/30 rounded-t-sm" style={{ height: `${h}%` }} />
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div className="h-32 bg-foreground/5 border border-border rounded-xl p-4 flex flex-col justify-between">
                                        <div className="flex justify-between items-start">
                                            <div className="h-2 w-12 bg-foreground/20 rounded-full" />
                                            <div className="w-6 h-6 rounded-lg bg-accent/20" />
                                        </div>
                                        <div className="h-4 w-full bg-foreground/10 rounded-full" />
                                        <div className="h-2 w-2/3 bg-foreground/5 rounded-full" />
                                    </div>
                                    <div className="h-32 bg-foreground/5 border border-border rounded-xl p-4 flex flex-col gap-3">
                                        <div className="h-2 w-16 bg-foreground/20 rounded-full" />
                                        <div className="flex-1 flex items-end gap-1">
                                            {[30, 50, 40, 60, 45, 70].map((h, i) => (
                                                <div key={i} className="flex-1 bg-emerald-500/20 rounded-t-sm" style={{ height: `${h}%` }} />
                                            ))}
                                        </div>
                                    </div>
                                    <div className="h-32 bg-foreground/5 border border-border rounded-xl p-4">
                                        <div className="h-full w-full rounded-full border-4 border-foreground/5 border-t-accent/40" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Floating Insight Cards */}
                        <FloatingCard className="absolute -top-6 -left-8 hidden lg:flex" delay={1.4}>
                            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                                <TrendingUp className="text-blue-400 w-6 h-6" />
                            </div>
                            <div className="text-left">
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Reservas Hoy</p>
                                <p className="text-xl font-bold text-foreground">48</p>
                            </div>
                        </FloatingCard>

                        <FloatingCard className="absolute top-1/2 -right-8 hidden lg:flex" delay={1.8}>
                            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                                <Wallet className="text-emerald-400 w-6 h-6" />
                            </div>
                            <div className="text-left">
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Ingresos</p>
                                <p className="text-xl font-bold text-foreground">S/ 12,450</p>
                            </div>
                        </FloatingCard>

                        <FloatingCard className="absolute -bottom-6 left-1/4 hidden lg:flex" delay={2.2}>
                            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                                <Users className="text-amber-400 w-6 h-6" />
                            </div>
                            <div className="text-left">
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Ocupación</p>
                                <div className="flex items-end gap-2">
                                    <p className="text-xl font-bold text-foreground">87%</p>
                                    <span className="text-emerald-500 dark:text-emerald-400 text-[10px] mb-1 font-bold">+12% vs sem. pasada</span>
                                </div>
                            </div>
                        </FloatingCard>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HeroSection;
