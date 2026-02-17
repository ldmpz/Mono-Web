"use client";

import { useState, useEffect } from "react";
import styles from "./Navbar.module.css";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";

const navItems = [
    { name: "Inicio", href: "#inicio" },
    { name: "Servicios", href: "#servicios" },
    { name: "Metodología", href: "#metodologia" },
    { name: "Contacto", href: "#contacto" }
];

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [activeTab, setActiveTab] = useState(navItems[0].name);
    const [hoveredTab, setHoveredTab] = useState<string | null>(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Lock body scroll when menu is open
    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "auto";
        }
    }, [isMobileMenuOpen]);

    const handleMobileLinkClick = (name: string) => {
        setActiveTab(name);
        setIsMobileMenuOpen(false);
    };

    return (
        <nav className={`${styles.navbar} ${scrolled ? styles.scrolled : ""}`}>
            <div className={styles.container}>
                <Link href="/" className={styles.logo} onClick={() => setIsMobileMenuOpen(false)}>
                    <span className={styles.logoHighlight}>AI</span>.CORP
                </Link>

                {/* Desktop Nav */}
                <div className={styles.navWrapper}>
                    <ul className={styles.navLinks} onMouseLeave={() => setHoveredTab(null)}>
                        {navItems.map((item) => (
                            <li
                                key={item.name}
                                className={styles.navItem}
                                onMouseEnter={() => setHoveredTab(item.name)}
                                onClick={() => setActiveTab(item.name)}
                            >
                                <Link
                                    href={item.href}
                                    className={`${styles.navLink} ${activeTab === item.name ? styles.active : ""}`}
                                >
                                    {item.name}
                                </Link>
                                {(hoveredTab === item.name || (activeTab === item.name && hoveredTab === null)) && (
                                    <motion.div
                                        className={styles.indicator}
                                        layoutId="nav-indicator"
                                        transition={{
                                            type: "spring",
                                            stiffness: 400,
                                            damping: 30
                                        }}
                                    >
                                        <div className={styles.indicatorTriangle} />
                                        <div className={styles.indicatorGlow} />
                                    </motion.div>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className={styles.actions}>
                    <Link href="#contacto" className={styles.ctaButton}>
                        Agendar Diagnóstico
                    </Link>
                </div>

                {/* Mobile Menu Button */}
                <button
                    className={styles.mobileMenuBtn}
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    aria-label="Toggle menu"
                >
                    {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>

                {/* Mobile Menu Overlay */}
                <AnimatePresence>
                    {isMobileMenuOpen && (
                        <motion.div
                            className={styles.mobileMenuOverlay}
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <ul className={styles.mobileNavLinks}>
                                {navItems.map((item) => (
                                    <motion.li
                                        key={item.name}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.1 }}
                                    >
                                        <Link
                                            href={item.href}
                                            className={styles.mobileNavLink}
                                            onClick={() => handleMobileLinkClick(item.name)}
                                        >
                                            {item.name}
                                        </Link>
                                    </motion.li>
                                ))}
                                <motion.li
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.2 }}
                                    style={{ marginTop: '1rem' }}
                                >
                                    <Link
                                        href="#contacto"
                                        className={styles.mobileCtaButton}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        Agendar Diagnóstico
                                    </Link>
                                </motion.li>
                            </ul>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </nav>
    );
}
