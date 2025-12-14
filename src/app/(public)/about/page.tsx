"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EntropyField } from "@/components/particles/EntropyField";
import { Github, Linkedin, Twitter, Mail, ArrowRight } from "lucide-react";

// Skills organized as a "periodic table" of tools
const skillCategories = [
  {
    name: "Frontend",
    color: "bg-accent-blue",
    skills: ["React", "Next.js", "TypeScript", "Tailwind CSS", "Framer Motion"],
  },
  {
    name: "Backend",
    color: "bg-accent-violet",
    skills: ["Node.js", "Python", "PostgreSQL", "Supabase", "Prisma"],
  },
  {
    name: "Tools",
    color: "bg-accent-cyan",
    skills: ["Git", "Docker", "Vercel", "Figma", "VS Code"],
  },
  {
    name: "AI/ML",
    color: "bg-entropy-ordered",
    skills: ["OpenAI API", "Claude API", "LangChain", "RAG"],
  },
];

const socialLinks = [
  { icon: Github, href: "https://github.com/bentyson", label: "GitHub" },
  { icon: Twitter, href: "https://twitter.com/bentyson", label: "Twitter" },
  { icon: Linkedin, href: "https://linkedin.com/in/bentyson", label: "LinkedIn" },
  { icon: Mail, href: "mailto:hello@bentropy.dev", label: "Email" },
];

export default function AboutPage() {
  return (
    <div className="relative min-h-screen">
      {/* Subtle particle background */}
      <div className="fixed inset-0 -z-10 opacity-30">
        <EntropyField chaotic={false} density={25} links={true} />
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            The <span className="gradient-text">Entropy Fighter</span>
          </h1>
          <p className="text-xl text-muted-foreground">
            Hi, I&apos;m Ben. I build things.
          </p>
        </motion.div>

        {/* The Story */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-16"
        >
          <div className="prose prose-invert max-w-none space-y-6 text-text-secondary">
            <p className="text-lg leading-relaxed">
              My mind generates entropy at an alarming rate. Ideas fragment into
              dozens of browser tabs. Projects multiply like rabbits. The chaos is
              constant.
            </p>
            <p className="text-lg leading-relaxed">
              But here&apos;s the thing about entropy: it&apos;s not inherently bad.
              Chaos is where creativity lives. The trick is learning to{" "}
              <span className="text-foreground font-medium">
                channel that chaos into order
              </span>{" "}
              - to take the swirling noise of possibility and crystallize it into
              something real.
            </p>
            <p className="text-lg leading-relaxed">
              That&apos;s <span className="gradient-text font-bold">Bentropy</span>.
              My deliberate, daily fight against the universe&apos;s tendency toward
              disorder. Each project shipped is a small victory. Each idea made
              real is entropy temporarily reversed.
            </p>
            <p className="text-lg leading-relaxed">
              I&apos;m an entrepreneur who prototypes web applications. Some become
              products. Some become lessons. All of them are part of the ongoing
              battle to bring order to ideas.
            </p>
          </div>
        </motion.section>

        {/* Skills - Periodic Table style */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-16"
        >
          <h2 className="text-2xl font-bold mb-8 text-center">
            Tools of the Trade
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {skillCategories.map((category, categoryIndex) => (
              <motion.div
                key={category.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + categoryIndex * 0.1 }}
                className="p-6 rounded-lg bg-surface-1/50 border border-border"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-3 h-3 rounded-full ${category.color}`} />
                  <h3 className="font-semibold">{category.name}</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {category.skills.map((skill) => (
                    <Badge
                      key={skill}
                      variant="secondary"
                      className="bg-surface-2 text-text-secondary hover:bg-surface-3 transition-colors"
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Currently Building */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-16"
        >
          <h2 className="text-2xl font-bold mb-6 text-center">
            Currently Building
          </h2>
          <div className="p-6 rounded-lg bg-gradient-to-r from-accent-blue/10 to-accent-violet/10 border border-accent-blue/20">
            <div className="flex items-start gap-4">
              <div className="w-3 h-3 rounded-full bg-accent-blue animate-pulse mt-2" />
              <div>
                <h3 className="font-semibold text-lg mb-2">
                  This very site - Bentropy
                </h3>
                <p className="text-text-secondary mb-4">
                  Building my personal command center with a public showcase. The
                  admin dashboard will track all my projects, credentials, and
                  local development servers. The entropy never stops, so neither
                  does the tooling.
                </p>
                <Link href="/projects">
                  <Button variant="outline" size="sm">
                    See all projects
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Connect */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-center"
        >
          <h2 className="text-2xl font-bold mb-6">Let&apos;s Connect</h2>
          <p className="text-muted-foreground mb-8">
            Want to collaborate, chat about ideas, or just say hi?
          </p>
          <div className="flex justify-center gap-4">
            {socialLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group"
              >
                <Button
                  variant="outline"
                  size="icon"
                  className="w-12 h-12 rounded-full border-border hover:border-accent-blue hover:bg-accent-blue/10 transition-all"
                >
                  <link.icon className="w-5 h-5 group-hover:text-accent-blue transition-colors" />
                  <span className="sr-only">{link.label}</span>
                </Button>
              </a>
            ))}
          </div>
        </motion.section>
      </div>
    </div>
  );
}
