"use client";
import { motion } from "framer-motion";
import { RenderLabButton } from "@/components/ui/RenderLabButton";
import { ArrowRight } from "lucide-react";

export function CTASection() {
  return (
    <section className="relative py-32 bg-[var(--rl-bg)] text-center overflow-hidden">
      {/* Gradient orbs for visual interest */}
      <div 
        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{
          background: 'radial-gradient(circle, var(--rl-accent) 0%, transparent 70%)',
        }}
      />
      <div 
        className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full opacity-15 blur-3xl pointer-events-none"
        style={{
          background: 'radial-gradient(circle, var(--rl-accent) 0%, transparent 70%)',
        }}
      />
      
      {/* Motion divider line */}
      <motion.div
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        viewport={{ once: true }}
        className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-[var(--rl-accent)] to-transparent"
      />
      
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="max-w-3xl mx-auto px-6 relative z-10"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          viewport={{ once: true }}
          className="inline-block mb-4 px-4 py-1.5 rounded-full border border-[var(--rl-border)] bg-[var(--rl-surface)] text-sm text-[var(--rl-accent)] font-medium"
        >
          Start Creating Today
        </motion.div>
        
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          viewport={{ once: true }}
          className="text-4xl md:text-5xl lg:text-6xl font-semibold mb-6 text-[var(--rl-text)]"
        >
          Ready to Craft Your Visuals?
        </motion.h2>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          viewport={{ once: true }}
          className="text-lg md:text-xl text-[var(--rl-text-secondary)] mb-10 leading-relaxed"
        >
          Start building your creative workflow in RenderLab today. Join thousands of creators
          bringing their visions to life.
        </motion.p>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          viewport={{ once: true }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <RenderLabButton variant="gradient" size="lg">
            Start Now
            <ArrowRight className="w-5 h-5 ml-1" />
          </RenderLabButton>
          
          <RenderLabButton variant="outline" size="lg">
            View Examples
          </RenderLabButton>
        </motion.div>
        
        {/* Trust indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          viewport={{ once: true }}
          className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-[var(--rl-text-secondary)]"
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span>No credit card required</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            <span>Free tier available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
            <span>Cancel anytime</span>
          </div>
        </motion.div>
      </motion.div>
      
      {/* Bottom divider */}
      <motion.div
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
        viewport={{ once: true }}
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-[var(--rl-accent)] to-transparent"
      />
    </section>
  );
}
