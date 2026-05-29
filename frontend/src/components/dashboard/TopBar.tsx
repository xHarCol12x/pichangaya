"use client";

import React, { useEffect, useState, useRef } from "react";
import { 
    User, 
    Search, 
    LockKeyhole, 
    Loader2, 
    Settings, 
    LogOut, 
    Sun, 
    Moon, 
    MapPin, 
    ChevronDown, 
    Menu, 
    CreditCard 
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { users } from "@/lib/api";
import NotificationBell from "./NotificationBell";
import { useVenue } from "@/context/VenueContext";
import { useSidebar } from "@/context/SidebarContext";
import { useLogout } from "@/context/LogoutContext";



const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// Gradiente por plan
const planConfig: Record<string, { gradient: string; label: string; glow: string }> = {
    FREE_TRIAL: {
        gradient: "from-slate-400 to-slate-500",
        label: "Prueba Gratis",
        glow: "shadow-[0_0_15px_rgba(148,163,184,0.3)]",
    },
    BASIC: {
        gradient: "from-indigo-500 to-violet-500",
        label: "Plan Básico",
        glow: "shadow-[0_0_15px_rgba(99,102,241,0.4)]",
    },
    PRO: {
        gradient: "from-sky-500 to-accent",
        label: "Plan Pro",
        glow: "shadow-[0_0_15px_rgba(56,189,248,0.4)]",
    },
    ENTERPRISE: {
        gradient: "from-amber-500 to-orange-500",
        label: "Plan Enterprise",
        glow: "shadow-[0_0_15px_rgba(245,158,11,0.4)]",
    },
};

const TopBar = () => {
    const [userName, setUserName] = useState("Admin");
    const [isActive, setIsActive] = useState<boolean | null>(null); // null = cargando
    const [plan, setPlan] = useState<string | null>(null);
    const [role, setRole] = useState<string | null>(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isVenueDropdownOpen, setIsVenueDropdownOpen] = useState(false);
    const venueDropdownRef = useRef<HTMLDivElement>(null);
    const { isOpen, setIsOpen, toggleSidebar } = useSidebar();
    const { showLogoutConfirm } = useLogout();
    const router = useRouter();
    const { theme, setTheme, resolvedTheme } = useTheme();
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
            if (venueDropdownRef.current && !venueDropdownRef.current.contains(event.target as Node)) {
                setIsVenueDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);


    useEffect(() => {
        const fetchMe = async () => {
            try {
                const res = await users.getMe();
                const user = res.data;

                setUserName(user.name || "Usuario");
                setIsActive(user.isActive ?? false);
                setPlan(user.plan || null); // ej: "PRO", "STARTER", "ENTERPRISE"
                setRole(user.role || null);

                // Actualiza también el localStorage para que el layout lo use
                const stored = localStorage.getItem("fieldiq_user");
                if (stored) {
                    const parsed = JSON.parse(stored);
                    localStorage.setItem("fieldiq_user", JSON.stringify({
                        ...parsed,
                        isActive: user.isActive,
                        plan: user.plan,
                        featureOverrides: user.featureOverrides || {},
                        planPermissions: user.planPermissions || {},
                    }));
                }
            } catch {
                // Fallback a localStorage si la BD falla
                try {
                    const stored = localStorage.getItem("fieldiq_user");
                    if (stored) {
                        const user = JSON.parse(stored);
                        setUserName(user.name || "Usuario");
                        setIsActive(user.isActive ?? false);
                        setPlan(user.plan || null);
                        setRole(user.role || null);
                    }
                } catch (_) { }
            }
        };

        fetchMe();
    }, [setTheme]);



    const handleThemeToggle = async () => {
        const newTheme = resolvedTheme === "dark" ? "light" : "dark";
        setTheme(newTheme);
        try {
            await users.updateSettings({ themePreference: newTheme });
            // update localstorage user
            const stored = localStorage.getItem("fieldiq_user");
            if (stored) {
                const parsed = JSON.parse(stored);
                localStorage.setItem("fieldiq_user", JSON.stringify({ ...parsed, themePreference: newTheme }));
            }
        } catch (e) {
            console.error("Error updating theme preference");
        }
    };

    const loading = isActive === null;
    const active = isActive === true;
    const currentPlan = plan && planConfig[plan] ? planConfig[plan] : null;

    const { selectedVenueId, venues: venuesList, setSelectedVenueId, isLoadingVenues } = useVenue();

    return (
        <div className="h-16 lg:h-20 border-b border-white/5 flex items-center justify-between px-4 sm:px-6 lg:px-8 bg-background/50 backdrop-blur-sm sticky top-0 z-20 gap-4">
            {/* Mobile Sidebar Toggle */}
            <button
                onClick={toggleSidebar}
                className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                aria-label="Abrir menú"
            >
                <Menu className="w-6 h-6" />
            </button>

            {/* Venue Selector (Custom) */}
            {role !== 'SUPER_ADMIN' && (
            <div className="relative" ref={venueDropdownRef}>
                <div 
                    onClick={() => setIsVenueDropdownOpen(!isVenueDropdownOpen)}
                    className="flex items-center gap-1 sm:gap-2 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-2 sm:px-3 py-1.5 hover:bg-slate-200 dark:hover:bg-white/10 transition-all cursor-pointer group min-w-[100px] sm:min-w-[140px] md:min-w-[180px]"
                >
                    <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent" />
                    <div className="flex-1 min-w-0">
                        <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-500 leading-none mb-0.5 hidden sm:block">Sede</p>
                        <p className="text-[10px] sm:text-xs font-bold text-slate-900 dark:text-white truncate">
                            {isLoadingVenues ? '...' : venuesList.find(v => v.id === selectedVenueId)?.name || 'Sin sedes'}
                        </p>
                    </div>
                    <ChevronDown className={`w-3 h-3 text-slate-400 group-hover:text-white transition-transform duration-200 ${isVenueDropdownOpen ? 'rotate-180' : ''}`} />
                </div>


                {isVenueDropdownOpen && !isLoadingVenues && venuesList.length > 0 && (
                    <div className="absolute top-full left-0 mt-2 w-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 z-50">
                        <div className="p-2 space-y-1">
                            {venuesList.map(v => (
                                <button
                                    key={v.id}
                                    onClick={() => {
                                        setSelectedVenueId(v.id);
                                        setIsVenueDropdownOpen(false);
                                    }}
                                    className={`w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-xl transition-colors ${
                                        selectedVenueId === v.id 
                                            ? 'bg-accent/10 text-accent' 
                                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <MapPin className={`w-4 h-4 ${selectedVenueId === v.id ? 'text-accent' : 'text-slate-500'}`} />
                                        <span className="truncate">{v.name}</span>
                                    </div>
                                    {selectedVenueId === v.id && <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            )}


            <div className="hidden md:flex items-center gap-4 flex-1">
                <div className="relative w-80 xl:w-96 max-w-full group">
                    {/* Ícono izquierdo */}
                    {loading ? (
                        <Loader2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 animate-spin" />
                    ) : active ? (
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-accent transition-colors" />
                    ) : (
                        <LockKeyhole className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                    )}

                    <button
                        disabled={!active || loading}
                        onClick={() => document.dispatchEvent(new CustomEvent('open-cmdk'))}
                        className={`w-full border rounded-xl py-2.5 pl-11 pr-14 text-sm text-left transition-all relative overflow-hidden
                            ${active && !loading
                                ? "bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 hover:border-accent/40 hover:ring-1 hover:ring-accent/50"
                                : "bg-slate-50 dark:bg-white/[0.02] border-slate-200 dark:border-white/5 text-slate-400 dark:text-slate-600 cursor-not-allowed select-none"
                            }`}
                    >
                        {loading
                            ? "Cargando..."
                            : active
                                ? "Presiona Ctrl+K para buscar..."
                                : "Activa tu plan para buscar"}
                        
                        {active && !loading && (
                            <kbd className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:inline-flex items-center gap-1 bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-slate-300 font-mono text-[10px] px-1.5 py-0.5 rounded font-bold">
                                <span className="text-[10px]">⌘</span>K
                            </kbd>
                        )}
                    </button>

                    {/* Borde rojo cuando inactivo */}
                    {!active && !loading && (
                        <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-red-500/15 pointer-events-none" />
                    )}
                </div>
            </div>

            {/* Mobile: logo / page title placeholder */}
            <div className="flex md:hidden flex-1 justify-center sm:justify-start">
                <span className="text-sm sm:text-base font-bold text-foreground">Pichanga<span className="text-accent">Libre</span></span>
            </div>

            <div className="flex items-center gap-2 sm:gap-6">

                {/* Notification Bell */}
                <NotificationBell />

                {/* Avatar + info */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center gap-3 pl-6 border-l border-slate-200 dark:border-white/10 text-left"
                    >
                        <div className="hidden sm:block">
                            <p className="text-sm font-bold text-slate-800 dark:text-white leading-none mb-1">{userName}</p>
                            {loading ? (
                                <div className="h-3 w-20 bg-slate-200 dark:bg-white/10 rounded-full animate-pulse" />
                            ) : active && currentPlan ? (
                                <p className="text-[10px] font-black uppercase tracking-wider"
                                    style={{
                                        background: `linear-gradient(135deg, var(--tw-gradient-from), var(--tw-gradient-to))`,
                                    }}
                                >
                                    {/* texto con color del plan */}
                                    <span className={`bg-gradient-to-r ${currentPlan.gradient} bg-clip-text text-transparent`}>
                                        {currentPlan.label}
                                    </span>
                                </p>
                            ) : currentPlan ? (
                                <p className="text-[10px] font-bold uppercase tracking-wider text-red-500/90">
                                    Suscripción Expirada / Suspendida
                                </p>
                            ) : (
                                <p className="text-[10px] font-bold uppercase tracking-wider text-red-500/70">
                                    Sin suscripción
                                </p>
                            )}
                        </div>

                        {/* Avatar con gradiente dinámico por plan */}
                        <div className={`w-10 h-10 rounded-xl p-px transition-all duration-500 ${loading
                            ? "bg-slate-200 dark:bg-white/10 animate-pulse"
                            : active && currentPlan
                                ? `bg-gradient-to-br ${currentPlan.gradient} ${currentPlan.glow}`
                                : "bg-gradient-to-br from-red-900 to-red-700 shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                            }`}>
                            <div className="w-full h-full bg-slate-100 dark:bg-slate-950 rounded-xl flex items-center justify-center">
                                {!loading && (
                                    <User className={`w-5 h-5 ${active && currentPlan ? "text-accent" : "text-red-500/90"
                                        }`} />
                                )}
                            </div>
                        </div>
                    </button>

                    {/* Dropdown Menu */}
                    {isDropdownOpen && (
                        <div className="absolute right-0 mt-3 w-56 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 z-50">
                            <div className="p-3 border-b border-slate-100 dark:border-white/10">
                                <p className="text-sm font-bold text-slate-900 dark:text-white">{userName}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Suscripción: {currentPlan?.label || 'Inactiva'}</p>
                            </div>
                            <div className="p-2 space-y-1">
                                <button
                                    onClick={() => { setIsDropdownOpen(false); router.push('/dashboard/settings'); }}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                                >
                                    <Settings className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                                    Configuración
                                </button>
                                <button
                                    onClick={handleThemeToggle}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                                >
                                    {resolvedTheme === "dark" ? (
                                        <Sun className="w-4 h-4 text-emerald-500" />
                                    ) : (
                                        <Moon className="w-4 h-4 text-indigo-500" />
                                    )}
                                    {resolvedTheme === "dark" ? "Modo Claro" : "Modo Oscuro"}
                                </button>
                            </div>
                            <div className="p-2 border-t border-slate-100 dark:border-white/10">
                                <button
                                    onClick={showLogoutConfirm}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Cerrar Sesión
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TopBar;