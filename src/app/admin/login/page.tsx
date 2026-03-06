"use client";

import { useState, useTransition } from "react";
import { Lock, Mail, Loader2, ArrowRight, Zap } from "lucide-react";
import { login } from "@/lib/actions/auth";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminLogin() {
    const [isPending, startTransition] = useTransition();
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setErrorMsg(null);

        const formData = new FormData(e.currentTarget);

        startTransition(async () => {
            const res = await login(formData);
            if (res?.error) {
                setErrorMsg(res.error);
            }
        });
    };

    return (
        <div className="relative min-h-screen bg-[var(--bg-obsidian)] flex items-center justify-center p-4 overflow-hidden">

            {/* Ambient glows */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[var(--brand-neon)] opacity-[0.04] rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-600 opacity-[0.05] rounded-full blur-[100px] pointer-events-none" />

            {/* Animated grid lines */}
            <div className="absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage: 'linear-gradient(var(--border-glass) 1px, transparent 1px), linear-gradient(90deg, var(--border-glass) 1px, transparent 1px)',
                    backgroundSize: '60px 60px'
                }}
            />

            <motion.div
                initial={{ opacity: 0, y: 32, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="relative z-10 w-full max-w-md"
            >
                {/* Card */}
                <div className="glass-panel rounded-2xl p-8 border border-[var(--border-glass)] shadow-[0_40px_80px_rgba(0,0,0,0.5)]">

                    {/* Top accent */}
                    <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-[var(--brand-neon)]/50 to-transparent rounded-full" />

                    {/* Logo / brand */}
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1, duration: 0.4 }}
                        className="flex flex-col items-center mb-8"
                    >
                        <div className="w-14 h-14 rounded-2xl bg-[var(--brand-neon)]/10 border border-[var(--brand-neon)]/30 flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(0,123,255,0.15)]">
                            <Zap size={26} className="text-[var(--brand-neon)]" />
                        </div>
                        <h1 className="text-2xl font-extrabold tracking-tight text-white">Acceso <span className="text-[var(--brand-neon)]">Admin</span></h1>
                        <p className="text-[var(--text-muted)] text-sm mt-1">Ingrese sus credenciales para continuar</p>
                    </motion.div>

                    <motion.form
                        onSubmit={handleSubmit}
                        className="space-y-5"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.4 }}
                    >
                        <AnimatePresence>
                            {errorMsg && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3 text-center overflow-hidden"
                                >
                                    {errorMsg}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Email */}
                        <div className="space-y-1.5">
                            <label htmlFor="email" className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest">
                                Email
                            </label>
                            <div className="relative">
                                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    placeholder="admin@ai.corp"
                                    required
                                    className="w-full bg-[var(--bg-obsidian)] border border-[var(--border-glass)] rounded-xl pl-10 pr-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-[var(--brand-neon)] focus:shadow-[0_0_0_2px_rgba(0,123,255,0.1)] transition-all duration-200 text-sm"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="space-y-1.5">
                            <label htmlFor="password" className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest">
                                Contraseña
                            </label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
                                <input
                                    type="password"
                                    id="password"
                                    name="password"
                                    placeholder="••••••••"
                                    required
                                    className="w-full bg-[var(--bg-obsidian)] border border-[var(--border-glass)] rounded-xl pl-10 pr-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-[var(--brand-neon)] focus:shadow-[0_0_0_2px_rgba(0,123,255,0.1)] transition-all duration-200 text-sm"
                                />
                            </div>
                        </div>

                        <motion.button
                            type="submit"
                            disabled={isPending}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full btn-premium py-3.5 mt-2 flex items-center justify-center gap-2 group disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100"
                        >
                            {isPending ? (
                                <Loader2 className="animate-spin" size={20} />
                            ) : (
                                <>
                                    <span>Ingresar al Sistema</span>
                                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </motion.button>
                    </motion.form>
                </div>

                {/* Bottom label */}
                <p className="text-center text-xs text-[var(--text-muted)]/50 mt-4">
                    Acceso restringido — Solo personal autorizado
                </p>
            </motion.div>
        </div>
    );
}
