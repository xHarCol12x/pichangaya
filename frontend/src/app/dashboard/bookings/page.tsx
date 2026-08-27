"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Plus, Edit2, Trash2, Calendar as CalendarIcon, MapPin, Loader2, AlertCircle, ChevronRight, Lock } from "lucide-react";
import { bookings as bookingsApi, fields as fieldsApi, clients as clientsApi, users } from "@/lib/api";
import ConfirmModal from "@/components/ui/ConfirmModal";
import UpgradeModal from "@/components/ui/UpgradeModal";
import BookingFormModal from "@/components/bookings/BookingFormModal";
import BookingDetailModal from "@/components/bookings/BookingDetailModal";
import { useVenue } from "@/context/VenueContext";
import NoVenuePlaceholder from "@/components/dashboard/NoVenuePlaceholder";
import StatusBadge from "@/components/ui/StatusBadge";

// Tipos
import { Booking, Field, Client, PlanType, ApiResponse, PlanPermissions, UserFeatureOverrides, UserWithPermissions, BookingStatus } from "@/types";

interface BookingForm {
    fieldId: string;
    startTime: string;
    duration: number;
    status: BookingStatus;
    totalPrice: number;
    clientId: string;
    paymentMethod: string;
}

export default function BookingsPage() {
    const { selectedVenueId, venues: myVenues, isLoadingVenues } = useVenue();

    const [bookings, setBookings] = useState<Booking[]>([]);
    const [fields, setFields] = useState<Field[]>([]);
    const [clientsList, setClientsList] = useState<Client[]>([]);
    const [userPlan, setUserPlan] = useState<PlanType>('basic');
    const [planPermissions, setPlanPermissions] = useState<PlanPermissions>({});
    const [featureOverrides, setFeatureOverrides] = useState<UserFeatureOverrides>({});
    
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [bookingToEdit, setBookingToEdit] = useState<Booking | null>(null);
    const [bookingToDelete, setBookingToDelete] = useState<Booking | null>(null);
    const [bookingToView, setBookingToView] = useState<Booking | null>(null);
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
    const [upgradeMessage, setUpgradeMessage] = useState("");

    const getInitialForm = useCallback((): BookingForm => {
        const now = new Date();
        const start = new Date(now.getTime() + 60 * 60 * 1000);
        start.setMinutes(0, 0, 0);

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
    }, []);

    const [form, setForm] = useState<BookingForm>(getInitialForm());

    const loadData = useCallback(async () => {
        if (!selectedVenueId) return;
        setIsLoading(true);
        try {
            const userStr = typeof window !== 'undefined' ? localStorage.getItem("fieldiq_user") : null;
            const userObj = userStr ? JSON.parse(userStr) : null;

            const [fieldsRes, bookingsRes, uRes] = await Promise.all([
                fieldsApi.getAll(selectedVenueId) as Promise<ApiResponse<Field[]>>,
                bookingsApi.getAll().catch(() => ({ data: [] })) as Promise<ApiResponse<Booking[]>>,
                users.getMe().catch(() => ({ data: {} })) as Promise<ApiResponse<UserWithPermissions>>
            ]);

            setUserPlan(String(uRes.data?.plan || userObj?.plan || 'basic').toLowerCase() as PlanType);
            setFeatureOverrides(uRes.data?.featureOverrides || userObj?.featureOverrides || {});
            setPlanPermissions(uRes.data?.planPermissions || userObj?.planPermissions || {});

            const venueFieldIds = fieldsRes.data.map((f: Field) => f.id);
            const venueBookings = bookingsRes.data.filter((b: Booking) => venueFieldIds.includes(b.fieldId));

            const cRes = await clientsApi.getAll(selectedVenueId).catch(() => ({ data: [] })) as ApiResponse<Client[]>;
            setClientsList(cRes.data || []);

            const enrichedBookings = venueBookings.map((b: Booking) => ({
                ...b,
                field: fieldsRes.data.find((f: Field) => f.id === b.fieldId) || { name: "Cancha eliminada" } as Field
            })).sort((a: Booking, b: Booking) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

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
    }, [selectedVenueId, form.fieldId]);

    useEffect(() => {
        if (selectedVenueId) {
            const fetch = async () => { await loadData(); };
            fetch();
        } else if (!isLoadingVenues && myVenues.length === 0) {
            const timer = setTimeout(() => setIsLoading(false), 0);
            return () => clearTimeout(timer);
        }
    }, [selectedVenueId, isLoadingVenues, myVenues, loadData]);

    const activeField = useMemo(() => fields.find(f => f.id === form.fieldId), [fields, form.fieldId]);


    useEffect(() => {
        if (activeField && form.duration) {
            const price = (activeField.pricePerHour * (form.duration / 60));
            const timer = setTimeout(() => {
                setForm(prev => {
                    if (Math.abs(prev.totalPrice - price) < 0.01) return prev;
                    return { ...prev, totalPrice: price };
                });
            }, 0);
            return () => clearTimeout(timer);
        }
    }, [form.duration, activeField]);


    const handleSave = async (eOrData: React.FormEvent | BookingForm, optionalId?: string) => {
        const isEvent = (e: React.FormEvent | BookingForm): e is React.FormEvent => !!(e && (e as React.FormEvent).preventDefault);
        if (isEvent(eOrData)) eOrData.preventDefault();

        const formData: BookingForm = isEvent(eOrData) ? form : eOrData;
        const targetId = isEvent(eOrData) ? bookingToEdit?.id : optionalId;

        setIsSubmitting(true);
        try {
            const startDate = new Date(formData.startTime);
            const endDate = new Date(startDate.getTime() + formData.duration * 60000);

            const payload = {
                fieldId: formData.fieldId,
                startTime: startDate.toISOString(),
                endTime: endDate.toISOString(),
                status: formData.status,
                totalPrice: Number(formData.totalPrice),
                paymentMethod: formData.paymentMethod || undefined,
                clientId: formData.clientId || undefined
            };

            const fieldObj = fields.find((f: Field) => f.id === formData.fieldId) || { name: "Cancha" } as Field;
            const clientObj = clientsList.find((c: Client) => c.id === formData.clientId) || null;

            if (targetId) {
                await bookingsApi.update(targetId, payload);
                setBookings(prev => prev.map(b =>
                    b.id === targetId
                        ? { ...b, startTime: startDate.toISOString(), endTime: endDate.toISOString(), status: formData.status, totalPrice: Number(formData.totalPrice), paymentMethod: formData.paymentMethod || undefined, field: fieldObj, client: clientObj as Client }
                        : b
                ));
            } else {
                const res = await bookingsApi.create(payload);
                const newBooking = { ...res.data, field: fieldObj, client: clientObj as Client };
                setBookings(prev => [newBooking, ...prev]);
            }

            setIsModalOpen(false);
            setBookingToEdit(null);
            setForm(getInitialForm());
            setTimeout(() => { const f = async () => { await loadData(); }; f(); }, 800);
        } catch (error: unknown) {
            console.error("Error saving booking", error);
            const err = error as { response?: { data?: { message?: string } }, message?: string };
            const msg = err.response?.data?.message || err.message || "Verifica conflictos de horario";
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
            setTimeout(() => { const f = async () => { await loadData(); }; f(); }, 500);
        } catch (error) {
            console.error("Error deleting booking", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const currentMonthBookings = useMemo(() => {
        const now = new Date();
        return bookings.filter(b => {
            const date = new Date(b.startTime);
            return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
        }).length;
    }, [bookings]);

    const canCreateBooking = useMemo(() => {
        const userStr = typeof window !== 'undefined' ? localStorage.getItem("fieldiq_user") : null;
        const user = userStr ? JSON.parse(userStr) : null;
        const planDetails = user?.planDetails;
        const maxBookings = planDetails?.limitBookings ?? ((userPlan === 'basic') ? 200 : (userPlan === 'free_trial' || userPlan === 'starter') ? 50 : 9999);
        return currentMonthBookings < maxBookings;
    }, [currentMonthBookings, userPlan]);

    const canDeleteBookings = userPlan === 'pro' || userPlan === 'enterprise' || featureOverrides?.canDeleteBookings === true || planPermissions?.canDeleteBookings === true;

    const openCreateModal = () => {
        if (!canCreateBooking) {
            setUpgradeMessage(`Su plan actual solo permite un máximo de reservas por mes. Mejora a PRO para reservas ilimitadas.`);
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

    const openEditModal = (booking: Booking) => {
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

    const formatDateStr = (isoString: string) => {
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
        return <NoVenuePlaceholder />;
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-700 w-full overflow-hidden px-1 sm:px-0">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">Reservas</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium">Administra los turnos de tus canchas con precisión.</p>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                    {(userPlan === 'pro' || userPlan === 'enterprise' || featureOverrides?.canExportData || planPermissions?.canExportData) ? (
                        <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 px-4 py-2.5 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-white/10 transition-all shadow-sm active:scale-95">
                            <span className="text-[10px] tracking-wider uppercase font-black px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/5 border border-divider">CSV</span>
                            <span className="text-sm">Exportar</span>
                        </button>
                    ) : (
                        <button disabled className="hidden sm:flex items-center gap-2 bg-slate-100 dark:bg-slate-900/50 border border-transparent text-slate-400 dark:text-slate-600 px-4 py-2.5 rounded-xl font-bold cursor-not-allowed opacity-50">
                            <Lock className="w-4 h-4" /> <span className="text-sm">Exportar</span>
                        </button>
                    )}
                    <button
                        onClick={openCreateModal}
                        disabled={!canCreateBooking || isSubmitting}
                        className="flex-[2] sm:flex-none flex items-center justify-center gap-2 bg-[#cafd00] text-slate-950 px-6 py-2.5 rounded-xl font-black hover:bg-[#b8e600] transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-[#cafd00]/10 text-sm uppercase tracking-widest"
                    >
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 stroke-[3]" />}
                        Nueva Reserva
                    </button>
                </div>
            </div>

            {fields.length === 0 && (
                <div className="glass rounded-2xl p-6 text-center border border-amber-500/30 bg-amber-500/5 mb-6">
                    <p className="text-amber-400 text-sm font-bold flex items-center justify-center gap-2">
                        <AlertCircle className="w-4 h-4" /> Debes crear al menos una cancha antes de registrar reservas.
                    </p>
                </div>
            )}

            <div className="glass rounded-[2rem] border border-white/5 overflow-hidden bg-slate-950/20 backdrop-blur-sm shadow-2xl">
                {bookings.length === 0 ? (
                    <div className="py-24 text-center">
                        <CalendarIcon className="w-16 h-16 text-slate-400 dark:text-slate-800 mx-auto mb-6 animate-pulse" />
                        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight">No hay reservas</h3>
                        <p className="text-slate-500 dark:text-slate-500 text-sm">Aún no se han registrado reservas en el sistema.</p>
                        <button onClick={openCreateModal} className="mt-8 text-[#cafd00] text-xs font-black uppercase tracking-[0.2em] hover:underline underline-offset-4">+ Iniciar Primer Turno</button>
                    </div>
                ) : (
                    <>
                        <div className="block lg:hidden divide-y divide-white/5">
                            {bookings.map((booking) => {
                                const isCompleted = new Date(booking.endTime) < new Date();
                                const isCancelled = booking.status === 'CANCELLED';
                                return (
                                    <div key={booking.id} className={`p-6 flex flex-col gap-4 ${isCancelled ? 'opacity-50 grayscale' : isCompleted ? 'opacity-70' : 'bg-white/[0.01]'}`}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black border ${isCancelled ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-[#cafd00]/10 border-[#cafd00]/20 text-[#cafd00]'}`}>
                                                    {booking.client?.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() || '??'}
                                                </div>
                                                <div>
                                                    <p className="text-white font-black text-sm uppercase tracking-tight truncate max-w-[140px]">{booking.client?.name || 'Invitado'}</p>
                                                    <p className="text-[#adaaaa] text-[10px] font-mono mt-0.5">{booking.client?.phone || 'Sin teléfono'}</p>
                                                </div>
                                            </div>
                                            <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border ${getStatusColor(booking.status)}`}>
                                                {booking.status === 'CONFIRMED' ? 'Confirmada' : booking.status === 'PENDING' ? 'Pendiente' : 'Cancelada'}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 py-4 border-y border-white/5">
                                            <div>
                                                <span className="text-[9px] text-[#777575] font-black uppercase tracking-widest block mb-1">Cancha y Horario</span>
                                                <p className="text-white text-xs font-bold truncate">{booking.field?.name.toUpperCase()}</p>
                                                <p className="text-[#adaaaa] text-[10px] font-mono mt-0.5">{formatDateStr(booking.startTime)}</p>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[9px] text-[#777575] font-black uppercase tracking-widest block mb-1">Inversión</span>
                                                <p className="text-[#cafd00] text-lg font-black font-space-grotesk leading-none">S/ {booking.totalPrice}</p>
                                                {booking.paymentMethod && <span className="text-[9px] text-slate-500 uppercase font-black mt-1 block">{booking.paymentMethod}</span>}
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            <button onClick={() => setBookingToView(booking)} className="flex-1 bg-white/5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all active:scale-95 border border-white/5">Ver</button>
                                            <button onClick={() => openEditModal(booking)} className="flex-1 bg-white/5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all active:scale-95 border border-white/5">Editar</button>
                                            
                                            {canDeleteBookings && (
                                                <button onClick={() => setBookingToDelete(booking)} disabled={isSubmitting} className="p-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all active:scale-95 border border-red-500/20">
                                                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="hidden lg:block overflow-x-auto text-left no-scrollbar">
                            <table className="w-full min-w-[1000px]">
                                <thead>
                                    <tr className="border-b border-white/5 text-[#adaaaa] text-[10px] font-black uppercase tracking-[0.2em] bg-white/[0.02]">
                                        <th className="p-6 pl-8">Cancha</th>
                                        <th className="p-6">Cliente</th>
                                        <th className="p-6">Fecha</th>
                                        <th className="p-6">Horario</th>
                                        <th className="p-6">Total</th>
                                        <th className="p-6 text-center">Estado</th>
                                        <th className="p-6 pr-8 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {bookings.map((booking) => {
                                        const isCompleted = new Date(booking.endTime) < new Date();
                                        const isCancelled = booking.status === 'CANCELLED';
                                        let rowStyle = "hover:bg-white/[0.03] transition-all group";
                                        if (isCancelled) rowStyle += " opacity-40 grayscale";
                                        else if (isCompleted) rowStyle += " opacity-60";
                                        return (
                                            <tr key={booking.id} className={rowStyle}>
                                                <td className="p-6 pl-8">
                                                    <div className="flex items-center gap-3">
                                                        <MapPin className="w-4 h-4 text-[#cafd00] opacity-50" />
                                                        <span className="font-black text-white text-sm tracking-tight">{booking.field?.name.toUpperCase()}</span>
                                                    </div>
                                                </td>
                                                <td className="p-6">
                                                    {booking.client ? (
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center text-[10px] font-black text-accent border border-accent/20">
                                                                {booking.client.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-white text-sm font-bold truncate max-w-[150px] tracking-tight">{booking.client.name}</p>
                                                                <p className="text-slate-500 font-mono text-[10px] mt-0.5">{booking.client.phone}</p>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-600 text-xs font-bold uppercase tracking-widest">Sin cliente</span>
                                                    )}
                                                </td>
                                                <td className="p-6 text-slate-300 text-sm font-medium">{formatDateStr(booking.startTime)}</td>
                                                <td className="p-6">
                                                    <div className="flex items-center gap-2 text-white font-mono text-sm">
                                                        <span className="font-black">{new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                        <span className="text-slate-600">→</span>
                                                        <span className="text-slate-400">{new Date(booking.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                </td>
                                                <td className="p-6">
                                                    <div className="flex flex-col">
                                                        <span className="text-white font-black font-space-grotesk text-lg leading-none">S/ {booking.totalPrice}</span>
                                                        {booking.paymentMethod && <span className="text-[9px] text-[#cafd00] font-black uppercase tracking-widest mt-1">{booking.paymentMethod}</span>}
                                                    </div>
                                                </td>
                                                <td className="p-6 text-center">
                                                    <StatusBadge status={booking.status} />
                                                </td>
                                                <td className="p-6 pr-8 text-right">
                                                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                                        <button onClick={() => setBookingToView(booking)} className="p-2.5 hover:bg-white/10 rounded-xl text-slate-500 hover:text-white transition-colors" title="Ver"><ChevronRight className="w-4 h-4" /></button>
                                                        <button onClick={() => openEditModal(booking)} className="p-2.5 hover:bg-white/10 rounded-xl text-slate-500 hover:text-white transition-colors" title="Editar"><Edit2 className="w-4 h-4" /></button>
                                                        {canDeleteBookings && (
                                                            <button onClick={() => setBookingToDelete(booking)} disabled={isSubmitting} className="p-2.5 hover:bg-red-500/20 rounded-xl text-slate-500 hover:text-red-400 transition-colors" title="Eliminar">
                                                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                                            </button>
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

            {/* Modals */}
            {isModalOpen && (
                <BookingFormModal
                    onClose={() => setIsModalOpen(false)}
                    onSaved={() => {
                        setIsModalOpen(false);
                        const fetch = async () => { await loadData(); };
                        fetch();
                    }}
                    fields={fields}
                    clientsList={clientsList}
                    isEditMode={!!bookingToEdit}
                    bookingToEdit={bookingToEdit}
                    saveBookingApi={handleSave}
                />
            )}

            {bookingToView && (
                <BookingDetailModal
                    booking={bookingToView}
                    onClose={() => setBookingToView(null)}
                    onPay={async (id, method) => {
                        await bookingsApi.update(id, { paymentMethod: method });
                        const f = async () => { await loadData(); }; f();
                    }}
                />
            )}

            <ConfirmModal
                isOpen={!!bookingToDelete}
                onClose={() => setBookingToDelete(null)}
                onConfirm={handleDelete}
                title="¿Eliminar reserva?"
                message="Estás a punto de eliminar esta reserva permanentemente."
                confirmText="Sí, eliminar"
                cancelText="Mantener reserva"
                type="danger"
            />

            <UpgradeModal
                isOpen={isUpgradeModalOpen}
                onClose={() => setIsUpgradeModalOpen(false)}
                planName={userPlan}
                description={upgradeMessage}
            />
        </div >
    );
}
