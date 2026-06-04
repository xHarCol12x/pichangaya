"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import TransitionLink from "@/components/ui/TransitionLink";
import { useTransition } from "@/components/ui/TransitionOverlay";
import { Activity, ArrowRight, Lock, Mail, User, AlertCircle, Eye, EyeOff, Phone } from "lucide-react";
import AuthCarousel from "@/components/ui/AuthCarousel";
import api from "@/lib/api";

const RegisterContent = () => {
    const searchParams = useSearchParams();
    const selectedPlan = searchParams.get("plan");
    const [formData, setFormData] = useState({ name: "", email: "", phone: "", password: "" });
    const [error, setError] = useState("");
    const [phoneError, setPhoneError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { navigateWithTransition } = useTransition();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === "phone") {
            // Only allow digits, max 9
            const digits = value.replace(/\D/g, "").slice(0, 9);
            setFormData({ ...formData, phone: digits });
            setPhoneError(digits.length > 0 && digits.length < 9 ? "El número debe tener exactamente 9 dígitos." : "");
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.phone && formData.phone.length !== 9) {
            setPhoneError("El número debe tener exactamente 9 dígitos.");
            return;
        }
        setError("");
        setLoading(true);

        try {
            const response = await api.post("/auth/register", {
                ...formData,
                plan: selectedPlan
            });

            if (response.data.access_token) {
                localStorage.setItem("fieldiq_token", response.data.access_token);
                localStorage.setItem("fieldiq_user", JSON.stringify(response.data.user));

                if (selectedPlan === 'BASIC' || selectedPlan === 'PRO') {
                    navigateWithTransition(`/dashboard/billing?apply_plan=${selectedPlan}`);
                } else {
                    navigateWithTransition("/dashboard");
                }
            }
        } catch (err: any) {
            setError(err.response?.data?.message || "Ocurrió un error al registrarse");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-background">
            {/* Form Column */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 order-2 lg:order-1">
                <div className="w-full max-w-md">
                    <div className="text-center mb-10">
                        <TransitionLink href="/" className="inline-flex items-center gap-2 mb-6 group">
                            <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform shadow-[0_0_20px_rgba(56,189,248,0.3)]">
                                <Activity className="text-accent-foreground w-6 h-6" />
                            </div>
                            <span className="text-2xl font-bold tracking-tight text-foreground">
                                Pichanga<span className="text-accent">Libre</span>
                            </span>
                        </TransitionLink>
                        <h1 className="text-3xl font-black text-foreground mb-2">Crear Cuenta</h1>
                        <p className="text-slate-500 dark:text-slate-400">Comienza a gestionar tu centro ahora mismo.</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500 dark:text-red-400 text-sm">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="relative group">
                            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Nombre Completo</label>
                            <div className="flex items-center border-b-2 border-slate-200 dark:border-slate-800 pb-2 focus-within:border-accent transition-colors">
                                <User className="w-5 h-5 text-accent mr-3" />
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Nombre y Apellido"
                                    className="w-full bg-transparent text-foreground placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none"
                                />
                            </div>
                        </div>

                        <div className="relative group pt-2">
                            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Correo Electrónico</label>
                            <div className="flex items-center border-b-2 border-slate-200 dark:border-slate-800 pb-2 focus-within:border-accent transition-colors">
                                <Mail className="w-5 h-5 text-slate-400 mr-3" />
                                <input
                                    type="email"
                                    name="email"
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="tu@email.com"
                                    className="w-full bg-transparent text-foreground placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none"
                                />
                            </div>
                        </div>

                        {/* Phone */}
                        <div className="relative group pt-2">
                            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Teléfono <span className="text-slate-400 normal-case font-normal">(opcional)</span></label>
                            <div className={`flex items-center border-b-2 pb-2 focus-within:border-accent transition-colors ${phoneError ? "border-red-500/60" : "border-slate-200 dark:border-slate-800"}`}>
                                <Phone className="w-5 h-5 text-slate-400 mr-3 shrink-0" />
                                <span className="text-slate-400 text-sm mr-1 shrink-0">+51</span>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="987 654 321"
                                    maxLength={9}
                                    className="w-full bg-transparent text-foreground placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none tracking-wider"
                                />
                                {formData.phone.length === 9 && (
                                    <span className="text-emerald-500 text-xs font-bold ml-2 shrink-0">✓</span>
                                )}
                            </div>
                            {phoneError && <p className="text-red-500 text-xs mt-1">{phoneError}</p>}
                        </div>

                        {/* Password */}
                        <div className="relative group pt-2">
                            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Contraseña</label>
                            <div className="flex items-center border-b-2 border-slate-200 dark:border-slate-800 pb-2 focus-within:border-accent transition-colors">
                                <Lock className="w-5 h-5 text-slate-400 mr-3 shrink-0" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    required
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    className="w-full bg-transparent text-foreground placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="ml-2 text-slate-400 hover:text-accent transition-colors shrink-0"
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-accent text-accent-foreground py-4 rounded-2xl font-bold hover:shadow-[0_0_30px_rgba(56,189,248,0.4)] transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                        >
                            {loading ? "Creando cuenta..." : "Registrarse"}
                        </button>
                    </form>

                    {/* Social Login Divider */}
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-slate-200 dark:border-slate-800" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase font-medium">
                            <span className="bg-background px-4 text-slate-400">O regístrate con</span>
                        </div>
                    </div>

                    {/* Social Buttons */}
                    <div className="grid grid-cols-2 gap-4">
                        <button type="button" className="flex items-center justify-center gap-2 py-3 border border-slate-200 dark:border-slate-800 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors font-medium text-sm text-foreground">
                            {/* Google SVG */}
                            <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                            Google
                        </button>
                        <button type="button" className="flex items-center justify-center gap-2 py-3 border border-slate-200 dark:border-slate-800 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors font-medium text-sm text-foreground">
                            {/* Facebook SVG */}
                            <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg"><path d="M22.675 0H1.325C.593 0 0 .593 0 1.325v21.351C0 23.407.593 24 1.325 24H12.82v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116c.73 0 1.323-.593 1.323-1.325V1.325C24 .593 23.407 0 22.675 0z" fill="#1877F2" /></svg>
                            Facebook
                        </button>
                    </div>

                    <div className="mt-8 text-center">
                        <p className="text-slate-500 dark:text-slate-400 text-sm">
                            ¿Ya tienes cuenta?{" "}
                            <TransitionLink href="/login" className="text-accent font-bold hover:underline">
                                Iniciar Sesión
                            </TransitionLink>
                        </p>
                    </div>
                </div>
            </div>

            {/* Graphic Column using AuthCarousel */}
            <div className="hidden lg:flex w-1/2 relative bg-slate-950 order-1 lg:order-2">
                <AuthCarousel
                    fadeDirection="left"
                    images={[
                        {
                            src: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1200&auto=format&fit=crop",
                            title: <><span className="text-emerald-400">Automatiza</span> tu complejo</>,
                            subtitle: "Cientos de reservas diarias gestionadas sin fallas. Pasa al siguiente nivel."
                        },
                        {
                            src: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1200&auto=format&fit=crop",
                            title: <><span className="text-accent">Analítica</span> en tiempo real</>,
                            subtitle: "Conoce tus métricas exactas, horas pico y rentabilidad por sede."
                        },
                        {
                            src: "https://images.unsplash.com/photo-1526232761682-d26e03ac148e?q=80&w=1200&auto=format&fit=crop",
                            title: <><span className="text-amber-400">Pagos</span> sin fricción</>,
                            subtitle: "Elimina morosidad automatizando abonos y cobros directamente a tu banco."
                        }
                    ]}
                />
            </div>
        </div>
    );
};

const RegisterPage = () => {
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center"><p className="text-white animate-pulse">Cargando...</p></div>}>
            <RegisterContent />
        </Suspense>
    );
};

export default RegisterPage;
