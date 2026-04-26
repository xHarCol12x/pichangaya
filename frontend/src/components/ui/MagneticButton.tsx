"use client";

import React, { useRef, useState, ReactNode } from "react";
import { gsap } from "gsap";

interface MagneticButtonProps {
    children: ReactNode;
    className?: string;
}

export default function MagneticButton({ children, className }: MagneticButtonProps) {
    const buttonRef = useRef<HTMLDivElement>(null);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!buttonRef.current) return;
        const { clientX, clientY } = e;
        const rect = buttonRef.current.getBoundingClientRect();
        
        const x = clientX - (rect.left + rect.width / 2);
        const y = clientY - (rect.top + rect.height / 2);

        gsap.to(buttonRef.current, {
            x: x * 0.3,
            y: y * 0.3,
            duration: 0.5,
            ease: "power2.out"
        });
    };

    const handleMouseLeave = () => {
        if (!buttonRef.current) return;
        gsap.to(buttonRef.current, {
            x: 0,
            y: 0,
            duration: 0.5,
            ease: "elastic.out(1, 0.3)"
        });
    };

    return (
        <div
            ref={buttonRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className={className}
        >
            {children}
        </div>
    );
}
