"use client";

import { useEffect, useRef } from "react";

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    baseSize: number;
    currentSize: number;
}

export default function ParticleBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mouse = useRef({ x: -1000, y: -1000, radius: 200 });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let particles: Particle[] = [];
        let animationFrameId: number;
        let width = 0;
        let height = 0;

        const resize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
            initParticles();
        };

        const initParticles = () => {
            particles = [];
            const particleCount = Math.min(Math.floor((width * height) / 9000), 160);

            for (let i = 0; i < particleCount; i++) {
                const size = Math.random() * 2 + 1;
                particles.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: (Math.random() - 0.5) * 0.5,
                    baseSize: size,
                    currentSize: size,
                });
            }
        };

        const draw = () => {
            ctx.clearRect(0, 0, width, height);

            // Update and draw particles
            particles.forEach((p, i) => {
                // Base movement
                p.x += p.vx;
                p.y += p.vy;

                // Bounce off edges
                if (p.x < 0 || p.x > width) p.vx *= -1;
                if (p.y < 0 || p.y > height) p.vy *= -1;

                // Mouse interaction
                const dxMouse = p.x - mouse.current.x;
                const dyMouse = p.y - mouse.current.y;
                const distMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);

                // Default size reset
                let targetSize = p.baseSize;

                if (distMouse < mouse.current.radius) {
                    // Draw line to mouse
                    ctx.beginPath();
                    const opacity = 1 - Math.pow(distMouse / mouse.current.radius, 2);
                    ctx.strokeStyle = `rgba(31, 107, 255, ${opacity * 0.6})`;
                    ctx.lineWidth = 1;
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(mouse.current.x, mouse.current.y);
                    ctx.stroke();

                    // Attraction force
                    const force = (mouse.current.radius - distMouse) / mouse.current.radius;
                    const angle = Math.atan2(dyMouse, dxMouse);

                    // Smooth attraction
                    p.vx -= Math.cos(angle) * force * 0.03;
                    p.vy -= Math.sin(angle) * force * 0.03;

                    // Grow near mouse
                    targetSize = p.baseSize * 1.8;
                }

                // Smooth size transition
                p.currentSize += (targetSize - p.currentSize) * 0.1;

                // Speed Limit (friction)
                const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
                const maxSpeed = 2; // Maximum pixel per frame
                if (speed > maxSpeed) {
                    p.vx = (p.vx / speed) * maxSpeed;
                    p.vy = (p.vy / speed) * maxSpeed;
                } else if (speed < 0.1) {
                    // Inject minimum energy to prevent stagnation
                    p.vx *= 1.01;
                    p.vy *= 1.01;
                }

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.currentSize, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(31, 107, 255, ${0.5 + (p.currentSize - p.baseSize) * 0.1})`; // Brighter when bigger
                ctx.fill();

                // Connect particles to each other
                for (let j = i + 1; j < particles.length; j++) {
                    const p2 = particles[j];
                    const dx = p.x - p2.x;
                    const dy = p.y - p2.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < 120) {
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(31, 107, 255, ${0.15 - distance / 1000})`;
                        ctx.lineWidth = 0.5;
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.stroke();
                    }
                }
            });

            animationFrameId = requestAnimationFrame(draw);
        };

        const handleMouseMove = (e: MouseEvent) => {
            if (canvas) {
                const rect = canvas.getBoundingClientRect();
                mouse.current.x = e.clientX - rect.left;
                mouse.current.y = e.clientY - rect.top;
            }
        };

        const handleMouseLeave = () => {
            mouse.current.x = -1000;
            mouse.current.y = -1000;
        };

        window.addEventListener("resize", resize);
        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseout", handleMouseLeave);

        resize();
        draw();

        return () => {
            window.removeEventListener("resize", resize);
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseout", handleMouseLeave);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                zIndex: 1,
                pointerEvents: "none",
            }}
        />
    );
}
