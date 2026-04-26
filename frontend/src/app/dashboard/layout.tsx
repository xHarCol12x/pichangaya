"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";
import SubscriptionWidget from "@/components/dashboard/SubscriptionWidget";


import CommandPalette from "@/components/ui/CommandPalette";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const [userRole, setUserRole] = useState<string | null>(null);

    useEffect(() => {
        const token = localStorage.getItem("fieldiq_token");
        const userStr = localStorage.getItem("fieldiq_user");

        if (!token || !userStr) {
            router.push("/login");
            return;
        }

        try {
            const user = JSON.parse(userStr);
            setUserRole(user.role);

            // Handle return from MercadoPago
            const urlParams = new URLSearchParams(window.location.search);
            const paymentStatus = urlParams.get('status');

            if (paymentStatus === 'success' || paymentStatus === 'approved') {
                // Fetch fresh user data from backend because the webhook just activated them
                import('@/lib/api').then(({ default: api }) => {
                    api.get("/users/me").then(response => {
                        const freshUser = response.data;
                        localStorage.setItem("fieldiq_user", JSON.stringify(freshUser));
                        // Force a clean reload to dashboard without query params
                        window.location.href = '/dashboard';
                    }).catch(console.error);
                });
                return; // Wait for the reload
            }

            // Navigate based on Roles and Active Status
            if (user.role === 'SUPER_ADMIN') {
                if (!pathname.startsWith('/dashboard/super-admin') && !pathname.startsWith('/dashboard/settings')) {
                    router.push('/dashboard/super-admin');
                }
            } else if (user.role === 'ADMIN') {
                const now = new Date();
                const isExpired = user.subscriptionEndsAt && new Date(user.subscriptionEndsAt) <= now;

                if (!user.isActive || isExpired) {
                    // Subscription expired or account suspended
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
        <div className="flex min-h-screen bg-slate-50 dark:bg-[#0e0e0e] text-slate-900 dark:text-white transition-colors duration-300 selection:bg-accent/30 selection:text-white animate-in fade-in duration-1000 relative w-full">
            <Sidebar />
            <div className="flex-1 lg:ml-64 flex flex-col min-h-screen relative min-w-0">
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-[800px] h-[600px] bg-accent/5 rounded-full blur-[120px] -z-10 pointer-events-none" />

                {/* Sticky Header — BENTO V3.2 Forced Migration Wrapper */}
                <div className="sticky top-0 z-50 w-full bg-slate-50/80 dark:bg-[#0e0e0e]/80 backdrop-blur-xl border-b border-[#484847]/30 shadow-sm transition-all duration-300">
                    <TopBar />
                </div>
                <main className="p-4 sm:p-6 lg:p-8 flex-1 pb-24 lg:pb-8 max-w-[100vw] overflow-x-hidden">
                    {children}
                </main>

            </div>
            <CommandPalette />
            {/* Show floating subscription widget for active ADMIN users only */}
            {userRole === 'ADMIN' && <SubscriptionWidget />}
        </div>
    );


}
