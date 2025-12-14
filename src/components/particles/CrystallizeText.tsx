"use client";

import { motion, useAnimation, type Variants } from "framer-motion";
import { useEffect, useState, useMemo } from "react";

interface CrystallizeTextProps {
  text: string;
  className?: string;
  delay?: number;
  onComplete?: () => void;
}

export function CrystallizeText({
  text,
  className = "",
  delay = 0,
  onComplete,
}: CrystallizeTextProps) {
  const controls = useAnimation();
  const [isVisible, setIsVisible] = useState(false);

  // Generate random positions for each letter once
  const letterOffsets = useMemo(() => {
    return text.split("").map(() => ({
      y: Math.random() * 100 - 50,
      x: Math.random() * 100 - 50,
      rotate: Math.random() * 360,
    }));
  }, [text]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
      controls.start("visible");
    }, delay);

    return () => clearTimeout(timer);
  }, [controls, delay]);

  const containerVariants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1,
      },
    },
  };

  return (
    <motion.span
      className={`inline-flex flex-wrap justify-center ${className}`}
      variants={containerVariants}
      initial="hidden"
      animate={controls}
      onAnimationComplete={() => {
        if (isVisible && onComplete) {
          onComplete();
        }
      }}
    >
      {text.split("").map((char, index) => {
        const offset = letterOffsets[index];
        return (
          <motion.span
            key={`${char}-${index}`}
            initial={{
              opacity: 0,
              y: offset.y,
              x: offset.x,
              scale: 0,
              rotate: offset.rotate,
              filter: "blur(10px)",
            }}
            variants={{
              visible: {
                opacity: 1,
                y: 0,
                x: 0,
                scale: 1,
                rotate: 0,
                filter: "blur(0px)",
              },
            }}
            transition={{
              type: "spring",
              damping: 12,
              stiffness: 100,
            }}
            className={char === " " ? "mr-2" : ""}
            style={{ display: "inline-block" }}
          >
            {char === " " ? "\u00A0" : char}
          </motion.span>
        );
      })}
    </motion.span>
  );
}
