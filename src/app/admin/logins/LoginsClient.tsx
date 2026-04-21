"use client";

import { useState, useTransition, useMemo } from "react";
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
import type { Login } from "@/lib/db/types";
import {
  createLogin,
  deleteLogin,
  revealLogin,
  updateLogin,
  type LoginInput,
} from "@/lib/db/actions";
import { Panel } from "@/components/admin/Panel";
import { Btn } from "@/components/admin/Btn";
import { IconBtn } from "@/components/admin/IconBtn";
import { Tag } from "@/components/admin/Tag";
import { ServiceDot } from "@/components/admin/ServiceDot";
import { SegControl } from "@/components/admin/SegControl";

const CATEGORIES = [
  "Hosting",
  "Development",
  "Database",
  "AI",
  "Analytics",
  "Social",
  "Other",
];

const NO_CATEGORY = "__none__";
const COL = "minmax(140px,1fr) minmax(140px,1fr) minmax(120px,1fr) 80px 90px 104px";

type RevealedLogin = { username: string; password: string };

interface FormState {
  service: string;
  username: string;
  password: string;
  url: string;
  category: string;
  notes: string;
}

const emptyForm: FormState = {
  service: "",
  username: "",
  password: "",
  url: "",
  category: NO_CATEGORY,
  notes: "",
};

