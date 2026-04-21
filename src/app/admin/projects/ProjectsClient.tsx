"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { Plus, Pencil, Trash2, Star } from "lucide-react";
import type { Project, ProjectStatus } from "@/lib/db/types";
import {
  createProject,
  deleteProject,
  toggleProjectFeatured,
  updateProject,
  type ProjectInput,
} from "@/lib/db/actions";
import { Panel } from "@/components/admin/Panel";
import { Btn } from "@/components/admin/Btn";
import { IconBtn } from "@/components/admin/IconBtn";
import { Pill } from "@/components/admin/Pill";
import { StatusDot } from "@/components/admin/StatusDot";
import { SegControl } from "@/components/admin/SegControl";

const FILTER_OPTIONS = ["All", "Active", "Shipped", "Concept"] as const;
type FilterOption = (typeof FILTER_OPTIONS)[number];

const COL = "20px 1fr 152px 86px 52px 64px 60px";

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

function relativeTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return `${Math.floor(days / 7)}w`;
}

export function ProjectsClient({ initial }: { initial: Project[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterOption>("All");

  const filtered = initial.filter((p) => {
    const matchesFilter =
      filter === "All" || p.status === (filter.toLowerCase() as ProjectStatus);
    const matchesSearch =
      search === "" || p.name.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

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
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <h1
          className="text-[22px] font-medium text-ink leading-tight"
          style={{ letterSpacing: "-0.3px" }}
        >
          Projects
        </h1>
        <Btn icon={<Plus size={14} />} onClick={openCreate}>
          New project
        </Btn>
      </div>

      {error && !isDialogOpen && (
        <p className="text-[13px] mb-4" style={{ color: "var(--red)" }}>
          {error}
        </p>
      )}

      {/* Filter bar */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search projects..."
          className="h-8 w-56 px-3 rounded-[var(--radius-admin-lg)] border border-line bg-surface-panel text-[13px] text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40"
        />
        <SegControl
          options={FILTER_OPTIONS}
          active={filter}
          onChange={setFilter}
        />
      </div>

      {/* Table */}
      <Panel pad={false}>
        {/* Column header */}
        <div
          className="grid items-center px-4 py-2.5 border-b border-line text-[11px] font-medium uppercase tracking-[0.4px] text-ink-muted"
          style={{ background: "var(--bg)", gridTemplateColumns: COL }}
        >
          <span />
          <span>Name</span>
          <span>Domain</span>
          <span>Status</span>
          <span>Health</span>
          <span>Updated</span>
          <span />
        </div>

        {initial.length === 0 ? (
          <div className="flex items-center gap-3 px-4 py-3">
            <span className="text-[13px] text-ink-muted">No projects yet.</span>
            <Btn size="sm" icon={<Plus size={12} />} onClick={openCreate}>
              New project
            </Btn>
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-4 py-3 text-[13px] text-ink-muted">
            No matching projects.
          </div>
        ) : (
          <ul>
            {filtered.map((project, i) => (
              <li
                key={project.id}
                className={`group ${i > 0 ? "border-t border-line" : ""}`}
              >
                <div
                  className="grid items-center px-4 py-3 hover:bg-[rgba(255,255,255,0.015)] transition-colors duration-100"
                  style={{ gridTemplateColumns: COL }}
                >
                  {/* Featured star */}
                  <button
                    onClick={() => toggleFeatured(project.id, project.featured)}
                    disabled={pending}
                    className="inline-flex items-center justify-center focus:outline-none disabled:opacity-40"
                    style={{
                      color: project.featured ? "var(--accent)" : "var(--faint)",
                    }}
                  >
                    <Star
                      size={12}
                      strokeWidth={1.5}
                      fill={project.featured ? "currentColor" : "none"}
                    />
                  </button>

                  {/* Name + tagline */}
                  <div className="min-w-0 pr-3">
                    <Link
                      href={`/admin/projects/${project.slug}`}
                      className="text-[13px] text-ink hover:underline underline-offset-2 truncate block"
                    >
                      {project.name}
                    </Link>
                    {project.tagline && (
                      <div className="text-[11px] text-ink-faint truncate mt-0.5">
                        {project.tagline}
                      </div>
                    )}
                  </div>

                  {/* Domain */}
                  <span className="font-[var(--font-admin-mono)] text-[11px] text-ink-faint tabular-nums truncate pr-3">
                    {project.primary_domain ?? "—"}
                  </span>

                  {/* Status */}
                  <span>
                    <Pill tone={project.status}>{project.status}</Pill>
                  </span>

                  {/* Health */}
                  <span>
                    <StatusDot tone="green" />
                  </span>

                  {/* Updated */}
                  <span className="font-[var(--font-admin-mono)] text-[11px] text-ink-faint tabular-nums">
                    {relativeTime(project.updated_at)}
                  </span>

                  {/* Row actions */}
                  <div className="flex items-center gap-0.5 justify-end opacity-30 group-hover:opacity-100 transition-opacity duration-100">
                    <IconBtn
                      icon={<Pencil size={13} strokeWidth={1.5} />}
                      onClick={() => openEdit(project)}
                    />
                    <IconBtn
                      icon={<Trash2 size={13} strokeWidth={1.5} />}
                      danger
                      onClick={() => remove(project.id)}
                      disabled={pending}
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {/* Create / edit dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit project" : "New project"}
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
                placeholder="Short description"
              />
            </Field>

            <Field label="Description">
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                rows={3}
              />
            </Field>

            <Field label="Problem">
              <Textarea
                value={form.problem}
                onChange={(e) => setForm({ ...form, problem: e.target.value })}
                rows={2}
              />
            </Field>

            <Field label="Solution">
              <Textarea
                value={form.solution}
                onChange={(e) =>
                  setForm({ ...form, solution: e.target.value })
                }
                rows={2}
              />
            </Field>

            <Field label="Outcome">
              <Textarea
                value={form.outcome}
                onChange={(e) => setForm({ ...form, outcome: e.target.value })}
                rows={2}
              />
            </Field>

            <Field label="Tech stack (comma-separated)">
              <Input
                value={form.tech_stack}
                onChange={(e) =>
                  setForm({ ...form, tech_stack: e.target.value })
                }
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
                  onChange={(e) =>
                    setForm({ ...form, demo_url: e.target.value })
                  }
                />
              </Field>
              <Field label="Repo URL">
                <Input
                  value={form.repo_url}
                  onChange={(e) =>
                    setForm({ ...form, repo_url: e.target.value })
                  }
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Primary domain">
                <Input
                  value={form.primary_domain}
                  onChange={(e) =>
                    setForm({ ...form, primary_domain: e.target.value })
                  }
                  placeholder="finch.app"
                />
              </Field>
              <Field label="Vercel project ID">
                <Input
                  value={form.vercel_project_id}
                  onChange={(e) =>
                    setForm({ ...form, vercel_project_id: e.target.value })
                  }
                  placeholder="prj_..."
                />
              </Field>
            </div>

            {error && (
              <p className="text-sm" style={{ color: "var(--red)" }}>
                {error}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Btn variant="secondary" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Btn>
              <Btn onClick={save} disabled={pending}>
                {pending ? "Saving..." : editing ? "Save changes" : "Create project"}
              </Btn>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-ink-muted">{label}</label>
      {children}
    </div>
  );
}
