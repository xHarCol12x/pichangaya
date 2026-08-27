"use client";
import React from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { DashboardStats, ChartDataPoint } from "@/types";

const formatCurrency = (n: number) => `S/ ${n.toLocaleString("es-PE", { minimumFractionDigits: 0 })}`;

export function RevenueChartWidget({ globalDateRange, stats, chartData }: { globalDateRange: string, stats: DashboardStats, chartData: ChartDataPoint[] }) {
    return (
        <div className="bg-[#1a1919] h-full p-6 lg:p-8 rounded-[2rem] border border-[#484847]/20 flex flex-col min-h-[350px]">
            <div className="flex items-center justify-between mb-8 shrink-0">
                <div>
                    <h2 className="text-xl font-black text-white font-space-grotesk tracking-tighter mb-1 uppercase leading-tight flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#cafd00] animate-pulse shadow-[0_0_8px_#cafd00]" />
                        Ingresos // {
                            globalDateRange === "TODAY" ? "Hoy" :
                                globalDateRange === "WEEK" ? "Semanal" :
                                    globalDateRange === "MONTH" ? "Mensual" : "Histórico"
                        }
                    </h2>
                    <p className="text-[10px] text-[#adaaaa] font-mono uppercase tracking-widest hidden sm:block">Solo reservas verificadas</p>
                </div>
                <div className="text-right">
                    <p className="text-[9px] text-[#777575] font-mono uppercase tracking-widest hidden sm:block">TOTAL PERIODO</p>
                    <p className="text-xl sm:text-3xl font-black text-[#cafd00] font-space-grotesk tracking-tighter leading-tight">{formatCurrency(stats.revenue)}</p>
                </div>
            </div>
            
            <div className="flex-1 w-full min-h-0 relative -ml-4">
                <ResponsiveContainer width="100%" height="100%" debounce={100}>
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                        <defs>
                            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#cafd00" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#cafd00" stopOpacity={0} />
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
                            tickFormatter={(v: any) => `S/${v}`} 
                            width={50}
                        />
                        <Tooltip
                            contentStyle={{ 
                                backgroundColor: "rgba(14, 14, 14, 0.95)", 
                                border: "1px solid rgba(202,253,0,0.2)", 
                                borderRadius: "12px", 
                                fontSize: "12px",
                                backdropFilter: "blur(12px)",
                                boxShadow: "0 0 20px rgba(0,0,0,0.5)"
                            }}
                            itemStyle={{ color: "#cafd00", fontWeight: "bold", fontFamily: 'Space Grotesk' }}
                            formatter={(v: any) => [formatCurrency(Number(v || 0)), "Ingresos"]}
                        />
                        <Area 
                            type="monotone" 
                            dataKey="revenue" 
                            stroke="#cafd00" 
                            strokeWidth={4} 
                            fill="url(#revenueGradient)" 
                            dot={false} 
                            activeDot={{ r: 6, fill: "#cafd00", stroke: "#0e0e0e", strokeWidth: 2 }} 
                            animationDuration={1500}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
