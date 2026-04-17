"use client";

import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);
import { Star, Quote } from "lucide-react";

const testimonials = [
    {
        name: "Carlos Rodríguez",
        role: "Dueño de Arena Sport",
        content: "FieldIQ transformó nuestra gestión. Pasamos de perder reservas por WhatsApp a tener el 90% automatizado.",
        image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=100&auto=format&fit=crop"
    },
    {
        name: "Ana Martínez",
        role: "Administradora Club Padel Pro",
        content: "La IA nos avisó que debíamos subir precios el domingo pasado y fue un éxito. La precisión es increíble.",
        image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=100&auto=format&fit=crop"
    },
    {
        name: "Luis Fernando",
        role: "Gestor de Complejos Municipales",
        content: "Finalmente una plataforma que entiende el mercado deportivo local. Fácil de usar y muy potente.",
        image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=100&auto=format&fit=crop"
    }
];

const Testimonials = () => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from(".testimonial-card", {
                scrollTrigger: {
                    trigger: containerRef.current,
                    start: "top 80%",
                    toggleActions: "play reverse play reverse"
                },
                scale: 0.9,
                opacity: 0,
                y: 30,
                stagger: 0.2,
                duration: 1,
                ease: "back.out(1.7)"
            });
        }, containerRef);
        return () => ctx.revert();
    }, []);

    return (
        <section id="testimonios" ref={containerRef} className="py-24 px-6 bg-background relative overflow-hidden transition-colors duration-300">
            <div className="absolute top-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-[120px] -z-10" />

            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-accent font-bold tracking-widest uppercase text-sm mb-4">Lo que dicen de nosotros</h2>
                    <h3 className="text-4xl md:text-5xl font-black text-foreground mb-6">Historias de <span className="text-gradient">éxito real</span></h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {testimonials.map((t, i) => (
                        <div key={i} className="testimonial-card glass p-8 rounded-3xl relative group hover:border-accent/40 transition-colors">
                            <Quote className="absolute top-6 right-8 w-12 h-12 text-white/5 group-hover:text-accent/10 transition-colors" />
                            <div className="flex gap-1 mb-6">
                                {[...Array(5)].map((_, star) => (
                                    <Star key={star} className="w-4 h-4 text-amber-500 fill-amber-500" />
                                ))}
                            </div>
                            <p className="text-slate-600 dark:text-slate-300 mb-8 italic leading-relaxed">"{t.content}"</p>
                            <div className="flex items-center gap-4">
                                <img src={t.image} alt={t.name} className="w-12 h-12 rounded-full border-2 border-accent/20" />
                                <div>
                                    <h5 className="text-foreground font-bold text-sm">{t.name}</h5>
                                    <p className="text-slate-500 text-xs">{t.role}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Testimonials;
