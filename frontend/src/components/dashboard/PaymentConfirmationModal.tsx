"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import { Booking } from "@/types";

interface PaymentConfirmationModalProps {
    booking: Booking | null;
    payLoading: boolean;
    onClose: () => void;
    onSubmit: (method: string) => Promise<void>;
}

const PaymentConfirmationModal = ({
    booking,
    payLoading,
    onClose,
    onSubmit
}: PaymentConfirmationModalProps) => {
    if (!booking) return null;

    const paymentMethods = ['Efectivo', 'Yape', 'Plin', 'Tarjeta', 'Transferencia', 'Otro'];

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-white/10 w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Confirmar Pago</h3>
                    <p className="text-sm text-slate-500 mb-6">
                        Selecciona el método de pago por <strong className="text-accent">S/{booking.totalPrice || 0}</strong>.
                    </p>

                    <div className="grid grid-cols-2 gap-2 mb-6">
                        {paymentMethods.map(m => (
                            <button
                                key={m}
                                disabled={payLoading}
                                onClick={() => onSubmit(m)}
                                className="py-3 rounded-xl border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-accent hover:border-accent hover:text-slate-950 transition-all text-sm disabled:opacity-50"
                            >
                                {payLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : m}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={onClose}
                        disabled={payLoading}
                        className="w-full py-3 text-slate-400 font-bold text-sm hover:text-slate-700 dark:hover:text-white transition-colors"
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentConfirmationModal;
