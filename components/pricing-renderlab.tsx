"use client";

import { Button } from "@/components/button";
import { motion } from "framer-motion";
import { Crown, ImageUp, Sparkles, Zap } from "lucide-react";

const models = [
  {
    category: "Fast & Efficient",
    items: [
      { name: "Nano Banana", price: 0.04, icon: Zap, description: "Fast, high quality" },
      { name: "Seedream", price: 0.03, icon: Sparkles, description: "Creative styles" },
      { name: "Flux Kontext", price: 0.04, icon: Sparkles, description: "Context-aware edits" },
      { name: "Upscale", price: 0.02, icon: ImageUp, description: "4x resolution" },
    ]
  },
  {
    category: "Pro Models",
    items: [
      { name: "Nano Banana Pro", price: 0.30, icon: Crown, description: "Premium quality" },
      { name: "Flux Pro", price: 0.40, icon: Crown, description: "Best-in-class" },
    ]
  }
];

export function PricingRenderLab() {
  return (
    <section className="py-24">
      <div className="max-w-4xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-semibold mb-4">
            Pay only for what you use
          </h2>
          <p className="text-gray-400 text-lg">
            No subscriptions. No commitments. Just results.
          </p>
        </motion.div>

        {models.map((category, idx) => (
          <motion.div
            key={category.category}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: idx * 0.1 }}
            className="mb-12"
          >
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">
              {category.category}
            </h3>
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              {category.items.map((model, index) => (
                <div
                  key={model.name}
                  className={`flex items-center justify-between p-5 ${index !== category.items.length - 1 ? 'border-b border-white/10' : ''
                    }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                      <model.icon className="w-5 h-5 text-orange-500" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{model.name}</p>
                      <p className="text-gray-500 text-sm">{model.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-white">${model.price.toFixed(2)}</span>
                    <span className="text-gray-500 text-sm ml-1">/ image</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ))}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center mt-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full mb-6">
            <span className="text-green-400 text-sm">🎁 New users get 10 free credits</span>
          </div>

          <div>
            <Button
              size="lg"
              className="bg-orange-500 hover:bg-orange-600 text-white px-8"
            >
              Start Creating
            </Button>
          </div>

          <p className="text-gray-500 text-sm mt-6">
            Questions? Contact us at hello@renderlab.art
          </p>
        </motion.div>
      </div>
    </section>
  );
}
