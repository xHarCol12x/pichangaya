"use client";

import React, { useEffect, useState } from "react";
import { Users, Activity, AlertCircle } from "lucide-react";
import api from "@/lib/api";

import { useRouter } from "next/navigation";


const PLAN_LABELS: Record<string, string> = {
    FREE_TRIAL: 'Prueba Gratis',
    BASIC: 'Básico',
    PRO: 'Pro',
    ENTERPRISE: 'Enterprise',
};

interface Tenant {
    id: string;
    email: string;
    name: string;
    isActive: boolean;
    plan: string;
    subscriptionEndsAt: string | null;
    createdAt: string;
}

export default function SuperAdminDashboard() {
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTenants = async () => {
            try {
                const { data } = await api.get('/users/tenants');
                setTenants(data);
            } catch (error) {
                console.error("Failed to fetch tenants", error);
            } finally {
                setLoading(false);
            }
        };
        fetchTenants();
    }, []);

    const activeTenants = tenants.filter(t => t.isActive).length;
    const expiredTenants = tenants.length - activeTenants;

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div>
                <h1 className="text-4xl font-bold tracking-tight text-white mb-2">Panel de Control Global</h1>
                <p className="text-slate-400">Resumen operativo general de todos los clientes (Tenants) en la plataforma FieldIQ SaaS.</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass p-6 rounded-3xl border border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-500" />
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-accent/20 flex items-center justify-center text-accent">
                            <Users className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-300">Total de Clientes</h3>
                    </div>
                    <p className="text-4xl font-bold text-white">{tenants.length}</p>
                </div>

                <div className="glass p-6 rounded-3xl border border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-500" />
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-green-500/20 flex items-center justify-center text-green-400">
                            <Activity className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-300">Suscripciones Activas</h3>
                    </div>
                    <p className="text-4xl font-bold text-white">{activeTenants}</p>
                </div>

                <div className="glass p-6 rounded-3xl border border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-500" />
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-red-500/20 flex items-center justify-center text-red-500">
                            <AlertCircle className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-300">Cuentas Suspendidas</h3>
                    </div>
                    <p className="text-4xl font-bold text-white">{expiredTenants}</p>
                </div>
            </div>

            {/* Table */}
            <div className="glass rounded-3xl border border-white/5 overflow-hidden">
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                    <h2 className="text-xl font-semibold text-white">Directorio de Clientes (Tenants)</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/10 text-slate-400 text-sm">
                                <th className="p-4 font-medium">Cliente</th>
                                <th className="p-4 font-medium">Plan</th>
                                <th className="p-4 font-medium">Estado</th>
                                <th className="p-4 font-medium">Vencimiento</th>
                                <th className="p-4 font-medium">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {loading ? (
                                <tr><td colSpan={5} className="p-8 text-center text-slate-500">Cargando clientes...</td></tr>
                            ) : tenants.length === 0 ? (
                                <tr><td colSpan={5} className="p-8 text-center text-slate-500">No hay clientes administradores registrados aún.</td></tr>
                            ) : (
                                tenants.map((tenant) => (
                                    <TenantRow key={tenant.id} tenant={tenant} />
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// ─── TenantRow con tooltip siguiendo el mouse ────────────────────────────────
function TenantRow({ tenant }: { tenant: any }) {
    const router = useRouter();
    const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

    const handleMouseEnter = (e: React.MouseEvent) => {
        if (!tenant.subscriptionEndsAt) return;
        setMousePos({ x: e.clientX, y: e.clientY });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!tenant.subscriptionEndsAt) return;
        setMousePos({ x: e.clientX, y: e.clientY });
    };

    const handleMouseLeave = () => setMousePos(null);

    return (
        <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
            {/* Cliente */}
            <td className="p-4">
                <div className="font-medium text-white">{tenant.name || 'Sin nombre'}</div>
                <div className="text-xs text-slate-400">{tenant.email}</div>
            </td>

            {/* Plan */}
            <td className="p-4">
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-accent/10 text-accent border border-accent/20">
                    {PLAN_LABELS[tenant.plan] ?? tenant.plan ?? 'Sin plan'}
                </span>
            </td>

            {/* Estado */}
            <td className="p-4">
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${tenant.isActive
                    ? 'bg-green-500/10 text-green-400 border-green-500/20'
                    : 'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}>
                    {tenant.isActive ? 'Activo' : 'Suspendido'}
                </span>
            </td>

            {/* Vencimiento — tooltip sigue al mouse via position fixed */}
            <td
                className="p-4 text-slate-300 cursor-default select-none"
                onMouseEnter={handleMouseEnter}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
            >
                {tenant.subscriptionEndsAt ? (
                    <span className="underline decoration-dotted decoration-slate-500">
                        {new Date(tenant.subscriptionEndsAt).toLocaleDateString('es-PE', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                        })}
                    </span>
                ) : (
                    <span className="text-accent/60 italic">Ilimitado</span>
                )}

                {/* Tooltip renderizado fuera del flujo normal con position:fixed */}
                {mousePos && tenant.subscriptionEndsAt && (
                    <div
                        className="pointer-events-none"
                        style={{
                            position: 'fixed',
                            top: mousePos.y + 16,
                            left: mousePos.x + 16,
                            zIndex: 9999,
                        }}
                    >
                        <div className="bg-slate-900/95 backdrop-blur-md p-3 rounded-2xl border border-white/10 shadow-2xl min-w-[210px]">
                            <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">
                                Tiempo restante
                            </p>
                            <LiveCountdown targetDate={tenant.subscriptionEndsAt} />
                        </div>
                    </div>
                )}
            </td>

            {/* Acciones */}
            <td className="p-4">
                <button onClick={() => router.push(`/dashboard/super-admin/tenants/${tenant.id}`)}>
                    Gestionar Suscripción
                </button>
            </td>
        </tr>
    );
}

// ─── Countdown en vivo ───────────────────────────────────────────────────────
function LiveCountdown({ targetDate }: { targetDate: string }) {
    const calculate = () => {
        const diff = +new Date(targetDate) - +new Date();
        if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
        return {
            days: Math.floor(diff / (1000 * 60 * 60 * 24)),
            hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
            minutes: Math.floor((diff / 1000 / 60) % 60),
            seconds: Math.floor((diff / 1000) % 60),
            isExpired: false,
        };
    };

    const [timeLeft, setTimeLeft] = useState(calculate);

    useEffect(() => {
        const timer = setInterval(() => setTimeLeft(calculate()), 1000);
        return () => clearInterval(timer);
    }, [targetDate]);

    if (timeLeft.isExpired) {
        return (
            <p className="text-red-400 font-bold text-xs flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Expirado
            </p>
        );
    }

    const units = [
        { value: timeLeft.days, label: 'Días' },
        { value: timeLeft.hours, label: 'Hrs' },
        { value: timeLeft.minutes, label: 'Min' },
        { value: timeLeft.seconds, label: 'Seg' },
    ];

    return (
        <div className="flex gap-2 items-center">
            {units.map((u, i) => (
                <React.Fragment key={u.label}>
                    <div className="flex flex-col items-center min-w-[28px]">
                        <span className="text-white font-bold text-base tabular-nums">
                            {String(u.value).padStart(2, '0')}
                        </span>
                        <span className="text-[8px] text-slate-500 uppercase">{u.label}</span>
                    </div>
                    {i < units.length - 1 && (
                        <span className="text-slate-600 text-sm pb-3">:</span>
                    )}
                </React.Fragment>
            ))}
        </div>
    );
}