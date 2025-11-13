"use client";
import { RenderLabButton } from "@/components/ui/RenderLabButton";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export function HeroParallax() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"]
  });

  // Multi-layer parallax speeds
  const yBg = useTransform(scrollYProgress, [0, 1], ["0%", "40%"]);
  const yMid = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
  const yFg = useTransform(scrollYProgress, [0, 1], ["0%", "10%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [1, 0.8, 0]);

  return (
    <section
      ref={ref}
      className="relative h-[100vh] overflow-hidden bg-[var(--rl-bg)]"
    >
      {/* Background gradient layer */}
      <motion.div
        style={{ y: yBg }}
        className="absolute inset-0 bg-gradient-to-b from-[var(--rl-surface)] to-[var(--rl-bg)]"
      />

      {/* Mid layer - dot pattern */}
      <motion.div
        style={{ y: yMid }}
        className="absolute inset-0 opacity-40"
      >
        <div
          className="w-full h-full bg-center bg-repeat"
          style={{
            backgroundImage: `radial-gradient(circle, var(--rl-border) 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        />
      </motion.div>

      {/* Foreground content */}
      <motion.div
        style={{ y: yFg, opacity }}
        className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4 text-[var(--rl-text)]"
      >
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-5xl md:text-6xl lg:text-7xl font-semibold mb-6"
        >
          Craft Your Visuals
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="max-w-2xl text-lg md:text-xl text-[var(--rl-text-secondary)] mb-8"
        >
          Unite your workflow with a universal creative engine built for illustrators and architects.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <RenderLabButton variant="gradient" size="lg">
            Get Started
          </RenderLabButton>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="w-6 h-10 border-2 border-[var(--rl-border)] rounded-full flex justify-center p-2"
          >
            <motion.div
              className="w-1.5 h-1.5 bg-[var(--rl-accent)] rounded-full"
            />
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}
