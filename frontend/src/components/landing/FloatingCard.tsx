"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface FloatingCardProps {
    children: React.ReactNode;
    className?: string;
    delay?: number;
}

const FloatingCard = ({ children, className, delay = 0 }: FloatingCardProps) => {
    return (
        <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay }}
            className={className}
        >
            <motion.div
                animate={{
                    y: [0, -10, 0],
                }}
                transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: delay * 0.5,
                }}
                className={cn(
                    "glass p-4 rounded-2xl shadow-2xl flex items-center gap-4",
                    "hover:border-accent/40 transition-colors duration-500"
                )}
            >
                {children}
            </motion.div>
        </motion.div>
    );
};

export default FloatingCard;
