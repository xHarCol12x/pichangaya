"use client";

import React, { useEffect, useState } from "react";
import { Bell, User, Search, LockKeyhole, Loader2 } from "lucide-react";
import { users } from "@/lib/api";

// Gradiente por plan
const planConfig: Record<string, { gradient: string; label: string; glow: string }> = {
    FREE_TRIAL: {
        gradient: "from-slate-400 to-slate-500",
        label: "Prueba Gratis",
        glow: "shadow-[0_0_15px_rgba(148,163,184,0.3)]",
    },
    BASIC: {
        gradient: "from-indigo-500 to-violet-500",
        label: "Plan Básico",
        glow: "shadow-[0_0_15px_rgba(99,102,241,0.4)]",
    },
    PRO: {
        gradient: "from-sky-500 to-accent",
        label: "Plan Pro",
        glow: "shadow-[0_0_15px_rgba(56,189,248,0.4)]",
    },
    ENTERPRISE: {
        gradient: "from-amber-500 to-orange-500",
        label: "Plan Enterprise",
        glow: "shadow-[0_0_15px_rgba(245,158,11,0.4)]",
    },
};

const TopBar = () => {
    const [userName, setUserName] = useState("Admin");
    const [isActive, setIsActive] = useState<boolean | null>(null); // null = cargando
    const [plan, setPlan] = useState<string | null>(null);

    useEffect(() => {
        const fetchMe = async () => {
            try {
                const res = await users.getMe();
                const user = res.data;

                setUserName(user.name || "Usuario");
                setIsActive(user.isActive ?? false);
                setPlan(user.plan || null); // ej: "PRO", "STARTER", "ENTERPRISE"

                // Actualiza también el localStorage para que el layout lo use
                const stored = localStorage.getItem("fieldiq_user");
                if (stored) {
                    const parsed = JSON.parse(stored);
                    localStorage.setItem("fieldiq_user", JSON.stringify({
                        ...parsed,
                        isActive: user.isActive,
                        plan: user.plan,
                    }));
                }
            } catch {
                // Fallback a localStorage si la BD falla
                try {
                    const stored = localStorage.getItem("fieldiq_user");
                    if (stored) {
                        const user = JSON.parse(stored);
                        setUserName(user.name || "Usuario");
                        setIsActive(user.isActive ?? false);
                        setPlan(user.plan || null);
                    }
                } catch (_) { }
            }
        };

        fetchMe();
    }, []);

    const loading = isActive === null;
    const active = isActive === true;
    const currentPlan = plan && planConfig[plan] ? planConfig[plan] : null;

    return (
        <div className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-background/50 backdrop-blur-sm sticky top-0 z-20">
            <div className="flex items-center gap-4 flex-1">
                <div className="relative w-96 max-w-full group">
                    {/* Ícono izquierdo */}
                    {loading ? (
                        <Loader2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 animate-spin" />
                    ) : active ? (
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-accent transition-colors" />
                    ) : (
                        <LockKeyhole className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                    )}

                    <input
                        type="text"
                        disabled={!active || loading}
                        placeholder={
                            loading
                                ? "Cargando..."
                                : active
                                    ? "Buscar reservas, canchas o clientes..."
                                    : "Activa tu plan para usar el buscador"
                        }
                        className={`w-full border rounded-xl py-2.5 pl-11 pr-4 text-sm transition-all
                            ${active && !loading
                                ? "bg-white/5 border-white/10 text-white focus:outline-none focus:border-accent/40 focus:ring-4 focus:ring-accent/5"
                                : "bg-white/[0.02] border-white/5 text-slate-600 placeholder-slate-600 cursor-not-allowed select-none"
                            }`}
                    />

                    {/* Borde rojo cuando inactivo */}
                    {!active && !loading && (
                        <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-red-500/15 pointer-events-none" />
                    )}
                </div>
            </div>

            <div className="flex items-center gap-6">
                {/* Campana */}
                <button
                    disabled={!active || loading}
                    className={`relative w-10 h-10 glass rounded-xl flex items-center justify-center transition-all
                        ${active && !loading ? "text-slate-400 hover:text-white" : "text-slate-700 cursor-not-allowed opacity-40"}`}
                >
                    <Bell className="w-5 h-5" />
                    {active && !loading && (
                        <div className="absolute top-2.5 right-2.5 w-2 h-2 bg-accent rounded-full border-2 border-slate-900 shadow-[0_0_10px_rgba(56,189,248,0.4)]" />
                    )}
                </button>

                {/* Avatar + info */}
                <div className="flex items-center gap-3 pl-6 border-l border-white/10">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-bold text-white leading-none mb-1">{userName}</p>
                        {loading ? (
                            <div className="h-3 w-20 bg-white/10 rounded-full animate-pulse" />
                        ) : active && currentPlan ? (
                            <p className="text-[10px] font-black uppercase tracking-wider"
                                style={{
                                    background: `linear-gradient(135deg, var(--tw-gradient-from), var(--tw-gradient-to))`,
                                }}
                            >
                                {/* texto con color del plan */}
                                <span className={`bg-gradient-to-r ${currentPlan.gradient} bg-clip-text text-transparent`}>
                                    {currentPlan.label}
                                </span>
                            </p>
                        ) : (
                            <p className="text-[10px] font-bold uppercase tracking-wider text-red-500/70">
                                Sin suscripción
                            </p>
                        )}
                    </div>

                    {/* Avatar con gradiente dinámico por plan */}
                    <div className={`w-10 h-10 rounded-xl p-px transition-all duration-500 ${loading
                        ? "bg-white/10 animate-pulse"
                        : active && currentPlan
                            ? `bg-gradient-to-br ${currentPlan.gradient} ${currentPlan.glow}`
                            : "bg-gradient-to-br from-red-900 to-red-700"
                        }`}>
                        <div className="w-full h-full bg-slate-950 rounded-xl flex items-center justify-center">
                            {!loading && (
                                <User className={`w-5 h-5 ${active && currentPlan ? "text-accent" : "text-red-500/60"
                                    }`} />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TopBar;