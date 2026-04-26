"use client";

import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ArrowRight, Play, TrendingUp, X, Zap, Shield, Star } from "lucide-react";
import FloatingCard from "./FloatingCard";
import TransitionLink from "../ui/TransitionLink";
import MagneticButton from "../ui/MagneticButton";

// Video Demo Modal Component
const VideoModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
            gsap.fromTo(
                modalRef.current,
                { opacity: 0 },
                { opacity: 1, duration: 0.3, ease: "power2.out" }
            );
            gsap.fromTo(
                contentRef.current,
                { scale: 0.9, opacity: 0 },
                { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(1.7)" }
            );
        } else {
            document.body.style.overflow = "";
        }

        return () => {
            document.body.style.overflow = "";
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div
            ref={modalRef}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl"
            onClick={onClose}
        >
            <div
                ref={contentRef}
                className="relative w-full max-w-5xl aspect-video bg-slate-900 rounded-3xl overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(204,255,0,0.15)]"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 z-10 w-12 h-12 bg-white/5 hover:bg-accent/20 rounded-full flex items-center justify-center text-white transition-all hover:rotate-90"
                    aria-label="Cerrar video"
                >
                    <X className="w-6 h-6" />
                </button>

                <div className="w-full h-full flex flex-col items-center justify-center text-white">
                    <div className="w-24 h-24 rounded-full bg-accent/20 flex items-center justify-center mb-8 animate-pulse">
                        <Play className="w-12 h-12 text-accent fill-accent" />
                    </div>
                    <h3 className="text-3xl font-black mb-3 tracking-tight font-space-grotesk">EXPERIENCIA PICHANGALIBRE</h3>
                    <p className="text-slate-400 text-lg">Descubre el futuro de la gestión deportiva</p>
                </div>
            </div>
        </div>
    );
};

