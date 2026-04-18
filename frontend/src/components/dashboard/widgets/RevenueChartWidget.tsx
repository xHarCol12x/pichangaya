"use client";

import React from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const formatCurrency = (n: number) => `S/ ${n.toLocaleString("es-PE", { minimumFractionDigits: 0 })}`;

export function RevenueChartWidget({ globalDateRange, stats, chartData }: { globalDateRange: string, stats: any, chartData: any[] }) {
    return (
        <div className="glass h-full p-6 lg:p-8 rounded-[2.5rem] border border-border flex flex-col min-h-[300px]">
            <div className="flex items-center justify-between mb-6 shrink-0">
                <div>
                    <h2 className="text-sm font-black text-foreground mb-1 leading-tight">
                        Ingresos — {
                            globalDateRange === "TODAY" ? "Hoy" :
                                globalDateRange === "WEEK" ? "Esta Semana" :
                                    globalDateRange === "MONTH" ? "Este Mes" : "Histórico"
                        }
                    </h2>
                    <p className="text-[10px] text-foreground/40 hidden sm:block">Solo reservas confirmadas</p>
                </div>
                <div className="text-right">
                    <p className="text-[9px] text-foreground/30 uppercase tracking-widest hidden sm:block">Total período</p>
                    <p className="text-base sm:text-lg font-black text-foreground leading-tight">{formatCurrency(stats.revenue)}</p>
                </div>
            </div>
            <div className="flex-1 w-full min-h-0 relative -ml-4">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                        <defs>
                            <linearGradient id="gr" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.25} />
                                <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={v => `S/${v}`} width={55} />
                        <Tooltip
                            contentStyle={{ backgroundColor: "var(--background)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", fontSize: "11px" }}
                            itemStyle={{ color: "#38bdf8" }}
                            formatter={(v: any) => [formatCurrency(v), "Ingresos"]}
                        />
                        <Area type="monotone" dataKey="revenue" stroke="#38bdf8" strokeWidth={2.5} fill="url(#gr)" dot={false} activeDot={{ r: 4, fill: "#38bdf8" }} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
