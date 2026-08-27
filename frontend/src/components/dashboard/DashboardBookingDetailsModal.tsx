"use client";

import React from "react";
import { X, CreditCard, Loader2, CheckCircle2, CalendarX } from "lucide-react";
import FieldMiniMap from "@/components/fields/FieldMiniMap";
import StatusBadge from "@/components/ui/StatusBadge";
import { Booking, Field } from "@/types";

interface DashboardBookingDetailsModalProps {
    booking: Booking | null;
    onClose: () => void;
    onUpdateStatus: (id: string, status: string) => Promise<void>;
    actionLoading: boolean;
    formatDate: (iso: string) => string;
    formatTime: (iso: string) => string;
}

const DashboardBookingDetailsModal = ({
    booking,
    onClose,
    onUpdateStatus,
    actionLoading,
    formatDate,
    formatTime
}: DashboardBookingDetailsModalProps) => {
    if (!booking) return null;

    const field = booking.field as Field | undefined;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={onClose} />
            <div className="glass border border-white/10 rounded-[2rem] w-full max-w-4xl relative z-10 shadow-2xl flex flex-col md:flex-row overflow-hidden animate-in fade-in zoom-in-95 duration-300">

                {/* Left Side: Field Preview */}
                <div className="w-full md:w-[45%] bg-slate-900/40 p-8 border-b md:border-b-0 md:border-r border-white/5 flex flex-col justify-center items-center relative overflow-hidden">
                    <div className="absolute -top-10 -left-10 w-40 h-40 bg-accent/10 rounded-full blur-[80px]" />

                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-accent mb-6 relative z-10">Vista Táctica</p>

                    <div className="w-full relative z-10">
                        <FieldMiniMap
                            type={field?.type || "Fútbol 5"}
                            surface={field?.surface || "Sintético"}
                        />
                    </div>

                    <div className="mt-8 text-center relative z-10">
                        <span className="text-2xl font-black text-white">{field?.name || "Cancha"}</span>
                        <div className="flex items-center justify-center gap-2 mt-2">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/5 text-slate-400 uppercase tracking-wider">
                                {field?.type || "Deportiva"}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-accent/20 text-accent uppercase tracking-wider">
                                {field?.surface || 'Sintético'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Right Side: Details & Actions */}
                <div className="w-full md:w-[55%] p-6 md:p-8 bg-slate-900/20 flex flex-col max-h-[50vh] md:max-h-[none] overflow-y-auto">
                    <div className="flex justify-between items-start mb-6 md:mb-8 sticky top-0 bg-slate-900/80 backdrop-blur-md pt-2 pb-2 -mt-2 z-10 rounded-b-xl">
                        <div>
                            <h3 className="text-xl font-black text-white tracking-tight">Detalles de Reserva</h3>
                            <p className="text-slate-500 text-xs mt-1 uppercase tracking-widest font-bold">Resumen de Alquiler</p>
                        </div>
                        <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-slate-400 transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="space-y-4 mb-auto">
                        <div className="flex justify-between p-4 rounded-2xl bg-white/5 border border-white/5 items-center">
                            <span className="text-slate-400 text-sm font-medium">Estado del Pago</span>
                            <StatusBadge status={booking.status} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest block mb-1">Fecha</span>
                                <span className="text-white font-bold">{formatDate(booking.startTime)}</span>
                            </div>
                            <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest block mb-1">Horario</span>
                                <span className="text-white font-bold font-mono">{formatTime(booking.startTime)} - {formatTime(booking.endTime)}</span>
                            </div>
                        </div>

                        <div className="p-5 rounded-2xl bg-accent/5 border border-accent/10 flex justify-between items-center group">
                            <div>
                                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Inversión Total</p>
                                <div className="flex items-baseline gap-1 mt-1">
                                    <span className="text-accent text-sm font-bold">S/</span>
                                    <span className="text-3xl font-black text-white leading-none">
                                        {booking.totalPrice || 0}
                                    </span>
                                </div>
                            </div>
                            <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                <CreditCard className="text-accent w-6 h-6" />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-8">
                        {booking.status?.toUpperCase() !== "CONFIRMED" && (
                            <button
                                onClick={() => onUpdateStatus(booking.id, "CONFIRMED")}
                                disabled={actionLoading}
                                className="w-full bg-emerald-500 text-slate-950 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-emerald-400 transition-all flex justify-center items-center gap-2 active:scale-95"
                            >
                                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                Confirmar Pago
                            </button>
                        )}
                        {booking.status?.toUpperCase() !== "CANCELLED" && (
                            <button
                                onClick={() => onUpdateStatus(booking.id, "CANCELLED")}
                                disabled={actionLoading}
                                className="w-full bg-white/5 text-slate-400 hover:text-white hover:bg-red-500/20 py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex justify-center items-center gap-2 active:scale-95"
                            >
                                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarX className="w-4 h-4" />}
                                Cancelar
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardBookingDetailsModal;
