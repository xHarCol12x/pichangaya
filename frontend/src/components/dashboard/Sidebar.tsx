"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
    LayoutDashboard,
    Calendar,
    MapPin,
    BrainCircuit,
    Settings,
    LogOut,
    Activity,
    Users as UsersIcon,
    Loader2,
    Menu,
    X,
    CreditCard,
    ClipboardList,
    Navigation
} from "lucide-react";
import { useSidebar } from "@/context/SidebarContext";




import ConfirmModal from "@/components/ui/ConfirmModal";
import { useTransition } from "@/components/ui/TransitionOverlay";
import { useLogout } from "@/context/LogoutContext";
import api from "@/lib/api";
import { cn } from "@/lib/utils";

const menuItems = [
    { icon: LayoutDashboard, label: "Vista General", href: "/dashboard" },
    { icon: Calendar, label: "Reservas", href: "/dashboard/bookings" },
    { icon: MapPin, label: "Canchas", href: "/dashboard/fields" },
    { icon: Navigation, label: "Sedes", href: "/dashboard/venues" },
    { icon: UsersIcon, label: "Clientes", href: "/dashboard/users" },

    { icon: BrainCircuit, label: "IA Predictiva", href: "/dashboard/analytics" },
    { icon: Settings, label: "Configuración", href: "/dashboard/settings" },
];



