"use client";

import { useState, useEffect } from "react";

export interface ParticlePosition {
  x: number;
  y: number;
  id: string;
}

interface UseLetterParticlesOptions {
  letter: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  maxParticles?: number;
  samplingStep?: number; // pixels to skip between samples
}

/**
 * Hook that generates particle positions by rendering a letter to canvas
 * and sampling the pixel data to find where the letter exists.
 * Only runs on the client side.
 */
export function useLetterParticles({
  letter,
  fontSize = 200,
  fontFamily = "Inter, system-ui, sans-serif",
  fontWeight = "900",
  maxParticles = 250,
  samplingStep = 3,
}: UseLetterParticlesOptions): ParticlePosition[] {
  const [positions, setPositions] = useState<ParticlePosition[]>([]);

  useEffect(() => {
    // Create offscreen canvas
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size with padding
    const padding = 20;
    canvas.width = fontSize + padding * 2;
    canvas.height = fontSize + padding * 2;

    // Configure font and draw letter
    ctx.fillStyle = "white";
    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    ctx.textBaseline = "top";
    ctx.textAlign = "left";

    // Measure text to center it
    const metrics = ctx.measureText(letter);
    const textWidth = metrics.width;
    const textHeight = fontSize; // Approximate

    // Draw centered
    const x = (canvas.width - textWidth) / 2;
    const y = (canvas.height - textHeight) / 2;
    ctx.fillText(letter, x, y);

    // Get pixel data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;

    // Sample pixels where the letter exists
    const newPositions: ParticlePosition[] = [];
    const alphaThreshold = 128; // Minimum alpha to count as "filled"

    for (let py = 0; py < canvas.height; py += samplingStep) {
      for (let px = 0; px < canvas.width; px += samplingStep) {
        const i = (py * canvas.width + px) * 4;
        const alpha = pixels[i + 3]; // Alpha channel

        if (alpha > alphaThreshold) {
          newPositions.push({
            // Normalize to 0-1 range, centered
            x: (px / canvas.width) * 2 - 1, // -1 to 1
            y: (py / canvas.height) * 2 - 1, // -1 to 1
            id: `particle-${newPositions.length}`,
          });
        }
      }
    }

    // Shuffle and limit particles
    const shuffled = newPositions.sort(() => Math.random() - 0.5);
    setPositions(shuffled.slice(0, maxParticles));
  }, [letter, fontSize, fontFamily, fontWeight, maxParticles, samplingStep]);

  return positions;
}
