"use client";

import React, { useEffect, useRef } from "react";
import { TrendingUp, TrendingDown, CreditCard, CalendarCheck, AlertCircle, Activity } from "lucide-react";
import gsap from "gsap";

const formatCurrency = (n: number) =>
    `S/ ${n.toLocaleString("es-PE", { minimumFractionDigits: 0 })}`;

const KpiCard = ({ title, value, sub, change, positive, icon: Icon, accent }: any) => {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        gsap.fromTo(ref.current,
            { y: 24, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.7, ease: "power3.out", delay: Math.random() * 0.3 }
        );
    }, []);

    return (
        <div ref={ref} className="h-full glass p-6 rounded-[2rem] border border-border relative group overflow-hidden flex flex-col justify-between">
            <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity"
                style={{ background: accent }} />

            <div className="flex justify-between items-start mb-5">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${accent}18`, border: `1px solid ${accent}30` }}>
                    <Icon className="w-6 h-6" style={{ color: accent }} />
                </div>
                {change !== undefined && (
                    <div className={`flex items-center gap-1 text-xs font-bold py-1 px-2.5 rounded-lg ${positive ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                        {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {change}
                    </div>
                )}
            </div>
            <div>
                <h3 className="text-foreground/50 text-sm font-medium mb-1">{title}</h3>
                <p className="text-3xl font-black text-foreground line-clamp-1 truncate" title={String(value)}>{value}</p>
                {sub && <p className="text-foreground/30 text-xs mt-1 truncate">{sub}</p>}
            </div>
        </div>
    );
};

export function KpiStatsWidget({ stats, allFieldsLength }: { stats: any, allFieldsLength: number }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 h-full w-full">
            <KpiCard
                title="Ingresos Totales"
                value={formatCurrency(stats.revenue)}
                sub={`${formatCurrency(stats.todayRevenue)} hoy`}
                change="+14.2%"
                positive={true}
                icon={CreditCard}
                accent="#38bdf8"
            />
            <KpiCard
                title="Reservas Confirmadas"
                value={stats.confirmed.length}
                sub={`${stats.todayBookings.length} para hoy`}
                change="+8.1%"
                positive={true}
                icon={CalendarCheck}
                accent="#818cf8"
            />
            <KpiCard
                title="Pendientes de Pago"
                value={stats.pending.length}
                sub="Requieren atención"
                change={stats.pending.length > 0 ? `${stats.pending.length} activas` : "Al día"}
                positive={stats.pending.length === 0}
                icon={AlertCircle}
                accent="#f59e0b"
            />
            <KpiCard
                title="Ocupación Hoy"
                value={`${stats.occupancy}%`}
                sub={`${allFieldsLength} canchas registradas`}
                change="+5.4%"
                positive={true}
                icon={Activity}
                accent="#10b981"
            />
        </div>
    );
}