function toInput(form: FormState): LoginInput {
  return {
    service: form.service,
    username: form.username,
    password: form.password,
    url: form.url || null,
    category: form.category === NO_CATEGORY ? null : form.category,
    notes: form.notes || null,
  };
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

export function LoginsClient({ initial }: { initial: Login[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Login | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("All");
  const [revealed, setRevealed] = useState<Record<string, RevealedLogin>>({});
  const [loadingReveal, setLoadingReveal] = useState<Set<string>>(new Set());
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const usedCategories = useMemo(
    () => Array.from(new Set(initial.map((l) => l.category).filter(Boolean))) as string[],
    [initial],
  );
  const segOptions = useMemo(() => ["All", ...usedCategories], [usedCategories]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return initial.filter((l) => {
      const matchesCat = filterCat === "All" || l.category === filterCat;
      const matchesSearch =
        !q ||
        l.service.toLowerCase().includes(q) ||
        (l.url ?? "").toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [initial, search, filterCat]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setError(null);
    setIsDialogOpen(true);
  }

  function openEdit(l: Login) {
    setEditing(l);
    setForm({
      service: l.service,
      username: "",
      password: "",
      url: l.url ?? "",
      category: l.category ?? NO_CATEGORY,
      notes: l.notes ?? "",
    });
    setError(null);
    setIsDialogOpen(true);
  }

  function save() {
    setError(null);
    const input = toInput(form);
    if (!editing && (!input.username || !input.password)) {
      setError("Username and password are required.");
      return;
    }
    startTransition(async () => {
      try {
        if (editing) await updateLogin(editing.id, input);
        else await createLogin(input);
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
    if (!confirm("Delete this login?")) return;
    startTransition(async () => {
      try {
        await deleteLogin(id);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Delete failed");
      }
    });
  }

  async function toggleReveal(id: string) {
    if (revealed[id]) {
      setRevealed((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      return;
    }
    setLoadingReveal((prev) => new Set([...prev, id]));
    try {
      const data = await revealLogin(id);
      setRevealed((prev) => ({ ...prev, [id]: data }));
    } finally {
      setLoadingReveal((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  async function copyField(fieldId: string, getValue: () => Promise<string>) {
    const val = await getValue();
    await navigator.clipboard.writeText(val);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  }

  async function getUsername(id: string): Promise<string> {
    if (revealed[id]) return revealed[id].username;
    const data = await revealLogin(id);
    setRevealed((prev) => ({ ...prev, [id]: data }));
    return data.username;
  }

  async function getPassword(id: string): Promise<string> {
    if (revealed[id]) return revealed[id].password;
    const data = await revealLogin(id);
    setRevealed((prev) => ({ ...prev, [id]: data }));
    return data.password;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[22px] font-medium text-ink leading-tight" style={{ letterSpacing: "-0.3px" }}>
          Logins
        </h1>
        <Btn icon={<Plus size={14} />} onClick={openCreate}>
          New login
        </Btn>
      </div>

      {error && !isDialogOpen && (
        <p className="text-[13px] mb-4" style={{ color: "var(--red)" }}>{error}</p>
      )}

      <div className="flex items-center justify-between gap-3 mb-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search logins..."
          className="h-8 w-56 px-3 rounded-[var(--radius-admin-lg)] border border-line bg-surface-panel text-[13px] text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40"
        />
        <SegControl options={segOptions} active={filterCat} onChange={setFilterCat} />
      </div>

      <Panel pad={false}>
        <div
          className="grid items-center px-4 py-2.5 border-b border-line text-[11px] font-medium uppercase tracking-[0.4px] text-ink-muted"
          style={{ background: "var(--bg)", gridTemplateColumns: COL }}
        >
          <span>Service</span>
          <span>Username</span>
          <span>URL</span>
          <span>Category</span>
          <span>Last used</span>
          <span />
        </div>

        {initial.length === 0 ? (
          <div className="flex items-center gap-3 px-4 py-3">
            <span className="text-[13px] text-ink-muted">No logins yet.</span>
            <Btn size="sm" icon={<Plus size={12} />} onClick={openCreate}>New login</Btn>
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-4 py-3 text-[13px] text-ink-muted">No matching logins.</div>
        ) : (
          <ul>
            {filtered.map((l, i) => {
              const isRevealed = !!revealed[l.id];
              const isLoading = loadingReveal.has(l.id);
              return (
                <li key={l.id} className={`group ${i > 0 ? "border-t border-line" : ""}`}>
                  <div
                    className="grid items-center px-4 py-3 hover:bg-[rgba(255,255,255,0.015)] transition-colors duration-100"
                    style={{ gridTemplateColumns: COL }}
                  >
                    <div className="flex items-center gap-1.5 min-w-0 pr-3">
                      <ServiceDot service={l.service} />
                      <span className="text-[13px] text-ink truncate">{l.service}</span>
                    </div>

                    <div
                      className="text-[11px] text-ink-faint truncate pr-3 select-all"
                      style={{ fontFamily: "var(--font-admin-mono)", fontVariantNumeric: "tabular-nums" }}
                    >
                      {isRevealed ? revealed[l.id].username : "••••••••••••"}
                    </div>

                    <div
                      className="text-[11px] text-ink-faint truncate pr-3"
                      style={{ fontFamily: "var(--font-admin-mono)" }}
                    >
                      {l.url || "—"}
                    </div>

                    <span>
                      {l.category ? <Tag>{l.category}</Tag> : <span className="text-ink-faint text-[11px]">—</span>}
                    </span>

                    <span
                      className="text-[11px] text-ink-faint"
                      style={{ fontFamily: "var(--font-admin-mono)", fontVariantNumeric: "tabular-nums" }}
                    >
                      {relativeTime(l.last_used)}
                    </span>

                    <div className="flex items-center gap-0.5 justify-end opacity-30 group-hover:opacity-100 transition-opacity duration-100">
                      <IconBtn
                        icon={isRevealed ? <EyeOff size={13} strokeWidth={1.5} /> : <Eye size={13} strokeWidth={1.5} />}
                        onClick={() => toggleReveal(l.id)}
                        disabled={isLoading || pending}
                        title={isRevealed ? "Hide" : "Reveal"}
                      />
                      <IconBtn
                        icon={copiedField === `${l.id}-u` ? <Check size={13} strokeWidth={1.5} /> : <Copy size={13} strokeWidth={1.5} />}
                        onClick={() => copyField(`${l.id}-u`, () => getUsername(l.id))}
                        disabled={pending}
                        title="Copy username"
                      />
                      <IconBtn
                        icon={copiedField === `${l.id}-p` ? <Check size={13} strokeWidth={1.5} /> : <Copy size={13} strokeWidth={1.5} />}
                        onClick={() => copyField(`${l.id}-p`, () => getPassword(l.id))}
                        disabled={pending}
                        title="Copy password"
                      />
                      <IconBtn
                        icon={<Pencil size={13} strokeWidth={1.5} />}
                        onClick={() => openEdit(l)}
                        title="Edit"
                      />
                      <IconBtn
                        icon={<Trash2 size={13} strokeWidth={1.5} />}
                        danger
                        onClick={() => remove(l.id)}
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit login" : "New login"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Service">
                <Input
                  value={form.service}
                  onChange={(e) => setForm({ ...form, service: e.target.value })}
                  placeholder="GitHub"
                />
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

            <Field label={editing ? "Username (leave blank to keep current)" : "Username"}>
              <Input
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder={editing ? "Leave blank to keep current" : "user@example.com"}
              />
            </Field>

            <Field label={editing ? "Password (leave blank to keep current)" : "Password"}>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder={editing ? "Leave blank to keep current" : "••••••••"}
              />
            </Field>

            <Field label="URL">
              <Input
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                placeholder="https://..."
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
                {pending ? "Saving..." : editing ? "Save changes" : "Add login"}
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
