"use client";

import React, { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
    CheckCircle2, Loader2, Zap, Shield, Lock,
    BadgeCheck, ChevronRight, AlertOctagon, Sparkles, Crown, Star, Rocket
} from "lucide-react";
import { gsap } from "gsap";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const plans = [
    {
        id: "BASIC",
        name: "Básico",
        price: 79,
        description: "Ideal para canchas individuales o clubes pequeños que quieren crecer.",
        features: ["Hasta 5 canchas", "Reservas Online", "Reportes Básicos", "Soporte por Email"],
        icon: Star,
        accent: "#10b981",
        accentLight: "#34d399",
        highlighted: false,
    },
    {
        id: "PRO",
        name: "Pro",
        price: 109,
        description: "Para academias y complejos en crecimiento constante que exigen más.",
        features: ["Canchas ilimitadas", "IA Predictiva", "Pagos Automatizados", "Dashboards Avanzados", "Soporte 24/7"],
        icon: Zap,
        accent: "#38bdf8",
        accentLight: "#7dd3fc",
        highlighted: true,
    },
    {
        id: "ENTERPRISE",
        name: "Enterprise",
        price: null,
        description: "Soluciones a medida para grandes franquicias.",
        features: ["Multi-sedes", "Integración API", "Gerente de Cuenta", "Capacitación"],
        icon: Crown,
        accent: "#f59e0b",
        accentLight: "#fbbf24",
        highlighted: false,
    },
];

