"use client";

import React, { useState } from "react";
import { CalendarX, Clock, MapPin, ChevronLeft, ChevronRight } from "lucide-react";
import StatusBadge from "@/components/ui/StatusBadge";
import { Booking } from "@/types";

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
    filteredUpcoming: Booking[];
    bookingFilter: string;
    setBookingFilter: (f: string) => void;
    setSelectedBooking: (b: Booking) => void;
}) {
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 3; 
    const totalPages = Math.ceil(filteredUpcoming.length / ITEMS_PER_PAGE);
    const paginatedBookings = filteredUpcoming.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    return (
        <div className="bg-[#1a1919] rounded-[1.5rem] border border-[#484847]/15 overflow-hidden w-full h-full flex flex-col justify-between">
            <div className="flex flex-col md:flex-row md:items-center justify-between px-6 py-4 border-b border-[#484847]/15 gap-4 shrink-0">
                <div>
                    <h2 className="text-xl font-black text-white font-space-grotesk tracking-tighter uppercase">Próximas Reservas</h2>
                    <p className="text-[#adaaaa] font-mono text-[10px] mt-0.5 uppercase tracking-widest">{filteredUpcoming.length} ENCONTRADAS</p>
                </div>

                <div className="flex items-center gap-1 bg-[#0e0e0e] border border-[#484847]/20 p-1 rounded-xl">
                    {["ALL", "CONFIRMED", "PENDING"].map(f => (
                        <button
                            key={f}
                            onClick={() => { setBookingFilter(f); setCurrentPage(1); }}
                            className={`px-3 py-1 rounded-lg text-[10px] font-bold font-space-grotesk uppercase tracking-wider transition-all ${bookingFilter === f ? "bg-[#cafd00] text-[#1a1919] shadow-[0_0_10px_rgba(202,253,0,0.2)]" : "text-[#adaaaa] hover:text-white"}`}
                        >
                            {f === "ALL" ? "TODAS" : f === "CONFIRMED" ? "PAGADAS" : "PENDIENTES"}
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
                            <div key={b.id || i} className="group shrink-0 hover:bg-[#262626] transition-colors border-b border-[#484847]/15 py-4 px-6 flex justify-between items-center gap-4 cursor-pointer" onClick={() => setSelectedBooking(b)}>
                                <div className="flex flex-col gap-1 w-1/3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-lg bg-[#cafd00]/10 flex items-center justify-center shrink-0">
                                            <MapPin className="w-3 h-3 text-[#cafd00]" />
                                        </div>
                                        <span className="font-bold text-white text-base font-space-grotesk uppercase tracking-tight truncate leading-tight block w-full">{b.field?.name || "Cancha"}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[#adaaaa] ml-8 whitespace-nowrap">
                                        <span className="text-[10px] uppercase tracking-widest font-mono">{formatDate(b.startTime)}</span>
                                        {isToday(b.startTime) && <span className="text-[8px] font-black uppercase px-1 py-0.5 rounded bg-[#cafd00]/15 text-[#cafd00] line-height-none">HOY</span>}
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1 w-1/3">
                                    <div className="flex items-center gap-1.5 text-[#adaaaa]">
                                        <Clock className="w-3 h-3" />
                                        <span className="font-space-grotesk text-xl text-white tracking-tighter whitespace-nowrap">{formatTime(b.startTime)}</span>
                                    </div>
                                    <span className="font-bold text-[#cafd00] font-mono text-[10px] mt-0.5 tracking-widest">{formatCurrency(b.totalPrice || 0)}</span>
                                </div>
                                <div className="w-1/4 text-right flex flex-col items-end gap-1 shrink-0">
                                    <StatusBadge status={b.status} />
                                    <button className="text-[9px] uppercase font-bold text-[#777575] group-hover:text-[#cafd00] transition-colors mt-1 tracking-widest font-mono">Ver detalles &rarr;</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Pagination */}
            <div className="shrink-0 flex items-center justify-between px-6 py-3 border-t border-[#484847]/15 bg-[#0e0e0e]">
                {totalPages > 0 && <span className="text-[10px] text-[#adaaaa] font-mono tracking-widest uppercase">{paginatedBookings.length} DE {filteredUpcoming.length}</span>}
                <div className="flex items-center gap-1 ml-auto">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="w-6 h-6 rounded border border-[#484847]/30 flex items-center justify-center text-[#adaaaa] hover:text-white hover:bg-[#262626] disabled:opacity-30 disabled:pointer-events-none transition-all">
                        <ChevronLeft className="w-3 h-3" />
                    </button>
                    <span className="text-[10px] font-bold text-white font-mono mx-1">{currentPage} / {Math.max(1, totalPages)}</span>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0} className="w-6 h-6 rounded border border-[#484847]/30 flex items-center justify-center text-[#adaaaa] hover:text-white hover:bg-[#262626] disabled:opacity-30 disabled:pointer-events-none transition-all">
                        <ChevronRight className="w-3 h-3" />
                    </button>
                </div>
            </div>
        </div>
    );
}
