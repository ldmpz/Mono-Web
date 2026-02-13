import styles from "./Footer.module.css";
import Link from "next/link";

export default function Footer() {
    return (
        <footer id="contact" className={styles.footer}>
            {/* Strategic CTA */}
            <div className={styles.ctaSection}>
                <h2 className={styles.ctaTitle}>
                    ¿Listo para escalar <br />
                    con <span className="text-gradient">Inteligencia Artificial</span>?
                </h2>
                <p className={styles.ctaDesc}>
                    Agende un diagnóstico estratégico gratuito y descubra el potencial oculto de su empresa.
                </p>
                <Link href="#" className="btn-primary">
                    Agendar Diagnóstico
                </Link>
            </div>

            {/* Footer Links */}
            <div className={styles.footerContent}>
                <div>
                    <h3 className="heading-md">AI.CORP</h3>
                    <p className={styles.brandDesc}>
                        Ingeniería digital de élite para empresas que buscan liderar su industria mediante automatización e inteligencia artificial.
                    </p>
                </div>

                <div>
                    <span className={styles.columnTitle}>Servicios</span>
                    <ul className={styles.linkList}>
                        <li className={styles.linkItem}><Link href="#" className={styles.link}>Automatización</Link></li>
                        <li className={styles.linkItem}><Link href="#" className={styles.link}>Agentes IA</Link></li>
                        <li className={styles.linkItem}><Link href="#" className={styles.link}>Consultoría</Link></li>
                        <li className={styles.linkItem}><Link href="#" className={styles.link}>Integraciones</Link></li>
                    </ul>
                </div>

                <div>
                    <span className={styles.columnTitle}>Legal</span>
                    <ul className={styles.linkList}>
                        <li className={styles.linkItem}><Link href="#" className={styles.link}>Privacidad</Link></li>
                        <li className={styles.linkItem}><Link href="#" className={styles.link}>Términos</Link></li>
                    </ul>
                </div>
            </div>

            <div className={styles.copy}>
                &copy; {new Date().getFullYear()} AI.CORP. Todos los derechos reservados.
            </div>
        </footer>
    );
}
