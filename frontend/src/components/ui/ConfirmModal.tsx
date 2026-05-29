"use client";

import React, { useEffect, useRef, useState } from "react";
import { AlertCircle, LogOut, Home, X } from "lucide-react";
import { gsap } from "gsap";

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
    type?: "danger" | "warning" | "info";
    icon?: "logout" | "home" | "alert";
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText,
    cancelText,
    type = "warning",
    icon = "alert",
}) => {
    // mounted controla si el DOM existe; visible controla la animación
    const [mounted, setMounted] = useState(false);
    const backdropRef = useRef<HTMLDivElement>(null);
    const cardRef = useRef<HTMLDivElement>(null);

    // Animar entrada
    useEffect(() => {
        if (isOpen) {
            setMounted(true);
        }
    }, [isOpen]);

    // Cuando mounted cambia a true, animar entrada
    useEffect(() => {
        if (!mounted) return;
        document.body.style.overflow = "hidden";

        const tl = gsap.timeline();
        tl.fromTo(backdropRef.current,
            { opacity: 0 },
            { opacity: 1, duration: 0.25, ease: "power2.out" }
        ).fromTo(cardRef.current,
            { opacity: 0, scale: 0.92, y: 16 },
            { opacity: 1, scale: 1, y: 0, duration: 0.35, ease: "back.out(1.5)" },
            "-=0.1"
        );
    }, [mounted]);

    const animateOut = (callback: () => void) => {
        const tl = gsap.timeline({ onComplete: callback });
        tl.to(cardRef.current, {
            opacity: 0, scale: 0.94, y: 10,
            duration: 0.2, ease: "power2.in"
        }).to(backdropRef.current, {
            opacity: 0, duration: 0.2, ease: "power2.in"
        }, "-=0.1");
    };

    const handleClose = () => {
        animateOut(() => {
            setMounted(false);
            document.body.style.overflow = "unset";
            onClose();
        });
    };

    const handleConfirm = () => {
        animateOut(() => {
            setMounted(false);
            document.body.style.overflow = "unset";
            onClose();
            onConfirm();
        });
    };

    if (!mounted) return null;

    const renderIcon = () => {
        switch (icon) {
            case "logout": return <LogOut className="w-6 h-6" />;
            case "home": return <Home className="w-6 h-6" />;
            default: return <AlertCircle className="w-6 h-6" />;
        }
    };

    const getColors = () => {
        switch (type) {
            case "danger":
                return {
                    bg: "bg-red-500/10",
                    text: "text-red-400",
                    border: "border-red-500/20",
                    glow: "bg-red-500",
                    button: "bg-red-500 hover:bg-red-600 text-white shadow-[0_0_24px_rgba(239,68,68,0.35)]",
                };
            case "warning":
                return {
                    bg: "bg-amber-500/10",
                    text: "text-amber-400",
                    border: "border-amber-500/20",
                    glow: "bg-amber-500",
                    button: "bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-[0_0_24px_rgba(245,158,11,0.35)]",
                };
            case "info":
            default:
                return {
                    bg: "bg-[#cafd00]/10",
                    text: "text-[#cafd00]",
                    border: "border-[#cafd00]/20",
                    glow: "bg-[#cafd00]",
                    button: "bg-[#cafd00] hover:bg-[#beee00] text-[#0e0e0e] shadow-[0_0_24px_rgba(202,253,0,0.35)]",
                };
        }
    };

    const colors = getColors();

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div
                ref={backdropRef}
                className="absolute inset-0 bg-[#0e0e0e]/90 backdrop-blur-md"
                onClick={handleClose}
            />

            {/* Card */}
            <div
                ref={cardRef}
                className="relative bg-[#1a1919] border border-[#484847]/30 rounded-[2rem] w-full max-w-sm p-8 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
            >
                {/* Glow decorativo */}
                <div className={`absolute -top-8 -right-8 w-36 h-36 rounded-full blur-3xl opacity-15 ${colors.glow}`} />

                {/* Botón cerrar */}
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-xl text-slate-500 hover:text-white hover:bg-white/10 transition-all"
                >
                    <X className="w-4 h-4" />
                </button>

                <div className="flex flex-col items-center text-center">
                    {/* Ícono */}
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 border ${colors.bg} ${colors.text} ${colors.border}`}>
                        {renderIcon()}
                    </div>

                    <h3 className="text-2xl font-black text-white font-space-grotesk tracking-tighter mb-2 uppercase">
                        {title}
                    </h3>
                    <p className="text-[#adaaaa] text-sm leading-relaxed mb-8">
                        {message}
                    </p>

                    {/* Botones */}
                    <div className="flex w-full gap-3">
                        <button
                            onClick={handleClose}
                            className="flex-1 py-3 px-4 rounded-xl font-medium text-foreground/60 border border-border hover:bg-foreground/5 hover:text-foreground transition-all"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={handleConfirm}
                            className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all active:scale-95 ${colors.button}`}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;