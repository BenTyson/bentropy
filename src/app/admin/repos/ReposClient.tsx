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
import { Plus, Pencil, Trash2 } from "lucide-react";
import type { RepositoryWithProject } from "@/lib/db/queries";
import {
  createRepo,
  deleteRepo,
  updateRepo,
  type RepoInput,
} from "@/lib/db/actions";
import { Panel } from "@/components/admin/Panel";
import { Btn } from "@/components/admin/Btn";
import { IconBtn } from "@/components/admin/IconBtn";
import { ServiceDot } from "@/components/admin/ServiceDot";

type ProjectMini = { id: string; name: string };

const NONE = "__none__";
const NO_CATEGORY = "__none__";
const CATEGORIES = ["Portfolio", "Tools", "AI", "Config", "Experiments", "Archive"];
const COL = "minmax(150px,1fr) 110px 72px 80px 90px 64px";

function inferProvider(url: string): string {
  if (url.includes("github.com")) return "github";
  if (url.includes("gitlab.com")) return "gitlab";
  if (url.includes("bitbucket.org")) return "bitbucket";
  return "git";
}

function relativeTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60000);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d`;
  const mo = Math.floor(day / 30);
  if (mo < 12) return `${mo}mo`;
  return `${Math.floor(mo / 12)}y`;
}

interface FormState {
  name: string;
  url: string;
  project_id: string;
  category: string;
  notes: string;
}

const emptyForm: FormState = {
  name: "",
  url: "",
  project_id: NONE,
  category: NO_CATEGORY,
  notes: "",
};

function toInput(form: FormState): RepoInput {
  return {
    name: form.name,
    url: form.url,
    project_id: form.project_id === NONE ? null : form.project_id,
    category: form.category === NO_CATEGORY ? null : form.category,
    notes: form.notes,
  };
}

export function ReposClient({
  initial,
  projects,
}: {
  initial: RepositoryWithProject[];
  projects: ProjectMini[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<RepositoryWithProject | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filtered = initial.filter((r) => {
    const q = search.toLowerCase();
    return (
      !q ||
      r.name.toLowerCase().includes(q) ||
      (r.project_name ?? "").toLowerCase().includes(q)
    );
  });

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setError(null);
    setIsDialogOpen(true);
  }

  function openEdit(r: RepositoryWithProject) {
    setEditing(r);
    setForm({
      name: r.name,
      url: r.url,
      project_id: r.project_id ?? NONE,
      category: r.category ?? NO_CATEGORY,
      notes: r.notes ?? "",
    });
    setError(null);
    setIsDialogOpen(true);
  }

  function save() {
    setError(null);
    startTransition(async () => {
      try {
        if (editing) await updateRepo(editing.id, toInput(form));
        else await createRepo(toInput(form));
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
    if (!confirm("Delete this repository?")) return;
    startTransition(async () => {
      try {
        await deleteRepo(id);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Delete failed");
      }
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[22px] font-medium text-ink leading-tight" style={{ letterSpacing: "-0.3px" }}>
          Repos
        </h1>
        <Btn icon={<Plus size={14} />} onClick={openCreate}>
          New repo
        </Btn>
      </div>

      {error && !isDialogOpen && (
        <p className="text-[13px] mb-4" style={{ color: "var(--red)" }}>{error}</p>
      )}

      <div className="flex items-center gap-3 mb-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search repos..."
          className="h-8 w-56 px-3 rounded-[var(--radius-admin-lg)] border border-line bg-surface-panel text-[13px] text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40"
        />
      </div>

      <Panel pad={false}>
        <div
          className="grid items-center px-4 py-2.5 border-b border-line text-[11px] font-medium uppercase tracking-[0.4px] text-ink-muted"
          style={{ background: "var(--bg)", gridTemplateColumns: COL }}
        >
          <span>Name</span>
          <span>Project</span>
          <span>Provider</span>
          <span>Branch</span>
          <span>Updated</span>
          <span />
        </div>

        {initial.length === 0 ? (
          <div className="flex items-center gap-3 px-4 py-3">
            <span className="text-[13px] text-ink-muted">No repos yet.</span>
            <Btn size="sm" icon={<Plus size={12} />} onClick={openCreate}>New repo</Btn>
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-4 py-3 text-[13px] text-ink-muted">No matching repos.</div>
        ) : (
          <ul>
            {filtered.map((r, i) => (
              <li key={r.id} className={`group ${i > 0 ? "border-t border-line" : ""}`}>
                <div
                  className="grid items-center px-4 py-3 hover:bg-[rgba(255,255,255,0.015)] transition-colors duration-100"
                  style={{ gridTemplateColumns: COL }}
                >
                  <div className="min-w-0 pr-3">
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[13px] text-ink hover:underline truncate block"
                    >
                      {r.name}
                    </a>
                    {r.category && (
                      <span className="text-[11px] text-ink-faint">{r.category}</span>
                    )}
                  </div>

                  <span className="text-[13px] text-ink-muted truncate pr-3">
                    {r.project_name ?? <span className="text-ink-faint">—</span>}
                  </span>

                  <div className="flex items-center gap-1.5 pr-3">
                    <ServiceDot service={inferProvider(r.url)} />
                  </div>

                  <span
                    className="text-[11px] text-ink-faint pr-3"
                    style={{ fontFamily: "var(--font-admin-mono)" }}
                  >
                    —
                  </span>

                  <span
                    className="text-[11px] text-ink-faint"
                    style={{ fontFamily: "var(--font-admin-mono)", fontVariantNumeric: "tabular-nums" }}
                  >
                    {relativeTime(r.updated_at)}
                  </span>

                  <div className="flex items-center gap-0.5 justify-end opacity-30 group-hover:opacity-100 transition-opacity duration-100">
                    <IconBtn
                      icon={<Pencil size={13} strokeWidth={1.5} />}
                      onClick={() => openEdit(r)}
                      title="Edit"
                    />
                    <IconBtn
                      icon={<Trash2 size={13} strokeWidth={1.5} />}
                      danger
                      onClick={() => remove(r.id)}
                      disabled={pending}
                      title="Delete"
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit repo" : "New repo"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Field label="Repository name">
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="my-project"
              />
            </Field>

            <Field label="URL">
              <Input
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                placeholder="https://github.com/username/repo"
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Project">
                <Select
                  value={form.project_id}
                  onValueChange={(v) => setForm({ ...form, project_id: v })}
                >
                  <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>None</SelectItem>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Category">
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm({ ...form, category: v })}
                >
                  <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_CATEGORY}>None</SelectItem>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <Field label="Notes">
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
              />
            </Field>

            {error && <p className="text-sm" style={{ color: "var(--red)" }}>{error}</p>}

            <div className="flex justify-end gap-2 pt-4">
              <Btn variant="secondary" onClick={() => setIsDialogOpen(false)}>Cancel</Btn>
              <Btn onClick={save} disabled={pending}>
                {pending ? "Saving..." : editing ? "Save changes" : "Add repo"}
              </Btn>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-ink-muted">{label}</label>
      {children}
    </div>
  );
}
