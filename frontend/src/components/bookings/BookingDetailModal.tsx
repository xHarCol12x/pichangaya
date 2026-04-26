"use client";

import React, { useState } from "react";
import { X, MapPin, Clock, Calendar as CalendarIcon, Phone, Check, CreditCard, Banknote, Smartphone, DollarSign, Loader2 } from "lucide-react";
import FieldMiniMap from "@/components/fields/FieldMiniMap";

interface BookingDetailModalProps {
    booking: any;
    onClose: () => void;
    onPay: (bookingId: string, paymentMethod: string) => Promise<any>;
}

export default function BookingDetailModal({ booking, onClose, onPay }: BookingDetailModalProps) {
    const [isPayingQuick, setIsPayingQuick] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Format helpers
    const formatDate = (dateString: string) => {
        const d = new Date(dateString);
        return d.toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const handleQuickPay = async (method: string) => {
        setIsSubmitting(true);
        try {
            await onPay(booking.id, method);
            setIsPayingQuick(false);
            // Parent should close or re-fetch after this
        } catch (error: any) {
            console.error(error);
            alert("Error al procesar el pago: " + (error.response?.data?.message || error.message));
        } finally {
            setIsSubmitting(false);
        }
    };

    const isConfirmed = booking.status === 'CONFIRMED';
    const isCancelled = booking.status === 'CANCELLED';

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#0e0e0e]/90 backdrop-blur-md" onClick={onClose} />
            <div className="bg-[#1a1919] border border-[#484847]/30 rounded-[2rem] w-full max-w-lg relative z-10 shadow-[0_25px_60px_rgba(0,0,0,0.6)] animate-in fade-in zoom-in-95 duration-300 overflow-hidden">
                {/* Header (Status Banner) */}
                <div className={`p-6 border-b border-[#484847]/20 relative overflow-hidden ${isConfirmed ? 'bg-emerald-500/5' : isCancelled ? 'bg-red-500/5' : 'bg-[#cafd00]/5'}`}>
                    <div className="flex justify-between items-start relative z-10">
                        <div>
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-3 ${isConfirmed ? 'bg-emerald-500 text-white' : isCancelled ? 'bg-red-500 text-white' : 'bg-[#cafd00] text-[#0e0e0e]'}`}>
                                {isConfirmed ? <Check className="w-3 h-3" /> : isCancelled ? <X className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                {isConfirmed ? 'COMPLETED' : isCancelled ? 'CANCELLED' : 'PENDING PAYMENT'}
                            </span>
                            <h2 className="text-3xl font-black text-white font-space-grotesk tracking-tighter uppercase leading-none">S/ {booking.totalPrice}</h2>
                        </div>
                        <button onClick={onClose} className="text-[#adaaaa] hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full transition-colors backdrop-blur-md">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {/* Client Info */}
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-[#cafd00]/10 flex items-center justify-center text-sm font-black text-[#cafd00] border border-[#cafd00]/20 shadow-[0_0_20px_rgba(202,253,0,0.1)]">
                            {booking.client?.name?.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() || '?'}
                        </div>
                        <div>
                            <p className="text-[10px] font-mono text-[#adaaaa] uppercase tracking-widest">Operator / Client</p>
                            <p className="text-xl font-black text-white font-space-grotesk tracking-tight leading-tight uppercase">{booking.client?.name || 'Local Player'}</p>
                            {booking.client?.phone && (
                                <p className="text-xs text-[#777575] font-mono flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3" /> {booking.client.phone}</p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-[#262626]/50 p-4 rounded-2xl border border-[#484847]/20 text-center">
                            <MapPin className="w-5 h-5 text-[#cafd00] mx-auto mb-2 opacity-80" />
                            <p className="text-[9px] uppercase font-mono font-black text-[#777575] tracking-widest mb-1">Sector</p>
                            <p className="text-sm font-black text-white font-space-grotesk uppercase truncate">{booking.field?.name}</p>
                        </div>
                        <div className="bg-[#262626]/50 p-4 rounded-2xl border border-[#484847]/20 text-center">
                            <Clock className="w-5 h-5 text-[#cafd00] mx-auto mb-2 opacity-80" />
                            <p className="text-[9px] uppercase font-mono font-black text-[#777575] tracking-widest mb-1">Timeframe</p>
                            <p className="text-sm font-black text-white font-space-grotesk uppercase truncate">{(new Date(booking.endTime).getTime() - new Date(booking.startTime).getTime()) / 60000} MINS</p>
                        </div>
                    </div>

                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Cronograma</p>
                        <div className="space-y-3 relative before:absolute before:inset-y-2 before:left-[11px] before:w-0.5 before:bg-slate-200 dark:before:bg-white/10">
                            <div className="flex items-start gap-3 relative z-10">
                                <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 border-4 border-white dark:border-slate-950 flex items-center justify-center shrink-0 mt-0.5">
                                    <div className="w-2 h-2 rounded-full bg-accent"></div>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{formatDate(booking.startTime)}</p>
                                    <p className="text-xs text-slate-500">Ingreso</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 relative z-10">
                                <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 border-4 border-white dark:border-slate-950 flex items-center justify-center shrink-0 mt-0.5">
                                    <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{formatDate(booking.endTime)}</p>
                                    <p className="text-xs text-slate-500">Salida</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 pt-0 mt-2">
                    {booking.status === 'PENDING' && !isPayingQuick && (
                        <button onClick={() => setIsPayingQuick(true)} className="w-full bg-[#cafd00] text-[#0e0e0e] font-black font-space-grotesk py-4 rounded-2xl hover:bg-[#beee00] transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(202,253,0,0.2)] uppercase tracking-tighter">
                            <DollarSign className="w-5 h-5" /> Process Payment
                        </button>
                    )}

                    {isPayingQuick && (
                        <div className="animate-in slide-in-from-bottom-4 duration-300">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-sm font-bold text-slate-900 dark:text-white">Selecciona método de pago</p>
                                <button onClick={() => setIsPayingQuick(false)} className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white font-medium">Cancelar</button>
                            </div>
                            {isSubmitting ? (
                                <div className="py-8 flex justify-center">
                                    <Loader2 className="w-8 h-8 text-accent animate-spin" />
                                </div>
                            ) : (
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { key: 'Efectivo', icon: Banknote, color: 'text-emerald-500' },
                                        { key: 'Yape', icon: Smartphone, color: 'text-violet-500' },
                                        { key: 'Plin', icon: Smartphone, color: 'text-teal-500' },
                                        { key: 'Tarjeta', icon: CreditCard, color: 'text-blue-500' },
                                        { key: 'Transferencia', icon: CreditCard, color: 'text-sky-500' },
                                        { key: 'Otro', icon: DollarSign, color: 'text-slate-500' },
                                    ].map(({ key, icon: Icon, color }) => (
                                        <button
                                            key={key}
                                            onClick={() => handleQuickPay(key)}
                                            className="flex flex-col items-center gap-2 py-3 px-2 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-white/10 hover:border-slate-300 dark:hover:border-white/20 transition-all"
                                        >
                                            <Icon className={`w-5 h-5 ${color}`} />
                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{key}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
