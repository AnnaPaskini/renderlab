"use client";

import { Button } from "@/components/button";
import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";


export function PricingRenderLab() {
  return (
    <section className="py-24 text-center">
      <div className="max-w-5xl mx-auto px-6">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-3xl md:text-5xl font-semibold mb-4"
        >
          Simple, usage-based pricing
        </motion.h2>

        <p className="text-gray-700 dark:text-gray-300 mb-12">
          No subscriptions. Pay only when you generate renders. Designed for freelancers and studios alike.
        </p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="p-8 bg-gray-50 dark:bg-gray-800 rounded-2xl shadow-lg shadow-black/20 max-w-md mx-auto"
        >
          <h3 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
            Pay-per-Render
          </h3>

          <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">
            Generate and download professional renders instantly — no recurring fees.
          </p>

          <div className="text-5xl font-bold mb-4" style={{ color: '#F97316' }}
          >
            $0.3
            <span className="text-lg font-medium text-gray-500 dark:text-gray-400"> / edit</span>
          </div>

          <div className="flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400 mb-6
           text-sm">
            <ShieldCheck className="w-4 h-4 text-green-600 dark:text-green-400" />
            Includes full-resolution output and commercial license.
          </div>


          <Button
            size="lg"
            className="bg-black text-white hover:bg-gray-900 w-full transition-colors"
          >
            Start Free Trial
          </Button>
        </motion.div>

        <p className="text-xs text-gray-500 dark:text-gray-400 mt-8">
          Volume discounts available for studios. Contact us for custom pricing.
        </p>
      </div>
    </section>
  );
}
