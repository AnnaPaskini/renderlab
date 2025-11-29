"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

interface SkeletonCardProps {
    isGenerating: boolean;
}

export function SkeletonCard({ isGenerating }: SkeletonCardProps) {
    const [progress, setProgress] = useState(0);
    const skeletonRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to skeleton when generation starts
    useEffect(() => {
        if (isGenerating && skeletonRef.current) {
            setTimeout(() => {
                skeletonRef.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                });
            }, 100);
        }
    }, [isGenerating]);

    useEffect(() => {
        if (!isGenerating) {
            setProgress(0);
            return;
        }

        // Fast progress to 30% in first 2 seconds
        const fastInterval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 30) return prev;
                return prev + 3;
            });
        }, 200);

        // After 2 sec, slow progress to 60%
        const slowTimeout = setTimeout(() => {
            clearInterval(fastInterval);
            const slowInterval = setInterval(() => {
                setProgress((prev) => {
                    if (prev >= 60) {
                        clearInterval(slowInterval);
                        return 60;
                    }
                    return prev + 1;
                });
            }, 500);

            return () => clearInterval(slowInterval);
        }, 2000);

        return () => {
            clearInterval(fastInterval);
            clearTimeout(slowTimeout);
        };
    }, [isGenerating]);

    return (
        <AnimatePresence>
            {isGenerating && (
                <motion.div
                    ref={skeletonRef}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="rl-skeleton aspect-square flex flex-col justify-end"
                >
                    {/* Progress percentage in center */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-sm text-white/40 font-medium">
                            {progress}%
                        </span>
                    </div>

                    {/* Thin progress bar at bottom */}
                    <div className="relative z-10 h-0.5 bg-black/30 mx-3 mb-3 rounded-full overflow-hidden">
                        <div
                            className="h-full transition-all duration-300 ease-out rounded-full"
                            style={{
                                width: `${progress}%`,
                                background: "linear-gradient(90deg, #ff6b35 0%, #ff8555 100%)",
                            }}
                        />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
