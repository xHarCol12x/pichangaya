"use client";

import React, { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import { ChevronDown, HelpCircle } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const faqs = [
    {
        question: "¿Cuanto tiempo toma configurar mi cuenta?",
        answer:
            "La configuracion inicial toma aproximadamente 5-10 minutos. Solo necesitas registrar tu negocio, agregar tus canchas con sus horarios y precios, y estas listo para recibir reservas. Nuestro equipo de soporte esta disponible para ayudarte en cada paso.",
    },
    {
        question: "¿Como funciona la IA de precios dinamicos?",
        answer:
            "Nuestra IA analiza tus datos historicos de reservas, patrones de demanda por dia y hora, eventos locales y clima para sugerir precios optimos. Puedes aceptar las sugerencias automaticamente o revisarlas manualmente. En promedio, los usuarios ven un aumento del 28% en ingresos.",
    },
    {
        question: "¿Que metodos de pago aceptan mis clientes?",
        answer:
            "PichangaLibre soporta tarjetas de credito/debito (Visa, Mastercard), Yape, Plin, y transferencias bancarias. Los pagos se depositan directamente en tu cuenta bancaria con reportes detallados para tu contador.",
    },
    {
        question: "¿Puedo migrar mis reservas existentes?",
        answer:
            "Si, ofrecemos migracion gratuita de datos. Nuestro equipo puede importar tu historial de reservas desde Excel, Google Sheets, o sistemas anteriores para que la IA tenga datos historicos desde el dia uno.",
    },
    {
        question: "¿Hay algun contrato de permanencia?",
        answer:
            "No, todos nuestros planes son mensuales sin contrato de permanencia. Puedes cancelar en cualquier momento desde tu panel de control. Si pagas anualmente, recibes 2 meses gratis y puedes solicitar reembolso proporcional.",
    },
    {
        question: "¿Ofrecen soporte tecnico?",
        answer:
            "Si, todos los planes incluyen soporte por chat y email. Los planes Pro y Enterprise tienen soporte prioritario con tiempos de respuesta garantizados de menos de 2 horas, mas un gerente de cuenta dedicado para Enterprise.",
    },
];

const FAQItem = ({
    faq,
    isOpen,
    onClick,
    index,
}: {
    faq: (typeof faqs)[0];
    isOpen: boolean;
    onClick: () => void;
    index: number;
}) => {
    const contentRef = useRef<HTMLDivElement>(null);
    const answerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!contentRef.current || !answerRef.current) return;

        if (isOpen) {
            gsap.to(contentRef.current, {
                height: answerRef.current.offsetHeight,
                opacity: 1,
                duration: 0.4,
                ease: "power2.out",
            });
        } else {
            gsap.to(contentRef.current, {
                height: 0,
                opacity: 0,
                duration: 0.3,
                ease: "power2.in",
            });
        }
    }, [isOpen]);

    return (
        <div
            className={`faq-item glass rounded-2xl overflow-hidden transition-all duration-300 ${isOpen ? "border-accent/30" : "border-border hover:border-accent/20"
                }`}
        >
            <button
                onClick={onClick}
                className="w-full flex items-center justify-between p-6 text-left"
                aria-expanded={isOpen}
            >
                <div className="flex items-center gap-4">
                    <span className="text-accent/40 font-mono text-sm">
                        0{index + 1}
                    </span>
                    <h4 className="text-foreground font-bold text-lg pr-4">
                        {faq.question}
                    </h4>
                </div>
                <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 ${isOpen ? "bg-accent text-accent-foreground rotate-180" : "bg-foreground/5 text-foreground/60"
                        }`}
                >
                    <ChevronDown className="w-5 h-5" />
                </div>
            </button>

            <div ref={contentRef} className="h-0 opacity-0 overflow-hidden">
                <div ref={answerRef} className="px-6 pb-6 pl-16">
                    <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                        {faq.answer}
                    </p>
                </div>
            </div>
        </div>
    );
};

const FAQSection = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(0);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from(".faq-header", {
                scrollTrigger: {
                    trigger: containerRef.current,
                    start: "top 80%",
                    toggleActions: "play reverse play reverse",
                },
                y: 30,
                opacity: 0,
                duration: 0.8,
                ease: "power3.out",
            });

            gsap.from(".faq-item", {
                scrollTrigger: {
                    trigger: containerRef.current,
                    start: "top 70%",
                    toggleActions: "play reverse play reverse",
                },
                y: 40,
                opacity: 0,
                stagger: 0.1,
                duration: 0.8,
                ease: "power3.out",
            });
        }, containerRef);

        return () => ctx.revert();
    }, []);

    return (
        <section
            ref={containerRef}
            id="faq"
            className="py-24 px-6 bg-background relative overflow-hidden transition-colors duration-300"
        >
            {/* Background Elements */}
            <div className="absolute top-1/4 right-0 w-96 h-96 bg-accent/5 rounded-full blur-[120px] -z-10" />

            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="faq-header text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-foreground/5 border border-border mb-6">
                        <HelpCircle className="w-4 h-4 text-accent" />
                        <span className="text-foreground/60 text-xs font-bold uppercase tracking-widest">
                            Preguntas Frecuentes
                        </span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black text-foreground mb-6">
                        Resolvemos tus <span className="text-gradient">dudas</span>
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl mx-auto">
                        Todo lo que necesitas saber antes de empezar con PichangaLibre
                    </p>
                </div>

                {/* FAQ Items */}
                <div className="space-y-4">
                    {faqs.map((faq, index) => (
                        <FAQItem
                            key={index}
                            faq={faq}
                            index={index}
                            isOpen={openIndex === index}
                            onClick={() =>
                                setOpenIndex(openIndex === index ? null : index)
                            }
                        />
                    ))}
                </div>

                {/* Contact CTA */}
                <div className="mt-12 text-center">
                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                        ¿No encuentras lo que buscas?{" "}
                        <a
                            href="mailto:adminpichangalibre@pichangalibre.xyz"
                            className="text-accent font-bold hover:underline"
                        >
                            Contactanos directamente
                        </a>
                    </p>
                </div>
            </div>
        </section>
    );
};

export default FAQSection;
