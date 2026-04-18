"use client";

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface CustomSelectProps {
    value: string;
    onChange: (value: string) => void;
    options: string[];
    label?: string;
    className?: string;
}

export default function CustomSelect({ value, onChange, options, label, className = "" }: CustomSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            {label && (
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    {label}
                </label>
            )}

            <button
                type="button"
                className="w-full flex items-center justify-between bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3.5 text-slate-900 dark:text-white focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all group"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="truncate">{value || "Seleccionar..."}</span>
                <ChevronDown className={`w-4 h-4 text-slate-400 group-hover:text-accent transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {isOpen && (
                <div className="absolute z-50 w-full mt-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl shadow-lg dark:shadow-none overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="max-h-60 overflow-y-auto py-1 custom-scrollbar">
                        {options.map((option) => (
                            <button
                                key={option}
                                type="button"
                                className={`w-full text-left px-4 py-2.5 flex items-center justify-between text-sm transition-colors
                                    ${value === option
                                        ? 'bg-accent/10 dark:bg-accent/20 text-accent font-medium'
                                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'
                                    }`}
                                onClick={() => {
                                    onChange(option);
                                    setIsOpen(false);
                                }}
                            >
                                <span className="truncate">{option}</span>
                                {value === option && <Check className="w-4 h-4 text-accent flex-shrink-0" />}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
