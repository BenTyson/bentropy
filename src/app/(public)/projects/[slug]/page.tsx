"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EntropyField } from "@/components/particles/EntropyField";
import { ArrowLeft, ExternalLink, Github, Zap, Target, Trophy } from "lucide-react";
import type { Project } from "@/lib/supabase/types";

// Placeholder - would come from Supabase
const projectsData: Record<string, Project> = {
  "qr-forge": {
    id: "1",
    slug: "qr-forge",
    name: "QR Forge",
    tagline: "Craft beautiful, functional QR codes",
    description:
      "A powerful QR code generator that lets you create customized, branded QR codes. No more generic black and white squares - make codes that match your brand identity while maintaining perfect scannability.",
    problem:
      "QR codes are ubiquitous in modern marketing and logistics, but most generators produce generic, ugly results. Businesses need QR codes that represent their brand, not generic black squares.",
    solution:
      "QR Forge provides a visual editor for crafting QR codes with custom colors, logos, shapes, and styles. Real-time preview ensures codes remain scannable while looking unique.",
    outcome:
      "Beautiful QR codes that maintain brand consistency and actually get scanned. Higher engagement rates through attractive design.",
    tech_stack: ["Next.js", "Canvas API", "Tailwind CSS", "TypeScript", "Vercel"],
    status: "active",
    featured: true,
    display_order: 1,
    demo_url: "https://qrforge.example.com",
    repo_url: "https://github.com/bentyson/qr-forge",
    image_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  scribe: {
    id: "2",
    slug: "scribe",
    name: "Scribe",
    tagline: "Transform thoughts into polished documentation",
    description:
      "An AI-powered writing assistant specifically designed for developers. Scribe understands code context and helps generate clear, comprehensive documentation that developers actually want to read.",
    problem:
      "Documentation is the bane of every developer's existence. It's tedious to write, easy to neglect, and often becomes outdated. Good docs require clear writing skills that many technical people lack.",
    solution:
      "Scribe analyzes your codebase and generates documentation drafts that understand your architecture. It suggests improvements, maintains consistent style, and keeps docs in sync with code changes.",
    outcome:
      "Comprehensive documentation in minutes instead of hours. Docs that stay current and actually help users understand your code.",
    tech_stack: ["React", "OpenAI API", "MDX", "Prisma", "PostgreSQL", "Tailwind"],
    status: "active",
    featured: true,
    display_order: 2,
    demo_url: null,
    repo_url: "https://github.com/bentyson/scribe",
    image_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  clarify: {
    id: "3",
    slug: "clarify",
    name: "Clarify",
    tagline: "Make complex ideas crystal clear",
    description:
      "An AI-powered tool that helps experts explain complex topics to any audience. Paste in technical content and Clarify rewrites it for your target audience - from executives to beginners.",
    problem:
      "The curse of knowledge: experts struggle to explain their domain to non-experts. Technical docs are often impenetrable to newcomers, and simplifying without losing accuracy is genuinely hard.",
    solution:
      "Clarify uses advanced language models to transform complex explanations into clear, audience-appropriate content. It preserves technical accuracy while adjusting vocabulary and examples.",
    outcome:
      "Technical knowledge becomes accessible. Better onboarding docs, clearer presentations, and happier stakeholders who finally understand what you're building.",
    tech_stack: ["TypeScript", "Claude API", "Next.js", "Framer Motion", "Tailwind"],
    status: "concept",
    featured: true,
    display_order: 3,
    demo_url: null,
    repo_url: null,
    image_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
};

export default function ProjectPage() {
  const params = useParams();
  const slug = params.slug as string;
  const project = projectsData[slug];

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Project not found</h1>
          <Link href="/projects">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to projects
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const statusColors = {
    active: "bg-accent-blue",
    shipped: "bg-entropy-ordered",
    concept: "bg-muted-foreground",
  };

  return (
    <div className="relative min-h-screen">
      {/* Subtle particle background */}
      <div className="fixed inset-0 -z-10 opacity-30">
        <EntropyField chaotic={false} density={20} links={true} />
      </div>

      <article className="max-w-4xl mx-auto px-6 py-12">
        {/* Back link */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8"
        >
          <Link
            href="/projects"
            className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to projects
          </Link>
        </motion.div>

        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-4">
            <span
              className={`w-3 h-3 rounded-full ${statusColors[project.status]} animate-pulse`}
            />
            <span className="text-sm text-muted-foreground capitalize">
              {project.status}
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-4 gradient-text">
            {project.name}
          </h1>

          <p className="text-xl text-muted-foreground mb-6">{project.tagline}</p>

          {/* Tech stack */}
          <div className="flex flex-wrap gap-2 mb-6">
            {project.tech_stack.map((tech) => (
              <Badge
                key={tech}
                variant="secondary"
                className="bg-surface-2 text-text-secondary"
              >
                {tech}
              </Badge>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex gap-4">
            {project.demo_url && (
              <a href={project.demo_url} target="_blank" rel="noopener noreferrer">
                <Button className="bg-accent-blue hover:bg-accent-blue/90">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Demo
                </Button>
              </a>
            )}
            {project.repo_url && (
              <a href={project.repo_url} target="_blank" rel="noopener noreferrer">
                <Button variant="outline">
                  <Github className="w-4 h-4 mr-2" />
                  View Code
                </Button>
              </a>
            )}
          </div>
        </motion.header>

        {/* Project image placeholder */}
        {project.image_url && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="aspect-video w-full rounded-lg overflow-hidden bg-surface-2 mb-12 border border-border"
          >
            <img
              src={project.image_url}
              alt={project.name}
              className="w-full h-full object-cover"
            />
          </motion.div>
        )}

        {/* Description */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-12"
        >
          <p className="text-lg text-text-secondary leading-relaxed">
            {project.description}
          </p>
        </motion.section>

        {/* The Entropy Story */}
        <div className="space-y-8">
          {/* The Problem - Entropy State */}
          {project.problem && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-6 rounded-lg bg-surface-1/50 border border-entropy-chaos/20"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-entropy-chaos/20">
                  <Zap className="w-5 h-5 text-entropy-chaos" />
                </div>
                <h2 className="text-xl font-semibold">The Problem</h2>
                <span className="text-xs text-muted-foreground">
                  (The entropy state)
                </span>
              </div>
              <p className="text-text-secondary">{project.problem}</p>
            </motion.section>
          )}

          {/* The Solution - Bentropy Applied */}
          {project.solution && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="p-6 rounded-lg bg-surface-1/50 border border-accent-blue/20"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-accent-blue/20">
                  <Target className="w-5 h-5 text-accent-blue" />
                </div>
                <h2 className="text-xl font-semibold">The Solution</h2>
                <span className="text-xs text-muted-foreground">
                  (Bentropy applied)
                </span>
              </div>
              <p className="text-text-secondary">{project.solution}</p>
            </motion.section>
          )}

          {/* The Outcome - Order Achieved */}
          {project.outcome && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="p-6 rounded-lg bg-surface-1/50 border border-entropy-ordered/20"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-entropy-ordered/20">
                  <Trophy className="w-5 h-5 text-entropy-ordered" />
                </div>
                <h2 className="text-xl font-semibold">The Outcome</h2>
                <span className="text-xs text-muted-foreground">
                  (Order achieved)
                </span>
              </div>
              <p className="text-text-secondary">{project.outcome}</p>
            </motion.section>
          )}
        </div>

        {/* Navigation to other projects */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-16 pt-8 border-t border-border"
        >
          <Link href="/projects">
            <Button variant="ghost" className="text-accent-blue">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Explore more projects
            </Button>
          </Link>
        </motion.div>
      </article>
    </div>
  );
}
