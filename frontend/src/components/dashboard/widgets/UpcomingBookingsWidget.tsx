"use client";

import React, { useState } from "react";
import { CalendarX, Clock, MapPin, MoreVertical, ChevronLeft, ChevronRight } from "lucide-react";

export const StatusBadge = ({ status }: { status: string }) => {
    const map: Record<string, { label: string; className: string }> = {
        CONFIRMED: { label: "Confirmada", className: "bg-emerald-500/10 text-emerald-400" },
        PENDING: { label: "Pendiente", className: "bg-amber-500/10 text-amber-400" },
        CANCELLED: { label: "Cancelada", className: "bg-red-500/10 text-red-400" },
    };
    const s = map[status] ?? { label: status, className: "bg-slate-500/10 text-slate-400" };
    return (
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${s.className}`}>
            {s.label}
        </span>
    );
};

const formatCurrency = (n: number) => `S/ ${n.toLocaleString("es-PE", { minimumFractionDigits: 0 })}`;
const formatTime = (iso: string) => new Date(iso).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
const formatDate = (iso: string) => new Date(iso).toLocaleDateString("es-PE", { weekday: "short", day: "numeric", month: "short" });
const isToday = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
};

export function UpcomingBookingsWidget({
    filteredUpcoming,
    bookingFilter,
    setBookingFilter,
    setSelectedBooking
}: {
    filteredUpcoming: any[];
    bookingFilter: string;
    setBookingFilter: (f: string) => void;
    setSelectedBooking: (b: any) => void;
}) {
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 3; // Reducido para Bento Box
    const totalPages = Math.ceil(filteredUpcoming.length / ITEMS_PER_PAGE);
    const paginatedBookings = filteredUpcoming.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    return (
        <div className="glass rounded-[2rem] border border-border overflow-hidden w-full h-full flex flex-col justify-between">
            <div className="flex flex-col md:flex-row md:items-center justify-between px-6 py-4 border-b border-border gap-4 shrink-0">
                <div>
                    <h2 className="text-base font-black text-foreground">Próximas Reservas</h2>
                    <p className="text-foreground/40 text-xs mt-0.5">{filteredUpcoming.length} res. encontradas</p>
                </div>

                <div className="flex items-center gap-1 bg-foreground/5 p-1 rounded-xl">
                    {["ALL", "CONFIRMED", "PENDING"].map(f => (
                        <button
                            key={f}
                            onClick={() => { setBookingFilter(f); setCurrentPage(1); }}
                            className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${bookingFilter === f ? "bg-background text-foreground shadow-sm" : "text-foreground/40 hover:text-foreground/70"}`}
                        >
                            {f === "ALL" ? "Todas" : f === "CONFIRMED" ? "Pagadas" : "Por Pagar"}
                        </button>
                    ))}
                </div>
            </div>

            {filteredUpcoming.length === 0 ? (
                <div className="flex-1 flex flex-col justify-center items-center py-6">
                    <CalendarX className="w-8 h-8 text-foreground/20 mx-auto mb-2" />
                    <p className="text-foreground/30 text-xs">No hay reservas próximas</p>
                </div>
            ) : (
                <div className="flex-1 overflow-x-auto min-h-0">
                    <div className="w-full h-full flex flex-col relative overflow-y-auto">
                        {paginatedBookings.map((b, i) => (
                            <div key={b.id || i} className="group shrink-0 hover:bg-foreground/[0.02] transition-colors border-b border-border/50 py-3 px-6 flex justify-between items-center gap-4 cursor-pointer" onClick={() => setSelectedBooking(b)}>
                                <div className="flex flex-col gap-1 w-1/3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                                            <MapPin className="w-3 h-3 text-accent" />
                                        </div>
                                        <span className="font-bold text-foreground text-sm truncate leading-tight block w-full">{b.field.name}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-foreground/50 ml-8 whitespace-nowrap">
                                        <span className="text-xs">{formatDate(b.startTime)}</span>
                                        {isToday(b.startTime) && <span className="text-[8px] font-black uppercase px-1 py-0.5 rounded bg-accent/15 text-accent line-height-none">Hoy</span>}
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1 w-1/3">
                                    <div className="flex items-center gap-1.5 text-foreground/50">
                                        <Clock className="w-3 h-3" />
                                        <span className="font-mono text-xs whitespace-nowrap">{formatTime(b.startTime)} - {formatTime(b.endTime || b.startTime)}</span>
                                    </div>
                                    <span className="font-black text-foreground text-xs mt-0.5">{formatCurrency(b.totalPrice || 0)}</span>
                                </div>
                                <div className="w-1/4 text-right flex flex-col items-end gap-1 shrink-0">
                                    <StatusBadge status={b.status} />
                                    <button className="text-[10px] uppercase font-bold text-foreground/30 group-hover:text-accent transition-colors mt-1">Ver detalles &rarr;</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Pagination */}
            <div className="shrink-0 flex items-center justify-between px-6 py-3 border-t border-border bg-foreground/[0.01]">
                {totalPages > 0 && <span className="text-[10px] text-foreground/40 font-medium">1-{paginatedBookings.length} de {filteredUpcoming.length}</span>}
                <div className="flex items-center gap-1 ml-auto">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="w-6 h-6 rounded border border-border flex items-center justify-center text-foreground/50 hover:text-foreground hover:bg-foreground/5 disabled:opacity-30 disabled:pointer-events-none transition-all">
                        <ChevronLeft className="w-3 h-3" />
                    </button>
                    <span className="text-[10px] font-bold text-foreground mx-1">{currentPage} / {Math.max(1, totalPages)}</span>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0} className="w-6 h-6 rounded border border-border flex items-center justify-center text-foreground/50 hover:text-foreground hover:bg-foreground/5 disabled:opacity-30 disabled:pointer-events-none transition-all">
                        <ChevronRight className="w-3 h-3" />
                    </button>
                </div>
            </div>
        </div>
    );
}
