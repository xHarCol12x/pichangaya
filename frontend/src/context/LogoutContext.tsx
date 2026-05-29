"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { useTransition } from "@/components/ui/TransitionOverlay";
import api from "@/lib/api";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface LogoutContextType {
    showLogoutConfirm: () => void;
    isLoggingOut: boolean;
}

const LogoutContext = createContext<LogoutContextType | undefined>(undefined);

export function LogoutProvider({ children }: { children: ReactNode }) {
    const [showModal, setShowModal] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const { navigateWithTransition } = useTransition();

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            // 1. Limpieza de suscripciones Push del Service Worker
            if (typeof window !== "undefined" && "serviceWorker" in navigator) {
                const reg = await navigator.serviceWorker.getRegistration("/sw.js");
                if (reg) {
                    const sub = await reg.pushManager.getSubscription();
                    if (sub) {
                        const token = localStorage.getItem("fieldiq_token");
                        await axios.delete(`${API_URL}/notifications/subscribe`, {
                            data: { endpoint: sub.endpoint },
                            headers: { Authorization: `Bearer ${token}` },
                        }).catch(() => { });
                        await sub.unsubscribe();
                    }
                }
            }
        } catch (_) { }

        try {
            // 2. Notificar al backend del logout
            await api.post("/auth/logout").catch(() => { });
        } finally {
            // 3. Limpiar storage local y sessionStorage
            localStorage.removeItem("fieldiq_token");
            localStorage.removeItem("fieldiq_user");
            localStorage.removeItem("fieldiq_selected_venue_id");
            sessionStorage.clear();
            
            // 4. Redirección suave al login
            setTimeout(() => {
                navigateWithTransition("/login");
                setIsLoggingOut(false);
                setShowModal(false);
            }, 300);
        }
    };

    return (
        <LogoutContext.Provider value={{ showLogoutConfirm: () => setShowModal(true), isLoggingOut }}>
            {children}
            <ConfirmModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onConfirm={handleLogout}
                title="¿Cerrar Sesión?"
                message="Tendrás que volver a ingresar tus credenciales para acceder a tu panel de control."
                confirmText="Cerrar sesión"
                cancelText="Cancelar"
                type="danger"
                icon="logout"
            />
        </LogoutContext.Provider>
    );
}

export function useLogout() {
    const context = useContext(LogoutContext);
    if (context === undefined) {
        throw new Error("useLogout debe ser usado dentro de un LogoutProvider");
    }
    return context;
}
