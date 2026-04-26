import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FieldMiniMapProps {
    type: string;
    surface: string;
}

const FieldMiniMap: React.FC<FieldMiniMapProps> = ({ type, surface }) => {
    // Definimos las posiciones de los jugadores según el tipo de campo
    // Todos los valores son porcentajes (0-100) relativos al campo
    const getFormation = (fieldType: string) => {
        const typeNormalized = fieldType.toLowerCase();

        if (typeNormalized.includes('5')) { // Fútbol 5 (1-2-1)
            return [
                // Equipo Local (Izquierda)
                { id: 'l1', x: 10, y: 50 }, // Portero
                { id: 'l2', x: 25, y: 30 }, // Defensa
                { id: 'l3', x: 25, y: 70 }, // Defensa
                { id: 'l4', x: 45, y: 50 }, // Medio
                { id: 'l5', x: 45, y: 20 }, // Delantero

                // Equipo Visitante (Derecha)
                { id: 'v1', x: 90, y: 50 },
                { id: 'v2', x: 75, y: 30 },
                { id: 'v3', x: 75, y: 70 },
                { id: 'v4', x: 55, y: 50 },
                { id: 'v5', x: 55, y: 80 },
            ];
        }
        if (typeNormalized.includes('7')) { // Fútbol 7 (1-3-2)
            return [
                // Local
                { id: 'l1', x: 8, y: 50 },
                { id: 'l2', x: 25, y: 20 },
                { id: 'l3', x: 20, y: 50 },
                { id: 'l4', x: 25, y: 80 },
                { id: 'l5', x: 40, y: 35 },
                { id: 'l6', x: 40, y: 65 },
                { id: 'l7', x: 48, y: 50 },
                // Visitante
                { id: 'v1', x: 92, y: 50 },
                { id: 'v2', x: 75, y: 20 },
                { id: 'v3', x: 80, y: 50 },
                { id: 'v4', x: 75, y: 80 },
                { id: 'v5', x: 60, y: 35 },
                { id: 'v6', x: 60, y: 65 },
                { id: 'v7', x: 52, y: 50 },
            ];
        }
        if (typeNormalized.includes('11')) { // Fútbol 11 (1-4-3-3)
            return [
                // Local
                { id: 'l1', x: 5, y: 50 },
                { id: 'l2', x: 18, y: 15 },
                { id: 'l3', x: 15, y: 38 },
                { id: 'l4', x: 15, y: 62 },
                { id: 'l5', x: 18, y: 85 },
                { id: 'l6', x: 30, y: 50 },
                { id: 'l7', x: 35, y: 25 },
                { id: 'l8', x: 35, y: 75 },
                { id: 'l9', x: 45, y: 15 },
                { id: 'l10', x: 48, y: 50 },
                { id: 'l11', x: 45, y: 85 },
                // Visitante
                { id: 'v1', x: 95, y: 50 },
                { id: 'v2', x: 82, y: 15 },
                { id: 'v3', x: 85, y: 38 },
                { id: 'v4', x: 85, y: 62 },
                { id: 'v5', x: 82, y: 85 },
                { id: 'v6', x: 70, y: 50 },
                { id: 'v7', x: 65, y: 25 },
                { id: 'v8', x: 65, y: 75 },
                { id: 'v9', x: 55, y: 15 },
                { id: 'v10', x: 52, y: 50 },
                { id: 'v11', x: 55, y: 85 },
            ];
        }
        if (typeNormalized.includes('vóley') || typeNormalized.includes('voley')) { // Vóley (6 vs 6)
            return [
                // Local
                { id: 'l1', x: 35, y: 25 },
                { id: 'l2', x: 45, y: 50 },
                { id: 'l3', x: 35, y: 75 },
                { id: 'l4', x: 20, y: 25 },
                { id: 'l5', x: 10, y: 50 },
                { id: 'l6', x: 20, y: 75 },
                // Visitante
                { id: 'v1', x: 65, y: 25 },
                { id: 'v2', x: 55, y: 50 },
                { id: 'v3', x: 65, y: 75 },
                { id: 'v4', x: 80, y: 25 },
                { id: 'v5', x: 90, y: 50 },
                { id: 'v6', x: 80, y: 75 },
            ];
        }
        if (typeNormalized.includes('básquet') || typeNormalized.includes('basquet')) { // 5 vs 5
            return [
                // Local
                { id: 'l1', x: 10, y: 50 },
                { id: 'l2', x: 30, y: 25 },
                { id: 'l3', x: 30, y: 75 },
                { id: 'l4', x: 40, y: 40 },
                { id: 'l5', x: 40, y: 60 },
                // Visitante
                { id: 'v1', x: 90, y: 50 },
                { id: 'v2', x: 70, y: 25 },
                { id: 'v3', x: 70, y: 75 },
                { id: 'v4', x: 60, y: 40 },
                { id: 'v5', x: 60, y: 60 },
            ];
        }
        if (typeNormalized.includes('tenis')) { // Tenis
            return [
                { id: 'l1', x: 15, y: 50 },
                { id: 'v1', x: 85, y: 50 },
            ];
        }
        if (typeNormalized.includes('pádel') || typeNormalized.includes('padel')) { // Padel (2 vs 2)
            return [
                { id: 'l1', x: 20, y: 35 },
                { id: 'l2', x: 20, y: 65 },
                { id: 'v1', x: 80, y: 35 },
                { id: 'v2', x: 80, y: 65 },
            ];
        }

        return []; // Por defecto vacío
    };

    const formation = getFormation(type);
    // Normalize: strip accents so 'Vóley', 'Básquet', 'Pádel' all match correctly
    const typeLower = type
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
    const isVolleyball = typeLower.includes('voley') || typeLower.includes('volei');
    const isBasketball = typeLower.includes('basquet') || typeLower.includes('basket');
    const isTennis = typeLower.includes('tenis') || typeLower.includes('tennis');
    const isPadel = typeLower.includes('padel');

    // Estilos basados en la superficie
    const getSurfaceStyles = () => {
        const surfaceNormalized = surface.toLowerCase();
        if (surfaceNormalized.includes('sintético') || surfaceNormalized.includes('sintetico')) {
            return {
                bg: "bg-emerald-950/40",
                border: "border-emerald-500/30",
                line: "border-emerald-500/20 text-emerald-500/20",
                glow: "shadow-[0_0_30px_rgba(16,185,129,0.15)]",
                dotLocal: "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]",
                dotAway: "bg-slate-400"
            };
        }
        if (surfaceNormalized.includes('natural')) {
            return {
                bg: "bg-green-950/40",
                border: "border-green-500/30",
                line: "border-green-500/20 text-green-500/20",
                glow: "shadow-[0_0_30px_rgba(34,197,94,0.15)]",
                dotLocal: "bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]",
                dotAway: "bg-slate-400"
            };
        }
        if (surfaceNormalized.includes('losa') || surfaceNormalized.includes('cemento')) {
            return {
                bg: "bg-slate-900/60",
                border: "border-slate-500/30",
                line: "border-slate-500/30 text-slate-500/30",
                glow: "shadow-[0_0_30px_rgba(148,163,184,0.1)]",
                dotLocal: "bg-accent shadow-[0_0_8px_rgba(56,189,248,0.8)]",
                dotAway: "bg-slate-500"
            };
        }
        if (surfaceNormalized.includes('arena')) {
            return {
                bg: "bg-orange-950/30",
                border: "border-orange-500/30",
                line: "border-orange-500/20 text-orange-500/20",
                glow: "shadow-[0_0_30px_rgba(249,115,22,0.1)]",
                dotLocal: "bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.8)]",
                dotAway: "bg-slate-400"
            };
        }
        if (surfaceNormalized.includes('parquet') || surfaceNormalized.includes('madera')) {
            return {
                bg: "bg-[#451a03]/40", // Dark Brown/Burnt Orange for wood
                border: "border-orange-700/50",
                line: "border-orange-500/30 text-orange-500/30",
                glow: "shadow-[0_0_40px_rgba(249,115,22,0.1)]",
                dotLocal: "bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.8)]",
                dotAway: "bg-slate-300"
            };
        }
        if (surfaceNormalized.includes('arcilla') || surfaceNormalized.includes('polvo')) {
            return {
                bg: "bg-red-950/40", // Clay Red
                border: "border-red-600/40",
                line: "border-red-500/20 text-red-500/20",
                glow: "shadow-[0_0_30px_rgba(239,68,68,0.1)]",
                dotLocal: "bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.8)]",
                dotAway: "bg-slate-400"
            };
        }
        if (isTennis || isPadel || surfaceNormalized.includes('hardcourt') || surfaceNormalized.includes('azul')) {
            return {
                bg: "bg-blue-950/40", // Blue Hardcourt (like Australian Open or Padel Pro Tour)
                border: "border-blue-500/40",
                line: "border-blue-400/30 text-blue-400/30",
                glow: "shadow-[0_0_30px_rgba(59,130,246,0.15)]",
                dotLocal: "bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]",
                dotAway: "bg-slate-400"
            };
        }

        // Default premium look
        return {
            bg: "bg-[#0e0e0e]",
            border: "border-[#484847]/30",
            line: "border-[#cafd00]/20 text-[#cafd00]/20",
            glow: "shadow-[0_0_40px_rgba(202,253,0,0.05)]",
            dotLocal: "bg-[#cafd00] shadow-[0_0_10px_rgba(202,253,0,0.8)]",
            dotAway: "bg-[#adaaaa]"
        };
    };

    const styles = getSurfaceStyles();

    return (
        <div className="relative w-full aspect-[1.8/1] max-w-2xl mx-auto flex items-center justify-center p-4">
            {/* The Pitch */}
            <div className={`relative w-full h-full rounded-xl border-2 ${styles.border} ${styles.bg} ${styles.glow} overflow-hidden transition-all duration-700`}>

                {/* Field Markings */}
                {isVolleyball ? (
                    // Volleyball Court Lines — correct layout:
                    // Outer boundary + center net + 3m attack lines on each side
                    <div className={`absolute inset-4 border-2 ${styles.line} rounded-sm pointer-events-none`}>
                        {/* Center Net */}
                        <div className={`absolute top-0 bottom-0 left-1/2 -ml-[2px] w-[4px] bg-current opacity-70`} />
                        {/* Attack line — Local side (3m from net ≈ 25% of court width) */}
                        <div className={`absolute top-0 bottom-0 left-[25%] border-l-2 ${styles.line}`} />
                        {/* Attack line — Away side */}
                        <div className={`absolute top-0 bottom-0 right-[25%] border-r-2 ${styles.line}`} />
                        {/* Back zone shading: subtle depth */}
                        <div className={`absolute top-0 bottom-0 left-0 w-[25%] bg-current opacity-[0.03]`} />
                        <div className={`absolute top-0 bottom-0 right-0 w-[25%] bg-current opacity-[0.03]`} />
                    </div>
                ) : isBasketball ? (
                    // Basketball Court Lines
                    <div className={`absolute inset-4 border-2 ${styles.line} rounded-sm pointer-events-none`}>
                        {/* Halfway line */}
                        <div className={`absolute top-0 bottom-0 left-1/2 -ml-[1px] w-[2px] bg-current opacity-50`} />
                        {/* Center Circle */}
                        <div className={`absolute top-1/2 left-1/2 -mt-8 -ml-8 w-16 h-16 border-2 ${styles.line} rounded-full`} />

                        {/* Painted Area / Key (Local) */}
                        <div className={`absolute top-[25%] bottom-[25%] left-0 w-24 border-2 border-l-0 ${styles.line}`} />
                        {/* 3 point line (Local) arc */}
                        <div className={`absolute -top-4 -bottom-4 left-0 w-40 border-2 ${styles.line} rounded-r-full border-l-0`} style={{ clipPath: 'inset(10% 0 10% 0)' }} />

                        {/* Painted Area / Key (Away) */}
                        <div className={`absolute top-[25%] bottom-[25%] right-0 w-24 border-2 border-r-0 ${styles.line}`} />
                        {/* 3 point line (Away) arc */}
                        <div className={`absolute -top-4 -bottom-4 right-0 w-40 border-2 ${styles.line} rounded-l-full border-r-0`} style={{ clipPath: 'inset(10% 0 10% 0)' }} />
                    </div>
                ) : isTennis || isPadel ? (
                    // Tennis / Padel Court Lines
                    <div className={`absolute ${isPadel ? 'inset-6' : 'inset-4'} border-2 ${styles.line} rounded-sm pointer-events-none`}>
                        {/* Net (Halfway) */}
                        <div className={`absolute top-0 bottom-0 left-1/2 -ml-[1px] w-[2px] ${styles.dotLocal} shadow-none opacity-80`} />

                        {/* Doubles Alleys (if tennis) */}
                        {!isPadel && (
                            <>
                                <div className={`absolute top-8 left-0 right-0 h-[2px] ${styles.line}`} />
                                <div className={`absolute bottom-8 left-0 right-0 h-[2px] ${styles.line}`} />
                            </>
                        )}

                        {/* Service Lines */}
                        <div className={`absolute top-[15%] bottom-[15%] left-[25%] w-[2px] ${styles.line}`} />
                        <div className={`absolute top-[15%] bottom-[15%] right-[25%] w-[2px] ${styles.line}`} />

                        {/* Center Service Line */}
                        <div className={`absolute top-1/2 left-[25%] right-[25%] h-[2px] -mt-[1px] ${styles.line}`} />

                        {/* Padel Walls Representation */}
                        {isPadel && (
                            <div className={`absolute -inset-2 border-4 ${styles.line} opacity-50 rounded-lg pointer-events-none`} />
                        )}
                    </div>
                ) : (
                    // Soccer Field Lines
                    <div className={`absolute inset-4 border-2 ${styles.line} rounded-lg pointer-events-none`}>
                        {/* Halfway line */}
                        <div className={`absolute top-0 bottom-0 left-1/2 -ml-[1px] w-[2px] bg-current opacity-50`} />
                        {/* Center Circle */}
                        <div className={`absolute top-1/2 left-1/2 -mt-10 -ml-10 w-20 h-20 border-2 ${styles.line} rounded-full`} />
                        <div className="absolute top-1/2 left-1/2 -mt-1 -ml-1 w-2 h-2 rounded-full bg-current opacity-50" />

                        {/* Penalty Areas */}
                        <div className={`absolute top-1/2 left-0 -mt-16 w-24 h-32 border-2 border-l-0 ${styles.line}`} />
                        <div className={`absolute top-1/2 right-0 -mt-16 w-24 h-32 border-2 border-r-0 ${styles.line}`} />

                        {/* Goal Areas */}
                        <div className={`absolute top-1/2 left-0 -mt-8 w-12 h-16 border-2 border-l-0 ${styles.line}`} />
                        <div className={`absolute top-1/2 right-0 -mt-8 w-12 h-16 border-2 border-r-0 ${styles.line}`} />

                        {/* Arc */}
                        <div className={`absolute top-1/2 left-24 -mt-6 w-12 h-12 border-2 ${styles.line} rounded-full rounded-l-none border-l-0`} style={{ clipPath: 'inset(0 0 0 50%)' }} />
                        <div className={`absolute top-1/2 right-24 -mt-6 w-12 h-12 border-2 ${styles.line} rounded-full rounded-r-none border-r-0`} style={{ clipPath: 'inset(0 50% 0 0)' }} />
                    </div>
                )}

                {/* Players */}
                <AnimatePresence>
                    {formation.map((player) => (
                        <motion.div
                            key={`${type}-${player.id}`}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1, x: '-50%', y: '-50%' }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                            style={{ left: `${player.x}%`, top: `${player.y}%` }}
                            className={`absolute w-3 h-3 rounded-full ${player.id.startsWith('l') ? styles.dotLocal : styles.dotAway}`}
                        />
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default FieldMiniMap;
