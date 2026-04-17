"use client";

import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import { Brain, Cpu, Sparkles } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const AISection = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const graphRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from(".ai-content", {
                scrollTrigger: {
                    trigger: containerRef.current,
                    start: "top 70%",
                    toggleActions: "play reverse play reverse"
                },
                y: 50,
                opacity: 0,
                duration: 1,
                ease: "power3.out",
            });

            // Animate the simulated graph bars
            gsap.set(".graph-bar", { scaleY: 0, transformOrigin: "bottom" });
            gsap.to(".graph-bar", {
                scrollTrigger: {
                    trigger: graphRef.current,
                    start: "top 85%",
                    toggleActions: "play reverse play reverse"
                },
                scaleY: 1,
                stagger: 0.1,
                duration: 1.5,
                ease: "power4.out",
            });
        }, containerRef);

        setTimeout(() => ScrollTrigger.refresh(), 600);
        return () => ctx.revert();
    }, []);

    return (
        <section id="ia" ref={containerRef} className="py-24 px-6 relative">
            <div
                className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
                style={{
                    backgroundImage: "linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)",
                    backgroundSize: "60px 60px",
                }}
            />
            <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
                <div className="ai-content lg:w-1/2">
                    <div className="flex items-center gap-2 text-accent font-bold mb-4">
                        <Sparkles className="w-5 h-5" />
                        <span>TECNOLOGÍA PROPIA</span>
                    </div>
                    <h2 className="text-4xl md:text-6xl font-black text-foreground mb-6 leading-tight">
                        Predicción basada en <br />
                        <span className="text-gradient">Inteligencia Artificial</span>
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-lg mb-8 max-w-xl leading-relaxed">
                        Nuestro microservicio de IA analiza patrones de reserva, clima y estacionalidad para darte sugerencias de precios y personal operativo en tiempo real.
                    </p>

                    <div className="space-y-6">
                        {[
                            { icon: Brain, title: "Análisis de Datos Históricos", text: "Procesa años de reservas en segundos." },
                            { icon: Cpu, title: "Optimización Automática", text: "Ajusta la disponibilidad según la demanda proyectada." },
                        ].map((item, i) => (
                            <div key={i} className="flex gap-4 p-6 glass rounded-2xl hover:bg-white/10 transition-colors">
                                <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center shrink-0">
                                    <item.icon className="text-accent w-6 h-6" />
                                </div>
                                <div>
                                    <h5 className="text-foreground font-bold mb-1">{item.title}</h5>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm">{item.text}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="lg:w-1/2 w-full p-8 glass rounded-[2rem] relative bg-slate-100/50 dark:bg-slate-900/40 overflow-hidden group">
                    {/* Glow Background Effect */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full blur-[100px] -z-10 group-hover:bg-accent/20 transition-colors duration-1000" />

                    {/* Graph Visualization */}
                    <div className="mb-8 flex items-center justify-between">
                        <div>
                            <h4 className="text-foreground font-bold text-lg">Proyección de Ocupación</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Basado en clima + historial</p>
                        </div>
                        <div className="text-[10px] text-accent font-bold px-2 py-1 bg-accent/10 rounded-md border border-accent/20">
                            PRÓXIMAS 12 HORAS
                        </div>
                    </div>

                    <div className="relative h-64 w-full">
                        {/* Grid Lines */}
                        <div className="absolute inset-0 flex flex-col justify-between py-1 opacity-20">
                            {[100, 75, 50, 25, 0].map((val) => (
                                <div key={val} className="w-full border-t border-slate-300 dark:border-slate-700 flex items-center">
                                    <span className="text-[8px] text-slate-500 -ml-6">{val}%</span>
                                </div>
                            ))}
                        </div>

                        <div ref={graphRef} className="absolute inset-0 flex items-end gap-2 px-2 pb-6">
                            {[40, 65, 45, 80, 55, 90, 75, 60, 85, 95, 70, 50].map((h, i) => (
                                <div key={i} className="flex-1 group/bar relative h-full flex items-end">
                                    <div
                                        className="graph-bar w-full bg-gradient-to-t from-accent/10 via-accent/40 to-accent rounded-t-sm transition-all duration-300 group-hover/bar:brightness-125 shadow-[0_0_15px_rgba(56,189,248,0.2)]"
                                        style={{ height: `${h}%` }}
                                    >
                                        <div className="absolute top-0 left-0 w-full h-1 bg-white/40 rounded-t-sm" />
                                    </div>

                                    {/* Tooltip */}
                                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-100 dark:bg-slate-800 text-foreground text-[9px] px-2 py-1 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap z-10 border border-border pointer-events-none font-bold shadow-md">
                                        Demanda: <span className="text-accent">{h}%</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* X-Axis Labels */}
                        <div className="absolute bottom-0 left-0 w-full flex justify-between px-2 text-[8px] text-slate-500 font-bold uppercase tracking-wider">
                            <span>Ahora</span>
                            <span>+3h</span>
                            <span>+6h</span>
                            <span>+9h</span>
                            <span>+12h</span>
                        </div>
                    </div>

                    <div className="mt-8 pt-8 border-t border-border flex items-center justify-between text-sm">
                        <div className="flex items-center gap-3">
                            <div className="flex -space-x-1">
                                <div className="w-2 h-2 rounded-full bg-accent animate-ping" />
                                <div className="w-2 h-2 rounded-full bg-accent absolute" />
                            </div>
                            <span className="text-slate-600 dark:text-slate-300 font-medium">Sugerencia: <span className="text-foreground">Aumentar personal (18:00 - 21:00)</span></span>
                        </div>
                        <div className="text-slate-500 dark:text-slate-400 font-mono text-xs bg-foreground/5 px-2 py-1 rounded">ACCURACY: 98.4%</div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default AISection;
