"use client";

import { useRef, useState } from "react";
import { motion, useScroll, useTransform, useSpring, useMotionValueEvent } from "framer-motion";
import styles from "./Pricing.module.css";
import { Check } from "lucide-react";

interface PricingCard {
    id: string;
    title: string;
    price: string;
    description: string;
    features: string[];
    image_url?: string;
}

interface PricingClientProps {
    cards: PricingCard[];
}

export default function PricingClient({ cards }: PricingClientProps) {
    const containerRef = useRef<HTMLElement>(null);
    const [isVisible, setIsVisible] = useState(true);
    const lastScrollY = useRef(0);

    const { scrollY } = useScroll();

    // Detect scroll direction
    useMotionValueEvent(scrollY, "change", (latest) => {
        const direction = latest > lastScrollY.current ? "down" : "up";
        if (direction === "down") {
            setIsVisible(true);
        } else {
            setIsVisible(false);
        }
        lastScrollY.current = latest;
    });

    // Parallax effect for the monkey hands divider (keeping it subtle now)
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"]
    });

    const yParallax = useTransform(scrollYProgress, [0, 1], [-100, 100]);
    const springY = useSpring(yParallax, {
        stiffness: 200,
        damping: 30,
        mass: 0.5 // Menor masa para que sea más ágil
    });

    return (
        <section id="pricing" className={styles.section} ref={containerRef}>
            <div className="container">

                {/* Promotional Banner */}
                <div className={styles.promoBanner}>
                    <div className={styles.ribbon}>
                        <span className={styles.ribbonTag}>¡NOSOTROS TE HACEMOS</span>
                        <div className={styles.ribbonMain}>
                            <span className={styles.star}>★</span>
                            EL PARO!
                            <span className={styles.star}>★</span>
                        </div>
                    </div>

                    <div className={styles.promoContent}>
                        <span className={styles.promoAprovecha}>¡Aprovecha!</span>
                        <h3 className={styles.promoTitle}>Nuestros servicios Personalizados</h3>
                        <p className={styles.promoText}>
                            No dejes que la crisis te detenga, ¡sácale el máximo provecho y conviértela en una oportunidad para crecer! Permítenos trabajar contigo para transformar los obstáculos en trampolines hacia el éxito.
                        </p>
                    </div>
                </div>

                <motion.div
                    className={styles.wingsDivider}
                    animate={{
                        opacity: isVisible ? 1 : 0,
                        translateY: isVisible ? 0 : 80, // Más desplazamiento para que la caída lenta se aprecie mejor
                        scale: isVisible ? 1 : 0.9
                    }}
                    transition={{
                        duration: isVisible ? 0.1 : 1.5, // Instantáneo al bajar, ultra-lento al subir
                        ease: isVisible ? "circOut" : "linear" // Lineal al subir para que no se acelere al final
                    }}
                    style={{
                        y: springY,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        position: "relative",
                        zIndex: 5
                    }}
                >
                    <div className={styles.wingLeft}></div>
                    <div className={styles.dividerTitle}>Páginas Web</div>
                    <div className={styles.wingRight}></div>
                </motion.div>

                <div className={styles.grid}>
                    {cards.map((card) => (
                        <div key={card.id} className={styles.card}>
                            <div className={styles.cardHighlight}></div>

                            {card.image_url && (
                                <div className={styles.imageWrapper}>
                                    <img src={card.image_url} alt={card.title} />
                                </div>
                            )}

                            <div className={styles.cardContent}>
                                <h3 className={styles.cardTitle}>{card.title}</h3>
                                <div className={styles.price}>{card.price}</div>
                                <p className={styles.cardDesc}>{card.description}</p>

                                <ul className={styles.features}>
                                    {(card.features || []).map((feature: string, idx: number) => (
                                        <li key={idx}>
                                            <Check size={16} className={styles.checkIcon} />
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                <a href="#contact" className={`btn-primary ${styles.cardButton}`}>
                                    Comenzar
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
