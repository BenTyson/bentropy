"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useLetterParticles } from "./useLetterParticles";

interface ParticleLetterProps {
  letter: string;
  className?: string;
  width?: number;
  height?: number;
  particleCount?: number;
  colors?: string[];
  delay?: number;
  onAnimationComplete?: () => void;
}

interface ParticleData {
  id: string;
  x: number;
  y: number;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  color: string;
  size: number;
  delay: number;
  opacity: number;
}

export function ParticleLetter({
  letter,
  className = "",
  width = 120,
  height = 150,
  particleCount = 250,
  colors = ["#3b82f6", "#8b5cf6", "#06b6d4"], // blue, violet, cyan
  delay = 500,
  onAnimationComplete,
}: ParticleLetterProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [particleData, setParticleData] = useState<ParticleData[]>([]);
  const shouldReduceMotion = useReducedMotion();
  const hasInitialized = useRef(false);

  // Get particle target positions from the letter shape
  const particlePositions = useLetterParticles({
    letter,
    fontSize: 200,
    fontWeight: "900",
    maxParticles: particleCount,
    samplingStep: 3,
  });

  // Generate random starting positions and colors when positions are first available
  useEffect(() => {
    if (particlePositions.length > 0 && !hasInitialized.current) {
      hasInitialized.current = true;

      const data = particlePositions.map((pos, i) => ({
        ...pos,
        // Random starting position (scattered around the area)
        startX: (Math.random() - 0.5) * width * 3,
        startY: (Math.random() - 0.5) * height * 3,
        // Target position (scaled to container size)
        targetX: pos.x * (width / 2),
        targetY: pos.y * (height / 2),
        // Random color from palette
        color: colors[Math.floor(Math.random() * colors.length)],
        // Random size variation
        size: 2 + Math.random() * 2,
        // Staggered delay
        delay: (i / particlePositions.length) * 0.8,
        // Random opacity
        opacity: 0.6 + Math.random() * 0.4,
      }));

      setParticleData(data);
    }
  }, [particlePositions, width, height, colors]);

  // Start animation after delay (once particles are ready)
  useEffect(() => {
    if (particleData.length === 0) return;

    const timer = setTimeout(() => {
      setIsAnimating(true);
    }, delay);
    return () => clearTimeout(timer);
  }, [delay, particleData.length]);

  // Handle animation complete
  const handleAnimationComplete = () => {
    if (!isComplete) {
      setIsComplete(true);
      onAnimationComplete?.();
    }
  };

  // Show nothing while loading particle positions
  if (particleData.length === 0) {
    return (
      <div
        className={`relative ${className}`}
        style={{ width, height }}
      />
    );
  }

  // For reduced motion, just show the formed letter immediately
  if (shouldReduceMotion) {
    return (
      <div
        className={`relative ${className}`}
        style={{ width, height }}
      >
        {particleData.map((particle) => (
          <div
            key={particle.id}
            className="absolute rounded-full"
            style={{
              width: particle.size,
              height: particle.size,
              backgroundColor: particle.color,
              left: `calc(50% + ${particle.targetX}px)`,
              top: `calc(50% + ${particle.targetY}px)`,
              opacity: particle.opacity,
              boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`relative ${className}`}
      style={{ width, height }}
    >
      {particleData.map((particle, index) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
          }}
          initial={{
            x: particle.startX,
            y: particle.startY,
            scale: 0,
            opacity: 0,
            left: "50%",
            top: "50%",
          }}
          animate={
            isAnimating
              ? {
                  x: particle.targetX,
                  y: particle.targetY,
                  scale: 1,
                  opacity: particle.opacity,
                }
              : {
                  x: particle.startX,
                  y: particle.startY,
                  scale: 0.5,
                  opacity: 0.3,
                }
          }
          transition={{
            type: "spring",
            damping: 20,
            stiffness: 80,
            delay: isAnimating ? particle.delay : 0,
            duration: isAnimating ? undefined : 0,
          }}
          onAnimationComplete={
            index === particleData.length - 1 ? handleAnimationComplete : undefined
          }
        />
      ))}

      {/* Subtle idle animation after formation */}
      {isComplete && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {particleData.map((particle) => (
            <motion.div
              key={`glow-${particle.id}`}
              className="absolute rounded-full pointer-events-none"
              style={{
                width: particle.size * 1.5,
                height: particle.size * 1.5,
                backgroundColor: particle.color,
                filter: `blur(${particle.size}px)`,
                left: `calc(50% + ${particle.targetX}px)`,
                top: `calc(50% + ${particle.targetY}px)`,
                transform: "translate(-25%, -25%)",
              }}
              animate={{
                opacity: [0.2, 0.4, 0.2],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut",
              }}
            />
          ))}
        </motion.div>
      )}
    </div>
  );
}
