"use client";

import { createBrowserSupabaseClient } from "@/lib/supabase-client";
import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Save, X, ArrowLeft, ArrowRight, Brain, Bot, Workflow } from "lucide-react";
import { motion } from "framer-motion";
import styles from "./dashboard.module.css";
import { WebService } from "@/components/ServicesClient";

const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.07 } }
}
const item = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
}

const iconsAvailable = ['Brain', 'Bot', 'Workflow'];

export default function ServicesEditor() {
    const [services, setServices] = useState<WebService[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [currentService, setCurrentService] = useState<Partial<WebService & { active: boolean, display_order: number }>>({});

    const supabase = createBrowserSupabaseClient();

    const fetchServices = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("web_services")
            .select("*")
            .order("display_order", { ascending: true });

        if (error) {
            console.error("Error fetching services:", error);
        } else {
            setServices(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchServices();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleEdit = (service: WebService & { active?: boolean, display_order?: number }) => {
        setCurrentService(service);
        setIsEditing(true);
    };

    const handleAddNew = () => {
        setCurrentService({
            title: "",
            price: "",
            icon: "Brain",
            features: [],
            active: true,
            display_order: services.length + 1,
        });
        setIsEditing(true);
    };

    const handleMove = async (service: any, direction: 'left' | 'right') => {
        const index = services.findIndex(c => c.id === service.id);
        const targetIndex = direction === 'left' ? index - 1 : index + 1;

        if (targetIndex < 0 || targetIndex >= services.length) return;

        const newServices = [...services] as any[];
        [newServices[index], newServices[targetIndex]] = [newServices[targetIndex], newServices[index]];
        setServices(newServices);

        const updates = newServices.map((c, i) =>
            supabase
                .from("web_services")
                .update({ display_order: i })
                .eq("id", c.id)
        );

        const results = await Promise.all(updates);
        const failed = results.find(r => r.error);

        if (failed?.error) {
            alert("Error al reordenar: " + failed.error.message);
            fetchServices();
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Estás seguro de eliminar esta solución de IA?")) return;
        const { error } = await supabase.from("web_services").delete().eq("id", id);
        if (!error) fetchServices();
    };

    const handleSave = async () => {
        if (!currentService.title || !currentService.price) return alert("Título y precio son obligatorios");

        let error;
        if (currentService.id) {
            const { error: updateError } = await supabase
                .from("web_services")
                .update(currentService)
                .eq("id", currentService.id);
            error = updateError;
        } else {
            const { error: insertError } = await supabase
                .from("web_services")
                .insert([currentService]);
            error = insertError;
        }

        if (error) {
            alert("Error al guardar: " + error.message);
        } else {
            setIsEditing(false);
            fetchServices();
        }
    };

    const updateFeature = (index: number, value: string) => {
        const newFeatures = [...(currentService.features || [])];
        newFeatures[index] = value;
        setCurrentService({ ...currentService, features: newFeatures });
    };

    const addFeature = () => {
        setCurrentService({ ...currentService, features: [...(currentService.features || []), ""] });
    };

    const removeFeature = (index: number) => {
        const newFeatures = [...(currentService.features || [])];
        newFeatures.splice(index, 1);
        setCurrentService({ ...currentService, features: newFeatures });
    };

    const renderIcon = (iconName: string, size = 24) => {
        if (iconName === 'Brain') return <Brain size={size} />;
        if (iconName === 'Bot') return <Bot size={size} />;
        if (iconName === 'Workflow') return <Workflow size={size} />;
        return <Bot size={size} />;
    };

    return (
        <div className="space-y-6">
            <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="flex justify-between items-center"
            >
                <div>
                    <h2 className="text-xl font-bold text-[var(--text-primary)]">
                        Soluciones de IA
                    </h2>
                    <p className="text-[var(--text-muted)] text-sm">
                        Gestiona los servicios de IA de la landing page.
                    </p>
                </div>
                <motion.button
                    onClick={handleAddNew}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.97 }}
                    className="btn-premium flex items-center gap-2"
                >
                    <Plus size={16} />
                    Añadir Solución
                </motion.button>
            </motion.div>

            {loading ? (
                <div className="flex items-center justify-center h-48">
                    <div className="w-8 h-8 border-2 border-[var(--brand-neon)] border-t-transparent rounded-full animate-spin" />
                </div>
            ) : services.length === 0 ? (
                <div className="text-center py-20 text-[var(--text-muted)]">
                    <p className="text-lg mb-2">No hay soluciones aún.</p>
                </div>
            ) : (
                <motion.div variants={container} initial="hidden" animate="show" className={styles.grid}>
                    {services.map((service: any) => (
                        <motion.div
                            key={service.id}
                            variants={item}
                            className={`${styles.card} ${!service.active ? styles.inactive : ''}`}
                            style={{ position: 'relative' }}
                        >
                            <div className={styles.cardHeader} style={{ position: 'relative', overflow: 'hidden', height: '140px', background: 'var(--bg-obsidian)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <div className="text-[var(--brand-neon)] p-4 rounded-2xl bg-[var(--brand-neon)]/10 border border-[var(--brand-neon)]/20">
                                    {renderIcon(service.icon, 48)}
                                </div>
                            </div>

                            <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', display: 'flex', gap: '0.4rem', zIndex: 20 }}>
                                <button onClick={(e) => { e.stopPropagation(); handleMove(service, 'left'); }} className={styles.iconBtn} disabled={services.indexOf(service) === 0} title="Mover izquierda"><ArrowLeft size={15} /></button>
                                <button onClick={(e) => { e.stopPropagation(); handleMove(service, 'right'); }} className={styles.iconBtn} disabled={services.indexOf(service) === services.length - 1} title="Mover derecha"><ArrowRight size={15} /></button>
                                <button onClick={(e) => { e.stopPropagation(); handleEdit(service); }} className={styles.iconBtn} title="Editar"><Edit2 size={15} /></button>
                                <button onClick={(e) => { e.stopPropagation(); handleDelete(service.id); }} className={`${styles.iconBtn} ${styles.deleteBtn}`} title="Eliminar"><Trash2 size={15} /></button>
                            </div>

                            <div className={styles.cardBody}>
                                <h3>{service.title}</h3>
                                <p className={styles.price}>{service.price}</p>
                                <div className={styles.badge}>{service.active ? '✅ Activo' : '⭕ Inactivo'}</div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            )}

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
                            <h2>{currentService.id ? "Editar Solución" : "Nueva Solución"}</h2>
                            <button onClick={() => setIsEditing(false)} className={styles.closeBtn}><X size={20} /></button>
                        </div>

                        <div className={styles.modalBody}>
                            <div className={styles.row}>
                                <div className={styles.formGroup}>
                                    <label>Título</label>
                                    <input type="text" value={currentService.title || ""} onChange={(e) => setCurrentService({ ...currentService, title: e.target.value })} />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Precio</label>
                                    <input type="text" value={currentService.price || ""} onChange={(e) => setCurrentService({ ...currentService, price: e.target.value })} />
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label>Icono</label>
                                <div className="flex gap-4">
                                    {iconsAvailable.map(ic => (
                                        <button
                                            key={ic}
                                            onClick={() => setCurrentService({ ...currentService, icon: ic })}
                                            className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${currentService.icon === ic ? 'border-[var(--brand-neon)] bg-[var(--brand-neon)]/10 text-[var(--brand-neon)]' : 'border-[var(--border-glass)] text-white/50 hover:bg-white/5'}`}
                                        >
                                            {renderIcon(ic)}
                                            <span className="text-xs">{ic}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label>Características</label>
                                {(currentService.features || []).map((feature, idx) => (
                                    <div key={idx} className={styles.featureRow}>
                                        <input type="text" value={feature} onChange={(e) => updateFeature(idx, e.target.value)} />
                                        <button onClick={() => removeFeature(idx)} className={styles.removeFeatureBtn}><X size={14} /></button>
                                    </div>
                                ))}
                                <button onClick={addFeature} className={styles.addFeatureBtn}>+ Agregar característica</button>
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.checkboxLabel}>
                                    <input type="checkbox" checked={currentService.active || false} onChange={(e) => setCurrentService({ ...currentService, active: e.target.checked })} />
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
