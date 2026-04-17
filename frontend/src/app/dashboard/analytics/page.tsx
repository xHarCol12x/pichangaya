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

const AnalyticsPage = () => {
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

                const [uRes, vRes] = await Promise.all([
                    users.getMe().catch(() => ({ data: {} })),
                    venues.getAll().catch(() => ({ data: [] }))
                ]);

                const userVenues = vRes.data?.filter((v: any) => v.ownerId === userObj.id) || [];
                setHasVenue(userVenues.length > 0);

                const plan = String(uRes.data?.plan || userObj.plan || 'basic').toLowerCase();
                if (plan === 'pro' || plan === 'enterprise') {
                    setHasAccess(true);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        checkAccess();
    }, []);

    if (isLoading) {
        return (
            <div className="flex h-[60vh] items-center justify-center animate-in fade-in">
                <Loader2 className="w-8 h-8 animate-spin text-accent" />
            </div>
        );
    }

    if (!hasVenue) {
        return (
            <div className="max-w-[1400px] w-full mx-auto px-4 py-8 min-h-[60vh] flex items-center justify-center">
                <div className="glass max-w-2xl w-full rounded-[3rem] p-12 text-center border border-white/5 flex flex-col items-center animate-in fade-in zoom-in-95 duration-700">
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-20 h-20 bg-accent rounded-3xl flex items-center justify-center rotate-3 shadow-[0_0_40px_rgba(56,189,248,0.4)] mb-6">
                            <Activity className="text-accent-foreground w-10 h-10" />
                        </div>
                        <h1 className="text-5xl font-black tracking-tight text-white flex items-center gap-1">
                            Field<span className="text-accent">IQ</span>
                        </h1>
                    </div>
                    <p className="text-slate-400 text-lg mb-10 max-w-lg mx-auto leading-relaxed">
                        Para analizar tus datos y hacer predicciones con Inteligencia Artificial, primero necesitas registrar tu sede y tener algo de historial.
                    </p>
                    <a
                        href="/dashboard/fields"
                        className="bg-accent text-slate-950 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-accent/90 transition-colors flex items-center gap-3 shadow-[0_0_40px_rgba(56,189,248,0.2)]"
                    >
                        <Plus className="w-5 h-5" />
                        Crear mi Primera Sede
                    </a>
                </div>
            </div>
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
        <div className="space-y-8 animate-in zoom-in-95 duration-700">
            <header className="flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-2 text-accent font-black uppercase tracking-[0.2em] text-[10px] mb-2">
                        <Sparkles className="w-3 h-3" /> AI Powered Intelligence
                    </div>
                    <h1 className="text-4xl font-black text-white">Análisis Predictivo</h1>
                    <p className="text-slate-400 mt-2">Predicciones avanzadas basadas en redes neuronales para tu club</p>
                </div>
                <div className="flex gap-3">
                    <button className="glass px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-colors">7 Días</button>
                    <button className="bg-white/10 px-4 py-2 rounded-xl text-xs font-bold text-white border border-white/10">30 Días</button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Forecasting Chart */}
                <div className="lg:col-span-2 glass p-8 rounded-[3rem] border border-white/5 relative overflow-hidden">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-xl font-bold text-white">Proyección de Demanda</h2>
                            <p className="text-sm text-slate-500 font-medium">Buscando patrones en reservas históricas</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-slate-600" />
                                <span className="text-[10px] text-slate-500 font-bold uppercase">Real</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-accent" />
                                <span className="text-[10px] text-slate-500 font-bold uppercase">Predicho</span>
                            </div>
                        </div>
                    </div>

                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={forecastData}>
                                <defs>
                                    <linearGradient id="predictionGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                                <XAxis dataKey="Day" stroke="#475569" fontSize={11} axisLine={false} tickLine={false} />
                                <YAxis stroke="#475569" fontSize={11} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#020617', border: '1px solid #ffffff10', borderRadius: '16px' }}
                                    cursor={{ stroke: '#38bdf8', strokeWidth: 1, strokeDasharray: '5 5' }}
                                />
                                <Area type="monotone" dataKey="actual" stroke="#475569" strokeWidth={2} fill="transparent" strokeDasharray="5 5" />
                                <Area type="monotone" dataKey="predicted" stroke="#38bdf8" strokeWidth={4} fill="url(#predictionGradient)" animationDuration={2000} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* AI Insight Summary */}
                <div className="space-y-6">
                    <div className="bg-accent/10 border border-accent/20 p-8 rounded-[2.5rem] relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 w-32 h-32 bg-accent/20 rounded-full blur-3xl" />
                        <Zap className="text-accent w-10 h-10 mb-4" />
                        <h3 className="text-xl font-black text-white mb-2">Picos de Carga</h3>
                        <p className="text-slate-400 text-sm leading-relaxed mb-6">Se detectó un patrón de saturación los <span className="text-accent font-bold">Jueves a las 19:00</span>. Recomendamos ajustar tarifas dinámicas.</p>
                        <button className="flex items-center gap-2 text-accent text-xs font-black uppercase tracking-widest hover:gap-3 transition-all">
                            Aplicar Ajuste <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="glass p-8 rounded-[2.5rem] border border-white/5 relative">
                        <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-6 border-b border-white/5 pb-4">Oportunidades de IA</h3>
                        <div className="space-y-6">
                            {[
                                { title: "Plan de Lealtad", desc: "El 20% de usuarios los Lunes son recurrentes.", val: "High Impact" },
                                { title: "Predicción de Clima", desc: "Posible lluvia el Sábado, baja demanda fútbol.", val: "Risk Low" },
                            ].map((item, i) => (
                                <div key={i} className="flex items-start gap-4">
                                    <div className="w-2 h-2 rounded-full bg-accent mt-1.5" />
                                    <div>
                                        <h4 className="text-white font-bold text-sm mb-1">{item.title}</h4>
                                        <p className="text-slate-500 text-xs leading-snug">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Peak Hours Chart */}
                <div className="glass p-8 rounded-[3rem] border border-white/5">
                    <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-indigo-400" />
                        Distribución Horaria Peak
                    </h3>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={peakHours}>
                                <XAxis dataKey="hour" stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
                                <Tooltip cursor={{ fill: '#ffffff05' }} contentStyle={{ backgroundColor: '#020617', border: 'none' }} />
                                <Bar dataKey="load" radius={[8, 8, 0, 0]}>
                                    {peakHours.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.load > 80 ? '#f43f5e' : entry.load > 50 ? '#38bdf8' : '#334155'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Efficiency Grid */}
                <div className="grid grid-cols-2 gap-6">
                    <div className="glass p-6 rounded-[2rem] border border-white/5 flex flex-col justify-between">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-4">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Crecimiento IA</p>
                            <p className="text-2xl font-black text-white">+24.5%</p>
                            <p className="text-[10px] text-emerald-500 font-bold">Mes vs Mes</p>
                        </div>
                    </div>

                    <div className="glass p-6 rounded-[2rem] border border-white/5 flex flex-col justify-between">
                        <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400 mb-4">
                            <BrainCircuit className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Precisión Modelo</p>
                            <p className="text-2xl font-black text-white">98.2%</p>
                            <p className="text-[10px] text-slate-500 font-bold">Rendimiento Alto</p>
                        </div>
                    </div>

                    <div className="glass p-6 rounded-[2rem] border border-white/5 col-span-2 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                                <Calendar className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="text-white font-bold">Carga de Datos</h4>
                                <p className="text-xs text-slate-500">Última actualización: hace 4 min</p>
                            </div>
                        </div>
                        <button className="px-6 py-2 rounded-xl border border-white/10 text-slate-300 text-xs font-bold hover:bg-white/5 transition-colors">Sincronizar</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsPage;