const SidebarInner = () => {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const currentTab = searchParams.get("tab") || "DIRECTORY";

    const { navigateWithTransition } = useTransition();
    const { isOpen: isMobileOpen, setIsOpen: setIsMobileOpen, toggleSidebar } = useSidebar();
    const { showLogoutConfirm, isLoggingOut } = useLogout();
    const [showHomeModal, setShowHomeModal] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Close drawer when route changes (user tapped a link on mobile)
    useEffect(() => {
        setIsMobileOpen(false);
    }, [pathname]);

    // Prevent scroll when drawer is open on mobile
    useEffect(() => {
        if (isMobileOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => { document.body.style.overflow = ""; };
    }, [isMobileOpen]);

    const handleGoHome = () => {
        navigateWithTransition("/");
    };

    const getMenuItems = () => {
        if (!isMounted) {
            return [
                { icon: LayoutDashboard, label: "Vista General", href: "/dashboard" },
                { icon: Calendar, label: "Reservas", href: "/dashboard/bookings" },
                { icon: MapPin, label: "Canchas", href: "/dashboard/fields" },
                { icon: UsersIcon, label: "Clientes", href: "/dashboard/users" },
                { icon: Settings, label: "Configuración", href: "/dashboard/settings" },
            ];
        }
        try {
            const userStr = localStorage.getItem("fieldiq_user");
            if (!userStr) {
                return [
                    { icon: LayoutDashboard, label: "Vista General", href: "/dashboard" },
                    { icon: Calendar, label: "Reservas", href: "/dashboard/bookings" },
                    { icon: MapPin, label: "Canchas", href: "/dashboard/fields" },
                    { icon: UsersIcon, label: "Clientes", href: "/dashboard/users" },
                    { icon: Settings, label: "Configuración", href: "/dashboard/settings" },
                ];
            }
            
            const user = JSON.parse(userStr);
            if (user.role === "SUPER_ADMIN") {
                return [
                    { icon: LayoutDashboard, label: "Directorio", href: "/dashboard/super-admin?tab=DIRECTORY" },
                    { icon: CreditCard, label: "Planes", href: "/dashboard/super-admin?tab=PLANS" },
                    { icon: ClipboardList, label: "Auditoría", href: "/dashboard/super-admin?tab=AUDIT" },
                    { icon: Settings, label: "Configuración", href: "/dashboard/settings" },
                ];
            }
            
            if (user.role === "ADMIN" && !user.isActive) {
                return [{ icon: Settings, label: "Facturación", href: "/dashboard/billing" }];
            }

            const isProOrEnterprise = String(user.plan).toUpperCase() === "PRO" || String(user.plan).toUpperCase() === "ENTERPRISE";
            const overrides = user.featureOverrides || {};
            const planPermissions = user.planPermissions || {};

            const baseMenu = [
                { icon: LayoutDashboard, label: "Vista General", href: "/dashboard" },
                { icon: Calendar, label: "Reservas", href: "/dashboard/bookings" },
                { icon: MapPin, label: "Canchas", href: "/dashboard/fields" },
                { icon: Navigation, label: "Sedes", href: "/dashboard/venues" },
                { icon: UsersIcon, label: "Clientes", href: "/dashboard/users" },
            ];


            // 📆 Visual Calendar Feature Toggle
            if (isProOrEnterprise || overrides.canViewCalendar || planPermissions.canViewCalendar) {
                baseMenu.push({ icon: Calendar, label: "Calendario", href: "/dashboard/calendar" });
            }

            // 🤖 Predictive AI Feature Toggle
            if (isProOrEnterprise || overrides.canUsePredictiveAI || planPermissions.canUsePredictiveAI) {
                baseMenu.push({ icon: BrainCircuit, label: "IA Predictiva", href: "/dashboard/analytics" });
            }

            baseMenu.push({ icon: Settings, label: "Configuración", href: "/dashboard/settings" });
            
            return baseMenu;

        } catch (_) { }
        return [];
    };

    const activeItems = getMenuItems();

    const SidebarContent = () => (
        <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="px-4 py-8 mb-4 flex items-center justify-between">
                <button
                    onClick={() => setShowHomeModal(true)}
                    className="flex items-center gap-2 group focus:outline-none text-left"
                >
                    <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center group-hover:rotate-12 transition-transform shadow-[0_0_15px_rgba(56,189,248,0.2)]">
                        <Activity className="text-accent-foreground w-4 h-4" />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                        Pichanga<span className="text-accent">Libre</span>
                    </span>
                </button>

                {/* Close btn on mobile */}
                <button
                    onClick={toggleSidebar}
                    className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>


            {/* Navigation */}
            <nav className="flex-1 space-y-2 px-4">
                {activeItems.map((item) => {
                    const isTabLink = item.href.includes("?tab=");
                    let isActive = false;

                    if (isTabLink) {
                        const [basePath, query] = item.href.split("?tab=");
                        isActive = pathname === basePath && currentTab === query;
                    } else {
                        isActive = pathname === item.href;
                    }
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-medium transition-all group",
                                isActive
                                    ? "bg-accent text-accent-foreground shadow-md dark:shadow-[0_0_20px_rgba(56,189,248,0.2)]"
                                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5"
                            )}
                        >
                            <item.icon className={cn("w-5 h-5", isActive ? "text-accent-foreground" : "group-hover:text-accent")} />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            {/* Logout */}
            <div className="pt-4 border-t border-slate-200 dark:border-white/5 mt-auto px-4 pb-4">
                <button
                    onClick={showLogoutConfirm}
                    disabled={isLoggingOut}
                    className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all focus:outline-none disabled:opacity-50"
                >
                    {isLoggingOut ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogOut className="w-5 h-5" />}
                    {isLoggingOut ? "Cerrando sesión..." : "Cerrar Sesión"}
                </button>
            </div>
        </div>
    );

    return (
        <>
            {/* ── Desktop Sidebar ── */}
            <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-64 border-r border-slate-200 dark:border-white/5 bg-white/50 dark:bg-[#0e0e0e]/50 backdrop-blur-xl z-30">
                <SidebarContent />
            </aside>

            {/* ── Mobile Overlay ── */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-[#0e0e0e]/60 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-200"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            {/* ── Mobile Drawer ── */}
            <div
                className={cn(
                    "fixed top-0 left-0 h-full w-72 bg-white dark:bg-[#0e0e0e] border-r border-slate-200 dark:border-white/5 z-50 lg:hidden transition-transform duration-300 ease-in-out",
                    isMobileOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <SidebarContent />
            </div>




            {/* Modal ir a home */}
            <ConfirmModal
                isOpen={showHomeModal}
                onClose={() => setShowHomeModal(false)}
                onConfirm={handleGoHome}
                title="¿Volver a la Portada?"
                message="Saldrás de tu panel de administración y serás redirigido a la página principal."
                confirmText="Sí, volver"
                cancelText="Cancelar"
                type="info"
                icon="home"
            />
        </>
    );
};

const Sidebar = () => (
    <Suspense fallback={<div className="hidden lg:flex w-64 h-screen border-r border-slate-200 dark:border-white/5 bg-white/50 dark:bg-[#0e0e0e]/50 backdrop-blur-xl" />}>
        <SidebarInner />
    </Suspense>
);

export default Sidebar;