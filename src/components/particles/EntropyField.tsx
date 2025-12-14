"use client";

import { useCallback, useEffect, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { Container, ISourceOptions } from "@tsparticles/engine";

interface EntropyFieldProps {
  className?: string;
  /** Whether particles should be in chaotic state or ordered */
  chaotic?: boolean;
  /** Particle density - higher = more particles */
  density?: number;
  /** Whether to show connecting lines */
  links?: boolean;
}

export function EntropyField({
  className = "",
  chaotic = true,
  density = 80,
  links = true,
}: EntropyFieldProps) {
  const [init, setInit] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  const particlesLoaded = useCallback(
    async (container: Container | undefined) => {
      // Container loaded, could trigger animations here
      console.log("Entropy field initialized", container?.id);
    },
    []
  );

  const options: ISourceOptions = {
    fullScreen: false,
    background: {
      color: {
        value: "transparent",
      },
    },
    fpsLimit: 60,
    interactivity: {
      events: {
        onHover: {
          enable: true,
          mode: chaotic ? "repulse" : "grab",
        },
        onClick: {
          enable: true,
          mode: "push",
        },
      },
      modes: {
        repulse: {
          distance: 100,
          duration: 0.4,
        },
        grab: {
          distance: 140,
          links: {
            opacity: 0.5,
            color: "#8b5cf6",
          },
        },
        push: {
          quantity: 4,
        },
      },
    },
    particles: {
      color: {
        value: ["#3b82f6", "#8b5cf6", "#06b6d4"],
      },
      links: {
        color: "#3b82f6",
        distance: 150,
        enable: links,
        opacity: chaotic ? 0.1 : 0.3,
        width: 1,
      },
      move: {
        direction: chaotic ? "none" : "none",
        enable: true,
        outModes: {
          default: "bounce",
        },
        random: chaotic,
        speed: chaotic ? 2 : 0.5,
        straight: !chaotic,
      },
      number: {
        density: {
          enable: true,
          width: 1200,
          height: 800,
        },
        value: density,
      },
      opacity: {
        value: { min: 0.3, max: 0.7 },
        animation: {
          enable: true,
          speed: 1,
          sync: false,
        },
      },
      shape: {
        type: "circle",
      },
      size: {
        value: { min: 1, max: 3 },
      },
    },
    detectRetina: true,
  };

  if (!init) {
    return null;
  }

  return (
    <Particles
      id="entropy-particles"
      className={className}
      particlesLoaded={particlesLoaded}
      options={options}
    />
  );
}
