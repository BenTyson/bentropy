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
import { Plus, Pin, PinOff, Pencil, Trash2 } from "lucide-react";
import type { NoteWithProject } from "@/lib/db/queries";
import {
  createNote,
  deleteNote,
  toggleNotePinned,
  updateNote,
  type NoteInput,
} from "@/lib/db/actions";
import { Panel } from "@/components/admin/Panel";
import { Btn } from "@/components/admin/Btn";
import { IconBtn } from "@/components/admin/IconBtn";
import { Tag } from "@/components/admin/Tag";

type ProjectMini = { id: string; name: string };

const NONE = "__none__";
const COL = "minmax(180px,1fr) 100px minmax(100px,1fr) 80px 72px";

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
  title: string;
  content: string;
  tags: string;
  project_id: string;
}

const emptyForm: FormState = {
  title: "",
  content: "",
  tags: "",
  project_id: NONE,
};

function toInput(form: FormState): NoteInput {
  return {
    title: form.title,
    content: form.content,
    tags: form.tags
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean),
    project_id: form.project_id === NONE ? null : form.project_id,
  };
}

export function NotesClient({
  initial,
  projects,
}: {
  initial: NoteWithProject[];
  projects: ProjectMini[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<NoteWithProject | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filtered = initial.filter((n) => {
    const q = search.toLowerCase();
    return (
      !q ||
      n.title.toLowerCase().includes(q) ||
      (n.project_name ?? "").toLowerCase().includes(q) ||
      n.tags.some((t) => t.includes(q))
    );
  });

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setError(null);
    setIsDialogOpen(true);
  }

  function openEdit(n: NoteWithProject) {
    setEditing(n);
    setForm({
      title: n.title,
      content: n.content ?? "",
      tags: n.tags.join(", "),
      project_id: n.project_id ?? NONE,
    });
    setError(null);
    setIsDialogOpen(true);
  }

  function save() {
    setError(null);
    startTransition(async () => {
      try {
        if (editing) await updateNote(editing.id, toInput(form));
        else await createNote(toInput(form));
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
    if (!confirm("Delete this note?")) return;
    startTransition(async () => {
      try {
        await deleteNote(id);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Delete failed");
      }
    });
  }

  function togglePinned(id: string, current: boolean) {
    startTransition(async () => {
      try {
        await toggleNotePinned(id, !current);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Toggle failed");
      }
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[22px] font-medium text-ink leading-tight" style={{ letterSpacing: "-0.3px" }}>
          Notes
        </h1>
        <Btn icon={<Plus size={14} />} onClick={openCreate}>
          New note
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
          placeholder="Search notes..."
          className="h-8 w-56 px-3 rounded-[var(--radius-admin-lg)] border border-line bg-surface-panel text-[13px] text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40"
        />
      </div>

      <Panel pad={false}>
        <div
          className="grid items-center px-4 py-2.5 border-b border-line text-[11px] font-medium uppercase tracking-[0.4px] text-ink-muted"
          style={{ background: "var(--bg)", gridTemplateColumns: COL }}
        >
          <span>Title</span>
          <span>Project</span>
          <span>Tags</span>
          <span>Updated</span>
          <span />
        </div>

        {initial.length === 0 ? (
          <div className="flex items-center gap-3 px-4 py-3">
            <span className="text-[13px] text-ink-muted">No notes yet.</span>
            <Btn size="sm" icon={<Plus size={12} />} onClick={openCreate}>New note</Btn>
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-4 py-3 text-[13px] text-ink-muted">No matching notes.</div>
        ) : (
          <ul>
            {filtered.map((n, i) => (
              <li key={n.id} className={`group ${i > 0 ? "border-t border-line" : ""}`}>
                <div
                  className="grid items-center px-4 py-3 hover:bg-[rgba(255,255,255,0.015)] transition-colors duration-100"
                  style={{ gridTemplateColumns: COL }}
                >
                  <div className="min-w-0 pr-3">
                    <div className="flex items-center gap-1.5">
                      {n.pinned && (
                        <Pin size={11} strokeWidth={1.5} className="text-ink-faint shrink-0" />
                      )}
                      <span className="text-[13px] text-ink truncate">{n.title}</span>
                    </div>
                    {n.content && (
                      <p className="text-[11px] text-ink-faint truncate mt-0.5">{n.content}</p>
                    )}
                  </div>

                  <span className="text-[13px] text-ink-muted truncate pr-3">
                    {n.project_name ?? <span className="text-ink-faint">—</span>}
                  </span>

                  <div className="flex flex-wrap gap-1 pr-3">
                    {n.tags.length > 0
                      ? n.tags.map((t) => <Tag key={t}>{t}</Tag>)
                      : <span className="text-[11px] text-ink-faint">—</span>}
                  </div>

                  <span
                    className="text-[11px] text-ink-faint"
                    style={{ fontFamily: "var(--font-admin-mono)", fontVariantNumeric: "tabular-nums" }}
                  >
                    {relativeTime(n.updated_at)}
                  </span>

                  <div className="flex items-center gap-0.5 justify-end opacity-30 group-hover:opacity-100 transition-opacity duration-100">
                    <IconBtn
                      icon={n.pinned ? <PinOff size={13} strokeWidth={1.5} /> : <Pin size={13} strokeWidth={1.5} />}
                      onClick={() => togglePinned(n.id, n.pinned)}
                      disabled={pending}
                      title={n.pinned ? "Unpin" : "Pin"}
                    />
                    <IconBtn
                      icon={<Pencil size={13} strokeWidth={1.5} />}
                      onClick={() => openEdit(n)}
                      title="Edit"
                    />
                    <IconBtn
                      icon={<Trash2 size={13} strokeWidth={1.5} />}
                      danger
                      onClick={() => remove(n.id)}
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit note" : "New note"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Field label="Title">
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Note title"
              />
            </Field>

            <Field label="Content (Markdown)">
              <Textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="Markdown supported."
                rows={10}
                className="font-mono text-sm"
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Tags (comma-separated)">
                <Input
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  placeholder="todo, ideas, reference"
                />
              </Field>
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
            </div>

            {error && <p className="text-sm" style={{ color: "var(--red)" }}>{error}</p>}

            <div className="flex justify-end gap-2 pt-4">
              <Btn variant="secondary" onClick={() => setIsDialogOpen(false)}>Cancel</Btn>
              <Btn onClick={save} disabled={pending}>
                {pending ? "Saving..." : editing ? "Save changes" : "Create note"}
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
