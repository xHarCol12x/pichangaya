"use client";

import React, { useState, useEffect } from "react";

interface AuthCarouselProps {
    images: {
        src: string;
        title: React.ReactNode;
        subtitle: string;
    }[];
    fadeDirection?: "left" | "right";
}

const AuthCarousel: React.FC<AuthCarouselProps> = ({ images, fadeDirection = "right" }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (!images || images.length === 0) return;

        const interval = setInterval(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
        }, 5000);

        return () => clearInterval(interval);
    }, [images]);

    if (!images || images.length === 0) return null;

    return (
        <div className="relative w-full h-full overflow-hidden flex flex-col justify-end">
            {images.map((image, index) => (
                <div
                    key={index}
                    className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentIndex ? "opacity-100" : "opacity-0"
                        }`}
                >
                    <div
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: `url(${image.src})` }}
                    />
                    {/* Gradient overlay to make text readable */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
                </div>
            ))}

            {/* Gradient mask to blur the edge with the background */}
            {fadeDirection === "right" ? (
                <div className="absolute inset-y-0 right-0 w-32 md:w-48 bg-gradient-to-r from-transparent to-background z-0 pointer-events-none" />
            ) : (
                <div className="absolute inset-y-0 left-0 w-32 md:w-48 bg-gradient-to-l from-transparent to-background z-0 pointer-events-none" />
            )}
            <div className="relative z-10 p-12 w-full max-w-xl">
                <div className="min-h-[140px] relative">
                    {images.map((image, index) => (
                        <div
                            key={index}
                            className={`absolute bottom-0 left-0 transition-all duration-700 transform ${index === currentIndex
                                ? "opacity-100 translate-y-0"
                                : "opacity-0 translate-y-4 pointer-events-none"
                                }`}
                        >
                            <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
                                {image.title}
                            </h2>
                            <p className="text-lg text-slate-300">
                                {image.subtitle}
                            </p>
                        </div>
                    ))}
                </div>

                <div className="flex items-center gap-2 mt-8">
                    {images.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentIndex(index)}
                            className={`h-2 rounded-full transition-all duration-300 ${index === currentIndex
                                ? "w-8 bg-accent"
                                : "w-2 bg-slate-600 hover:bg-slate-500"
                                }`}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AuthCarousel;
