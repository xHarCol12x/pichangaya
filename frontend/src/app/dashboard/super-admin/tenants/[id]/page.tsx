"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowLeft, Building2, Calendar, CheckCircle2,
    TrendingUp, Users, Clock, Save, AlertCircle,
    CreditCard, ShieldCheck, Ban
} from "lucide-react";
import api from "@/lib/api";

const PLAN_LABELS: Record<string, string> = {
    FREE_TRIAL: 'Prueba Gratis',
    BASIC: 'Básico',
    PRO: 'Pro',
    ENTERPRISE: 'Enterprise',
};

const PLAN_COLORS: Record<string, string> = {
    FREE_TRIAL: 'text-slate-400 bg-slate-400/10 border-slate-400/20',
    BASIC: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    PRO: 'text-accent bg-accent/10 border-accent/20',
    ENTERPRISE: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
};

const PLANS = ['FREE_TRIAL', 'BASIC', 'PRO', 'ENTERPRISE'];

interface TenantDetail {
    id: string;
    email: string;
    name: string;
    isActive: boolean;
    plan: string;
    subscriptionEndsAt: string | null;
    createdAt: string;
    updatedAt: string;
    venues: { id: string; name: string; address: string; _count: { fields: number } }[];
    bookings: { id: string; totalPrice: number; status: string; createdAt: string }[];
    _count: { venues: number; bookings: number };
}

type ToastType = 'success' | 'error';

