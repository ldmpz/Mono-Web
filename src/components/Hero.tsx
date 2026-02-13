"use client";

import styles from "./Hero.module.css";
import Link from "next/link";
import ParticleBackground from "./ParticleBackground";
import TextReveal from "./TextReveal";

export default function Hero() {
    return (
        <section className={styles.hero}>
            <ParticleBackground />
            <div className={styles.content}>
                <div className={styles.badge}>
                    Ingeniería Digital Avanzada
                </div>

                <div className={styles.headlineWrapper}>
                    <div className={styles.headline}>
                        <TextReveal text="Inteligencia Artificial aplicada a" />
                        <span className="text-gradient" style={{ display: 'block', marginTop: '0.5rem' }}>Crecimiento Empresarial</span>
                    </div>
                </div>

                <p className={styles.subheadline}>
                    Automatizaciones avanzadas, agentes de IA personalizados y consultoría estratégica para escalar su negocio hacia el futuro.
                </p>

                <div className={styles.ctaGroup}>
                    <Link href="#contact" className="btn-primary">
                        Agendar Diagnóstico
                    </Link>
                    <Link href="#services" className={styles.btnSecondary}>
                        Explorar Soluciones
                    </Link>
                </div>
            </div>
        </section>
    );
}
