"use client";

import {
  motion,
  MotionValue,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import Link from "next/link";
import React from "react";

export const HeroParallax = ({
  products,
}: {
  products: { title: string; link: string; thumbnail: string }[];
}) => {
  const firstRow = products.slice(0, 6);
  const secondRow = products.slice(6, 12);
  const thirdRow = products.slice(12, 19);

  const ref = React.useRef(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const springConfig = { stiffness: 100, damping: 30, bounce: 0 };

  const translateX = useSpring(
    useTransform(scrollYProgress, [0, 1], [0, 200]),
    springConfig
  );
  const translateXReverse = useSpring(
    useTransform(scrollYProgress, [0, 1], [0, -200]),
    springConfig
  );
  const rotateX = useSpring(
    useTransform(scrollYProgress, [0, 0.2], [8, 0]),
    springConfig
  );
  const opacity = useSpring(
    useTransform(scrollYProgress, [0, 0.1], [0.2, 1]),
    springConfig
  );
  const rotateZ = useSpring(
    useTransform(scrollYProgress, [0, 0.1], [20, 0]),
    springConfig
  );
  const translateY = useSpring(
    useTransform(scrollYProgress, [0, 0.1], [-300, 150]),
    springConfig
  );

  const cardOpacity = useTransform(scrollYProgress, [0, 0.25, 0.4], [0.3, 0.6, 1]);

  return (
    <div
      ref={ref}
      className="h-[180vh] py-20 overflow-hidden antialiased relative flex flex-col self-auto [perspective:1000px] [transform-style:preserve-3d]"
    >
      <div
        className="absolute top-0 left-0 w-full h-[650px] bg-gradient-to-b from-black/95 via-black/70 to-transparent pointer-events-none z-[5]"
      />
      <div className="relative z-[30]">
        <Header />
      </div>
      <motion.div
        className="relative z-[10]"
        style={{
          rotateX,
          rotateZ,
          translateY,
        }}
      >
        <motion.div className="flex flex-row-reverse space-x-reverse space-x-20 mb-20">
          {firstRow.map((product, idx) => (
            <ProductCard
              product={product}
              translate={translateX}
              cardOpacity={cardOpacity}
              key={product.title + idx}
            />
          ))}
        </motion.div>
        <motion.div className="flex flex-row mb-20 space-x-20">
          {secondRow.map((product, idx) => (
            <ProductCard
              product={product}
              translate={translateXReverse}
              cardOpacity={cardOpacity}
              key={product.title + idx}
            />
          ))}
        </motion.div>
        <motion.div className="flex flex-row-reverse space-x-reverse space-x-20">
          {thirdRow.map((product, idx) => (
            <ProductCard
              product={product}
              translate={translateX}
              cardOpacity={cardOpacity}
              key={product.title + idx}
            />
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
};


export const Header = () => (
  <div className="max-w-7xl relative mx-auto py-20 md:py-40 px-4 w-full left-0 top-0 z-[25]">
    <h1 className="text-2xl md:text-7xl font-bold dark:text-white">
      The Ultimate <br /> development studio
    </h1>
    <p className="max-w-2xl text-base md:text-xl mt-8 dark:text-white">
      We build beautiful products together. No subscription. Pay as you go.
    </p>
  </div>
);

export const ProductCard = ({
  product,
  translate,
  cardOpacity,
}: {
  product: {
    title: string;
    link: string;
    thumbnail: string;
  };
  translate: MotionValue<number>;
  cardOpacity: MotionValue<number>;
}) => {
  return (
    <motion.div
      style={{
        x: translate,
        opacity: cardOpacity,
      }}
      whileHover={{
        y: -20,
      }}
      key={product.title}
      className="group/product h-96 w-[30rem] relative flex-shrink-0"
    >
      <Link
        href={product.link}
        className="block group-hover/product:shadow-2xl"
      >
        <img
          src={product.thumbnail}
          height="600"
          width="600"
          className="object-cover object-left-top absolute h-full w-full inset-0"
          alt={product.title}
        />
      </Link>
      <div className="absolute inset-0 h-full w-full opacity-0 group-hover/product:opacity-80 bg-black pointer-events-none"></div>
      <h2 className="absolute bottom-4 left-4 opacity-0 group-hover/product:opacity-100 text-white">
        {product.title}
      </h2>
    </motion.div>
  );
};
