"use client";

import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const stats = [
    { label: "Usuarios Activos", value: "15k+", detail: "En toda la región" },
    { label: "Canchas Registradas", value: "200+", detail: "Clubes de elite" },
    { label: "Reservas Mensuales", value: "50k+", detail: "Creciendo exponencialmente" },
    { label: "Ahorro de Tiempo", value: "40%", detail: "Para administradores" },
];

const repeated = [...stats, ...stats, ...stats];

const StatsSection = () => {
    const trackRef = useRef<HTMLDivElement>(null);
    const tweenRef = useRef<gsap.core.Tween | null>(null);
    const sectionRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const track = trackRef.current;
        if (!track) return;

        const totalWidth = track.scrollWidth;
        const oneThird = totalWidth / 3;

        gsap.set(track, { x: -oneThird });

        tweenRef.current = gsap.to(track, {
            x: `-=${oneThird}`,
            duration: 18,
            ease: "none",
            repeat: -1,
            modifiers: {
                x: (x) => {
                    const val = parseFloat(x);
                    if (val <= -oneThird * 2) return `${-oneThird}px`;
                    return `${val}px`;
                }
            }
        });

        return () => { tweenRef.current?.kill(); };
    }, []);

    return (
        <section
            ref={sectionRef}
            className="py-16 md:py-20 relative overflow-hidden bg-foreground/5 transition-colors duration-300"
        >
            {/* Fade masks */}
            <div className="absolute inset-y-0 left-0 w-32 z-10 pointer-events-none"
                style={{ background: "linear-gradient(to right, var(--background), transparent)" }} />
            <div className="absolute inset-y-0 right-0 w-32 z-10 pointer-events-none"
                style={{ background: "linear-gradient(to left, var(--background), transparent)" }} />

            <div className="overflow-hidden">
                <div ref={trackRef} className="flex gap-0 will-change-transform">
                    {repeated.map((stat, index) => (
                        <div
                            key={index}
                            className="flex-shrink-0 flex items-center gap-12 px-12"
                        >
                            {/* Stat — resalte en hover sin pausar */}
                            <div className="text-center min-w-[160px] group cursor-default select-none">
                                <h4 className="text-5xl md:text-6xl font-black text-gradient mb-1 transition-all duration-300 group-hover:scale-110 group-hover:drop-shadow-[0_0_18px_rgba(56,189,248,0.5)]">
                                    {stat.value}
                                </h4>
                                <p className="text-slate-700 dark:text-slate-200 font-bold text-sm mb-0.5 transition-colors duration-300 group-hover:text-accent">
                                    {stat.label}
                                </p>
                                <p className="text-slate-500 text-[10px] uppercase tracking-widest transition-colors duration-300 group-hover:text-slate-400">
                                    {stat.detail}
                                </p>
                            </div>

                            {/* Separador */}
                            <div className="flex flex-col items-center gap-1 opacity-20">
                                <div className="w-1 h-1 rounded-full bg-foreground" />
                                <div className="w-1 h-6 rounded-full bg-foreground" />
                                <div className="w-1 h-1 rounded-full bg-foreground" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default StatsSection;