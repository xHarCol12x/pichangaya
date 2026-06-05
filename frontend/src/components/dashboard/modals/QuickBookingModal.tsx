import React, { useState } from "react";
import { X, CheckCircle2, Loader2, Users } from "lucide-react";
import { toast } from "sonner";
import { bookings as bookingsApi } from "@/lib/api";

interface QuickBookingModalProps {
    showQuickBooking: boolean;
    isClosingQB: boolean;
    closeQuickBooking: () => void;
    allFields: any[];
    allClientsList: any[];
    onSuccess: () => void;
}

export const QuickBookingModal: React.FC<QuickBookingModalProps> = ({
    showQuickBooking,
    isClosingQB,
    closeQuickBooking,
    allFields,
    allClientsList,
    onSuccess,
}) => {
    const getQbInitial = () => {
        const now = new Date(); now.setMinutes(0, 0, 0); now.setHours(now.getHours() + 1);
        const pad = (n: number) => n.toString().padStart(2, '0');
        const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:00`;
        return { fieldId: "", startTime: fmt(now), duration: 60, paymentMethod: "Efectivo", clientId: "", totalPrice: 0 };
    };

    const [qbForm, setQbForm] = useState(getQbInitial);
    const [qbClientSearch, setQbClientSearch] = useState("");
    const [qbShowDrop, setQbShowDrop] = useState(false);
    const [qbSubmitting, setQbSubmitting] = useState(false);

    if (!showQuickBooking) return null;

    const qbField = allFields.find(f => f.id === qbForm.fieldId);
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
            const payload: any = {
                fieldId: qbForm.fieldId,
                startTime: start.toISOString(),
                endTime: end.toISOString(),
                status: "CONFIRMED",
                totalPrice: qbPrice,
                paymentMethod: qbForm.paymentMethod || undefined,
            };
            if (qbForm.clientId) payload.clientId = qbForm.clientId;

            await bookingsApi.create(payload);

            toast.success("¡Reserva registrada con éxito!", { id: loadingToast });
            closeQuickBooking();
            setQbForm(getQbInitial());
            setQbClientSearch("");
            onSuccess();
        } catch (err: any) {
            const msg = err?.response?.data?.message || err?.message || "Error al crear reserva.";
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

            {/* Overlay con blur y animación */}
            <div
                className={`absolute inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm transition-opacity ${isClosingQB ? 'animate-fade-out' : 'animate-fade-in'}`}
                onClick={closeQuickBooking}
            />

            {/* Contenedor Principal (Panel Lateral en Móvil, Modal Centrado en Desktop) */}
            <div className={`relative w-full max-w-lg bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-white/10 shadow-2xl flex flex-col overflow-hidden sm:rounded-[2rem] h-[100dvh] sm:h-auto max-h-none sm:max-h-[90vh] ${isClosingQB ? 'animate-modal-out' : 'animate-modal-in'}`}>

                {/* Header (Fijo) */}
                <div className="px-8 py-6 border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02] flex justify-between items-center flex-shrink-0">
                    <div>
                        <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                            Reserva Rápida
                            <span className="flex h-2 w-2 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
                            </span>
                        </h2>
                        <p className="text-slate-500 text-xs mt-1 uppercase tracking-widest font-bold">Registro Inmediato</p>
                    </div>
                    <button type="button" onClick={closeQuickBooking}
                        className="p-2.5 bg-slate-200/50 dark:bg-white/5 hover:bg-slate-300/50 dark:hover:bg-white/10 rounded-xl text-slate-600 dark:text-slate-400 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Formulario (Scrollable) */}
                <form onSubmit={handleQbSubmit} className="flex-1 overflow-y-auto flex flex-col">
                    <div className="p-8 space-y-6 flex-1">

                        {/* Client Select / Search */}
                        <div className="relative z-20">
                            <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 flex justify-between">
                                Cliente
                                {qbClient && <span className="text-accent">Seleccionado</span>}
                            </label>

                            {qbClient ? (
                                <div className="flex items-center justify-between bg-accent/5 border border-accent/20 rounded-xl px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent font-black text-xs">
                                            {qbClient.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{qbClient.name}</p>
                                            <p className="text-xs text-slate-500">{qbClient.phone}</p>
                                        </div>
                                    </div>
                                    <button type="button" onClick={() => setQbForm({ ...qbForm, clientId: '' })}
                                        className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
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
                                            {allClientsList.length === 0 && (
                                                <p className="text-slate-500 dark:text-slate-400 text-xs px-4 py-3">
                                                    Sin clientes — <a href="/dashboard/users" className="text-accent hover:underline">crear cliente</a>
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Field + Time */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Cancha</label>
                                <select required value={qbForm.fieldId}
                                    onChange={e => setQbForm({ ...qbForm, fieldId: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-accent transition-all appearance-none text-sm shadow-sm dark:shadow-none">
                                    <option value="" disabled>Selecciona...</option>
                                    {allFields.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Inicio</label>
                                <input required type="datetime-local" value={qbForm.startTime}
                                    onChange={e => setQbForm({ ...qbForm, startTime: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-accent transition-all text-sm font-mono shadow-sm dark:shadow-none" />
                            </div>
                        </div>

                        {/* Duration pills */}
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

                        {/* Payment Method */}
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

                        {/* Price preview */}
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

                    {/* Footer (Fijo) con los Botones de Acción */}
                    <div className="px-8 py-5 border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02] flex gap-3 flex-shrink-0">
                        <button type="button" onClick={closeQuickBooking}
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
