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
      {/* Purple glow accent */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(147,51,234,0.15)_0%,transparent_50%)] pointer-events-none z-[5]" />
      <div
        className="absolute bottom-0 left-0 w-full h-[400px] bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/50 to-transparent pointer-events-none z-[20]"
      />
      <div className="relative z-[30]">
        <HeroHeader />
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
export const HeroHeader = () => {
  return (
    <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden px-6 pt-40 pb-40">

      {/* Content */}
      <div className="relative z-10 text-center max-w-6xl mx-auto">

        {/* Subtle highlight under headline */}
        <div
          className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-[600px] h-[200px] bg-white blur-[80px] pointer-events-none mix-blend-overlay"
          style={{ opacity: 0.04 }}
        />

        {/* Top Label - Small, Premium Context */}
        <p
          style={{
            fontSize: '13px',
            fontWeight: 400,
            textTransform: 'uppercase',
            color: 'rgba(255, 255, 255, 0.4)',
            letterSpacing: '2px',
            marginBottom: '32px',
            opacity: 1
          }}
        >
          The new way to create architectural visuals
        </p>

        {/* Headline - Stop Subscribing (Thin, With Period) */}
        <h1
          style={{
            fontSize: 'clamp(48px, 8vw, 84px)',
            fontWeight: 300,
            letterSpacing: '-1.5px',
            color: 'rgba(255, 255, 255, 0.95)',
            lineHeight: 1,
            marginBottom: '16px',
            opacity: 1
          }}
        >
          Stop Subscribing.
        </h1>

        {/* Headline - Start Rendering (Bold, Orange Gradient) */}
        <h1
          style={{
            fontSize: 'clamp(44px, 7.5vw, 76px)',
            fontWeight: 600,
            letterSpacing: '-1px',
            color: 'white',
            lineHeight: 1,
            marginBottom: '80px',
            opacity: 1
          }}
        >
          Start <span
            style={{
              background: 'linear-gradient(135deg, #ff6b35 0%, #ff6b35 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontWeight: 700
            }}
          >
            Rendering
          </span>.
        </h1>

        {/* Features - Value Proposition (Vertical List) */}
        <div
          className="flex flex-col items-center gap-3"
          style={{
            marginBottom: '56px',
            fontSize: '18px',
            fontWeight: 400,
            color: 'rgba(255, 255, 255, 0.5)',
            letterSpacing: '0.3px',
            opacity: 1
          }}
        >
          <p>Architects share templates.</p>
          <p>You render world-class visuals in seconds.</p>
          <p>Just pay for what you need.</p>
        </div>

        {/* Buttons - Premium Orange + Glass */}
        <div
          style={{
            display: 'flex',
            gap: '20px',
            justifyContent: 'center',
            marginBottom: '32px',
            opacity: 1
          }}
        >
          <Link href="/workspace">
            <button
              style={{
                padding: '18px 40px',
                fontSize: '17px',
                fontWeight: 500,
                color: 'white',
                background: 'linear-gradient(135deg, #ff6b35 0%, #ff6b35 100%)',
                border: 'none',
                borderRadius: '14px',
                boxShadow: '0 8px 24px rgba(255, 107, 53, 0.25)',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 12px 32px rgba(255, 107, 53, 0.35)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(255, 107, 53, 0.25)';
              }}
            >
              Start Free Trial
            </button>
          </Link>

          <button
            style={{
              padding: '18px 40px',
              fontSize: '17px',
              fontWeight: 500,
              color: 'rgba(255, 255, 255, 0.9)',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1.5px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '14px',
              backdropFilter: 'blur(12px)',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
            }}
          >
            Watch Demo
          </button>
        </div>

        {/* Trust signals - Subtle */}
        <p
          style={{
            fontSize: '13px',
            fontWeight: 400,
            color: 'rgba(255, 255, 255, 0.35)',
            letterSpacing: '0.2px',
            opacity: 1
          }}
        >
          5 free renders •{' '}
          <span style={{ color: 'rgba(167, 139, 250, 0.7)', fontWeight: 500 }}>
            $0.3 per render
          </span>
        </p>

      </div>

    </section>
  );
};