"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Trash2, RotateCw, Download } from "lucide-react";
import { NavBar } from "@/components/navbar";
import { Container } from "@/components/container";
import { Button } from "@/components/button";
import Link from "next/link";

interface HistoryItem {
  id: string;
  inputImage: string;
  outputImages: string[];
  prompt: string;
  createdAt: Date;
}

const MOCK_HISTORY: HistoryItem[] = [];

export default function HistoryPage() {
  const [items, setItems] = useState<HistoryItem[]>(MOCK_HISTORY);

  const handleDelete = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <>
      <NavBar />
      <Container>
        <div className="pt-32 pb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-4xl font-bold mb-4 dark:text-white">
              Generation History
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400 mb-8">
              All your previous generations in one place
            </p>
          </motion.div>

          {items.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                No generations yet
              </p>
              <Link href="/workspace">
                <Button>Start Creating</Button>
              </Link>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid gap-4"
            >
              {items.map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 overflow-hidden hover:shadow-lg transition-shadow p-4"
                >
                  <div className="flex gap-4">
                    {/* Input Image */}
                    <div className="w-24 h-24 flex-shrink-0 relative">
                      <Image
                        src={item.inputImage}
                        alt="Input"
                        fill
                        className="object-cover rounded-lg"
                      />
                    </div>

                    {/* Output Images */}
                    <div className="flex gap-2">
                      {item.outputImages.map((img, idx) => (
                        <div key={idx} className="w-24 h-24 flex-shrink-0 relative">
                          <Image
                            src={img}
                            alt="Output"
                            fill
                            className="object-cover rounded-lg"
                          />
                        </div>
                      ))}
                    </div>

                    {/* Details */}
                    <div className="flex-1">
                      <p className="text-sm dark:text-neutral-300 mb-2">
                        {item.prompt}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {item.createdAt.toLocaleDateString()}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition">
                        <RotateCw size={18} />
                      </button>
                      <button className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition">
                        <Download size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-2 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 rounded-lg transition"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </Container>
    </>
  );
}