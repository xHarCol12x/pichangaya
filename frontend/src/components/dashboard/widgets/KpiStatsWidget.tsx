"use client";

import React, { useEffect, useRef } from "react";
import { CreditCard, CalendarCheck, AlertCircle, Activity, LucideIcon } from "lucide-react";
import gsap from "gsap";
import { DashboardStats } from "@/types";

const formatCurrency = (n: number) =>
    `S/ ${n.toLocaleString("es-PE", { minimumFractionDigits: 0 })}`;

interface KpiCardProps {
    title: string;
    value: string | number;
    sub?: string;
    accent: string;
    icon: LucideIcon;
}

const KpiCard = ({ title, value, sub, icon: Icon, accent }: KpiCardProps) => {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (ref.current) {
            gsap.fromTo(ref.current,
                { y: 24, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.7, ease: "power3.out", delay: Math.random() * 0.3 }
            );
        }
    }, []);

    return (
        <div ref={ref} className="bg-[#1a1919] rounded-2xl p-5 border border-[#484847]/20 relative overflow-hidden group transition-all hover:bg-[#262626]">
            <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full blur-2xl opacity-10 group-hover:opacity-20 transition-opacity"
                style={{ background: accent }} />
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                style={{ background: `${accent}18`, border: `1px solid ${accent}30` }}>
                <Icon className="w-4 h-4" style={{ color: accent }} />
            </div>
            <p className="text-[#adaaaa] text-[10px] font-mono uppercase tracking-widest truncate">{title}</p>
            <p className="text-2xl font-black text-white font-space-grotesk tracking-tighter mt-0.5 truncate" title={String(value)}>{value}</p>
            {sub && <p className="text-[#777575] font-mono text-[9px] mt-0.5 truncate uppercase">{sub}</p>}
        </div>
    );
};

export function KpiStatsWidget({ stats, allFieldsLength }: { stats: DashboardStats, allFieldsLength: number }) {
    const revenue = stats.revenue;
    const todayRevenue = stats.todayRevenue;
    const confirmedCount = stats.confirmed.length;
    const todayCount = stats.todayBookings.length;
    const pendingCount = stats.pending.length;
    const occupancy = stats.occupancy;

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
                title="Ingresos Totales"
                value={formatCurrency(revenue)}
                sub={`${formatCurrency(todayRevenue)} hoy`}
                icon={CreditCard}
                accent="#cafd00"
            />
            <KpiCard
                title="Reservas Confirmadas"
                value={confirmedCount}
                sub={`${todayCount} para hoy`}
                icon={CalendarCheck}
                accent="#818cf8"
            />
            <KpiCard
                title="Pagos Pendientes"
                value={pendingCount}
                sub="Requiere Atención"
                icon={AlertCircle}
                accent="#f59e0b"
            />
            <KpiCard
                title="Ocupación Diaria"
                value={`${occupancy}%`}
                sub={`${allFieldsLength} sectores en total`}
                icon={Activity}
                accent="#cafd00"
            />
        </div>
    );
}
