"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
    Users, Loader2, Plus, Edit2, Trash2, Phone, Mail,
    Search, X, MessageSquare, CalendarCheck, DollarSign,
    AlertCircle, TrendingUp, User, ChevronRight, Lock
} from "lucide-react";
import { clients as clientsApi, venues, users } from "@/lib/api";
import ConfirmModal from "@/components/ui/ConfirmModal";

// ─── Helper ──────────────────────────────────────────────────────────────────
const getInitials = (name: string) =>
    name.trim().split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();

const AVATAR_COLORS = [
    "from-violet-500 to-purple-700",
    "from-sky-500 to-blue-700",
    "from-emerald-500 to-teal-700",
    "from-orange-500 to-rose-700",
    "from-pink-500 to-fuchsia-700",
    "from-amber-500 to-orange-700",
];
const avatarColor = (name: string) =>
    AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

// ─── Client Avatar ────────────────────────────────────────────────────────────
const ClientAvatar = ({ name, size = "lg" }: { name: string; size?: "sm" | "lg" }) => {
    const sz = size === "lg"
        ? "w-16 h-16 text-xl"
        : "w-10 h-10 text-sm";
    return (
        <div className={`${sz} rounded-2xl bg-gradient-to-br ${avatarColor(name)} flex items-center justify-center font-black text-white flex-shrink-0 shadow-lg`}>
            {getInitials(name)}
        </div>
    );
};

