"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Pencil,
  Trash2,
  ExternalLink,
  Github,
  GripVertical,
  Star,
} from "lucide-react";
import type { Project, ProjectStatus } from "@/lib/supabase/types";

// Placeholder data - will come from Supabase
const initialProjects: Project[] = [
  {
    id: "1",
    slug: "qr-forge",
    name: "QR Forge",
    tagline: "Craft beautiful, functional QR codes",
    description: "A powerful QR code generator with customization options",
    problem: "QR codes are everywhere but most generators produce ugly results",
    solution: "A tool that lets you craft QR codes that match your brand",
    outcome: "Beautiful QR codes that actually get scanned",
    tech_stack: ["Next.js", "Canvas API", "Tailwind", "TypeScript"],
    status: "active",
    featured: true,
    display_order: 1,
    demo_url: "https://qrforge.example.com",
    repo_url: "https://github.com/bentyson/qr-forge",
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
    repo_url: "https://github.com/bentyson/scribe",
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
];

const statusColors: Record<ProjectStatus, string> = {
  active: "bg-accent-blue text-white",
  shipped: "bg-entropy-ordered text-white",
  concept: "bg-muted text-muted-foreground",
};

interface ProjectFormData {
  name: string;
  slug: string;
  tagline: string;
  description: string;
  problem: string;
  solution: string;
  outcome: string;
  tech_stack: string;
  status: ProjectStatus;
  featured: boolean;
  demo_url: string;
  repo_url: string;
}

const emptyForm: ProjectFormData = {
  name: "",
  slug: "",
  tagline: "",
  description: "",
  problem: "",
  solution: "",
  outcome: "",
  tech_stack: "",
  status: "concept",
  featured: false,
  demo_url: "",
  repo_url: "",
};

export default function ProjectsAdminPage() {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState<ProjectFormData>(emptyForm);

  const handleOpenCreate = () => {
    setEditingProject(null);
    setFormData(emptyForm);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (project: Project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      slug: project.slug,
      tagline: project.tagline,
      description: project.description || "",
      problem: project.problem || "",
      solution: project.solution || "",
      outcome: project.outcome || "",
      tech_stack: project.tech_stack.join(", "),
      status: project.status,
      featured: project.featured,
      demo_url: project.demo_url || "",
      repo_url: project.repo_url || "",
    });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    const techArray = formData.tech_stack
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    if (editingProject) {
      // Update existing
      setProjects((prev) =>
        prev.map((p) =>
          p.id === editingProject.id
            ? {
                ...p,
                ...formData,
                tech_stack: techArray,
                updated_at: new Date().toISOString(),
              }
            : p
        )
      );
    } else {
      // Create new
      const newProject: Project = {
        id: crypto.randomUUID(),
        ...formData,
        tech_stack: techArray,
        display_order: projects.length + 1,
        image_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setProjects((prev) => [...prev, newProject]);
    }

    setIsDialogOpen(false);
    setFormData(emptyForm);
    setEditingProject(null);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this project?")) {
      setProjects((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const toggleFeatured = (id: string) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, featured: !p.featured } : p))
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl font-bold">Projects Manager</h1>
          <p className="text-muted-foreground">
            Manage projects displayed on the public site
          </p>
        </motion.div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Add Project
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProject ? "Edit Project" : "Create Project"}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Name</label>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Project name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Slug</label>
                  <Input
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData({ ...formData, slug: e.target.value })
                    }
                    placeholder="project-slug"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Tagline</label>
                <Input
                  value={formData.tagline}
                  onChange={(e) =>
                    setFormData({ ...formData, tagline: e.target.value })
                  }
                  placeholder="Short catchy description"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Full project description"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-entropy-chaos">
                  The Problem (Entropy State)
                </label>
                <Textarea
                  value={formData.problem}
                  onChange={(e) =>
                    setFormData({ ...formData, problem: e.target.value })
                  }
                  placeholder="What chaos existed before this project?"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-accent-blue">
                  The Solution (Bentropy Applied)
                </label>
                <Textarea
                  value={formData.solution}
                  onChange={(e) =>
                    setFormData({ ...formData, solution: e.target.value })
                  }
                  placeholder="How does this project impose order?"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-entropy-ordered">
                  The Outcome (Order Achieved)
                </label>
                <Textarea
                  value={formData.outcome}
                  onChange={(e) =>
                    setFormData({ ...formData, outcome: e.target.value })
                  }
                  placeholder="What order was achieved?"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Tech Stack (comma-separated)
                </label>
                <Input
                  value={formData.tech_stack}
                  onChange={(e) =>
                    setFormData({ ...formData, tech_stack: e.target.value })
                  }
                  placeholder="Next.js, TypeScript, Tailwind"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: ProjectStatus) =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="concept">Concept</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="shipped">Shipped</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Featured</label>
                  <Select
                    value={formData.featured ? "yes" : "no"}
                    onValueChange={(value) =>
                      setFormData({ ...formData, featured: value === "yes" })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no">No</SelectItem>
                      <SelectItem value="yes">Yes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Demo URL</label>
                  <Input
                    value={formData.demo_url}
                    onChange={(e) =>
                      setFormData({ ...formData, demo_url: e.target.value })
                    }
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Repo URL</label>
                  <Input
                    value={formData.repo_url}
                    onChange={(e) =>
                      setFormData({ ...formData, repo_url: e.target.value })
                    }
                    placeholder="https://github.com/..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  {editingProject ? "Save Changes" : "Create Project"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Projects Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8"></TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tech Stack</TableHead>
              <TableHead>Links</TableHead>
              <TableHead className="w-32">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((project) => (
              <TableRow key={project.id}>
                <TableCell>
                  <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleFeatured(project.id)}
                      className={`p-1 rounded ${
                        project.featured
                          ? "text-yellow-500"
                          : "text-muted-foreground hover:text-yellow-500"
                      }`}
                    >
                      <Star
                        className="w-4 h-4"
                        fill={project.featured ? "currentColor" : "none"}
                      />
                    </button>
                    <div>
                      <div className="font-medium">{project.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {project.tagline}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={statusColors[project.status]}>
                    {project.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {project.tech_stack.slice(0, 3).map((tech) => (
                      <Badge
                        key={tech}
                        variant="outline"
                        className="text-xs"
                      >
                        {tech}
                      </Badge>
                    ))}
                    {project.tech_stack.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{project.tech_stack.length - 3}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {project.demo_url && (
                      <a
                        href={project.demo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent-blue hover:underline"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                    {project.repo_url && (
                      <a
                        href={project.repo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Github className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenEdit(project)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(project.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </motion.div>

      {/* Empty State */}
      {projects.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No projects yet</p>
          <Button onClick={handleOpenCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Add your first project
          </Button>
        </div>
      )}
    </div>
  );
}
