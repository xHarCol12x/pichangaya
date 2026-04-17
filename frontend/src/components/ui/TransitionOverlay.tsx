"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Activity } from 'lucide-react';

interface TransitionContextType {
    navigateWithTransition: (href: string) => void;
}

const TransitionContext = createContext<TransitionContextType>({
    navigateWithTransition: () => { },
});

export const useTransition = () => useContext(TransitionContext);

export const TransitionProvider = ({ children }: { children: ReactNode }) => {
    const [isTransitioning, setIsTransitioning] = useState(false);
    const router = useRouter();

    const navigateWithTransition = (href: string) => {
        setIsTransitioning(true);

        // Simulamos el tiempo de la animación completa antes de navegar
        // La animación dura: Aparición (0.2s) + Latidos (0.6s) + Expansión (0.4s) = 1.2s aprox.
        setTimeout(() => {
            router.push(href);
            // Pequeño delay adicional para dejar que la página cargue y la onda retroceda
            setTimeout(() => {
                setIsTransitioning(false);
            }, 300);
        }, 1200);
    };

    return (
        <TransitionContext.Provider value={{ navigateWithTransition }}>
            {children}
            <AnimatePresence>
                {isTransitioning && (
                    <motion.div
                        className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        {/* Fondo base con efecto Grid (Cuadraditos) */}
                        <div className="absolute inset-0 bg-background/95 backdrop-blur-md overflow-hidden">
                            {/* Grid sutil */}
                            <div
                                className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
                                style={{
                                    backgroundImage: "linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)",
                                    backgroundSize: "60px 60px",
                                }}
                            />
                            {/* Un poco de resplandor para acompañar el logo */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[150px] bg-accent/10 pointer-events-none" />
                        </div>
                        {/* Contenedor central de la animación */}
                        <div className="relative z-10 flex items-center justify-center">
                            {/* Onda expansiva (Gota) */}
                            <motion.div
                                className="absolute w-20 h-20 rounded-full bg-accent/90"
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{
                                    scale: [0, 0, 0, 100], // Espera 3 latidos y luego explota
                                    opacity: [0, 0, 0, 1]
                                }}
                                transition={{
                                    duration: 1.2,
                                    times: [0, 0.4, 0.8, 1],
                                    ease: "circIn"
                                }}
                            />

                            {/* Logo FieldIQ Latiente (Solo Ícono) */}
                            <motion.div
                                className="relative z-20 w-24 h-24 bg-accent rounded-3xl flex items-center justify-center shadow-[0_0_40px_rgba(56,189,248,0.5)]"
                                initial={{ scale: 0, rotate: 0 }}
                                animate={{
                                    scale: [0, 1, 1.2, 1, 1.2, 1, 1.3, 0],
                                    rotate: [0, 0, 12, 0, 12, 0, 24, 0] // Oscila imitando el hover del navbar
                                }}
                                transition={{
                                    duration: 1.2,
                                    times: [0, 0.2, 0.4, 0.5, 0.6, 0.7, 0.8, 1],
                                }}
                            >
                                <Activity className="text-accent-foreground w-14 h-14" />
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </TransitionContext.Provider>
    );
};
