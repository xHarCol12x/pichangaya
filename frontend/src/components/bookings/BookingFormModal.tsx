"use client";

import React, { useState, useEffect } from "react";
import { Loader2, Calendar as CalendarIcon, MapPin, Search, Phone, Check, CreditCard, Banknote, Smartphone, DollarSign, X } from "lucide-react";
import FieldMiniMap from "@/components/fields/FieldMiniMap";

interface BookingFormModalProps {
    onClose: () => void;
    onSaved: (savedBooking: any) => void;
    initialData?: any; // To preload dates or field from the calendar
    fields: any[];
    clientsList: any[];
    isEditMode?: boolean;
    bookingToEdit?: any;
    saveBookingApi: (form: any, id?: string) => Promise<any>;
}

export default function BookingFormModal({
    onClose,
    onSaved,
    initialData,
    fields,
    clientsList,
    isEditMode = false,
    bookingToEdit = null,
    saveBookingApi
}: BookingFormModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [clientSearch, setClientSearch] = useState("");
    const [showClientDropdown, setShowClientDropdown] = useState(false);

    // Format for input datetime-local
    const pad = (n: number) => n.toString().padStart(2, '0');
    const formatDateTime = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

    const getInitialForm = () => {
        if (isEditMode && bookingToEdit) {
            return {
                fieldId: bookingToEdit.fieldId,
                startTime: new Date(bookingToEdit.startTime).toISOString().slice(0, 16),
                duration: Math.round((new Date(bookingToEdit.endTime).getTime() - new Date(bookingToEdit.startTime).getTime()) / 60000),
                status: bookingToEdit.status,
                totalPrice: Number(bookingToEdit.totalPrice),
                clientId: bookingToEdit.clientId || "",
                paymentMethod: bookingToEdit.paymentMethod || "",
            };
        }

        const now = new Date();
        const start = new Date(now.getTime() + 60 * 60 * 1000); // next hour
        start.setMinutes(0, 0, 0);

        return {
            fieldId: initialData?.fieldId || (fields.length > 0 ? fields[0].id : ""),
            startTime: initialData?.startTime ? (typeof initialData.startTime === 'string' ? initialData.startTime : formatDateTime(initialData.startTime)) : formatDateTime(start),
            duration: initialData?.duration || 60,
            status: "CONFIRMED",
            totalPrice: 0,
            clientId: "",
            paymentMethod: "",
        };
    };

    const [form, setForm] = useState(getInitialForm());

    const activeField = fields.find(f => f.id === form.fieldId);

    // Calculate duration whenever times change
    useEffect(() => {
        if (activeField && form.duration) {
            const price = (activeField.pricePerHour * (form.duration / 60));
            setForm(prev => ({ ...prev, totalPrice: price }));
        }
    }, [form.startTime, form.duration, form.fieldId, fields, activeField]);


    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Frontend validation for past times
        const selectedStart = new Date(form.startTime);
        const now = new Date();
        
        if (selectedStart < now) {
            alert("⚠️ No puedes programar una reserva para una hora que ya pasó.");
            return;
        }

        setIsSubmitting(true);
        try {
            // Convert the local datetime-local string to a real Date object
            // This ensures it's sent with timezone information or as UTC
            const dataToSave = {
                ...form,
                startTime: new Date(form.startTime).toISOString()
            };

            const savedItem = await saveBookingApi(dataToSave, isEditMode ? bookingToEdit?.id : undefined);
            onSaved(savedItem); // Let the parent update their arrays
        } catch (error: any) {
            console.error("Error validando el modal save:", error);
            alert("No se pudo guardar la reserva: " + (error.response?.data?.message || error.message));
        } finally {
            setIsSubmitting(false);
        }
    };

    // Calculate minimum date for the input
    const getMinDateTime = () => {
        const d = new Date();
        // Round down to the nearest 15 minutes to avoid "invalid value" browser errors with step="900"
        d.setMinutes(Math.floor(d.getMinutes() / 15) * 15, 0, 0);
        return formatDateTime(d);
    };
    const minDateTime = getMinDateTime();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#0e0e0e]/90 backdrop-blur-md" onClick={onClose} />
            <div className="bg-[#0e0e0e] border border-[#484847]/30 rounded-[2rem] w-full max-w-5xl max-h-[95vh] lg:max-h-[90vh] relative z-10 shadow-[0_30px_100px_rgba(0,0,0,0.7)] flex flex-col lg:flex-row overflow-hidden animate-in fade-in zoom-in-95 duration-300">


                {/* Left Column - Minimap & Invoice Preview */}
                <div className="w-full lg:w-[40%] bg-[#1a1919] p-5 sm:p-6 lg:p-8 border-b lg:border-b-0 lg:border-r border-[#484847]/20 flex flex-col relative overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-white/5 [&::-webkit-scrollbar-thumb]:rounded-full">

                    <div className={`absolute -top-10 -left-10 w-40 h-40 rounded-full blur-[80px] opacity-20 ${form.status === 'CONFIRMED' ? 'bg-emerald-500' : form.status === 'CANCELLED' ? 'bg-red-500' : 'bg-[#cafd00]'}`} />

                    <h3 className="text-xl font-black text-white font-space-grotesk tracking-tighter mb-6 uppercase">Tactical Summary</h3>

                    {/* SVG MiniMap Component */}
                    <div className="w-full relative z-10 bg-white dark:bg-slate-900/40 rounded-2xl p-4 border border-slate-200 dark:border-white/5 mb-6 shadow-sm dark:shadow-none">
                        {activeField ? (
                            <>
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-sm font-black text-white font-space-grotesk flex items-center gap-2 uppercase tracking-tighter">
                                        <MapPin className="w-4 h-4 text-[#cafd00]" /> {activeField.name}
                                    </span>
                                    <span className="text-[10px] font-mono font-black px-2 py-1 rounded bg-[#cafd00]/10 text-[#cafd00] uppercase border border-[#cafd00]/20">
                                        {activeField.type} • {activeField.surface || 'Sintético'}
                                    </span>
                                </div>
                                <div className="h-[180px] flex items-center justify-center">
                                    <FieldMiniMap type={activeField.type} surface={activeField.surface || 'Sintético'} />
                                </div>
                            </>
                        ) : (
                            <div className="h-[220px] flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                                <MapPin className="w-8 h-8 opacity-20 mb-2" />
                                <p className="text-sm">Selecciona una cancha</p>
                            </div>
                        )}
                    </div>

                    {/* Live Invoice Ticket */}
                    <div className="mt-auto bg-white dark:bg-slate-900/60 rounded-2xl p-6 border border-slate-200 dark:border-white/5 relative overflow-hidden shadow-sm dark:shadow-none backdrop-blur-xl group">
                        <div className="absolute right-0 top-0 w-24 h-24 bg-accent/5 rounded-full blur-2xl group-hover:bg-accent/10 transition-colors" />
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                            <span className="text-emerald-500 dark:text-emerald-400 font-bold">S/</span>
                            Borrador de Facturación
                        </p>

                        <div className="space-y-3 mb-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500 dark:text-slate-400">Tarifa base ({activeField?.pricePerHour || 0}/hr)</span>
                                <span className="text-slate-900 dark:text-white font-medium">S/ {activeField?.pricePerHour || 0}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500 dark:text-slate-400">Duración ({form.duration} min)</span>
                                <span className="text-slate-900 dark:text-white font-medium">x {(form.duration / 60).toFixed(1)}</span>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-[#484847]/20 flex justify-between items-end">
                            <span className="text-[#adaaaa] font-mono text-[10px] uppercase tracking-widest">Total Amount</span>
                            <span className="text-4xl font-black text-[#cafd00] font-space-grotesk tracking-tighter flex items-start gap-1">
                                <span className="text-xl text-[#cafd00]/50 mt-1">S/</span>
                                {form.totalPrice.toFixed(2)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Right Column - Booking Form */}
                <div className="w-full lg:w-[60%] p-5 sm:p-6 lg:p-8 bg-[#0e0e0e] flex flex-col justify-start overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-white/5 [&::-webkit-scrollbar-thumb]:rounded-full">

                    <div className="flex justify-between items-start mb-6 lg:mb-8 text-left">
                        <div>
                            <h2 className="text-3xl font-black text-white font-space-grotesk tracking-tighter uppercase">
                                {isEditMode ? "Modify Entry" : "New Strategy"}
                            </h2>
                            <p className="text-[#adaaaa] font-mono text-[10px] uppercase tracking-widest mt-1">Deploying reservation to tactical grid</p>
                        </div>
                        <button onClick={onClose} className="text-[#777575] hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSave} className="space-y-5">
                        {/* Client Selector */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                Cliente <span className="text-slate-500 font-normal text-xs">(opcional)</span>
                            </label>
                            {form.clientId ? (
                                <div className="flex items-center gap-3 bg-accent/5 border border-accent/30 rounded-xl p-3">
                                    <div className="w-9 h-9 rounded-xl bg-accent/20 flex items-center justify-center text-xs font-black text-accent flex-shrink-0">
                                        {clientsList.find(c => c.id === form.clientId)?.name?.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() || '?'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-slate-900 dark:text-white font-bold text-sm truncate">{clientsList.find(c => c.id === form.clientId)?.name}</p>
                                        <p className="text-slate-500 dark:text-slate-400 text-xs flex items-center gap-1">
                                            <Phone className="w-3 h-3" />
                                            {clientsList.find(c => c.id === form.clientId)?.phone}
                                        </p>
                                    </div>
                                    <button type="button" onClick={() => setForm({ ...form, clientId: "" })} className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 rounded-full transition-colors">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                                    <input
                                        type="text"
                                        value={clientSearch}
                                        onFocus={() => setShowClientDropdown(true)}
                                        onChange={e => { setClientSearch(e.target.value); setShowClientDropdown(true); }}
                                        onBlur={() => setTimeout(() => setShowClientDropdown(false), 200)}
                                        placeholder="Buscar cliente por nombre o teléfono..."
                                        className="w-full bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all text-sm"
                                    />
                                    {showClientDropdown && (
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden z-20 shadow-2xl max-h-48 overflow-y-auto">
                                            {clientsList
                                                .filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase()) || c.phone.includes(clientSearch))
                                                .slice(0, 6)
                                                .map(c => (
                                                    <button
                                                        key={c.id}
                                                        type="button"
                                                        onMouseDown={() => { setForm({ ...form, clientId: c.id }); setClientSearch(""); setShowClientDropdown(false); }}
                                                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-left"
                                                    >
                                                        <div className="w-8 h-8 rounded-lg bg-accent/10 dark:bg-accent/20 flex items-center justify-center text-[10px] font-black text-accent flex-shrink-0">
                                                            {c.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="text-slate-900 dark:text-white font-medium text-sm">{c.name}</p>
                                                            <p className="text-slate-500 dark:text-slate-400 text-xs">{c.phone}</p>
                                                        </div>
                                                    </button>
                                                ))
                                            }
                                            {clientsList.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase()) || c.phone.includes(clientSearch)).length === 0 && (
                                                <p className="text-slate-500 dark:text-slate-400 text-sm px-4 py-3">Sin resultados — <a href="/dashboard/users" className="text-accent hover:underline font-medium">crear nuevo cliente</a></p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Field Select */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Cancha Deportiva</label>
                            <div className="relative">
                                <select
                                    required
                                    value={form.fieldId}
                                    onChange={e => setForm({ ...form, fieldId: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 rounded-xl pl-4 pr-10 py-3.5 text-slate-900 dark:text-white focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all appearance-none"
                                >
                                    {fields.map(f => (
                                        <option key={f.id} value={f.id}>{f.name} (Capacidad: {f.type})</option>
                                    ))}
                                </select>
                                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                                    <MapPin className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                                </div>
                            </div>
                        </div>

                        {/* Date & Start Time */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Hora de Ingreso</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                    <CalendarIcon className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                                </div>
                                <input
                                    required
                                    type="datetime-local"
                                    value={form.startTime}
                                    min={minDateTime}
                                    step="900"
                                    onChange={e => setForm({ ...form, startTime: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-slate-900 dark:text-white focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all font-mono"
                                />
                            </div>
                        </div>

                        {/* Interactive Duration Selector */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Tiempo de Alquiler</label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">

                                {[60, 90, 120].map((mins) => (
                                    <button
                                        key={mins}
                                        type="button"
                                        onClick={() => setForm({ ...form, duration: mins })}
                                        className={`relative py-3 rounded-xl border text-sm font-bold transition-all ${form.duration === mins
                                            ? 'bg-accent/10 border-accent text-accent shadow-[0_0_15px_rgba(56,189,248,0.2)]'
                                            : 'bg-white dark:bg-slate-900/50 border-slate-200 dark:border-white/5 text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-700 dark:hover:text-slate-300 shadow-sm dark:shadow-none'
                                            }`}
                                    >
                                        {mins} min
                                        {form.duration === mins && (
                                            <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-accent text-white dark:text-slate-950 rounded-full flex items-center justify-center">
                                                <Check className="w-3 h-3" />
                                            </div>
                                        )}
                                    </button>
                                ))}
                                {/* Custom Duration Input Fallback */}
                                <div className="relative">
                                    <input
                                        type="number"
                                        min="30"
                                        step="15"
                                        placeholder="Otro"
                                        value={![60, 90, 120].includes(form.duration) ? form.duration : ''}
                                        onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value) || 60 })}
                                        className={`w-full h-full py-3 pl-3 pr-8 rounded-xl border text-sm font-bold transition-all outline-none ${![60, 90, 120].includes(form.duration)
                                            ? 'bg-accent/10 border-accent text-accent shadow-[0_0_15px_rgba(56,189,248,0.2)]'
                                            : 'bg-white dark:bg-slate-900/50 border-slate-200 dark:border-white/5 text-slate-500 shadow-sm dark:shadow-none'
                                            }`}
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 dark:text-slate-500 pointer-events-none">m</span>
                                </div>
                            </div>
                        </div>

                        {/* Status Toggle */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-2">Estado de la Reserva</label>
                            <div className="flex gap-2">
                                {['CONFIRMED', 'PENDING'].map(status => (
                                    <button
                                        key={status}
                                        type="button"
                                        onClick={() => setForm({ ...form, status })}
                                        className={`flex-1 py-3 rounded-xl border text-sm font-bold transition-all ${form.status === status
                                            ? status === 'CONFIRMED' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500 dark:text-emerald-400' : 'bg-amber-500/10 border-amber-500 text-amber-500 dark:text-amber-400'
                                            : 'bg-white dark:bg-slate-900/50 border-slate-200 dark:border-white/5 text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 shadow-sm dark:shadow-none'
                                            }`}
                                    >
                                        {status === 'CONFIRMED' ? '✓ Pagada' : '⏳ Pendiente de Pago'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Payment Method */}
                        {form.status === 'CONFIRMED' && (
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Método de Pago</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { key: 'Efectivo', icon: Banknote, color: 'text-emerald-400' },
                                        { key: 'Yape', icon: Smartphone, color: 'text-violet-400' },
                                        { key: 'Plin', icon: Smartphone, color: 'text-teal-400' },
                                        { key: 'Tarjeta', icon: CreditCard, color: 'text-blue-400' },
                                        { key: 'Transferencia', icon: CreditCard, color: 'text-sky-400' },
                                        { key: 'Otro', icon: DollarSign, color: 'text-slate-400' },
                                    ].map(({ key, icon: Icon, color }) => (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => setForm({ ...form, paymentMethod: form.paymentMethod === key ? '' : key })}
                                            className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border text-xs font-bold transition-all ${form.paymentMethod === key
                                                ? 'bg-slate-100 dark:bg-white/10 border-slate-300 dark:border-white/30 text-slate-900 dark:text-white shadow-lg'
                                                : 'bg-white dark:bg-slate-900/50 border-slate-200 dark:border-white/5 text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 hover:border-slate-300 dark:hover:border-white/10 shadow-sm dark:shadow-none'
                                                }`}
                                        >
                                            <Icon className={`w-4 h-4 ${form.paymentMethod === key ? color : ''}`} />
                                            {key}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Submit & Actions */}
                        <div className="pt-5 mt-2 border-t border-[#484847]/30 flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-4 rounded-xl font-bold font-mono text-[10px] uppercase tracking-widest border border-[#484847]/30 text-[#adaaaa] hover:bg-white/5 hover:text-white transition-colors"
                            >
                                Abort
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex-1 bg-[#cafd00] text-[#0e0e0e] py-4 rounded-xl font-black font-space-grotesk text-xl hover:bg-[#beee00] transition-all flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(202,253,0,0.3)] hover:scale-[1.01] active:scale-95 uppercase tracking-tighter"
                            >
                                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CalendarIcon className="w-5 h-5" />}
                                {isEditMode ? "Commit Changes" : "Deploy Reservation"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
