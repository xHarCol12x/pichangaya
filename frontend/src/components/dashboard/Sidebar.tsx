"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "lucide-react";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { useTransition } from "@/components/ui/TransitionOverlay";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import api from "@/lib/api";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const menuItems = [
    { icon: LayoutDashboard, label: "Vista General", href: "/dashboard" },
    { icon: Calendar, label: "Reservas", href: "/dashboard/bookings" },
    { icon: MapPin, label: "Canchas", href: "/dashboard/fields" },
    { icon: UsersIcon, label: "Clientes", href: "/dashboard/users" },
    { icon: BrainCircuit, label: "IA Predictiva", href: "/dashboard/analytics" },
    { icon: Settings, label: "Configuración", href: "/dashboard/settings" },
];

const Sidebar = () => {
    const pathname = usePathname();
    const { navigateWithTransition } = useTransition();
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [showHomeModal, setShowHomeModal] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            // Llama al endpoint de logout en el backend si existe
            await api.post("/auth/logout").catch(() => {
                // Si no hay endpoint de logout, no importa — igual limpiamos
            });
        } finally {
            // Limpia todo el storage local
            localStorage.removeItem("fieldiq_token");
            localStorage.removeItem("fieldiq_user");
            sessionStorage.clear();

            // Pequeña pausa para que se vea el spinner antes de redirigir
            setTimeout(() => {
                navigateWithTransition("/login");
            }, 300);
        }
    };

    const handleGoHome = () => {
        navigateWithTransition("/");
    };

    // Determina el menú según rol e isActive desde localStorage
    const getMenuItems = () => {
        if (typeof window === "undefined") return menuItems;

        try {
            const userStr = localStorage.getItem("fieldiq_user");
            if (!userStr) return menuItems;
            const user = JSON.parse(userStr);

            if (user.role === "SUPER_ADMIN") {
                return [
                    { icon: BrainCircuit, label: "Panel Global", href: "/dashboard/super-admin" },
                    { icon: UsersIcon, label: "Clientes (Tenants)", href: "/dashboard/super-admin/tenants" },
                    { icon: Settings, label: "Configuración", href: "/dashboard/settings" },
                ];
            }

            if (user.role === "ADMIN" && !user.isActive) {
                return [
                    { icon: Settings, label: "Facturación", href: "/dashboard/billing" },
                ];
            }
        } catch (_) { }

        return menuItems;
    };

    const activeItems = getMenuItems();

    return (
        <>
            <div className="w-64 h-screen border-r border-white/5 flex flex-col glass p-4 fixed left-0 top-0 z-30">

                {/* Logo */}
                <div className="px-4 py-8 mb-8">
                    <button
                        onClick={() => setShowHomeModal(true)}
                        className="flex items-center gap-2 group focus:outline-none w-full text-left"
                    >
                        <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center group-hover:rotate-12 transition-transform shadow-[0_0_15px_rgba(56,189,248,0.2)]">
                            <Activity className="text-accent-foreground w-4 h-4" />
                        </div>
                        <span className="text-xl font-bold tracking-tight text-white">
                            Field<span className="text-accent">IQ</span>
                        </span>
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 space-y-2">
                    {activeItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-medium transition-all group",
                                    isActive
                                        ? "bg-accent text-accent-foreground shadow-[0_0_20px_rgba(56,189,248,0.2)]"
                                        : "text-slate-400 hover:text-white hover:bg-white/5"
                                )}
                            >
                                <item.icon className={cn("w-5 h-5", isActive ? "text-accent-foreground" : "group-hover:text-accent")} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* Logout */}
                <div className="pt-4 border-t border-white/5 mt-auto">
                    <button
                        onClick={() => setShowLogoutModal(true)}
                        disabled={isLoggingOut}
                        className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all focus:outline-none disabled:opacity-50"
                    >
                        {isLoggingOut
                            ? <Loader2 className="w-5 h-5 animate-spin" />
                            : <LogOut className="w-5 h-5" />
                        }
                        {isLoggingOut ? "Cerrando sesión..." : "Cerrar Sesión"}
                    </button>
                </div>
            </div>

            {/* Modal logout */}
            <ConfirmModal
                isOpen={showLogoutModal}
                onClose={() => setShowLogoutModal(false)}
                onConfirm={handleLogout}
                title="¿Cerrar Sesión?"
                message="Tendrás que volver a ingresar tus credenciales para acceder a tu panel de control."
                confirmText="Cerrar sesión"
                cancelText="Cancelar"
                type="danger"
                icon="logout"
            />

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

export default Sidebar;