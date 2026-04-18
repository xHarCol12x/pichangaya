"use client";

import React, { useState, useEffect } from "react";
import { fields as fieldsApi, bookings as bookingsApi, clients as clientsApi } from "@/lib/api";

import api from "@/lib/api";

import { useTransition } from "@/components/ui/TransitionOverlay";
import BookingFormModal from "@/components/bookings/BookingFormModal";
import BookingDetailModal from "@/components/bookings/BookingDetailModal";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, MapPin, Loader2, Plus, Navigation } from "lucide-react";
import { useVenue } from "@/context/VenueContext";


export default function CalendarPage() {
    const { navigateWithTransition } = useTransition();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [fields, setFields] = useState<any[]>([]);
    const [bookings, setBookings] = useState<any[]>([]);
    const [clientsList, setClientsList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [hasAccess, setHasAccess] = useState<boolean | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);


    // NUEVO: Estado para Drag & Drop
    const [draggedBookingId, setDraggedBookingId] = useState<string | null>(null);
    const [dragOverData, setDragOverData] = useState<{ fieldId: string; startTime: Date; isConflict: boolean; duration: number } | null>(null);

    // NUEVO: Funciones de Drag & Drop

    // NUEVO: Funciones de Drag & Drop
    const handleDragStart = (e: React.DragEvent, booking: any) => {
        e.dataTransfer.setData("bookingId", booking.id);
        e.dataTransfer.effectAllowed = "move";
        setDraggedBookingId(booking.id);
    };

    const handleDragEnd = () => {
        setDraggedBookingId(null);
    };

    const handleDragOverCell = (e: React.DragEvent, fieldId: string, hour: number) => {
        e.preventDefault();
        if (!draggedBookingId) return;

        const booking = bookings.find(b => b.id === draggedBookingId);
        if (!booking) return;

        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const y = e.clientY - rect.top;
        const isBottomHalf = y > rect.height / 2;
        
        const previewStart = new Date(currentDate);
        previewStart.setHours(hour, isBottomHalf ? 30 : 0, 0, 0);
        
        const durationMs = new Date(booking.endTime).getTime() - new Date(booking.startTime).getTime();
        const previewEnd = new Date(previewStart.getTime() + durationMs);

        // Conflict check
        const hasConflict = bookings.some(b => {
            if (b.id === draggedBookingId || b.status === "CANCELLED" || b.fieldId !== fieldId) return false;
            const bStart = new Date(b.startTime);
            const bEnd = new Date(b.endTime);
            return previewStart < bEnd && previewEnd > bStart;
        });

        // Past check
        const isPast = previewStart < new Date();

        setDragOverData({
            fieldId,
            startTime: previewStart,
            isConflict: hasConflict || isPast,
            duration: durationMs / 60000
        });
    };

    const handleDrop = async (e: React.DragEvent, targetFieldId: string) => {
        e.preventDefault();
        const bookingId = draggedBookingId;
        const overData = dragOverData;
        
        setDraggedBookingId(null);
        setDragOverData(null);

        if (!bookingId || !overData) return;
        if (overData.isConflict) return; // Don't drop on conflicts

        const booking = bookings.find(b => b.id === bookingId);
        if (!booking) return;

        const newStart = overData.startTime;
        const newEnd = new Date(newStart.getTime() + overData.duration * 60000);

        setLoading(true);
        try {
            await bookingsApi.update(bookingId, {
                field: { connect: { id: targetFieldId } },
                startTime: newStart.toISOString(),
                endTime: newEnd.toISOString()
            });
            await loadData();
        } catch (error) {
            console.error("Error moviendo la reserva", error);
            alert("No se pudo reprogramar la reserva.");
            setLoading(false);
        }
    };
    // Modal Interaction States
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [bookingToView, setBookingToView] = useState<any | null>(null);
    const [initialFormData, setInitialFormData] = useState<any>(null);

    // Context for global venue
    const { selectedVenueId, setSelectedVenueId, venues, isLoadingVenues } = useVenue();


    useEffect(() => {
        loadData();

        // Auto-refresh every 60 seconds
        const interval = setInterval(() => {
            loadData();
        }, 60000);

        return () => clearInterval(interval);
    }, [currentDate, selectedVenueId]);


    const loadData = async () => {
        setLoading(true);
        try {
            const userStr = localStorage.getItem("fieldiq_user");
            if (!userStr) {
                window.location.href = '/login';
                return;
            }
            const userObj = JSON.parse(userStr);
            const plan = String(userObj.plan || 'basic').toLowerCase();
            const featureOverrides = userObj?.featureOverrides || {};
            const planPermissions = userObj?.planPermissions || {};

            if (plan !== 'pro' && plan !== 'enterprise' && !featureOverrides.canViewCalendar && !planPermissions.canViewCalendar) {
                setHasAccess(false);
                setLoading(false);
                return;
            }
            setHasAccess(true);

            if (selectedVenueId) {
                const fieldsRes = await fieldsApi.getAll(selectedVenueId);
                const currentFields = fieldsRes.data || [];
                setFields(currentFields);

                // Load bookings
                const bookingsRes = await bookingsApi.getAll();
                const venueFieldIds = currentFields.map((f: any) => f.id);

                // Filtrar reservas para la fecha actual y para las canchas de esta sede
                // Usamos la fecha local para evitar desfases con UTC en la noche
                const year = currentDate.getFullYear();
                const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
                const day = currentDate.getDate().toString().padStart(2, '0');
                const todayStr = `${year}-${month}-${day}`;

                const filteredBookings = (bookingsRes.data || []).filter((b: any) => {
                    if (b.status === "CANCELLED") return false;
                    if (!venueFieldIds.includes(b.fieldId)) return false;

                    // Comparar solo la parte de la fecha (YYYY-MM-DD)
                    const bDate = new Date(b.startTime);
                    const bYear = bDate.getFullYear();
                    const bMonth = (bDate.getMonth() + 1).toString().padStart(2, '0');
                    const bDay = bDate.getDate().toString().padStart(2, '0');
                    const bDateStr = `${bYear}-${bMonth}-${bDay}`;

                    return bDateStr === todayStr;
                });
                setBookings(filteredBookings);


                // Load clients for Form Modal (venue specific)
                const clientsRes = await clientsApi.getAll(selectedVenueId);
                setClientsList(clientsRes.data || []);
            }



        } catch (error) {
            console.error("Error cargando calendario", error);
        } finally {
            setLoading(false);
        }
    };

    // Change Date
    const handlePrevDay = () => {
        const date = new Date(currentDate);
        date.setDate(date.getDate() - 1);
        setCurrentDate(date);
    };

    const handleNextDay = () => {
        const date = new Date(currentDate);
        date.setDate(date.getDate() + 1);
        setCurrentDate(date);
    };

    const handleToday = () => {
        setCurrentDate(new Date());
    };

    // Formatting Helpers
    const formatTime = (isoString: string) => {
        const d = new Date(isoString);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDateHeading = (date: Date) => {
        const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        let str = date.toLocaleDateString('es-ES', options);
        return str.charAt(0).toUpperCase() + str.slice(1);
    };

    // Grid Configuration
    const START_HOUR = 0; // 0:00 AM
    const END_HOUR = 23;  // 11:00 PM
    const hoursArr = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);

    const getBookingStyle = (b: any) => {
        const start = new Date(b.startTime);
        const end = new Date(b.endTime);

        const startMinutes = start.getHours() * 60 + start.getMinutes() - (START_HOUR * 60);
        const durationMinutes = (end.getTime() - start.getTime()) / 60000;

        const topPosition = (startMinutes / 60) * 80; // 80px per hour
        const height = (durationMinutes / 60) * 80;

        let bgColor = "bg-accent/15 border-accent/30 text-sky-900 dark:text-sky-100 shadow-[inset_0_0_15px_rgba(56,189,248,0.1)]";
        if (b.status === "PENDING") bgColor = "bg-orange-500/15 border-orange-500/30 text-orange-900 dark:text-orange-100 shadow-[inset_0_0_15px_rgba(249,115,22,0.1)]";

        return {
            top: `${topPosition}px`,
            height: `${height}px`,
            position: 'absolute' as 'absolute',
            left: '4px',
            right: '4px',
            zIndex: 10,
            className: `rounded-2xl border backdrop-blur-md p-3 text-xs overflow-hidden transition-all duration-300 hover:z-20 hover:shadow-xl hover:scale-[1.01] hover:border-white/20 cursor-pointer group ${bgColor}`
        };
    };

    const handleEmptySlotClick = (fieldId: string, hour: number) => {
        const clickedDate = new Date(currentDate);
        clickedDate.setHours(hour, 0, 0, 0);

        setInitialFormData({
            fieldId,
            startTime: clickedDate
        });
        setIsFormOpen(true);
    };

    if (!mounted) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 className="w-8 h-8 text-accent animate-spin" />
        </div>
    );

    if (hasAccess === false) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 animate-in fade-in zoom-in-95 duration-500">
                <div className="w-24 h-24 bg-accent/10 rounded-3xl rotate-12 flex items-center justify-center shadow-[0_0_40px_rgba(56,189,248,0.15)]">
                    <CalendarIcon className="w-10 h-10 text-accent -rotate-12" />
                </div>
                <div className="max-w-md mx-auto space-y-4">
                    <h2 className="text-3xl font-black text-white tracking-tight">Acceso Exclusivo</h2>
                    <p className="text-slate-400 leading-relaxed text-lg">
                        La <span className="text-accent font-semibold">Agenda Visual</span> está diseñada para administrar múltiples canchas visualmente. Mejora tu plan a <span className="text-white font-bold">PRO</span> o superior para desbloquearla.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-6rem)]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 shrink-0">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                        <CalendarIcon className="w-8 h-8 text-accent" />
                        Agenda Visual
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Organiza y visualiza las reservas diarias de tus canchas.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleToday}
                        className="px-4 py-2 text-sm font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
                    >
                        Hoy
                    </button>
                    <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-1 shadow-sm">
                        <button onClick={handlePrevDay} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="px-4 text-sm font-bold text-slate-900 dark:text-white min-w-[200px] text-center capitalize">
                            {formatDateHeading(currentDate)}
                        </span>
                        <button onClick={handleNextDay} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                    <button
                        onClick={() => navigateWithTransition('/dashboard/bookings')}
                        className="p-2 ml-2 bg-accent/10 text-accent hover:bg-accent hover:text-slate-950 rounded-xl transition-colors hidden md:flex"
                        title="Ir a Tabla de Reservas"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Config & Summary */}
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-white/10 p-3 rounded-2xl mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0 shadow-lg shadow-slate-200/20 dark:shadow-none">
                <div className="flex flex-wrap items-center gap-2">
                    <Navigation className="w-5 h-5 text-accent shrink-0" />
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                        {venues.map(v => (
                            <button
                                key={v.id}
                                onClick={() => setSelectedVenueId(v.id)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${selectedVenueId === v.id
                                    ? 'bg-accent text-slate-950 shadow-lg shadow-accent/20'
                                    : 'bg-slate-100 dark:bg-white/5 text-slate-500 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                            >
                                {v.name}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-wider text-slate-500">
                    <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-accent shadow-[0_0_8px_rgba(56,189,248,0.5)]"></span> Confirmada</div>
                    <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]"></span> Pendiente</div>
                </div>
            </div>


            {/* Calendar Grid */}
            <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl overflow-hidden flex flex-col shadow-xl shadow-slate-200/40 dark:shadow-none relative">
                {(loading || isLoadingVenues) && (
                    <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-accent animate-spin" />
                    </div>
                )}


                {/* Headers (Fields) */}
                <div className="flex border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 shrink-0">
                    <div className="w-20 shrink-0 border-r border-slate-200 dark:border-white/10 flex items-center justify-center">
                        <Clock className="w-4 h-4 text-slate-400" />
                    </div>
                    <div className="flex-1 flex overflow-x-auto no-scrollbar scroll-smooth">
                        {fields.length === 0 ? (
                            <div className="flex-1 py-4 text-center text-sm font-bold text-slate-500">No hay canchas creadas en esta sede</div>
                        ) : (
                            fields.map((f: any) => (
                                <div key={f.id} className="flex-1 min-w-[200px] py-4 text-center border-r border-slate-200 dark:border-white/10 last:border-0 font-bold text-slate-900 dark:text-white text-sm">
                                    {f.name}
                                </div>
                            ))

                        )}
                    </div>
                </div>

                {/* Body (Hours x Fields) */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden relative scroll-smooth group">
                    <div className="flex min-w-full">
                        {/* Time labels column */}
                        <div className="w-20 shrink-0 border-r border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-slate-900">
                            {hoursArr.map(hour => (
                                <div key={`label-${hour}`} className="h-[80px] border-b border-slate-200 dark:border-white/5 relative">
                                    <span className="absolute -top-3 left-0 right-0 text-center text-[10px] font-bold text-slate-400 bg-slate-50/80 dark:bg-slate-900/80">
                                        {hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                                    </span>
                                </div>
                            ))}
                        </div>

                                        {/* Column per Field */}
                        <div className="flex flex-1 relative bg-slate-50/30 dark:bg-slate-900/30">
                            {/* Horizontal grid lines for half-hours */}
                            <div className="absolute inset-0 pointer-events-none">
                                {hoursArr.map(hour => (
                                    <React.Fragment key={`grid-${hour}`}>
                                        <div className="h-[40px] border-b border-slate-200/50 dark:border-white/[0.02]" />
                                        <div className="h-[40px] border-b border-slate-200 dark:border-white/[0.05]" />
                                    </React.Fragment>
                                ))}
                            </div>

                            {/* Current Time Indicator Line */}
                            {(() => {
                                const now = new Date();
                                const isToday = now.toDateString() === currentDate.toDateString();
                                if (!isToday) return null;

                                const startMinutes = now.getHours() * 60 + now.getMinutes() - (START_HOUR * 60);
                                const topPosition = (startMinutes / 60) * 80;

                                return (
                                    <div
                                        className="absolute left-0 right-0 z-40 flex items-center pointer-events-none"
                                        style={{ top: `${topPosition}px` }}
                                    >
                                        <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] -ml-1"></div>
                                        <div className="flex-1 h-0.5 bg-gradient-to-r from-red-500/50 to-transparent"></div>
                                        <div className="bg-red-500 text-[8px] font-black text-white px-1 py-0.5 rounded ml-1 shadow-lg">
                                            {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                );
                            })()}

                            {fields.map((field: any) => {
                                const fieldBookings = bookings.filter((b: any) => b.fieldId === field.id);
                                return (
                                    <div key={`col-${field.id}`} className="flex-1 min-w-[200px] border-r border-slate-200 dark:border-white/5 last:border-0 relative">
                                        {fieldBookings.map((b: any) => {

                                            const style = getBookingStyle(b);
                                            return (
                                                <div
                                                    key={b.id}
                                                    draggable={true}
                                                    onDragStart={(e) => handleDragStart(e, b)}
                                                    onDragEnd={handleDragEnd}
                                                    style={{
                                                        top: style.top,
                                                        height: style.height,
                                                        position: style.position,
                                                        left: style.left,
                                                        right: style.right,
                                                        zIndex: draggedBookingId === b.id ? 50 : style.zIndex, 
                                                        opacity: draggedBookingId === b.id ? 0.5 : 1 
                                                    }}
                                                    className={style.className + " cursor-grab active:cursor-grabbing group/card"}
                                                    title={`${b.client?.name || 'Cliente local'} - ${b.status}`}
                                                    onClick={(e) => {
                                                        e.stopPropagation(); 
                                                        setBookingToView(b);
                                                    }}
                                                >
                                                    <div className="flex flex-col h-full">
                                                        <div className="flex items-start justify-between mb-1">
                                                            <div className="flex flex-col min-w-0">
                                                                <span className="font-bold text-sm truncate leading-tight">{b.client?.name || 'Cliente local'}</span>
                                                                <div className="flex items-center gap-1 text-[10px] opacity-70 font-medium">
                                                                    <Clock className="w-2.5 h-2.5" />
                                                                    {formatTime(b.startTime)}
                                                                </div>
                                                            </div>
                                                            <div className={`px-1.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider border ${b.status === 'PENDING' ? 'bg-orange-500/20 border-orange-500/30 text-orange-600 dark:text-orange-400' : 'bg-accent/20 border-accent/30 text-sky-600 dark:text-sky-400'}`}>
                                                                {b.status === 'PENDING' ? 'Pdte' : 'Ok'}
                                                            </div>
                                                        </div>
                                                        
                                                        {style.height && parseInt(style.height.replace('px','')) > 40 && (
                                                            <div className="mt-auto flex items-center justify-between text-[9px] font-black opacity-40 group-hover/card:opacity-80 transition-opacity uppercase tracking-widest">
                                                                <span>{Math.round((new Date(b.endTime).getTime() - new Date(b.startTime).getTime()) / 60000)} MIN</span>
                                                                <Navigation className="w-2.5 h-2.5 rotate-45" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {/* Empty hour blocks just for semantic layout if needed */}
                                        {hoursArr.map(hour => (
                                            <div
                                                key={`cell-${field.id}-${hour}`}
                                                className="h-[80px] cursor-pointer hover:bg-accent/5 transition-colors relative group/slot"
                                                onClick={() => handleEmptySlotClick(field.id, hour)}

                                                // AGREGAR ESTAS 2 LÍNEAS PARA EL DROP
                                                onDragOver={(e) => handleDragOverCell(e, field.id, hour)} 
                                                onDragLeave={() => setDragOverData(null)}
                                                onDrop={(e) => handleDrop(e, field.id)}
                                            >
                                                {/* Ghost Preview */}
                                                {dragOverData && dragOverData.fieldId === field.id && dragOverData.startTime.getHours() === hour && (
                                                    <div 
                                                        className={`absolute left-1 right-1 rounded-xl border-2 border-dashed z-30 pointer-events-none transition-all duration-150 ${dragOverData.isConflict ? 'bg-red-500/10 border-red-500/50' : 'bg-accent/10 border-accent/50 animate-pulse'}`}
                                                        style={{ 
                                                            top: `${(dragOverData.startTime.getMinutes() / 60) * 80}px`,
                                                            height: `${(dragOverData.duration / 60) * 80}px`
                                                        }}
                                                    >
                                                        <div className={`p-2 text-[10px] font-bold ${dragOverData.isConflict ? 'text-red-500' : 'text-accent'}`}>
                                                            {dragOverData.isConflict ? '⚠️ Conflicto' : 'Nueva posición'}
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/slot:opacity-100 transition-opacity">
                                                    <Plus className="w-5 h-5 text-accent/40" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Integrate Modals */}
            {isFormOpen && (
                <BookingFormModal
                    onClose={() => setIsFormOpen(false)}
                    onSaved={(savedData) => {
                        setIsFormOpen(false);
                        loadData(); // Re-fetch the refreshed bookings list
                    }}
                    initialData={initialFormData}
                    fields={fields}
                    clientsList={clientsList}
                    saveBookingApi={async (form: any) => { return await bookingsApi.create(form); }}

                />
            )}

            {bookingToView && (
                <BookingDetailModal
                    booking={bookingToView}
                    onClose={() => setBookingToView(null)}
                    onPay={async (id, method) => {
                        await bookingsApi.update(id, { paymentMethod: method });

                        loadData();
                    }}
                />
            )}
        </div>
    );
}