// ─── Client Stats ─────────────────────────────────────────────────────────────
const clientStats = (client: any) => {
    const bookings = client.bookings || [];

    // Basicos
    const count = bookings.length;
    let total = 0;
    let confirmed = 0;
    let cancelled = 0;
    let pendingDebt = 0;

    // Fechas
    let lastVisitDate: Date | null = null;
    const now = new Date();

    bookings.forEach((b: any) => {
        // Stats financieras y de estado
        if (b.status === "CONFIRMED") {
            total += (b.totalPrice || 0);
            confirmed++;
        } else if (b.status === "CANCELLED") {
            cancelled++;
        } else if (b.status === "PENDING" && new Date(b.endTime) < now) {
            // Ya jugó pero no pagó
            pendingDebt += (b.totalPrice || 0);
        } else if (b.status === "PENDING" && new Date(b.startTime) > now) {
            // Futura pero no pagada (consideramos deuda pendiente preventiva)
            pendingDebt += (b.totalPrice || 0);
        }

        // Última visita (solo consideramos las confirmadas o pasadas)
        if (b.status !== "CANCELLED") {
            const bDate = new Date(b.startTime);
            if (bDate < now) {
                if (!lastVisitDate || bDate > lastVisitDate) {
                    lastVisitDate = bDate;
                }
            }
        }
    });

    // Ratio Cancelación
    const cancelRatio = count > 0 ? Math.round((cancelled / count) * 100) : 0;

    // Tier de Lealtad
    let tier = { label: "Nuevo", color: "text-slate-400 bg-slate-500/10 border-slate-500/20" };
    if (count >= 10) tier = { label: "VIP Oro", color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20 shadow-[0_0_15px_rgba(234,179,8,0.2)]" };
    else if (count >= 3) tier = { label: "Frecuente", color: "text-sky-400 bg-sky-500/10 border-sky-500/20" };

    // Días desde la última visita
    let daysSinceLastVisit = -1;
    if (lastVisitDate !== null) {
        daysSinceLastVisit = Math.floor((now.getTime() - (lastVisitDate as Date).getTime()) / (1000 * 3600 * 24));
    }

    return { total, confirmed, count, cancelled, cancelRatio, pendingDebt, lastVisitDate, daysSinceLastVisit, tier };
};

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function ClientsPage() {
    const [clientsList, setClientsList] = useState<any[]>([]);
    const [myVenues, setMyVenues] = useState<any[]>([]);
    const [myVenue, setMyVenue] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [search, setSearch] = useState("");
    const [saveError, setSaveError] = useState<string | null>(null);
    const [userPlan, setUserPlan] = useState<string>('basic');

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [clientToEdit, setClientToEdit] = useState<any>(null);
    const [clientToDelete, setClientToDelete] = useState<any>(null);
    const [selectedClient, setSelectedClient] = useState<any>(null);

    const emptyForm = { name: "", phone: "", email: "", notes: "" };
    const [form, setForm] = useState(emptyForm);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const userStr = localStorage.getItem("fieldiq_user");
            const userObj = userStr ? JSON.parse(userStr) : null;
            const userId = userObj?.id || null;

            const [vRes, uRes] = await Promise.all([
                venues.getAll().catch(() => ({ data: [] })),
                users.getMe().catch(() => ({ data: {} }))
            ]);

            setUserPlan(String(uRes.data?.plan || userObj?.plan || 'basic').toLowerCase());

            const userVenues = vRes.data?.filter((v: any) => v.ownerId === userId) || [];
            setMyVenues(userVenues);

            if (userVenues.length > 0) {
                const venue = userVenues[0];
                setMyVenue(venue);
                const cRes = await clientsApi.getAll(venue.id);
                setClientsList(cRes.data || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const openCreate = () => {
        setClientToEdit(null);
        setForm(emptyForm);
        setSaveError(null);
        setIsModalOpen(true);
    };

    const openEdit = (client: any) => {
        setClientToEdit(client);
        setForm({ name: client.name, phone: client.phone, email: client.email || "", notes: client.notes || "" });
        setSaveError(null);
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaveError(null);
        setIsSubmitting(true);
        try {
            const payload = {
                name: form.name,
                phone: form.phone,
                email: form.email || undefined,
                notes: form.notes || undefined,
            };
            if (clientToEdit) {
                await clientsApi.update(clientToEdit.id, payload);
            } else {
                await clientsApi.create({ ...payload, venueId: myVenue.id });
            }
            setIsModalOpen(false);
            loadData();
        } catch (err: any) {
            const msg = err?.response?.data?.message || err?.message || "Error al guardar.";
            setSaveError(typeof msg === "string" ? msg : JSON.stringify(msg));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!clientToDelete) return;
        try {
            await clientsApi.delete(clientToDelete.id);
            setClientToDelete(null);
            if (selectedClient?.id === clientToDelete.id) setSelectedClient(null);
            loadData();
        } catch (e) {
            console.error(e);
        }
    };

    const filtered = useMemo(() =>
        clientsList.filter(c =>
            c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.phone.includes(search) ||
            (c.email || "").toLowerCase().includes(search.toLowerCase())
        ), [clientsList, search]);

    // ── KPI totals ────────────────────────────────────────────────────────────
    const totals = useMemo(() => {
        const allStats = clientsList.map(clientStats);
        const totalRevenue = allStats.reduce((s, x) => s + x.total, 0);
        const totalBookings = allStats.reduce((s, x) => s + x.count, 0);
        return { totalRevenue, totalBookings };
    }, [clientsList]);

    if (isLoading) return (
        <div className="flex h-64 items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
    );

    if (myVenues.length === 0) return (
        <div className="flex h-64 items-center justify-center">
            <div className="glass rounded-3xl p-12 text-center border border-white/5">
                <Users className="w-12 h-12 text-accent/30 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-white mb-2">Primero crea tu sede</h2>
                <p className="text-slate-400 text-sm">Necesitas una sede deportiva para gestionar clientes.</p>
            </div>
        </div>
    );

    const isPremium = userPlan === 'pro' || userPlan === 'enterprise';

    return (
        <div className="max-w-7xl mx-auto space-y-8">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight">Clientes</h1>
                    <p className="text-slate-400 mt-1 text-sm">{clientsList.length} contacto{clientsList.length !== 1 ? "s" : ""} registrado{clientsList.length !== 1 ? "s" : ""}</p>
                </div>
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 bg-accent text-slate-950 px-5 py-2.5 rounded-xl font-bold hover:bg-accent/90 transition-all hover:scale-105 active:scale-95 text-sm"
                >
                    <Plus className="w-4 h-4" /> Nuevo Cliente
                </button>
            </div>

            {/* KPI Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Total Clientes", value: clientsList.length, icon: Users, color: "#38bdf8" },
                    { label: "Reservas Totales", value: totals.totalBookings, icon: CalendarCheck, color: "#818cf8" },
                    { label: "Ingresos Generados", value: `S/ ${totals.totalRevenue.toLocaleString()}`, icon: DollarSign, color: "#10b981" },
                    { label: "Nuevos este mes", value: clientsList.filter(c => new Date(c.createdAt).getMonth() === new Date().getMonth()).length, icon: TrendingUp, color: "#f59e0b" },
                ].map(kpi => (
                    <div key={kpi.label} className="glass rounded-2xl p-5 border border-white/5 relative overflow-hidden group">
                        <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full blur-2xl opacity-10 group-hover:opacity-20 transition-opacity" style={{ background: kpi.color }} />
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: `${kpi.color}18`, border: `1px solid ${kpi.color}30` }}>
                            <kpi.icon className="w-4 h-4" style={{ color: kpi.color }} />
                        </div>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">{kpi.label}</p>
                        <p className="text-2xl font-black text-white mt-0.5">{kpi.value}</p>
                    </div>
                ))}
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Buscar por nombre, teléfono o email..."
                    className="w-full bg-slate-900/60 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all text-sm"
                />
                {search && (
                    <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Client Grid + Detail Panel */}
            {filtered.length === 0 ? (
                <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-3xl">
                    <Users className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">{search ? "Sin resultados para tu búsqueda" : "Aún no tienes clientes registrados"}</p>
                    {!search && (
                        <button onClick={openCreate} className="mt-4 text-accent text-sm font-bold hover:underline">
                            + Registrar primer cliente
                        </button>
                    )}
                </div>
            ) : (
                <div className="flex gap-6">
                    {/* List */}
                    <div className={`${selectedClient ? "hidden md:flex md:flex-col" : "flex flex-col"} gap-3 w-full md:w-[420px] flex-shrink-0`}>
                        {filtered.map(client => {
                            const stats = clientStats(client);
                            const isSelected = selectedClient?.id === client.id;
                            return (
                                <div
                                    key={client.id}
                                    onClick={() => setSelectedClient(isSelected ? null : client)}
                                    className={`glass p-5 rounded-2xl border cursor-pointer transition-all duration-200 group ${isSelected ? "border-accent/50 bg-accent/5 shadow-[0_0_30px_rgba(56,189,248,0.08)]" : "border-white/5 hover:border-white/20"}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <ClientAvatar name={client.name} size="sm" />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-white truncate">{client.name}</p>
                                            <p className="text-slate-400 text-xs flex items-center gap-1 truncate mt-0.5">
                                                <Phone className="w-3 h-3" /> {client.phone}
                                            </p>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <p className="text-xs text-slate-500">{stats.count} reserva{stats.count !== 1 ? "s" : ""}</p>
                                            <p className="text-sm font-bold text-white">S/ {stats.total.toFixed(0)}</p>
                                        </div>
                                        <ChevronRight className={`w-4 h-4 text-slate-600 transition-transform ${isSelected ? "rotate-90 text-accent" : "group-hover:translate-x-0.5"}`} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Detail Panel */}
                    {selectedClient && (
                        <div className="flex-1 glass rounded-3xl border border-white/10 p-8 relative animate-in fade-in slide-in-from-right-4 duration-300">
                            <button
                                onClick={() => setSelectedClient(null)}
                                className="absolute top-5 right-5 p-1.5 bg-white/5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors md:hidden"
                            >
                                <X className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setSelectedClient(null)}
                                className="absolute top-5 right-5 p-1.5 bg-white/5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors hidden md:flex"
                            >
                                <X className="w-4 h-4" />
                            </button>

                            {/* Avatar + Name */}
                            <div className="flex items-start gap-5 mb-8">
                                <ClientAvatar name={selectedClient.name} />
                                <div className="flex-1">
                                    <div className="flex items-center gap-3">
                                        <h2 className="text-2xl font-black text-white tracking-tight">{selectedClient.name}</h2>
                                        {isPremium ? (
                                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${clientStats(selectedClient).tier.color}`}>
                                                {clientStats(selectedClient).tier.label}
                                            </span>
                                        ) : (
                                            <div title="Disponible en Plan PRO" className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border text-slate-500 bg-slate-500/10 border-slate-500/20 cursor-not-allowed">
                                                <Lock className="w-3 h-3" /> VIP/Frecuente
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap gap-3 mt-2">
                                        <div className="flex items-center gap-1.5 text-sm text-slate-400">
                                            <Phone className="w-3.5 h-3.5 text-accent" /> {selectedClient.phone}
                                            <button
                                                onClick={() => {
                                                    const cleanPhone = selectedClient.phone.replace(/\D/g, '');
                                                    window.open(`https://wa.me/${cleanPhone}`, '_blank');
                                                }}
                                                className="ml-2 flex items-center gap-1.5 px-2 py-0.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-md text-[10px] font-black uppercase tracking-widest transition-colors"
                                                title="Contactar por WhatsApp"
                                            >
                                                <MessageSquare className="w-3 h-3" /> WhatsApp
                                            </button>
                                        </div>
                                        {selectedClient.email && (
                                            <span className="flex items-center gap-1.5 text-sm text-slate-400">
                                                <Mail className="w-3.5 h-3.5 text-accent" /> {selectedClient.email}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Alertas Críticas */}
                            {(() => {
                                const stats = clientStats(selectedClient);
                                if (stats.pendingDebt > 0) {
                                    if (isPremium) {
                                        return (
                                            <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
                                                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="text-sm font-bold text-red-400">Atención: Pagos Pendientes</p>
                                                    <p className="text-xs text-red-400/80 mt-1">Este cliente tiene una deuda pendiente acumulada de <strong>S/ {stats.pendingDebt}</strong> por reservas no pagadas.</p>
                                                </div>
                                            </div>
                                        );
                                    } else {
                                        return (
                                            <div className="mb-6 p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50 flex items-start gap-3 opacity-70">
                                                <Lock className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="text-sm font-bold text-slate-400">Alertas de Deuda Protegidas</p>
                                                    <p className="text-xs text-slate-500 mt-1">Mejora a <span className="text-accent font-bold">Plan PRO</span> para ver si este cliente tiene pagos pendientes y asegurar tus ingresos.</p>
                                                </div>
                                            </div>
                                        );
                                    }
                                }
                                return null;
                            })()}

                            {/* Stats */}
                            {(() => {
                                const stats = clientStats(selectedClient);
                                return (
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                                        <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Reservas</p>
                                            <p className="text-xl font-black mt-1 text-indigo-400">{stats.count}</p>
                                        </div>
                                        <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Gastado</p>
                                            <p className="text-xl font-black mt-1 text-sky-400">S/ {stats.total.toFixed(0)}</p>
                                        </div>
                                        <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Última Visita</p>
                                            <p className="text-sm font-bold mt-1.5 text-emerald-400">
                                                {stats.daysSinceLastVisit === 0 ? "Hoy" :
                                                    stats.daysSinceLastVisit === 1 ? "Ayer" :
                                                        stats.daysSinceLastVisit > 1 ? `Hace ${stats.daysSinceLastVisit} días` :
                                                            "No registra"}
                                            </p>
                                        </div>
                                        <div className={`bg-white/5 rounded-2xl p-4 border border-white/5 ${isPremium && stats.cancelRatio >= 30 ? 'bg-orange-500/5 border-orange-500/20' : ''}`}>
                                            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black flex items-center justify-between">
                                                Ausencia
                                                {isPremium && stats.cancelRatio >= 30 && <AlertCircle className="w-3 h-3 text-orange-400" />}
                                                {!isPremium && <span title="Disponible en Plan PRO"><Lock className="w-3 h-3 text-slate-600" /></span>}
                                            </p>
                                            {isPremium ? (
                                                <p className={`text-xl font-black mt-1 ${stats.cancelRatio >= 30 ? 'text-orange-400' : 'text-slate-300'}`}>
                                                    {stats.cancelRatio}%
                                                </p>
                                            ) : (
                                                <p className="text-sm font-black mt-2 text-slate-600">Plan PRO</p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Notes */}
                            {selectedClient.notes && (
                                <div className="bg-white/5 rounded-2xl p-4 border border-white/5 mb-6">
                                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black flex items-center gap-1 mb-2">
                                        <MessageSquare className="w-3 h-3" /> Notas
                                    </p>
                                    <p className="text-slate-300 text-sm leading-relaxed">{selectedClient.notes}</p>
                                </div>
                            )}

                            {/* Booking History */}
                            {selectedClient.bookings?.length > 0 && (
                                <div>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black mb-3">Historial de Reservas</p>
                                    <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                                        {selectedClient.bookings.slice(0, 8).map((b: any, i: number) => (
                                            <div key={i} className="flex justify-between items-center bg-white/5 rounded-xl px-4 py-2.5 border border-white/5">
                                                <div className="flex items-center gap-2">
                                                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${b.status === "CONFIRMED" ? "bg-emerald-400" : b.status === "CANCELLED" ? "bg-red-400" : "bg-amber-400"}`} />
                                                    <span className="text-slate-300 text-xs">{new Date(b.startTime || Date.now()).toLocaleDateString("es-PE", { day: "numeric", month: "short" })}</span>
                                                </div>
                                                <span className="text-white text-xs font-bold">S/ {b.totalPrice || 0}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-3 mt-6 pt-6 border-t border-white/5">
                                <button
                                    onClick={() => openEdit(selectedClient)}
                                    className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white py-3 rounded-xl font-bold text-sm transition-all border border-white/5"
                                >
                                    <Edit2 className="w-4 h-4" /> Editar
                                </button>
                                <button
                                    onClick={() => { setClientToDelete(selectedClient); setSelectedClient(null); }}
                                    className="flex-1 flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 py-3 rounded-xl font-bold text-sm transition-all border border-red-500/10"
                                >
                                    <Trash2 className="w-4 h-4" /> Eliminar
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Create / Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
                        onClick={() => setIsModalOpen(false)}
                    />
                    <div className="glass border border-white/10 rounded-[2rem] w-full max-w-lg relative z-10 shadow-2xl animate-in fade-in zoom-in-95 duration-300 overflow-hidden">
                        {/* Modal Header with Avatar Preview */}
                        <div className="bg-slate-900/60 px-8 py-6 border-b border-white/5 flex items-center gap-4">
                            <ClientAvatar name={form.name || "?"} size="sm" />
                            <div className="flex-1 min-w-0">
                                <h2 className="text-xl font-black text-white tracking-tight">
                                    {clientToEdit ? "Editar Cliente" : "Nuevo Cliente"}
                                </h2>
                                <p className="text-slate-500 text-xs mt-0.5 truncate">
                                    {form.name || "Completa el nombre del cliente"}
                                </p>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-8 space-y-5">
                            {/* Name */}
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                                    Nombre Completo <span className="text-accent">*</span>
                                </label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <input
                                        required
                                        value={form.name}
                                        onChange={e => setForm({ ...form, name: e.target.value })}
                                        className="w-full bg-slate-900/80 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                                        placeholder="Ej. Juan Pérez López"
                                    />
                                </div>
                            </div>

                            {/* Phone */}
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                                    Teléfono / Celular <span className="text-accent">*</span>
                                </label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <input
                                        required
                                        value={form.phone}
                                        onChange={e => setForm({ ...form, phone: e.target.value })}
                                        className="w-full bg-slate-900/80 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all font-mono"
                                        placeholder="999 123 456"
                                    />
                                </div>
                            </div>

                            {/* Email (optional) */}
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                                    Email <span className="text-slate-600 font-medium normal-case tracking-normal text-[10px]">(opcional)</span>
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <input
                                        type="email"
                                        value={form.email}
                                        onChange={e => setForm({ ...form, email: e.target.value })}
                                        className="w-full bg-slate-900/80 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                                        placeholder="ejemplo@correo.com"
                                    />
                                </div>
                            </div>

                            {/* Notes (optional) */}
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                                    Notas <span className="text-slate-600 font-medium normal-case tracking-normal text-[10px]">(opcional)</span>
                                </label>
                                <div className="relative">
                                    <MessageSquare className="absolute left-4 top-4 w-4 h-4 text-slate-500" />
                                    <textarea
                                        value={form.notes}
                                        onChange={e => setForm({ ...form, notes: e.target.value })}
                                        rows={3}
                                        className="w-full bg-slate-900/80 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all resize-none text-sm"
                                        placeholder="Preferencias, alergias, observaciones..."
                                    />
                                </div>
                            </div>

                            {/* Error */}
                            {saveError && (
                                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-red-400 text-sm">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                    <span>{saveError}</span>
                                </div>
                            )}

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-accent text-slate-950 py-4 rounded-xl font-black text-base hover:bg-accent/90 transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 shadow-[0_0_20px_rgba(56,189,248,0.2)] mt-2"
                            >
                                {isSubmitting
                                    ? <Loader2 className="w-5 h-5 animate-spin" />
                                    : <Users className="w-5 h-5" />
                                }
                                {clientToEdit ? "Guardar Cambios" : "Registrar Cliente"}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirm */}
            <ConfirmModal
                isOpen={!!clientToDelete}
                onClose={() => setClientToDelete(null)}
                onConfirm={handleDelete}
                title="¿Eliminar cliente?"
                message={`Vas a eliminar a "${clientToDelete?.name}". El historial de reservas se mantendrá, pero el cliente ya no aparecerá en el sistema.`}
                confirmText="Sí, eliminar"
                cancelText="Cancelar"
                type="danger"
            />
        </div>
    );
}
