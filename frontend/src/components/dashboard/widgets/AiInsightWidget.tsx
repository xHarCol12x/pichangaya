"use client";

import React from "react";
import { BrainCircuit, ChevronRight, Zap } from "lucide-react";

export function AiInsightWidget({ plan, prediction }: { plan: string, prediction: any }) {
    if (plan === "pro" || plan === "enterprise") {
        return (
            <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-6 lg:p-8 rounded-[2.5rem] relative overflow-hidden flex flex-col justify-between group h-full">
                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                    <BrainCircuit className="w-32 h-32" />
                </div>
                <div className="relative z-10 space-y-4">
                    <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                        <BrainCircuit className="text-white w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-white mb-0.5 leading-tight">Insight Predictivo</h2>
                        <p className="text-indigo-200/60 text-[10px] sm:text-xs leading-relaxed">Basado en historial.</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md border border-white/10 p-3 rounded-2xl space-y-1">
                        <p className="text-[9px] uppercase font-black text-indigo-300 tracking-widest leading-none">Demanda</p>
                        <div className="flex items-center gap-2">
                            <span className="text-3xl font-black text-white leading-none">{prediction.pct}</span>
                            <span className="bg-emerald-400/20 text-emerald-300 text-[9px] px-1.5 py-0.5 rounded-full font-black">ALTA</span>
                        </div>
                        <p className="text-indigo-100/70 text-[10px] leading-tight">{prediction.text}</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md border border-white/10 p-2.5 rounded-xl flex items-center justify-between">
                        <span className="text-indigo-200/60 text-[10px]">Ticket prom.</span>
                        <span className="text-white font-black text-xs">{prediction.avg}</span>
                    </div>
                </div>
                <button className="relative z-10 w-full bg-white text-indigo-600 py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 hover:bg-indigo-50 transition-colors mt-4 shadow-xl shrink-0">
                    Ver Proyecciones <ChevronRight className="w-3.5 h-3.5" />
                </button>
            </div>
        );
    }

    return (
        <div className="glass bg-foreground/[0.02] p-6 rounded-[2.5rem] relative overflow-hidden flex flex-col justify-center items-center group border border-border text-center h-full">
            <div className="absolute inset-0 backdrop-blur-[2px] z-0" />
            <div className="relative z-10 flex flex-col items-center">
                <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center mb-3">
                    <BrainCircuit className="text-accent w-6 h-6 opacity-50" />
                </div>
                <h2 className="text-base font-black text-foreground mb-1 leading-tight">IA Exclusiva</h2>
                <p className="text-foreground/40 text-[10px] sm:text-xs max-w-[180px] mb-4 leading-tight">
                    Actualiza a Pro o Enterprise para ver insights predictivos.
                </p>
                <a href="/dashboard/billing?apply_plan=PRO" className="bg-foreground text-background px-4 py-2 rounded-xl font-bold flex items-center gap-1.5 text-xs hover:scale-105 transition-transform shrink-0">
                    <Zap className="w-3.5 h-3.5" />
                    Mejorar Plan
                </a>
            </div>
        </div>
    );
}
