"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import {
    TrendingUp, TrendingDown, Users, CalendarCheck, CreditCard,
    BrainCircuit, ArrowUpRight, ChevronRight, MoreVertical,
    Activity, Zap, Clock, MapPin, Loader2, RefreshCw,
    CalendarX, CheckCircle2, AlertCircle
} from "lucide-react";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer
} from "recharts";
import { bookings as bookingsApi, fields as fieldsApi, users, venues, clients as clientsApi } from "@/lib/api";
import { ChevronLeft, Plus, X } from "lucide-react";
import gsap from "gsap";

import FieldMiniMap from "@/components/fields/FieldMiniMap";
import { Toaster, toast } from "sonner";
import { Edit3, Check, Lock } from "lucide-react";
import dynamic from "next/dynamic";
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



const DEFAULT_LAYOUT = {
    lg: [
        { i: "kpis", x: 0, y: 0, w: 12, h: 5, minW: 12 },
        { i: "live", x: 0, y: 5, w: 8, h: 9, minW: 4 },
        { i: "upcoming", x: 8, y: 5, w: 4, h: 9, minW: 3 },
        { i: "chart", x: 0, y: 14, w: 8, h: 10, minW: 4 },
        { i: "ai", x: 8, y: 14, w: 4, h: 10, minW: 3 }
    ],
    md: [
        { i: "kpis", x: 0, y: 0, w: 10, h: 6 },
        { i: "live", x: 0, y: 6, w: 10, h: 9 },
        { i: "upcoming", x: 0, y: 15, w: 10, h: 9 },
        { i: "chart", x: 0, y: 24, w: 10, h: 10 },
        { i: "ai", x: 0, y: 34, w: 10, h: 8 }
    ],
    sm: [
        { i: "kpis", x: 0, y: 0, w: 6, h: 16 },
        { i: "live", x: 0, y: 16, w: 6, h: 10 },
        { i: "upcoming", x: 0, y: 26, w: 6, h: 10 },
        { i: "chart", x: 0, y: 36, w: 6, h: 12 },
        { i: "ai", x: 0, y: 48, w: 6, h: 8 }
    ],
    xs: [
        { i: "kpis", x: 0, y: 0, w: 4, h: 32 },
        { i: "live", x: 0, y: 32, w: 4, h: 10 },
        { i: "upcoming", x: 0, y: 42, w: 4, h: 10 },
        { i: "chart", x: 0, y: 52, w: 4, h: 12 },
        { i: "ai", x: 0, y: 64, w: 4, h: 10 }
    ],
    xxs: [
        { i: "kpis", x: 0, y: 0, w: 2, h: 40 },
        { i: "live", x: 0, y: 40, w: 2, h: 12 },
        { i: "upcoming", x: 0, y: 52, w: 2, h: 12 },
        { i: "chart", x: 0, y: 64, w: 2, h: 12 },
        { i: "ai", x: 0, y: 76, w: 2, h: 12 }
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

// ─── KPI Card ───────────────────────────────────────────────────────────────

const KpiCard = ({ title, value, sub, change, positive, icon: Icon, accent }: any) => {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        gsap.fromTo(ref.current,
            { y: 24, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.7, ease: "power3.out", delay: Math.random() * 0.3 }
        );
    }, []);

    return (
        <div ref={ref} className="glass p-6 rounded-[2rem] border border-border relative group overflow-hidden">
            <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity"
                style={{ background: accent }} />

            <div className="flex justify-between items-start mb-5">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{ background: `${accent}18`, border: `1px solid ${accent}30` }}>
                    <Icon className="w-6 h-6" style={{ color: accent }} />
                </div>
                {change !== undefined && (
                    <div className={`flex items-center gap-1 text-xs font-bold py-1 px-2.5 rounded-lg ${positive ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                        {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {change}
                    </div>
                )}
            </div>
            <h3 className="text-foreground/50 text-sm font-medium mb-1">{title}</h3>
            <p className="text-3xl font-black text-foreground">{value}</p>
            {sub && <p className="text-foreground/30 text-xs mt-1">{sub}</p>}
        </div>
    );
};

// ─── Status Badge ────────────────────────────────────────────────────────────

const StatusBadge = ({ status }: { status: string }) => {
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

// ─── Main Page ───────────────────────────────────────────────────────────────

const DashboardPage = () => {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [allBookings, setAllBookings] = useState<any[]>([]);
    const [allFields, setAllFields] = useState<any[]>([]);
    const [myVenues, setMyVenues] = useState<any[]>([]);
    const [userName, setUserName] = useState("Admin");
    const [now, setNow] = useState(new Date());
    const [plan, setPlan] = useState<string>("basic");
    const [featureOverrides, setFeatureOverrides] = useState<any>({});
    
    // Bento Box State
    const [isEditMode, setIsEditMode] = useState(false);
    const [layouts, setLayouts] = useState<any>(DEFAULT_LAYOUT);
    const [previousLayouts, setPreviousLayouts] = useState<any>(null);

    // ── 0. Procesamiento de Layout (Hook de nivel superior para evitar Error #310) ──
    const finalLayouts = useMemo(() => {
        if (!layouts || typeof layouts !== 'object') return DEFAULT_LAYOUT;
        const processed: any = {};
        const bps = ["lg", "md", "sm", "xs", "xxs"];
        bps.forEach(bp => {
            const current = Array.isArray(layouts[bp]) ? layouts[bp] : (DEFAULT_LAYOUT as any)[bp];
            processed[bp] = current.map((item: any) => ({
                ...item,
                static: !isEditMode
            }));
        });
        return processed;
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

    // Pagination & Filters State
    const [bookingFilter, setBookingFilter] = useState("ALL");
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 5;

    // Modals State
    const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
    const [showQuickBooking, setShowQuickBooking] = useState(false);
    // 1. AGREGA ESTE NUEVO ESTADO PARA LA ANIMACIÓN
    const [isClosingQB, setIsClosingQB] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    // Payment Modal State
    const [payModalBooking, setPayModalBooking] = useState<any | null>(null);
    const [payLoading, setPayLoading] = useState(false);

    const [globalDateRange, setGlobalDateRange] = useState("WEEK"); // "TODAY", "WEEK", "MONTH", "ALL"

    // 2. AGREGA ESTA FUNCIÓN PARA CERRAR SUAVEMENTE
    const closeQuickBooking = () => {
        setIsClosingQB(true); // Activa la animación de salida
        setTimeout(() => {
            setShowQuickBooking(false); // Desmonta el modal después de 300ms
            setIsClosingQB(false); // Resetea el estado
        }, 300);
    };

    const handlePaymentSubmit = async (method: string) => {
        if (!payModalBooking) return;
        const loadingToast = toast.loading("Procesando pago...");
        setPayLoading(true);
        try {
            await bookingsApi.update(payModalBooking.id, { status: 'CONFIRMED', paymentMethod: method });
            toast.success("Pago confirmado correctamente", { id: loadingToast });
            setPayModalBooking(null);
            loadData(true);
        } catch (e) {
            toast.error("Error al registrar pago", { id: loadingToast });
        } finally {
            setPayLoading(false);
        }
    };

    // 3. ACCIONES RÁPIDAS DEL WIDGET EN VIVO
    const handleLiveAction = async (action: 'extend' | 'pay' | 'finish', booking: any, fieldPrice?: number) => {
        const loadingToast = toast.loading("Procesando acción...");
        try {
            if (action === 'pay') {
                setPayModalBooking(booking);
                toast.dismiss(loadingToast);
                return; // Stop here, modal will handle the rest
            } else if (action === 'extend') {
                // Si no tiene endTime, asumimos 60 mins desde el inicio para calcular
                const currentEnd = booking.endTime ? new Date(booking.endTime) : new Date(new Date(booking.startTime).getTime() + 60 * 60000);
                const newEnd = new Date(currentEnd.getTime() + 30 * 60000).toISOString();

                let updateData: any = { endTime: newEnd };
                if (fieldPrice) {
                    const extraPrice = fieldPrice / 2;
                    updateData.totalPrice = (Number(booking.totalPrice) || 0) + extraPrice;
                }

                await bookingsApi.update(booking.id, updateData);
                toast.success("Reserva extendida por 30 minutos", { id: loadingToast });
            } else if (action === 'finish') {
                // Termina la reserva ajustando el endTime al minuto actual
                await bookingsApi.update(booking.id, { endTime: new Date().toISOString() });
                toast.success("Cancha liberada", { id: loadingToast });
            }
            loadData(true); // Recarga los datos en silencio
        } catch (e) {
            toast.error("Error al ejecutar la acción", { id: loadingToast });
        }
    };

    // Quick Booking State
    const [allClientsList, setAllClientsList] = useState<any[]>([]);
    const [qbClientSearch, setQbClientSearch] = useState("");
    const [qbShowDrop, setQbShowDrop] = useState(false);
    const [qbSubmitting, setQbSubmitting] = useState(false);
    const getQbInitial = () => {
        const now = new Date(); now.setMinutes(0, 0, 0); now.setHours(now.getHours() + 1);
        const pad = (n: number) => n.toString().padStart(2, '0');
        const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:00`;
        return { fieldId: "", startTime: fmt(now), duration: 60, paymentMethod: "Efectivo", clientId: "", totalPrice: 0 };
    };
    const [qbForm, setQbForm] = useState(getQbInitial);

    // Tick del reloj
    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 60000);
        return () => clearInterval(t);
    }, []);

    const loadData = async (silent = false) => {
        if (!silent) setLoading(true);
        else setRefreshing(true);
        try {
            const userStr = localStorage.getItem("fieldiq_user");
            const userObj = userStr ? JSON.parse(userStr) : null;
            const userId = userObj?.id || null;

            const [bRes, fRes, uRes, vRes] = await Promise.all([
                bookingsApi.getAll().catch(() => ({ data: [] })),
                fieldsApi.getAll().catch(() => ({ data: [] })),
                users.getMe().catch(() => ({ data: {} })), // Fetch plan info
                venues.getAll().catch(() => ({ data: [] }))
            ]);

            const userVenues = vRes.data?.filter((v: any) => v.ownerId === userId) || [];
            setMyVenues(userVenues);

            setAllBookings(bRes.data || []);
            setAllFields(fRes.data || []);

            const userPlan = uRes.data?.plan || userObj?.plan || 'basic';
            setPlan(String(userPlan).toLowerCase());

            // Extract feature overrides and load custom layout if exists
            const overridesRaw = uRes.data?.featureOverrides || userObj?.featureOverrides || {};
            const overridesParsed = typeof overridesRaw === 'string' ? JSON.parse(overridesRaw) : overridesRaw;
            setFeatureOverrides(overridesParsed);
            if (overridesParsed?.dashboardLayouts) {
                setLayouts(overridesParsed.dashboardLayouts);
            } else if (overridesParsed?.dashboardLayout) {
                // Backward compatibility: broadcast singular layout to all breakpoints
                const l = overridesParsed.dashboardLayout;
                setLayouts({ lg: l, md: l, sm: l, xs: l, xxs: l });
            }

            // Load clients for quick booking
            if (userVenues.length > 0) {
                const cRes = await clientsApi.getAll(userVenues[0].id).catch(() => ({ data: [] }));
                setAllClientsList(cRes.data || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleUpdateStatus = async (id: string, newStatus: string) => {
        // Creamos una notificación de carga
        const loadingToast = toast.loading("Actualizando estado...");
        setActionLoading(true);
        try {
            await bookingsApi.update(id, { status: newStatus });
            setAllBookings(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b));
            setSelectedBooking(null);

            // Si todo sale bien, la notificación de carga se convierte en éxito
            toast.success("Reserva actualizada correctamente", { id: loadingToast });
        } catch (e) {
            console.error(e);
            // Si falla, se convierte en error
            toast.error("Error al actualizar la reserva.", { id: loadingToast });
        } finally {
            setActionLoading(false);
        }
    };

    const handleSaveLayout = async () => {
        setIsEditMode(false);
        const loadingToast = toast.loading("Guardando tablero...");
        try {
            const userStr = localStorage.getItem("fieldiq_user");
            if (userStr) {
                const userObj = JSON.parse(userStr);
                const newOverrides = { ...featureOverrides, dashboardLayouts: layouts };

                // Re-added stringify because backend expects featureOverrides as a string/text field
                await users.updateSettings({ featureOverrides: JSON.stringify(newOverrides) });

                setFeatureOverrides(newOverrides);
                localStorage.setItem("fieldiq_user", JSON.stringify({ ...userObj, featureOverrides: newOverrides }));
                toast.success("Tablero guardado con éxito", { id: loadingToast });
            }
        } catch (e) {
            toast.error("Error al guardar tablero", { id: loadingToast });
        }
    };

    const handleCancelLayout = () => {
        if (previousLayouts) {
            setLayouts(previousLayouts);
        }
        setIsEditMode(false);
    };

    const toggleEditMode = () => {
        if (plan !== 'pro' && plan !== 'enterprise' && plan !== 'SUPER_ADMIN') {
            toast.error(
                <div className="flex flex-col gap-2">
                    <span className="font-bold flex items-center gap-2"><Lock className="w-4 h-4" /> Nivel Pro Requerido</span>
                    <span className="text-sm">Personalizar el tablero (arrastrar widgets) requiere un plan superior.</span>
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
        const stored = localStorage.getItem("fieldiq_user");
        if (stored) {
            try { setUserName(JSON.parse(stored).name?.split(" ")[0] || "Admin"); } catch (_) { }
        }
        loadData();
    }, []);

    // ── 1. Filtro Maestro de Fechas ──────────────────────────────────────────
    const dateFilteredBookings = useMemo(() => {
        if (globalDateRange === "ALL") return allBookings;

        return allBookings.filter(b => {
            const bDate = new Date(b.startTime);
            if (globalDateRange === "TODAY") return isToday(b.startTime);

            if (globalDateRange === "WEEK") {
                const day = now.getDay() || 7; // Lunes=1, Domingo=7
                const startOfWeek = new Date(now);
                startOfWeek.setHours(0, 0, 0, 0);
                startOfWeek.setDate(now.getDate() - day + 1);

                const endOfWeek = new Date(startOfWeek);
                endOfWeek.setDate(startOfWeek.getDate() + 6);
                endOfWeek.setHours(23, 59, 59, 999);
                return bDate >= startOfWeek && bDate <= endOfWeek;
            }
            if (globalDateRange === "MONTH") {
                return bDate.getMonth() === now.getMonth() && bDate.getFullYear() === now.getFullYear();
            }
            return true;
        });
    }, [allBookings, globalDateRange, now]);

    // ── 2. Métricas Derivadas (Usando el filtro maestro) ─────────────────────
    const stats = useMemo(() => {
        const confirmed = dateFilteredBookings.filter(b => b.status?.toUpperCase() === "CONFIRMED");
        const pending = dateFilteredBookings.filter(b => b.status?.toUpperCase() === "PENDING");
        const todayBookings = dateFilteredBookings.filter(b => isToday(b.startTime));

        const getPrice = (b: any) => Number(b.totalPrice || b.price || b.amount || 0);

        const revenue = confirmed.reduce((s, b) => s + getPrice(b), 0);
        const todayRevenue = confirmed.filter(b => isToday(b.startTime)).reduce((s, b) => s + getPrice(b), 0);

        const fieldIdsWithBookingToday = new Set(
            confirmed.filter(b => isToday(b.startTime)).map(b => b.fieldId || b.field?.id)
        );
        const occupancy = allFields.length > 0 ? Math.round((fieldIdsWithBookingToday.size / allFields.length) * 100) : 0;

        return { confirmed, pending, todayBookings, revenue, todayRevenue, occupancy };
    }, [dateFilteredBookings, allFields]);

    // ── 3. Próximas Reservas (Usando el filtro maestro) ──────────────────────
    const filteredUpcoming = useMemo(() => {
        let base = dateFilteredBookings
            .filter(b => isFuture(b.startTime) && b.status?.toUpperCase() !== "CANCELLED")
            .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
            .map(b => ({
                ...b,
                field: allFields.find(f => f.id === (b.fieldId || b.field?.id)) || { name: "Cancha" },
            }));

        if (bookingFilter !== "ALL") {
            base = base.filter(b => b.status?.toUpperCase() === bookingFilter);
        }
        return base;
    }, [dateFilteredBookings, allFields, bookingFilter]);

    const totalPages = Math.ceil(filteredUpcoming.length / ITEMS_PER_PAGE);
    const paginatedBookings = filteredUpcoming.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    // ── 4. Gráfico Dinámico (Se adapta al filtro maestro) ────────────────────
    const chartData = useMemo(() => {
        const dataMap: Record<string, { name: string; revenue: number; reservas: number }> = {};

        if (globalDateRange === "TODAY") {
            // Eje X: Horas del día (8am a 11pm)
            for (let i = 8; i <= 23; i++) dataMap[i] = { name: `${i}:00`, revenue: 0, reservas: 0 };
            dateFilteredBookings.filter(b => b.status === "CONFIRMED").forEach(b => {
                const hour = new Date(b.startTime).getHours();
                if (dataMap[hour]) { dataMap[hour].revenue += (b.totalPrice || 0); dataMap[hour].reservas += 1; }
            });
        } else if (globalDateRange === "MONTH") {
            // Eje X: Semanas del mes
            [1, 2, 3, 4].forEach(w => dataMap[w] = { name: `Semana ${w}`, revenue: 0, reservas: 0 });
            dateFilteredBookings.filter(b => b.status === "CONFIRMED").forEach(b => {
                const day = new Date(b.startTime).getDate();
                const week = day <= 7 ? 1 : day <= 14 ? 2 : day <= 21 ? 3 : 4;
                dataMap[week].revenue += (b.totalPrice || 0);
                dataMap[week].reservas += 1;
            });
        } else {
            // WEEK o ALL: Días de la semana
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

    // ── Prediction mock (en producción conectar a endpoint de IA) ───────────
    const prediction = useMemo(() => {
        const weekend = allBookings.filter(b => {
            const d = new Date(b.startTime);
            return d.getDay() === 6 || d.getDay() === 0;
        });
        const avg = weekend.length > 0
            ? Math.round(weekend.reduce((s, b) => s + (b.totalPrice || 0), 0) / Math.max(weekend.length, 1))
            : 0;
        return { pct: "+18%", avg: formatCurrency(avg || 800), text: "Alta demanda proyectada para este fin de semana" };
    }, [allBookings]);

    // ── Live Fields Computation (En Juego Ahora) ───────────
    const liveFields = useMemo(() => {
        return allFields.map(field => {
            const activeBooking = allBookings.find(b => {
                if (b.status?.toUpperCase() === "CANCELLED") return false;
                const matchesField = b.fieldId === field.id || b.field?.id === field.id;
                if (!matchesField) return false;

                const start = new Date(b.startTime).getTime();
                const end = b.endTime ? new Date(b.endTime).getTime() : start + 60 * 60000;
                const currentTime = now.getTime();

                return currentTime >= start && currentTime < end;
            });

            if (activeBooking) {
                const start = new Date(activeBooking.startTime).getTime();
                const end = activeBooking.endTime ? new Date(activeBooking.endTime).getTime() : start + 60 * 60000;
                const currentTime = now.getTime();

                const totalDuration = end - start;
                const elapsed = currentTime - start;
                const progress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
                const remainingMins = Math.max(0, Math.round((end - currentTime) / 60000));

                return {
                    ...field,
                    isOccupied: true,
                    booking: activeBooking,
                    progress,
                    remainingMins
                };
            }

            return {
                ...field,
                isOccupied: false,
                booking: null,
                progress: 0,
                remainingMins: 0
            };
        });
    }, [allFields, allBookings, now]);

    // ─────────────────────────────────────────────────────────────────────────

    if (loading) {
        return (

            <div className="space-y-8 animate-in fade-in duration-700">
                {/* Header Skeleton */}
                <div className="flex flex-col md:flex-row justify-between gap-4 animate-pulse">
                    <div className="space-y-3">
                        <div className="h-10 w-64 bg-foreground/10 rounded-xl" />
                        <div className="h-4 w-48 bg-foreground/5 rounded-md" />
                    </div>
                    <div className="flex gap-3">
                        <div className="h-10 w-28 bg-foreground/5 rounded-xl" />
                        <div className="h-10 w-32 bg-accent/20 rounded-xl" />
                    </div>
                </div>

                {/* KPIs Skeletons */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="glass p-6 rounded-[2rem] border border-border h-36 animate-pulse flex flex-col justify-between">
                            <div className="flex justify-between items-start">
                                <div className="w-12 h-12 rounded-2xl bg-foreground/10" />
                                <div className="w-16 h-6 rounded-md bg-foreground/10" />
                            </div>
                            <div className="space-y-2 mt-4">
                                <div className="h-4 w-24 bg-foreground/5 rounded-md" />
                                <div className="h-8 w-32 bg-foreground/10 rounded-lg" />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Chart Skeletons */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 glass p-8 rounded-[2.5rem] border border-border h-[400px] animate-pulse flex flex-col">
                        <div className="flex justify-between mb-8">
                            <div className="space-y-2">
                                <div className="h-6 w-48 bg-foreground/10 rounded-lg" />
                                <div className="h-4 w-32 bg-foreground/5 rounded-md" />
                            </div>
                            <div className="space-y-2 text-right items-end flex flex-col">
                                <div className="h-4 w-20 bg-foreground/5 rounded-md" />
                                <div className="h-8 w-24 bg-foreground/10 rounded-lg" />
                            </div>
                        </div>
                        <div className="flex-1 bg-foreground/5 rounded-2xl w-full" />
                    </div>
                    <div className="bg-foreground/5 p-8 rounded-[2.5rem] h-[400px] animate-pulse" />
                </div>
            </div>
        );
    }

    const todayStr = now.toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long" });
    const todayCapital = todayStr.charAt(0).toUpperCase() + todayStr.slice(1);

    // ── Onboarding / Bloqueo si no hay Sede ─────────────────────────────────
    if (!loading && myVenues.length === 0) {
        return (
            <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[80vh] flex items-center justify-center">
                <div className="glass max-w-2xl w-full rounded-[3rem] p-12 text-center border border-border flex flex-col items-center animate-in fade-in zoom-in-95 duration-700">
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-20 h-20 bg-accent rounded-3xl flex items-center justify-center rotate-3 shadow-[0_0_40px_rgba(56,189,248,0.4)] mb-6">
                            <Activity className="text-accent-foreground w-10 h-10" />
                        </div>
                        <h1 className="text-5xl font-black tracking-tight text-foreground flex items-center gap-1">
                            Field<span className="text-accent">IQ</span>
                        </h1>
                    </div>
                    <p className="text-foreground/60 text-lg mb-10 max-w-lg mx-auto leading-relaxed">
                        Estás a un paso de empezar a recibir reservas. El primer paso obligatorio es registrar tu sede deportiva principal.
                    </p>
                    <a
                        href="/dashboard/fields"
                        className="bg-accent text-accent-foreground px-8 py-4 rounded-2xl font-bold text-lg hover:scale-105 transition-transform flex items-center gap-3 shadow-[0_0_40px_rgba(56,189,248,0.2)]"
                    >
                        <Plus className="w-5 h-5" />
                        Crear mi Primera Sede
                    </a>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-8 animate-in fade-in duration-700">
                <Toaster theme="dark" position="bottom-right" richColors closeButton />

                {/* Header */}
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-black text-foreground tracking-tight mb-2">
                            Hola, {userName} 👋
                        </h1>
                        <p className="text-foreground/40 flex items-center gap-2 text-sm">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                            {todayCapital} · {now.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}
                            <span className="ml-2 text-[8px] bg-white/5 px-1.5 py-0.5 rounded text-white/20 font-mono">BENTO V2.2</span>
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-1 bg-foreground/5 p-1 rounded-xl border border-border mr-2">
                            {[
                                { id: "TODAY", label: "Hoy" },
                                { id: "WEEK", label: "Esta Semana" },
                                { id: "MONTH", label: "Este Mes" },
                                { id: "ALL", label: "Histórico" }
                            ].map(r => (
                                <button
                                    key={r.id}
                                    onClick={() => setGlobalDateRange(r.id)}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${globalDateRange === r.id ? "bg-accent text-accent-foreground shadow-md" : "text-foreground/50 hover:text-foreground hover:bg-foreground/5"}`}
                                >
                                    {r.label}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => setShowQuickBooking(true)}
                            className="bg-foreground text-background px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition-transform text-sm"
                        >
                            <Plus className="w-4 h-4" />
                            Reserva Rápida
                        </button>

                        {isEditMode ? (
                            <div className="flex items-center gap-3 animate-in fade-in zoom-in duration-300">
                                <button
                                    onClick={handleCancelLayout}
                                    className="px-5 py-2.5 rounded-xl font-bold border border-white/10 text-white/60 hover:text-white hover:bg-white/5 transition-all text-sm"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSaveLayout}
                                    className="bg-emerald-500 text-slate-950 px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-[0_4px_20px_rgba(16,185,129,0.3)] hover:scale-105 active:scale-95 transition-all text-sm"
                                >
                                    <Check className="w-4 h-4" />
                                    Guardar Tablero
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={toggleEditMode}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-foreground/50 hover:text-foreground hover:border-foreground/20 transition-all text-sm ${(plan !== 'pro' && plan !== 'enterprise' && plan !== 'SUPER_ADMIN') ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
                            >
                                <Edit3 className="w-4 h-4" />
                                Personalizar
                            </button>
                        )}
                    </div>
                </header>

                {/* Bento Box Grid Layout */}
                <div className={`mt-6 ${isEditMode ? 'bg-foreground/[0.02] border border-dashed border-border rounded-3xl p-4' : ''}`}>
                    {isEditMode && (
                        <div className="mb-4 text-center text-sm font-medium text-foreground/50 animate-pulse flex items-center justify-center gap-2">
                            <Zap className="w-4 h-4 text-accent" />
                            Modo Edición: Organiza tus widgets libremente.
                        </div>
                    )}
                    <div ref={containerRef} className="w-full min-h-[800px]">
                        {/* @ts-ignore */}
                        <ResponsiveGridLayout
                            key={containerWidth + (isEditMode ? '_editing' : '_view')}
                            width={containerWidth || 1200}
                            className={`layout ${isEditMode ? 'is-editing' : ''}`}
                            layouts={finalLayouts}
                            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                            cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
                            rowHeight={30}
                            onLayoutChange={(curr: any, all: any) => isEditMode && setLayouts(all)}
                            margin={[20, 20]}
                            useCSSTransforms={true}
                        >
                            <div key="kpis" className={isEditMode ? "cursor-move glass-hover" : ""}>
                                <KpiStatsWidget stats={stats} allFieldsLength={allFields.length} />
                            </div>

                            <div key="live" className={isEditMode ? "cursor-move glass-hover" : ""}>
                                <LiveFieldsWidget liveFields={liveFields} handleLiveAction={handleLiveAction} setShowQuickBooking={setShowQuickBooking} />
                            </div>

                            <div key="upcoming" className={isEditMode ? "cursor-move glass-hover" : ""}>
                                <UpcomingBookingsWidget filteredUpcoming={filteredUpcoming} bookingFilter={bookingFilter} setBookingFilter={setBookingFilter} setSelectedBooking={setSelectedBooking} />
                            </div>

                            <div key="chart" className={isEditMode ? "cursor-move glass-hover" : ""}>
                                <RevenueChartWidget globalDateRange={globalDateRange} stats={stats} chartData={chartData} />
                            </div>

                            <div key="ai" className={isEditMode ? "cursor-move glass-hover" : ""}>
                                <AiInsightWidget plan={plan} prediction={prediction} />
                            </div>
                        </ResponsiveGridLayout>
                    </div>
                </div>
            </div>
            {/* Modal: Detalles de Reserva */}
            {selectedBooking && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setSelectedBooking(null)} />
                    <div className="glass border border-white/10 rounded-[2rem] w-full max-w-4xl relative z-10 shadow-2xl flex flex-col md:flex-row overflow-hidden animate-in fade-in zoom-in-95 duration-300">

                        {/* Left Side: Field Preview */}
                        <div className="w-full md:w-[45%] bg-slate-900/40 p-8 border-b md:border-b-0 md:border-r border-white/5 flex flex-col justify-center items-center relative overflow-hidden">
                            <div className="absolute -top-10 -left-10 w-40 h-40 bg-accent/10 rounded-full blur-[80px]" />

                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-accent mb-6 relative z-10">Vista Táctica</p>

                            <div className="w-full relative z-10">
                                <FieldMiniMap
                                    type={selectedBooking.field?.type || "Fútbol 5"}
                                    surface={selectedBooking.field?.surface || "Sintético"}
                                />
                            </div>

                            <div className="mt-8 text-center relative z-10">
                                <span className="text-2xl font-black text-white">{selectedBooking.field?.name}</span>
                                <div className="flex items-center justify-center gap-2 mt-2">
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/5 text-slate-400 uppercase tracking-wider">
                                        {selectedBooking.field?.type}
                                    </span>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-accent/20 text-accent uppercase tracking-wider">
                                        {selectedBooking.field?.surface || 'Sintético'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Right Side: Details & Actions */}
                        <div className="w-full md:w-[55%] p-6 md:p-8 bg-slate-900/20 flex flex-col max-h-[50vh] md:max-h-[none] overflow-y-auto">
                            <div className="flex justify-between items-start mb-6 md:mb-8 sticky top-0 bg-slate-900/80 backdrop-blur-md pt-2 pb-2 -mt-2 z-10 rounded-b-xl">
                                <div>
                                    <h3 className="text-xl font-black text-white tracking-tight">Detalles de Reserva</h3>
                                    <p className="text-slate-500 text-xs mt-1 uppercase tracking-widest font-bold">Resumen de Alquiler</p>
                                </div>
                                <button onClick={() => setSelectedBooking(null)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-slate-400 transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-4 mb-auto">
                                <div className="flex justify-between p-4 rounded-2xl bg-white/5 border border-white/5 items-center">
                                    <span className="text-slate-400 text-sm font-medium">Estado del Pago</span>
                                    <StatusBadge status={selectedBooking.status} />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                        <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest block mb-1">Fecha</span>
                                        <span className="text-white font-bold">{formatDate(selectedBooking.startTime)}</span>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                        <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest block mb-1">Horario</span>
                                        <span className="text-white font-bold font-mono">{formatTime(selectedBooking.startTime)} - {formatTime(selectedBooking.endTime)}</span>
                                    </div>
                                </div>

                                <div className="p-5 rounded-2xl bg-accent/5 border border-accent/10 flex justify-between items-center group">
                                    <div>
                                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Inversión Total</p>
                                        <div className="flex items-baseline gap-1 mt-1">
                                            <span className="text-accent text-sm font-bold">S/</span>
                                            <span className="text-3xl font-black text-white leading-none">
                                                {selectedBooking.totalPrice || selectedBooking.price || 0}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <CreditCard className="text-accent w-6 h-6" />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mt-8">
                                {selectedBooking.status?.toUpperCase() !== "CONFIRMED" && (
                                    <button
                                        onClick={() => handleUpdateStatus(selectedBooking.id, "CONFIRMED")}
                                        disabled={actionLoading}
                                        className="w-full bg-emerald-500 text-slate-950 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-emerald-400 transition-all flex justify-center items-center gap-2 active:scale-95"
                                    >
                                        {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                        Confirmar Pago
                                    </button>
                                )}
                                {/* Cancel button is available for all plans */}
                                {selectedBooking.status?.toUpperCase() !== "CANCELLED" && (
                                    <button
                                        onClick={() => handleUpdateStatus(selectedBooking.id, "CANCELLED")}
                                        disabled={actionLoading}
                                        className="w-full bg-white/5 text-slate-400 hover:text-white hover:bg-red-500/20 py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex justify-center items-center gap-2 active:scale-95"
                                    >
                                        {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarX className="w-4 h-4" />}
                                        Cancelar
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Referir Método de Pago para Cobrar */}
            {payModalBooking && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setPayModalBooking(null)} />
                    <div className="relative bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-white/10 w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6">
                            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Confirmar Pago</h3>
                            <p className="text-sm text-slate-500 mb-6">Selecciona el método de pago por <strong className="text-accent">S/{payModalBooking.totalPrice || payModalBooking.price || 0}</strong>.</p>

                            <div className="grid grid-cols-2 gap-2 mb-6">
                                {['Efectivo', 'Yape', 'Plin', 'Tarjeta', 'Transferencia', 'Otro'].map(m => (
                                    <button
                                        key={m}
                                        disabled={payLoading}
                                        onClick={() => handlePaymentSubmit(m)}
                                        className="py-3 rounded-xl border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-accent hover:border-accent hover:text-slate-950 transition-all text-sm disabled:opacity-50"
                                    >
                                        {payLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : m}
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={() => setPayModalBooking(null)}
                                disabled={payLoading}
                                className="w-full py-3 text-slate-400 font-bold text-sm hover:text-slate-700 dark:hover:text-white transition-colors"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Reserva Rápida (Walk-in) */}
            {showQuickBooking && (() => {
                const qbField = allFields.find(f => f.id === qbForm.fieldId);
                const qbPrice = qbField ? +(qbField.pricePerHour * qbForm.duration / 60).toFixed(2) : 0;
                const qbClient = allClientsList.find(c => c.id === qbForm.clientId);

                // --- 1. Función actualizada con Sonner y TypeScript estricto ---
                const handleQbSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
                    e.preventDefault();
                    if (!qbForm.fieldId) return;

                    const loadingToast = toast.loading("Registrando reserva...");
                    setQbSubmitting(true);

                    try {
                        const start = new Date(qbForm.startTime);
                        const end = new Date(start.getTime() + qbForm.duration * 60000);
                        const payload: any = {
                            field: { connect: { id: qbForm.fieldId } },
                            startTime: start.toISOString(),
                            endTime: end.toISOString(),
                            status: "CONFIRMED",
                            totalPrice: qbPrice,
                            paymentMethod: qbForm.paymentMethod || undefined,
                        };
                        if (qbForm.clientId) payload.client = { connect: { id: qbForm.clientId } };

                        await bookingsApi.create(payload);

                        toast.success("¡Reserva registrada con éxito!", { id: loadingToast });
                        closeQuickBooking();
                        setQbForm(getQbInitial());
                        setQbClientSearch("");
                        loadData(true);
                    } catch (err: any) {
                        const msg = err?.response?.data?.message || err?.message || "Error al crear reserva.";
                        toast.error(typeof msg === 'string' ? msg : "Verifica los datos de la reserva", { id: loadingToast });
                    } finally {
                        setQbSubmitting(false);
                    }
                };

                // --- 2. Renderizado del Modal ---
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

                        {/* Backdrop */}
                        <div
                            className={`absolute inset-0 bg-white/80 dark:bg-[#020817]/80 backdrop-blur-sm ${isClosingQB ? 'animate-fade-out' : 'animate-fade-in'}`}
                            onClick={closeQuickBooking}
                        />

                        {/* Contenedor del Modal */}
                        <div className={`bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-[2rem] w-full max-w-xl relative z-10 shadow-[0_0_50px_rgba(0,0,0,0.1)] dark:shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col max-h-[90vh] overflow-hidden ${isClosingQB ? 'animate-modal-out' : 'animate-modal-in'}`}>

                            {/* Header (Fijo) */}
                            <div className="px-8 py-6 border-b border-slate-200 dark:border-white/5 flex items-center gap-4 flex-shrink-0 bg-slate-50 dark:bg-white/[0.02]">
                                <div className="w-12 h-12 bg-accent/10 text-accent rounded-2xl flex items-center justify-center flex-shrink-0">
                                    <Zap className="w-6 h-6" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white">Reserva Rápida</h3>
                                    <p className="text-slate-500 text-xs mt-0.5">Registra un walk-in en segundos</p>
                                </div>
                                <button type="button" onClick={closeQuickBooking} className="p-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-full text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleQbSubmit} className="flex flex-col flex-1 min-h-0">

                                {/* Body del formulario */}
                                <div className="flex-1 overflow-y-auto p-8 space-y-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">

                                    {/* Client picker */}
                                    <div>
                                        <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
                                            Cliente <span className="text-slate-400 dark:text-slate-500 font-normal normal-case tracking-normal text-[10px]">(opcional)</span>
                                        </label>
                                        {qbClient ? (
                                            <div className="flex items-center gap-3 bg-accent/5 border border-accent/20 dark:border-accent/30 rounded-xl p-3">
                                                <div className="w-9 h-9 rounded-xl bg-accent/10 dark:bg-accent/20 flex items-center justify-center text-xs font-black text-accent flex-shrink-0">
                                                    {qbClient.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-slate-900 dark:text-white font-bold text-sm truncate">{qbClient.name}</p>
                                                    <p className="text-slate-500 dark:text-slate-400 text-xs">{qbClient.phone}</p>
                                                </div>
                                                <button type="button" onClick={() => setQbForm({ ...qbForm, clientId: '' })} className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 rounded-full transition-colors">
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
            })()}


        </>
    );
};

export default DashboardPage;