"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Plus,
  Key,
  Copy,
  Eye,
  EyeOff,
  Pencil,
  Trash2,
  AlertTriangle,
  Check,
  Clock,
} from "lucide-react";
import type { CredentialWithProject } from "@/lib/db/queries";
import {
  createCredential,
  deleteCredential,
  updateCredential,
  type CredentialInput,
} from "@/lib/db/actions";

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
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const credentials = initial;

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
      key: c.key_encrypted,
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
    const input = toInput(form);
    startTransition(async () => {
      try {
        if (editing) await updateCredential(editing.id, input);
        else await createCredential(input);
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

  function toggleVisibility(id: string) {
    setVisibleKeys((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function copyToClipboard(id: string, key: string) {
    await navigator.clipboard.writeText(key);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function isExpiringSoon(expiresAt: string | null) {
    if (!expiresAt) return false;
    const days = (new Date(expiresAt).getTime() - Date.now()) / 86400000;
    return days > 0 && days <= 14;
  }

  function isExpired(expiresAt: string | null) {
    if (!expiresAt) return false;
    return new Date(expiresAt).getTime() < Date.now();
  }

  const expiringCount = credentials.filter((c) => isExpiringSoon(c.expires_at)).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold">Credentials Vault</h1>
          <p className="text-muted-foreground">
            Securely store and manage API keys and secrets.
          </p>
        </motion.div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Add Credential
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editing ? "Edit Credential" : "Add Credential"}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Name">
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Vercel API Token"
                  />
                </Field>
                <Field label="Service">
                  <Input
                    value={form.service}
                    onChange={(e) => setForm({ ...form, service: e.target.value })}
                    placeholder="Vercel"
                  />
                </Field>
              </div>

              <Field label="API Key / Secret">
                <Input
                  type="password"
                  value={form.key}
                  onChange={(e) => setForm({ ...form, key: e.target.value })}
                  placeholder="sk-..."
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

              {error && <p className="text-sm text-destructive">{error}</p>}

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={save} disabled={pending}>
                  {pending ? "Saving..." : editing ? "Save Changes" : "Add Credential"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {expiringCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-lg bg-entropy-drifting/10 border border-entropy-drifting/30 flex items-center gap-3"
        >
          <AlertTriangle className="w-5 h-5 text-entropy-drifting" />
          <span className="text-sm">
            <strong>{expiringCount} credential{expiringCount === 1 ? "" : "s"}</strong>{" "}
            expiring within 14 days
          </span>
        </motion.div>
      )}

      {error && !isDialogOpen && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {credentials.map((c, index) => (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card
              className={
                isExpired(c.expires_at)
                  ? "border-entropy-chaos/50"
                  : isExpiringSoon(c.expires_at)
                    ? "border-entropy-drifting/50"
                    : ""
              }
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-accent-violet" />
                    <CardTitle className="text-base">{c.name}</CardTitle>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEdit(c)}
                    >
                      <Pencil className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => remove(c.id)}
                      disabled={pending}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <Badge variant="secondary" className="w-fit text-xs">
                  {c.service}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-surface-1 p-2 rounded font-mono truncate">
                    {visibleKeys.has(c.id)
                      ? c.key_encrypted
                      : "••••••••••••••••"}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => toggleVisibility(c.id)}
                  >
                    {visibleKeys.has(c.id) ? (
                      <EyeOff className="w-3 h-3" />
                    ) : (
                      <Eye className="w-3 h-3" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => copyToClipboard(c.id, c.key_encrypted)}
                  >
                    {copiedId === c.id ? (
                      <Check className="w-3 h-3 text-entropy-ordered" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {c.project_name && <span>Project: {c.project_name}</span>}
                  {c.expires_at && (
                    <span
                      className={`flex items-center gap-1 ${
                        isExpired(c.expires_at)
                          ? "text-entropy-chaos"
                          : isExpiringSoon(c.expires_at)
                            ? "text-entropy-drifting"
                            : ""
                      }`}
                    >
                      <Clock className="w-3 h-3" />
                      {isExpired(c.expires_at)
                        ? "Expired"
                        : `Expires ${new Date(c.expires_at).toLocaleDateString()}`}
                    </span>
                  )}
                </div>

                {c.notes && (
                  <p className="text-xs text-muted-foreground">{c.notes}</p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {credentials.length === 0 && (
        <div className="text-center py-12">
          <Key className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">No credentials stored yet</p>
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Add your first credential
          </Button>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}
