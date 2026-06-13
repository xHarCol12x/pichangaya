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
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const { users } = await import('@/lib/api');
                const response = await users.getMe();
                const freshUser = response.data;
                
                localStorage.setItem("fieldiq_user", JSON.stringify(freshUser));
                setUserRole(freshUser.role);
                
                // Logic for redirection based on roles and status
                handleRoleBasedRedirection(freshUser);
            } catch (err) {
                console.error("Auth check failed:", err);
                router.push("/login");
            } finally {
                setIsLoading(false);
            }
        };

        checkAuth();
    }, [pathname]);

    const handleRoleBasedRedirection = (user: any) => {
        // Handle return from MercadoPago
        const urlParams = new URLSearchParams(window.location.search);
        const paymentStatus = urlParams.get('status');

        if (paymentStatus === 'success' || paymentStatus === 'approved') {
            window.location.href = '/dashboard';
            return;
        }

        if (user.role === 'SUPER_ADMIN') {
            if (!pathname.startsWith('/dashboard/super-admin') && !pathname.startsWith('/dashboard/settings')) {
                router.push('/dashboard/super-admin');
            }
        } else if (user.role === 'ADMIN') {
            const now = new Date();
            const isExpired = user.subscriptionEndsAt && new Date(user.subscriptionEndsAt) <= now;

            if (!user.isActive || isExpired) {
                if (!pathname.startsWith('/dashboard/billing')) {
                    router.push('/dashboard/billing');
                }
            } else {
                if (pathname.startsWith('/dashboard/super-admin')) {
                    router.push('/dashboard');
                }
            }
        }
    };

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-[#0e0e0e]">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent"></div>
            </div>
        );
    }

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
