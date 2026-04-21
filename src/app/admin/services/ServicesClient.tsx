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
import { Plus, Play, Square, Pencil, Trash2 } from "lucide-react";
import type { LocalServiceWithProject } from "@/lib/db/queries";
import {
  createService,
  deleteService,
  toggleServiceActive,
  updateService,
  type ServiceInput,
} from "@/lib/db/actions";
import { Panel } from "@/components/admin/Panel";
import { Btn } from "@/components/admin/Btn";
import { IconBtn } from "@/components/admin/IconBtn";
import { StatusDot } from "@/components/admin/StatusDot";

type ProjectMini = { id: string; name: string };

const NONE = "__none__";
const COL = "minmax(140px,1fr) 110px 64px 100px minmax(140px,1fr) 80px";

interface FormState {
  name: string;
  port: string;
  project_id: string;
  start_command: string;
  notes: string;
}

const emptyForm: FormState = {
  name: "",
  port: "",
  project_id: NONE,
  start_command: "",
  notes: "",
};

function toInput(form: FormState): ServiceInput | null {
  const port = parseInt(form.port, 10);
  if (Number.isNaN(port)) return null;
  return {
    name: form.name,
    port,
    project_id: form.project_id === NONE ? null : form.project_id,
    start_command: form.start_command,
    notes: form.notes,
  };
}

export function ServicesClient({
  initial,
  projects,
}: {
  initial: LocalServiceWithProject[];
  projects: ProjectMini[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<LocalServiceWithProject | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filtered = initial.filter((s) => {
    const q = search.toLowerCase();
    return (
      !q ||
      s.name.toLowerCase().includes(q) ||
      (s.project_name ?? "").toLowerCase().includes(q)
    );
  });

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setError(null);
    setIsDialogOpen(true);
  }

  function openEdit(s: LocalServiceWithProject) {
    setEditing(s);
    setForm({
      name: s.name,
      port: s.port.toString(),
      project_id: s.project_id ?? NONE,
      start_command: s.start_command ?? "",
      notes: s.notes ?? "",
    });
    setError(null);
    setIsDialogOpen(true);
  }

  function save() {
    setError(null);
    const input = toInput(form);
    if (!input) {
      setError("Port must be a number");
      return;
    }
    startTransition(async () => {
      try {
        if (editing) await updateService(editing.id, input);
        else await createService(input);
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
    if (!confirm("Delete this service?")) return;
    startTransition(async () => {
      try {
        await deleteService(id);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Delete failed");
      }
    });
  }

  function toggleActive(id: string, current: boolean) {
    startTransition(async () => {
      try {
        await toggleServiceActive(id, !current);
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
          Services
        </h1>
        <Btn icon={<Plus size={14} />} onClick={openCreate}>
          New service
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
          placeholder="Search services..."
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
          <span>Port</span>
          <span>Status</span>
          <span>Start command</span>
          <span />
        </div>

        {initial.length === 0 ? (
          <div className="flex items-center gap-3 px-4 py-3">
            <span className="text-[13px] text-ink-muted">No services yet.</span>
            <Btn size="sm" icon={<Plus size={12} />} onClick={openCreate}>New service</Btn>
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-4 py-3 text-[13px] text-ink-muted">No matching services.</div>
        ) : (
          <ul>
            {filtered.map((s, i) => (
              <li key={s.id} className={`group ${i > 0 ? "border-t border-line" : ""}`}>
                <div
                  className="grid items-center px-4 py-3 hover:bg-[rgba(255,255,255,0.015)] transition-colors duration-100"
                  style={{ gridTemplateColumns: COL }}
                >
                  <span className="text-[13px] text-ink truncate pr-3">{s.name}</span>

                  <span className="text-[13px] text-ink-muted truncate pr-3">
                    {s.project_name ?? <span className="text-ink-faint">—</span>}
                  </span>

                  <span
                    className="text-[11px] text-ink-faint pr-3"
                    style={{ fontFamily: "var(--font-admin-mono)", fontVariantNumeric: "tabular-nums" }}
                  >
                    :{s.port}
                  </span>

                  <div className="flex items-center gap-1.5 pr-3">
                    <StatusDot tone={s.is_active ? "green" : "muted"} />
                    <span className="text-[12px] text-ink-muted">
                      {s.is_active ? "running" : "stopped"}
                    </span>
                  </div>

                  <span
                    className="text-[11px] text-ink-faint truncate pr-3"
                    style={{ fontFamily: "var(--font-admin-mono)" }}
                  >
                    {s.start_command || "—"}
                  </span>

                  <div className="flex items-center gap-0.5 justify-end opacity-30 group-hover:opacity-100 transition-opacity duration-100">
                    <IconBtn
                      icon={s.is_active ? <Square size={13} strokeWidth={1.5} /> : <Play size={13} strokeWidth={1.5} />}
                      onClick={() => toggleActive(s.id, s.is_active)}
                      disabled={pending}
                      title={s.is_active ? "Stop" : "Start"}
                    />
                    <IconBtn
                      icon={<Pencil size={13} strokeWidth={1.5} />}
                      onClick={() => openEdit(s)}
                      title="Edit"
                    />
                    <IconBtn
                      icon={<Trash2 size={13} strokeWidth={1.5} />}
                      danger
                      onClick={() => remove(s.id)}
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
            <DialogTitle>{editing ? "Edit service" : "New service"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Name">
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="My Dev Server"
                />
              </Field>
              <Field label="Port">
                <Input
                  type="number"
                  value={form.port}
                  onChange={(e) => setForm({ ...form, port: e.target.value })}
                  placeholder="3000"
                />
              </Field>
            </div>

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

            <Field label="Start command">
              <Input
                value={form.start_command}
                onChange={(e) => setForm({ ...form, start_command: e.target.value })}
                placeholder="npm run dev"
                className="font-mono text-sm"
              />
            </Field>

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
                {pending ? "Saving..." : editing ? "Save changes" : "Add service"}
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
