"use client";

import { createBrowserSupabaseClient } from "@/lib/supabase-client";
import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Save, X, Image as ImageIcon, ArrowLeft, ArrowRight } from "lucide-react";
import NextImage from "next/image";
import { motion } from "framer-motion";
import styles from "./dashboard.module.css";

interface PricingCard {
    id: string;
    title: string;
    price: string;
    description: string;
    features: string[];
    image_url: string;
    active: boolean;
    display_order: number;
}

const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.07 } }
}
const item = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
}

export default function PricingEditor() {
    const [cards, setCards] = useState<PricingCard[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [currentCard, setCurrentCard] = useState<Partial<PricingCard>>({});
    const [uploading, setUploading] = useState(false);

    const supabase = createBrowserSupabaseClient();

    const fetchCards = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("pricing_cards")
            .select("*")
            .order("display_order", { ascending: true });

        if (error) {
            console.error("Error fetching cards:", error);
        } else {
            setCards(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchCards();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleEdit = (card: PricingCard) => {
        setCurrentCard(card);
        setIsEditing(true);
    };

    const handleAddNew = () => {
        setCurrentCard({
            title: "",
            price: "",
            description: "",
            features: [],
            active: true,
            display_order: cards.length + 1,
        });
        setIsEditing(true);
    };

    const handleMove = async (card: PricingCard, direction: 'left' | 'right') => {
        const index = cards.findIndex(c => c.id === card.id);
        const targetIndex = direction === 'left' ? index - 1 : index + 1;

        if (targetIndex < 0 || targetIndex >= cards.length) return;

        // 1. Swap in local array for instant optimistic UI
        const newCards = [...cards];
        [newCards[index], newCards[targetIndex]] = [newCards[targetIndex], newCards[index]];
        setCards(newCards);

        // 2. Rewrite ALL display_order values sequentially (0,1,2...) to avoid conflicts
        const updates = newCards.map((c, i) =>
            supabase
                .from("pricing_cards")
                .update({ display_order: i })
                .eq("id", c.id)
        );

        const results = await Promise.all(updates);
        const failed = results.find(r => r.error);

        if (failed?.error) {
            alert("Error al reordenar: " + failed.error.message);
            fetchCards(); // Revert on error
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Estás seguro de eliminar este paquete?")) return;
        const { error } = await supabase.from("pricing_cards").delete().eq("id", id);
        if (!error) fetchCards();
    };

    const handleSave = async () => {
        if (!currentCard.title || !currentCard.price) return alert("Título y precio son obligatorios");

        let error;
        if (currentCard.id) {
            const { error: updateError } = await supabase
                .from("pricing_cards")
                .update(currentCard)
                .eq("id", currentCard.id);
            error = updateError;
        } else {
            const { error: insertError } = await supabase
                .from("pricing_cards")
                .insert([currentCard]);
            error = insertError;
        }

        if (error) {
            alert("Error al guardar: " + error.message);
        } else {
            setIsEditing(false);
            fetchCards();
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        setUploading(true);
        const file = e.target.files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
            .from('pricing-images')
            .upload(fileName, file);

        if (uploadError) {
            alert("Error al subir imagen");
            setUploading(false);
            return;
        }

        const { data } = supabase.storage.from('pricing-images').getPublicUrl(fileName);
        setCurrentCard({ ...currentCard, image_url: data.publicUrl });
        setUploading(false);
    };

    const updateFeature = (index: number, value: string) => {
        const newFeatures = [...(currentCard.features || [])];
        newFeatures[index] = value;
        setCurrentCard({ ...currentCard, features: newFeatures });
    };

    const addFeature = () => {
        setCurrentCard({ ...currentCard, features: [...(currentCard.features || []), ""] });
    };

    const removeFeature = (index: number) => {
        const newFeatures = [...(currentCard.features || [])];
        newFeatures.splice(index, 1);
        setCurrentCard({ ...currentCard, features: newFeatures });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="flex justify-between items-center"
            >
                <div>
                    <h2 className="text-xl font-bold text-[var(--text-primary)]">
                        Paquetes de Venta
                    </h2>
                    <p className="text-[var(--text-muted)] mt-1 text-sm">
                        Gestiona los paquetes de servicios visibles en la landing page.
                    </p>
                </div>
                <motion.button
                    onClick={handleAddNew}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.97 }}
                    className="btn-premium flex items-center gap-2"
                >
                    <Plus size={16} />
                    Nuevo Paquete
                </motion.button>
            </motion.div>

            {/* Grid */}
            {loading ? (
                <div className="flex items-center justify-center h-48">
                    <div className="w-8 h-8 border-2 border-[var(--brand-neon)] border-t-transparent rounded-full animate-spin" />
                </div>
            ) : cards.length === 0 ? (
                <div className="text-center py-20 text-[var(--text-muted)]">
                    <p className="text-lg mb-2">No hay paquetes aún.</p>
                    <p className="text-sm">Crea el primero con el botón de arriba.</p>
                </div>
            ) : (
                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className={styles.grid}
                >
                    {cards.map((card) => (
                        <motion.div
                            key={card.id}
                            variants={item}
                            className={`${styles.card} ${!card.active ? styles.inactive : ''}`}
                            style={{ position: 'relative' }}
                        >
                            {/* Image area */}
                            <div className={styles.cardHeader} style={{ position: 'relative', overflow: 'hidden' }}>
                                {card.image_url ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={card.image_url}
                                        alt={card.title}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                    />
                                ) : (
                                    <div className={styles.noImage}><ImageIcon size={24} /></div>
                                )}
                            </div>

                            {/* Actions — rendered OUTSIDE the image div, but absolutely positioned over card */}
                            <div
                                style={{
                                    position: 'absolute',
                                    top: '0.75rem',
                                    right: '0.75rem',
                                    display: 'flex',
                                    gap: '0.4rem',
                                    zIndex: 20,
                                }}
                            >
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleMove(card, 'left'); }}
                                    className={styles.iconBtn}
                                    disabled={cards.indexOf(card) === 0}
                                    title="Mover izquierda"
                                >
                                    <ArrowLeft size={15} />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleMove(card, 'right'); }}
                                    className={styles.iconBtn}
                                    disabled={cards.indexOf(card) === cards.length - 1}
                                    title="Mover derecha"
                                >
                                    <ArrowRight size={15} />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleEdit(card); }}
                                    className={styles.iconBtn}
                                    title="Editar"
                                >
                                    <Edit2 size={15} />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDelete(card.id); }}
                                    className={`${styles.iconBtn} ${styles.deleteBtn}`}
                                    title="Eliminar"
                                >
                                    <Trash2 size={15} />
                                </button>
                            </div>

                            <div className={styles.cardBody}>
                                <h3>{card.title}</h3>
                                <p className={styles.price}>{card.price}</p>
                                <div className={styles.badge}>{card.active ? '✅ Activo' : '⭕ Inactivo'}</div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            )}

            {/* Editor Modal */}
            {isEditing && (
                <div className={styles.modalOverlay}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.93, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.93 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 26 }}
                        className={styles.modal}
                    >
                        <div className={styles.modalHeader}>
                            <h2>{currentCard.id ? "Editar Paquete" : "Nuevo Paquete"}</h2>
                            <button onClick={() => setIsEditing(false)} className={styles.closeBtn}><X size={20} /></button>
                        </div>

                        <div className={styles.modalBody}>
                            <div className={styles.formGroup}>
                                <label>Imagen</label>
                                <div className={styles.imageUpload}>
                                    {currentCard.image_url && <NextImage src={currentCard.image_url} alt="Preview" width={200} height={100} className={styles.preview} style={{ objectFit: 'cover' }} />}
                                    <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                                    {uploading && <span>Subiendo...</span>}
                                </div>
                            </div>

                            <div className={styles.row}>
                                <div className={styles.formGroup}>
                                    <label>Título</label>
                                    <input type="text" value={currentCard.title || ""} onChange={(e) => setCurrentCard({ ...currentCard, title: e.target.value })} />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Precio</label>
                                    <input type="text" value={currentCard.price || ""} onChange={(e) => setCurrentCard({ ...currentCard, price: e.target.value })} />
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label>Descripción</label>
                                <textarea value={currentCard.description || ""} onChange={(e) => setCurrentCard({ ...currentCard, description: e.target.value })} />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Características</label>
                                {(currentCard.features || []).map((feature, idx) => (
                                    <div key={idx} className={styles.featureRow}>
                                        <input type="text" value={feature} onChange={(e) => updateFeature(idx, e.target.value)} />
                                        <button onClick={() => removeFeature(idx)} className={styles.removeFeatureBtn}><X size={14} /></button>
                                    </div>
                                ))}
                                <button onClick={addFeature} className={styles.addFeatureBtn}>+ Agregar característica</button>
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.checkboxLabel}>
                                    <input type="checkbox" checked={currentCard.active || false} onChange={(e) => setCurrentCard({ ...currentCard, active: e.target.checked })} />
                                    Visible en el sitio web
                                </label>
                            </div>
                        </div>

                        <div className={styles.modalFooter}>
                            <button onClick={() => setIsEditing(false)} className={styles.cancelBtn}>Cancelar</button>
                            <button onClick={handleSave} className={styles.saveBtn}><Save size={16} /> Guardar</button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
