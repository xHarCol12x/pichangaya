"use client";

import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import {
    Check, X, Lock, Plus, Edit2, GripVertical, Smartphone
} from "lucide-react";
import { bookings as bookingsApi, fields as fieldsApi, users, clients as clientsApi } from "@/lib/api";

import { Toaster, toast } from "sonner";
import dynamic from "next/dynamic";

// Tipos
import { 
    Booking, Field, Client, PlanType, LiveField, ApiResponse, 
    DashboardLayouts, LayoutItem, UserFeatureOverrides, UserWithPermissions,
    DashboardStats, PredictionData, BookingStatus
} from "@/types";

const ResponsiveGridLayout = dynamic(
    () => import("react-grid-layout").then((mod: any) => mod.ResponsiveGridLayout),
    { ssr: false }
);
import {
    KpiStatsWidget,
    LiveFieldsWidget,
    UpcomingBookingsWidget,
    RevenueChartWidget,
    AiInsightWidget
} from "@/components/dashboard/widgets";
import { getDashboardCache, setDashboardCache } from "@/lib/dashboardCache";
import NoVenuePlaceholder from "@/components/dashboard/NoVenuePlaceholder";
import { useVenue } from "@/context/VenueContext";

// Modales Refactorizados
import DashboardBookingDetailsModal from "@/components/dashboard/DashboardBookingDetailsModal";
import PaymentConfirmationModal from "@/components/dashboard/PaymentConfirmationModal";
import QuickBookingModal from "@/components/dashboard/QuickBookingModal";



const DEFAULT_LAYOUT: DashboardLayouts = {
    lg: [
        { i: "kpis", x: 0, y: 0, w: 12, h: 6, minW: 12 },
        { i: "chart", x: 0, y: 6, w: 8, h: 12, minW: 6 },
        { i: "ai", x: 8, y: 6, w: 4, h: 12, minW: 3 },
        { i: "live", x: 0, y: 18, w: 12, h: 10, minW: 6 },
        { i: "upcoming", x: 0, y: 28, w: 12, h: 12, minW: 6 }
    ],
    md: [
        { i: "kpis", x: 0, y: 0, w: 10, h: 6 },
        { i: "chart", x: 0, y: 6, w: 6, h: 12 },
        { i: "ai", x: 6, y: 6, w: 4, h: 12 },
        { i: "live", x: 0, y: 18, w: 10, h: 10 },
        { i: "upcoming", x: 0, y: 28, w: 10, h: 12 }
    ],
    sm: [
        { i: "kpis", x: 0, y: 0, w: 6, h: 10 },
        { i: "chart", x: 0, y: 10, w: 6, h: 10 },
        { i: "ai", x: 0, y: 20, w: 6, h: 8 },
        { i: "live", x: 0, y: 28, w: 6, h: 10 },
        { i: "upcoming", x: 0, y: 38, w: 6, h: 10 }
    ],
    xs: [
        { i: "kpis", x: 0, y: 0, w: 4, h: 18 },
        { i: "chart", x: 0, y: 18, w: 4, h: 11 },
        { i: "ai", x: 0, y: 29, w: 4, h: 8 },
        { i: "live", x: 0, y: 37, w: 4, h: 10 },
        { i: "upcoming", x: 0, y: 47, w: 4, h: 12 }
    ],
    xxs: [
        { i: "kpis", x: 0, y: 0, w: 2, h: 18 },
        { i: "chart", x: 0, y: 18, w: 2, h: 11 },
        { i: "ai", x: 0, y: 29, w: 2, h: 8 },
        { i: "live", x: 0, y: 37, w: 2, h: 10 },
        { i: "upcoming", x: 0, y: 47, w: 2, h: 12 }
    ]
};

// ─── Helpers ────────────────────────────────────────────────────────────────

const formatCurrency = (n: number) =>
    `S/ ${n.toLocaleString("es-PE", { minimumFractionDigits: 0 })}`;

const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });

const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("es-PE", { weekday: "short", day: "numeric", month: "short" });

const isToday = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    return d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear();
};

const isFuture = (iso: string) => new Date(iso) >= new Date();

// ─── Main Page ───────────────────────────────────────────────────────────────

