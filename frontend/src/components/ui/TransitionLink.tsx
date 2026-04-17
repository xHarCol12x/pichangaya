"use client";

import React from 'react';
import Link from 'next/link';
import { useTransition } from './TransitionOverlay';

interface TransitionLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
    href: string;
    children: React.ReactNode;
    className?: string;
}

const TransitionLink = ({ href, children, className, onClick, ...props }: TransitionLinkProps) => {
    const { navigateWithTransition } = useTransition();

    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        // Ejecutamos onClick provisto (si existe)
        if (onClick) onClick(e);

        // Prevenimos la navegación nativa solo si es a la misma pestaña
        if (!props.target || props.target !== "_blank") {
            e.preventDefault();
            navigateWithTransition(href);
        }
    };

    return (
        <Link href={href} className={className} onClick={handleClick} {...props}>
            {children}
        </Link>
    );
};

export default TransitionLink;
