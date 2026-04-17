"use client";

import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import { UserPlus, Settings, BrainCircuit, Rocket } from "lucide-react";

const steps = [
    {
        title: "Registra tu Negocio",
        description: "Crea tu cuenta empresarial y define los detalles de tu club o academia en minutos.",
        icon: UserPlus,
    },
    {
        title: "Configura tus Espacios",
        description: "Define horarios, precios dinámicos y tipos de superficie para cada una de tus canchas.",
        icon: Settings,
    },
    {
        title: "IA en Acción",
        description: "Nuestra inteligencia analiza tus datos históricos para optimizar la ocupación automáticamente.",
        icon: BrainCircuit,
    },
    {
        title: "Escala tus Ingresos",
        description: "Observa cómo aumenta tu rentabilidad mientras dedicas menos tiempo a la administración.",
        icon: Rocket,
    },
];

const HowItWorks = () => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        gsap.registerPlugin(ScrollTrigger);

        const ctx = gsap.context(() => {
            const cards = gsap.utils.toArray<HTMLDivElement>(".step-card");

            gsap.from(".header-content", {
                scrollTrigger: {
                    trigger: containerRef.current,
                    start: "top 80%",
                    toggleActions: "play reverse play reverse",
                },
                y: 30,
                opacity: 0,
                duration: 1,
            });

            cards.forEach((card) => {
                const tl = gsap.timeline({
                    scrollTrigger: {
                        trigger: card,
                        start: "top 85%",
                        end: "top 15%",
                        scrub: 1,
                        toggleActions: "play reverse play reverse",
                    }
                });

                tl.fromTo(card,
                    {
                        opacity: 0,
                        x: -80, // Desliza hacia la derecha desde la izquierda
                        scale: 0.98,
                        filter: "blur(2px)" // Desenfoque muy leve
                    },
                    {
                        opacity: 1,
                        x: 0,
                        scale: 1,
                        filter: "blur(0px)",
                        duration: 1
                    }
                );

                // Desvanecimiento suave al salir
                tl.to(card, {
                    opacity: 0.2,
                    x: 40, // Continúa deslizándose un poco al salir
                    duration: 1
                }, "+=0.5");
            });
        }, containerRef);

        return () => ctx.revert();
    }, []);

    return (
        <section id="cómo-funciona" ref={containerRef} className="py-24 px-6 relative overflow-hidden bg-background/50 transition-colors duration-300">
            {/* Background Decorative Elements */}
            <div className="absolute top-1/4 -left-20 w-96 h-96 bg-accent/5 rounded-full blur-[120px] -z-10" />

            <div className="max-w-6xl mx-auto">
                <div className="header-content text-center mb-24">
                    <h2 className="text-accent font-bold tracking-widest uppercase text-sm mb-4">El proceso</h2>
                    <h3 className="text-4xl md:text-6xl font-black text-foreground mb-6">
                        Tu camino al <span className="text-gradient">éxito</span>
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl mx-auto">
                        Hemos diseñado una transición fluida para que tu club pase de manual a inteligente en tiempo récord.
                    </p>
                </div>

                <div className="relative">
                    {/* Progress Line */}
                    <div className="absolute left-6 md:left-24 top-0 bottom-0 w-px bg-gradient-to-b from-accent/50 via-accent/20 to-transparent" />

                    <div className="space-y-24 md:space-y-32">
                        {steps.map((step, index) => (
                            <div
                                key={index}
                                className="step-card flex flex-col md:flex-row items-center gap-8 md:gap-16 relative pl-12 md:pl-32"
                            >
                                {/* Step Indicator */}
                                <div className="absolute left-0 w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-background border border-border flex items-center justify-center text-accent font-black text-xl z-10 shadow-lg dark:shadow-[0_0_15px_rgba(56,189,248,0.1)]">
                                    0{index + 1}
                                </div>

                                {/* Icon Box */}
                                <div className="shrink-0 relative group">
                                    <div className="absolute inset-0 bg-accent rounded-3xl blur-xl opacity-10 group-hover:opacity-20 transition-opacity" />
                                    <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-3xl glass flex items-center justify-center border border-white/10 group-hover:border-accent/30 transition-all">
                                        <step.icon className="w-12 h-12 md:w-16 md:h-16 text-accent" />
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="text-center md:text-left max-w-2xl">
                                    <h4 className="text-2xl md:text-3xl font-black text-foreground mb-4">
                                        {step.title}
                                    </h4>
                                    <p className="text-slate-500 dark:text-slate-400 text-lg leading-relaxed">
                                        {step.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HowItWorks;
