"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Send, CheckCircle2, AlertCircle, Building2, User, Mail, MessageSquare } from "lucide-react";
import styles from "./ContactForm.module.css";

export default function ContactForm() {
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        company: "",
        message: "",
        revenue: "" // Added to match the leads table column if needed
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus("loading");

        try {
            const response = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                setStatus("success");
                setFormData({ name: "", email: "", company: "", message: "", revenue: "" });
            } else {
                setStatus("error");
            }
        } catch (error) {
            console.error("Error submitting form:", error);
            setStatus("error");
        }
    };

    if (status === "success") {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={styles.successContainer}
            >
                <CheckCircle2 size={64} className={styles.successIcon} />
                <h2 className="heading-lg">¡Mensaje Enviado!</h2>
                <p>Gracias por tu interés. Un estratega de IA se pondrá en contacto contigo en menos de 24 horas.</p>
                <button
                    onClick={() => setStatus("idle")}
                    className="btn-primary"
                    style={{ marginTop: '2rem' }}
                >
                    Enviar otro mensaje
                </button>
            </motion.div>
        );
    }

    return (
        <section id="contact" className={styles.contactSection}>
            <div className="container">
                <div className={styles.grid}>
                    <div className={styles.info}>
                        <h2 className="heading-lg">Impulsa tu <span className="text-gradient">Ventaja Competitiva</span></h2>
                        <p className={styles.description}>
                            No implementamos solo software, construimos el cerebro digital de tu empresa.
                            Agende una sesión estratégica y descubra el ROI de la IA en su industria.
                        </p>

                        <div className={styles.stats}>
                            <div className={styles.statItem}>
                                <span className={styles.statValue}>+40%</span>
                                <span className={styles.statLabel}>Eficiencia Operativa</span>
                            </div>
                            <div className={styles.statItem}>
                                <span className={styles.statValue}>24/7</span>
                                <span className={styles.statLabel}>Disponibilidad Agentes</span>
                            </div>
                        </div>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className={styles.formWrapper}
                    >
                        <form onSubmit={handleSubmit} className={styles.form}>
                            <div className={styles.inputGroup}>
                                <label><User size={18} /> Nombre Completo</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ej. Juan Pérez"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div className={styles.inputGroup}>
                                <label><Mail size={18} /> Correo Corporativo</label>
                                <input
                                    type="email"
                                    required
                                    placeholder="juan@empresa.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>

                            <div className={styles.inputGroup}>
                                <label><Building2 size={18} /> Empresa</label>
                                <input
                                    type="text"
                                    placeholder="Nombre de tu organización"
                                    value={formData.company}
                                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                />
                            </div>

                            <div className={styles.inputGroup}>
                                <label><MessageSquare size={18} /> Desafío Principal</label>
                                <textarea
                                    required
                                    placeholder="¿Qué proceso te gustaría automatizar o mejorar con IA?"
                                    rows={4}
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                />
                            </div>

                            <button
                                type="submit"
                                className={`${styles.submitBtn} btn-primary`}
                                disabled={status === "loading"}
                            >
                                {status === "loading" ? "Procesando..." : (
                                    <>
                                        Solicitar Diagnóstico <Send size={18} />
                                    </>
                                )}
                            </button>

                            {status === "error" && (
                                <div className={styles.errorMessage}>
                                    <AlertCircle size={18} /> Ocurrió un error. Por favor, intenta de nuevo o contáctanos directamente.
                                </div>
                            )}
                        </form>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
