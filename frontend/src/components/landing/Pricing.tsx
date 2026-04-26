"use client";

import React, { useState, useEffect, useRef } from "react";
import { Check, Zap, ArrowRight, Sparkles, Star, Crown, Rocket, Loader2 } from "lucide-react";
import { gsap } from "gsap";
import { useTransition } from "../ui/TransitionOverlay";
import api from "@/lib/api";

// Map icon name strings from the DB to Lucide components
const ICON_MAP: Record<string, React.ComponentType<any>> = {
    Star, Zap, Crown, Rocket,
};

// Tailwind classes by plan for color variants that need compile-time tokens
const PLAN_TAILWIND: Record<string, any> = {
    FREE_TRIAL: {
        twBg: "bg-indigo-500/10", twBorder: "border-indigo-500/20",
        twText: "text-indigo-600 dark:text-indigo-400",
        twCta: "bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-400/20",
        gradientTop: "from-indigo-500/10 dark:from-indigo-500/15",
    },
    BASIC: {
        twBg: "bg-emerald-500/10", twBorder: "border-emerald-500/20",
        twText: "text-emerald-600 dark:text-emerald-400",
        twCta: "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-400/20",
        gradientTop: "from-emerald-500/10 dark:from-emerald-500/15",
    },
    PRO: {
        twBg: "bg-amber-500/10", twBorder: "border-amber-400/40",
        twText: "text-amber-600 dark:text-amber-400",
        twCta: "",
        gradientTop: "from-amber-500/15 dark:from-amber-500/20",
    },
    ENTERPRISE: {
        twBg: "bg-pink-500/10", twBorder: "border-pink-500/20",
        twText: "text-pink-600 dark:text-pink-400",
        twCta: "bg-pink-500/10 hover:bg-pink-500/20 text-pink-700 dark:text-pink-300 border border-pink-400/20",
        gradientTop: "from-pink-500/10 dark:from-pink-500/15",
    },
};

