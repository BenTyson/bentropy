"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ProjectCard } from "@/components/public/ProjectCard";
import { EntropyField } from "@/components/particles/EntropyField";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Filter } from "lucide-react";
import type { Project } from "@/lib/supabase/types";

// Placeholder projects until Supabase is connected
const allProjects: Project[] = [
  {
    id: "1",
    slug: "qr-forge",
    name: "QR Forge",
    tagline: "Craft beautiful, functional QR codes",
    description: "A powerful QR code generator with customization options",
    problem: "QR codes are everywhere but most generators produce ugly, generic results",
    solution: "A tool that lets you craft QR codes that match your brand",
    outcome: "Beautiful QR codes that actually get scanned",
    tech_stack: ["Next.js", "Canvas API", "Tailwind", "TypeScript"],
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
    problem: "Documentation is tedious and often neglected",
    solution: "AI that understands code and generates clear docs",
    outcome: "Comprehensive docs in minutes, not hours",
    tech_stack: ["React", "OpenAI", "MDX", "Prisma"],
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
    problem: "Expert knowledge often fails to reach beginners",
    solution: "AI-powered simplification that adapts to any audience",
    outcome: "Complex topics made accessible to everyone",
    tech_stack: ["TypeScript", "Claude API", "Next.js", "Framer Motion"],
    status: "concept",
    featured: true,
    display_order: 3,
    demo_url: null,
    repo_url: null,
    image_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "4",
    slug: "seed-and-star",
    name: "Seed & Star",
    tagline: "Grow ideas from seeds to stars",
    description: "Track and nurture your project ideas from inception to launch",
    problem: "Good ideas get lost in the chaos of daily work",
    solution: "A system to capture, grow, and prioritize ideas",
    outcome: "No more lost ideas - everything tracked from seed to star",
    tech_stack: ["Next.js", "Supabase", "Tailwind"],
    status: "concept",
    featured: false,
    display_order: 4,
    demo_url: null,
    repo_url: null,
    image_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "5",
    slug: "cinematekka",
    name: "Cinematekka",
    tagline: "Your personal film archive",
    description: "Track, rate, and discover films with a beautiful interface",
    problem: "Film tracking apps are cluttered and lack personality",
    solution: "A minimalist, beautiful way to curate your film journey",
    outcome: "A personal cinematheque you actually want to use",
    tech_stack: ["React", "TMDB API", "Supabase", "Tailwind"],
    status: "active",
    featured: false,
    display_order: 5,
    demo_url: null,
    repo_url: null,
    image_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "6",
    slug: "evercraft",
    name: "Evercraft",
    tagline: "Build anything, one craft at a time",
    description: "A modular creation platform for digital makers",
    problem: "Creative tools are fragmented and expensive",
    solution: "An all-in-one toolkit that grows with you",
    outcome: "One platform for all your creative projects",
    tech_stack: ["Next.js", "Canvas", "WebGL", "TypeScript"],
    status: "concept",
    featured: false,
    display_order: 6,
    demo_url: null,
    repo_url: null,
    image_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "7",
    slug: "tourpad",
    name: "Tourpad",
    tagline: "Plan tours that tell a story",
    description: "Interactive tour planning for travelers and guides",
    problem: "Tour planning is scattered across maps, docs, and spreadsheets",
    solution: "One beautiful interface for planning narrative-driven tours",
    outcome: "Tours that flow like stories, not checklists",
    tech_stack: ["Next.js", "Mapbox", "Supabase", "Framer Motion"],
    status: "active",
    featured: false,
    display_order: 7,
    demo_url: null,
    repo_url: null,
    image_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const allTechTags = Array.from(
  new Set(allProjects.flatMap((p) => p.tech_stack))
).sort();

const statusFilters = ["all", "active", "shipped", "concept"] as const;

export default function ProjectsPage() {
  const [search, setSearch] = useState("");
  const [selectedTech, setSelectedTech] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredProjects = allProjects.filter((project) => {
    // Search filter
    const matchesSearch =
      search === "" ||
      project.name.toLowerCase().includes(search.toLowerCase()) ||
      project.tagline.toLowerCase().includes(search.toLowerCase());

    // Tech filter
    const matchesTech =
      selectedTech.length === 0 ||
      selectedTech.some((tech) => project.tech_stack.includes(tech));

    // Status filter
    const matchesStatus =
      statusFilter === "all" || project.status === statusFilter;

    return matchesSearch && matchesTech && matchesStatus;
  });

  const toggleTech = (tech: string) => {
    setSelectedTech((prev) =>
      prev.includes(tech) ? prev.filter((t) => t !== tech) : [...prev, tech]
    );
  };

  return (
    <div className="relative min-h-screen">
      {/* Subtle particle background */}
      <div className="fixed inset-0 -z-10 opacity-50">
        <EntropyField chaotic={false} density={30} links={false} />
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            The Gallery of <span className="gradient-text">Order</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Each project represents a victory against entropy. Browse, filter,
            and discover how chaos became code.
          </p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 space-y-4"
        >
          {/* Search */}
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-surface-1 border-border"
            />
          </div>

          {/* Status filters */}
          <div className="flex justify-center gap-2">
            {statusFilters.map((status) => (
              <Badge
                key={status}
                variant={statusFilter === status ? "default" : "outline"}
                className={`cursor-pointer capitalize ${
                  statusFilter === status
                    ? "bg-accent-blue text-white"
                    : "hover:bg-surface-2"
                }`}
                onClick={() => setStatusFilter(status)}
              >
                {status}
              </Badge>
            ))}
          </div>

          {/* Tech tags */}
          <div className="flex flex-wrap justify-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground mr-2" />
            {allTechTags.slice(0, 8).map((tech) => (
              <Badge
                key={tech}
                variant={selectedTech.includes(tech) ? "default" : "outline"}
                className={`cursor-pointer text-xs ${
                  selectedTech.includes(tech)
                    ? "bg-accent-violet text-white"
                    : "hover:bg-surface-2"
                }`}
                onClick={() => toggleTech(tech)}
              >
                {tech}
              </Badge>
            ))}
          </div>
        </motion.div>

        {/* Projects Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project, index) => (
            <ProjectCard key={project.id} project={project} index={index} />
          ))}
        </div>

        {/* Empty state */}
        {filteredProjects.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-muted-foreground">
              No projects match your filters. Try adjusting your search.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