const HeroSection = () => {
    const [isVideoOpen, setIsVideoOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const titleRef = useRef<HTMLHeadingElement>(null);
    const subtitleRef = useRef<HTMLParagraphElement>(null);
    const ctasRef = useRef<HTMLDivElement>(null);
    const dashboardContainerRef = useRef<HTMLDivElement>(null);
    const dashboardRef = useRef<HTMLDivElement>(null);
    const ballRef = useRef<HTMLDivElement>(null);

    useGSAP(() => {
        if (!containerRef.current) return;

        const tl = gsap.timeline({ defaults: { ease: "expo.out", duration: 1.5 } });

        tl.fromTo(
            titleRef.current,
            { y: 100, opacity: 0, skewY: 7 },
            { y: 0, opacity: 1, skewY: 0, delay: 0.5 }
        )
            .fromTo(
                subtitleRef.current,
                { y: 50, opacity: 0 },
                { y: 0, opacity: 1 },
                "-=1"
            )
            .fromTo(
                ctasRef.current,
                { scale: 0.8, opacity: 0 },
                { scale: 1, opacity: 1, ease: "back.out(1.7)" },
                "-=0.8"
            )
            .fromTo(
                dashboardContainerRef.current,
                { rotateX: 45, rotateY: -15, y: 200, opacity: 0, scale: 0.8 },
                { rotateX: 15, rotateY: -10, y: 0, opacity: 1, scale: 1, duration: 2 },
                "-=1"
            );

        // Floating animation for the dashboard
        if (dashboardRef.current) {
            gsap.to(dashboardRef.current, {
                y: -20,
                duration: 3,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut"
            });
        }

        // Mouse move effect for 3D rotation
        const handleMouseMove = (e: globalThis.MouseEvent) => {
            if (!dashboardContainerRef.current) return;
            const { clientX, clientY } = e;
            const xPos = (clientX / window.innerWidth - 0.5) * 10;
            const yPos = (clientY / window.innerHeight - 0.5) * 10;

            gsap.to(dashboardContainerRef.current, {
                rotateY: -10 + xPos,
                rotateX: 15 - yPos,
                duration: 0.5,
                ease: "power2.out"
            });
        };

        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, { scope: containerRef });

    return (
        <>
            <section
                ref={containerRef}
                className="relative pt-40 pb-32 overflow-hidden min-h-screen flex flex-col items-center justify-center bg-[#050505]"
            >
                {/* Background Glows */}
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-accent/10 rounded-full blur-[150px] pointer-events-none" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/5 rounded-full blur-[150px] pointer-events-none" />
                
                {/* Grid Background */}
                <div 
                    className="absolute inset-0 opacity-[0.05] pointer-events-none" 
                    style={{ 
                        backgroundImage: `linear-gradient(var(--accent) 1px, transparent 1px), linear-gradient(90deg, var(--accent) 1px, transparent 1px)`,
                        backgroundSize: '40px 40px',
                        maskImage: 'radial-gradient(ellipse at center, black, transparent 80%)'
                    }} 
                />

                <div className="max-w-7xl mx-auto px-6 text-center z-10">
                    <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 px-4 py-2 rounded-full mb-8 animate-fade-in">
                        <Star className="w-4 h-4 text-accent fill-accent" />
                        <span className="text-accent text-xs font-bold uppercase tracking-widest">Plataforma #1 en Gestión Deportiva</span>
                    </div>

                    <h1
                        ref={titleRef}
                        className="text-6xl md:text-[10rem] font-black tracking-tight mb-8 leading-[0.9] text-white flex flex-col items-center justify-center font-space-grotesk"
                    >
                        <span>Pichanga</span>
                        <span className="text-accent">Libre</span>
                    </h1>

                    <p
                        ref={subtitleRef}
                        className="text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto mb-12 leading-relaxed font-medium"
                    >
                        Revoluciona tu club con el sistema de gestión más avanzado del mercado. <span className="text-white">Potenciado por IA</span> para maximizar tu rentabilidad.
                    </p>

                    <div
                        ref={ctasRef}
                        className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-24"
                    >
                        <MagneticButton>
                            <TransitionLink
                                href="/register"
                                className="group relative bg-accent text-accent-foreground px-10 py-5 rounded-xl text-xl font-black flex items-center gap-3 transition-all active:scale-95 shadow-[0_0_30px_rgba(204,255,0,0.3)] hover:shadow-[0_0_50px_rgba(204,255,0,0.5)]"
                            >
                                ¡EMPIEZA AHORA!
                                <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                            </TransitionLink>
                        </MagneticButton>
                        <MagneticButton>
                            <button
                                onClick={() => setIsVideoOpen(true)}
                                className="group glass text-white px-10 py-5 rounded-xl text-xl font-bold flex items-center gap-3 hover:bg-white/10 transition-all border border-white/10"
                            >
                                <Play className="w-6 h-6 fill-white" />
                                VER DEMO
                            </button>
                        </MagneticButton>
                    </div>

                    {/* 3D Dashboard Mockup Container */}
                    <div className="perspective-2000 w-full max-w-6xl mx-auto">
                        <div
                            ref={dashboardContainerRef}
                            className="preserve-3d relative w-full h-full"
                        >
                            <div
                                ref={dashboardRef}
                                className="relative glass rounded-[2.5rem] p-2 md:p-4 aspect-video shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)] border border-white/10"
                            >
                                {/* Inner Screen Container */}
                                <div className="relative w-full h-full rounded-[2rem] overflow-hidden bg-[#0A0A0A] border border-white/5">
                                    {/* OS Top Bar */}
                                    <div className="w-full h-10 bg-white/5 border-b border-white/5 flex items-center px-6 gap-2">
                                        <div className="flex gap-1.5">
                                            <div className="w-3 h-3 rounded-full bg-red-500/50" />
                                            <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                                            <div className="w-3 h-3 rounded-full bg-green-500/50" />
                                        </div>
                                        <div className="mx-auto text-[10px] text-white/30 font-bold uppercase tracking-[0.2em]">PichangaLibre v2.0 - Dashboard Elite</div>
                                    </div>

                                    {/* Dashboard Content Mockup */}
                                    <div className="p-8 h-full">
                                        <div className="grid grid-cols-12 gap-6 h-full">
                                            {/* Sidebar Mockup */}
                                            <div className="col-span-3 space-y-6">
                                                <div className="h-12 w-full bg-accent/20 rounded-xl flex items-center px-4 gap-3">
                                                    <TrendingUp className="w-5 h-5 text-accent" />
                                                    <div className="h-2 w-20 bg-accent/40 rounded-full" />
                                                </div>
                                                {[1, 2, 3, 4].map((i) => (
                                                    <div key={i} className="h-10 w-full bg-white/5 rounded-xl flex items-center px-4 gap-3 opacity-50">
                                                        <div className="w-5 h-5 rounded-lg bg-white/10" />
                                                        <div className="h-2 w-24 bg-white/10 rounded-full" />
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Main View Mockup */}
                                            <div className="col-span-9 space-y-6">
                                                <div className="grid grid-cols-3 gap-6">
                                                    {[1, 2, 3].map((i) => (
                                                        <div key={i} className="h-24 bg-white/5 border border-white/5 rounded-2xl p-4">
                                                            <div className="h-2 w-12 bg-white/20 rounded-full mb-4" />
                                                            <div className="h-6 w-20 bg-white/40 rounded-lg" />
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="h-[250px] bg-white/5 border border-white/5 rounded-[2rem] p-6 flex flex-col justify-end gap-4 relative overflow-hidden">
                                                    <div className="absolute inset-0 bg-gradient-to-t from-accent/10 to-transparent" />
                                                    <div className="flex items-end gap-3 h-40">
                                                        {[40, 70, 45, 90, 65, 80, 50, 85, 95, 60, 75, 55, 80, 40, 60].map((h, i) => (
                                                            <div 
                                                                key={i} 
                                                                className="flex-1 bg-accent/30 rounded-t-lg hover:bg-accent transition-colors cursor-pointer" 
                                                                style={{ height: `${h}%` }} 
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Floating 3D Elements */}
                                <FloatingCard className="absolute -top-12 -left-12 hidden lg:flex scale-110 shadow-2xl" delay={2}>
                                    <div className="w-14 h-14 rounded-2xl bg-accent/20 flex items-center justify-center shrink-0 border border-accent/20">
                                        <Zap className="text-accent w-8 h-8 fill-accent" />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Eficiencia</p>
                                        <p className="text-2xl font-black text-white">+40%</p>
                                    </div>
                                </FloatingCard>

                                <FloatingCard className="absolute top-1/4 -right-16 hidden lg:flex scale-110 shadow-2xl" delay={2.5}>
                                    <div className="w-14 h-14 rounded-2xl bg-[#00F0FF]/20 flex items-center justify-center shrink-0 border border-[#00F0FF]/20">
                                        <Shield className="text-[#00F0FF] w-8 h-8" />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Seguridad</p>
                                        <p className="text-2xl font-black text-white">PRO</p>
                                    </div>
                                </FloatingCard>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            
            <VideoModal
                isOpen={isVideoOpen}
                onClose={() => setIsVideoOpen(false)}
            />
        </>
    );
};

export default HeroSection;
