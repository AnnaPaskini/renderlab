"use client";
import { IconHeart } from "@tabler/icons-react";
import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

import { cn } from "@/lib/utils";

// Tag component for image categories
const Tag = ({ label, variant = "default", position = "top-left" }: {
  label: string;
  variant?: "default" | "highlight" | "dark";
  position?: "top-left" | "top-right";
}) => {
  const styles = {
    default: "bg-white/90 text-black",
    highlight: "bg-orange-500/90 text-white",
    dark: "bg-black/40 text-white border border-white/10"
  };

  const positions = {
    "top-left": "top-3 left-3",
    "top-right": "top-3 right-3"
  };

  return (
    <div
      className={`
        absolute ${positions[position]}
        px-2 py-[2px]
        rounded-full
        text-[11px]
        font-medium
        backdrop-blur-sm
        shadow-sm
        z-20
        ${styles[variant]}
      `}
    >
      {label}
    </div>
  );
};

// Function to generate random tags for an image
const generateTagsForImage = (imageIndex: number) => {
  // Use deterministic selection based on imageIndex
  const tagOptions = [
    [{ label: "Trending", variant: "highlight" as const, position: "top-left" as const }],
    [{ label: "New", variant: "highlight" as const, position: "top-left" as const }],
    [{ label: "Staff Pick", variant: "dark" as const, position: "top-left" as const }],
    [{ label: "Editor's Choice", variant: "dark" as const, position: "top-left" as const }],
    [
      { label: "Trending", variant: "highlight" as const, position: "top-left" as const },
      { label: "Popular", variant: "default" as const, position: "top-right" as const }
    ],
    [
      { label: "New", variant: "highlight" as const, position: "top-left" as const },
      { label: "Modern", variant: "default" as const, position: "top-right" as const }
    ]
  ];

  return tagOptions[imageIndex % tagOptions.length];
};

// Function to generate random heart count for an image
const generateHeartCountForImage = (imageIndex: number) => {
  // Deterministic heart counts based on imageIndex
  const heartCounts = [12, 8, 15, 6, 22, 9, 18, 7, 25, 11, 14, 5, 19, 13, 16];
  return heartCounts[imageIndex % heartCounts.length];
};

export const ParallaxScroll = ({
  images,
  className,
}: {
  images: string[];
  className?: string;
}) => {
  const gridRef = useRef<any>(null);
  const { scrollYProgress } = useScroll({
    container: gridRef, // remove this if your container is not fixed height
    offset: ["start start", "end start"], // remove this if your container is not fixed height
  });

  const translateFirst = useTransform(scrollYProgress, [0, 1], [0, -200]);
  const translateSecond = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const translateThird = useTransform(scrollYProgress, [0, 1], [0, -200]);

  const third = Math.ceil(images.length / 3);

  const firstPart = images.slice(0, third);
  const secondPart = images.slice(third, 2 * third);
  const thirdPart = images.slice(2 * third);

  return (
    <div
      className={cn("h-[40rem] items-start overflow-y-auto w-full", className)}
      ref={gridRef}
    >
      <div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 items-start  max-w-5xl mx-auto gap-10 py-40 px-10"
        ref={gridRef}
      >
        <div className="grid gap-10">
          {firstPart.map((el, idx) => {
            const globalIndex = idx;
            const tags = generateTagsForImage(globalIndex);
            const heartCount = generateHeartCountForImage(globalIndex);
            return (
              <motion.div
                style={{ y: translateFirst }}
                key={"grid-1" + idx}
                className="relative group"
              >
                {tags.map((tag, tagIdx) => (
                  <Tag
                    key={tagIdx}
                    label={tag.label}
                    variant={tag.variant}
                    position={tag.position}
                  />
                ))}
                {/* Heart icon with count */}
                <div className="absolute bottom-3 right-3 z-20 flex items-center gap-1 px-2 py-1 rounded-full bg-black/40 backdrop-blur-sm border border-white/10">
                  <IconHeart size={12} className="text-red-500 fill-red-500" />
                  <span className="text-white text-xs font-medium">{heartCount}</span>
                </div>
                <img
                  src={el}
                  className="h-80 w-full object-cover object-left-top rounded-lg gap-10 !m-0 !p-0"
                  height="400"
                  width="400"
                  alt="thumbnail"
                />
              </motion.div>
            );
          })}
        </div>
        <div className="grid gap-10">
          {secondPart.map((el, idx) => {
            const globalIndex = third + idx;
            const tags = generateTagsForImage(globalIndex);
            const heartCount = generateHeartCountForImage(globalIndex);
            return (
              <motion.div
                style={{ y: translateSecond }}
                key={"grid-2" + idx}
                className="relative group"
              >
                {tags.map((tag, tagIdx) => (
                  <Tag
                    key={tagIdx}
                    label={tag.label}
                    variant={tag.variant}
                    position={tag.position}
                  />
                ))}
                {/* Heart icon with count */}
                <div className="absolute bottom-3 right-3 z-20 flex items-center gap-1 px-2 py-1 rounded-full bg-black/40 backdrop-blur-sm border border-white/10">
                  <IconHeart size={12} className="text-red-500 fill-red-500" />
                  <span className="text-white text-xs font-medium">{heartCount}</span>
                </div>
                <img
                  src={el}
                  className="h-80 w-full object-cover object-left-top rounded-lg gap-10 !m-0 !p-0"
                  height="400"
                  width="400"
                  alt="thumbnail"
                />
              </motion.div>
            );
          })}
        </div>
        <div className="grid gap-10">
          {thirdPart.map((el, idx) => {
            const globalIndex = 2 * third + idx;
            const tags = generateTagsForImage(globalIndex);
            const heartCount = generateHeartCountForImage(globalIndex);
            return (
              <motion.div
                style={{ y: translateThird }}
                key={"grid-3" + idx}
                className="relative group"
              >
                {tags.map((tag, tagIdx) => (
                  <Tag
                    key={tagIdx}
                    label={tag.label}
                    variant={tag.variant}
                    position={tag.position}
                  />
                ))}
                {/* Heart icon with count */}
                <div className="absolute bottom-3 right-3 z-20 flex items-center gap-1 px-2 py-1 rounded-full bg-black/40 backdrop-blur-sm border border-white/10">
                  <IconHeart size={12} className="text-red-500 fill-red-500" />
                  <span className="text-white text-xs font-medium">{heartCount}</span>
                </div>
                <img
                  src={el}
                  className="h-80 w-full object-cover object-left-top rounded-lg gap-10 !m-0 !p-0"
                  height="400"
                  width="400"
                  alt="thumbnail"
                />
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
