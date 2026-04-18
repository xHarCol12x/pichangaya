"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Plus, Edit2, Trash2, Clock, Calendar as CalendarIcon, MapPin, Loader2, DollarSign, Search, Check, AlertCircle, X, CreditCard, Banknote, Smartphone, MessageSquare, Lock, Activity, Info, Phone } from "lucide-react";
import { bookings as bookingsApi, fields as fieldsApi, venues, clients as clientsApi, users } from "@/lib/api";
import ConfirmModal from "@/components/ui/ConfirmModal";
import UpgradeModal from "@/components/ui/UpgradeModal";
import BookingFormModal from "@/components/bookings/BookingFormModal";
import BookingDetailModal from "@/components/bookings/BookingDetailModal";
import { useVenue } from "@/context/VenueContext";
import { Navigation } from "lucide-react";


export default function BookingsPage() {
    const [bookings, setBookings] = useState<any[]>([]);
    const [fields, setFields] = useState<any[]>([]);
    const [clientsList, setClientsList] = useState<any[]>([]);
    const [userPlan, setUserPlan] = useState<string>('basic');
    const [planPermissions, setPlanPermissions] = useState<any>({});

    const [featureOverrides, setFeatureOverrides] = useState<any>({});
    
    // Global Venue Context
    const { selectedVenueId, venues: myVenues, isLoadingVenues } = useVenue();
    const myVenue = myVenues.find(v => v.id === selectedVenueId);

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
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
    const [upgradeMessage, setUpgradeMessage] = useState("");
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
        if (selectedVenueId) loadData();
    }, [selectedVenueId]);

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

            const [fieldsRes, bookingsRes, uRes] = await Promise.all([
                fieldsApi.getAll(selectedVenueId!),
                bookingsApi.getAll().catch(() => ({ data: [] })),
                users.getMe().catch(() => ({ data: {} }))
            ]);

            setUserPlan(String(uRes.data?.plan || userObj?.plan || 'basic').toLowerCase());
            setFeatureOverrides(uRes.data?.featureOverrides || userObj?.featureOverrides || {});
            setPlanPermissions(uRes.data?.planPermissions || userObj?.planPermissions || {});

            // Filter bookings by fields of this venue
            const venueFieldIds = fieldsRes.data.map((f: any) => f.id);
            const venueBookings = bookingsRes.data.filter((b: any) => venueFieldIds.includes(b.fieldId));

            // Load clients for the selected venue
            const cRes = await clientsApi.getAll(selectedVenueId!).catch(() => ({ data: [] }));
            setClientsList(cRes.data || []);

            // Map bookings with their corresponding field data
            const enrichedBookings = venueBookings.map((b: any) => ({
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


    const handleSave = async (eOrData: any, optionalId?: string) => {
        // Detect if it's a form event or direct data from the modal
        const isEvent = eOrData && typeof eOrData.preventDefault === 'function';
        if (isEvent) eOrData.preventDefault();

        const formData = isEvent ? form : eOrData;
        const targetId = isEvent ? bookingToEdit?.id : optionalId;

        setIsSubmitting(true);
        try {
            const startDate = new Date(formData.startTime);
            const endDate = new Date(startDate.getTime() + formData.duration * 60000);

            const payload: any = {
                field: { connect: { id: formData.fieldId } },
                startTime: startDate.toISOString(),
                endTime: endDate.toISOString(),
                status: formData.status,
                totalPrice: Number(formData.totalPrice),
                paymentMethod: formData.paymentMethod || undefined,
            };

            if (formData.clientId) {
                payload.client = { connect: { id: formData.clientId } };
            } else if (targetId && bookingToEdit?.clientId) {
                payload.client = { disconnect: true };
            }

            const fieldObj = fields.find((f: any) => f.id === formData.fieldId) || { name: "Cancha" };
            const clientObj = clientsList.find((c: any) => c.id === formData.clientId) || null;

            if (targetId) {
                await bookingsApi.update(targetId, payload);
                setBookings(prev => prev.map(b =>
                    b.id === targetId
                        ? { ...b, startTime: startDate.toISOString(), endTime: endDate.toISOString(), status: formData.status, totalPrice: Number(formData.totalPrice), paymentMethod: formData.paymentMethod || null, field: fieldObj, client: clientObj }
                        : b
                ));
            } else {
                const res = await bookingsApi.create(payload);
                const newBooking = { ...res.data, field: fieldObj, client: clientObj };
                setBookings(prev => [newBooking, ...prev]);
            }

            setIsModalOpen(false);
            setBookingToEdit(null);
            setForm(getInitialForm());
            // Background sync to ensure server-shaped data
            setTimeout(() => loadData(), 800);
        } catch (error: any) {
            console.error("Error saving booking", error);
            const msg = error.response?.data?.message || error.message || "Verifica conflictos de horario";
            alert("Error al guardar la reserva: " + msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!bookingToDelete) return;
        setIsSubmitting(true);
        try {
            await bookingsApi.delete(bookingToDelete.id);
            setBookings(prev => prev.filter(b => b.id !== bookingToDelete.id));
            setBookingToDelete(null);
            setTimeout(() => loadData(), 500);
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
            const updated = { ...bookingToView, status: 'CONFIRMED', paymentMethod: method };
            setBookingToView(updated);
            setBookings(prev => prev.map(b => b.id === bookingToView.id ? updated : b));
            setIsPayingQuick(false);
            setTimeout(() => loadData(), 500);
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
    const canDeleteBookings = userPlan === 'pro' || userPlan === 'enterprise' || featureOverrides?.canDeleteBookings === true || planPermissions?.canDeleteBookings === true;

    const openCreateModal = () => {
        if (!canCreateBooking) {
            setUpgradeMessage(`solo permite un máximo de ${maxBookings} reservas por mes. Mejora a PRO para reservas ilimitadas.`);
            setIsUpgradeModalOpen(true);
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

    if (isLoading || isLoadingVenues) {
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
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Gestión de Reservas</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Administra los turnos de tus canchas con precisión.</p>
                </div>
                <div className="flex items-center gap-3">
                    {(userPlan === 'pro' || userPlan === 'enterprise' || featureOverrides?.canExportData || planPermissions?.canExportData) ? (
                        <button className="hidden sm:flex items-center gap-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-white/10 transition-colors shadow-sm dark:shadow-none">
                            <span className="text-xs tracking-wider uppercase font-black">CSV</span>
                            Exportar
                        </button>
                    ) : (
                        <button disabled className="hidden sm:flex items-center gap-2 bg-slate-100 dark:bg-slate-900/50 border border-transparent text-slate-400 dark:text-slate-600 px-4 py-2 rounded-xl font-bold cursor-not-allowed">
                            <Lock className="w-4 h-4" /> Exportar (PRO)
                        </button>
                    )}
                    <button
                        onClick={openCreateModal}
                        disabled={!canCreateBooking}
                        className="flex items-center gap-2 bg-accent hover:bg-accent/90 text-slate-950 px-4 py-2 rounded-xl font-medium transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Nueva Reserva
                    </button>
                </div>
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
                        <CalendarIcon className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No hay reservas</h3>
                        <p className="text-slate-500 dark:text-slate-400">Aún no se han registrado reservas en el sistema.</p>
                    </div>
                ) : (
                    <>
                        {/* --- Mobile Card View (visible on small screens only) --- */}
                        <div className="block sm:hidden divide-y divide-white/5">
                            {bookings.map((booking) => {
                                const isCompleted = new Date(booking.endTime) < new Date();
                                const isCancelled = booking.status === 'CANCELLED';
                                return (
                                    <div key={booking.id} className={`p-4 flex flex-col gap-2 ${isCancelled ? 'opacity-50' : isCompleted ? 'opacity-60' : ''}`}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-3.5 h-3.5 text-accent" />
                                                <span className="font-bold text-white text-sm">{booking.field.name.toUpperCase()}</span>
                                            </div>
                                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getStatusColor(booking.status)}`}>
                                                {booking.status === 'CONFIRMED' ? 'Confirmada' : booking.status === 'PENDING' ? 'Pendiente' : 'Cancelada'}
                                            </span>
                                        </div>
                                        {booking.client && (
                                            <p className="text-slate-400 text-xs">👤 {booking.client.name} · {booking.client.phone}</p>
                                        )}
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                                            <span>🕐 {formatDate(booking.startTime)} - {new Date(booking.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            <span className="text-emerald-400 font-bold">S/ {booking.totalPrice}</span>
                                            {booking.paymentMethod && <span className="bg-white/5 px-1.5 py-0.5 rounded text-[10px] border border-white/5">{booking.paymentMethod}</span>}
                                        </div>

                                        <div className="flex gap-2 mt-1">
                                            <button onClick={() => setBookingToView(booking)} className="text-xs px-2 py-1 rounded-lg bg-white/5 text-slate-400 hover:text-sky-400 transition-colors">Ver</button>
                                            <button onClick={() => openEditModal(booking)} className="text-xs px-2 py-1 rounded-lg bg-white/5 text-slate-400 hover:text-white transition-colors">Editar</button>
                                            
                                            {canDeleteBookings ? (
                                                <button onClick={() => setBookingToDelete(booking)} className="text-xs px-2 py-1 rounded-lg bg-white/5 text-slate-400 hover:text-red-400 transition-colors">Eliminar</button>
                                            ) : (
                                                <button disabled className="text-xs px-2 py-1 rounded-lg bg-white/5 text-slate-400/50 cursor-not-allowed" title="Eliminar (Requiere Plan Superior)">Eliminar</button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* --- Desktop Table View (sm and above) --- */}
                        <div className="hidden sm:block overflow-x-auto text-left">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-200 dark:border-white/5 text-slate-500 dark:text-slate-400 text-sm">
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
                                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                    {bookings.map((booking) => {
                                        const isCompleted = new Date(booking.endTime) < new Date();
                                        const isCancelled = booking.status === 'CANCELLED';
                                        let rowStyle = "hover:bg-white/5 transition-colors group";
                                        if (isCancelled) rowStyle += " opacity-50 bg-red-500/5";
                                        else if (isCompleted) rowStyle += " opacity-60 bg-white/[0.02]";
                                        return (
                                            <tr key={booking.id} className={rowStyle}>
                                                <td className="p-4 pl-6">
                                                    <div className="flex items-center gap-2">
                                                        <MapPin className="w-4 h-4 text-accent" />
                                                        <span className="font-medium text-slate-900 dark:text-white">{booking.field.name.toUpperCase()}</span>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    {booking.client ? (
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-7 h-7 rounded-lg bg-accent/10 dark:bg-accent/20 flex items-center justify-center text-[10px] font-black text-accent flex-shrink-0">
                                                                {booking.client.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <p className="text-slate-900 dark:text-white text-sm font-medium leading-none">{booking.client.name}</p>
                                                                <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">{booking.client.phone}</p>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-400 dark:text-slate-600 text-xs">Sin cliente</span>
                                                    )}
                                                </td>
                                                <td className="p-4 text-slate-600 dark:text-slate-300">
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="w-4 h-4 text-slate-500" />
                                                        {formatDate(booking.startTime)}
                                                    </div>
                                                </td>
                                                <td className="p-4 text-slate-600 dark:text-slate-300">{formatDate(booking.endTime)}</td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-1 font-medium text-slate-900 dark:text-white">
                                                        <span className="text-emerald-500 dark:text-emerald-400 font-bold">S/</span>
                                                        {booking.totalPrice}
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    {booking.paymentMethod ? (
                                                        <span className="text-xs font-bold px-2 py-1 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300">{booking.paymentMethod}</span>
                                                    ) : (
                                                        <span className="text-slate-400 dark:text-slate-600 text-xs">—</span>
                                                    )}
                                                </td>
                                                <td className="p-4">
                                                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${getStatusColor(booking.status)}`}>
                                                        {booking.status === 'CONFIRMED' ? 'Confirmada' : 'Pendiente'}
                                                    </span>
                                                </td>
                                                <td className="p-4 pr-6 text-right">
                                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => setBookingToView(booking)} className="text-slate-400 hover:text-sky-400 p-1.5 rounded-lg hover:bg-white/10 transition-colors" title="Ver Detalles"><Info className="w-4 h-4" /></button>
                                                        <button onClick={() => openEditModal(booking)} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors" title="Editar"><Edit2 className="w-4 h-4" /></button>
                                                        
                                                        {canDeleteBookings ? (
                                                            <button onClick={() => setBookingToDelete(booking)} className="text-slate-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-white/10 transition-colors" title="Eliminar"><Trash2 className="w-4 h-4" /></button>
                                                        ) : (
                                                            <button disabled className="text-slate-400/30 p-1.5 rounded-lg cursor-not-allowed" title="Eliminar (Requiere Plan Superior)"><Trash2 className="w-4 h-4" /></button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>

            {/* Premium Booking Modal Extracted */}
            {isModalOpen && (
                <BookingFormModal
                    onClose={() => setIsModalOpen(false)}
                    onSaved={(savedData) => {
                        setIsModalOpen(false);
                        loadData(); // Re-fetch the refreshed bookings list
                    }}
                    fields={fields}
                    clientsList={clientsList}
                    isEditMode={!!bookingToEdit}
                    bookingToEdit={bookingToEdit}
                    saveBookingApi={handleSave}
                />
            )}

            {/* View Booking Details Modal Extracted */}
            {
                bookingToView && (
                    <BookingDetailModal
                        booking={bookingToView}
                        onClose={() => setBookingToView(null)}
                        onPay={async (id, method) => {
                            await bookingsApi.update(id, { paymentMethod: method });
                            loadData(); // Re-fetch all
                        }}
                    />
                )
            }

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

            {/* Premium Upgrade Modal */}
            <UpgradeModal
                isOpen={isUpgradeModalOpen}
                onClose={() => setIsUpgradeModalOpen(false)}
                planName={userPlan}
                description={upgradeMessage}
            />
        </div >
    );
}