function BillingContent() {
    const searchParams = useSearchParams();

    const startingStep = searchParams.get("status") === "success"
        ? "success"
        : (searchParams.get("apply_plan") ? "plans" : "warning");

    const [step, setStep] = useState<"warning" | "plans" | "success">(startingStep);
    const [selectedPlan, setSelectedPlan] = useState(searchParams.get("apply_plan")?.toUpperCase() || "PRO");
    const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
    const [errorMessage, setErrorMessage] = useState("");

    const warningRef = useRef<HTMLDivElement>(null);
    const plansRef = useRef<HTMLDivElement>(null);

    // Update local config instantly on return from gateway
    useEffect(() => {
        if (searchParams.get("status") === "success") {
            const userStr = localStorage.getItem("fieldiq_user");
            if (userStr) {
                try {
                    const usr = JSON.parse(userStr);
                    localStorage.setItem("fieldiq_user", JSON.stringify({ ...usr, isActive: true, plan: "PRO" }));
                } catch (e) { }
            }
        }
    }, [searchParams]);

    // Animate warning step in
    useEffect(() => {
        if (step === "warning" && warningRef.current) {
            const tl = gsap.timeline();
            tl.fromTo(".warn-icon", { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(2)" })
                .fromTo(".warn-title", { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "power3.out" }, "-=0.2")
                .fromTo(".warn-sub", { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: "power3.out" }, "-=0.2")
                .fromTo(".warn-btn", { y: 20, opacity: 0, scale: 0.95 }, { y: 0, opacity: 1, scale: 1, duration: 0.4, ease: "power3.out" }, "-=0.1");
        }
    }, [step]);

    // Animate plans step in
    useEffect(() => {
        if (step === "plans" && plansRef.current) {
            gsap.fromTo(".plans-header", { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "power3.out" });
            gsap.fromTo(".plan-card", { y: 50, opacity: 0, scale: 0.95 },
                { y: 0, opacity: 1, scale: 1, duration: 0.6, stagger: 0.1, ease: "power3.out", delay: 0.2 });
            gsap.fromTo(".plans-footer", { opacity: 0 }, { opacity: 1, duration: 0.5, delay: 0.6 });
        }
    }, [step]);

    const handleGoToPlans = () => {
        setStep("plans");
    };

    const handlePay = async () => {
        setStatus("loading");
        try {
            const token = localStorage.getItem("fieldiq_token");
            const plan = plans.find(p => p.id === selectedPlan)!;

            const response = await axios.post(
                `${API_URL}/mercadopago/create-preference`,
                { planName: plan.name, price: plan.price },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.init_point || response.data.sandbox_init_point) {
                window.location.href = response.data.init_point;
            } else {
                throw new Error("No se pudo obtener el link de pago");
            }
        } catch (err: any) {
            setStatus("error");
            setErrorMessage(err.response?.data?.message || "Error al conectar con Mercado Pago.");
        }
    };

    // ── SUCCESS ──────────────────────────────────────────────────
    if (step === "success") {
        return (
            <div className="flex items-center justify-center min-h-[80vh] px-6">
                <div className="text-center max-w-sm space-y-6">
                    <div className="relative inline-flex items-center justify-center">
                        <div className="absolute w-36 h-36 bg-emerald-500/20 rounded-full blur-2xl animate-pulse" />
                        <div className="relative w-24 h-24 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="w-12 h-12 text-emerald-400" />
                        </div>
                    </div>
                    <h1 className="text-4xl font-black text-foreground tracking-tight">¡Ya estás activo!</h1>
                    <p className="text-foreground/50 leading-relaxed">
                        Tu suscripción se activó correctamente. Empieza a gestionar tus canchas ahora mismo.
                    </p>
                    <button
                        onClick={() => window.location.href = "/dashboard"}
                        className="w-full bg-accent text-accent-foreground py-4 rounded-2xl font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                    >
                        Ir a mi Dashboard <ChevronRight size={16} />
                    </button>
                </div>
            </div>
        );
    }

    // ── WARNING STEP ─────────────────────────────────────────────
    if (step === "warning") {
        return (
            <div ref={warningRef} className="flex items-center justify-center min-h-[80vh] px-6">
                <div className="text-center max-w-lg space-y-8">

                    {/* Animated icon */}
                    <div className="warn-icon inline-flex items-center justify-center relative opacity-0">
                        <div className="absolute w-40 h-40 bg-red-500/10 rounded-full blur-3xl animate-pulse" />
                        <div className="absolute w-28 h-28 bg-red-500/15 rounded-full blur-xl" />
                        <div className="relative w-24 h-24 bg-red-500/10 border-2 border-red-500/30 rounded-full flex items-center justify-center">
                            <AlertOctagon className="w-11 h-11 text-red-400" strokeWidth={1.5} />
                        </div>
                    </div>

                    {/* Text */}
                    <div className="space-y-4">
                        <div className="warn-title opacity-0">
                            <p className="text-red-400 text-xs font-black uppercase tracking-[0.3em] mb-3">
                                Cuenta Inactiva
                            </p>
                            <h1 className="text-5xl md:text-6xl font-black text-foreground tracking-tight leading-none">
                                Tu acceso<br />
                                <span style={{
                                    background: "linear-gradient(135deg, #f87171, #ef4444)",
                                    WebkitBackgroundClip: "text",
                                    WebkitTextFillColor: "transparent",
                                    backgroundClip: "text",
                                }}>
                                    ha expirado
                                </span>
                            </h1>
                        </div>

                        <p className="warn-sub text-foreground/50 text-lg leading-relaxed max-w-md mx-auto opacity-0">
                            Tu suscripción ya no está activa. Para seguir gestionando tus canchas, reservas y reportes, necesitas renovar tu plan.
                        </p>
                    </div>

                    {/* What you lose */}
                    <div className="warn-sub opacity-0 grid grid-cols-3 gap-3 text-sm">
                        {[
                            { icon: "📅", label: "Sin reservas online" },
                            { icon: "📊", label: "Sin reportes" },
                            { icon: "🤖", label: "Sin IA predictiva" },
                        ].map((item, i) => (
                            <div key={i} className="glass rounded-2xl p-3 border border-red-500/10 bg-red-500/5">
                                <div className="text-2xl mb-1">{item.icon}</div>
                                <p className="text-foreground/40 text-xs font-semibold">{item.label}</p>
                            </div>
                        ))}
                    </div>

                    {/* CTA */}
                    <div className="warn-btn opacity-0 space-y-3">
                        <button
                            onClick={handleGoToPlans}
                            className="w-full relative group py-5 rounded-2xl font-black text-base uppercase tracking-widest flex items-center justify-center gap-3 transition-all duration-300 overflow-hidden"
                            style={{
                                background: "linear-gradient(135deg, #0284c7, #38bdf8)",
                                color: "#fff",
                                boxShadow: "0 8px 32px rgba(56,189,248,0.3)",
                            }}
                        >
                            <Sparkles size={18} className="animate-pulse" />
                            Reactivar mi cuenta
                            <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                        <p className="text-foreground/25 text-xs">
                            Sin cargos ocultos · Cancela cuando quieras
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // ── PLANS STEP ───────────────────────────────────────────────
    const activePlan = plans.find(p => p.id === selectedPlan) || plans[1];

    return (
        <div ref={plansRef} className="max-w-5xl mx-auto px-6 py-12 space-y-10">

            {/* Header */}
            <div className="plans-header text-center opacity-0 space-y-2">
                <p className="text-accent text-xs font-black uppercase tracking-[0.3em]">Elige tu plan</p>
                <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tight">
                    Vuelve a estar en control
                </h1>
                <p className="text-foreground/40 text-base max-w-md mx-auto">
                    Selecciona el plan que mejor se adapte a tu complejo y reactiva tu cuenta al instante.
                </p>
            </div>

            {/* Plan cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {plans.map((plan) => {
                    const Icon = plan.icon;
                    const isSelected = selectedPlan === plan.id;

                    return (
                        <button
                            key={plan.id}
                            onClick={() => plan.price !== null && setSelectedPlan(plan.id)}
                            className={`plan-card opacity-0 text-left relative rounded-[2rem] p-7 border transition-all duration-300 glass flex flex-col gap-5 ${isSelected
                                ? "border-accent shadow-[0_0_40px_rgba(56,189,248,0.15)]"
                                : "border-border hover:border-foreground/20"
                                } ${plan.price === null ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                        >
                            {/* Selected indicator */}
                            {isSelected && (
                                <div className="absolute top-4 right-4 w-5 h-5 rounded-full bg-accent flex items-center justify-center">
                                    <CheckCircle2 size={12} className="text-white fill-white" />
                                </div>
                            )}

                            {plan.highlighted && (
                                <div
                                    className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5"
                                    style={{ background: plan.accent, color: "#000" }}
                                >
                                    <Star size={10} fill="currentColor" /> Más popular
                                </div>
                            )}

                            {/* Top color wash */}
                            <div
                                className="absolute top-0 left-0 right-0 h-32 rounded-t-[2rem] opacity-10 pointer-events-none"
                                style={{ background: `linear-gradient(to bottom, ${plan.accent}, transparent)` }}
                            />

                            <div className="relative">
                                <div
                                    className="w-11 h-11 rounded-2xl flex items-center justify-center mb-4"
                                    style={{ background: `${plan.accent}18`, border: `1px solid ${plan.accent}30` }}
                                >
                                    <Icon size={20} style={{ color: plan.accentLight }} />
                                </div>

                                <p
                                    className="text-xs font-black uppercase tracking-widest mb-1"
                                    style={{ color: plan.accentLight }}
                                >
                                    {plan.name}
                                </p>
                                <p className="text-foreground/40 text-xs leading-relaxed">{plan.description}</p>
                            </div>

                            <div className="relative">
                                {plan.price !== null ? (
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-foreground/30 text-sm">S/</span>
                                        <span className="text-4xl font-black text-foreground">{plan.price}</span>
                                        <span className="text-foreground/30 text-xs">/mes</span>
                                    </div>
                                ) : (
                                    <span className="text-2xl font-black" style={{ color: plan.accentLight }}>Custom</span>
                                )}
                            </div>

                            {/* Divider */}
                            <div
                                className="h-px w-full"
                                style={{ background: `linear-gradient(to right, transparent, ${plan.accent}40, transparent)` }}
                            />

                            <ul className="relative space-y-2.5">
                                {plan.features.map((f, i) => (
                                    <li key={i} className="flex items-center gap-2.5 text-sm text-foreground/60">
                                        <div className="w-4 h-4 rounded-md flex items-center justify-center flex-shrink-0"
                                            style={{ background: `${plan.accent}18` }}>
                                            <CheckCircle2 size={10} style={{ color: plan.accentLight }} />
                                        </div>
                                        {f}
                                    </li>
                                ))}
                            </ul>
                        </button>
                    );
                })}
            </div>

            {/* Pay button + trust */}
            <div className="plans-footer opacity-0 max-w-md mx-auto space-y-4">
                <button
                    onClick={handlePay}
                    disabled={status === "loading"}
                    className="w-full flex items-center justify-center gap-3 py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all duration-300 disabled:opacity-50"
                    style={{
                        background: "linear-gradient(135deg, #009EE3, #00BCFF)",
                        color: "#fff",
                        boxShadow: "0 8px 32px rgba(0,158,227,0.35)",
                    }}
                >
                    {status === "loading" ? (
                        <><Loader2 className="w-5 h-5 animate-spin" /> Procesando...</>
                    ) : (
                        <>
                            <svg viewBox="0 0 48 48" className="w-5 h-5 fill-white flex-shrink-0">
                                <path d="M24 4C12.95 4 4 12.95 4 24s8.95 20 20 20 20-8.95 20-20S35.05 4 24 4zm0 36c-8.82 0-16-7.18-16-16S15.18 8 24 8s16 7.18 16 16-7.18 16-16 16z" />
                            </svg>
                            Pagar Plan {activePlan.name} — S/ {activePlan.price}/mes
                            <ChevronRight size={16} />
                        </>
                    )}
                </button>

                {status === "error" && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center">
                        {errorMessage}
                    </div>
                )}

                <div className="flex items-center justify-center gap-5 text-foreground/25">
                    {[
                        { icon: Shield, label: "Pago seguro" },
                        { icon: Lock, label: "Encriptado" },
                        { icon: BadgeCheck, label: "Sin permanencia" },
                    ].map(({ icon: Icon, label }) => (
                        <div key={label} className="flex items-center gap-1.5 text-xs">
                            <Icon size={11} /> {label}
                        </div>
                    ))}
                </div>

                <p className="text-center text-foreground/20 text-xs">
                    Acepta Yape · Plin · Visa · Mastercard
                </p>
            </div>
        </div>
    );
}

export default function BillingPage() {
    return (
        <Suspense fallback={<div className="min-h-[80vh] flex items-center justify-center"><p className="text-foreground/50 animate-pulse">Cargando...</p></div>}>
            <BillingContent />
        </Suspense>
    );
}