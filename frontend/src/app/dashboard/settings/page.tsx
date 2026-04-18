"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { users } from "@/lib/api";
import { User, Bell, Lock, Palette, Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

function urlBase64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = atob(base64);
    return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export default function SettingsPage() {
    const { theme, setTheme, resolvedTheme } = useTheme();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("profile");

    // User Data
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [profile, setProfile] = useState({ name: "", email: "", plan: "", role: "" });
    const [notifications, setNotifications] = useState(true);

    // Web Push state
    const [pushPermission, setPushPermission] = useState<NotificationPermission | "unsupported">("default");
    const [pushEnabled, setPushEnabled] = useState(false);
    const [pushLoading, setPushLoading] = useState(false);
    const [pushMsg, setPushMsg] = useState("");

    // Password
    const [passwords, setPasswords] = useState({ current: "", newPass: "", confirm: "" });
    const [passMsg, setPassMsg] = useState({ type: "", text: "" });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await users.getMe();
                setProfile({
                    name: res.data.name || "",
                    email: res.data.email || "",
                    plan: res.data.plan || "Gratuito",
                    role: res.data.role || "USER"
                });
                setNotifications(res.data.emailNotifications ?? true);
            } catch (e) {
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSettings();

        // Check browser push permission
        if (typeof window !== "undefined" && "Notification" in window) {
            setPushPermission(Notification.permission);
            if (Notification.permission === "granted") setPushEnabled(true);
        } else if (typeof window !== "undefined") {
            setPushPermission("unsupported");
        }
    }, []);

    const handleSaveProfile = async () => {
        setIsSaving(true);
        try {
            await users.updateSettings({ name: profile.name });
            // update local storage name too
            const stored = localStorage.getItem("fieldiq_user");
            if (stored) {
                const parsed = JSON.parse(stored);
                localStorage.setItem("fieldiq_user", JSON.stringify({ ...parsed, name: profile.name }));
            }
            alert("Perfil guardado");
        } catch (e) {
            console.error(e);
            alert("Error al guardar perfil");
        } finally {
            setIsSaving(false);
        }
    };

    const handleThemeChange = async (newVal: string) => {
        setTheme(newVal);
        try {
            await users.updateSettings({ themePreference: newVal });
            const stored = localStorage.getItem("fieldiq_user");
            if (stored) {
                const parsed = JSON.parse(stored);
                localStorage.setItem("fieldiq_user", JSON.stringify({ ...parsed, themePreference: newVal }));
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleToggleNotifications = async () => {
        const newVal = !notifications;
        setNotifications(newVal);
        try {
            await users.updateSettings({ emailNotifications: newVal });
        } catch (e) {
            console.error(e);
            setNotifications(!newVal); // revert on error
        }
    };

    const handleEnablePush = async () => {
        if (!VAPID_PUBLIC_KEY || pushLoading) return;
        setPushLoading(true);
        setPushMsg("");
        try {
            if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
                setPushMsg("Tu navegador no soporta notificaciones push."); return;
            }
            const reg = await navigator.serviceWorker.register("/sw.js");
            const permission = await Notification.requestPermission();
            setPushPermission(permission);
            if (permission !== "granted") {
                setPushMsg("Permiso denegado. Habilítalo en la configuración del navegador."); return;
            }
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
            setPushMsg("✅ ¡Notificaciones push activadas correctamente!");
        } catch (err) {
            console.warn(err);
            setPushMsg("Error al activar notificaciones push.");
        } finally {
            setPushLoading(false);
        }
    };

    const handleDisablePush = async () => {
        try {
            if ("serviceWorker" in navigator) {
                const reg = await navigator.serviceWorker.getRegistration("/sw.js");
                if (reg) {
                    const sub = await reg.pushManager.getSubscription();
                    if (sub) {
                        const token = localStorage.getItem("fieldiq_token");
                        await axios.delete(`${API_URL}/notifications/subscribe`,
                            { data: { endpoint: sub.endpoint }, headers: { Authorization: `Bearer ${token}` } }
                        );
                        await sub.unsubscribe();
                    }
                }
            }
            setPushEnabled(false);
            setPushMsg("Notificaciones push desactivadas.");
        } catch (err) {
            console.warn(err);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setPassMsg({ type: "", text: "" });

        if (passwords.newPass !== passwords.confirm) {
            setPassMsg({ type: "error", text: "Las contraseñas no coinciden" });
            return;
        }

        setIsSaving(true);
        try {
            await users.changePassword({
                currentPassword: passwords.current,
                newPassword: passwords.newPass
            });
            setPassMsg({ type: "success", text: "Contraseña actualizada correctamente" });
            setPasswords({ current: "", newPass: "", confirm: "" });
        } catch (err: any) {
            setPassMsg({ type: "error", text: err.response?.data?.message || "Error al cambiar contraseña" });
        } finally {
            setIsSaving(false);
        }
    };

    const tabs = [
        { id: "profile", label: "Mi Perfil", icon: User },
        { id: "appearance", label: "Apariencia", icon: Palette },
        ...(profile.role !== "SUPER_ADMIN" ? [{ id: "notifications", label: "Notificaciones", icon: Bell }] : []),
        { id: "security", label: "Seguridad", icon: Lock },
    ];

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-accent" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">Configuración</h1>
                <p className="text-slate-500 dark:text-slate-400">Gestiona tus preferencias, perfil y seguridad de la cuenta.</p>
            </div>

            <div className="flex flex-col md:flex-row gap-8">
                {/* Menú Lateral de Tabs */}
                <div className="w-full md:w-64 shrink-0 space-y-1">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${isActive
                                    ? "bg-accent text-accent-foreground shadow-md"
                                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"
                                    }`}
                            >
                                <Icon className="w-5 h-5" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Contenido Dinámico */}
                <div className="flex-1 min-w-0">
                    {/* PROFILE TAB */}
                    {activeTab === "profile" && (
                        <div className="bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-sm">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Información Personal</h2>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Nombre Completo</label>
                                    <input
                                        type="text"
                                        value={profile.name}
                                        onChange={e => setProfile({ ...profile, name: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-accent/50 outline-none transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Correo Electrónico</label>
                                    <input
                                        type="email"
                                        value={profile.email}
                                        disabled
                                        className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-500 dark:text-slate-500 cursor-not-allowed"
                                    />
                                </div>

                                {profile.role !== "SUPER_ADMIN" && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Plan Actual</label>
                                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-medium text-sm">
                                            Plan {profile.plan}
                                        </div>
                                    </div>
                                )}

                                <div className="pt-4 flex justify-end">
                                    <button
                                        onClick={handleSaveProfile}
                                        disabled={isSaving}
                                        className="bg-accent text-accent-foreground px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-accent/90 transition-all disabled:opacity-50"
                                    >
                                        {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                        Guardar Cambios
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* APPEARANCE TAB */}
                    {activeTab === "appearance" && (
                        <div className="bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-sm">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Tema e Interfaz</h2>
                            <p className="text-slate-500 dark:text-slate-400 mb-8">Personaliza cómo se ve tu entorno de trabajo. El modo oscuro ayuda a reducir la fatiga visual en la noche.</p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <button
                                    onClick={() => handleThemeChange("light")}
                                    className={`relative flex flex-col items-center gap-4 p-4 rounded-2xl border-2 transition-all ${resolvedTheme === "light"
                                        ? "border-accent bg-accent/5"
                                        : "border-slate-200 dark:border-white/10 hover:border-accent/50"
                                        }`}
                                >
                                    <div className="w-full h-32 bg-slate-100 rounded-xl border border-slate-200 shadow-sm flex flex-col p-2 gap-2">
                                        <div className="w-full h-6 bg-white rounded-md shadow-sm border border-slate-100 flex items-center px-2">
                                            <div className="w-2 h-2 rounded-full bg-slate-300" />
                                        </div>
                                        <div className="flex gap-2 flex-1">
                                            <div className="w-1/3 h-full bg-white rounded-md border border-slate-100" />
                                            <div className="w-2/3 h-full bg-white rounded-md border border-slate-100" />
                                        </div>
                                    </div>
                                    <span className="font-medium text-slate-900 dark:text-white">Modo Claro</span>
                                    {resolvedTheme === "light" && <div className="absolute top-3 right-3 w-4 h-4 bg-accent rounded-full border-2 border-slate-200 dark:border-slate-900" />}
                                </button>

                                <button
                                    onClick={() => handleThemeChange("dark")}
                                    className={`relative flex flex-col items-center gap-4 p-4 rounded-2xl border-2 transition-all ${resolvedTheme === "dark"
                                        ? "border-accent bg-accent/5"
                                        : "border-slate-200 dark:border-white/10 hover:border-accent/50"
                                        }`}
                                >
                                    <div className="w-full h-32 bg-slate-900 rounded-xl border border-slate-800 shadow-sm flex flex-col p-2 gap-2">
                                        <div className="w-full h-6 bg-slate-950 rounded-md shadow-sm border border-slate-800 flex items-center px-2">
                                            <div className="w-2 h-2 rounded-full bg-slate-700" />
                                        </div>
                                        <div className="flex gap-2 flex-1">
                                            <div className="w-1/3 h-full bg-slate-950 rounded-md border border-slate-800" />
                                            <div className="w-2/3 h-full bg-slate-950 rounded-md border border-slate-800" />
                                        </div>
                                    </div>
                                    <span className="font-medium text-slate-900 dark:text-white">Modo Oscuro</span>
                                    {resolvedTheme === "dark" && <div className="absolute top-3 right-3 w-4 h-4 bg-accent rounded-full border-2 border-white dark:border-slate-900" />}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* NOTIFICATIONS TAB */}
                    {activeTab === "notifications" && (
                        <div className="bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Preferencias de Alertas</h2>

                            {/* Email toggle */}
                            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/5">
                                <div>
                                    <h3 className="font-medium text-slate-900 dark:text-white">Correos de Plataforma</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Resúmenes, noticias y avisos de expiración en tu correo.</p>
                                </div>
                                <button
                                    onClick={handleToggleNotifications}
                                    className={`relative w-12 h-6 rounded-full transition-colors ${notifications ? 'bg-accent' : 'bg-slate-300 dark:bg-slate-600'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${notifications ? 'translate-x-7' : 'translate-x-1'}`} />
                                </button>
                            </div>

                            {/* Web Push toggle */}
                            {VAPID_PUBLIC_KEY && (
                                <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/5">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                                                🔔 Notificaciones Emergentes (Push)
                                                {pushEnabled && <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded-full">ACTIVO</span>}
                                            </h3>
                                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                                Recibe alertas del sistema en Windows aunque tengas la pestaña cerrada.
                                            </p>
                                        </div>
                                        {pushPermission !== "unsupported" && (
                                            <button
                                                onClick={pushEnabled ? handleDisablePush : handleEnablePush}
                                                disabled={pushLoading || pushPermission === "denied"}
                                                className={`relative w-12 h-6 rounded-full transition-colors disabled:opacity-40 ${pushEnabled ? 'bg-accent' : 'bg-slate-300 dark:bg-slate-600'
                                                    }`}
                                            >
                                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${pushEnabled ? 'translate-x-7' : 'translate-x-1'
                                                    }`} />
                                            </button>
                                        )}
                                    </div>
                                    {pushPermission === "denied" && (
                                        <p className="text-xs text-red-400 mt-2">
                                            🚫 Bloqueado por el navegador. Ve a la barra de dirección → 🔒 → Notificaciones → Permitir, luego recarga.
                                        </p>
                                    )}
                                    {pushMsg && (
                                        <p className={`text-xs mt-2 ${pushMsg.startsWith('✅') ? 'text-emerald-400' : 'text-slate-400'}`}>{pushMsg}</p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* SECURITY TAB */}
                    {activeTab === "security" && (
                        <div className="bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-sm">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Cambiar Contraseña</h2>

                            <form onSubmit={handleChangePassword} className="space-y-6">
                                {passMsg.text && (
                                    <div className={`p-4 rounded-xl text-sm font-medium ${passMsg.type === 'error' ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'
                                        }`}>
                                        {passMsg.text}
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Contraseña Actual</label>
                                    <input
                                        type="password"
                                        required
                                        value={passwords.current}
                                        onChange={e => setPasswords({ ...passwords, current: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-accent/50 outline-none transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Nueva Contraseña</label>
                                    <input
                                        type="password"
                                        required
                                        value={passwords.newPass}
                                        onChange={e => setPasswords({ ...passwords, newPass: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-accent/50 outline-none transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Confirmar Nueva Contraseña</label>
                                    <input
                                        type="password"
                                        required
                                        value={passwords.confirm}
                                        onChange={e => setPasswords({ ...passwords, confirm: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-accent/50 outline-none transition-all"
                                    />
                                </div>

                                <div className="pt-4 flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="bg-accent text-accent-foreground px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-accent/90 transition-all disabled:opacity-50"
                                    >
                                        {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                        Actualizar Contraseña
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
