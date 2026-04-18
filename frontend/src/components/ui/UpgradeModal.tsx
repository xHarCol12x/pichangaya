"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Crown, X } from 'lucide-react';

interface UpgradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    description: string;
    planName: string;
}

export default function UpgradeModal({
    isOpen,
    onClose,
    title = "Límite de Plan Alcanzado",
    description,
    planName
}: UpgradeModalProps) {
    const router = useRouter();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop con Blur extremo */}
            <div
                className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Modal Dialog */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl w-full max-w-md relative z-10 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">

                {/* Close Button top-right */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-20 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Header Decoration */}
                <div className="relative h-32 bg-gradient-to-br from-accent/20 to-transparent dark:from-accent/10 flex items-center justify-center border-b border-slate-100 dark:border-white/5">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-accent/20 rounded-full blur-[40px]" />
                    <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full shadow-md flex items-center justify-center border border-slate-100 dark:border-white/10 relative z-10">
                        <Crown className="w-8 h-8 text-accent animate-pulse" />
                    </div>
                </div>

                {/* Body Content */}
                <div className="p-8 text-center">
                    <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
                        {title}
                    </h3>

                    <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                        Tu plan actual <span className="font-bold text-accent px-1.5 py-0.5 rounded-md bg-accent/10 text-xs tracking-wider inline-block">{planName.toUpperCase()}</span> {description}
                    </p>

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => router.push('/dashboard/billing')}
                            className="w-full bg-accent text-slate-950 font-bold py-3.5 px-4 rounded-xl hover:bg-accent/90 transition-all shadow-lg shadow-accent/20 hover:shadow-accent/40 active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            <Crown className="w-4 h-4" />
                            Mejorar a Plan PRO
                        </button>

                        <button
                            onClick={onClose}
                            className="w-full bg-transparent text-slate-500 dark:text-slate-400 font-medium py-3 px-4 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                        >
                            Quizás más tarde
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
