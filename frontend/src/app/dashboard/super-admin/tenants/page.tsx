"use client";
import React from "react";
import { UsersIcon } from "lucide-react";
import { useRouter } from "next/navigation";

export default function TenantsPage() {
    const router = useRouter();

    return (
        <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Gestión de Clientes</h1>
                <p className="text-slate-400">Listado exclusivo de inquilinos (Tenants).</p>
            </div>
            <div className="glass p-8 rounded-3xl border border-white/5 flex flex-col items-center justify-center min-h-[400px] text-center">
                <div className="w-16 h-16 bg-accent/20 rounded-2xl flex items-center justify-center mb-4">
                    <UsersIcon className="w-8 h-8 text-accent" />
                </div>
                <h2 className="text-xl font-semibold text-white mb-2">Redirección a Panel Global</h2>
                <p className="text-slate-400 max-w-md mb-6">
                    Por el momento, el listado general de inquilinos y suscripciones se encuentra en el Panel Global.
                </p>
                <button
                    onClick={() => router.push('/dashboard/super-admin')}
                    className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold py-3 px-6 rounded-xl transition-all"
                >
                    Ir al Panel Global
                </button>
            </div>
        </div>
    );
}
