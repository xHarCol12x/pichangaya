"use client";

import React from "react";
import { Activity, Plus, LucideIcon } from "lucide-react";

interface NoVenuePlaceholderProps {
    title?: string;
    message?: string;
    buttonText?: string;
    icon?: LucideIcon;
    onButtonClick?: () => void;
}

export default function NoVenuePlaceholder({
    title = "FieldIQ",
    message = "Estás a un paso de empezar a recibir reservas. El primer paso obligatorio es registrar tu sede deportiva principal.",
    buttonText = "Crear mi Primera Sede",
    icon: IconComponent = Activity,
    onButtonClick
}: NoVenuePlaceholderProps) {
    
    const handleRedirect = () => {
        if (onButtonClick) {
            onButtonClick();
        } else {
            window.location.href = "/dashboard/venues";
        }
    };

    return (
        <div className="max-w-[1400px] w-full mx-auto px-4 py-8 min-h-[70vh] flex items-center justify-center animate-in fade-in duration-500">
            <div className="glass max-w-2xl w-full rounded-[3rem] p-8 sm:p-12 text-center border border-white/5 bg-[#0d0d0d]/80 backdrop-blur-xl flex flex-col items-center shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                {/* Neon Lime Icon Badge */}
                <div className="w-20 h-20 bg-[#cafd00] rounded-3xl flex items-center justify-center rotate-3 hover:rotate-12 transition-transform duration-300 shadow-[0_0_40px_rgba(202,253,0,0.3)] mb-8">
                    <IconComponent className="text-[#0e0e0e] w-10 h-10 stroke-[2.5]" />
                </div>

                {/* Typography Brand */}
                <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white flex items-center gap-1 mb-6 font-space-grotesk uppercase">
                    Field<span className="text-[#cafd00]">IQ</span>
                </h1>

                {/* Customized Message */}
                <p className="text-slate-400 text-base sm:text-lg mb-10 max-w-md mx-auto leading-relaxed">
                    {message}
                </p>

                {/* Neon Lime Button */}
                <button
                    onClick={handleRedirect}
                    className="bg-[#cafd00] hover:bg-[#b5e300] text-[#0e0e0e] px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-wider transition-all duration-200 hover:scale-105 active:scale-98 flex items-center gap-2.5 shadow-[0_0_30px_rgba(202,253,0,0.2)]"
                >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    {buttonText}
                </button>
            </div>
        </div>
    );
}
