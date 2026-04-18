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
  Server,
  ExternalLink,
  Copy,
  Check,
  Pencil,
  Trash2,
  Play,
  Square,
  Terminal,
} from "lucide-react";
import type { LocalServiceWithProject } from "@/lib/db/queries";
import {
  createService,
  deleteService,
  toggleServiceActive,
  updateService,
  type ServiceInput,
} from "@/lib/db/actions";

type ProjectMini = { id: string; name: string };

const NONE = "__none__";

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
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const services = initial;

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

  async function copyCommand(id: string, command: string) {
    await navigator.clipboard.writeText(command);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const activeCount = services.filter((s) => s.is_active).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold">Local Services</h1>
          <p className="text-muted-foreground">
            Track dev servers and local ports.
          </p>
        </motion.div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Add Service
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editing ? "Edit Service" : "Add Service"}
              </DialogTitle>
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

              <Field label="Start Command">
                <Input
                  value={form.start_command}
                  onChange={(e) =>
                    setForm({ ...form, start_command: e.target.value })
                  }
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

              {error && <p className="text-sm text-destructive">{error}</p>}

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={save} disabled={pending}>
                  {pending ? "Saving..." : editing ? "Save Changes" : "Add Service"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-4 rounded-lg flex items-center gap-3 ${
          activeCount > 0
            ? "bg-entropy-ordered/10 border border-entropy-ordered/30"
            : "bg-surface-1 border border-border"
        }`}
      >
        <Server
          className={`w-5 h-5 ${
            activeCount > 0 ? "text-entropy-ordered" : "text-muted-foreground"
          }`}
        />
        <span className="text-sm">
          <strong>{activeCount}</strong> service{activeCount !== 1 ? "s" : ""} running
        </span>
      </motion.div>

      {error && !isDialogOpen && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((s, index) => (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className={s.is_active ? "border-entropy-ordered/50" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        s.is_active
                          ? "bg-entropy-ordered animate-pulse"
                          : "bg-muted-foreground"
                      }`}
                    />
                    <CardTitle className="text-base">{s.name}</CardTitle>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => toggleActive(s.id, s.is_active)}
                      disabled={pending}
                    >
                      {s.is_active ? (
                        <Square className="w-3 h-3" />
                      ) : (
                        <Play className="w-3 h-3" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEdit(s)}
                    >
                      <Pencil className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => remove(s.id)}
                      disabled={pending}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="font-mono text-lg px-3 py-1"
                  >
                    :{s.port}
                  </Badge>
                  <a
                    href={`http://localhost:${s.port}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent-blue hover:underline flex items-center gap-1 text-sm"
                  >
                    Open <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {s.start_command && (
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs bg-surface-1 p-2 rounded font-mono truncate flex items-center gap-2">
                      <Terminal className="w-3 h-3 text-muted-foreground" />
                      {s.start_command}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => copyCommand(s.id, s.start_command!)}
                    >
                      {copiedId === s.id ? (
                        <Check className="w-3 h-3 text-entropy-ordered" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                )}

                {s.project_name && (
                  <div className="text-xs text-muted-foreground">
                    Project: {s.project_name}
                  </div>
                )}

                {s.notes && (
                  <p className="text-xs text-muted-foreground">{s.notes}</p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {services.length === 0 && (
        <div className="text-center py-12">
          <Server className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">No services tracked yet</p>
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Add your first service
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
