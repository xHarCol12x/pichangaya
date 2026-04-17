"use client";

import React, { useEffect, useRef } from "react";
import { UserCheck, Zap, Heart } from "lucide-react";
import { gsap } from "gsap";

const audiences = [
    {
        title: "Administradores",
        subtitle: "Control total y ahorro de tiempo",
        description: "Automatiza la gestión de horarios, pagos y reportes en una sola pantalla.",
        image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=800&auto=format&fit=crop",
        icon: UserCheck
    },
    {
        title: "Deportistas",
        subtitle: "Reservas en un clic",
        description: "Encuentra tu cancha favorita, reserva y paga en segundos desde tu móvil.",
        image: "https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=800&auto=format&fit=crop",
        icon: Zap
    },
    {
        title: "Comunidades",
        subtitle: "Más deporte, más vida",
        description: "Fomenta la competencia sana y organiza torneos con facilidad.",
        image: "https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?q=80&w=800&auto=format&fit=crop",
        icon: Heart
    }
];

const AudienceSection = () => {
    const sectionRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from(".audience-card", {
                scrollTrigger: {
                    trigger: sectionRef.current,
                    start: "top 80%",
                    toggleActions: "play reverse play reverse"
                },
                y: 60,
                opacity: 0,
                stagger: 0.2,
                duration: 1,
                ease: "power4.out"
            });
        }, sectionRef);

        return () => ctx.revert();
    }, []);

    return (
        <section ref={sectionRef} className="py-24 px-6 relative overflow-hidden bg-background transition-colors duration-500">

            {/* Fondo decorativo que cambia con el tema */}
            <div className="absolute inset-0 pointer-events-none">
                <div
                    className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
                    style={{
                        backgroundImage: "linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)",
                        backgroundSize: "60px 60px",
                    }}
                />
                <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full blur-[120px] bg-accent/5 dark:bg-accent/10 transition-colors duration-500" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full blur-[120px] bg-accent/3 dark:bg-accent/8 transition-colors duration-500" />
            </div>

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="text-center mb-16">
                    <h2 className="text-accent font-bold tracking-widest uppercase text-sm mb-4">
                        Diseñado para Todos
                    </h2>
                    <h3 className="text-4xl md:text-5xl font-black text-foreground mb-6 transition-colors duration-500">
                        La solución definitiva para <br />
                        <span className="text-gradient">todo el ecosistema deportivo</span>
                    </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {audiences.map((item, index) => (
                        <div key={index} className="audience-card group relative rounded-[2.5rem] overflow-hidden aspect-[4/5] shadow-2xl dark:shadow-none">
                            {/* Imagen de fondo — más oscura en light mode para que el texto sea legible */}
                            <img
                                src={item.image}
                                alt={item.title}
                                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 brightness-[0.35] dark:brightness-50"
                            />

                            {/* Overlay — más intenso en light para garantizar contraste */}
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-slate-800/20 dark:from-slate-950 dark:via-slate-950/20 dark:to-transparent" />

                            {/* Borde sutil que se nota más en light mode */}
                            <div className="absolute inset-0 rounded-[2.5rem] ring-1 ring-inset ring-black/20 dark:ring-white/5" />

                            {/* Content */}
                            <div className="absolute inset-0 p-8 flex flex-col justify-end">
                                <div className="w-12 h-12 bg-accent rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(56,189,248,0.4)] group-hover:rotate-6 transition-transform">
                                    <item.icon className="text-accent-foreground w-6 h-6" />
                                </div>
                                <h4 className="text-[10px] text-accent font-black uppercase tracking-[0.2em] mb-2">{item.subtitle}</h4>
                                <h5 className="text-3xl font-black text-white mb-4 leading-none">{item.title}</h5>
                                <p className="text-slate-200 text-sm leading-relaxed opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                                    {item.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default AudienceSection;