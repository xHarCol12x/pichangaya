"use client";

import React from "react";
import { Users, Clock, Plus, CreditCard, CheckCircle2 } from "lucide-react";

const formatCurrency = (n: number) =>
    `S/ ${n.toLocaleString("es-PE", { minimumFractionDigits: 0 })}`;

const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });

export function LiveFieldsWidget({ 
    liveFields, 
    handleLiveAction, 
    setShowQuickBooking 
}: { 
    liveFields: any[], 
    handleLiveAction: (action: 'extend'|'pay'|'finish', b: any, p?: number) => void,
    setShowQuickBooking: (s: boolean) => void 
}) {
    return (
        <div className="w-full h-full flex flex-col pt-1">
            <div className="flex items-center gap-2 mb-3 px-2 flex-shrink-0">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.8)]" />
                <h2 className="text-xl font-black text-foreground tracking-tight">En Juego Ahora</h2>
                <span className="text-foreground/40 text-xs ml-2 font-medium bg-foreground/5 px-2 py-1 rounded-md hidden sm:inline-block">
                    Actualización en vivo
                </span>
            </div>

            {liveFields.length === 0 ? (
                <div className="glass flex-1 p-6 rounded-2xl border border-border flex items-center justify-center text-sm text-foreground/40">
                    Cargando estado de las canchas...
                </div>
            ) : (
                <div className="flex-1 overflow-y-hidden overflow-x-auto snap-x snap-mandatory flex xl:grid xl:grid-cols-2 2xl:grid-cols-3 gap-5 hide-scrollbar pb-2">
                    {liveFields.map(field => {
                        const b = field.booking;
                        return (
                            <div key={field.id} className={`snap-center w-[85vw] sm:w-[320px] xl:w-auto shrink-0 p-5 rounded-[2rem] border backdrop-blur-md transition-all flex flex-col h-full overflow-y-auto hide-scrollbar ${field.isOccupied ? 'bg-white/80 dark:bg-slate-900/80 border-red-500/20 md:shadow-[0_8px_30px_rgba(239,68,68,0.08)]' : 'bg-slate-100/50 dark:bg-slate-900/40 border-emerald-500/10'}`}>

                                {/* CABECERA DE LA TARJETA */}
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="font-black text-slate-900 dark:text-white text-base truncate pr-2 leading-tight">{field.name.toUpperCase()}</h3>
                                        <span className="text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400 font-bold">
                                            {field.type || 'Deportiva'} • {field.surface || 'Sintético'}
                                        </span>
                                    </div>
                                    {field.isOccupied ? (
                                        <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-red-400 bg-red-500/10 px-2 py-1 rounded flex-shrink-0">
                                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                            En Juego
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded flex-shrink-0">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                            Libre
                                        </span>
                                    )}
                                </div>

                                {/* CUERPO DE LA TARJETA */}
                                {field.isOccupied && b ? (
                                    <div className="flex-1 flex flex-col justify-between h-full">

                                        {/* Info del Cliente y Pago */}
                                        <div className="bg-slate-100 dark:bg-white/5 rounded-xl p-3 mb-4 border border-slate-200 dark:border-white/5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-500 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
                                                    <Users className="w-4 h-4" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate leading-tight">
                                                        {b.client?.name || 'Walk-in (Sin registro)'}
                                                    </p>
                                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                                                        {formatTime(b.startTime)} - {b.endTime ? formatTime(b.endTime) : '---'}
                                                    </p>
                                                </div>

                                                {b.status?.toUpperCase() === 'CONFIRMED' ? (
                                                    <div className="bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded text-[9px] font-black uppercase tracking-wider border border-emerald-500/20 flex-shrink-0">
                                                        Pagado
                                                    </div>
                                                ) : (
                                                    <div className="bg-amber-500/10 text-amber-400 px-2 py-1 rounded text-[9px] font-black uppercase tracking-wider text-right border border-amber-500/20 flex-shrink-0">
                                                        Debe<br />{formatCurrency(b.totalPrice || 0)}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Barra de Progreso */}
                                        <div className="mb-4">
                                            <div className="flex items-center justify-between text-xs mb-1.5">
                                                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                                                    <Clock className="w-3.5 h-3.5 text-red-500 dark:text-red-400" />
                                                    <span className="text-[10px] sm:text-xs">Quedan <strong className="text-slate-900 dark:text-white">{field.remainingMins} min</strong></span>
                                                </div>
                                                <span className="text-[10px] font-mono text-slate-500">{Math.round(field.progress)}%</span>
                                            </div>
                                            <div className="w-full bg-slate-200 dark:bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-300 dark:border-white/5">
                                                <div
                                                    className="bg-gradient-to-r from-red-600 to-red-400 h-1.5 rounded-full transition-all duration-1000 ease-linear relative"
                                                    style={{ width: `${field.progress}%` }}
                                                />
                                            </div>
                                        </div>

                                        {/* Botones de Acción Rápida */}
                                        <div className="grid grid-cols-3 gap-2 border-t border-slate-200 dark:border-white/5 pt-3">
                                            <button
                                                onClick={() => handleLiveAction('extend', b, field.pricePerHour)}
                                                title="Extender 30 min"
                                                className="flex flex-col items-center justify-center gap-1 py-1.5 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                                            >
                                                <Plus className="w-3 h-3" />
                                                <span className="text-[8px] font-bold uppercase tracking-widest">+30m</span>
                                            </button>

                                            <button
                                                onClick={() => handleLiveAction('pay', b)}
                                                disabled={b.status?.toUpperCase() === 'CONFIRMED'}
                                                title="Cobrar"
                                                className={`flex flex-col items-center justify-center gap-1 py-1.5 rounded-lg transition-colors ${b.status?.toUpperCase() === 'CONFIRMED' ? 'bg-emerald-500/5 text-emerald-500/30 cursor-not-allowed border border-emerald-500/5' : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 border border-emerald-500/20'}`}
                                            >
                                                <CreditCard className="w-3 h-3" />
                                                <span className="text-[8px] font-bold uppercase tracking-widest">Cobrar</span>
                                            </button>

                                            <button
                                                onClick={() => handleLiveAction('finish', b)}
                                                title="Finalizar ahora"
                                                className="flex flex-col items-center justify-center gap-1 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 transition-colors"
                                            >
                                                <CheckCircle2 className="w-3 h-3" />
                                                <span className="text-[8px] font-bold uppercase tracking-widest">Fin</span>
                                            </button>
                                        </div>

                                    </div>
                                ) : (
                                    <div className="flex-1 flex flex-col justify-end pt-4 border-t border-slate-200 dark:border-white/5">
                                        <div className="flex-1 flex flex-col items-center justify-center text-emerald-500/50 mb-4">
                                            <div className="w-12 h-12 rounded-full bg-emerald-500/5 flex items-center justify-center mb-2">
                                                <CheckCircle2 className="w-6 h-6 opacity-50" />
                                            </div>
                                            <span className="text-xs font-medium">Lista para usar</span>
                                        </div>
                                        <button
                                            onClick={() => setShowQuickBooking(true)}
                                            className="w-full py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 dark:text-emerald-400 font-bold text-[11px] uppercase tracking-wider transition-colors flex items-center justify-center gap-2 border border-emerald-500/20"
                                        >
                                            <Plus className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                                            Ocupar
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
