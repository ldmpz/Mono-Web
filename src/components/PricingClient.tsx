"use client";

import { motion } from "framer-motion";
import styles from "./Pricing.module.css";
import { Check } from "lucide-react";
import Image from "next/image";

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
    return (
        <section id="pricing" className={styles.section}>
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
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    variants={{
                        hidden: { opacity: 0, y: 30 },
                        visible: {
                            opacity: 1,
                            y: 0,
                            transition: {
                                duration: 0.8,
                                staggerChildren: 0.2
                            }
                        }
                    }}
                >
                    <motion.div
                        className={styles.wingLeft}
                        variants={{
                            hidden: { x: -50, opacity: 0, rotate: -10 },
                            visible: {
                                x: 0,
                                opacity: 1,
                                rotate: 10,
                                transition: { type: "spring", stiffness: 100, damping: 15 }
                            }
                        }}
                    >
                        <Image
                            src="/Manos.png"
                            alt=""
                            width={0}
                            height={0}
                            sizes="100vw"
                            className={styles.wingImg}
                            style={{ left: 0, width: 'auto', height: '100%' }}
                        />
                    </motion.div>

                    <motion.div
                        className={styles.dividerTitle}
                        variants={{
                            hidden: { scale: 0.8, opacity: 0 },
                            visible: {
                                scale: 1,
                                opacity: 1,
                                transition: { type: "spring", stiffness: 200, damping: 12 }
                            }
                        }}
                        animate={{
                            textShadow: [
                                "0 0 10px rgba(31, 107, 255, 0)",
                                "0 0 20px rgba(31, 107, 255, 0.5)",
                                "0 0 10px rgba(31, 107, 255, 0)"
                            ]
                        }}
                        transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
                    >
                        Páginas Web
                    </motion.div>

                    <motion.div
                        className={styles.wingRight}
                        variants={{
                            hidden: { x: 50, opacity: 0, rotate: 10 },
                            visible: {
                                x: 0,
                                opacity: 1,
                                rotate: -10,
                                transition: { type: "spring", stiffness: 100, damping: 15 }
                            }
                        }}
                    >
                        <Image
                            src="/Manos.png"
                            alt=""
                            width={0}
                            height={0}
                            sizes="100vw"
                            className={styles.wingImg}
                            style={{ left: '-65px', width: 'auto', height: '100%' }}
                        />
                    </motion.div>
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
