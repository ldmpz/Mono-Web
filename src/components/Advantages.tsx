import styles from "./Advantages.module.css";
import AnimatedCounter from "./AnimatedCounter";

export default function Advantages() {
    return (
        <section className={styles.section}>
            <div className={`container ${styles.container}`}>
                <div className={styles.content}>
                    <span className={styles.label}>Por qué elegirnos</span>
                    <h2 className={styles.title}>
                        Resultados tangibles, <br />
                        no promesas vacías.
                    </h2>
                    <p className={styles.description}>
                        Nos enfocamos obsesivamente en el ROI. Cada línea de código y cada modelo de IA que implementamos tiene un propósito claro: hacer crecer su negocio.
                    </p>

                    <ul style={{ listStyle: 'none', color: 'var(--text-secondary)', lineHeight: '2' }}>
                        <li>✓ Arquitectura propietaria y segura.</li>
                        <li>✓ Modelos re-entrenados con su data.</li>
                        <li>✓ Integración nativa con su stack actual.</li>
                        <li>✓ Acompañamiento post-implementación.</li>
                    </ul>
                </div>

                <div className={styles.metricsGrid}>
                    <div className={styles.metricCard}>
                        <span className={styles.metricValue}>
                            <AnimatedCounter value={40} suffix="%" />
                        </span>
                        <span className={styles.metricLabel}>Reducción de Costos</span>
                    </div>
                    <div className={styles.metricCard}>
                        <span className={styles.metricValue}>24/7</span>
                        <span className={styles.metricLabel}>Disponibilidad Operativa</span>
                    </div>
                    <div className={styles.metricCard}>
                        <span className={styles.metricValue}>
                            <AnimatedCounter value={3} suffix="x" />
                        </span>
                        <span className={styles.metricLabel}>Velocidad de Respuesta</span>
                    </div>
                    <div className={styles.metricCard}>
                        <span className={styles.metricValue}>
                            <AnimatedCounter value={100} suffix="%" />
                        </span>
                        <span className={styles.metricLabel}>Propiedad del Dato</span>
                    </div>
                </div>
            </div>
        </section>
    );
}
