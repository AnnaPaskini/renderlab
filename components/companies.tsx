"use client";

import { motion } from "framer-motion";
import Image from "next/image";

const logos = [
  { name: "adobe", file: "adobe.png" },
  { name: "autodesk-dark", file: "autodesk-dark.png" },
  { name: "autodesk-logo-2-dark", file: "autodesk-logo-2-dark.png" },
  { name: "behance", file: "behance.png" },
  { name: "google-original-wordmark", file: "google-original-wordmark.png" },
  { name: "google-original", file: "google-original.png" },
  { name: "lumion", file: "lumion.png" },
  { name: "sketchup", file: "sketchup.png" },
  { name: "vercel", file: "vercel.png" },
  { name: "enscape", file: "enscape.jpeg" },
];

export function Companies() {
  return (
    <section className="py-12 text-center">
      <h3 className="text-sm font-semibold text-[var(--rl-text-secondary)] mb-12">
        Trusted by companies worldwide
      </h3>

      <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
        {logos.map((logo, index) => (
          <motion.div
            key={logo.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            className="flex items-center justify-center"
          >
            <Image
              src={`/logos/${logo.file}`}
              alt={logo.name}
              width={120}
              height={32}
              className="h-[32px] w-auto object-contain opacity-70 hover:opacity-100 transition-opacity duration-200"
              priority
            />
          </motion.div>
        ))}
      </div>
    </section>
  );
}
