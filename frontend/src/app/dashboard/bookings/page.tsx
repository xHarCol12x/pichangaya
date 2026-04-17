"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Plus, Edit2, Trash2, Calendar as CalendarIcon, Loader2, Clock, MapPin, DollarSign, Activity, Check, X, User, Phone, Search, CreditCard, Banknote, Smartphone } from "lucide-react";
import { bookings as bookingsApi, fields as fieldsApi, venues, clients as clientsApi, users } from "@/lib/api";
import ConfirmModal from "@/components/ui/ConfirmModal";
import FieldMiniMap from "@/components/fields/FieldMiniMap";
import { Info, MessageSquare } from "lucide-react";

export default function BookingsPage() {
    const [bookings, setBookings] = useState<any[]>([]);
    const [fields, setFields] = useState<any[]>([]);
    const [clientsList, setClientsList] = useState<any[]>([]);
    const [myVenues, setMyVenues] = useState<any[]>([]);
    const [userPlan, setUserPlan] = useState<string>('basic');
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [clientSearch, setClientSearch] = useState("");
    const [showClientDropdown, setShowClientDropdown] = useState(false);

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [bookingToEdit, setBookingToEdit] = useState<any>(null);
    const [bookingToDelete, setBookingToDelete] = useState<any>(null);
    const [bookingToView, setBookingToView] = useState<any>(null);
    const [isPayingQuick, setIsPayingQuick] = useState(false); // To toggle payment selector in detail view
    const getInitialForm = () => {
        const now = new Date();
        const start = new Date(now.getTime() + 60 * 60 * 1000); // next hour
        start.setMinutes(0, 0, 0);

        // Format for input datetime-local
        const pad = (n: number) => n.toString().padStart(2, '0');
        const formatDateTime = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

        return {
            fieldId: "",
            startTime: formatDateTime(start),
            duration: 60,
            status: "CONFIRMED",
            totalPrice: 0,
            clientId: "",
            paymentMethod: "",
        };
    };

    const [form, setForm] = useState(getInitialForm());

    useEffect(() => {
        loadData();
    }, []);

    const activeField = fields.find(f => f.id === form.fieldId);

    // Calculate duration whenever times change
    useEffect(() => {
        if (activeField && form.duration) {
            const price = (activeField.pricePerHour * (form.duration / 60));
            setForm(prev => ({ ...prev, totalPrice: price }));
        }
    }, [form.startTime, form.duration, form.fieldId, fields, activeField]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const userStr = localStorage.getItem("fieldiq_user");
            const userObj = userStr ? JSON.parse(userStr) : null;
            const userId = userObj?.id || null;

            const [fieldsRes, bookingsRes, vRes, uRes] = await Promise.all([
                fieldsApi.getAll(),
                bookingsApi.getAll(),
                venues.getAll().catch(() => ({ data: [] })),
                users.getMe().catch(() => ({ data: {} }))
            ]);

            setUserPlan(String(uRes.data?.plan || userObj?.plan || 'basic').toLowerCase());

            const userVenues = vRes.data?.filter((v: any) => v.ownerId === userId) || [];
            setMyVenues(userVenues);

            // Load clients for the user's venue
            if (userVenues.length > 0) {
                const cRes = await clientsApi.getAll(userVenues[0].id).catch(() => ({ data: [] }));
                setClientsList(cRes.data || []);
            }

            // Map bookings with their corresponding field data (Most recent first)
            const enrichedBookings = bookingsRes.data.map((b: any) => ({
                ...b,
                field: fieldsRes.data.find((f: any) => f.id === b.fieldId) || { name: "Cancha eliminada" }
            })).sort((a: any, b: any) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

            setFields(fieldsRes.data);
            setBookings(enrichedBookings);

            if (fieldsRes.data.length > 0 && !form.fieldId) {
                setForm(prev => ({ ...prev, fieldId: fieldsRes.data[0].id }));
            }

        } catch (error) {
            console.error("Error loading data", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const startDate = new Date(form.startTime);
            const endDate = new Date(startDate.getTime() + form.duration * 60000);

            const payload: any = {
                field: { connect: { id: form.fieldId } },
                startTime: startDate.toISOString(),
                endTime: endDate.toISOString(),
                status: form.status,
                totalPrice: Number(form.totalPrice),
                paymentMethod: form.paymentMethod || undefined,
            };
            if (form.clientId) {
                payload.client = { connect: { id: form.clientId } };
            } else if (bookingToEdit?.clientId) {
                payload.client = { disconnect: true };
            }

            if (bookingToEdit) {
                await bookingsApi.update(bookingToEdit.id, payload);
            } else {
                await bookingsApi.create(payload);
            }

            setIsModalOpen(false);
            setBookingToEdit(null);
            setForm(getInitialForm());
            loadData();
        } catch (error) {
            console.error("Error saving booking", error);
            alert("Error al guardar la reserva. Verifica que no haya conflictos de horario.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!bookingToDelete) return;
        setIsSubmitting(true);
        try {
            await bookingsApi.delete(bookingToDelete.id);
            setBookingToDelete(null);
            loadData();
        } catch (error) {
            console.error("Error deleting booking", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleQuickPay = async (method: string) => {
        if (!bookingToView) return;
        setIsSubmitting(true);
        try {
            await bookingsApi.update(bookingToView.id, {
                status: 'CONFIRMED',
                paymentMethod: method
            });
            // Update local view instantly
            setBookingToView({ ...bookingToView, status: 'CONFIRMED', paymentMethod: method });
            setIsPayingQuick(false);
            loadData(); // reload table
        } catch (error) {
            console.error("Error on quick pay", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const maxBookings = (userPlan === 'basic') ? 200 : (userPlan === 'free_trial' || userPlan === 'starter') ? 50 : 9999;

    // Count current month bookings to enforce limits
    const currentMonthBookings = useMemo(() => {
        const now = new Date();
        return bookings.filter(b => {
            const date = new Date(b.startTime);
            return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
        }).length;
    }, [bookings]);

    const canCreateBooking = currentMonthBookings < maxBookings;

    const openCreateModal = () => {
        if (!canCreateBooking) {
            alert(`Límite alcanzado: Tu plan actual (${userPlan.toUpperCase()}) solo permite un máximo de ${maxBookings} reservas por mes. Mejora a PRO para reservas ilimitadas.`);
            return;
        }

        setBookingToEdit(null);
        setForm(getInitialForm());
        if (fields.length > 0) {
            setForm(prev => ({ ...prev, fieldId: fields[0].id }));
        }
        setIsModalOpen(true);
    };

    const openEditModal = (booking: any) => {
        setBookingToEdit(booking);

        const formatDateTimeLocal = (isoString: string) => {
            const d = new Date(isoString);
            const pad = (n: number) => n.toString().padStart(2, '0');
            return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        };

        const start = new Date(booking.startTime);
        const end = new Date(booking.endTime);
        const durationMins = Math.round((end.getTime() - start.getTime()) / 60000);

        setForm({
            fieldId: booking.fieldId,
            startTime: formatDateTimeLocal(booking.startTime),
            duration: durationMins,
            status: booking.status,
            totalPrice: booking.totalPrice,
            clientId: booking.clientId || "",
            paymentMethod: booking.paymentMethod || "",
        });
        setIsModalOpen(true);
    };

    const formatDate = (isoString: string) => {
        return new Date(isoString).toLocaleDateString('es-ES', {
            weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'CONFIRMED': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20';
            case 'PENDING': return 'bg-amber-500/20 text-amber-400 border-amber-500/20';
            case 'CANCELLED': return 'bg-red-500/20 text-red-400 border-red-500/20';
            default: return 'bg-slate-500/20 text-slate-400 border-slate-500/20';
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-accent" />
            </div>
        );
    }

    if (!isLoading && myVenues.length === 0) {
        return (
            <div className="max-w-[1400px] w-full mx-auto px-4 py-8 min-h-[80vh] flex items-center justify-center">
                <div className="glass max-w-2xl w-full rounded-[3rem] p-12 text-center border border-white/5 flex flex-col items-center animate-in fade-in zoom-in-95 duration-700">
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-20 h-20 bg-accent rounded-3xl flex items-center justify-center rotate-3 shadow-[0_0_40px_rgba(56,189,248,0.4)] mb-6">
                            <Activity className="text-accent-foreground w-10 h-10" />
                        </div>
                        <h1 className="text-5xl font-black tracking-tight text-white flex items-center gap-1">
                            Field<span className="text-accent">IQ</span>
                        </h1>
                    </div>
                    <p className="text-slate-400 text-lg mb-10 max-w-lg mx-auto leading-relaxed">
                        Estás a un paso de empezar a recibir reservas. El primer paso obligatorio es registrar tu sede deportiva principal.
                    </p>
                    <a
                        href="/dashboard/fields"
                        className="bg-accent text-slate-950 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-accent/90 transition-colors flex items-center gap-3 shadow-[0_0_40px_rgba(56,189,248,0.2)]"
                    >
                        <Plus className="w-5 h-5" />
                        Crear mi Primera Sede
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Reservas</h1>
                    <p className="text-slate-400 mt-1">Gestiona el calendario de uso de tus canchas.</p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="flex items-center gap-2 bg-accent hover:bg-accent/90 text-slate-950 px-4 py-2 rounded-xl font-medium transition-colors"
                    disabled={fields.length === 0}
                >
                    <Plus className="w-4 h-4" />
                    Nueva Reserva
                </button>
            </div>

            {fields.length === 0 && (
                <div className="glass rounded-2xl p-6 text-center border border-amber-500/30 bg-amber-500/5 mb-6">
                    <p className="text-amber-400">Debes crear al menos una cancha antes de poder registrar reservas.</p>
                </div>
            )}

            {maxBookings < 1000 && (
                <div className={`glass rounded-2xl p-6 border flex items-center justify-between mb-6 ${currentMonthBookings >= maxBookings ? 'border-red-500/30 bg-red-500/5' : 'border-white/5 bg-slate-900/40'}`}>
                    <div>
                        <p className={`text-sm font-bold ${currentMonthBookings >= maxBookings ? 'text-red-400' : 'text-white'}`}>
                            {currentMonthBookings >= maxBookings ? 'Límite Mensual Alcanzado' : 'Límite Mensual de Reservas'}
                        </p>
                        <p className="text-slate-400 text-xs mt-1">Estás usando {currentMonthBookings} de {maxBookings} reservas incluidas en tu plan {userPlan.toUpperCase()}.</p>
                    </div>
                </div>
            )}

            <div className="glass rounded-2xl border border-white/5 overflow-hidden">
                {bookings.length === 0 ? (
                    <div className="py-20 text-center">
                        <CalendarIcon className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-white mb-2">No hay reservas</h3>
                        <p className="text-slate-400">Aún no se han registrado reservas en el sistema.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto text-left">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/5 text-slate-400 text-sm">
                                    <th className="font-medium p-4 pl-6 text-left">Cancha</th>
                                    <th className="font-medium p-4 text-left">Cliente</th>
                                    <th className="font-medium p-4 text-left">Horario Inicio</th>
                                    <th className="font-medium p-4 text-left">Fin</th>
                                    <th className="font-medium p-4 text-left">Total</th>
                                    <th className="font-medium p-4 text-left">Pago</th>
                                    <th className="font-medium p-4 text-left">Estado</th>
                                    <th className="font-medium p-4 pr-6 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {bookings.map((booking) => {
                                    const isCompleted = new Date(booking.endTime) < new Date();
                                    const isCancelled = booking.status === 'CANCELLED';

                                    // Row Styling
                                    let rowStyle = "hover:bg-white/5 transition-colors group";
                                    if (isCancelled) {
                                        rowStyle += " opacity-50 bg-red-500/5"; // Canceladas atenuadas con fondo rojizo tenue
                                    } else if (isCompleted) {
                                        rowStyle += " opacity-60 bg-white/[0.02]"; // Pasadas atenuadas
                                    }

                                    return (
                                        <tr key={booking.id} className={rowStyle}>
                                            <td className="p-4 pl-6">
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="w-4 h-4 text-accent" />
                                                    <span className="font-medium">{booking.field.name.toUpperCase()}</span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                {booking.client ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-7 h-7 rounded-lg bg-accent/20 flex items-center justify-center text-[10px] font-black text-accent flex-shrink-0">
                                                            {booking.client.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="text-white text-sm font-medium leading-none">{booking.client.name}</p>
                                                            <p className="text-slate-500 text-xs mt-0.5">{booking.client.phone}</p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-600 text-xs">Sin cliente</span>
                                                )}
                                            </td>
                                            <td className="p-4 text-slate-300">
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-4 h-4 text-slate-500" />
                                                    {formatDate(booking.startTime)}
                                                </div>
                                            </td>
                                            <td className="p-4 text-slate-300">
                                                {formatDate(booking.endTime)}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-1 font-medium text-white">
                                                    <span className="text-emerald-400 font-bold">S/</span>
                                                    {booking.totalPrice}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                {booking.paymentMethod ? (
                                                    <span className="text-xs font-bold px-2 py-1 rounded-lg bg-white/5 text-slate-300">
                                                        {booking.paymentMethod}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-600 text-xs">—</span>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${getStatusColor(booking.status)}`}>
                                                    {booking.status === 'CONFIRMED' ? 'Confirmada' :
                                                        booking.status === 'PENDING' ? 'Pendiente' :
                                                            booking.status === 'CANCELLED' ? 'Cancelada' : booking.status}
                                                </span>
                                            </td>
                                            <td className="p-4 pr-6 text-right">
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => setBookingToView(booking)} className="text-slate-400 hover:text-sky-400 p-1.5 rounded-lg hover:bg-white/10 transition-colors" title="Ver Detalles">
                                                        <Info className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => openEditModal(booking)} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors" title="Editar">
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => setBookingToDelete(booking)} className="text-slate-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-white/10 transition-colors" title="Eliminar">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Premium Booking Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />
                    <div className="glass border border-white/10 rounded-[2rem] w-full max-w-5xl max-h-[90vh] relative z-10 shadow-2xl flex flex-col lg:flex-row overflow-hidden animate-in fade-in zoom-in-95 duration-300">

                        {/* Left Column - Minimap & Invoice Preview */}
                        <div className="w-full lg:w-[40%] bg-slate-950/50 p-6 lg:p-8 border-b lg:border-b-0 lg:border-r border-white/5 flex flex-col relative overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">
                            {/* Decorative background glow based on status */}
                            <div className={`absolute -top-10 -left-10 w-40 h-40 rounded-full blur-[80px] opacity-20 ${form.status === 'CONFIRMED' ? 'bg-emerald-500' : form.status === 'CANCELLED' ? 'bg-red-500' : 'bg-accent'}`} />

                            <h3 className="text-xl font-bold text-white mb-6">Resumen Táctico</h3>

                            {/* SVG MiniMap Component */}
                            <div className="w-full relative z-10 bg-slate-900/40 rounded-2xl p-4 border border-white/5 mb-6">
                                {activeField ? (
                                    <>
                                        <div className="flex justify-between items-center mb-4">
                                            <span className="text-sm font-bold text-slate-300 flex items-center gap-2">
                                                <MapPin className="w-4 h-4 text-accent" /> {activeField.name}
                                            </span>
                                            <span className="text-[10px] font-bold px-2 py-1 rounded bg-white/5 text-slate-400 uppercase">
                                                {activeField.type} • {activeField.surface || 'Sintético'}
                                            </span>
                                        </div>
                                        <div className="h-[180px] flex items-center justify-center">
                                            <FieldMiniMap type={activeField.type} surface={activeField.surface || 'Sintético'} />
                                        </div>
                                    </>
                                ) : (
                                    <div className="h-[220px] flex flex-col items-center justify-center text-slate-500">
                                        <MapPin className="w-8 h-8 opacity-20 mb-2" />
                                        <p className="text-sm">Selecciona una cancha</p>
                                    </div>
                                )}
                            </div>

                            {/* Live Invoice Ticket */}
                            <div className="mt-auto bg-slate-900/60 rounded-2xl p-6 border border-white/5 relative overflow-hidden backdrop-blur-xl group">
                                <div className="absolute right-0 top-0 w-24 h-24 bg-accent/5 rounded-full blur-2xl group-hover:bg-accent/10 transition-colors" />
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <span className="text-emerald-400 font-bold">S/</span>
                                    Borrador de Facturación
                                </p>

                                <div className="space-y-3 mb-4">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-400">Tarifa base ({activeField?.pricePerHour || 0}/hr)</span>
                                        <span className="text-white">S/ {activeField?.pricePerHour || 0}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-400">Duración ({form.duration} min)</span>
                                        <span className="text-white">x {(form.duration / 60).toFixed(1)}</span>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-white/10 flex justify-between items-end">
                                    <span className="text-slate-300 font-medium">Total a cobrar</span>
                                    <span className="text-4xl font-black text-white flex items-start gap-1">
                                        <span className="text-xl text-emerald-400 mt-1">S/.</span>
                                        {form.totalPrice.toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Booking Form */}
                        <div className="w-full lg:w-[60%] p-6 lg:p-8 bg-slate-900/20 flex flex-col justify-start overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">
                            <div className="flex justify-between items-start mb-6 lg:mb-8 text-left">
                                <div>
                                    <h2 className="text-2xl font-bold text-white tracking-tight">
                                        {bookingToEdit ? "Editar Reserva" : "Programar Nueva Reserva"}
                                    </h2>
                                    <p className="text-slate-400 mt-1 text-sm">Organiza e ingresa los datos del cliente al ecosistema.</p>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSave} className="space-y-5">
                                {/* Client Selector */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                                        Cliente <span className="text-slate-500 font-normal text-xs">(opcional)</span>
                                    </label>
                                    {form.clientId ? (
                                        // Selected client card
                                        <div className="flex items-center gap-3 bg-accent/5 border border-accent/30 rounded-xl p-3">
                                            <div className="w-9 h-9 rounded-xl bg-accent/20 flex items-center justify-center text-xs font-black text-accent flex-shrink-0">
                                                {clientsList.find(c => c.id === form.clientId)?.name?.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() || '?'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-white font-bold text-sm truncate">{clientsList.find(c => c.id === form.clientId)?.name}</p>
                                                <p className="text-slate-400 text-xs flex items-center gap-1">
                                                    <Phone className="w-3 h-3" />
                                                    {clientsList.find(c => c.id === form.clientId)?.phone}
                                                </p>
                                            </div>
                                            <button type="button" onClick={() => setForm({ ...form, clientId: "" })} className="p-1.5 text-slate-500 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        // Search dropdown
                                        <div className="relative">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                            <input
                                                type="text"
                                                value={clientSearch}
                                                onFocus={() => setShowClientDropdown(true)}
                                                onChange={e => { setClientSearch(e.target.value); setShowClientDropdown(true); }}
                                                onBlur={() => setTimeout(() => setShowClientDropdown(false), 200)}
                                                placeholder="Buscar cliente por nombre o teléfono..."
                                                className="w-full bg-slate-900/80 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all text-sm"
                                            />
                                            {showClientDropdown && (
                                                <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-white/10 rounded-xl overflow-hidden z-20 shadow-2xl max-h-48 overflow-y-auto">
                                                    {clientsList
                                                        .filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase()) || c.phone.includes(clientSearch))
                                                        .slice(0, 6)
                                                        .map(c => (
                                                            <button
                                                                key={c.id}
                                                                type="button"
                                                                onMouseDown={() => { setForm({ ...form, clientId: c.id }); setClientSearch(""); setShowClientDropdown(false); }}
                                                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left"
                                                            >
                                                                <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center text-[10px] font-black text-accent flex-shrink-0">
                                                                    {c.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                                                                </div>
                                                                <div>
                                                                    <p className="text-white font-medium text-sm">{c.name}</p>
                                                                    <p className="text-slate-400 text-xs">{c.phone}</p>
                                                                </div>
                                                            </button>
                                                        ))
                                                    }
                                                    {clientsList.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase()) || c.phone.includes(clientSearch)).length === 0 && (
                                                        <p className="text-slate-500 text-sm px-4 py-3">Sin resultados — <a href="/dashboard/users" className="text-accent underline">crear nuevo cliente</a></p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Field Select */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-300 mb-2">Cancha Deportiva</label>
                                    <div className="relative">
                                        <select
                                            required
                                            value={form.fieldId}
                                            onChange={e => setForm({ ...form, fieldId: e.target.value })}
                                            className="w-full bg-slate-900/80 border border-white/10 rounded-xl pl-4 pr-10 py-3.5 text-white focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all appearance-none"
                                        >
                                            {fields.map(f => (
                                                <option key={f.id} value={f.id}>{f.name} (Capacidad: {f.type})</option>
                                            ))}
                                        </select>
                                        <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                                            <MapPin className="w-4 h-4 text-slate-500" />
                                        </div>
                                    </div>
                                </div>

                                {/* Date & Start Time */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-300 mb-2">Hora de Ingreso</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                            <Clock className="w-5 h-5 text-slate-500" />
                                        </div>
                                        <input
                                            required
                                            type="datetime-local"
                                            value={form.startTime}
                                            // Optional: ensure minutes step linearly e.g., 15 minute increments
                                            step="900"
                                            onChange={e => setForm({ ...form, startTime: e.target.value })}
                                            className="w-full bg-slate-900/80 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all font-mono"
                                        />
                                    </div>
                                </div>

                                {/* Interactive Duration Selector */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-300 mb-2">Tiempo de Alquiler</label>
                                    <div className="grid grid-cols-4 gap-3">
                                        {[60, 90, 120].map((mins) => (
                                            <button
                                                key={mins}
                                                type="button"
                                                onClick={() => setForm({ ...form, duration: mins })}
                                                className={`relative py-3 rounded-xl border text-sm font-bold transition-all ${form.duration === mins
                                                    ? 'bg-accent/10 border-accent text-accent shadow-[0_0_15px_rgba(56,189,248,0.2)]'
                                                    : 'bg-slate-900/50 border-white/5 text-slate-400 hover:bg-white/5 hover:text-slate-300'
                                                    }`}
                                            >
                                                {mins} min
                                                {form.duration === mins && (
                                                    <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-accent text-slate-950 rounded-full flex items-center justify-center">
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
                                                    : 'bg-slate-900/50 border-white/5 text-slate-400'
                                                    }`}
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 pointer-events-none">m</span>
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
                                                    ? status === 'CONFIRMED' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-amber-500/10 border-amber-500 text-amber-400'
                                                    : 'bg-slate-900/50 border-white/5 text-slate-500 hover:bg-white/5'
                                                    }`}
                                            >
                                                {status === 'CONFIRMED' ? '✓ Pagada' : '⏳ Pendiente de Pago'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Payment Method — only show if CONFIRMED */}
                                {form.status === 'CONFIRMED' && (
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-300 mb-2">Método de Pago</label>
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
                                                        ? 'bg-white/10 border-white/30 text-white shadow-lg'
                                                        : 'bg-slate-900/50 border-white/5 text-slate-500 hover:bg-white/5 hover:border-white/10'
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
                                <div className="pt-5 mt-2 border-t border-white/5 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-6 py-4 rounded-xl font-bold border border-white/10 text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="flex-1 bg-accent text-slate-950 py-4 rounded-xl font-black text-lg hover:bg-accent/90 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(56,189,248,0.2)] hover:scale-[1.02] active:scale-95"
                                    >
                                        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CalendarIcon className="w-5 h-5" />}
                                        {bookingToEdit ? "Guardar Cambios" : "Confirmar Reserva"}
                                    </button>
                                </div>



                            </form>

                        </div>
                    </div>
                </div>
            )}

            {/* View Booking Details Modal */}
            {bookingToView && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setBookingToView(null)} />
                    <div className="glass border border-white/10 rounded-3xl w-full max-w-lg relative z-10 shadow-2xl animate-in fade-in zoom-in-95 duration-300 overflow-hidden">

                        {/* Status Header Bar */}
                        <div className={`h-2 w-full ${bookingToView.status === 'CONFIRMED' ? 'bg-emerald-500' :
                            bookingToView.status === 'CANCELLED' ? 'bg-red-500' : 'bg-amber-500'
                            }`} />

                        <div className="p-8">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-2xl font-black text-white tracking-tight">Detalles de Reserva</h2>
                                    <p className="text-slate-400 text-sm mt-1">Información completa de la sesión</p>
                                </div>
                                <button onClick={() => setBookingToView(null)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-slate-400 transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-6">
                                {/* Estado y Pago */}
                                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                                    <div>
                                        <p className="text-[10px] uppercase font-black tracking-widest text-slate-500 mb-1">Estado</p>
                                        <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${getStatusColor(bookingToView.status)}`}>
                                            {bookingToView.status === 'CONFIRMED' ? 'Confirmada' :
                                                bookingToView.status === 'PENDING' ? 'Pendiente' :
                                                    bookingToView.status === 'CANCELLED' ? 'Cancelada' : bookingToView.status}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] uppercase font-black tracking-widest text-slate-500 mb-1">Total</p>
                                        <p className="text-xl font-black text-white leading-none">S/ {bookingToView.totalPrice}</p>
                                    </div>
                                </div>

                                {/* Fechas y Cancha con MiniMap */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-4 bg-slate-900/50 rounded-2xl border border-white/5 flex flex-col items-center justify-center relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <p className="text-[10px] uppercase font-black tracking-widest text-slate-500 mb-2 w-full text-left flex items-center gap-1.5 z-10">
                                            <MapPin className="w-3 h-3 text-accent" /> Cancha Deportiva
                                        </p>
                                        <p className="text-sm font-bold text-white mb-4 z-10 w-full text-left">{bookingToView.field?.name.toUpperCase()}</p>

                                        <div className="w-full h-[100px] flex items-center justify-center z-10 mb-2">
                                            <FieldMiniMap
                                                type={bookingToView.field?.type || "Fútbol 5"}
                                                surface={bookingToView.field?.surface || "Sintético"}
                                            />
                                        </div>
                                        <div className="flex gap-2 w-full justify-center z-10">
                                            <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-white/5 text-slate-400 uppercase tracking-wider">
                                                {bookingToView.field?.type}
                                            </span>
                                            <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-accent/20 text-accent uppercase tracking-wider">
                                                {bookingToView.field?.surface || 'Sintético'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-4">
                                        <div className="flex-1 p-4 bg-slate-900/50 rounded-2xl border border-white/5 flex flex-col justify-center">
                                            <p className="text-[10px] uppercase font-black tracking-widest text-slate-500 mb-2 flex items-center gap-1.5">
                                                <Clock className="w-3 h-3 text-accent" /> Inicio de Reserva
                                            </p>
                                            <p className="text-sm font-bold text-white">{formatDate(bookingToView.startTime)}</p>
                                        </div>
                                        <div className="flex-1 p-4 bg-slate-900/50 rounded-2xl border border-white/5 flex flex-col justify-center">
                                            <p className="text-[10px] uppercase font-black tracking-widest text-slate-500 mb-2 flex items-center gap-1.5">
                                                <Clock className="w-3 h-3 text-red-400" /> Fin de Reserva
                                            </p>
                                            <p className="text-sm font-bold text-white">{formatDate(bookingToView.endTime)}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Cliente */}
                                <div>
                                    <p className="text-[10px] uppercase font-black tracking-widest text-slate-500 mb-3">Cliente</p>
                                    {bookingToView.client ? (
                                        <div className="flex items-center gap-4 bg-accent/5 border border-accent/20 rounded-2xl p-4">
                                            <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center text-lg font-black text-accent flex-shrink-0">
                                                {bookingToView.client.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-base font-bold text-white truncate">{bookingToView.client.name}</p>
                                                <p className="text-sm text-slate-400 mt-0.5">{bookingToView.client.phone}</p>
                                            </div>

                                            {/* Whatsapp Button */}
                                            <button
                                                onClick={() => {
                                                    const cleanPhone = bookingToView.client.phone.replace(/\D/g, '');
                                                    window.open(`https://wa.me/${cleanPhone}`, '_blank');
                                                }}
                                                className="flex-shrink-0 w-10 h-10 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-green-400 rounded-xl flex items-center justify-center transition-all group"
                                                title="Contactar por WhatsApp"
                                            >
                                                <MessageSquare className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="p-4 bg-slate-900/50 rounded-2xl border border-white/5 text-center">
                                            <p className="text-sm text-slate-500">Reserva sin cliente asignado (Walk-in)</p>
                                        </div>
                                    )}
                                </div>

                                {/* Acciones Rápidas (Pago) */}
                                {bookingToView.status === 'PENDING' && (
                                    <div className="pt-4 border-t border-white/5">
                                        {!isPayingQuick ? (
                                            <button
                                                onClick={() => setIsPayingQuick(true)}
                                                className="w-full bg-accent/10 hover:bg-accent/20 text-accent font-bold py-3.5 rounded-xl border border-accent/20 transition-all flex items-center justify-center gap-2"
                                            >
                                                <CreditCard className="w-5 h-5" />
                                                Marcar como Pagado
                                            </button>
                                        ) : (
                                            <div className="animate-in slide-in-from-top-2 duration-200">
                                                <div className="flex justify-between items-center mb-3">
                                                    <p className="text-[10px] uppercase font-black tracking-widest text-slate-500">Seleccionar Método</p>
                                                    <button onClick={() => setIsPayingQuick(false)} className="text-slate-500 hover:text-white text-xs">Cancelar</button>
                                                </div>
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
                                                            onClick={() => handleQuickPay(key)}
                                                            disabled={isSubmitting}
                                                            className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl bg-slate-900/50 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all"
                                                        >
                                                            <Icon className={`w-4 h-4 ${color}`} />
                                                            <span className="text-xs font-bold text-slate-300">{key}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={!!bookingToDelete}
                onClose={() => setBookingToDelete(null)}
                onConfirm={handleDelete}
                title="¿Eliminar reserva?"
                message="Estás a punto de eliminar esta reserva permanentemente. Si fue un error, podrías simplemente cambiar su estado a 'Cancelada'."
                confirmText="Sí, eliminar"
                cancelText="Mantener reserva"
                type="danger"
            />
        </div>
    );
}
