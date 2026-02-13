import styles from "./Methodology.module.css";

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
                        <div key={index} className={styles.step}>
                            <div className={styles.stepNumber}>{step.order}</div>
                            <h3 className={styles.stepTitle}>{step.title}</h3>
                            <p className={styles.stepDesc}>{step.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
