"use client";

import React, { useEffect, useState, useRef } from "react";
import { Zap, Crown, Rocket, Star, ChevronDown, Clock } from "lucide-react";
import { gsap } from "gsap";
import { useRouter } from "next/navigation";
import { users } from "@/lib/api";

const planConfig: Record<string, {
    label: string;
    icon: React.ElementType;
    gradient: string;
    glow: string;
    textColor: string;
}> = {
    free_trial: {
        label: "Prueba Gratis",
        icon: Rocket,
        gradient: "from-slate-600 to-slate-700",
        glow: "rgba(148,163,184,0.2)",
        textColor: "#94a3b8",
    },
    basic: {
        label: "Plan Basic",
        icon: Star,
        gradient: "from-indigo-600 to-violet-700",
        glow: "rgba(99,102,241,0.3)",
        textColor: "#818cf8",
    },
    pro: {
        label: "Plan Pro",
        icon: Zap,
        gradient: "from-sky-500 to-cyan-600",
        glow: "rgba(56,189,248,0.35)",
        textColor: "#38bdf8",
    },
    enterprise: {
        label: "Enterprise",
        icon: Crown,
        gradient: "from-amber-500 to-orange-600",
        glow: "rgba(245,158,11,0.35)",
        textColor: "#fbbf24",
    },
};

