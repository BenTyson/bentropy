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
import { Plus, Eye, EyeOff, Copy, Check, Pencil, Trash2 } from "lucide-react";
import type { CredentialWithProject } from "@/lib/db/queries";
import {
  createCredential,
  deleteCredential,
  revealCredential,
  updateCredential,
  type CredentialInput,
} from "@/lib/db/actions";
import { Panel } from "@/components/admin/Panel";
import { Btn } from "@/components/admin/Btn";
import { IconBtn } from "@/components/admin/IconBtn";
import { Pill } from "@/components/admin/Pill";
import { Tag } from "@/components/admin/Tag";
import { ServiceDot } from "@/components/admin/ServiceDot";
import { SegControl } from "@/components/admin/SegControl";

const FILTER_OPTIONS = ["All", "Manual", "Autopull"] as const;
type FilterOption = (typeof FILTER_OPTIONS)[number];

const COL = "minmax(180px,1fr) 120px 120px 72px 88px 88px";

type ProjectMini = { id: string; name: string };
const NONE = "__none__";

interface FormState {
  name: string;
  service: string;
  key: string;
  project_id: string;
  expires_at: string;
  notes: string;
}

const emptyForm: FormState = {
  name: "",
  service: "",
  key: "",
  project_id: NONE,
  expires_at: "",
  notes: "",
};

function toInput(form: FormState): CredentialInput {
  return {
    name: form.name,
    service: form.service,
    key: form.key,
    project_id: form.project_id === NONE ? null : form.project_id,
    expires_at: form.expires_at || null,
    notes: form.notes,
  };
}

function expiryCountdown(expiresAt: string | null): {
  text: string;
  pill?: "warn" | "bad";
} {
  if (!expiresAt) return { text: "Never" };
  const ms = new Date(expiresAt).getTime() - Date.now();
  const days = Math.floor(ms / 86400000);
  if (days < 0) return { text: `Expired ${Math.abs(days)}d ago`, pill: "bad" };
  if (days <= 14) return { text: `${days}d`, pill: "warn" };
  return { text: `${days}d` };
}

