"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/button";
import { HiArrowRight } from "react-icons/hi";

export function Hero() {
  return (
    <section className="relative py-20 text-center">
      <div className="max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="inline-block mt-10 text-sm font-medium text-[#ff6b35] mb-8">
            Used by 500+ architects worldwide
          </span>

          <h1 className="text-4xl md:text-6xl font-semibold mb-8 leading-tight text-gray-900 dark:text-white">
            Professional renders. Instantly.
            No subscriptions.
          </h1>

          <p className="text-gray-500 dark:text-gray-400 text-lg max-w-2xl mx-auto mb-12">
            AI-powered templates for architects. Edit and download in seconds.
            <br />
            Pay what you use.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-gray-900 text-white hover:bg-[#ff8555]">
              Try Free – Edit Your First Image
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="flex items-center justify-center gap-2"
            >
              See how it works
              <HiArrowRight className="w-5 h-5 " />
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