const getDaysLeft = (endsAt: string) => {
    const diff = new Date(endsAt).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

// FIX 1: función limpia, sin bug de precedencia de operadores
const canCollapse = (plan: string) => plan === "pro" || plan === "enterprise";

const SubscriptionWidget = () => {
    const router = useRouter();
    const [plan, setPlan] = useState<string | null>(null);
    const [endsAt, setEndsAt] = useState<string | null>(null);
    const [isActive, setIsActive] = useState<boolean>(true);
    const [collapsed, setCollapsed] = useState(false);
    const [ready, setReady] = useState(false); // FIX 2: no bloquea render esperando API
    const cardRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Carga instantánea desde localStorage
        try {
            const stored = localStorage.getItem("fieldiq_user");
            if (stored) {
                const u = JSON.parse(stored);
                setPlan(u.plan?.toLowerCase() || null);
                setEndsAt(u.subscriptionEndsAt || null);
                setIsActive(u.isActive ?? true);
            }
        } catch (_) { }
        setReady(true);

        // Refresca en segundo plano desde la BD
        const fetchPlan = async () => {
            try {
                const res = await users.getMe();
                const userPlan = res.data.plan?.toLowerCase() || null;
                setPlan(userPlan);
                setEndsAt(res.data.subscriptionEndsAt || null);
                setIsActive(res.data.isActive ?? true);

                // Sync localStorage
                const stored = localStorage.getItem("fieldiq_user");
                if (stored) {
                    const parsed = JSON.parse(stored);
                    localStorage.setItem("fieldiq_user", JSON.stringify({
                        ...parsed,
                        plan: userPlan,
                        subscriptionEndsAt: res.data.subscriptionEndsAt,
                        isActive: res.data.isActive,
                    }));
                }
            } catch (_) { }
        };
        fetchPlan();
    }, []);

    useEffect(() => {
        if (ready && cardRef.current) {
            gsap.fromTo(cardRef.current,
                { x: 80, opacity: 0 },
                { x: 0, opacity: 1, duration: 0.6, ease: "power3.out", delay: 0.8 }
            );
        }
    }, [ready]);

    // FIX 3: mide scrollHeight antes de animar la apertura
    const handleCollapse = () => {
        const el = contentRef.current;
        if (!el) return;

        if (!collapsed) {
            gsap.to(el, { height: 0, opacity: 0, duration: 0.3, ease: "power2.in" });
        } else {
            gsap.set(el, { height: "auto", opacity: 1 });
            const fullHeight = el.scrollHeight;
            gsap.fromTo(el,
                { height: 0, opacity: 0 },
                {
                    height: fullHeight, opacity: 1, duration: 0.35, ease: "power2.out",
                    onComplete: () => { gsap.set(el, { height: "auto" }); }
                }
            );
        }
        setCollapsed(c => !c);
    };

    if (!ready || !plan) return null;

    const cfg = planConfig[plan] ?? planConfig["basic"];
    const Icon = cfg.icon;
    const daysLeft = endsAt ? getDaysLeft(endsAt) : null;
    const isExpiringSoon = daysLeft !== null && daysLeft <= 7;
    const isExpiredOrSuspended = !isActive || (daysLeft !== null && daysLeft === 0);
    const endsAtFormatted = endsAt
        ? new Date(endsAt).toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" })
        : null;

    return (
        <div
            ref={cardRef}
            className="fixed bottom-6 right-6 z-40 w-64 opacity-0"
            style={{ filter: `drop-shadow(0 8px 32px ${isExpiredOrSuspended ? 'rgba(239, 68, 68, 0.4)' : cfg.glow})` }}
        >
            <div className={`relative rounded-2xl overflow-hidden bg-gradient-to-br ${isExpiredOrSuspended ? 'from-red-900 to-red-800' : cfg.gradient} border border-white/10`}>

                {/* Header siempre visible */}
                <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center">
                            <Icon size={14} className="text-white" />
                        </div>
                        <span className="text-white font-black text-sm text-shadow-sm">{cfg.label}</span>
                    </div>

                    {/* Solo plan pro y enterprise pueden colapsar el widget */}
                    {(plan === "pro" || plan === "enterprise") && (
                        <button
                            onClick={handleCollapse}
                            className="w-6 h-6 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
                        >
                            <ChevronDown
                                size={12}
                                className={`text-white/60 transition-transform duration-300 ${collapsed ? "rotate-180" : "rotate-0"}`}
                            />
                        </button>
                    )}
                </div>

                {/* Contenido colapsable */}
                <div ref={contentRef} className="overflow-hidden">
                    <div className="px-4 pb-4 space-y-3">

                        {isExpiredOrSuspended ? (
                            <div className="bg-red-500/20 rounded-xl p-3 border border-red-500/30">
                                <div className="flex items-center gap-1.5 mb-1">
                                    <span className="text-red-200 text-[10px] uppercase tracking-widest font-bold">Estado Actual</span>
                                </div>
                                <p className="text-white font-black text-lg leading-tight drop-shadow-md">
                                    Suspendido
                                </p>
                                <p className="text-red-200/80 text-xs mt-1">
                                    Tu suscripción ha expirado o está desactivada.
                                </p>
                            </div>
                        ) : (
                            daysLeft !== null && (
                                <div className="bg-black/20 rounded-xl p-3 space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5">
                                            <Clock size={11} className="text-white/50" />
                                            <span className="text-white/50 text-[10px] uppercase tracking-widest font-bold">Vence en</span>
                                        </div>
                                        {isExpiringSoon && (
                                            <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full bg-red-500/30 text-red-300 animate-pulse">
                                                ¡Pronto!
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-white font-black text-xl leading-none">
                                        {daysLeft} <span className="text-sm font-medium text-white/60">días</span>
                                    </p>
                                    {endsAtFormatted && (
                                        <p className="text-white/40 text-[10px]">{endsAtFormatted}</p>
                                    )}
                                    {endsAt && (
                                        <div className="h-1 bg-white/10 rounded-full overflow-hidden mt-1">
                                            <div
                                                className="h-full rounded-full bg-white/60 transition-all"
                                                style={{ width: `${Math.min(100, (daysLeft / 30) * 100)}%` }}
                                            />
                                        </div>
                                    )}
                                </div>
                            )
                        )}

                        <button
                            onClick={() => router.push("/dashboard/billing?apply_plan=" + plan.toUpperCase())}
                            className="w-full bg-white/15 hover:bg-white/25 border border-white/10 text-white text-xs font-black uppercase tracking-widest py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-95"
                        >
                            Actualizar Plan
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SubscriptionWidget;