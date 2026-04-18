"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
import Link from "next/link";
import {
  Plus,
  Pencil,
  Trash2,
  ExternalLink,
  Github,
  Star,
  Eye,
} from "lucide-react";
import type { Project, ProjectStatus } from "@/lib/db/types";
import {
  createProject,
  deleteProject,
  toggleProjectFeatured,
  updateProject,
  type ProjectInput,
} from "@/lib/db/actions";

const statusColors: Record<ProjectStatus, string> = {
  active: "bg-accent-blue text-white",
  shipped: "bg-entropy-ordered text-white",
  concept: "bg-muted text-muted-foreground",
};

interface FormState {
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
  primary_domain: string;
  vercel_project_id: string;
}

const emptyForm: FormState = {
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
  primary_domain: "",
  vercel_project_id: "",
};

function toInput(form: FormState): ProjectInput {
  return {
    name: form.name,
    slug: form.slug,
    tagline: form.tagline,
    description: form.description,
    problem: form.problem,
    solution: form.solution,
    outcome: form.outcome,
    tech_stack: form.tech_stack
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
    status: form.status,
    featured: form.featured,
    demo_url: form.demo_url,
    repo_url: form.repo_url,
    primary_domain: form.primary_domain,
    vercel_project_id: form.vercel_project_id,
  };
}

export function ProjectsClient({ initial }: { initial: Project[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);

  const projects = initial;

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setError(null);
    setIsDialogOpen(true);
  }

  function openEdit(project: Project) {
    setEditing(project);
    setForm({
      name: project.name,
      slug: project.slug,
      tagline: project.tagline,
      description: project.description ?? "",
      problem: project.problem ?? "",
      solution: project.solution ?? "",
      outcome: project.outcome ?? "",
      tech_stack: project.tech_stack.join(", "),
      status: project.status,
      featured: project.featured,
      demo_url: project.demo_url ?? "",
      repo_url: project.repo_url ?? "",
      primary_domain: project.primary_domain ?? "",
      vercel_project_id: project.vercel_project_id ?? "",
    });
    setError(null);
    setIsDialogOpen(true);
  }

  function save() {
    setError(null);
    const input = toInput(form);
    startTransition(async () => {
      try {
        if (editing) {
          await updateProject(editing.id, input);
        } else {
          await createProject(input);
        }
        setIsDialogOpen(false);
        setForm(emptyForm);
        setEditing(null);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Save failed");
      }
    });
  }

  function remove(id: string) {
    if (!confirm("Delete this project?")) return;
    startTransition(async () => {
      try {
        await deleteProject(id);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Delete failed");
      }
    });
  }

  function toggleFeatured(id: string, current: boolean) {
    startTransition(async () => {
      try {
        await toggleProjectFeatured(id, !current);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Toggle failed");
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl font-bold">Projects Manager</h1>
          <p className="text-muted-foreground">
            Manage projects displayed on the public site and tracked in the hub.
          </p>
        </motion.div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Add Project
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editing ? "Edit Project" : "Create Project"}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Name">
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Project name"
                  />
                </Field>
                <Field label="Slug">
                  <Input
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    placeholder="project-slug"
                  />
                </Field>
              </div>

              <Field label="Tagline">
                <Input
                  value={form.tagline}
                  onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                  placeholder="Short catchy description"
                />
              </Field>

              <Field label="Description">
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                />
              </Field>

              <Field label="The Problem (Entropy State)" tone="text-entropy-chaos">
                <Textarea
                  value={form.problem}
                  onChange={(e) => setForm({ ...form, problem: e.target.value })}
                  rows={2}
                />
              </Field>

              <Field label="The Solution (Bentropy Applied)" tone="text-accent-blue">
                <Textarea
                  value={form.solution}
                  onChange={(e) => setForm({ ...form, solution: e.target.value })}
                  rows={2}
                />
              </Field>

              <Field label="The Outcome (Order Achieved)" tone="text-entropy-ordered">
                <Textarea
                  value={form.outcome}
                  onChange={(e) => setForm({ ...form, outcome: e.target.value })}
                  rows={2}
                />
              </Field>

              <Field label="Tech Stack (comma-separated)">
                <Input
                  value={form.tech_stack}
                  onChange={(e) => setForm({ ...form, tech_stack: e.target.value })}
                  placeholder="Next.js, TypeScript, Tailwind"
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Status">
                  <Select
                    value={form.status}
                    onValueChange={(value: ProjectStatus) =>
                      setForm({ ...form, status: value })
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
                </Field>
                <Field label="Featured">
                  <Select
                    value={form.featured ? "yes" : "no"}
                    onValueChange={(value) =>
                      setForm({ ...form, featured: value === "yes" })
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
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Demo URL">
                  <Input
                    value={form.demo_url}
                    onChange={(e) => setForm({ ...form, demo_url: e.target.value })}
                  />
                </Field>
                <Field label="Repo URL">
                  <Input
                    value={form.repo_url}
                    onChange={(e) => setForm({ ...form, repo_url: e.target.value })}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Primary Domain">
                  <Input
                    value={form.primary_domain}
                    onChange={(e) =>
                      setForm({ ...form, primary_domain: e.target.value })
                    }
                    placeholder="finch.app"
                  />
                </Field>
                <Field label="Vercel Project ID">
                  <Input
                    value={form.vercel_project_id}
                    onChange={(e) =>
                      setForm({ ...form, vercel_project_id: e.target.value })
                    }
                    placeholder="prj_..."
                  />
                </Field>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={save} disabled={pending}>
                  {pending ? "Saving..." : editing ? "Save Changes" : "Create Project"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {error && !isDialogOpen && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Table>
          <TableHeader>
            <TableRow>
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
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleFeatured(project.id, project.featured)}
                      disabled={pending}
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
                      <Badge key={tech} variant="outline" className="text-xs">
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
                    <Link href={`/admin/projects/${project.slug}`}>
                      <Button variant="ghost" size="icon">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(project)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => remove(project.id)}
                      disabled={pending}
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

      {projects.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No projects yet</p>
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Add your first project
          </Button>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  tone,
  children,
}: {
  label: string;
  tone?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className={`text-sm font-medium ${tone ?? ""}`}>{label}</label>
      {children}
    </div>
  );
}
