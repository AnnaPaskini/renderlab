"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
const logoNames = [
  "adobe.png",
  "autodesk-dark.png",
  "behance.png",
  "google-original-wordmark.png",
  "vercel.png",
];

const logos = logoNames.map((file) => ({
  name: file.split(".")[0],
  logo: `/logos/${file}`,
}));

export function Companies() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % logos.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="py-16 text-center">
      <h3 className="text-sm font-semibold text-gray-500 mb-12">
        Trusted by companies worldwide
      </h3>

      <div className="h-12 flex justify-center items-center relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={logos[index].name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            className="absolute"
          >
            <Image
              src={logos[index].logo}
              alt={logos[index].name}
              width={120}
              height={40}
              className="object-contain w-auto h-full"
              priority
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
