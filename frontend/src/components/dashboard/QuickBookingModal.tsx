"use client";

import React, { useState } from "react";
import { X, Zap, Users, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { bookings as bookingsApi } from "@/lib/api";
import { Field, Client, BookingStatus } from "@/types";

interface QuickBookingModalProps {
    isOpen: boolean;
    isClosing: boolean;
    onClose: () => void;
    allFields: Field[];
    allClientsList: Client[];
    onSuccess: () => void;
}

interface QbForm {
    fieldId: string;
    startTime: string;
    duration: number;
    paymentMethod: string;
    clientId: string;
}

const QuickBookingModal = ({
    isOpen,
    isClosing,
    onClose,
    allFields,
    allClientsList,
    onSuccess
}: QuickBookingModalProps) => {
    const getQbInitial = (): QbForm => {
        const now = new Date();
        now.setMinutes(0, 0, 0);
        now.setHours(now.getHours() + 1);
        const pad = (n: number) => n.toString().padStart(2, '0');
        const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:00`;
        return { fieldId: "", startTime: fmt(now), duration: 60, paymentMethod: "Efectivo", clientId: "" };
    };

    const [qbForm, setQbForm] = useState<QbForm>(getQbInitial());
    const [qbClientSearch, setQbClientSearch] = useState("");
    const [qbShowDrop, setQbShowDrop] = useState(false);
    const [qbSubmitting, setQbSubmitting] = useState(false);

    if (!isOpen && !isClosing) return null;

    const fieldsArray = Array.isArray(allFields) ? allFields : [];
    const qbField = fieldsArray.find(f => f.id === qbForm.fieldId);
    const qbPrice = qbField ? +(qbField.pricePerHour * qbForm.duration / 60).toFixed(2) : 0;
    const qbClient = allClientsList.find(c => c.id === qbForm.clientId);

    const handleQbSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!qbForm.fieldId) return;

        const loadingToast = toast.loading("Registrando reserva...");
        setQbSubmitting(true);

        try {
            const start = new Date(qbForm.startTime);
            const end = new Date(start.getTime() + qbForm.duration * 60000);
            const payload = {
                fieldId: qbForm.fieldId,
                startTime: start.toISOString(),
                endTime: end.toISOString(),
                status: "CONFIRMED" as BookingStatus,
                totalPrice: qbPrice,
                paymentMethod: qbForm.paymentMethod || undefined,
                clientId: qbForm.clientId || undefined
            };

            await bookingsApi.create(payload);

            toast.success("¡Reserva registrada con éxito!", { id: loadingToast });
            onSuccess();
            setQbForm(getQbInitial());
            setQbClientSearch("");
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } }, message?: string };
            const msg = error.response?.data?.message || error.message || "Error al crear reserva.";
            toast.error(typeof msg === 'string' ? msg : "Verifica los datos de la reserva", { id: loadingToast });
        } finally {
            setQbSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <style>{`
                @keyframes modal-in {
                    0% { opacity: 0; transform: scale(0.95) translateY(15px); }
                    100% { opacity: 1; transform: scale(1) translateY(0); }
                }
                @keyframes modal-out {
                    0% { opacity: 1; transform: scale(1) translateY(0); }
                    100% { opacity: 0; transform: scale(0.95) translateY(15px); }
                }
                @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                @keyframes fade-out { from { opacity: 1; } to { opacity: 0; } }
                
                .animate-modal-in { animation: modal-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                .animate-modal-out { animation: modal-out 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
                .animate-fade-out { animation: fade-out 0.3s ease-out forwards; }
            `}</style>

            <div
                className={`absolute inset-0 bg-white/80 dark:bg-[#020817]/80 backdrop-blur-sm ${isClosing ? 'animate-fade-out' : 'animate-fade-in'}`}
                onClick={onClose}
            />

            <div className={`bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-[2rem] w-full max-w-xl relative z-10 shadow-[0_0_50px_rgba(0,0,0,0.1)] dark:shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col max-h-[90vh] overflow-hidden ${isClosing ? 'animate-modal-out' : 'animate-modal-in'}`}>
                <div className="px-8 py-6 border-b border-slate-200 dark:border-white/5 flex items-center gap-4 flex-shrink-0 bg-slate-50 dark:bg-white/[0.02]">
                    <div className="w-12 h-12 bg-accent/10 text-accent rounded-2xl flex items-center justify-center flex-shrink-0">
                        <Zap className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-xl font-black text-slate-900 dark:text-white">Reserva Rápida</h3>
                        <p className="text-slate-500 text-xs mt-0.5">Registra un walk-in en segundos</p>
                    </div>
                    <button type="button" onClick={onClose} className="p-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-full text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleQbSubmit} className="flex flex-col flex-1 min-h-0">
                    <div className="flex-1 overflow-y-auto p-8 space-y-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                        <div>
                            <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
                                Cliente <span className="text-slate-400 dark:text-slate-500 font-normal normal-case tracking-normal text-[10px]">(opcional)</span>
                            </label>
                            {qbClient ? (
                                <div className="flex items-center gap-3 bg-accent/5 border border-accent/20 dark:border-accent/30 rounded-xl p-3">
                                    <div className="w-9 h-9 rounded-xl bg-accent/10 dark:bg-accent/20 flex items-center justify-center text-xs font-black text-accent flex-shrink-0">
                                        {qbClient.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-slate-900 dark:text-white font-bold text-sm truncate">{qbClient.name}</p>
                                        <p className="text-slate-500 dark:text-slate-400 text-xs">{qbClient.phone}</p>
                                    </div>
                                    <button type="button" onClick={() => setQbForm({ ...qbForm, clientId: '' })} className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 rounded-full transition-colors">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <div className="relative">
                                    <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                                    <input
                                        type="text"
                                        value={qbClientSearch}
                                        onFocus={() => setQbShowDrop(true)}
                                        onChange={e => { setQbClientSearch(e.target.value); setQbShowDrop(true); }}
                                        onBlur={() => setTimeout(() => setQbShowDrop(false), 200)}
                                        placeholder="Buscar cliente o dejar en blanco..."
                                        className="w-full bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 rounded-xl pl-11 pr-4 py-3 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all text-sm shadow-sm dark:shadow-none"
                                    />
                                    {qbShowDrop && (
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden z-20 shadow-xl dark:shadow-2xl max-h-44 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                                            {allClientsList.filter(c =>
                                                c.name.toLowerCase().includes(qbClientSearch.toLowerCase()) || c.phone.includes(qbClientSearch)
                                            ).slice(0, 5).map(c => (
                                                <button key={c.id} type="button"
                                                    onMouseDown={() => { setQbForm({ ...qbForm, clientId: c.id }); setQbClientSearch(''); setQbShowDrop(false); }}
                                                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-left">
                                                    <div className="w-7 h-7 rounded-lg bg-accent/10 dark:bg-accent/20 text-[10px] font-black text-accent flex items-center justify-center flex-shrink-0">
                                                        {c.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="text-slate-900 dark:text-white text-sm font-medium">{c.name}</p>
                                                        <p className="text-slate-500 dark:text-slate-400 text-xs">{c.phone}</p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Cancha</label>
                                <select required value={qbForm.fieldId}
                                    onChange={e => setQbForm({ ...qbForm, fieldId: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-accent transition-all appearance-none text-sm shadow-sm dark:shadow-none">
                                    <option value="" disabled>Selecciona...</option>
                                    {fieldsArray.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Inicio</label>
                                <input required type="datetime-local" value={qbForm.startTime}
                                    onChange={e => setQbForm({ ...qbForm, startTime: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-accent transition-all text-sm font-mono shadow-sm dark:shadow-none" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Duración</label>
                            <div className="flex gap-2">
                                {[60, 90, 120].map(min => (
                                    <button key={min} type="button"
                                        onClick={() => setQbForm({ ...qbForm, duration: min })}
                                        className={`flex-1 py-2.5 rounded-xl border text-sm font-bold transition-all ${qbForm.duration === min
                                            ? 'bg-accent/10 border-accent text-accent'
                                            : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-white/5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 shadow-sm dark:shadow-none'
                                            }`}>
                                        {min} min
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Método de Pago</label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {['Efectivo', 'Yape', 'Plin', 'Tarjeta', 'Transferencia', 'Otro'].map(m => (
                                    <button key={m} type="button"
                                        onClick={() => setQbForm({ ...qbForm, paymentMethod: m })}
                                        className={`py-2.5 rounded-xl border text-xs font-bold transition-all ${qbForm.paymentMethod === m
                                            ? 'bg-slate-900 dark:bg-white/10 border-slate-800 dark:border-white/30 text-white'
                                            : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-white/5 text-slate-900 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 shadow-sm dark:shadow-none'
                                            }`}>
                                        {m}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="bg-accent/5 border border-accent/20 dark:border-accent/15 rounded-xl px-5 py-4 flex justify-between items-center mb-2">
                            <div>
                                <p className="text-slate-500 text-[10px] uppercase font-black tracking-widest">Total a cobrar</p>
                                <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                                    <span className="text-accent text-base">S/ </span>{qbPrice.toFixed(2)}
                                </p>
                            </div>
                            <p className="text-slate-500 dark:text-slate-400 text-xs">
                                {qbField ? `S/${qbField.pricePerHour}/hr × ${qbForm.duration}min` : 'Selecciona una cancha'}
                            </p>
                        </div>
                    </div>

                    <div className="px-8 py-5 border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02] flex gap-3 flex-shrink-0">
                        <button type="button" onClick={onClose}
                            className="px-5 py-3 rounded-xl font-bold border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition-colors text-sm shadow-sm dark:shadow-none bg-white dark:bg-transparent">
                            Cancelar
                        </button>
                        <button type="submit" disabled={qbSubmitting || !qbForm.fieldId}
                            className="flex-1 bg-accent text-slate-950 py-3 rounded-xl font-black flex items-center justify-center gap-2 hover:bg-accent/90 transition-all active:scale-95 disabled:opacity-50 text-sm shadow-sm dark:shadow-none">
                            {qbSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                            Confirmar Reserva
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default QuickBookingModal;