export function CredentialsClient({
  initial,
  projects,
}: {
  initial: CredentialWithProject[];
  projects: ProjectMini[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CredentialWithProject | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterOption>("All");
  const [revealedKeys, setRevealedKeys] = useState<Record<string, string>>({});
  const [loadingReveal, setLoadingReveal] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const expiredCount = initial.filter((c) => {
    if (!c.expires_at) return false;
    return new Date(c.expires_at).getTime() < Date.now();
  }).length;

  const expiringSoonCount = initial.filter((c) => {
    if (!c.expires_at) return false;
    const ms = new Date(c.expires_at).getTime() - Date.now();
    return ms > 0 && ms / 86400000 <= 14;
  }).length;

  const filtered = initial.filter((c) => {
    const matchesFilter =
      filter === "All" ||
      (filter === "Manual" && c.source === "manual") ||
      (filter === "Autopull" && c.source === "autopull");
    const q = search.toLowerCase();
    const matchesSearch =
      search === "" ||
      c.name.toLowerCase().includes(q) ||
      (c.project_name ?? "").toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setError(null);
    setIsDialogOpen(true);
  }

  function openEdit(c: CredentialWithProject) {
    setEditing(c);
    setForm({
      name: c.name,
      service: c.service,
      key: "",
      project_id: c.project_id ?? NONE,
      expires_at: c.expires_at
        ? new Date(c.expires_at).toISOString().split("T")[0]
        : "",
      notes: c.notes ?? "",
    });
    setError(null);
    setIsDialogOpen(true);
  }

  function save() {
    setError(null);
    startTransition(async () => {
      try {
        if (editing) await updateCredential(editing.id, toInput(form));
        else await createCredential(toInput(form));
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
    if (!confirm("Delete this credential?")) return;
    startTransition(async () => {
      try {
        await deleteCredential(id);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Delete failed");
      }
    });
  }

  async function toggleReveal(id: string) {
    if (revealedKeys[id] !== undefined) {
      setRevealedKeys((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      return;
    }
    setLoadingReveal((prev) => new Set([...prev, id]));
    try {
      const plaintext = await revealCredential(id);
      setRevealedKeys((prev) => ({ ...prev, [id]: plaintext }));
    } finally {
      setLoadingReveal((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  async function copyKey(id: string) {
    let val = revealedKeys[id];
    if (!val) {
      val = await revealCredential(id);
      setRevealedKeys((prev) => ({ ...prev, [id]: val }));
    }
    await navigator.clipboard.writeText(val);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <h1
          className="text-[22px] font-medium text-ink leading-tight"
          style={{ letterSpacing: "-0.3px" }}
        >
          Credentials
        </h1>
        <Btn icon={<Plus size={14} />} onClick={openCreate}>
          New credential
        </Btn>
      </div>

      {/* Alert banner — only when expired or expiring-soon */}
      {(expiredCount > 0 || expiringSoonCount > 0) && (
        <div
          className="px-4 py-3 rounded-[var(--radius-admin-lg)] border mb-4 text-[13px] space-y-0.5"
          style={{
            background: "color-mix(in oklab, var(--amber) 8%, var(--panel))",
            borderColor: "color-mix(in oklab, var(--amber) 22%, var(--border))",
          }}
        >
          {expiredCount > 0 && (
            <div style={{ color: "color-mix(in oklab, var(--red) 80%, var(--text))" }}>
              {expiredCount} credential{expiredCount === 1 ? "" : "s"} expired
            </div>
          )}
          {expiringSoonCount > 0 && (
            <div style={{ color: "color-mix(in oklab, var(--amber) 80%, var(--text))" }}>
              {expiringSoonCount} credential{expiringSoonCount === 1 ? "" : "s"} expiring within 14 days
            </div>
          )}
        </div>
      )}

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
          placeholder="Search credentials..."
          className="h-8 w-56 px-3 rounded-[var(--radius-admin-lg)] border border-line bg-surface-panel text-[13px] text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40"
        />
        <SegControl options={FILTER_OPTIONS} active={filter} onChange={setFilter} />
      </div>

      {/* Table */}
      <Panel pad={false}>
        {/* Column headers */}
        <div
          className="grid items-center px-4 py-2.5 border-b border-line text-[11px] font-medium uppercase tracking-[0.4px] text-ink-muted"
          style={{ background: "var(--bg)", gridTemplateColumns: COL }}
        >
          <span>Name</span>
          <span>Service</span>
          <span>Project</span>
          <span>Source</span>
          <span>Expires</span>
          <span />
        </div>

        {initial.length === 0 ? (
          <div className="flex items-center gap-3 px-4 py-3">
            <span className="text-[13px] text-ink-muted">No credentials yet.</span>
            <Btn size="sm" icon={<Plus size={12} />} onClick={openCreate}>
              New credential
            </Btn>
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-4 py-3 text-[13px] text-ink-muted">
            No matching credentials.
          </div>
        ) : (
          <ul>
            {filtered.map((c, i) => {
              const expiry = expiryCountdown(c.expires_at);
              const isRevealed = revealedKeys[c.id] !== undefined;
              const isLoadingKey = loadingReveal.has(c.id);
              return (
                <li
                  key={c.id}
                  className={`group ${i > 0 ? "border-t border-line" : ""}`}
                >
                  <div
                    className="grid items-center px-4 py-3 hover:bg-[rgba(255,255,255,0.015)] transition-colors duration-100"
                    style={{ gridTemplateColumns: COL }}
                  >
                    {/* Name + masked key */}
                    <div className="min-w-0 pr-3">
                      <div className="text-[13px] text-ink truncate">{c.name}</div>
                      <div
                        className="text-[11px] text-ink-faint truncate mt-0.5 select-all"
                        style={{
                          fontFamily: "var(--font-admin-mono)",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {isRevealed ? revealedKeys[c.id] : "••••••••••••"}
                      </div>
                    </div>

                    {/* Service */}
                    <div className="flex items-center gap-1.5 min-w-0 pr-3">
                      <ServiceDot service={c.service} />
                      <span className="text-[13px] text-ink truncate">{c.service || "—"}</span>
                    </div>

                    {/* Project */}
                    <span className="text-[13px] text-ink-muted truncate pr-3">
                      {c.project_name ?? (
                        <span className="text-ink-faint">—</span>
                      )}
                    </span>

                    {/* Source tag */}
                    <span>
                      <Tag>{c.source}</Tag>
                    </span>

                    {/* Expires countdown */}
                    <span>
                      {expiry.pill ? (
                        <Pill tone={expiry.pill}>{expiry.text}</Pill>
                      ) : (
                        <span
                          className="text-[11px] text-ink-faint"
                          style={{
                            fontFamily: "var(--font-admin-mono)",
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          {expiry.text}
                        </span>
                      )}
                    </span>

                    {/* Row actions */}
                    <div className="flex items-center gap-0.5 justify-end opacity-30 group-hover:opacity-100 transition-opacity duration-100">
                      <IconBtn
                        icon={
                          isRevealed ? (
                            <EyeOff size={13} strokeWidth={1.5} />
                          ) : (
                            <Eye size={13} strokeWidth={1.5} />
                          )
                        }
                        onClick={() => toggleReveal(c.id)}
                        disabled={isLoadingKey || pending}
                        title={isRevealed ? "Hide" : "Reveal"}
                      />
                      <IconBtn
                        icon={
                          copiedId === c.id ? (
                            <Check size={13} strokeWidth={1.5} />
                          ) : (
                            <Copy size={13} strokeWidth={1.5} />
                          )
                        }
                        onClick={() => copyKey(c.id)}
                        disabled={pending}
                        title="Copy"
                      />
                      <IconBtn
                        icon={<Pencil size={13} strokeWidth={1.5} />}
                        onClick={() => openEdit(c)}
                        title="Edit"
                      />
                      <IconBtn
                        icon={<Trash2 size={13} strokeWidth={1.5} />}
                        danger
                        onClick={() => remove(c.id)}
                        disabled={pending}
                        title="Delete"
                      />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      {/* Create / edit dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit credential" : "New credential"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Name">
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="VERCEL_TOKEN"
                />
              </Field>
              <Field label="Service">
                <Input
                  value={form.service}
                  onChange={(e) =>
                    setForm({ ...form, service: e.target.value })
                  }
                  placeholder="Vercel"
                />
              </Field>
            </div>

            <Field
              label={
                editing ? "New value (leave blank to keep current)" : "Value"
              }
            >
              <Input
                type="password"
                value={form.key}
                onChange={(e) => setForm({ ...form, key: e.target.value })}
                placeholder={editing ? "Leave blank to keep current" : "sk-..."}
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Project">
                <Select
                  value={form.project_id}
                  onValueChange={(value) =>
                    setForm({ ...form, project_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>None</SelectItem>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Expires">
                <Input
                  type="date"
                  value={form.expires_at}
                  onChange={(e) =>
                    setForm({ ...form, expires_at: e.target.value })
                  }
                />
              </Field>
            </div>

            <Field label="Notes">
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
              />
            </Field>

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
                {pending
                  ? "Saving..."
                  : editing
                    ? "Save changes"
                    : "Add credential"}
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
