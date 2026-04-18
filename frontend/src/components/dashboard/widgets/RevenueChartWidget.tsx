"use client";
import React from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const formatCurrency = (n: number) => `S/ ${n.toLocaleString("es-PE", { minimumFractionDigits: 0 })}`;

export function RevenueChartWidget({ globalDateRange, stats, chartData }: { globalDateRange: string, stats: any, chartData: any[] }) {
    return (
        <div className="glass h-full p-6 lg:p-8 rounded-[2.5rem] border border-border flex flex-col min-h-[350px]">
            <div className="flex items-center justify-between mb-8 shrink-0">
                <div>
                    <h2 className="text-sm font-black text-foreground mb-1 leading-tight flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
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
                    <p className="text-xl sm:text-2xl font-black text-foreground leading-tight">{formatCurrency(stats.revenue)}</p>
                </div>
            </div>
            
            <div className="flex-1 w-full min-h-0 relative -ml-4">
                <ResponsiveContainer width="100%" height="100%" debounce={100}>
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                        <defs>
                            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid 
                            strokeDasharray="3 3" 
                            stroke="rgba(255,255,255,0.03)" 
                            vertical={false} 
                        />
                        <XAxis 
                            dataKey="name" 
                            stroke="rgba(255,255,255,0.2)" 
                            fontSize={10} 
                            tickLine={false} 
                            axisLine={false} 
                            dy={10}
                        />
                        <YAxis 
                            stroke="rgba(255,255,255,0.2)" 
                            fontSize={10} 
                            tickLine={false} 
                            axisLine={false} 
                            tickFormatter={v => `S/${v}`} 
                            width={50}
                        />
                        <Tooltip
                            contentStyle={{ 
                                backgroundColor: "rgba(15, 23, 42, 0.95)", 
                                border: "1px solid rgba(255,255,255,0.1)", 
                                borderRadius: "16px", 
                                fontSize: "12px",
                                backdropFilter: "blur(12px)",
                                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5)"
                            }}
                            itemStyle={{ color: "#38bdf8", fontWeight: "bold" }}
                            formatter={(v: any) => [formatCurrency(v), "Ingresos"]}
                        />
                        <Area 
                            type="monotone" 
                            dataKey="revenue" 
                            stroke="#38bdf8" 
                            strokeWidth={3.5} 
                            fill="url(#revenueGradient)" 
                            dot={false} 
                            activeDot={{ r: 6, fill: "#38bdf8", stroke: "#0f172a", strokeWidth: 2 }} 
                            animationDuration={1500}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
