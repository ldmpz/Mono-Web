"use client";

import styles from "./Methodology.module.css";
import { motion } from "framer-motion";

const steps = [
    {
        order: "01",
        title: "Diagnóstico",
        desc: "Análisis profundo de sus procesos actuales e identificación de cuellos de botella."
    },
    {
        order: "02",
        title: "Arquitectura",
        desc: "Diseño de soluciones personalizadas y selección de modelos de IA óptimos."
    },
    {
        order: "03",
        title: "Implementación",
        desc: "Desarrollo e integración ágil con sus sistemas existentes sin interrumpir operaciones."
    },
    {
        order: "04",
        title: "Escalamiento",
        desc: "Optimización continua basada en datos reales para maximizar el ROI."
    }
];

export default function Methodology() {
    return (
        <section id="methodology" className={styles.section}>
            <div className="container">
                <div className={styles.header}>
                    <h2 className={`heading-lg ${styles.title}`}>Metodología de <span className="text-gradient">Impacto</span></h2>
                    <p className="text-secondary">Un enfoque estructurado y probado para garantizar resultados tangibles.</p>
                </div>

                <div className={styles.timeline}>
                    {steps.map((step, index) => (
                        <motion.div
                            key={index}
                            className={styles.step}
                            initial="off"
                            whileInView="on"
                            viewport={{ once: false, amount: 0.5, margin: "-50px" }} // Triggers on/off as you scroll
                            transition={{ duration: 0.5 }} // Faster transition for responsiveness
                        >
                            <motion.div
                                className={styles.stepNumber}
                                variants={{
                                    off: {
                                        borderColor: "rgba(13, 59, 102, 1)",
                                        backgroundColor: "#0B0F14",
                                        color: "#1F6BFF",
                                        boxShadow: "0 0 0 rgba(0,0,0,0)",
                                        scale: 1
                                    },
                                    on: {
                                        borderColor: "#1F6BFF",
                                        backgroundColor: "rgba(13, 59, 102, 1)",
                                        color: "#fff",
                                        boxShadow: "0 0 30px rgba(31, 107, 255, 0.6)",
                                        scale: 1.15,
                                        transition: { duration: 1.5, ease: "easeOut" } // specific transition for properties
                                    }
                                }}
                            >
                                {step.order}
                            </motion.div>
                            <h3 className={styles.stepTitle}>{step.title}</h3>
                            <p className={styles.stepDesc}>{step.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
