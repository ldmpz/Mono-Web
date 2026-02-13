"use client";

import { createBrowserSupabaseClient } from "@/lib/supabase-client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Edit2, Trash2, LogOut, Save, X, Image as ImageIcon, Check, ArrowLeft, ArrowRight } from "lucide-react";
import styles from "./dashboard.module.css";

// Interface for Pricing Card
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

export default function AdminDashboard() {
    const [cards, setCards] = useState<PricingCard[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [currentCard, setCurrentCard] = useState<Partial<PricingCard>>({});
    const [uploading, setUploading] = useState(false);

    const router = useRouter();
    const supabase = createBrowserSupabaseClient();

    useEffect(() => {
        fetchCards();
    }, []);

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

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/admin/login");
        router.refresh();
    };

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

        const targetCard = cards[targetIndex];

        // Swap display_order
        const { error: error1 } = await supabase
            .from("pricing_cards")
            .update({ display_order: targetCard.display_order })
            .eq("id", card.id);

        const { error: error2 } = await supabase
            .from("pricing_cards")
            .update({ display_order: card.display_order })
            .eq("id", targetCard.id);

        if (!error1 && !error2) {
            fetchCards();
        } else {
            alert("Error al mover: " + (error1?.message || error2?.message));
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Está seguro de eliminar este paquete?")) return;

        const { error } = await supabase.from("pricing_cards").delete().eq("id", id);
        if (!error) fetchCards();
    };

    const handleSave = async () => {
        if (!currentCard.title || !currentCard.price) return alert("Título y precio son obligatorios");

        let error;
        if (currentCard.id) {
            // Update
            const { error: updateError } = await supabase
                .from("pricing_cards")
                .update(currentCard)
                .eq("id", currentCard.id);
            error = updateError;
        } else {
            // Insert
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
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('pricing-images')
            .upload(filePath, file);

        if (uploadError) {
            alert("Error uploading image");
            setUploading(false);
            return;
        }

        const { data } = supabase.storage.from('pricing-images').getPublicUrl(filePath);
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

    if (loading) return <div className={styles.loading}>Cargando...</div>;

    return (
        <div className={styles.container}>
            {/* Header */}
            <header className={styles.header}>
                <h1 className={styles.title}>Panel de Administración</h1>
                <button onClick={handleLogout} className={styles.logoutBtn}>
                    <LogOut size={18} /> Salir
                </button>
            </header>

            {/* Main Content */}
            <main className={styles.main}>
                <div className={styles.sectionHeader}>
                    <h2>Paquetes de Servicios</h2>
                    <button onClick={handleAddNew} className={styles.addBtn}>
                        <Plus size={18} /> Nuevo Paquete
                    </button>
                </div>

                <div className={styles.grid}>
                    {cards.map((card) => (
                        <div key={card.id} className={`${styles.card} ${!card.active ? styles.inactive : ''}`}>
                            <div className={styles.cardHeader}>
                                {card.image_url ? (
                                    <img src={card.image_url} alt={card.title} className={styles.cardImage} />
                                ) : (
                                    <div className={styles.noImage}><ImageIcon size={24} /></div>
                                )}
                                <div className={styles.cardActions}>
                                    <button
                                        onClick={() => handleMove(card, 'left')}
                                        className={styles.iconBtn}
                                        disabled={cards.indexOf(card) === 0}
                                        title="Mover a la izquierda"
                                    >
                                        <ArrowLeft size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleMove(card, 'right')}
                                        className={styles.iconBtn}
                                        disabled={cards.indexOf(card) === cards.length - 1}
                                        title="Mover a la derecha"
                                    >
                                        <ArrowRight size={16} />
                                    </button>
                                    <button onClick={() => handleEdit(card)} className={styles.iconBtn} title="Editar"><Edit2 size={16} /></button>
                                    <button onClick={() => handleDelete(card.id)} className={`${styles.iconBtn} ${styles.deleteBtn}`} title="Eliminar"><Trash2 size={16} /></button>
                                </div>
                            </div>
                            <div className={styles.cardBody}>
                                <h3>{card.title}</h3>
                                <p className={styles.price}>{card.price}</p>
                                <div className={styles.badge}>{card.active ? "Activo" : "Inactivo"}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </main>

            {/* Editor Modal */}
            {isEditing && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <div className={styles.modalHeader}>
                            <h2>{currentCard.id ? "Editar Paquete" : "Nuevo Paquete"}</h2>
                            <button onClick={() => setIsEditing(false)} className={styles.closeBtn}><X size={20} /></button>
                        </div>

                        <div className={styles.modalBody}>
                            <div className={styles.formGroup}>
                                <label>Imagen</label>
                                <div className={styles.imageUpload}>
                                    {currentCard.image_url && <img src={currentCard.image_url} alt="Preview" className={styles.preview} />}
                                    <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                                    {uploading && <span>Subiendo...</span>}
                                </div>
                            </div>

                            <div className={styles.row}>
                                <div className={styles.formGroup}>
                                    <label>Título</label>
                                    <input
                                        type="text"
                                        value={currentCard.title || ""}
                                        onChange={(e) => setCurrentCard({ ...currentCard, title: e.target.value })}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Precio</label>
                                    <input
                                        type="text"
                                        value={currentCard.price || ""}
                                        onChange={(e) => setCurrentCard({ ...currentCard, price: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label>Descripción</label>
                                <textarea
                                    value={currentCard.description || ""}
                                    onChange={(e) => setCurrentCard({ ...currentCard, description: e.target.value })}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Características</label>
                                {(currentCard.features || []).map((feature, idx) => (
                                    <div key={idx} className={styles.featureRow}>
                                        <input
                                            type="text"
                                            value={feature}
                                            onChange={(e) => updateFeature(idx, e.target.value)}
                                        />
                                        <button onClick={() => removeFeature(idx)} className={styles.removeFeatureBtn}><X size={14} /></button>
                                    </div>
                                ))}
                                <button onClick={addFeature} className={styles.addFeatureBtn}>+ Agregar característica</button>
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.checkboxLabel}>
                                    <input
                                        type="checkbox"
                                        checked={currentCard.active || false}
                                        onChange={(e) => setCurrentCard({ ...currentCard, active: e.target.checked })}
                                    />
                                    Visible en el sitio web
                                </label>
                            </div>
                        </div>

                        <div className={styles.modalFooter}>
                            <button onClick={() => setIsEditing(false)} className={styles.cancelBtn}>Cancelar</button>
                            <button onClick={handleSave} className={styles.saveBtn}><Save size={16} /> Guardar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
