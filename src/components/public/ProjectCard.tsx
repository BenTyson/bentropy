"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { Project } from "@/lib/supabase/types";
import { ExternalLink, Github } from "lucide-react";

interface ProjectCardProps {
  project: Project;
  index?: number;
}

export function ProjectCard({ project, index = 0 }: ProjectCardProps) {
  const statusColors = {
    active: "bg-accent-blue",
    shipped: "bg-entropy-ordered",
    concept: "bg-muted-foreground",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Link href={`/projects/${project.slug}`}>
        <Card className="group relative overflow-hidden bg-card/50 border-border hover:border-accent-blue/50 transition-all duration-300 hover:shadow-lg hover:shadow-accent-blue/10">
          {/* Status indicator */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${statusColors[project.status]} animate-pulse`}
            />
            <span className="text-xs text-muted-foreground capitalize">
              {project.status}
            </span>
          </div>

          {/* Project image placeholder */}
          {project.image_url && (
            <div className="aspect-video w-full overflow-hidden bg-surface-2">
              <img
                src={project.image_url}
                alt={project.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
          )}

          <CardHeader className="pb-2">
            <h3 className="text-xl font-semibold group-hover:gradient-text transition-all">
              {project.name}
            </h3>
            <p className="text-muted-foreground text-sm">{project.tagline}</p>
          </CardHeader>

          <CardContent>
            {/* Tech stack */}
            <div className="flex flex-wrap gap-2 mb-4">
              {project.tech_stack.slice(0, 4).map((tech) => (
                <Badge
                  key={tech}
                  variant="secondary"
                  className="text-xs bg-surface-2 text-text-secondary"
                >
                  {tech}
                </Badge>
              ))}
              {project.tech_stack.length > 4 && (
                <Badge variant="secondary" className="text-xs">
                  +{project.tech_stack.length - 4}
                </Badge>
              )}
            </div>

            {/* Links */}
            <div className="flex gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
              {project.demo_url && (
                <a
                  href={project.demo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-accent-blue hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="w-4 h-4" />
                  Demo
                </a>
              )}
              {project.repo_url && (
                <a
                  href={project.repo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-accent-violet hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Github className="w-4 h-4" />
                  Code
                </a>
              )}
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
