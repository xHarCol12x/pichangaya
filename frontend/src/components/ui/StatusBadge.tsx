"use client";

import React from "react";

interface StatusBadgeProps {
    status: string;
}

export const StatusBadge = ({ status }: StatusBadgeProps) => {
    const map: Record<string, { label: string; className: string }> = {
        CONFIRMED: { label: "Confirmada", className: "bg-emerald-500/10 text-emerald-400" },
        PENDING: { label: "Pendiente", className: "bg-amber-500/10 text-amber-400" },
        CANCELLED: { label: "Cancelada", className: "bg-red-500/10 text-red-400" },
    };
    
    const s = map[status?.toUpperCase()] ?? { 
        label: status || "Estado", 
        className: "bg-slate-500/10 text-slate-400" 
    };

    return (
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${s.className}`}>
            {s.label}
        </span>
    );
};

export default StatusBadge;