const PlanCard = ({ plan, isAnnual, index }: { plan: any; isAnnual: boolean; index: number }) => {
    const [hovered, setHovered] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);
    const { navigateWithTransition } = useTransition();
    // Resolve icon from name string (from DB) to Lucide component
    const Icon = (typeof plan.icon === "string" ? ICON_MAP[plan.icon] : plan.icon) || Star;
    const price = isAnnual ? plan.annualPrice : plan.monthlyPrice;

    useEffect(() => {
        if (cardRef.current) {
            gsap.fromTo(cardRef.current,
                { y: 60, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.7, ease: "power3.out", delay: index * 0.12 }
            );
        }
    }, [index]);

    useEffect(() => {
        if (!cardRef.current) return;
        gsap.to(cardRef.current, {
            y: hovered ? -8 : 0,
            duration: 0.4,
            ease: "power2.out",
        });
    }, [hovered]);

    return (
        <div
            ref={cardRef}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            className="relative h-full"
            style={{ opacity: 0 }}
        >
            {/* Glow blob decorativo */}
            <div
                className={`absolute inset-0 rounded-[2.5rem] blur-2xl -z-10 scale-90 transition-opacity duration-300`}
                style={{ background: plan.accent, opacity: hovered ? 0.12 : 0 }}
            />

            {/* Badge */}
            {plan.badge && (
                <div
                    className="absolute -top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-5 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase shadow-lg"
                    style={{ background: plan.accent, color: "#000" }}
                >
                    <Sparkles size={11} className="animate-pulse" />
                    {plan.badge}
                </div>
            )}

            <div
                className={`
                    relative overflow-hidden rounded-[2.5rem] h-full flex flex-col
                    bg-card border transition-all duration-300
                    ${plan.highlighted
                        ? "border-amber-400/40 dark:border-amber-400/25 shadow-xl shadow-amber-500/10 dark:shadow-amber-500/15"
                        : "border-border hover:border-foreground/20"
                    }
                `}
            >
                {/* Top color wash — usa clases Tailwind para respetar el tema */}
                <div className={`absolute top-0 left-0 right-0 h-48 bg-gradient-to-b ${plan.gradientTop} to-transparent pointer-events-none transition-colors duration-500`} />

                {/* Luces de esquina para el plan destacado */}
                {plan.highlighted && (
                    <>
                        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl bg-amber-400 opacity-10 dark:opacity-20" />
                        <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full blur-3xl bg-amber-400 opacity-5 dark:opacity-10" />
                    </>
                )}

                <div className="relative z-10 p-8 flex flex-col h-full">
                    {/* Ícono + Nombre */}
                    <div className="flex items-center justify-between mb-6">
                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${plan.twBg} border ${plan.twBorder}`}>
                            <Icon size={20} className={plan.twText} />
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full ${plan.twBg} ${plan.twText}`}>
                            {plan.name}
                        </span>
                    </div>

                    {/* Precio */}
                    <div className="mb-2">
                        <div className="flex items-end gap-1 leading-none">
                            {typeof price === "number" && (
                                <span className="text-foreground/40 text-lg font-light mb-1">S/</span>
                            )}
                            <span className={`text-6xl font-black tracking-tighter leading-none ${typeof price !== "number" ? plan.twText : "text-foreground"}`}>
                                {price}
                            </span>
                            {price !== "Custom" && (
                                <span className="text-foreground/40 text-sm mb-1">/mes</span>
                            )}
                        </div>
                        {isAnnual && typeof price === "number" && price > 0 && (
                            <p className={`text-[11px] mt-1.5 font-semibold ${plan.twText}`}>
                                Ahorras S/ {((plan.monthlyPrice as number) - price) * 12}/año
                            </p>
                        )}
                    </div>

                    <p className="text-foreground/50 text-sm leading-relaxed mb-8">{plan.description}</p>

                    {/* Divider con color del plan */}
                    <div
                        className="h-px w-full mb-6"
                        style={{ background: `linear-gradient(to right, transparent, ${plan.accent}50, transparent)` }}
                    />

                    {/* Features */}
                    <div className="space-y-3.5 flex-1 mb-8">
                        {plan.features.map((feature: string, j: number) => (
                            <div key={j} className="flex items-center gap-3 text-sm text-foreground/70">
                                <div className={`w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0 ${plan.twBg}`}>
                                    <Check size={12} className={plan.twText} />
                                </div>
                                {feature}
                            </div>
                        ))}
                    </div>

                    {/* CTA */}
                    {plan.highlighted ? (
                        <button
                            onClick={() => {
                                if (plan.code === "ENTERPRISE") {
                                    // Contact sales logic
                                } else {
                                    navigateWithTransition(`/register?plan=${plan.code}`);
                                }
                            }}
                            className="w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all duration-300 group/btn hover:scale-[1.02] active:scale-[0.98]"
                            style={{
                                background: `linear-gradient(135deg, ${plan.accentDark}, ${plan.accent}, ${plan.accentLight})`,
                                color: "#000",
                                boxShadow: `0 8px 32px ${plan.accent}40`,
                            }}
                        >
                            {plan.cta}
                            <ArrowRight size={16} className="transition-transform group-hover/btn:translate-x-1" />
                        </button>
                    ) : (
                        <button
                            onClick={() => {
                                if (plan.code === "ENTERPRISE") {
                                    // Contact sales logic
                                } else {
                                    navigateWithTransition(`/register?plan=${plan.code}`);
                                }
                            }}
                            className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all duration-300 group/btn ${plan.twCta}`}>
                            {plan.cta}
                            <ArrowRight size={16} className="transition-transform group-hover/btn:translate-x-1" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

const Pricing = () => {
    const [isAnnual, setIsAnnual] = useState(false);
    const [plans, setPlans] = useState<any[]>([]);
    const headerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                // The public endpoint returns active plans
                const response = await api.get('/plans');
                const data = response.data;

                // Safety check: ensure data is an array
                const plansArray = Array.isArray(data) ? data : (data?.data || data?.plans || []);

                // Map API data to visual properties
                const mappedPlans = plansArray.map((apiPlan: any) => {
                    const twClasses = PLAN_TAILWIND[apiPlan.code] || PLAN_TAILWIND['BASIC'];
                    return {
                        ...apiPlan,
                        ...twClasses,
                        // Use colors directly from DB
                        accentDark: apiPlan.accent,
                        monthlyPrice: apiPlan.code === 'ENTERPRISE' ? 'Custom' : apiPlan.priceMensual,
                        annualPrice: apiPlan.code === 'ENTERPRISE' ? 'Custom' : apiPlan.priceAnual,
                        highlighted: apiPlan.isPopular,
                        badge: apiPlan.isPopular ? "MÁS POPULAR" : null,
                        // features come directly from DB, with a fallback
                        features: apiPlan.features?.length > 0 ? apiPlan.features : [
                            `Hasta ${apiPlan.limitVenues} complejo${apiPlan.limitVenues > 1 ? 's' : ''}`,
                            `Hasta ${apiPlan.limitFields} canchas`,
                        ],
                        cta: apiPlan.code === 'ENTERPRISE' ? 'Contactar Ventas' : (apiPlan.code === 'FREE_TRIAL' ? 'Probar Gratis' : 'Comenzar Ahora')
                    };
                });

                // Sort to match traditional order: Trial, Basic, Pro, Enterprise
                const order = ['FREE_TRIAL', 'BASIC', 'PRO', 'ENTERPRISE'];
                mappedPlans.sort((a: any, b: any) => order.indexOf(a.code) - order.indexOf(b.code));

                setPlans(mappedPlans);
            } catch (error) {
                console.error("Error fetching plans for landing page:", error);
            }
        };

        fetchPlans();
    }, []);

    useEffect(() => {
        if (headerRef.current && plans.length > 0) {
            gsap.fromTo(
                headerRef.current.children,
                { y: 30, opacity: 0 },
                { y: 0, opacity: 1, stagger: 0.1, duration: 0.7, ease: "power3.out" }
            );
        }
    }, [plans]);

    return (
        <section id="precios" className="py-28 bg-background relative overflow-hidden transition-colors duration-500">

            {/* Blobs atmosféricos — con variantes dark para que cambien con el tema */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-[120px] bg-indigo-500/5 dark:bg-indigo-500/10 transition-colors duration-500" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-[120px] bg-amber-500/5 dark:bg-amber-500/10 transition-colors duration-500" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[160px] bg-emerald-500/3 dark:bg-emerald-500/5 transition-colors duration-500" />
                {/* Grid sutil */}
                <div
                    className="absolute inset-0 opacity-[0.02] dark:opacity-[0.04] transition-opacity duration-500"
                    style={{
                        backgroundImage: "linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)",
                        backgroundSize: "60px 60px",
                    }}
                />
            </div>

            {/* Header */}
            <div ref={headerRef} className="max-w-7xl mx-auto px-6 mb-16 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full bg-foreground/5 border border-border transition-colors duration-500">
                    <Sparkles size={12} className="text-amber-500 dark:text-amber-400" />
                    <span className="text-foreground/50 text-xs font-bold uppercase tracking-widest">Precios Transparentes</span>
                </div>

                <h2 className="text-5xl md:text-7xl font-black mb-6 tracking-tight text-foreground leading-none transition-colors duration-500">
                    Impulsa tu{" "}
                    <span
                        style={{
                            background: "linear-gradient(135deg, #f59e0b, #ec4899, #6366f1)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            backgroundClip: "text",
                        }}
                    >
                        negocio
                    </span>
                </h2>

                <p className="text-foreground/50 text-lg max-w-xl mx-auto mb-10 transition-colors duration-500">
                    Elige el plan que mejor se adapta a tu complejo. Sin costos ocultos, cancela cuando quieras.
                </p>

                {/* Toggle mensual / anual */}
                <div className="inline-flex items-center gap-1 p-1.5 bg-foreground/5 border border-border rounded-2xl transition-colors duration-500">
                    <button
                        onClick={() => setIsAnnual(false)}
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${!isAnnual
                            ? "bg-background text-foreground shadow-md"
                            : "text-foreground/40 hover:text-foreground/70"
                            }`}
                    >
                        Mensual
                    </button>
                    <button
                        onClick={() => setIsAnnual(true)}
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2.5 ${isAnnual
                            ? "bg-background text-foreground shadow-md"
                            : "text-foreground/40 hover:text-foreground/70"
                            }`}
                    >
                        Anual
                        <span className="text-[10px] bg-emerald-500 text-white px-2 py-0.5 rounded-lg font-black">
                            −20%
                        </span>
                    </button>
                </div>
            </div>

            {/* Grid de cards */}
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 items-stretch">
                    {plans.map((plan, i) => (
                        <PlanCard key={plan.name} plan={plan} isAnnual={isAnnual} index={i} />
                    ))}
                </div>

                <p className="text-center text-foreground/30 text-sm mt-12 transition-colors duration-500">
                    Todos los planes incluyen 7 días de prueba gratis · Sin tarjeta de crédito requerida
                </p>
            </div>
        </section>
    );
};

export default Pricing;