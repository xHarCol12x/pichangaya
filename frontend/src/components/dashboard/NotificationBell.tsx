"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Bell, Calendar, MapPin, X, CheckCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { bookings as bookingsApi } from "@/lib/api";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

function urlBase64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = atob(base64);
    return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

interface NotifItem {
    id: string;
    title: string;
    body: string;
    time: string;
    read: boolean;
    url?: string;
    field?: string;
    client?: string;
}

const NotificationBell = () => {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState<NotifItem[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [pushEnabled, setPushEnabled] = useState(false);
    const [pushPermission, setPushPermission] = useState<NotificationPermission | "unsupported">("default");
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Check existing notification permission on mount
    useEffect(() => {
        if (typeof window === "undefined") return;
        if (!("Notification" in window)) { setPushPermission("unsupported"); return; }
        setPushPermission(Notification.permission);
        if (Notification.permission === "granted") setPushEnabled(true);
    }, []);

    // Close on click outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // Fetch pending bookings as notifications
    const fetchNotifications = useCallback(async () => {
        try {
            const res = await bookingsApi.getAll();
            const rawData = res.data;
            const all = Array.isArray(rawData) ? rawData : [];
            const pending: NotifItem[] = all
                .filter((b: any) => b.status === "PENDING")
                .slice(0, 10)
                .map((b: any) => ({
                    id: b.id,
                    title: "Reserva Pendiente",
                    body: `${b.field?.name?.toUpperCase() || "Cancha"} — ${new Date(b.startTime).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}`,
                    time: b.createdAt || b.startTime,
                    read: false,
                    url: "/dashboard/bookings",
                    field: b.field?.name,
                    client: b.client?.name,
                }));
            setNotifications(pending);
            setUnreadCount(pending.length);
        } catch (err) {
            console.error("NotificationBell fetch error:", err);
        }
    }, []);

    useEffect(() => {
        // Initial fetch for pending history
        fetchNotifications();

        // Start SSE connection
        const token = localStorage.getItem("fieldiq_token");
        if (!token) return;

        const url = `${API_URL}/notifications/stream?token=${token}`;
        const eventSource = new EventSource(url);

        eventSource.onmessage = (event) => {
            try {
                const payload = JSON.parse(event.data);

                const newNotif: NotifItem = {
                    id: Math.random().toString(36).substring(7),
                    title: payload.title || "Nueva Notificación",
                    body: payload.body || "",
                    time: new Date().toISOString(),
                    read: false,
                    url: payload.url,
                };

                setNotifications(prev => [newNotif, ...prev]);
                setUnreadCount(prev => prev + 1);
            } catch (err) {
                console.error("Error parsing SSE message", err);
            }
        };

        eventSource.onerror = (error) => {
            if (eventSource.readyState === EventSource.CLOSED) {
                console.error("SSE connection closed.");
            } else if (eventSource.readyState === EventSource.CONNECTING) {
                // Routine reconnection, no need to log as an error
                console.log("SSE reconnecting in background...");
            }
        };

        return () => {
            eventSource.close();
        };
    }, [fetchNotifications]);

    // Register SW + push -- called only when user clicks the button
    const enablePushNotifications = async () => {
        try {
            if (!VAPID_PUBLIC_KEY) return;
            if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
                console.warn("Push not supported"); return;
            }
            const reg = await navigator.serviceWorker.register("/sw.js");
            const permission = await Notification.requestPermission();
            if (permission !== "granted") return;

            const sub = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
            });
            const subJson = sub.toJSON();
            const token = localStorage.getItem("fieldiq_token");
            await axios.post(
                `${API_URL}/notifications/subscribe`,
                { endpoint: subJson.endpoint, keys: { p256dh: subJson.keys?.p256dh, auth: subJson.keys?.auth } },
                { headers: { Authorization: `Bearer ${token}` } },
            );
            setPushEnabled(true);
            setPushPermission("granted");
        } catch (err) {
            console.warn("Push registration failed:", err);
            setPushPermission(Notification.permission);
        }
    };

    const markAllRead = () => {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
    };

    const formatTime = (iso: string) => {
        try {
            const d = new Date(iso);
            const diff = Date.now() - d.getTime();
            const mins = Math.floor(diff / 60000);
            if (mins < 1) return "Ahora";
            if (mins < 60) return `Hace ${mins} min`;
            const hrs = Math.floor(mins / 60);
            if (hrs < 24) return `Hace ${hrs}h`;
            return d.toLocaleDateString("es-PE", { day: "numeric", month: "short" });
        } catch { return ""; }
    };

    return (
        <div className="relative hidden sm:block" ref={dropdownRef}>
            <button
                onClick={() => { setOpen((v) => !v); if (!open) markAllRead(); }}
                className="relative w-10 h-10 glass rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-all"
                title="Notificaciones"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 ? (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center px-1 shadow-[0_0_10px_rgba(239,68,68,0.5)]">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                ) : (
                    <div className="absolute top-2.5 right-2.5 w-2 h-2 bg-accent rounded-full border-2 border-slate-900 shadow-[0_0_10px_rgba(56,189,248,0.4)]" />
                )}
            </button>

            {open && (
                <div className="absolute right-0 mt-3 w-80 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 z-50">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-white/5">
                        <div className="flex items-center gap-2">
                            <Bell className="w-4 h-4 text-accent" />
                            <span className="text-sm font-black text-slate-900 dark:text-white">Notificaciones</span>
                            {pushEnabled && (
                                <span className="text-[9px] font-bold bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded-full uppercase tracking-wider">Push on</span>
                            )}
                        </div>
                        <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* List */}
                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-white/5">
                        {notifications.length === 0 ? (
                            <div className="py-10 text-center">
                                <CheckCheck className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                                <p className="text-sm text-slate-500 dark:text-slate-400">Sin pendientes 🎉</p>
                            </div>
                        ) : (
                            notifications.map((n) => (
                                <button
                                    key={n.id}
                                    onClick={() => { setOpen(false); router.push(n.url || "/dashboard/bookings"); }}
                                    className={`w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors flex gap-3 items-start ${!n.read ? "bg-accent/5" : ""}`}
                                >
                                    <div className="w-8 h-8 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        {n.field ? <MapPin className="w-4 h-4 text-accent" /> : <Calendar className="w-4 h-4 text-accent" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">{n.title}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{n.body}</p>
                                        {n.client && <p className="text-[10px] text-slate-400 mt-0.5">👤 {n.client}</p>}
                                    </div>
                                    <span className="text-[10px] text-slate-400 flex-shrink-0 mt-0.5">{formatTime(n.time)}</span>
                                </button>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-4 py-2.5 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                        <button
                            onClick={() => { setOpen(false); router.push("/dashboard/bookings"); }}
                            className="text-xs font-bold text-accent hover:underline"
                        >
                            Ver todas las reservas →
                        </button>
                        {notifications.length > 0 && (
                            <button onClick={markAllRead} className="text-xs text-slate-400 hover:text-white transition-colors">
                                Leídas
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
