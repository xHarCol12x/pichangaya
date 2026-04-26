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

export function KpiStatsWidget({ stats, allFieldsLength }: { stats: any, allFieldsLength: number }) {
    // Defensive normalization
    const revenue = stats?.revenue || 0;
    const todayRevenue = stats?.todayRevenue || 0;
    const confirmedCount = Array.isArray(stats?.confirmed) ? stats.confirmed.length : 0;
    const todayCount = Array.isArray(stats?.todayBookings) ? stats.todayBookings.length : 0;
    const pendingCount = Array.isArray(stats?.pending) ? stats.pending.length : 0;
    const occupancy = stats?.occupancy || 0;

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
                title="Total Revenue"
                value={formatCurrency(revenue)}
                sub={`${formatCurrency(todayRevenue)} today`}
                change="+14.2%"
                positive={true}
                icon={CreditCard}
                accent="#cafd00"
            />
            <KpiCard
                title="Confirmed Bookings"
                value={confirmedCount}
                sub={`${todayCount} for today`}
                change="+8.1%"
                positive={true}
                icon={CalendarCheck}
                accent="#818cf8"
            />
            <KpiCard
                title="Pending Payments"
                value={pendingCount}
                sub="Requires Attention"
                change={pendingCount > 0 ? `${pendingCount} active` : "Cleared"}
                positive={pendingCount === 0}
                icon={AlertCircle}
                accent="#f59e0b"
            />
            <KpiCard
                title="Daily Occupancy"
                value={`${occupancy}%`}
                sub={`${allFieldsLength} sectors total`}
                change="+5.4%"
                positive={true}
                icon={Activity}
                accent="#cafd00"
            />
        </div>
    );
}
