"use client";

import React, { useState, useEffect, Suspense } from "react";
import { Lock, Activity, ArrowLeft, CheckCircle2, AlertCircle, Eye, EyeOff } from "lucide-react";
import TransitionLink from "@/components/ui/TransitionLink";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/api";

function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get("token") || "";

    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");
    const [error, setError] = useState("");

    useEffect(() => {
        if (!token) {
            setError("El link de recuperación no es válido. Solicita uno nuevo.");
        }
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirm) {
            setError("Las contraseñas no coinciden.");
            return;
        }
        if (password.length < 8) {
            setError("La contraseña debe tener al menos 8 caracteres.");
            return;
        }
        setError("");
        setStatus("loading");
        try {
            await api.post("/auth/reset-password", { token, newPassword: password });
            setStatus("success");
            setTimeout(() => router.push("/login"), 3000);
        } catch (err: any) {
            setError(err.response?.data?.message || "El link expiró o no es válido. Solicita uno nuevo.");
            setStatus("idle");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-10">
                    <TransitionLink href="/" className="inline-flex items-center gap-2 mb-6 group">
                        <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform shadow-[0_0_20px_rgba(56,189,248,0.3)]">
                            <Activity className="text-accent-foreground w-6 h-6" />
                        </div>
                        <span className="text-2xl font-bold tracking-tight text-foreground">
                            Pichanga<span className="text-accent">Libre</span>
                        </span>
                    </TransitionLink>
                </div>

                <div className="bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-white/10 rounded-3xl p-8 shadow-lg">
                    {status === "success" ? (
                        <div className="text-center py-4">
                            <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">¡Contraseña actualizada!</h2>
                            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                                Tu contraseña fue restablecida correctamente. Serás redirigido al inicio de sesión en instantes...
                            </p>
                            <TransitionLink
                                href="/login"
                                className="inline-flex items-center gap-2 text-sm text-accent font-medium hover:underline"
                            >
                                Ir al Login ahora →
                            </TransitionLink>
                        </div>
                    ) : (
                        <>
                            <div className="text-center mb-8">
                                <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-accent/20">
                                    <Lock className="w-8 h-8 text-accent" />
                                </div>
                                <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Nueva contraseña</h1>
                                <p className="text-slate-500 dark:text-slate-400 text-sm">
                                    Elige una contraseña segura para tu cuenta.
                                </p>
                            </div>

                            {error && (
                                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3 text-red-500 dark:text-red-400 text-sm">
                                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* New password */}
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                                        Nueva contraseña
                                    </label>
                                    <div className="flex items-center border-b-2 border-slate-200 dark:border-slate-800 pb-2 focus-within:border-accent transition-colors">
                                        <Lock className="w-5 h-5 text-accent mr-3 shrink-0" />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            required
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            placeholder="Mínimo 8 caracteres"
                                            className="w-full bg-transparent text-foreground placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none"
                                        />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-slate-400 hover:text-accent transition-colors ml-2">
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Confirm password */}
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                                        Confirmar contraseña
                                    </label>
                                    <div className="flex items-center border-b-2 border-slate-200 dark:border-slate-800 pb-2 focus-within:border-accent transition-colors">
                                        <Lock className="w-5 h-5 text-accent mr-3 shrink-0" />
                                        <input
                                            type={showConfirm ? "text" : "password"}
                                            required
                                            value={confirm}
                                            onChange={e => setConfirm(e.target.value)}
                                            placeholder="Repite tu nueva contraseña"
                                            className="w-full bg-transparent text-foreground placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none"
                                        />
                                        <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="text-slate-400 hover:text-accent transition-colors ml-2">
                                            {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={status === "loading" || !token}
                                    className="w-full bg-accent text-slate-950 font-bold py-4 rounded-2xl hover:bg-accent/90 transition-all shadow-lg shadow-accent/20 hover:shadow-accent/40 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-60 mt-4"
                                >
                                    {status === "loading" ? (
                                        <svg className="animate-spin w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                    ) : <Lock className="w-5 h-5" />}
                                    Establecer nueva contraseña
                                </button>
                            </form>
                        </>
                    )}

                    <div className="mt-6 text-center">
                        <TransitionLink
                            href="/login"
                            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-accent transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Volver al inicio de sesión
                        </TransitionLink>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>}>
            <ResetPasswordForm />
        </Suspense>
    );
}