const DashboardPage = () => {
    const { venues: contextVenues, isLoadingVenues, selectedVenueId } = useVenue();
    const [loading, setLoading] = useState(true);
    const [allBookings, setAllBookings] = useState<Booking[]>([]);
    const [allFields, setAllFields] = useState<Field[]>([]);
    const [allClientsList, setAllClientsList] = useState<Client[]>([]);
    
    const [userName] = useState(() => {
        if (typeof window === 'undefined') return "Admin";
        try {
            const stored = localStorage.getItem("fieldiq_user");
            if (!stored) return "Admin";
            const u = JSON.parse(stored);
            return u.name?.split(" ")[0] || "Admin";
        } catch { return "Admin"; }
    });

    const [now, setNow] = useState(new Date());
    const [plan, setPlan] = useState<PlanType>("basic");
    const [featureOverrides, setFeatureOverrides] = useState<UserFeatureOverrides>({});

    const [isEditMode, setIsEditMode] = useState(false);
    const [layouts, setLayouts] = useState<DashboardLayouts>(DEFAULT_LAYOUT);
    const [previousLayouts, setPreviousLayouts] = useState<DashboardLayouts | null>(null);
    const [editBreakpoint] = useState<string>("lg");

    const finalLayouts = useMemo((): DashboardLayouts => {
        if (!layouts || typeof layouts !== 'object') return DEFAULT_LAYOUT;
        const processed: Partial<DashboardLayouts> = {};
        const bps: (keyof DashboardLayouts)[] = ["lg", "md", "sm", "xs", "xxs"];
        bps.forEach(bp => {
            const current = Array.isArray(layouts[bp]) ? layouts[bp] : DEFAULT_LAYOUT[bp];
            processed[bp] = current.map((item: LayoutItem) => ({
                ...item,
                static: !isEditMode
            }));
        });
        return processed as DashboardLayouts;
    }, [layouts, isEditMode]);

    const containerRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState<number>(1200);

    useEffect(() => {
        if (!containerRef.current) return;
        const resizeObserver = new ResizeObserver((entries) => {
            const newWidth = entries[0]?.contentRect?.width;
            if (newWidth && newWidth > 0) {
                setContainerWidth(newWidth);
            }
        });
        resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
    }, []);

    const [bookingFilter, setBookingFilter] = useState("ALL");

    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [showQuickBooking, setShowQuickBooking] = useState(false);
    const [isClosingQB, setIsClosingQB] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    const [payModalBooking, setPayModalBooking] = useState<Booking | null>(null);
    const [payLoading, setPayLoading] = useState(false);

    const [globalDateRange, setGlobalDateRange] = useState("WEEK");

    const closeQuickBooking = useCallback(() => {
        setIsClosingQB(true);
        setTimeout(() => {
            setShowQuickBooking(false);
            setIsClosingQB(false);
        }, 300);
    }, []);

    const loadData = useCallback(async () => {
        const cached = getDashboardCache();
        if (cached) {
            setAllBookings(cached.bookings);
            setAllFields(cached.fields);
            setLoading(false);
        }
        
        try {
            const userStr = typeof window !== 'undefined' ? localStorage.getItem("fieldiq_user") : null;
            const userObj = userStr ? JSON.parse(userStr) : null;

            const [bRes, fRes, uRes] = await Promise.all([
                bookingsApi.getAll() as Promise<ApiResponse<Booking[]>>,
                fieldsApi.getAll() as Promise<ApiResponse<Field[]>>,
                users.getMe() as Promise<ApiResponse<UserWithPermissions>>,
            ]);

            setAllBookings(bRes.data || []);
            setAllFields(fRes.data || []);

            const rawPlan = uRes.data?.plan || userObj?.plan || 'basic';
            setPlan(String(rawPlan).toLowerCase().trim() as PlanType);

            const overridesRaw = uRes.data?.featureOverrides || userObj?.featureOverrides || {};
            const overridesParsed: UserFeatureOverrides = typeof overridesRaw === 'string' ? JSON.parse(overridesRaw) : overridesRaw;

            const LAYOUT_VERSION = "9.0";
            const needsMigration = !overridesParsed.dashboardVersion || overridesParsed.dashboardVersion !== LAYOUT_VERSION;

            setFeatureOverrides(overridesParsed);

            if (!needsMigration && overridesParsed?.dashboardLayouts) {
                setLayouts(overridesParsed.dashboardLayouts);
            } else if (!needsMigration && overridesParsed?.dashboardLayout) {
                const l = overridesParsed.dashboardLayout;
                setLayouts({ lg: l, md: l, sm: l, xs: l, xxs: l });
            }

            let clientsData: Client[] = [];
            if (contextVenues.length > 0) {
                const cRes = await clientsApi.getAll(contextVenues[0].id) as ApiResponse<Client[]>;
                clientsData = cRes.data || [];
            }

            setDashboardCache({
                bookings: bRes.data || [],
                fields: fRes.data || [],
                venues: contextVenues,
                user: uRes.data || {},
                clients: clientsData,
            });
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [contextVenues]);

    const handlePaymentSubmit = async (method: string) => {
        if (!payModalBooking) return;
        const loadingToast = toast.loading("Procesando pago...");
        setPayLoading(true);
        try {
            await bookingsApi.update(payModalBooking.id, { status: 'CONFIRMED', paymentMethod: method });
            toast.success("Pago confirmado correctamente", { id: loadingToast });
            setPayModalBooking(null);
            const fetch = async () => { await loadData(); }; fetch();
        } catch (error) {
            console.error(error);
            toast.error("Error al registrar pago", { id: loadingToast });
        } finally {
            setPayLoading(false);
        }
    };

    const handleLiveAction = async (action: 'extend' | 'pay' | 'finish', booking: Booking, fieldPrice?: number) => {
        const loadingToast = toast.loading("Procesando acción...");
        try {
            if (action === 'pay') {
                setPayModalBooking(booking);
                toast.dismiss(loadingToast);
                return;
            } else if (action === 'extend') {
                const currentEnd = booking.endTime ? new Date(booking.endTime) : new Date(new Date(booking.startTime).getTime() + 60 * 60000);
                const newEnd = new Date(currentEnd.getTime() + 30 * 60000).toISOString();

                const updatePayload = { 
                    endTime: newEnd, 
                    totalPrice: (Number(booking.totalPrice) || 0) + (fieldPrice ? fieldPrice / 2 : 0) 
                };
                
                await bookingsApi.update(booking.id, updatePayload);
                toast.success("Reserva extendida por 30 minutos", { id: loadingToast });
            } else if (action === 'finish') {
                await bookingsApi.update(booking.id, { endTime: new Date().toISOString() });
                toast.success("Cancha liberada", { id: loadingToast });
            }
            const fetch = async () => { await loadData(); }; fetch();
        } catch (error) {
            console.error(error);
            toast.error("Error al ejecutar la acción", { id: loadingToast });
        }
    };

    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 60000);
        return () => clearInterval(t);
    }, []);

    const handleUpdateStatus = async (id: string, newStatus: string) => {
        const loadingToast = toast.loading("Actualizando estado...");
        setActionLoading(true);
        try {
            await bookingsApi.update(id, { status: newStatus });
            setAllBookings(prev => prev.map(b => b.id === id ? { ...b, status: newStatus as BookingStatus } : b));
            setSelectedBooking(null);
            toast.success("Reserva actualizada correctamente", { id: loadingToast });
        } catch (error) {
            console.error(error);
            toast.error("Error al actualizar la reserva.", { id: loadingToast });
        } finally {
            setActionLoading(false);
        }
    };

    const handleSaveLayout = async () => {
        setIsEditMode(false);
        const loadingToast = toast.loading("Guardando tablero...");
        try {
            const userStr = typeof window !== 'undefined' ? localStorage.getItem("fieldiq_user") : null;
            if (userStr) {
                const userObj = JSON.parse(userStr);
                const newOverrides: UserFeatureOverrides = {
                    ...featureOverrides,
                    dashboardLayouts: layouts,
                    dashboardVersion: "9.0"
                };
                await users.updateSettings({ featureOverrides: JSON.stringify(newOverrides) });
                setFeatureOverrides(newOverrides);
                localStorage.setItem("fieldiq_user", JSON.stringify({ ...userObj, featureOverrides: newOverrides }));
                toast.success("Tablero guardado con éxito", { id: loadingToast });
            }
        } catch (error) {
            console.error(error);
            toast.error("Error al guardar tablero", { id: loadingToast });
        }
    };

    const handleCancelLayout = () => {
        if (previousLayouts) setLayouts(previousLayouts);
        setIsEditMode(false);
    };

    const toggleEditMode = () => {
        const p = plan?.toLowerCase();
        if (p !== 'pro' && p !== 'enterprise' && p !== 'super_admin' && p !== 'admin') {
            toast.error(
                <div className="flex flex-col gap-2">
                    <span className="font-bold flex items-center gap-2"><Lock className="w-4 h-4" /> Nivel Pro Requerido</span>
                    <span className="text-sm">Personalizar el tablero requiere un plan superior.</span>
                    <a href="/dashboard/billing?apply_plan=PRO" className="bg-foreground text-background px-3 py-1.5 rounded-lg text-center text-xs font-bold mt-1">Mejorar Plan</a>
                </div>,
                { duration: 5000 }
            );
            return;
        }
        setPreviousLayouts(layouts);
        setIsEditMode(true);
    };

    useEffect(() => {
        if (!isLoadingVenues) {
            const timer = setTimeout(() => {
                const fetch = async () => { await loadData(); };
                fetch();
            }, 0);
            return () => clearTimeout(timer);
        }
    }, [isLoadingVenues, loadData]);


    const dateFilteredBookings = useMemo((): Booking[] => {
        const bookingsArray = Array.isArray(allBookings) ? allBookings : [];
        if (globalDateRange === "ALL") return bookingsArray;

        return bookingsArray.filter(b => {
            if (!b.startTime) return false;
            if (globalDateRange === "TODAY") return isToday(b.startTime);

            if (globalDateRange === "WEEK") {
                const day = now.getDay() || 7;
                const startOfWeek = new Date(now);
                startOfWeek.setHours(0, 0, 0, 0);
                startOfWeek.setDate(now.getDate() - day + 1);

                const endOfWeek = new Date(startOfWeek);
                endOfWeek.setDate(startOfWeek.getDate() + 6);
                endOfWeek.setHours(23, 59, 59, 999);
                const bDate = new Date(b.startTime);
                return bDate >= startOfWeek && bDate <= endOfWeek;
            }
            if (globalDateRange === "MONTH") {
                const bDate = new Date(b.startTime);
                return bDate.getMonth() === now.getMonth() && bDate.getFullYear() === now.getFullYear();
            }
            return true;
        });
    }, [allBookings, globalDateRange, now]);

    const stats = useMemo((): DashboardStats => {
        const fieldsArray = Array.isArray(allFields) ? allFields : [];
        const confirmed = dateFilteredBookings.filter(b => b.status?.toUpperCase() === "CONFIRMED");
        const pending = dateFilteredBookings.filter(b => b.status?.toUpperCase() === "PENDING");
        const confirmedToday = confirmed.filter(b => isToday(b.startTime));
        const todayBookings = dateFilteredBookings.filter(b => isToday(b.startTime));
        const getPrice = (b: Booking) => Number(b.totalPrice || 0);

        const revenue = confirmed.reduce((s, b) => s + getPrice(b), 0);
        const todayRevenue = confirmedToday.reduce((s, b) => s + getPrice(b), 0);

        const fieldIdsWithBookingToday = new Set(
            confirmedToday.map(b => b.fieldId || b.field?.id)
        );
        const occupancy = fieldsArray.length > 0 ? Math.round((fieldIdsWithBookingToday.size / fieldsArray.length) * 100) : 0;

        return { confirmed, pending, todayBookings, revenue, todayRevenue, occupancy };
    }, [dateFilteredBookings, allFields]);

    const filteredUpcoming = useMemo((): Booking[] => {
        const fieldsArray = Array.isArray(allFields) ? allFields : [];
        let base = dateFilteredBookings
            .filter(b => isFuture(b.startTime) && b.status?.toUpperCase() !== "CANCELLED")
            .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
            .map(b => ({
                ...b,
                field: fieldsArray.find(f => f.id === (b.fieldId || b.field?.id)) || { name: "Cancha" } as Field,
            }));

        if (bookingFilter !== "ALL") {
            base = base.filter(b => b.status?.toUpperCase() === bookingFilter);
        }
        return base;
    }, [dateFilteredBookings, allFields, bookingFilter]);

    const chartData = useMemo(() => {
        const dataMap: Record<string, { name: string; revenue: number; reservas: number }> = {};
        if (globalDateRange === "TODAY") {
            for (let i = 8; i <= 23; i++) dataMap[i] = { name: `${i}:00`, revenue: 0, reservas: 0 };
            dateFilteredBookings.filter(b => b.status === "CONFIRMED").forEach(b => {
                const hour = new Date(b.startTime).getHours();
                if (dataMap[hour]) { dataMap[hour].revenue += (b.totalPrice || 0); dataMap[hour].reservas += 1; }
            });
        } else if (globalDateRange === "MONTH") {
            [1, 2, 3, 4].forEach(w => dataMap[w] = { name: `Semana ${w}`, revenue: 0, reservas: 0 });
            dateFilteredBookings.filter(b => b.status === "CONFIRMED").forEach(b => {
                const day = new Date(b.startTime).getDate();
                const week = day <= 7 ? 1 : day <= 14 ? 2 : day <= 21 ? 3 : 4;
                dataMap[week].revenue += (b.totalPrice || 0); dataMap[week].reservas += 1;
            });
        } else {
            const labels = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
            const startD = new Date(now);
            if (globalDateRange === "WEEK") {
                startD.setDate(now.getDate() - (now.getDay() || 7) + 1);
                for (let i = 0; i < 7; i++) {
                    const d = new Date(startD); d.setDate(startD.getDate() + i);
                    dataMap[d.toDateString()] = { name: labels[d.getDay()], revenue: 0, reservas: 0 };
                }
            } else {
                for (let i = 6; i >= 0; i--) {
                    const d = new Date(now); d.setDate(d.getDate() - i);
                    dataMap[d.toDateString()] = { name: labels[d.getDay()], revenue: 0, reservas: 0 };
                }
            }
            dateFilteredBookings.filter(b => b.status === "CONFIRMED").forEach(b => {
                const key = new Date(b.startTime).toDateString();
                if (dataMap[key]) { dataMap[key].revenue += (b.totalPrice || 0); dataMap[key].reservas += 1; }
            });
        }
        return Object.values(dataMap);
    }, [dateFilteredBookings, globalDateRange, now]);

    const prediction = useMemo((): PredictionData => {
        const bookingsArray = Array.isArray(allBookings) ? allBookings : [];
        const weekend = bookingsArray.filter(b => {
            const d = new Date(b.startTime);
            return d.getDay() === 6 || d.getDay() === 0;
        });
        const avg = weekend.length > 0 ? Math.round(weekend.reduce((s, b) => s + (b.totalPrice || 0), 0) / Math.max(weekend.length, 1)) : 0;
        return { pct: "+18%", avg: formatCurrency(avg || 800), text: "Alta demanda proyectada para este fin de semana" };
    }, [allBookings]);

    const liveFields = useMemo((): LiveField[] => {
        const bookingsArray = Array.isArray(allBookings) ? allBookings : [];
        const fieldsArray = Array.isArray(allFields) ? allFields : [];
        return fieldsArray.map(field => {
            const activeBooking = bookingsArray.find(b => {
                if (b.status?.toUpperCase() === "CANCELLED") return false;
                const matchesField = b.fieldId === field.id || b.field?.id === field.id;
                if (!matchesField) return false;
                const start = new Date(b.startTime).getTime();
                const end = b.endTime ? new Date(b.endTime).getTime() : start + 60 * 60000;
                return now.getTime() >= start && now.getTime() < end;
            });
            if (activeBooking) {
                const start = new Date(activeBooking.startTime).getTime();
                const end = activeBooking.endTime ? new Date(activeBooking.endTime).getTime() : start + 60 * 60000;
                const progress = Math.min(100, Math.max(0, ((now.getTime() - start) / (end - start)) * 100));
                return { ...field, isOccupied: true, booking: activeBooking, progress, remainingMins: Math.max(0, Math.round((end - now.getTime()) / 60000)) };
            }
            return { ...field, isOccupied: false, booking: null, progress: 0, remainingMins: 0 };
        });
    }, [allFields, allBookings, now]);

    if (loading) {
        return (
            <div className="space-y-8 animate-in fade-in duration-700">
                <div className="flex flex-col md:flex-row justify-between gap-4 animate-pulse">
                    <div className="space-y-3">
                        <div className="h-10 w-64 bg-foreground/10 rounded-xl" />
                        <div className="h-4 w-48 bg-foreground/5 rounded-md" />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                    {[1, 2, 3, 4].map(i => <div key={i} className="glass p-6 rounded-[2rem] border border-border h-36 animate-pulse" />)}
                </div>
            </div>
        );
    }

    if (!loading && contextVenues.length === 0) return <NoVenuePlaceholder />;

    return (
        <div className="w-full max-w-full overflow-x-hidden">
            <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-700 w-full px-1 sm:px-0">
                <Toaster theme="dark" position="bottom-right" richColors closeButton />

                <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-white/5 md:border-none">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl sm:text-5xl font-black text-white font-space-grotesk tracking-tighter uppercase truncate max-w-[260px] xs:max-w-none">HOLA, {userName}</h1>
                            <div className="px-2 py-0.5 rounded-md bg-[#cafd00]/10 border border-[#cafd00]/30 text-[#cafd00] text-[10px] font-black uppercase tracking-widest animate-pulse hidden xs:block">{plan}</div>
                        </div>
                        <p className="text-foreground/40 flex items-center gap-2 text-xs sm:text-sm font-space-grotesk uppercase tracking-widest overflow-hidden">
                            <span className="w-2 h-2 bg-[#cafd00] rounded-full animate-pulse shadow-[0_0_10px_#cafd00] flex-shrink-0" />
                            <span className="truncate">Centro de Comando // {contextVenues.find(v => v.id === selectedVenueId)?.name || 'ACTIVO'}</span>
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between sm:justify-start">
                        <div className="flex items-center gap-1 bg-foreground/5 p-1 rounded-xl border border-border overflow-x-auto no-scrollbar max-w-[220px] xs:max-w-none">
                            {[{ id: "TODAY", label: "Hoy" }, { id: "WEEK", label: "Sem." }, { id: "MONTH", label: "Mes" }, { id: "ALL", label: "Hist." }].map(r => (
                                <button key={r.id} onClick={() => setGlobalDateRange(r.id)} className={`px-3 sm:px-4 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all whitespace-nowrap ${globalDateRange === r.id ? "bg-accent text-accent-foreground shadow-md" : "text-foreground/50 hover:text-foreground hover:bg-foreground/5"}`}>{r.label}</button>
                            ))}
                        </div>

                        <div className="flex items-center gap-2">
                            <button onClick={() => setShowQuickBooking(true)} className="bg-foreground text-background px-3 sm:px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition-transform text-xs sm:text-sm">
                                <Plus className="w-4 h-4" /> <span className="hidden xs:inline">Reserva</span> Rápida
                            </button>
                            {isEditMode ? (
                                <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-300">
                                    <button onClick={handleSaveLayout} className="bg-emerald-500 hover:bg-emerald-600 text-white p-2.5 rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95"><Check className="w-5 h-5" /></button>
                                    <button onClick={handleCancelLayout} className="bg-red-500 hover:bg-red-600 text-white p-2.5 rounded-xl shadow-lg shadow-red-500/20 transition-all active:scale-95"><X className="w-5 h-5" /></button>
                                </div>
                            ) : (
                                <button onClick={toggleEditMode} className={`p-2.5 rounded-xl border border-border bg-foreground/5 text-foreground/40 hover:text-foreground hover:bg-foreground/10 transition-all ${((plan as string) !== 'pro' && (plan as string) !== 'enterprise' && (plan as string) !== 'super_admin' && (plan as string) !== 'admin') ? 'opacity-50 grayscale cursor-not-allowed' : ''}`} title="Personalizar Tablero"><Edit2 className="w-5 h-5" /></button>
                            )}
                        </div>
                    </div>
                </header>

                <div className="flex lg:hidden flex-col gap-6 w-full max-w-full pb-20">
                    {!isEditMode ? (
                        <>
                            <KpiStatsWidget stats={stats} allFieldsLength={allFields.length} />
                            <div className="w-full overflow-hidden"><RevenueChartWidget globalDateRange={globalDateRange} stats={stats} chartData={chartData} /></div>
                            <AiInsightWidget plan={plan} prediction={prediction} />
                            <LiveFieldsWidget liveFields={liveFields} handleLiveAction={handleLiveAction} setShowQuickBooking={setShowQuickBooking} />
                            <UpcomingBookingsWidget filteredUpcoming={filteredUpcoming} bookingFilter={bookingFilter} setBookingFilter={setBookingFilter} setSelectedBooking={setSelectedBooking} />
                        </>
                    ) : <div className="py-12 px-6 text-center text-foreground/50 text-sm border-2 border-dashed border-border rounded-[2.5rem] bg-foreground/[0.02]"><Smartphone className="w-10 h-10 mx-auto mb-4 text-accent/40" /><p className="font-bold text-white mb-1">Personalización Restringida</p><p>Habilitado para PC o Tablet.</p></div>}
                </div>

                <div className="hidden lg:block">
                    <div ref={containerRef} className="w-full max-w-[1400px] mx-auto min-h-[800px]">
                        {/** @ts-expect-error ResponsiveGridLayout has some type issues with current version */}
                        <ResponsiveGridLayout
                            key={(isEditMode ? '_editing' : '_view') + editBreakpoint}
                            width={containerWidth || 1200}
                            className={`layout ${isEditMode ? 'is-editing' : ''}`}
                            layouts={finalLayouts}
                            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                            cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
                            rowHeight={30}
                            isDraggable={isEditMode}
                            isResizable={isEditMode}
                            onLayoutChange={(_curr: unknown, all: DashboardLayouts) => { if (isEditMode) setLayouts(all); }}
                            margin={[16, 16]}
                            containerPadding={[0, 0]}
                            useCSSTransforms={true}
                        >
                            <div key="kpis" className={isEditMode ? "cursor-move glass-hover group" : ""}>{isEditMode && <div className="drag-handle"><GripVertical className="w-4 h-4" /></div>}<KpiStatsWidget stats={stats} allFieldsLength={allFields.length} /></div>
                            <div key="live" className={isEditMode ? "cursor-move glass-hover group" : ""}>{isEditMode && <div className="drag-handle"><GripVertical className="w-4 h-4" /></div>}<LiveFieldsWidget liveFields={liveFields} handleLiveAction={handleLiveAction} setShowQuickBooking={setShowQuickBooking} /></div>
                            <div key="upcoming" className={isEditMode ? "cursor-move glass-hover group" : ""}>{isEditMode && <div className="drag-handle"><GripVertical className="w-4 h-4" /></div>}<UpcomingBookingsWidget filteredUpcoming={filteredUpcoming} bookingFilter={bookingFilter} setBookingFilter={setBookingFilter} setSelectedBooking={setSelectedBooking} /></div>
                            <div key="chart" className={isEditMode ? "cursor-move glass-hover group" : ""}>{isEditMode && <div className="drag-handle"><GripVertical className="w-4 h-4" /></div>}<RevenueChartWidget globalDateRange={globalDateRange} stats={stats} chartData={chartData} /></div>
                            <div key="ai" className={isEditMode ? "cursor-move glass-hover group" : ""}>{isEditMode && <div className="drag-handle"><GripVertical className="w-4 h-4" /></div>}<AiInsightWidget plan={plan} prediction={prediction} /></div>
                        </ResponsiveGridLayout>
                    </div>
                </div>
            </div>

            {/* Modales Refactorizados */}
            <DashboardBookingDetailsModal
                booking={selectedBooking}
                onClose={() => setSelectedBooking(null)}
                onUpdateStatus={handleUpdateStatus}
                actionLoading={actionLoading}
                formatDate={formatDate}
                formatTime={formatTime}
            />

            <PaymentConfirmationModal
                booking={payModalBooking}
                payLoading={payLoading}
                onClose={() => setPayModalBooking(null)}
                onSubmit={handlePaymentSubmit}
            />

            <QuickBookingModal
                isOpen={showQuickBooking}
                isClosing={isClosingQB}
                onClose={closeQuickBooking}
                allFields={allFields}
                allClientsList={allClientsList}
                onSuccess={() => { const fetch = async () => { await loadData(); }; fetch(); }}
            />
        </div>
    );
};

export default DashboardPage;
