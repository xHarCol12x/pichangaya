"use client";

import React, { useState, useEffect } from "react";
import {
    BrainCircuit,
    TrendingUp,
    Zap,
    BarChart3,
    Calendar,
    Sparkles,
    ArrowRight,
    Info,
    Loader2,
    Lock,
    MapPin,
    Plus,
    Activity
} from "lucide-react";
import { users, venues } from "@/lib/api";
import NoVenuePlaceholder from "@/components/dashboard/NoVenuePlaceholder";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Cell
} from 'recharts';

const forecastData = [
    { Day: "Lun", actual: 40, predicted: 42 },
    { Day: "Mar", actual: 35, predicted: 38 },
    { Day: "Mie", actual: 45, predicted: 44 },
    { Day: "Jue", actual: 50, predicted: 55 },
    { Day: "Vie", actual: 75, predicted: 82 },
    { Day: "Sab", actual: 95, predicted: 98 },
    { Day: "Dom", actual: 85, predicted: 92 },
];

const peakHours = [
    { hour: '08:00', load: 30 },
    { hour: '10:00', load: 45 },
    { hour: '12:00', load: 20 },
    { hour: '14:00', load: 25 },
    { hour: '16:00', load: 60 },
    { hour: '18:00', load: 95 },
    { hour: '20:00', load: 85 },
    { hour: '22:00', load: 40 },
];

import { useVenue } from "@/context/VenueContext";

