"use client";

import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { Send, CheckCircle2, AlertCircle } from "lucide-react";
import Image from "next/image";
import styles from "./ContactForm.module.css";

export default function ContactForm() {
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        company: "",
        message: "",
        revenue: ""
    });

    const handleSubmit = async (e: FormEvent) => {
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
                <h2 className={styles.heading}>¡Mensaje Enviado!</h2>
                <p>Gracias por tu interés. Un estratega de IA se pondrá en contacto contigo en menos de 24 horas.</p>
                <button
                    onClick={() => setStatus("idle")}
                    className={styles.submitBtn}
                    style={{ maxWidth: '200px' }}
                >
                    Enviar otro mensaje
                </button>
            </motion.div>
        );
    }

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1, delayChildren: 0.2 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
    };

    const floatingImage = {
        animate: {
            y: [0, -15, 0],
            transition: { duration: 6, repeat: Infinity }
        }
    };

    return (
        <section id="contact" className={styles.contactSection}>
            <div className={styles.container}>
                <div className={styles.grid}>

                    {/* LEFT COLUMN: Content + Form */}
                    <motion.div
                        className={styles.leftColumn}
                        variants={containerVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-50px" }}
                    >
                        {/* Header */}
                        <motion.div variants={itemVariants}>
                            <div className={styles.badge}>
                                <span className={styles.badgeLine}></span>
                                <span>Inicia tu proyecto ahora</span>
                            </div>
                            <h2 className={styles.heading}>
                                Ponte en contacto
                            </h2>
                            <p className={styles.description}>
                                En <span className={styles.highlight}>Mono Web</span> estamos listos para ponernos en contacto.<br />
                                Llene la siguiente forma o escriba directamente, con gusto le atenderemos.
                            </p>
                        </motion.div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className={styles.form}>
                            <motion.div className={styles.row} variants={itemVariants}>
                                <input
                                    type="text"
                                    required
                                    placeholder="Nombre"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className={styles.input}
                                />
                                <input
                                    type="email"
                                    required
                                    placeholder="Correo electrónico"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className={styles.input}
                                />
                            </motion.div>

                            <motion.div className={styles.row} variants={itemVariants}>
                                <input
                                    type="text"
                                    placeholder="Teléfono"
                                    value={formData.company}
                                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                    className={styles.input}
                                />
                                <input
                                    type="text"
                                    placeholder="Asunto"
                                    className={styles.input}
                                />
                            </motion.div>

                            <motion.textarea
                                variants={itemVariants}
                                required
                                placeholder="Escríbenos tu mensaje..."
                                rows={4}
                                value={formData.message}
                                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                className={styles.textarea}
                            />

                            <motion.button
                                variants={itemVariants}
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                className={styles.submitBtn}
                                disabled={status === "loading"}
                            >
                                {status === "loading" ? "Enviando..." : (
                                    <>Enviar mensaje <Send size={18} /></>
                                )}
                            </motion.button>

                            {status === "error" && (
                                <div className={styles.errorMessage}>
                                    <AlertCircle size={18} /> Error al enviar. Intenta de nuevo.
                                </div>
                            )}

                            <motion.p variants={itemVariants} className={styles.disclaimer}>
                                Visítenos y le brindaremos una asesoría gratuita que le ayudará a tomar la mejor decisión para una inversión inteligente para su negocio.
                            </motion.p>
                        </form>
                    </motion.div>

                    {/* RIGHT COLUMN: Image */}
                    <div className={styles.rightColumn}>
                        <div className={styles.imageBlob}></div>

                        <motion.div
                            variants={floatingImage}
                            animate="animate"
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.8 }}
                            className="w-full h-full flex justify-center items-center"
                        >
                            <Image
                                src="/Cliente.png"
                                alt="Avatar Cliente"
                                width={600}
                                height={600}
                                className={styles.avatarImage}
                                priority
                            />
                        </motion.div>
                    </div>

                </div>
            </div>
        </section>
    );
}
