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
  Lock,
  Copy,
  Check,
  Eye,
  EyeOff,
  Pencil,
  Trash2,
  ExternalLink,
  User,
} from "lucide-react";
import type { Login } from "@/lib/db/types";
import {
  createLogin,
  deleteLogin,
  updateLogin,
  type LoginInput,
} from "@/lib/db/actions";

const NO_CATEGORY = "__none__";
const categories = [
  "Hosting",
  "Development",
  "Database",
  "AI",
  "Analytics",
  "Social",
  "Other",
];

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
    url: form.url,
    category: form.category === NO_CATEGORY ? null : form.category,
    notes: form.notes,
  };
}

export function LoginsClient({ initial }: { initial: Login[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Login | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const logins = initial;

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
      username: l.username_encrypted,
      password: l.password_encrypted,
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

  function togglePasswordVisibility(id: string) {
    setVisiblePasswords((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function copyToClipboard(fieldId: string, value: string) {
    await navigator.clipboard.writeText(value);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  }

  const filteredLogins =
    filterCategory === "all"
      ? logins
      : logins.filter((l) => l.category === filterCategory);

  const usedCategories = Array.from(
    new Set(logins.map((l) => l.category).filter(Boolean)),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold">Login Manager</h1>
          <p className="text-muted-foreground">
            Securely store service credentials.
          </p>
        </motion.div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Add Login
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editing ? "Edit Login" : "Add Login"}
              </DialogTitle>
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
                    onValueChange={(value) =>
                      setForm({ ...form, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_CATEGORY}>None</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <Field label="Username / Email">
                <Input
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  placeholder="user@example.com"
                />
              </Field>

              <Field label="Password">
                <Input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
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

              {error && <p className="text-sm text-destructive">{error}</p>}

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={save} disabled={pending}>
                  {pending ? "Saving..." : editing ? "Save Changes" : "Add Login"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex gap-2 flex-wrap"
      >
        <Badge
          variant={filterCategory === "all" ? "default" : "outline"}
          className="cursor-pointer"
          onClick={() => setFilterCategory("all")}
        >
          All ({logins.length})
        </Badge>
        {usedCategories.map((cat) => (
          <Badge
            key={cat}
            variant={filterCategory === cat ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setFilterCategory(cat!)}
          >
            {cat} ({logins.filter((l) => l.category === cat).length})
          </Badge>
        ))}
      </motion.div>

      {error && !isDialogOpen && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredLogins.map((l, index) => (
          <motion.div
            key={l.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-accent-violet" />
                    <CardTitle className="text-base">{l.service}</CardTitle>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEdit(l)}
                    >
                      <Pencil className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => remove(l.id)}
                      disabled={pending}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                {l.category && (
                  <Badge variant="secondary" className="w-fit text-xs">
                    {l.category}
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="w-3 h-3 text-muted-foreground" />
                  <code className="flex-1 text-xs bg-surface-1 p-2 rounded font-mono truncate">
                    {l.username_encrypted}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() =>
                      copyToClipboard(`${l.id}-user`, l.username_encrypted)
                    }
                  >
                    {copiedField === `${l.id}-user` ? (
                      <Check className="w-3 h-3 text-entropy-ordered" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <Lock className="w-3 h-3 text-muted-foreground" />
                  <code className="flex-1 text-xs bg-surface-1 p-2 rounded font-mono">
                    {visiblePasswords.has(l.id)
                      ? l.password_encrypted
                      : "••••••••••••"}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => togglePasswordVisibility(l.id)}
                  >
                    {visiblePasswords.has(l.id) ? (
                      <EyeOff className="w-3 h-3" />
                    ) : (
                      <Eye className="w-3 h-3" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() =>
                      copyToClipboard(`${l.id}-pass`, l.password_encrypted)
                    }
                  >
                    {copiedField === `${l.id}-pass` ? (
                      <Check className="w-3 h-3 text-entropy-ordered" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </Button>
                </div>

                {l.url && (
                  <a
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent-blue hover:underline flex items-center gap-1 text-sm"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Open site
                  </a>
                )}

                {l.notes && (
                  <p className="text-xs text-muted-foreground">{l.notes}</p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {filteredLogins.length === 0 && (
        <div className="text-center py-12">
          <Lock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">
            {filterCategory === "all"
              ? "No logins stored yet"
              : `No logins in "${filterCategory}"`}
          </p>
          {filterCategory === "all" && (
            <Button onClick={openCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Add your first login
            </Button>
          )}
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
