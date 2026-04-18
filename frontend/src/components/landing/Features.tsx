"use client";

import React, { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import {
    Calendar,
    Zap,
    BarChart3,
    ShieldCheck,
    Bell,
    Clock,
    ArrowRight
} from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const features = [
    {
        title: "Agendamiento Inteligente",
        description: "Gestiona todos los horarios de tus canchas desde un solo panel. Sin llamadas, sin papel.",
        icon: Calendar,
        stat: "3x más reservas",
        tooltip: "Tu panel muestra en tiempo real qué canchas están ocupadas, cuáles libres y cuáles en mantenimiento. Puedes bloquear horarios, crear turnos fijos para clientes frecuentes y configurar duración mínima por tipo de cancha. Todo sin salir del dashboard.",
    },
    {
        title: "Precios Dinámicos con IA",
        description: "Nuestra IA ajusta automáticamente tus tarifas según la demanda histórica y el día de la semana.",
        icon: Zap,
        stat: "+28% ingresos",
        tooltip: "El sistema analiza tus datos de los últimos 90 días y detecta los horarios de baja ocupación. Automáticamente aplica descuentos estratégicos para llenarlos y sube el precio en horas pico, maximizando tus ingresos sin que tengas que hacer nada.",
    },
    {
        title: "Reportes Financieros",
        description: "Visualiza ingresos diarios, semanales y mensuales con gráficas claras listas para compartir.",
        icon: BarChart3,
        stat: "100% visibilidad",
        tooltip: "Desde el panel de analytics puedes ver ingresos por cancha, por tipo de deporte, por método de pago y por rango de fechas. Exporta reportes en PDF o Excel para tu contador o socios en un solo clic.",
    },
    {
        title: "Cobros Automatizados",
        description: "Recibe pagos anticipados al momento de la reserva y elimina las deudas de última hora.",
        icon: ShieldCheck,
        stat: "0% deudas impagas",
        tooltip: "El sistema obliga al pago antes de confirmar la reserva. Acepta tarjetas, Yape, Plin y transferencias. Si el cliente cancela con anticipación, el reembolso es automático según tus reglas de política que tú mismo defines.",
    },
    {
        title: "Alertas y Notificaciones",
        description: "Recibe avisos automáticos de reservas nuevas, cancelaciones y pagos pendientes en tu celular.",
        icon: Bell,
        stat: "0 sorpresas",
        tooltip: "Configura qué notificaciones quieres recibir y por qué canal: WhatsApp, email o push en la app. También tus clientes reciben recordatorios automáticos 2 horas antes de su turno, reduciendo los no-shows hasta en un 60%.",
    },
    {
        title: "Recupera Tu Tiempo",
        description: "Automatiza tareas repetitivas y dedica tus horas a lo que realmente importa: crecer.",
        icon: Clock,
        stat: "8h/semana libres",
        tooltip: "Con PichangaLibre dejas de responder mensajes de '¿está disponible tal hora?', de cobrar a mano y de armar planillas. El sistema hace todo eso solo. Administradores reportan recuperar entre 6 y 10 horas semanales desde el primer mes.",
    }
];

const Tooltip = ({ text, visible }: { text: string; visible: boolean }) => {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!ref.current) return;
        gsap.to(ref.current, {
            opacity: visible ? 1 : 0,
            y: visible ? 0 : 8,
            scale: visible ? 1 : 0.95,
            duration: 0.25,
            ease: "power2.out",
        });
    }, [visible]);

    return (
        <div
            ref={ref}
            className="absolute bottom-full left-0 mb-3 w-72 z-50 opacity-0 pointer-events-none"
        >
            <div className="relative bg-slate-900 dark:bg-slate-800 border border-accent/30 rounded-2xl p-4 shadow-2xl shadow-black/40">
                {/* Línea accent top */}
                <div className="absolute top-0 left-6 right-6 h-[1.5px] bg-gradient-to-r from-transparent via-accent to-transparent rounded-full" />
                <p className="text-slate-300 text-[13px] leading-relaxed">{text}</p>
                {/* Flecha */}
                <div className="absolute -bottom-[7px] left-6 w-3.5 h-3.5 bg-slate-900 dark:bg-slate-800 border-r border-b border-accent/30 rotate-45" />
            </div>
        </div>
    );
};