const AnalyticsPage = () => {
    const { venues: contextVenues, isLoadingVenues } = useVenue();
    const [isLoading, setIsLoading] = useState(true);
    const [hasAccess, setHasAccess] = useState(false);
    const [hasVenue, setHasVenue] = useState(false);

    useEffect(() => {
        const checkAccess = async () => {
            try {
                const userStr = localStorage.getItem("fieldiq_user");
                if (!userStr) {
                    window.location.href = '/login';
                    return;
                }
                const userObj = JSON.parse(userStr);

                // We use the venues from context or fetch them if not ready
                // For safety and immediate check, we fetch me and venues
                const [uRes] = await Promise.all([
                    users.getMe().catch(() => ({ data: {} })),
                ]);

                // The backend already filters venues by tenant
                setHasVenue(contextVenues.length > 0);

                const plan = String(uRes.data?.plan || userObj.plan || 'basic').toLowerCase();
                const featureOverrides = uRes.data?.featureOverrides || userObj?.featureOverrides || {};
                const planPermissions = uRes.data?.planPermissions || userObj?.planPermissions || {};

                if (plan === 'pro' || plan === 'enterprise' || featureOverrides.canUsePredictiveAI || planPermissions.canUsePredictiveAI) {
                    setHasAccess(true);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        
        if (!isLoadingVenues) {
            checkAccess();
        }
    }, [isLoadingVenues, contextVenues]);


    if (isLoading) {
        return (
            <div className="flex h-[60vh] items-center justify-center animate-in fade-in">
                <Loader2 className="w-8 h-8 animate-spin text-accent" />
            </div>
        );
    }

    if (!hasVenue) {
        return (
            <NoVenuePlaceholder 
                message="Para analizar tus datos y hacer predicciones con Inteligencia Artificial, primero necesitas registrar tu sede y tener algo de historial."
            />
        );
    }

    if (!hasAccess) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 animate-in fade-in zoom-in-95 duration-500">
                <div className="w-24 h-24 bg-accent/10 rounded-3xl rotate-12 flex items-center justify-center shadow-[0_0_40px_rgba(56,189,248,0.15)]">
                    <Lock className="w-10 h-10 text-accent -rotate-12" />
                </div>
                <div className="max-w-md mx-auto space-y-4">
                    <h2 className="text-3xl font-black text-white tracking-tight">Acceso Exclusivo</h2>
                    <p className="text-slate-400 leading-relaxed text-lg">
                        Nuestra <span className="text-accent font-semibold">Inteligencia Artificial Predictiva</span> está diseñada para llevar negocios a otro nivel. Mejora a plan <span className="text-white font-bold">PRO</span> o superior para desbloquearla.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 sm:space-y-8 animate-in zoom-in-95 duration-700 w-full overflow-hidden px-1 sm:px-0">
            <header className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                    <div className="flex items-center gap-2 text-[#cafd00] font-black uppercase tracking-[0.2em] text-[9px] sm:text-[10px] mb-2">
                        <Sparkles className="w-3 h-3" /> AI Powered Intelligence
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tighter uppercase">Análisis Predictivo</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 text-xs sm:text-sm">Predicciones avanzadas basadas en historial de reservas.</p>
                </div>
                <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 self-start sm:self-center">
                    <button className="px-4 py-1.5 rounded-lg text-[10px] font-bold text-slate-400 hover:text-white transition-all">7 Días</button>
                    <button className="bg-white/10 px-4 py-1.5 rounded-lg text-[10px] font-bold text-white border border-white/10 shadow-sm">30 Días</button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
                {/* Main Forecasting Chart */}
                <div className="lg:col-span-2 glass p-6 sm:p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden bg-white/[0.01]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                        <div>
                            <h2 className="text-xl font-bold text-white tracking-tight">Proyección de Demanda</h2>
                            <p className="text-xs text-slate-500 font-medium">Buscando patrones en reservas históricas</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-slate-600" />
                                <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Real</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-[#cafd00]" />
                                <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">IA</span>
                            </div>
                        </div>
                    </div>

                    <div className="h-[280px] sm:h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={forecastData}>
                                <defs>
                                    <linearGradient id="predictionGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#cafd00" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#cafd00" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                                <XAxis dataKey="Day" stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
                                <YAxis stroke="#475569" fontSize={10} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#020617', border: '1px solid #ffffff10', borderRadius: '16px' }}
                                    cursor={{ stroke: '#cafd00', strokeWidth: 1, strokeDasharray: '5 5' }}
                                />
                                <Area type="monotone" dataKey="actual" stroke="#475569" strokeWidth={2} fill="transparent" strokeDasharray="5 5" />
                                <Area type="monotone" dataKey="predicted" stroke="#cafd00" strokeWidth={4} fill="url(#predictionGradient)" animationDuration={2000} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* AI Insight Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6">
                    <div className="bg-[#cafd00]/10 border border-[#cafd00]/20 p-6 sm:p-8 rounded-[2.5rem] relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 w-32 h-32 bg-[#cafd00]/20 rounded-full blur-3xl" />
                        <Zap className="text-[#cafd00] w-10 h-10 mb-4" />
                        <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tight">Picos de Carga</h3>
                        <p className="text-slate-400 text-sm leading-relaxed mb-6">Saturación detectada los <span className="text-[#cafd00] font-bold underline underline-offset-4 decoration-2">Jueves a las 19:00</span>.</p>
                        <button className="flex items-center gap-2 text-[#cafd00] text-[10px] font-black uppercase tracking-widest hover:gap-3 transition-all">
                            Aplicar Ajuste <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="glass p-6 sm:p-8 rounded-[2.5rem] border border-white/5 relative bg-white/[0.01]">
                        <h3 className="text-[10px] font-black text-[#777575] uppercase tracking-[0.2em] mb-6 border-b border-white/5 pb-4">Oportunidades</h3>
                        <div className="space-y-6">
                            {[
                                { title: "Plan de Lealtad", desc: "El 20% de usuarios los Lunes son recurrentes." },
                                { title: "Predicción Clima", desc: "Lluvia probable el Sábado, demanda baja." },
                            ].map((item, i) => (
                                <div key={i} className="flex items-start gap-4">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#cafd00] mt-1.5 flex-shrink-0" />
                                    <div>
                                        <h4 className="text-white font-bold text-xs mb-1 uppercase tracking-tight">{item.title}</h4>
                                        <p className="text-[#adaaaa] text-[11px] leading-snug">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                {/* Peak Hours Chart */}
                <div className="glass p-6 sm:p-8 rounded-[2.5rem] border border-white/5 bg-white/[0.01]">
                    <h3 className="text-xl font-black text-white mb-8 flex items-center gap-2 uppercase tracking-tight">
                        <BarChart3 className="w-5 h-5 text-indigo-400" />
                        Distribución Peak
                    </h3>
                    <div className="h-[200px] sm:h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={peakHours}>
                                <XAxis dataKey="hour" stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
                                <Tooltip cursor={{ fill: '#ffffff05' }} contentStyle={{ backgroundColor: '#020617', border: 'none' }} />
                                <Bar dataKey="load" radius={[6, 6, 0, 0]}>
                                    {peakHours.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.load > 80 ? '#f43f5e' : entry.load > 50 ? '#cafd00' : '#334155'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Efficiency Grid */}
                <div className="grid grid-cols-2 gap-4 sm:gap-6">
                    <div className="glass p-5 sm:p-6 rounded-[2rem] border border-white/5 flex flex-col justify-between bg-white/[0.01]">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-4 border border-emerald-500/20">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[9px] text-[#777575] font-black uppercase tracking-widest mb-1">Crecimiento</p>
                            <p className="text-2xl font-black text-white font-space-grotesk">+24.5%</p>
                            <p className="text-[9px] text-emerald-500 font-bold uppercase tracking-tight">Mes vs Mes</p>
                        </div>
                    </div>

                    <div className="glass p-5 sm:p-6 rounded-[2rem] border border-white/5 flex flex-col justify-between bg-white/[0.01]">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-4 border border-indigo-500/20">
                            <BrainCircuit className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[9px] text-[#777575] font-black uppercase tracking-widest mb-1">Precisión</p>
                            <p className="text-2xl font-black text-white font-space-grotesk">98.2%</p>
                            <p className="text-[9px] text-indigo-400 font-bold uppercase tracking-tight">Rendimiento</p>
                        </div>
                    </div>

                    <div className="glass p-5 sm:p-6 rounded-[2rem] border border-white/5 col-span-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/[0.01]">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-[#cafd00] border border-white/5">
                                <Calendar className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="text-white font-bold text-sm uppercase tracking-tight">Carga de Datos</h4>
                                <p className="text-[10px] text-slate-500 font-mono">Última actualización: hace 4 min</p>
                            </div>
                        </div>
                        <button className="w-full sm:w-auto px-6 py-2.5 rounded-xl border border-white/10 text-[#adaaaa] text-[10px] font-black uppercase tracking-widest hover:bg-white/5 hover:text-white transition-all active:scale-95">Sincronizar</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsPage;
