"use client";
import React from "react";
import { Settings } from "lucide-react";

export default function SettingsPage() {
    return (
        <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Configuración</h1>
                <p className="text-slate-400">Preferencias de tu cuenta y de la aplicación.</p>
            </div>
            <div className="glass p-8 rounded-3xl border border-white/5 flex flex-col items-center justify-center min-h-[400px] text-center">
                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-4">
                    <Settings className="w-8 h-8 text-slate-400 animate-[spin_4s_linear_infinite]" />
                </div>
                <h2 className="text-xl font-semibold text-white mb-2">Módulo en Construcción</h2>
                <p className="text-slate-400 max-w-md">
                    Las opciones de configuración globales estarán disponibles muy pronto.
                </p>
            </div>
        </div>
    );
}