const FeatureCard = ({ feature, index }: { feature: typeof features[0]; index: number }) => {
    const [hovered, setHovered] = useState(false);
    const [tooltipVisible, setTooltipVisible] = useState(false);
    const lineRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!lineRef.current) return;
        gsap.to(lineRef.current, {
            scaleX: hovered ? 1 : 0,
            duration: 0.4,
            ease: "power2.out",
        });
    }, [hovered]);

    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => { setHovered(false); setTooltipVisible(false); }}
            className="feature-card glass p-8 rounded-3xl border-border hover:border-accent/40 transition-all duration-500 group relative overflow-visible flex flex-col"
        >
            {/* Número decorativo */}
            <span className="absolute top-6 right-7 text-6xl font-black text-foreground/[0.04] group-hover:text-foreground/[0.07] transition-colors duration-500 select-none leading-none">
                {String(index + 1).padStart(2, "0")}
            </span>

            {/* Línea accent inferior */}
            <div
                ref={lineRef}
                className="absolute bottom-0 left-0 h-[2px] w-full bg-accent origin-left rounded-b-3xl"
                style={{ transform: "scaleX(0)" }}
            />

            {/* Ícono */}
            <div className="w-14 h-14 rounded-2xl bg-foreground/5 flex items-center justify-center mb-6 group-hover:bg-accent/10 group-hover:scale-110 transition-all duration-500">
                <feature.icon className="w-7 h-7 text-accent" />
            </div>

            {/* Stat pill */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 w-fit mb-4">
                <span className="text-[10px] font-black text-accent uppercase tracking-widest">{feature.stat}</span>
            </div>

            <h4 className="text-xl font-bold text-foreground group-hover:text-accent transition-colors duration-300 mb-3">
                {feature.title}
            </h4>

            <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm flex-1">
                {feature.description}
            </p>

            {/* Saber más + Tooltip */}
            <div className="relative mt-5">
                <Tooltip text={feature.tooltip} visible={tooltipVisible} />
                <button
                    onMouseEnter={() => setTooltipVisible(true)}
                    onMouseLeave={() => setTooltipVisible(false)}
                    className={`flex items-center gap-1.5 text-accent text-xs font-bold uppercase tracking-widest transition-all duration-300 ${hovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                        }`}
                >
                    Saber más
                    <ArrowRight size={13} className={`transition-transform duration-300 ${tooltipVisible ? "translate-x-1" : ""}`} />
                </button>
            </div>
        </div>
    );
};

const Features = () => {
    const sectionRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        gsap.set(".feature-card", { y: 60, opacity: 0 });

        const ctx = gsap.context(() => {
            gsap.to(".feature-card", {
                scrollTrigger: {
                    trigger: sectionRef.current,
                    start: "top 85%",
                    toggleActions: "play reverse play reverse"
                },
                y: 0,
                opacity: 1,
                duration: 1,
                stagger: 0.1,
                ease: "power4.out"
            });
        }, sectionRef);

        setTimeout(() => ScrollTrigger.refresh(), 500);
        return () => ctx.revert();
    }, []);

    return (
        <section
            id="características"
            ref={sectionRef}
            className="py-24 px-6 relative overflow-visible"
        >
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-accent font-bold tracking-widest uppercase text-sm mb-4">
                        Hecho para Administradores
                    </h2>
                    <h3 className="text-4xl md:text-5xl font-black text-foreground mb-6">
                        Todo lo que necesitas para <br /> una gestión de
                        <span className="text-gradient"> elite</span>
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl mx-auto">
                        PichangaLibre centraliza toda tu operación deportiva, elimina errores humanos y te devuelve el tiempo que pierdes en tareas repetitivas.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((feature, index) => (
                        <FeatureCard key={index} feature={feature} index={index} />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Features;