export default function TenantManagePage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();

    const [tenant, setTenant] = useState<TenantDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ msg: string; type: ToastType } | null>(null);

    const [selectedPlan, setSelectedPlan] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [subscriptionEndsAt, setSubscriptionEndsAt] = useState('');
    const [extendDays, setExtendDays] = useState('');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        fetchTenant();
    }, [id]);

    const fetchTenant = async () => {
        try {
            const { data } = await api.get(`/users/tenants/${id}`);
            setTenant(data);
            setSelectedPlan(data.plan);
            setIsActive(data.isActive);
            setSubscriptionEndsAt(
                data.subscriptionEndsAt
                    ? new Date(data.subscriptionEndsAt).toISOString().split('T')[0]
                    : ''
            );
        } catch (e) {
            showToast('Error al cargar el tenant', 'error');
        } finally {
            setLoading(false);
        }
    };

    const showToast = (msg: string, type: ToastType) => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload: any = {
                plan: selectedPlan,
                isActive,
                subscriptionEndsAt: subscriptionEndsAt || null,
            };

            if (extendDays && parseInt(extendDays) > 0) {
                payload.extendDays = parseInt(extendDays);
                delete payload.subscriptionEndsAt;
            }

            const { data } = await api.patch(`/users/tenants/${id}/subscription`, payload);
            setTenant(prev => prev ? { ...prev, ...data } : prev);
            setExtendDays('');
            showToast('Suscripción actualizada correctamente', 'success');
        } catch (e) {
            showToast('Error al guardar los cambios', 'error');
        } finally {
            setSaving(false);
        }
    };

    const totalRevenue = tenant?.bookings
        .filter(b => b.status === 'CONFIRMED' || b.status === 'COMPLETED')
        .reduce((sum, b) => sum + b.totalPrice, 0) ?? 0;

    const daysLeft = tenant?.subscriptionEndsAt
        ? Math.max(0, Math.ceil((+new Date(tenant.subscriptionEndsAt) - +new Date()) / (1000 * 60 * 60 * 24)))
        : null;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!tenant) {
        return <div className="text-center py-20 text-slate-400">Tenant no encontrado.</div>;
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* Toast */}
            {toast && (
                <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl border shadow-2xl animate-in fade-in slide-in-from-top-2 duration-300 ${toast.type === 'success'
                    ? 'bg-green-500/10 border-green-500/30 text-green-400'
                    : 'bg-red-500/10 border-red-500/30 text-red-400'
                    }`}>
                    {toast.type === 'success'
                        ? <CheckCircle2 className="w-4 h-4" />
                        : <AlertCircle className="w-4 h-4" />}
                    <span className="text-sm font-medium">{toast.msg}</span>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => router.back()}
                    className="w-10 h-10 rounded-2xl glass border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="flex-1">
                    <h1 className="text-3xl font-bold text-white">{tenant.name || 'Sin nombre'}</h1>
                    <p className="text-slate-400 text-sm">{tenant.email}</p>
                </div>
                <div className="flex items-center gap-3">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${PLAN_COLORS[tenant.plan]}`}>
                        {PLAN_LABELS[tenant.plan]}
                    </span>
                    <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${tenant.isActive
                        ? 'bg-green-500/10 text-green-400 border-green-500/20'
                        : 'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}>
                        {tenant.isActive ? 'Activo' : 'Suspendido'}
                    </span>
                </div>
            </div>

            {/* Stats rápidas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { icon: Building2, label: 'Venues', value: tenant._count.venues, color: 'text-blue-400' },
                    { icon: Users, label: 'Reservas totales', value: tenant._count.bookings, color: 'text-accent' },
                    { icon: TrendingUp, label: 'Ingresos (últimas 5)', value: `S/ ${totalRevenue.toFixed(2)}`, color: 'text-green-400' },
                    {
                        icon: Clock,
                        label: 'Días restantes',
                        value: daysLeft !== null ? `${daysLeft}d` : '∞',
                        color: daysLeft !== null && daysLeft < 7 ? 'text-red-400' : 'text-amber-400'
                    },
                ].map(({ icon: Icon, label, value, color }) => (
                    <div key={label} className="glass p-4 rounded-2xl border border-white/5">
                        <div className={`${color} mb-2`}><Icon className="w-5 h-5" /></div>
                        <p className="text-2xl font-bold text-white">{value}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{label}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Panel de gestión */}
                <div className="lg:col-span-2 space-y-5">

                    {/* Plan */}
                    <div className="glass rounded-3xl border border-white/5 p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <CreditCard className="w-5 h-5 text-accent" />
                            <h2 className="text-lg font-semibold text-white">Plan de suscripción</h2>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {PLANS.map(plan => (
                                <button
                                    key={plan}
                                    onClick={() => setSelectedPlan(plan)}
                                    className={`p-3 rounded-2xl border text-sm font-medium transition-all duration-200 ${selectedPlan === plan
                                        ? `${PLAN_COLORS[plan]} scale-[1.03] shadow-lg`
                                        : 'border-white/10 text-slate-400 hover:border-white/20 hover:text-white'
                                        }`}
                                >
                                    {PLAN_LABELS[plan]}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Estado */}
                    <div className="glass rounded-3xl border border-white/5 p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <ShieldCheck className="w-5 h-5 text-accent" />
                            <h2 className="text-lg font-semibold text-white">Estado de la cuenta</h2>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setIsActive(true)}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border text-sm font-medium transition-all ${isActive
                                    ? 'bg-green-500/15 border-green-500/30 text-green-400'
                                    : 'border-white/10 text-slate-500 hover:text-white hover:border-white/20'
                                    }`}
                            >
                                <CheckCircle2 className="w-4 h-4" /> Activar cuenta
                            </button>
                            <button
                                onClick={() => setIsActive(false)}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border text-sm font-medium transition-all ${!isActive
                                    ? 'bg-red-500/15 border-red-500/30 text-red-400'
                                    : 'border-white/10 text-slate-500 hover:text-white hover:border-white/20'
                                    }`}
                            >
                                <Ban className="w-4 h-4" /> Suspender cuenta
                            </button>
                        </div>
                    </div>

                    {/* Vencimiento */}
                    <div className="glass rounded-3xl border border-white/5 p-6 space-y-4">
                        <div className="flex items-center gap-3 mb-2">
                            <Calendar className="w-5 h-5 text-accent" />
                            <h2 className="text-lg font-semibold text-white">Vencimiento</h2>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs text-slate-500 uppercase tracking-wider">Fecha exacta</label>
                            <input
                                type="date"
                                value={subscriptionEndsAt}
                                onChange={e => setSubscriptionEndsAt(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
                            />
                            <p className="text-xs text-slate-600">Deja vacío para suscripción ilimitada.</p>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="flex-1 h-px bg-white/5" />
                            <span className="text-xs text-slate-600">o extender desde hoy</span>
                            <div className="flex-1 h-px bg-white/5" />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs text-slate-500 uppercase tracking-wider">Sumar días</label>
                            <div className="flex gap-2">
                                {[7, 15, 30, 90].map(d => (
                                    <button
                                        key={d}
                                        onClick={() => setExtendDays(String(d))}
                                        className={`flex-1 py-2 rounded-xl border text-xs font-medium transition-all ${extendDays === String(d)
                                            ? 'bg-accent/15 border-accent/30 text-accent'
                                            : 'border-white/10 text-slate-500 hover:text-white hover:border-white/20'
                                            }`}
                                    >
                                        +{d}d
                                    </button>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    min="1"
                                    placeholder="Días personalizados..."
                                    value={extendDays}
                                    onChange={e => setExtendDays(e.target.value)}
                                    className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all placeholder:text-slate-600"
                                />
                                {extendDays && (
                                    <button
                                        onClick={() => setExtendDays('')}
                                        className="px-4 py-2.5 rounded-2xl border border-white/10 text-slate-500 hover:text-white text-sm transition-colors"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                            <p className="text-xs text-slate-600">
                                Al usar "Sumar días" se ignora la fecha exacta y se suma desde el vencimiento actual.
                            </p>
                        </div>
                    </div>

                    {/* Notas internas */}
                    <div className="glass rounded-3xl border border-white/5 p-6">
                        <h2 className="text-lg font-semibold text-white mb-3">Notas internas</h2>
                        <textarea
                            rows={3}
                            placeholder="Agrega notas sobre este cliente (solo visible para Super Admins)..."
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all placeholder:text-slate-600 resize-none"
                        />
                    </div>

                    {/* Guardar */}
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-accent text-white font-semibold text-sm hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving
                            ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            : <Save className="w-4 h-4" />}
                        {saving ? 'Guardando...' : 'Guardar cambios'}
                    </button>
                </div>

                {/* Panel lateral info */}
                <div className="space-y-5">

                    <div className="glass rounded-3xl border border-white/5 p-5 space-y-3">
                        <h3 className="text-sm font-semibold text-white">Información general</h3>
                        <div className="space-y-2 text-xs">
                            {[
                                { label: 'Miembro desde', value: new Date(tenant.createdAt).toLocaleDateString('es-PE') },
                                { label: 'Última actualización', value: new Date(tenant.updatedAt).toLocaleDateString('es-PE') },
                                {
                                    label: 'Vencimiento actual',
                                    value: tenant.subscriptionEndsAt
                                        ? new Date(tenant.subscriptionEndsAt).toLocaleDateString('es-PE')
                                        : 'Ilimitado'
                                },
                            ].map(({ label, value }) => (
                                <div key={label} className="flex justify-between">
                                    <span className="text-slate-500">{label}</span>
                                    <span className="text-slate-300 font-medium">{value}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="glass rounded-3xl border border-white/5 p-5">
                        <h3 className="text-sm font-semibold text-white mb-3">Venues ({tenant._count.venues})</h3>
                        {tenant.venues.length === 0 ? (
                            <p className="text-xs text-slate-600">Sin venues registrados.</p>
                        ) : (
                            <div className="space-y-2">
                                {tenant.venues.map(v => (
                                    <div key={v.id} className="p-3 rounded-2xl bg-white/5 border border-white/5">
                                        <p className="text-sm text-white font-medium">{v.name}</p>
                                        <p className="text-xs text-slate-500">{v.address}</p>
                                        <p className="text-xs text-accent mt-1">{v._count.fields} canchas</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="glass rounded-3xl border border-white/5 p-5">
                        <h3 className="text-sm font-semibold text-white mb-3">Últimas reservas</h3>
                        {tenant.bookings.length === 0 ? (
                            <p className="text-xs text-slate-600">Sin reservas registradas.</p>
                        ) : (
                            <div className="space-y-2">
                                {tenant.bookings.map(b => (
                                    <div key={b.id} className="flex justify-between items-center p-2.5 rounded-xl bg-white/5">
                                        <div>
                                            <p className="text-xs text-slate-400">
                                                {new Date(b.createdAt).toLocaleDateString('es-PE')}
                                            </p>
                                            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${b.status === 'CONFIRMED' ? 'text-green-400 bg-green-400/10' :
                                                b.status === 'CANCELLED' ? 'text-red-400 bg-red-400/10' :
                                                    'text-slate-400 bg-slate-400/10'
                                                }`}>{b.status}</span>
                                        </div>
                                        <span className="text-sm font-semibold text-white">
                                            S/ {b.totalPrice.toFixed(2)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}