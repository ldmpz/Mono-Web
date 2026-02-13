"use client";

import { useState, useEffect } from "react";
import styles from "./Navbar.module.css";
import Link from "next/link";

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <nav className={`${styles.navbar} ${scrolled ? styles.scrolled : ""}`}>
            <div className={styles.container}>
                <Link href="/" className={styles.logo}>
                    <span className={styles.logoHighlight}>AI</span>.CORP
                </Link>

                <ul className={styles.navLinks}>
                    <li><Link href="#services" className={styles.navLink}>Servicios</Link></li>
                    <li><Link href="#methodology" className={styles.navLink}>Metodología</Link></li>
                    <li><Link href="#cases" className={styles.navLink}>Casos de Uso</Link></li>
                </ul>

                <div className={styles.actions}>
                    <Link href="#contact" className={styles.ctaButton}>
                        Agendar Diagnóstico
                    </Link>
                </div>
            </div>
        </nav>
    );
}
