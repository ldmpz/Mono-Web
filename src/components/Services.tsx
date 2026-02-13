"use client";

import { useRef, useState } from "react";
import { motion, useScroll, useTransform, useSpring, useMotionValueEvent } from "framer-motion";
import { Workflow, Bot, Activity, Layers, ArrowRight } from "lucide-react";
import styles from "./Services.module.css";

const services = [
    {
        title: "Automatización Inteligente",
        description: "Optimizamos flujos operativos complejos mediante orquestación de procesos y lógica avanzada de IA.",
        icon: <Workflow size={24} strokeWidth={1.5} />,
        color: "#818cf8", // Indigo
        glow: "rgba(129, 140, 248, 0.4)"
    },
    {
        title: "Agentes IA de Élite",
        description: "Desarrollo de asistentes autónomos capaces de razonamiento lógico y ejecución de tareas complejas 24/7.",
        icon: <Bot size={24} strokeWidth={1.5} />,
        color: "#fb923c", // Orange
        glow: "rgba(251, 146, 60, 0.4)"
    },
    {
        title: "Análisis Predictivo",
        description: "Transformamos datos crudos en inteligencia accionable para anticipar tendencias y maximizar el rendimiento.",
        icon: <Activity size={24} strokeWidth={1.5} />,
        color: "#60a5fa", // Blue
        glow: "rgba(96, 165, 250, 0.4)"
    },
    {
        title: "Ecosistemas Digitales",
        description: "Integraciones profundas que conectan su infraestructura con el futuro de la inteligencia artificial.",
        icon: <Layers size={24} strokeWidth={1.5} />,
        color: "#312e81", // Deep Indigo
        glow: "rgba(49, 46, 129, 0.4)"
    }
];

function ServiceCard({ service, index }: { service: typeof services[0], index: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{
                duration: 0.5,
                delay: index * 0.1,
                ease: "easeOut"
            }}
            viewport={{ once: true, margin: "-100px" }}
            className={styles.card}
        >
            <div className={styles.cardInner}>
                <div
                    className={styles.iconContainer}
                    style={{
                        backgroundColor: service.color,
                    }}
                >
                    <span className={styles.mainIcon}>{service.icon}</span>
                </div>
                <h3 className={styles.cardTitle}>
                    {service.title}
                </h3>
                <p className={styles.cardDescription}>
                    {service.description}
                </p>
                <div className={styles.cardFooter}>
                    <button className={styles.learnMore}>
                        Explorar <ArrowRight size={14} />
                    </button>
                </div>
            </div>
        </motion.div>
    );
}

export default function Services() {
    return (
        <section id="services" className={styles.servicesSection}>
            <div className="container">
                <div className={styles.header}>
                    <motion.span
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        whileInView={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className={styles.tagline}
                    >
                        NUESTRAS SOLUCIONES
                    </motion.span>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
                        className="heading-lg"
                    >
                        Ingeniería de <span className="text-gradient">Siguiente Nivel</span>
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
                        className={styles.subTitle}
                    >
                        Impulsamos su negocio con soluciones de vanguardia en IA y automatización.
                    </motion.p>
                </div>

                <div className={styles.grid}>
                    {services.map((service, index) => (
                        <ServiceCard key={index} service={service} index={index} />
                    ))}
                </div>
            </div>
        </section>
    );
}
