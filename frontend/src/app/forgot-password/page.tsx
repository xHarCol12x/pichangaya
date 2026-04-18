"use client";

import React, { useState } from "react";
import TransitionLink from "@/components/ui/TransitionLink";
import { Activity, ArrowLeft, ArrowRight, Mail, AlertCircle, CheckCircle2 } from "lucide-react";
import AuthCarousel from "@/components/ui/AuthCarousel";
import api from "@/lib/api";

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setStatus("loading");

        try {
            await api.post("/auth/forgot-password", { email });
            setStatus("success");
        } catch (err: any) {
            setError(err.response?.data?.message || "Ocurrió un error al procesar tu solicitud.");
            setStatus("idle");
        }
    };

    return (
        <div className="min-h-screen flex bg-background">
            {/* Left Column - Graphic/Illustration using AuthCarousel */}
            <div className="hidden lg:flex w-1/2 relative bg-slate-950">
                <AuthCarousel
                    images={[
                        {
                            src: "https://images.unsplash.com/photo-1526232761682-d26e03ac148e?q=80&w=1200&auto=format&fit=crop",
                            title: <><span className="text-amber-400">Tranquilo,</span> te ayudamos</>,
                            subtitle: "Recupera tu acceso de inmediato para seguir gestionando."
                        },
                        {
                            src: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1200&auto=format&fit=crop",
                            title: <><span className="text-accent">Analítica</span> en tiempo real</>,
                            subtitle: "Conoce tus métricas exactas, horas pico y rentabilidad por sede."
                        },
                        {
                            src: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1200&auto=format&fit=crop",
                            title: <><span className="text-emerald-400">Automatiza</span> tu complejo</>,
                            subtitle: "Cientos de reservas diarias gestionadas sin fallas. Pasa al siguiente nivel."
                        }
                    ]}
                />
            </div>

            {/* Right Column - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12">
                <div className="w-full max-w-md">
                    <div className="text-center mb-10">
                        <TransitionLink href="/login" className="inline-flex items-center gap-2 mb-6 group">
                            <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform shadow-[0_0_20px_rgba(56,189,248,0.3)]">
                                <Activity className="text-accent-foreground w-6 h-6" />
                            </div>
                            <span className="text-2xl font-bold tracking-tight text-foreground">
                                Pichanga<span className="text-accent">Libre</span>
                            </span>
                        </TransitionLink>
                        <h1 className="text-3xl font-black text-foreground mb-2">Recuperar contraseña</h1>
                        <p className="text-slate-500 dark:text-slate-400">Ingresa tu email y te enviaremos las instrucciones</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500 dark:text-red-400 text-sm">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            {error}
                        </div>
                    )}

                    {status === "success" ? (
                        <div className="text-center animate-in fade-in slide-in-from-bottom-4">
                            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                            </div>
                            <h2 className="text-xl font-bold text-foreground mb-3">¡Correo enviado!</h2>
                            <p className="text-slate-500 dark:text-slate-400 text-sm mb-8">
                                Si existe una cuenta con <strong className="text-foreground">{email}</strong>, recibirás un enlace para restablecer tu contraseña.
                            </p>
                            <TransitionLink
                                href="/login"
                                className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-foreground py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all border border-slate-200 dark:border-slate-700"
                            >
                                <ArrowLeft className="w-5 h-5" />
                                Volver al inicio de sesión
                            </TransitionLink>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="relative group">
                                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Email registrado</label>
                                <div className="flex items-center border-b-2 border-slate-200 dark:border-slate-800 pb-2 focus-within:border-accent transition-colors">
                                    <Mail className="w-5 h-5 text-accent mr-3" />
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="tu@email.com"
                                        className="w-full bg-transparent text-foreground placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={status === "loading" || !email}
                                className="w-full bg-accent text-accent-foreground py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:shadow-[0_0_30px_rgba(56,189,248,0.4)] transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                            >
                                {status === "loading" ? "Enviando enlace..." : "Enviar enlace"}
                                {status !== "loading" && <ArrowRight className="w-5 h-5" />}
                            </button>
                        </form>
                    )}

                    {status !== "success" && (
                        <div className="mt-8 text-center">
                            <TransitionLink href="/login" className="text-slate-500 dark:text-slate-400 text-sm font-medium hover:text-accent transition-colors flex items-center justify-center gap-2">
                                <ArrowLeft className="w-4 h-4" />
                                Volver al inicio de sesión
                            </TransitionLink>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
