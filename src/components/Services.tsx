"use client";

import { useRef } from "react";
import styles from "./Services.module.css";
import { Bot, Brain, Workflow, Check } from "lucide-react";
import { motion, useInView } from "framer-motion";

const services = [
    {
        title: "Diagnóstico & Roadmap",
        price: "$2,500 MXN",
        icon: <Brain size={32} />,
        features: [
            "Auditoría de Procesos Actuales",
            "Identificación de Oportunidades IA",
            "Plan de Implementación Paso a Paso",
            "Estimación de ROI y Costos",
            "Sesión de Estrategia (2 Horas)"
        ]
    },
    {
        title: "Agentes Inteligentes",
        price: "Desde $8,000 MXN",
        icon: <Bot size={32} />,
        features: [
            "Chatbots de Atención al Cliente 24/7",
            "Asistentes de Ventas y Lead Gen",
            "Integración con WhatsApp/CRM",
            "Entrenamiento con Datos Propios",
            "Soporte y Mantenimiento Mensual"
        ]
    },
    {
        title: "Ecosistema Total",
        price: "A Medida",
        icon: <Workflow size={32} />,
        features: [
            "Automatización de Flujos Complejos",
            "Conexión de Múltiples Agentes",
            "Dashboards de Control en Tiempo Real",
            "Infraestructura Escalable en Nube",
            "Desarrollo de Software a Medida"
        ]
    }
];

export default function Services() {
    const sectionRef = useRef(null);
    const isInView = useInView(sectionRef, { once: true, amount: 0.1 });

    return (
        <section id="services" className={styles.servicesSection} ref={sectionRef}>
            <div className={styles.container}>
                {/* Header Banner */}
                <motion.div
                    className={styles.headerBanner}
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6 }}
                >
                    <div className={styles.floatingBadge}>
                        ¡Potencia tu Negocio!
                    </div>
                    <h2 className={styles.bannerTitle}>
                        Soluciones de IA<br />
                        <span style={{ color: "var(--accent-primary)" }}>Diseñadas para Ti</span>
                    </h2>
                    <p className={styles.bannerSubtitle}>
                        No dejes que la competencia te supere. Implementa tecnología de vanguardia
                        hoy mismo y transforma tus operaciones en motores de crecimiento.
                    </p>
                </motion.div>

                {/* Services Grid */}
                <div className={styles.grid}>
                    {services.map((service, index) => (
                        <motion.div
                            key={index}
                            className={styles.card}
                            initial={{ opacity: 0, y: 40 }}
                            animate={isInView ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.5, delay: index * 0.1 + 0.3 }}
                        >
                            {/* Floating Icon */}
                            <div className={styles.floatingIconWrapper}>
                                <div className={styles.iconCircle}>
                                    {service.icon}
                                </div>
                            </div>

                            <h3 className={styles.cardTitle}>{service.title}</h3>
                            <div className={styles.priceTag}>{service.price}</div>

                            <div className={styles.divider} />

                            <ul className={styles.featureList}>
                                {service.features.map((feature, i) => (
                                    <li key={i} className={styles.featureItem}>
                                        <Check size={18} className={styles.checkIcon} />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
