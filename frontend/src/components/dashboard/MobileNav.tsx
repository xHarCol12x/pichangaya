"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Calendar, MapPin, Users, Settings } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const navItems = [
    { icon: LayoutDashboard, label: "Inicio", href: "/dashboard" },
    { icon: Calendar, label: "Reservas", href: "/dashboard/bookings" },
    { icon: MapPin, label: "Canchas", href: "/dashboard/fields" },
    { icon: Users, label: "Clientes", href: "/dashboard/users" },
    { icon: Settings, label: "Más", href: "/dashboard/settings" },
];

const MobileNav = () => {
    const pathname = usePathname();

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white/80 dark:bg-[#0e0e0e]/80 backdrop-blur-xl border-t border-slate-200 dark:border-white/5 pb-safe">
            <div className="flex items-center justify-around h-16 px-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all relative",
                                isActive ? "text-accent" : "text-slate-500 dark:text-slate-400"
                            )}
                        >
                            {isActive && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-accent rounded-b-full shadow-[0_0_10px_rgba(202,253,0,0.5)]" />
                            )}
                            <item.icon className={cn("w-5 h-5", isActive && "animate-in zoom-in duration-300")} />
                            <span className="text-[10px] font-bold uppercase tracking-widest leading-none">
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
};

export default MobileNav;
