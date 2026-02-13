import styles from "./UseCases.module.css";

const cases = [
    {
        tag: "E-commerce",
        title: "Motor de Recomendación Dinámico",
        desc: "Implementación de algoritmos predictivos para personalizar la experiencia de compra en tiempo real.",
        statValue: "+35%",
        statLabel: "Incremento en Conversión"
    },
    {
        tag: "Fintech",
        title: "Detección de Fraude en Tiempo Real",
        desc: "Sistema de vigilancia automatizado que identifica patrones anómalos en milisegundos.",
        statValue: "99.9%",
        statLabel: "Precisión en Detección"
    },
    {
        tag: "Logística",
        title: "Optimización de Rutas con IA",
        desc: "Agentes autónomos que recalculan trayectorias basándose en tráfico, clima y demanda.",
        statValue: "-28%",
        statLabel: "Costos Operativos"
    }
];

export default function UseCases() {
    return (
        <section id="cases" className={styles.section}>
            <div className="container">
                <div className={styles.header}>
                    <h2 className="heading-lg">Casos de <span className="text-gradient">Éxito</span></h2>
                    <p className="text-secondary" style={{ marginTop: '1rem' }}>
                        Soluciones aplicadas a escenarios reales con impacto medible.
                    </p>
                </div>

                <div className={styles.grid}>
                    {cases.map((useCase, index) => (
                        <div key={index} className={styles.card}>
                            <div className={styles.cardContent}>
                                <span className={styles.tag}>{useCase.tag}</span>
                                <h3 className={styles.cardTitle}>{useCase.title}</h3>
                                <p className={styles.cardDesc}>{useCase.desc}</p>
                                <div className={styles.stat}>
                                    <span className={styles.statValue}>{useCase.statValue}</span>
                                    <span className={styles.statLabel}>{useCase.statLabel}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
