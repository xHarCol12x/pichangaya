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
        <div ref={ref} className="glass rounded-2xl p-5 border border-border relative overflow-hidden group transition-all hover:bg-white/[0.02]">
            <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full blur-2xl opacity-10 group-hover:opacity-20 transition-opacity"
                style={{ background: accent }} />
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                style={{ background: `${accent}18`, border: `1px solid ${accent}30` }}>
                <Icon className="w-4 h-4" style={{ color: accent }} />
            </div>
            <p className="text-foreground/50 text-xs font-bold uppercase tracking-wider truncate">{title}</p>
            <p className="text-2xl font-black text-foreground mt-0.5 truncate" title={String(value)}>{value}</p>
            {sub && <p className="text-foreground/30 text-[10px] mt-0.5 truncate">{sub}</p>}
        </div>
    );
};

export function KpiStatsWidget({ stats, allFieldsLength }: { stats: any, allFieldsLength: number }) {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
