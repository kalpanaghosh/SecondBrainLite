import React, { useMemo } from "react";
import { motion } from "framer-motion";

const ParticleBackground = () => {
    // Pre-calculate stable random values for the particles to prevent re-renders
    const particles = useMemo(() => {
        return Array.from({ length: 40 }).map((_, i) => ({
            id: i,
            size: Math.random() * 15 + 5,
            x: Math.random() * 100,
            y: Math.random() * 100,
            duration: Math.random() * 20 + 15,
            delay: Math.random() * 5,
            xMovement: Math.random() * 100 - 50,
            yMovement: Math.random() * 100 - 50,
        }));
    }, []);

    return (
        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
            {/* Ambient Animated Orbs */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 dark:bg-indigo-600/20 blur-[100px] rounded-full mix-blend-screen animate-pulse-slow"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 dark:bg-purple-600/20 blur-[100px] rounded-full mix-blend-screen animate-float-delayed"></div>
            <div className="absolute top-[40%] left-[20%] w-[30%] h-[30%] bg-cyan-500/10 dark:bg-cyan-500/20 blur-[120px] rounded-full mix-blend-screen animate-pulse"></div>

            {/* Floating Particles */}
            {particles.map((p) => (
                <motion.div
                    key={p.id}
                    className="absolute rounded-full bg-indigo-500/20 dark:bg-indigo-400/30 backdrop-blur-sm border border-white/10 dark:border-white/5"
                    style={{
                        width: p.size,
                        height: p.size,
                        left: `${p.x}%`,
                        top: `${p.y}%`,
                    }}
                    animate={{
                        y: [0, p.yMovement, 0],
                        x: [0, p.xMovement, 0],
                        opacity: [0.1, 0.6, 0.1],
                        scale: [1, 1.2, 1]
                    }}
                    transition={{
                        duration: p.duration,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: p.delay
                    }}
                />
            ))}
        </div>
    );
};

export default ParticleBackground;
