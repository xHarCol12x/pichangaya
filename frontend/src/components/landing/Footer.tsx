"use client";

import React from "react";
import Link from "next/link";
import { Activity, Github, Twitter, Linkedin, Mail, MapPin, Phone } from "lucide-react";

const Footer = () => {
    return (
        <footer className="py-20 px-6 border-t border-border relative overflow-hidden transition-colors duration-300">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent" />

            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                <div className="space-y-6">
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center group-hover:rotate-6 transition-transform">
                            <Activity className="text-accent-foreground w-5 h-5" />
                        </div>
                        <span className="text-xl font-bold tracking-tight text-foreground">
                            Field<span className="text-accent">IQ</span>
                        </span>
                    </Link>
                    <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                        La plataforma definitiva para la gestión inteligente de centros deportivos. Elevamos tu club al siguiente nivel con IA.
                    </p>
                    <div className="flex gap-4">
                        <a href="#" className="w-10 h-10 glass flex items-center justify-center rounded-xl text-slate-500 dark:text-slate-400 hover:text-accent hover:border-accent/40 transition-all">
                            <Twitter className="w-5 h-5" />
                        </a>
                        <a href="#" className="w-10 h-10 glass flex items-center justify-center rounded-xl text-slate-500 dark:text-slate-400 hover:text-accent hover:border-accent/40 transition-all">
                            <Linkedin className="w-5 h-5" />
                        </a>
                        <a href="#" className="w-10 h-10 glass flex items-center justify-center rounded-xl text-slate-500 dark:text-slate-400 hover:text-accent hover:border-accent/40 transition-all">
                            <Mail className="w-5 h-5" />
                        </a>
                    </div>
                </div>

                <div>
                    <h5 className="text-foreground font-bold mb-6">Producto</h5>
                    <ul className="space-y-4">
                        {["Características", "Cómo Funciona", "IA Predictiva", "Precios", "API"].map((item) => (
                            <li key={item}>
                                <Link href="#" className="text-slate-500 dark:text-slate-400 text-sm hover:text-accent transition-colors">
                                    {item}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>

                <div>
                    <h5 className="text-foreground font-bold mb-6">Compañía</h5>
                    <ul className="space-y-4">
                        {["Sobre Nosotros", "Blog", "Carreras", "Prensa", "Contacto"].map((item) => (
                            <li key={item}>
                                <Link href="#" className="text-slate-500 dark:text-slate-400 text-sm hover:text-accent transition-colors">
                                    {item}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>

                <div>
                    <h5 className="text-foreground font-bold mb-6">Contacto</h5>
                    <ul className="space-y-4">
                        <li className="flex items-start gap-3 text-sm text-slate-500 dark:text-slate-400">
                            <MapPin className="w-5 h-5 text-accent shrink-0" />
                            <span>Av. Javier Prado Este 1234, Lima, Perú</span>
                        </li>
                        <li className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                            <Phone className="w-5 h-5 text-accent shrink-0" />
                            <span>+51 987 654 321</span>
                        </li>
                        <li className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                            <Mail className="w-5 h-5 text-accent shrink-0" />
                            <span>hola@fieldiq.com</span>
                        </li>
                    </ul>
                </div>
            </div>

            <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-6">
                <p className="text-slate-500 dark:text-slate-400 text-xs">
                    © {new Date().getFullYear()} FieldIQ. Todos los derechos reservados.
                </p>
                <div className="flex gap-8">
                    <Link href="#" className="text-slate-500 text-xs hover:text-accent">Términos y Condiciones</Link>
                    <Link href="#" className="text-slate-500 text-xs hover:text-accent">Política de Privacidad</Link>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
