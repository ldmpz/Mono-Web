"use client";

import { useRef } from "react";
import styles from "./Services.module.css";
import { Bot, Brain, Workflow, Check } from "lucide-react";
import { motion, useInView } from "framer-motion";

export interface WebService {
    id: string;
    title: string;
    price: string;
    icon: string;
    features: string[];
}

interface ServicesClientProps {
    services: WebService[];
}

const iconMap: Record<string, React.ReactNode> = {
    'Brain': <Brain size={32} />,
    'Bot': <Bot size={32} />,
    'Workflow': <Workflow size={32} />
};

export default function ServicesClient({ services }: ServicesClientProps) {
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
                            key={service.id}
                            className={styles.card}
                            initial={{ opacity: 0, y: 40 }}
                            animate={isInView ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.5, delay: index * 0.1 + 0.3 }}
                        >
                            {/* Floating Icon */}
                            <div className={styles.floatingIconWrapper}>
                                <div className={styles.iconCircle}>
                                    {iconMap[service.icon] || <Bot size={32} />}
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
