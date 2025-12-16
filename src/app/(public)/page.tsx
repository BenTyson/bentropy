"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EntropyField } from "@/components/particles/EntropyField";
import { ParticleLetter } from "@/components/particles/ParticleLetter";
import { NebulaBackground } from "@/components/particles/NebulaBackground";
import { ProjectCard } from "@/components/public/ProjectCard";
import { ArrowRight, Sparkles } from "lucide-react";
import type { Project } from "@/lib/supabase/types";

// Placeholder featured projects until Supabase is connected
const featuredProjects: Project[] = [
  {
    id: "1",
    slug: "qr-forge",
    name: "QR Forge",
    tagline: "Craft beautiful, functional QR codes",
    description: "A powerful QR code generator with customization options",
    problem: null,
    solution: null,
    outcome: null,
    tech_stack: ["Next.js", "Canvas API", "Tailwind"],
    status: "active",
    featured: true,
    display_order: 1,
    demo_url: null,
    repo_url: null,
    image_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "2",
    slug: "scribe",
    name: "Scribe",
    tagline: "Transform thoughts into polished documentation",
    description: "AI-powered writing assistant for developers",
    problem: null,
    solution: null,
    outcome: null,
    tech_stack: ["React", "OpenAI", "MDX"],
    status: "active",
    featured: true,
    display_order: 2,
    demo_url: null,
    repo_url: null,
    image_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "3",
    slug: "clarify",
    name: "Clarify",
    tagline: "Make complex ideas crystal clear",
    description: "Simplify explanations with AI assistance",
    problem: null,
    solution: null,
    outcome: null,
    tech_stack: ["TypeScript", "Claude API", "Next.js"],
    status: "concept",
    featured: true,
    display_order: 3,
    demo_url: null,
    repo_url: null,
    image_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export default function HomePage() {
  const [heroComplete, setHeroComplete] = useState(false);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Show content after hero animation
    if (heroComplete) {
      const timer = setTimeout(() => setShowContent(true), 300);
      return () => clearTimeout(timer);
    }
  }, [heroComplete]);

  return (
    <div className="relative min-h-screen">
      {/* Nebula Background - slow zoom and parallax */}
      <NebulaBackground
        imageUrl="https://i.imgur.com/tbCBJZg.jpeg"
        opacity={0.5}
        zoomDuration={45}
        parallaxIntensity={0.2}
      />

      {/* Particle Background - on top of nebula */}
      <div className="fixed inset-0 -z-10">
        <EntropyField chaotic={!heroComplete} density={60} links={true} />
      </div>

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center px-6">
        <div className="text-center max-w-4xl mx-auto">
          {/* Main Title - "B" formed by particles + static "ENTROPY" */}
          <h1 className="text-6xl md:text-8xl font-bold mb-6 flex items-center justify-center">
            {/* Particle-formed B */}
            <ParticleLetter
              letter="B"
              width={80}
              height={100}
              particleCount={200}
              delay={500}
              onAnimationComplete={() => setHeroComplete(true)}
              className="md:w-[120px] md:h-[150px]"
            />
            {/* Static ENTROPY text - fades in as B forms */}
            <motion.span
              className="gradient-text"
              initial={{ opacity: 0.3 }}
              animate={{ opacity: heroComplete ? 1 : 0.3 }}
              transition={{ duration: 0.8 }}
            >
              ENTROPY
            </motion.span>
          </h1>

          {/* Tagline */}
          <AnimatePresence>
            {heroComplete && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <p className="text-xl md:text-2xl text-muted-foreground mb-4">
                  Fighting entropy, one project at a time
                </p>
                <p className="text-text-secondary max-w-2xl mx-auto mb-8">
                  I build web applications that bring order to chaos. Each
                  project is a small victory against the universe&apos;s tendency
                  toward disorder.
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/projects">
                    <Button
                      size="lg"
                      className="group bg-gradient-to-r from-accent-blue to-accent-violet hover:opacity-90 transition-opacity"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Explore Projects
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                  <Link href="/about">
                    <Button
                      size="lg"
                      variant="outline"
                      className="border-border hover:bg-surface-2"
                    >
                      About Me
                    </Button>
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Scroll indicator */}
        <AnimatePresence>
          {showContent && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute bottom-8 left-1/2 -translate-x-1/2"
            >
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center pt-2"
              >
                <motion.div className="w-1.5 h-1.5 rounded-full bg-accent-blue" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Featured Projects Section */}
      <AnimatePresence>
        {showContent && (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="relative py-24 px-6"
          >
            <div className="max-w-6xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center mb-12"
              >
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Victories Against Entropy
                </h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Each project started as a chaotic idea and was forged into
                  something useful. Here are a few favorites.
                </p>
              </motion.div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredProjects.map((project, index) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    index={index}
                  />
                ))}
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center mt-12"
              >
                <Link href="/projects">
                  <Button variant="outline" size="lg">
                    View All Projects
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </motion.div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Philosophy Section */}
      <AnimatePresence>
        {showContent && (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative py-24 px-6 bg-surface-1/50"
          >
            <div className="max-w-4xl mx-auto text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                  The <span className="gradient-text">Bentropy</span> Philosophy
                </h2>
                <div className="space-y-6 text-lg text-text-secondary">
                  <p>
                    <strong className="text-foreground">Entropy</strong> is the
                    universe&apos;s tendency toward disorder. Ideas scatter. Tabs
                    multiply. Projects fragment into chaos.
                  </p>
                  <p>
                    <strong className="gradient-text">Bentropy</strong> is my
                    deliberate fight against that chaos. Taking the swirling
                    noise of creative thought and crystallizing it into working
                    software.
                  </p>
                  <p className="text-muted-foreground">
                    My mind generates entropy at an alarming rate. But with each
                    project shipped, each problem solved, each idea made real -
                    I push back against the void.
                  </p>
                </div>
                <div className="mt-8">
                  <Link href="/about">
                    <Button
                      variant="ghost"
                      className="text-accent-blue hover:text-accent-violet"
                    >
                      Learn more about me
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </motion.div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
