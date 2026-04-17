"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const token = localStorage.getItem("fieldiq_token");
        const userStr = localStorage.getItem("fieldiq_user");

        if (!token || !userStr) {
            router.push("/login");
            return;
        }

        try {
            const user = JSON.parse(userStr);

            // Navigate based on Roles and Active Status
            if (user.role === 'SUPER_ADMIN') {
                if (!pathname.startsWith('/dashboard/super-admin')) {
                    router.push('/dashboard/super-admin');
                }
            } else if (user.role === 'ADMIN') {
                if (!user.isActive) {
                    // Subscription expired
                    if (!pathname.startsWith('/dashboard/billing')) {
                        router.push('/dashboard/billing');
                    }
                } else {
                    // Active subscription but tried to enter restricted super-admin area
                    if (pathname.startsWith('/dashboard/super-admin')) {
                        router.push('/dashboard');
                    }
                }
            }
        } catch (error) {
            router.push('/login');
        }
    }, [router, pathname]);

    return (
        <div className="flex min-h-screen bg-slate-950 text-white selection:bg-accent/30 selection:text-white animate-in fade-in duration-1000">
            <Sidebar />
            <div className="flex-1 ml-64 flex flex-col min-h-screen relative">
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-[800px] h-[600px] bg-accent/5 rounded-full blur-[120px] -z-10 pointer-events-none" />

                <TopBar />
                <main className="p-8 flex-1">
                    {children}
                </main>
            </div>
        </div>
    );
}
