"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

interface NebulaBackgroundProps {
  /** URL to the nebula image */
  imageUrl?: string;
  /** Parallax intensity (0-1, default 0.3) */
  parallaxIntensity?: number;
  /** Zoom animation duration in seconds */
  zoomDuration?: number;
  /** Opacity of the nebula (0-1) */
  opacity?: number;
}

export function NebulaBackground({
  imageUrl = "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=1920&q=80",
  parallaxIntensity = 0.3,
  zoomDuration = 60,
  opacity = 0.4,
}: NebulaBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll();

  // Parallax effect - moves slower than scroll
  const y = useTransform(
    scrollYProgress,
    [0, 1],
    ["0%", `${parallaxIntensity * 100}%`]
  );

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 -z-20 overflow-hidden"
      style={{ opacity }}
    >
      {/* Nebula image with slow zoom and parallax */}
      <motion.div
        className="absolute inset-0 w-full h-full"
        style={{ y }}
      >
        <motion.div
          className="absolute inset-[-20%] w-[140%] h-[140%]"
          initial={{ scale: 1 }}
          animate={{ scale: 1.2 }}
          transition={{
            duration: zoomDuration,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "linear",
          }}
        >
          <div
            className="w-full h-full bg-cover bg-center"
            style={{
              backgroundImage: `url(${imageUrl})`,
            }}
          />
        </motion.div>
      </motion.div>

      {/* Gradient overlays for depth and readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background/90" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/50 via-transparent to-background/50" />

      {/* Subtle vignette effect */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at center, transparent 0%, var(--background) 100%)",
          opacity: 0.6,
        }}
      />
    </div>
  );
}
