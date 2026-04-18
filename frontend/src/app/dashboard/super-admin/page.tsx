"use client";

import React, { useEffect, useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Users, Activity, AlertCircle, Search, Filter, Eye, Edit2, Play, Pause, DollarSign, Calendar, X, CheckCircle, Loader2, Save, Download, Plus, Key, LogIn, LayoutDashboard, CreditCard, Check, ClipboardList, MapPin, BrainCircuit } from "lucide-react";
import api, { audit } from "@/lib/api";

const PLAN_LABELS: Record<string, string> = {
    FREE_TRIAL: 'Prueba Gratis',
    BASIC: 'Básico',
    PRO: 'Pro',
    ENTERPRISE: 'Enterprise',
};

// Estimación de precios para cálculo de MRR referencial
const PLAN_PRICES: Record<string, number> = {
    FREE_TRIAL: 0,
    BASIC: 49,
    PRO: 99,
    ENTERPRISE: 199,
};

interface Tenant {
    id: string;
    email: string;
    name: string;
    isActive: boolean;
    plan: string;
    subscriptionEndsAt: string | null;
    createdAt: string;
    featureOverrides?: any;
}

interface TenantStats {
    venues: number;
    fields: number;
    bookings: number;
    clients: number;
}

function SuperAdminDashboardContent() {
    const searchParams = useSearchParams();
    const activeTab = (searchParams.get("tab") as "DIRECTORY" | "PLANS" | "AUDIT") || "DIRECTORY";

    // Directorio States
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);

    // Planes States
    const [plansData, setPlansData] = useState<any[]>([]);
    const [plansLoading, setPlansLoading] = useState(false);

    // Audit States
    const [auditLogs, setAuditLogs] = useState<any[]>([]);
    const [auditLoading, setAuditLoading] = useState(false);

    // Filtros
    const [searchTerm, setSearchTerm] = useState("");
    const [filterPlan, setFilterPlan] = useState("ALL");
    const [filterStatus, setFilterStatus] = useState("ALL");

    // Modals
    const [detailTenant, setDetailTenant] = useState<Tenant | null>(null);
    const [editTenant, setEditTenant] = useState<Tenant | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    const [managePermissionsTenant, setManagePermissionsTenant] = useState<any | null>(null);
    const [tempOverrides, setTempOverrides] = useState<any>({});
    const [overridesLoading, setOverridesLoading] = useState(false);

    const handleSavePermissions = async () => {
        if (!managePermissionsTenant) return;
        setOverridesLoading(true);
        try {
            await api.patch(`/users/tenants/${managePermissionsTenant.id}/subscription`, {
                featureOverrides: tempOverrides,
            });
            setTenants(prev => prev.map(t => t.id === managePermissionsTenant.id ? { ...t, featureOverrides: tempOverrides } : t));
            setManagePermissionsTenant(null);
        } catch (e) {
            console.error(e);
            alert("Error al actualizar permisos especiales");
        } finally {
            setOverridesLoading(false);
        }
    };

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

    const fetchPlans = async () => {
        setPlansLoading(true);
        try {
            const { data } = await api.get('/plans/all');
            setPlansData(data);
        } catch (error) {
            console.error("Failed to fetch plans", error);
        } finally {
            setPlansLoading(false);
        }
    };

    const fetchAuditLogs = async () => {
        setAuditLoading(true);
        try {
            const { data } = await audit.getAll(100);
            setAuditLogs(data);
        } catch (error) {
            console.error(error);
        } finally {
            setAuditLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === "DIRECTORY") {
            fetchTenants();
        } else if (activeTab === "PLANS") {
            fetchPlans();
        } else if (activeTab === "AUDIT") {
            fetchAuditLogs();
        }
    }, [activeTab]);

    // ─── KPIs ─────────────────────────────────────────────────────────────
    const now = new Date();
    
    const isTenantActive = (t: Tenant) => {
        if (!t.isActive) return false;
        if (t.subscriptionEndsAt && new Date(t.subscriptionEndsAt) <= now) return false;
        return true;
    };

    const activeTenants = tenants.filter(isTenantActive).length;
    const suspendedTenants = tenants.length - activeTenants;
    const mrr = tenants.filter(isTenantActive).reduce((sum, t) => sum + (PLAN_PRICES[t.plan] || 0), 0);

    const next7Days = new Date();
    next7Days.setDate(next7Days.getDate() + 7);

    const expiringTenants = tenants.filter(t => {
        if (!t.isActive || !t.subscriptionEndsAt) return false;
        const end = new Date(t.subscriptionEndsAt);
        return end <= next7Days && end > now;
    });

    const expiredActiveTenants = tenants.filter(t => {
        if (!t.isActive || !t.subscriptionEndsAt) return false;
        return new Date(t.subscriptionEndsAt) <= now;
    });

    // ─── Filtros ─────────────────────────────────────────────────────────
    const filteredTenants = useMemo(() => {
        return tenants.filter(t => {
            const matchesSearch = (t.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
                (t.email?.toLowerCase() || "").includes(searchTerm.toLowerCase());
            const matchesPlan = filterPlan === "ALL" || t.plan === filterPlan;
            
            const matchesStatus = filterStatus === "ALL" || 
                (filterStatus === "ACTIVE" ? isTenantActive(t) : !isTenantActive(t));
                
            return matchesSearch && matchesPlan && matchesStatus;
        }).sort((a, b) => {
            // Ordenar expirados primero, luego próximos a expirar, luego por fecha de creación
            const aActive = isTenantActive(a);
            const bActive = isTenantActive(b);
            if (!aActive && bActive) return 1;
            if (aActive && !bActive) return -1;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
    }, [tenants, searchTerm, filterPlan, filterStatus]);

    // ─── Acciones Rápidas ────────────────────────────────────────────────
    const toggleTenantStatus = async (tenant: Tenant) => {
        if (!confirm(`¿Estás seguro que deseas ${tenant.isActive ? 'suspender' : 'activar'} la cuenta de ${tenant.name || tenant.email}?`)) return;

        try {
            const { data } = await api.patch(`/users/tenants/${tenant.id}/subscription`, {
                isActive: !tenant.isActive
            });
            setTenants(prev => prev.map(t => t.id === tenant.id ? { ...t, isActive: data.isActive } : t));
        } catch (e) {
            console.error(e);
            alert("Error al cambiar estado");
        }
    };

    const exportToCSV = () => {
        const headers = ["ID", "Nombre", "Email", "Plan", "Estado", "Vencimiento", "Fecha Registro"];
        const rows = filteredTenants.map(t => [
            t.id,
            t.name || "Sin nombre",
            t.email,
            PLAN_LABELS[t.plan] || t.plan,
            isTenantActive(t) ? "Activo" : "Suspendido",
            t.subscriptionEndsAt ? new Date(t.subscriptionEndsAt).toLocaleDateString('es-PE') : "Ilimitado",
            new Date(t.createdAt).toLocaleDateString('es-PE')
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `directorio_clientes_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleImpersonate = async (tenant: Tenant) => {
        if (!confirm(`Vas a iniciar sesión como el cliente "${tenant.name || tenant.email}". ¿Deseas continuar?`)) return;
        try {
            const { data } = await api.post(`/auth/impersonate/${tenant.id}`);
            // Backup SUPER_ADMIN token if needed in the future, 
            // but for simplicity, just replace and allow logout to return to login.
            localStorage.setItem("fieldiq_token", data.access_token);
            localStorage.setItem("fieldiq_user", JSON.stringify(data.user));
            window.location.href = "/dashboard";
        } catch (e: any) {
            console.error(e);
            alert("Error al intentar acceder a la cuenta");
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div>
                <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">Panel de Control Global</h1>
                <p className="text-slate-400 dark:text-slate-500 dark:text-slate-400">Resumen operativo general de todos los clientes (Tenants) en la plataforma PichangaLibre SaaS.</p>
            </div>

            {activeTab === "DIRECTORY" && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* ─── Alertas ─── */}
                    {(expiringTenants.length > 0 || expiredActiveTenants.length > 0) && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                            <div className="flex gap-3">
                                <AlertCircle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
                                <div>
                                    <h3 className="text-red-400 font-bold mb-1">Atención Requerida</h3>
                                    <p className="text-sm text-red-400/80">
                                        Hay {expiredActiveTenants.length} cuentas vencidas y activas, y {expiringTenants.length} cuentas próximas a expirar en los siguientes 7 días.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ─── KPIs ─── */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="glass p-6 rounded-3xl border border-slate-200 dark:border-white/5 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-500" />
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-2xl bg-accent/20 flex items-center justify-center text-accent">
                                    <Users className="w-6 h-6" />
                                </div>
                                <h3 className="text-sm uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500 dark:text-slate-400">Total Clientes</h3>
                            </div>
                            <p className="text-4xl font-bold text-slate-900 dark:text-white">{tenants.length}</p>
                        </div>

                        <div className="glass p-6 rounded-3xl border border-slate-200 dark:border-white/5 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-500" />
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-2xl bg-green-500/20 flex items-center justify-center text-green-400">
                                    <Activity className="w-6 h-6" />
                                </div>
                                <h3 className="text-sm uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500 dark:text-slate-400">Activos</h3>
                            </div>
                            <p className="text-4xl font-bold text-slate-900 dark:text-white">{activeTenants}</p>
                        </div>

                        <div className="glass p-6 rounded-3xl border border-slate-200 dark:border-white/5 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-500" />
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-2xl bg-red-500/20 flex items-center justify-center text-red-500">
                                    <Pause className="w-6 h-6" />
                                </div>
                                <h3 className="text-sm uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500 dark:text-slate-400">Suspendidos</h3>
                            </div>
                            <p className="text-4xl font-bold text-slate-900 dark:text-white">{suspendedTenants}</p>
                        </div>

                        <div className="glass p-6 rounded-3xl border border-slate-200 dark:border-white/5 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-500" />
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                                    <DollarSign className="w-6 h-6" />
                                </div>
                                <h3 className="text-sm uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500 dark:text-slate-400">MRR Est.</h3>
                            </div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-xl text-slate-400 dark:text-slate-500 dark:text-slate-400 font-bold">S/</span>
                                <p className="text-4xl font-bold text-slate-900 dark:text-white">{mrr}</p>
                            </div>
                        </div>
                    </div>

                    {/* ─── Tabla y Filtros ─── */}
                    <div className="glass rounded-3xl border border-slate-200 dark:border-white/5 overflow-hidden flex flex-col">
                        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-white/5 flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center bg-slate-100 dark:bg-white/5">
                            <div className="flex items-center gap-3">
                                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Directorio de Clientes</h2>
                                <span className="bg-slate-200 dark:bg-white/10 text-slate-900 dark:text-white text-xs font-bold px-2.5 py-1 rounded-full">{filteredTenants.length}</span>
                            </div>

                            {/* Controles: Búsqueda, Filtros y Botones */}
                            <div className="flex flex-wrap gap-3 w-full xl:w-auto items-center">
                                <div className="relative flex-1 min-w-[200px]">
                                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 dark:text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Buscar cliente..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl py-2 pl-9 pr-4 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-accent"
                                    />
                                </div>
                                <select
                                    value={filterPlan}
                                    onChange={(e) => setFilterPlan(e.target.value)}
                                    className="bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl py-2 px-4 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-accent"
                                >
                                    <option value="ALL">Todo Plan</option>
                                    <option value="FREE_TRIAL">Prueba</option>
                                    <option value="BASIC">Básico</option>
                                    <option value="PRO">Pro</option>
                                </select>
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    className="bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl py-2 px-4 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-accent"
                                >
                                    <option value="ALL">Todo Estado</option>
                                    <option value="ACTIVE">Activos</option>
                                    <option value="SUSPENDED">Suspendidos</option>
                                </select>
                                <div className="flex items-center gap-2 ml-auto sm:ml-0">
                                    <button
                                        onClick={exportToCSV}
                                        className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 rounded-xl py-2 px-3 text-sm focus:outline-none transition-colors flex items-center gap-2 h-[38px]"
                                        title="Exportar directorio visible a CSV"
                                    >
                                        <Download className="w-4 h-4" />
                                        <span className="hidden sm:inline">Exportar</span>
                                    </button>
                                    <button
                                        onClick={() => setIsCreateModalOpen(true)}
                                        className="bg-accent hover:bg-accent/90 text-slate-950 font-bold rounded-xl py-2 px-4 focus:outline-none transition-colors flex items-center gap-2 h-[38px] shadow-[0_0_15px_rgba(56,189,248,0.2)]"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Nuevo Cliente
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto w-full">
                            <table className="w-full text-left border-collapse min-w-[800px]">
                                <thead>
                                    <tr className="border-b border-slate-200 dark:border-white/10 text-slate-400 dark:text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider bg-slate-100 dark:bg-slate-900/20">
                                        <th className="p-4 font-medium pl-6">Cliente</th>
                                        <th className="p-4 font-medium">Plan</th>
                                        <th className="p-4 font-medium">Estado</th>
                                        <th className="p-4 font-medium">Vencimiento</th>
                                        <th className="p-4 font-medium pr-6 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {loading ? (
                                        <tr><td colSpan={5} className="p-8 text-center text-slate-400 dark:text-slate-500"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />Cargando clientes...</td></tr>
                                    ) : filteredTenants.length === 0 ? (
                                        <tr><td colSpan={5} className="p-8 text-center text-slate-400 dark:text-slate-500">No se encontraron clientes que coincidan con los filtros.</td></tr>
                                    ) : (
                                        filteredTenants.map((tenant) => (
                                            <tr key={tenant.id} className="border-b border-slate-200 dark:border-white/5 hover:bg-slate-100 dark:bg-white/5 transition-colors group">
                                                <td className="p-4 pl-6">
                                                    <div className="font-bold text-slate-900 dark:text-white text-base">{tenant.name || 'Sin nombre'}</div>
                                                    <div className="text-xs text-slate-400 dark:text-slate-500 dark:text-slate-400">{tenant.email}</div>
                                                    <div className="text-[10px] text-slate-600 font-mono mt-1">ID: {tenant.id.split('-')[0]}...</div>
                                                </td>
                                                <td className="p-4">
                                                    <span className="px-2.5 py-1 rounded-full text-[10px] uppercase font-black tracking-widest bg-accent/10 text-accent border border-accent/20">
                                                        {PLAN_LABELS[tenant.plan] ?? tenant.plan}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    {(() => {
                                                        const isExpired = tenant.subscriptionEndsAt && new Date(tenant.subscriptionEndsAt) <= new Date();
                                                        let statusText = 'Activo';
                                                        let statusClass = 'bg-green-500/10 text-green-400 border-green-500/20';
                                                        let dotClass = 'bg-green-400';

                                                        if (!tenant.isActive) {
                                                            statusText = 'Suspendido';
                                                            statusClass = 'bg-red-500/10 text-red-400 border-red-500/20';
                                                            dotClass = 'bg-red-500';
                                                        } else if (isExpired) {
                                                            statusText = 'Expirado';
                                                            statusClass = 'bg-orange-500/10 text-orange-400 border-orange-500/20';
                                                            dotClass = 'bg-orange-500';
                                                        }

                                                        return (
                                                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border inline-flex items-center gap-1.5 ${statusClass}`}>
                                                                <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
                                                                {statusText}
                                                            </span>
                                                        );
                                                    })()}
                                                </td>
                                                <td className="p-4 text-slate-700 dark:text-slate-300">
                                                    {tenant.subscriptionEndsAt ? (
                                                        <div className="flex flex-col">
                                                            <span>{new Date(tenant.subscriptionEndsAt).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                                            <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                                                                {new Date(tenant.subscriptionEndsAt) <= new Date() ? (
                                                                    <span className="text-red-400 font-bold">Expirado</span>
                                                                ) : (
                                                                    <LiveCountdown targetDate={tenant.subscriptionEndsAt} compact />
                                                                )}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-accent/60 italic text-xs">No expira (Ilimitado)</span>
                                                    )}
                                                </td>
                                                <td className="p-4 pr-6 text-right">
                                                    <div className="flex items-center justify-end gap-2 transition-opacity">
                                                        <button
                                                            onClick={() => {
                                                                setManagePermissionsTenant(tenant);
                                                                const parsed = typeof tenant.featureOverrides === 'string' ? JSON.parse(tenant.featureOverrides || '{}') : (tenant.featureOverrides || {});
                                                                setTempOverrides(parsed);
                                                            }}
                                                            className="p-2 text-cyan-400 hover:text-slate-900 dark:text-white bg-cyan-400/10 hover:bg-cyan-400/20 rounded-xl tooltip-trigger transition-colors"
                                                            title="Gestionar Reglas y Permisos Especiales"
                                                        >
                                                            <Key className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleImpersonate(tenant)}
                                                            className="p-2 text-indigo-400 hover:text-slate-900 dark:text-white bg-indigo-400/10 hover:bg-indigo-400/20 rounded-xl tooltip-trigger transition-colors"
                                                            title="Entrar como este cliente (Impersonate)"
                                                        >
                                                            <LogIn className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => setDetailTenant(tenant)}
                                                            className="p-2 text-slate-400 dark:text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl tooltip-trigger transition-colors"
                                                            title="Ver detalles"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => setEditTenant(tenant)}
                                                            className="p-2 text-accent hover:text-slate-900 dark:text-white bg-accent/10 hover:bg-accent/20 rounded-xl tooltip-trigger transition-colors"
                                                            title="Editar plan y suscripción"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => toggleTenantStatus(tenant)}
                                                            className={`p-2 rounded-xl tooltip-trigger transition-colors ${tenant.isActive ? 'text-orange-400 hover:text-slate-900 dark:text-white bg-orange-400/10 hover:bg-orange-400/20' : 'text-green-400 hover:text-slate-900 dark:text-white bg-green-400/10 hover:bg-green-400/20'}`}
                                                            title={tenant.isActive ? "Suspender cuenta" : "Activar cuenta"}
                                                        >
                                                            {tenant.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* ─── Modals ─── */}
                    {
                        detailTenant && (
                            <TenantDetailModal
                                tenant={detailTenant}
                                onClose={() => setDetailTenant(null)}
                                onEdit={() => {
                                    setDetailTenant(null);
                                    setEditTenant(detailTenant);
                                }}
                            />
                        )
                    }

                    {
                        editTenant && (
                            <TenantEditModal
                                tenant={editTenant}
                                onClose={() => setEditTenant(null)}
                                onSaved={(updated) => {
                                    setTenants(prev => prev.map(t => t.id === updated.id ? { ...t, ...updated } : t));
                                    setEditTenant(null);
                                }}
                            />
                        )
                    }

                    {
                        isCreateModalOpen && (
                            <CreateTenantModal
                                onClose={() => setIsCreateModalOpen(false)}
                                onCreated={(newTenant) => {
                                    setTenants(prev => [newTenant, ...prev]);
                                    setIsCreateModalOpen(false);
                                }}
                            />
                        )
                    }

                    {
                        managePermissionsTenant && (
                            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                                <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setManagePermissionsTenant(null)} />
                                <div className="relative bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-white/10 w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                                    <div className="p-6 md:p-8">
                                        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Permisos Especiales</h2>
                                        <p className="text-slate-500 text-sm mb-6">Ajusta los módulos disponibles para <strong className="text-accent">{managePermissionsTenant.name}</strong>. Estos valores sobrescriben los atributos por defecto de su plan actual.</p>

                                        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                                            <label className="flex items-start justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                                <div className="pr-4">
                                                    <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">Permitir Eliminar Reservas</p>
                                                    <p className="text-xs text-slate-500">Habilita el botón de cancelar reservas incluso si pertenece a un plan Básico o Trial.</p>
                                                </div>
                                                <div className="relative inline-flex items-center cursor-pointer mt-1 shrink-0">
                                                    <input
                                                        type="checkbox"
                                                        className="sr-only peer"
                                                        checked={tempOverrides.canDeleteBookings === true}
                                                        onChange={(e) => setTempOverrides({ ...tempOverrides, canDeleteBookings: e.target.checked })}
                                                    />
                                                    <div className="w-11 h-6 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 dark:after:border-slate-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                                                </div>
                                            </label>

                                            <label className="flex items-start justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                                <div className="pr-4">
                                                    <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">Bot de WhatsApp Integrado (IA)</p>
                                                    <p className="text-xs text-slate-500">Activa el widget del bot de inteligencia artificial conectado a n8n en su Tenant público.</p>
                                                </div>
                                                <div className="relative inline-flex items-center cursor-pointer mt-1 shrink-0">
                                                    <input
                                                        type="checkbox"
                                                        className="sr-only peer"
                                                        checked={tempOverrides.whatsapp_chat === true}
                                                        onChange={(e) => setTempOverrides({ ...tempOverrides, whatsapp_chat: e.target.checked })}
                                                    />
                                                    <div className="w-11 h-6 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 dark:after:border-slate-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                                                </div>
                                            </label>

                                            <label className="flex items-start justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                                <div className="pr-4">
                                                    <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">📱 Chat Directo (Botón WhatsApp)</p>
                                                    <p className="text-xs text-slate-500">Permite usar los botones de contacto directo por WhatsApp en el Directorio y Modales.</p>
                                                </div>
                                                <div className="relative inline-flex items-center cursor-pointer mt-1 shrink-0">
                                                    <input
                                                        type="checkbox"
                                                        className="sr-only peer"
                                                        checked={tempOverrides.canSendWhatsapp === true}
                                                        onChange={(e) => setTempOverrides({ ...tempOverrides, canSendWhatsapp: e.target.checked })}
                                                    />
                                                    <div className="w-11 h-6 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 dark:after:border-slate-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                                                </div>
                                            </label>

                                            <label className="flex items-start justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                                <div className="pr-4">
                                                    <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">🤖 Analítica Predictiva (IA)</p>
                                                    <p className="text-xs text-slate-500">Habilita la tarjeta de "Insight Predictivo" de demanda algorítmica y proyecciones.</p>
                                                </div>
                                                <div className="relative inline-flex items-center cursor-pointer mt-1 shrink-0">
                                                    <input
                                                        type="checkbox"
                                                        className="sr-only peer"
                                                        checked={tempOverrides.canUsePredictiveAI === true}
                                                        onChange={(e) => setTempOverrides({ ...tempOverrides, canUsePredictiveAI: e.target.checked })}
                                                    />
                                                    <div className="w-11 h-6 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 dark:after:border-slate-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                                                </div>
                                            </label>

                                            <label className="flex items-start justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                                <div className="pr-4">
                                                    <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">📊 Exportación de Datos (CSV)</p>
                                                    <p className="text-xs text-slate-500">Permite descargar la base de datos de Clientes y Reportes a formato Excel/CSV.</p>
                                                </div>
                                                <div className="relative inline-flex items-center cursor-pointer mt-1 shrink-0">
                                                    <input
                                                        type="checkbox"
                                                        className="sr-only peer"
                                                        checked={tempOverrides.canExportData === true}
                                                        onChange={(e) => setTempOverrides({ ...tempOverrides, canExportData: e.target.checked })}
                                                    />
                                                    <div className="w-11 h-6 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 dark:after:border-slate-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                                                </div>
                                            </label>

                                            <label className="flex items-start justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                                <div className="pr-4">
                                                    <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">📆 Agenda Gráfica de Calendario</p>
                                                    <p className="text-xs text-slate-500">Acceso a la nueva vista de calendario visual e interactivo para organizar reservas.</p>
                                                </div>
                                                <div className="relative inline-flex items-center cursor-pointer mt-1 shrink-0">
                                                    <input
                                                        type="checkbox"
                                                        className="sr-only peer"
                                                        checked={tempOverrides.canViewCalendar === true}
                                                        onChange={(e) => setTempOverrides({ ...tempOverrides, canViewCalendar: e.target.checked })}
                                                    />
                                                    <div className="w-11 h-6 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 dark:after:border-slate-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                                                </div>
                                            </label>

                                            <label className="flex items-start justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                                <div className="pr-4">
                                                    <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">💰 Precios Dinámicos Avanzados</p>
                                                    <p className="text-xs text-slate-500">Habilita la configuración de tarifas segmentadas y mandatos de % de adelanto obligatorio.</p>
                                                </div>
                                                <div className="relative inline-flex items-center cursor-pointer mt-1 shrink-0">
                                                    <input
                                                        type="checkbox"
                                                        className="sr-only peer"
                                                        checked={tempOverrides.canSetAdvancedPricing === true}
                                                        onChange={(e) => setTempOverrides({ ...tempOverrides, canSetAdvancedPricing: e.target.checked })}
                                                    />
                                                    <div className="w-11 h-6 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 dark:after:border-slate-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                                                </div>
                                            </label>
                                        </div>

                                        <div className="mt-8 flex gap-3">
                                            <button
                                                onClick={() => setManagePermissionsTenant(null)}
                                                className="flex-1 py-3 text-slate-600 dark:text-slate-400 font-bold bg-slate-100 dark:text-slate-300/80 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors text-sm"
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                onClick={handleSavePermissions}
                                                disabled={overridesLoading}
                                                className="flex-1 bg-accent text-slate-950 py-3 rounded-xl font-black flex items-center justify-center gap-2 hover:bg-accent/90 transition-all text-sm disabled:opacity-50"
                                            >
                                                {overridesLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                                Guardar Reglas
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    }
                </div >
            )
            }

            {
                activeTab === "PLANS" && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <PlansManagementTab plans={plansData} onPlanUpdate={fetchPlans} loading={plansLoading} />
                    </div>
                )
            }

            {activeTab === "AUDIT" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex justify-between items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                                <ClipboardList className="w-5 h-5 text-accent" />
                                Registro de Auditoría
                            </h2>
                            <p className="text-sm text-slate-400 dark:text-slate-500 dark:text-slate-400">
                                Monitorea las acciones críticas del sistema, como creación de cuentas y cambios en suscripciones.
                            </p>
                        </div>
                        <button
                            onClick={fetchAuditLogs}
                            className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                        >
                            Refrescar
                        </button>
                    </div>

                    <div className="bg-slate-100/50 dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-white/5 overflow-hidden backdrop-blur-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-200 dark:border-white/10 text-xs uppercase tracking-widest text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-950/50">
                                        <th className="px-6 py-4 font-bold">Fecha / Hora</th>
                                        <th className="px-6 py-4 font-bold">Acción</th>
                                        <th className="px-6 py-4 font-bold">Entidad Afectada</th>
                                        <th className="px-6 py-4 font-bold">Responsable</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {auditLoading ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900">
                                                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                                                Cargando registros...
                                            </td>
                                        </tr>
                                    ) : auditLogs.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900">
                                                No hay registros de auditoría disponibles.
                                            </td>
                                        </tr>
                                    ) : (
                                        auditLogs.map((log: any) => (
                                            <tr key={log.id} className="border-b border-slate-200 dark:border-white/5 hover:bg-slate-800/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <span className="text-sm font-medium text-slate-900 dark:text-white block">
                                                        {new Date(log.createdAt).toLocaleDateString('es-PE')}
                                                    </span>
                                                    <span className="text-xs text-slate-400 dark:text-slate-500 dark:text-slate-400">
                                                        {new Date(log.createdAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="px-2.5 py-1 rounded-full text-[10px] uppercase font-black tracking-widest bg-accent/10 text-accent border border-accent/20 break-words line-clamp-1 max-w-[200px]" title={log.action}>
                                                        {log.action}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                        {log.entityType} <span className="text-xs text-slate-400 dark:text-slate-500 font-mono block">({log.entityId.slice(0, 8)}...)</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm font-mono text-slate-400 dark:text-slate-500 dark:text-slate-400 max-w-[200px] truncate">
                                                    {log.userId || "Sistema"}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function SuperAdminDashboard() {
    return (
        <Suspense fallback={
            <div className="flex justify-center items-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-accent" />
            </div>
        }>
            <SuperAdminDashboardContent />
        </Suspense>
    );
}

// ─── Modals Components ───────────────────────────────────────────────────────

function TenantDetailModal({ tenant, onClose, onEdit }: { tenant: Tenant, onClose: () => void, onEdit: () => void }) {
    const [stats, setStats] = useState<any>(null);
    const [details, setDetails] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'VENUES' | 'ACTIVITY'>('OVERVIEW');

    useEffect(() => {
        Promise.all([
            api.get(`/users/tenants/${tenant.id}/stats`),
            api.get(`/users/tenants/${tenant.id}`)
        ])
            .then(([resStats, resDetails]) => {
                setStats(resStats.data);
                setDetails(resDetails.data);
            })
            .catch(err => console.error("Error fetching stats/details", err))
            .finally(() => setLoading(false));
    }, [tenant.id]);

    const overrides = details?.featureOverrides || {};

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl w-full max-w-3xl relative z-10 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                
                {/* HEADER */}
                <div className="p-6 border-b border-slate-200 dark:border-white/10 flex justify-between items-start bg-slate-100 dark:bg-white/5 shrink-0">
                    <div className="flex gap-4 items-center">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl font-black shadow-lg">
                            {tenant.name ? tenant.name.substring(0, 2).toUpperCase() : 'US'}
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{tenant.name || 'Sin nombre'}</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{tenant.email}</p>
                            {details?.createdAt && (
                                <p className="text-[10px] uppercase tracking-wider text-slate-400 mt-1 font-bold">
                                    Miembro desde: {new Date(details.createdAt).toLocaleDateString('es-PE', { month: 'long', year: 'numeric' })}
                                </p>
                            )}
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-200/50 dark:bg-slate-800 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* TABS */}
                <div className="flex border-b border-slate-200 dark:border-white/10 px-6 shrink-0 bg-slate-50 dark:bg-slate-950">
                    {[
                        { id: 'OVERVIEW', label: 'Resumen' },
                        { id: 'VENUES', label: 'Sedes Comerciales' },
                        { id: 'ACTIVITY', label: 'Actividad Reciente' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`px-5 py-3.5 text-sm font-bold border-b-2 transition-colors ${activeTab === tab.id 
                                ? 'border-accent text-accent' 
                                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* CONTENT AREA */}
                <div className="p-6 overflow-y-auto bg-white dark:bg-slate-900 flex-1">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                            <Loader2 className="w-8 h-8 animate-spin mb-3 text-accent" />
                            <span className="text-sm font-medium">Cargando radiografía del cliente...</span>
                        </div>
                    ) : activeTab === 'OVERVIEW' ? (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            
                            {/* Suscripcion y Estado */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl p-5 border border-slate-200 dark:border-white/5">
                                    <p className="text-[10px] uppercase tracking-widest text-slate-500 font-black mb-2">Plan Suscrito</p>
                                    <span className="px-3 py-1.5 rounded-lg text-xs uppercase font-black tracking-widest bg-accent text-slate-950 shadow-[0_0_15px_rgba(56,189,248,0.3)]">
                                        {PLAN_LABELS[tenant.plan] ?? tenant.plan}
                                    </span>
                                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-white/5">
                                        <p className="text-[10px] uppercase tracking-widest text-slate-500 font-black mb-1">Vencimiento</p>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-slate-400" />
                                            {tenant.subscriptionEndsAt
                                                ? new Date(tenant.subscriptionEndsAt).toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' })
                                                : 'Ilimitado (Lifetime)'}
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl p-5 border border-slate-200 dark:border-white/5">
                                    <p className="text-[10px] uppercase tracking-widest text-slate-500 font-black mb-2">Estado Activo</p>
                                    {(() => {
                                        const isExpired = tenant.subscriptionEndsAt && new Date(tenant.subscriptionEndsAt) <= new Date();
                                        let statusText = 'Operativo'; let bg = 'bg-emerald-500/10 text-emerald-500'; let dot = 'bg-emerald-500';
                                        
                                        if (!tenant.isActive) { statusText = 'Suspendido Manual'; bg = 'bg-red-500/10 text-red-500'; dot = 'bg-red-500'; }
                                        else if (isExpired) { statusText = 'Pago Vencido (Corte)'; bg = 'bg-orange-500/10 text-orange-500'; dot = 'bg-orange-500'; }

                                        return (
                                            <div className={`w-fit px-3 py-1.5 rounded-lg text-sm font-black flex items-center gap-2 ${bg}`}>
                                                <span className={`w-2 h-2 rounded-full animate-pulse ${dot}`} />
                                                {statusText}
                                            </div>
                                        );
                                    })()}
                                    
                                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-white/5">
                                         <p className="text-[10px] uppercase tracking-widest text-slate-500 font-black mb-1">Última Actualización</p>
                                         <p className="text-xs font-medium text-slate-500">
                                            {details?.updatedAt ? new Date(details.updatedAt).toLocaleString('es-PE') : '-'}
                                         </p>
                                    </div>
                                </div>
                            </div>

                            {/* Metricas Rapidas */}
                            {stats && (
                                <div className="grid grid-cols-4 gap-3">
                                    {[
                                        { label: "Sedes", val: stats.venues },
                                        { label: "Canchas", val: stats.fields },
                                        { label: "Reservas", val: stats.bookings },
                                        { label: "Clientes", val: stats.clients }
                                    ].map(m => (
                                        <div key={m.label} className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-xl p-3 text-center">
                                            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-black">{m.label}</p>
                                            <p className="text-xl font-black text-slate-900 dark:text-white mt-1">{m.val}</p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Overrides / Permisos Excepcionales */}
                            <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-2xl p-5">
                                <p className="text-xs uppercase tracking-widest text-indigo-500 dark:text-indigo-400 font-black mb-3 flex items-center gap-2">
                                    <BrainCircuit className="w-4 h-4" /> Beneficios Excepcionales Activos (Overrides)
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {Object.keys(overrides).length > 0 && Object.values(overrides).some(v => v === true) ? (
                                        Object.entries(overrides).map(([key, value]) => {
                                            if (value) {
                                                return (
                                                    <span key={key} className="px-2.5 py-1 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-md text-[10px] font-black uppercase tracking-wider border border-indigo-500/20 shadow-sm">
                                                        {key.replace('can', '')}
                                                    </span>
                                                );
                                            }
                                            return null;
                                        })
                                    ) : (
                                        <p className="text-sm text-slate-500 italic">No hay excepciones configuradas. Se rige estrictamente por su Plan.</p>
                                    )}
                                </div>
                            </div>

                        </div>
                    ) : activeTab === 'VENUES' ? (
                        <div className="space-y-4 animate-in fade-in duration-300">
                            {details?.venues?.length > 0 ? details.venues.map((v: any, idx: number) => (
                                <div key={v.id} className="glass p-4 rounded-2xl flex items-center gap-4 border border-slate-200 dark:border-white/10 hover:border-accent/40 transition-colors">
                                    <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                                        <span className="font-black text-slate-400">{idx + 1}</span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-black text-slate-900 dark:text-white text-lg">{v.name}</p>
                                        <p className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
                                            <MapPin className="w-3.5 h-3.5" /> {v.address || "Sin dirección"}
                                        </p>
                                    </div>
                                    <div className="text-center px-4">
                                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Canchas</p>
                                        <p className="text-xl font-black text-accent">{v._count?.fields || 0}</p>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-10 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/5">
                                    <MapPin className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                                    <p className="text-slate-500 font-medium text-sm">Este cliente aún no ha creado ninguna Sede.</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4 animate-in fade-in duration-300">
                            <p className="text-xs text-slate-500 uppercase tracking-widest font-black mb-4">Últimas 5 Reservas en Canchas de este Cliente</p>
                            {details?.bookings?.length > 0 ? details.bookings.map((b: any) => (
                                <div key={b.id} className="flex justify-between items-center p-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-2xl">
                                    <div>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white">ID: {b.id.substring(0,8)}...</p>
                                        <p className="text-xs text-slate-500 mt-1">{new Date(b.createdAt).toLocaleString('es-PE')}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-xs font-black uppercase tracking-widest px-2 py-1 rounded-md mb-1 inline-block ${
                                            b.status === 'CONFIRMED' ? 'bg-emerald-500/10 text-emerald-500' : 
                                            b.status === 'CANCELLED' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'
                                        }`}>
                                            {b.status}
                                        </p>
                                        <p className="text-lg font-black text-slate-900 dark:text-white block">S/ {b.totalPrice}</p>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-10 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/5">
                                    <Calendar className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                                    <p className="text-slate-500 font-medium text-sm">Aún no registran transacciones operativas.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* FOOTER ACTIONS */}
                <div className="p-5 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-200 dark:border-white/10 flex justify-end gap-3 rounded-b-3xl shrink-0">
                    <button onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors">
                        Volver
                    </button>
                    <button onClick={onEdit} className="px-6 py-2.5 bg-accent hover:bg-accent/90 text-slate-950 font-black rounded-xl transition-all shadow-[0_0_20px_rgba(56,189,248,0.2)] hover:scale-105 active:scale-95 flex items-center gap-2">
                        <Edit2 className="w-4 h-4" />
                        Ajustar Membresía / Plan
                    </button>
                </div>
            </div>
        </div>
    );
}

function TenantEditModal({ tenant, onClose, onSaved }: { tenant: Tenant, onClose: () => void, onSaved: (data: any) => void }) {
    const [plan, setPlan] = useState(tenant.plan);
    const [isActive, setIsActive] = useState(tenant.isActive);
    const [addDays, setAddDays] = useState<number | "">("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const body: any = { plan, isActive };
            if (addDays && Number(addDays) > 0) {
                body.extendDays = Number(addDays);
            }
            const { data } = await api.patch(`/users/tenants/${tenant.id}/subscription`, body);
            onSaved(data);
        } catch (err: any) {
            console.error("Error saving tenant", err);
            setError(err.response?.data?.message || "Ocurrió un error al actualizar el cliente");
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl w-full max-w-lg relative z-10 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-slate-100 dark:bg-white/5">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Editar Suscripción</h2>
                    <button onClick={onClose} className="p-2 text-slate-400 dark:text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <form onSubmit={handleSave}>
                    <div className="p-6 space-y-6">
                        <div className="bg-slate-50/50 dark:bg-slate-950/50 p-4 rounded-xl border border-slate-200 dark:border-white/5 flex flex-col items-center text-center">
                            <span className="text-lg font-bold text-slate-900 dark:text-white">{tenant.name || tenant.email}</span>
                            <span className="text-xs text-slate-400 dark:text-slate-500 dark:text-slate-400">ID: {tenant.id}</span>
                        </div>

                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm flex gap-2">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold mb-2">Plan Actual</label>
                                <select
                                    value={plan}
                                    onChange={e => setPlan(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl py-3 px-4 text-slate-900 dark:text-white focus:outline-none focus:border-accent"
                                >
                                    <option value="FREE_TRIAL">Prueba Gratuita</option>
                                    <option value="BASIC">Plan Básico</option>
                                    <option value="PRO">Plan Pro</option>
                                    <option value="ENTERPRISE">Plan Enterprise</option>
                                </select>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl cursor-pointer" onClick={() => setIsActive(!isActive)}>
                                <div>
                                    <p className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                                        Estado de la cuenta
                                        {isActive && tenant.subscriptionEndsAt && new Date(tenant.subscriptionEndsAt) <= new Date() && (
                                            <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                                Expirado
                                            </span>
                                        )}
                                    </p>
                                    <p className="text-xs text-slate-400 dark:text-slate-500 dark:text-slate-400 mt-1">
                                        {isActive 
                                            ? (tenant.subscriptionEndsAt && new Date(tenant.subscriptionEndsAt) <= new Date() 
                                                ? 'El flag está activo, pero al figurar como expirado no tendrá acceso.'
                                                : 'La cuenta está activa visualizando canchas.') 
                                            : 'Cuenta suspendida, sin acceso.'}
                                    </p>
                                </div>
                                <div className={`w-11 h-6 rounded-full flex items-center p-1 transition-colors duration-300 ${isActive ? 'bg-green-500' : 'bg-slate-700'}`}>
                                    <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-300 ${isActive ? 'translate-x-5' : 'translate-x-0'}`} />
                                </div>
                            </div>

                            <div className="p-4 bg-accent/5 border border-accent/20 rounded-xl">
                                <label className="block border-b border-accent/10 pb-2 mb-3">
                                    <p className="text-xs uppercase tracking-wider text-accent font-bold">Extender Suscripción</p>
                                    <p className="text-xs text-slate-400 dark:text-slate-500 dark:text-slate-400 mt-1">Añade días extra al vencimiento actual de forma manual.</p>
                                </label>
                                <div className="flex gap-3">
                                    <div className="relative flex-1">
                                        <Calendar className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                                        <input
                                            type="number"
                                            min="1"
                                            value={addDays}
                                            onChange={e => setAddDays(e.target.value ? Number(e.target.value) : "")}
                                            placeholder="Ej. +30"
                                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl py-2 pl-10 pr-4 text-slate-900 dark:text-white focus:outline-none focus:border-accent"
                                        />
                                    </div>
                                    <div className="flex items-center text-sm text-slate-400 dark:text-slate-500 dark:text-slate-400 shrink-0">
                                        días extra
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-white/10 flex justify-end gap-3 rounded-b-3xl">
                        <button type="button" onClick={onClose} disabled={loading} className="px-5 py-2.5 text-sm font-semibold text-slate-400 dark:text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white transition-colors disabled:opacity-50">
                            Cancelar
                        </button>
                        <button type="submit" disabled={loading} className="px-5 py-2.5 bg-accent hover:bg-accent/90 text-slate-950 font-bold rounded-xl transition-all flex items-center gap-2 disabled:opacity-50">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Guardar Cambios
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── LiveCountdown (Solo días y hrs en tabla, o extendido) ───────────────────
function LiveCountdown({ targetDate, compact = false }: { targetDate: string, compact?: boolean }) {
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
        return null; // El parent superior decide renderizar "Expirado"
    }

    if (compact) {
        return (
            <span>Quedan {timeLeft.days}d {timeLeft.hours}h</span>
        );
    }

    const units = [
        { value: timeLeft.days, label: 'D' },
        { value: timeLeft.hours, label: 'H' },
        { value: timeLeft.minutes, label: 'M' },
        { value: timeLeft.seconds, label: 'S' },
    ];

    return (
        <div className="flex gap-1 items-center">
            {units.map((u, i) => (
                <div key={u.label} className="bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded text-[10px] font-mono border border-slate-200 dark:border-white/5">
                    {String(u.value).padStart(2, '0')}{u.label}
                </div>
            ))}
        </div>
    );
}

// ─── Create Tenant Modal ─────────────────────────────────────────────────────

function CreateTenantModal({ onClose, onCreated }: { onClose: () => void, onCreated: (t: any) => void }) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [passwordStr, setPassword] = useState("");
    const [plan, setPlan] = useState("FREE_TRIAL");
    const [subscriptionEndsAt, setSubscriptionEndsAt] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const generatePassword = () => {
        const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
        let pass = "";
        for (let i = 0; i < 12; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));
        setPassword(pass);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const body = {
                name,
                email,
                passwordStr,
                plan,
                subscriptionEndsAt: subscriptionEndsAt ? new Date(subscriptionEndsAt).toISOString() : null
            };
            const { data } = await api.post(`/users/tenants/manual`, body);
            onCreated(data);
        } catch (err: any) {
            console.error("Error creating tenant", err);
            setError(err.response?.data?.message || "Ocurrió un error al crear la cuenta");
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl w-full max-w-lg relative z-10 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-slate-100 dark:bg-white/5">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Plus className="w-5 h-5 text-accent" />
                        Crear Cliente Manual
                    </h2>
                    <button type="button" onClick={onClose} className="p-2 text-slate-400 dark:text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <form onSubmit={handleSave} className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm flex gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-xs uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold mb-1.5">Empresa / Contacto</label>
                        <input
                            required type="text" value={name} onChange={e => setName(e.target.value)}
                            placeholder="Ej. Canchas El Golazo"
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl py-2.5 px-4 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-accent"
                        />
                    </div>

                    <div>
                        <label className="block text-xs uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold mb-1.5">Correo Electrónico (Login)</label>
                        <input
                            required type="email" value={email} onChange={e => setEmail(e.target.value)}
                            placeholder="correo@ejemplo.com"
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl py-2.5 px-4 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-accent"
                        />
                    </div>

                    <div>
                        <label className="block text-xs uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold mb-1.5">Contraseña Inicial</label>
                        <div className="flex gap-2">
                            <input
                                required type="text" value={passwordStr} onChange={e => setPassword(e.target.value)}
                                placeholder="Escribe o genera una..."
                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl py-2.5 px-4 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-accent font-mono"
                            />
                            <button type="button" onClick={generatePassword} title="Generar Contraseña Segura" className="px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-slate-700 dark:text-slate-300 transition-colors border border-slate-200 dark:border-white/5 disabled:opacity-50">
                                <Key className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold mb-1.5">Plan Asignado</label>
                            <select
                                value={plan} onChange={e => setPlan(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl py-2.5 px-4 text-slate-900 dark:text-white focus:outline-none focus:border-accent"
                            >
                                <option value="FREE_TRIAL">Prueba Gratuita</option>
                                <option value="BASIC">Plan Básico</option>
                                <option value="PRO">Plan Pro</option>
                                <option value="ENTERPRISE">Plan Enterprise</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold mb-1.5">Fecha Vencimiento</label>
                            <input
                                type="date" value={subscriptionEndsAt} onChange={e => setSubscriptionEndsAt(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl py-2.5 px-4 text-slate-900 dark:text-white focus:outline-none focus:border-accent text-sm"
                            />
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Opcional. Vacío = Ilimitado.</p>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3 mt-2 border-t border-slate-200 dark:border-white/5">
                        <button type="button" onClick={onClose} disabled={loading} className="px-5 py-2.5 text-sm font-semibold text-slate-400 dark:text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white transition-colors disabled:opacity-50">
                            Cancelar
                        </button>
                        <button type="submit" disabled={loading} className="px-5 py-2.5 bg-accent hover:bg-accent/90 text-slate-950 font-bold rounded-xl transition-all flex items-center gap-2 disabled:opacity-50">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Crear Cliente
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Plans Management Tab ────────────────────────────────────────────────────────

function PlansManagementTab({ plans, onPlanUpdate, loading }: { plans: any[], onPlanUpdate: () => void, loading: boolean }) {
    const [editingPlan, setEditingPlan] = useState<any>(null);
    const [isCreating, setIsCreating] = useState(false);

    if (loading) return <div className="text-center py-10 text-slate-400 dark:text-slate-500 dark:text-slate-400">Cargando planes...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-slate-100/50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-white/5">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Estrategia de Precios (B2B)</h2>
                    <p className="text-sm text-slate-400 dark:text-slate-500 dark:text-slate-400">Configura los límites y precios de los planes disponibles comercialmente.</p>
                </div>
                <button
                    onClick={() => setIsCreating(true)}
                    className="bg-accent hover:bg-accent/90 text-slate-950 font-bold rounded-xl py-2 px-4 focus:outline-none transition-colors flex items-center gap-2 h-[38px] shadow-[0_0_15px_rgba(56,189,248,0.2)]"
                >
                    <Plus className="w-4 h-4" />
                    Nuevo Plan
                </button>
            </div>

            {plans.length === 0 ? (
                <div className="text-center py-12 bg-slate-100/50 dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-white/5">
                    <AlertCircle className="w-12 h-12 text-slate-400 dark:text-slate-500 mx-auto mb-3" />
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">No hay planes configurados</h3>
                    <p className="text-slate-400 dark:text-slate-500 dark:text-slate-400 text-sm mb-4">Crea tu primer plan comercial para que los clientes puedan suscribirse.</p>
                    <button
                        onClick={() => setIsCreating(true)}
                        className="bg-accent text-slate-950 font-bold rounded-xl py-2 px-6 focus:outline-none transition-colors"
                    >
                        Crear Primer Plan
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    {plans.map((plan) => (
                        <div key={plan.id} className="glass border border-slate-200 dark:border-white/10 rounded-3xl p-6 relative flex flex-col transition-all hover:border-accent/50 group">
                            {!plan.isActive && (
                                <div className="absolute top-4 right-4 bg-red-500/20 text-red-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-500/20">
                                    Inactivo
                                </div>
                            )}
                            {plan.isPopular && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-accent to-sky-400 text-slate-950 text-[10px] font-bold px-3 py-1 rounded-full whitespace-nowrap shadow-[0_0_15px_rgba(56,189,248,0.3)]">
                                    MÁS POPULAR
                                </div>
                            )}
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{plan.name}</h3>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mb-2 uppercase">Código: {plan.code}</p>
                            <p className="text-xs text-slate-400 dark:text-slate-500 dark:text-slate-400 mb-6 min-h-[32px]">{plan.description}</p>

                            <div className="mb-6 flex items-baseline gap-1">
                                <span className="text-slate-400 dark:text-slate-500 dark:text-slate-400 font-medium">S/</span>
                                <span className="text-4xl font-extrabold text-slate-900 dark:text-white">{plan.priceMensual}</span>
                                <span className="text-slate-400 dark:text-slate-500 text-sm">/mes</span>
                            </div>

                            <div className="space-y-3 flex-1 mb-6">
                                <div className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                                    <Check className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                                    <span>Hasta <strong>{plan.limitVenues}</strong> Complejos (Sedes)</span>
                                </div>
                                <div className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                                    <Check className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                                    <span>Hasta <strong>{plan.limitFields}</strong> Canchas Totales</span>
                                </div>
                            </div>

                            <button
                                onClick={() => setEditingPlan(plan)}
                                className="w-full py-2.5 rounded-xl border-2 border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:bg-slate-800 hover:text-slate-900 dark:text-white transition-colors flex items-center justify-center gap-2 group-hover:border-accent/40 group-hover:bg-accent/10 group-hover:text-accent"
                            >
                                <Edit2 className="w-4 h-4" /> Editar Plan
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {(editingPlan || isCreating) && (
                <PlanFormModal
                    plan={editingPlan}
                    onClose={() => { setEditingPlan(null); setIsCreating(false); }}
                    onUpdated={() => { setEditingPlan(null); setIsCreating(false); onPlanUpdate(); }}
                />
            )}
        </div>
    );
}

// ─── Plan Form Modal ──────────────────────────────────────────────────

function PlanFormModal({ plan, onClose, onUpdated }: { plan?: any, onClose: () => void, onUpdated: () => void }) {
    const isEditing = !!plan;
    const [formData, setFormData] = useState({
        code: plan?.code || "",
        name: plan?.name || "",
        description: plan?.description || "",
        priceMensual: plan?.priceMensual || 0,
        priceAnual: plan?.priceAnual || 0,
        limitVenues: plan?.limitVenues || 1,
        limitFields: plan?.limitFields || 1,
        isActive: plan?.isActive !== undefined ? plan.isActive : true,
        isPopular: plan?.isPopular || false,
        icon: plan?.icon || "Star",
        accent: plan?.accent || "#38bdf8",
        accentLight: plan?.accentLight || "#7dd3fc",
    });

    // Dynamic Fields Arrays
    const [features, setFeatures] = useState<string[]>(plan?.features || []);

    // JSON Permissions
    const [permissions, setPermissions] = useState(plan?.permissions || {
        canUseAI: false,
        canExportExcel: false,
        hasCustomDomain: false,
        hasWhatsAppAlerts: false,
        isMultiUser: false,
        whatsapp_chat: false,
        canSendWhatsapp: false,
        canUsePredictiveAI: false,
        canExportData: false,
        canViewCalendar: false,
        canSetAdvancedPricing: false
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                ...formData,
                priceMensual: Number(formData.priceMensual),
                priceAnual: Number(formData.priceAnual),
                limitVenues: Number(formData.limitVenues),
                limitFields: Number(formData.limitFields),
                features: features.filter(f => f.trim() !== ""),
                permissions
            };

            if (isEditing) {
                await api.patch(`/plans/${plan.id}`, payload);
            } else {
                await api.post(`/plans`, payload);
            }
            onUpdated();
        } catch (error: any) {
            console.error(error);
            alert(error.response?.data?.message || "Error al guardar el plan");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl w-full max-w-lg relative z-10 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-slate-100 dark:bg-white/5 shrink-0">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        {isEditing ? <Edit2 className="w-5 h-5 text-accent" /> : <Plus className="w-5 h-5 text-accent" />}
                        {isEditing ? `Editar Plan: ${plan.code}` : "Construir Nuevo Plan"}
                    </h2>
                    <button type="button" onClick={onClose} className="p-2 text-slate-400 dark:text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="overflow-y-auto p-6">
                    <form id="edit-plan-form" onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-xs uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold mb-1.5">Nombre Comercial</label>
                                <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl py-2 px-3 text-slate-900 dark:text-white focus:border-accent outline-none" />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-xs uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold mb-1.5">Descripción (Pública)</label>
                                <textarea required value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl py-2 px-3 text-slate-900 dark:text-white focus:border-accent outline-none resize-none h-20" />
                            </div>

                            <div>
                                <label className="block text-xs uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold mb-1.5">Precio Mensual (S/)</label>
                                <input required type="number" min="0" step="0.01" value={formData.priceMensual} onChange={e => setFormData({ ...formData, priceMensual: Number(e.target.value) })}
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl py-2 px-3 text-slate-900 dark:text-white focus:border-accent outline-none font-mono" />
                            </div>
                            <div>
                                <label className="block text-xs uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold mb-1.5">Precio Anual (S/)</label>
                                <input required type="number" min="0" step="0.01" value={formData.priceAnual} onChange={e => setFormData({ ...formData, priceAnual: Number(e.target.value) })}
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl py-2 px-3 text-slate-900 dark:text-white focus:border-accent outline-none font-mono" />
                            </div>

                            <div>
                                <label className="block text-xs uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold mb-1.5">Límite Sedes</label>
                                <input required type="number" min="1" value={formData.limitVenues} onChange={e => setFormData({ ...formData, limitVenues: Number(e.target.value) })}
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl py-2 px-3 text-slate-900 dark:text-white focus:border-accent outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold mb-1.5">Límite Canchas</label>
                                <input required type="number" min="1" value={formData.limitFields} onChange={e => setFormData({ ...formData, limitFields: Number(e.target.value) })}
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl py-2 px-3 text-slate-900 dark:text-white focus:border-accent outline-none" />
                            </div>

                            <div className="flex items-center gap-3 col-span-2 pt-2 pb-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={formData.isActive} onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                                        className="w-4 h-4 rounded border-white/20 bg-white dark:bg-slate-900 text-accent focus:ring-accent focus:ring-offset-slate-900" />
                                    <span className="text-sm font-medium text-slate-900 dark:text-white">Plan Activo (Disponible para compra)</span>
                                </label>
                            </div>
                            <div className="flex items-center gap-3 col-span-2 pb-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={formData.isPopular} onChange={e => setFormData({ ...formData, isPopular: e.target.checked })}
                                        className="w-4 h-4 rounded border-white/20 bg-white dark:bg-slate-900 text-accent focus:ring-accent focus:ring-offset-slate-900" />
                                    <span className="text-sm font-medium text-slate-900 dark:text-white">Destacar como "Más Popular"</span>
                                </label>
                            </div>

                            {/* MARKETING VISUALS */}
                            <div className="col-span-2 pt-4 border-t border-slate-200 dark:border-white/10 mt-2">
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Diseño Visual de la Tarjeta</h3>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold mb-1.5">Icono (Lucide)</label>
                                        <input type="text" value={formData.icon} onChange={e => setFormData({ ...formData, icon: e.target.value })}
                                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl py-2 px-3 text-slate-900 dark:text-white focus:border-accent outline-none" placeholder="Ej. Star, Zap" />
                                    </div>
                                    <div>
                                        <label className="block text-xs uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold mb-1.5">Color Oscuro</label>
                                        <div className="flex gap-2">
                                            <input type="color" value={formData.accent} onChange={e => setFormData({ ...formData, accent: e.target.value })} className="w-10 h-10 p-0 border-0 rounded-xl bg-transparent flex-shrink-0" />
                                            <input type="text" value={formData.accent} onChange={e => setFormData({ ...formData, accent: e.target.value })}
                                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl py-2 px-3 text-slate-900 dark:text-white focus:border-accent outline-none text-xs" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold mb-1.5">Color Claro</label>
                                        <div className="flex gap-2">
                                            <input type="color" value={formData.accentLight} onChange={e => setFormData({ ...formData, accentLight: e.target.value })} className="w-10 h-10 p-0 border-0 rounded-xl bg-transparent flex-shrink-0" />
                                            <input type="text" value={formData.accentLight} onChange={e => setFormData({ ...formData, accentLight: e.target.value })}
                                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl py-2 px-3 text-slate-900 dark:text-white focus:border-accent outline-none text-xs" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* FEATURES BUILDER */}
                            <div className="col-span-2 pt-4 border-t border-slate-200 dark:border-white/10 mt-2">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Lista de Beneficios (Viñetas)</h3>
                                    <button type="button" onClick={() => setFeatures([...features, ""])} className="text-xs font-bold text-accent bg-accent/10 hover:bg-accent/20 px-2 py-1 rounded">
                                        + Añadir Viñeta
                                    </button>
                                </div>
                                <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                                    {features.map((feature, i) => (
                                        <div key={i} className="flex gap-2">
                                            <input type="text" required value={feature} onChange={e => {
                                                const newFeatures = [...features];
                                                newFeatures[i] = e.target.value;
                                                setFeatures(newFeatures);
                                            }}
                                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl py-2 px-3 text-slate-900 dark:text-white focus:border-accent outline-none text-sm" placeholder="Ej. Canchas ilimitadas" />
                                            <button type="button" onClick={() => setFeatures(features.filter((_, idx) => idx !== i))} className="p-2 text-red-400 hover:bg-red-400/10 rounded-xl transition-colors">
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                    {features.length === 0 && <p className="text-xs text-slate-400 dark:text-slate-500 italic">No hay beneficios agregados. Haz clic en "Añadir Viñeta".</p>}
                                </div>
                            </div>

                            {/* PERMISSIONS (FEATURE FLAGS) */}
                            <div className="col-span-2 pt-4 border-t border-slate-200 dark:border-white/10 mt-2">
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Funciones Perfiladas (Switches)</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 p-3 rounded-xl">
                                        <input type="checkbox" checked={permissions.canUseAI} onChange={e => setPermissions({ ...permissions, canUseAI: e.target.checked })}
                                            className="w-4 h-4 rounded text-accent" />
                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Inteligencia Artificial (IA)</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 p-3 rounded-xl">
                                        <input type="checkbox" checked={permissions.canExportExcel} onChange={e => setPermissions({ ...permissions, canExportExcel: e.target.checked })}
                                            className="w-4 h-4 rounded text-accent" />
                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Reportes Financieros / Excel</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 p-3 rounded-xl">
                                        <input type="checkbox" checked={permissions.isMultiUser} onChange={e => setPermissions({ ...permissions, isMultiUser: e.target.checked })}
                                            className="w-4 h-4 rounded text-accent" />
                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Staff / Múltiples Usuarios</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 p-3 rounded-xl">
                                        <input type="checkbox" checked={permissions.hasWhatsAppAlerts} onChange={e => setPermissions({ ...permissions, hasWhatsAppAlerts: e.target.checked })}
                                            className="w-4 h-4 rounded text-accent" />
                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Alertas WhatsApp Automáticas</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 p-3 rounded-xl">
                                        <input type="checkbox" checked={permissions.hasCustomDomain} onChange={e => setPermissions({ ...permissions, hasCustomDomain: e.target.checked })}
                                            className="w-4 h-4 rounded text-accent" />
                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Marca Blanca (White-labeling)</span>
                                    </label>
                                    
                                    {/* Nuevas Funciones para igualar Overrides */}
                                    <label className="flex items-center gap-2 cursor-pointer bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 p-3 rounded-xl">
                                        <input type="checkbox" checked={permissions.whatsapp_chat} onChange={e => setPermissions({ ...permissions, whatsapp_chat: e.target.checked })}
                                            className="w-4 h-4 rounded text-accent" />
                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Bot IA (WhatsApp)</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 p-3 rounded-xl">
                                        <input type="checkbox" checked={permissions.canSendWhatsapp} onChange={e => setPermissions({ ...permissions, canSendWhatsapp: e.target.checked })}
                                            className="w-4 h-4 rounded text-accent" />
                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Contacto Directo WA</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 p-3 rounded-xl">
                                        <input type="checkbox" checked={permissions.canUsePredictiveAI} onChange={e => setPermissions({ ...permissions, canUsePredictiveAI: e.target.checked })}
                                            className="w-4 h-4 rounded text-accent" />
                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Predictiva (IA) Avanzada</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 p-3 rounded-xl">
                                        <input type="checkbox" checked={permissions.canExportData} onChange={e => setPermissions({ ...permissions, canExportData: e.target.checked })}
                                            className="w-4 h-4 rounded text-accent" />
                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Exportar (CSV/Excel) Full</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 p-3 rounded-xl">
                                        <input type="checkbox" checked={permissions.canViewCalendar} onChange={e => setPermissions({ ...permissions, canViewCalendar: e.target.checked })}
                                            className="w-4 h-4 rounded text-accent" />
                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Agenda Gráfica de Calendario</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 p-3 rounded-xl">
                                        <input type="checkbox" checked={permissions.canSetAdvancedPricing} onChange={e => setPermissions({ ...permissions, canSetAdvancedPricing: e.target.checked })}
                                            className="w-4 h-4 rounded text-accent" />
                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Precios Dinámicos Avanzados</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
                <div className="p-6 border-t border-slate-200 dark:border-white/10 flex justify-end gap-3 shrink-0 bg-slate-50 dark:bg-slate-950">
                    <button type="button" onClick={onClose} disabled={loading} className="px-5 py-2.5 text-sm font-semibold text-slate-400 dark:text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white transition-colors disabled:opacity-50">
                        Cancelar
                    </button>
                    <button type="submit" form="edit-plan-form" disabled={loading} className="px-5 py-2.5 bg-accent hover:bg-accent/90 text-slate-950 font-bold rounded-xl transition-all flex items-center gap-2 disabled:opacity-50">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Guardar Cambios
                    </button>
                </div>
            </div>
        </div>
    );
}