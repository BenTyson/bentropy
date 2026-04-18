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
  GitBranch,
  ExternalLink,
  Copy,
  Check,
  Pencil,
  Trash2,
  Github,
  FolderGit2,
} from "lucide-react";
import type { RepositoryWithProject } from "@/lib/db/queries";
import {
  createRepo,
  deleteRepo,
  updateRepo,
  type RepoInput,
} from "@/lib/db/actions";

type ProjectMini = { id: string; name: string };

const NONE = "__none__";
const NO_CATEGORY = "__none__";
const categories = [
  "Portfolio",
  "Tools",
  "AI",
  "Config",
  "Experiments",
  "Archive",
];

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
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const repos = initial;

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
    const input = toInput(form);
    startTransition(async () => {
      try {
        if (editing) await updateRepo(editing.id, input);
        else await createRepo(input);
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

  async function copyCloneCommand(id: string, url: string) {
    await navigator.clipboard.writeText(`git clone ${url}.git`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const filteredRepos =
    filterCategory === "all"
      ? repos
      : repos.filter((r) => r.category === filterCategory);

  const usedCategories = Array.from(
    new Set(repos.map((r) => r.category).filter(Boolean)),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold">Repository Hub</h1>
          <p className="text-muted-foreground">
            Quick access to all your GitHub repos.
          </p>
        </motion.div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Add Repository
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editing ? "Edit Repository" : "Add Repository"}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Field label="Repository Name">
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="my-project"
                />
              </Field>

              <Field label="GitHub URL">
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
                  {pending ? "Saving..." : editing ? "Save Changes" : "Add Repository"}
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
          All ({repos.length})
        </Badge>
        {usedCategories.map((cat) => (
          <Badge
            key={cat}
            variant={filterCategory === cat ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setFilterCategory(cat!)}
          >
            {cat} ({repos.filter((r) => r.category === cat).length})
          </Badge>
        ))}
      </motion.div>

      {error && !isDialogOpen && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRepos.map((r, index) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Github className="w-4 h-4 text-muted-foreground" />
                    <CardTitle className="text-base">{r.name}</CardTitle>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEdit(r)}
                    >
                      <Pencil className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => remove(r.id)}
                      disabled={pending}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                {r.category && (
                  <Badge variant="secondary" className="w-fit text-xs">
                    {r.category}
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent-blue hover:underline flex items-center gap-1 text-sm"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Open in GitHub
                  </a>
                </div>

                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-surface-1 p-2 rounded font-mono truncate flex items-center gap-2">
                    <FolderGit2 className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                    git clone {r.url}.git
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => copyCloneCommand(r.id, r.url)}
                  >
                    {copiedId === r.id ? (
                      <Check className="w-3 h-3 text-entropy-ordered" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </Button>
                </div>

                {r.project_name && (
                  <div className="text-xs text-muted-foreground">
                    Project: {r.project_name}
                  </div>
                )}

                {r.notes && (
                  <p className="text-xs text-muted-foreground">{r.notes}</p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {filteredRepos.length === 0 && (
        <div className="text-center py-12">
          <GitBranch className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">
            {filterCategory === "all"
              ? "No repositories added yet"
              : `No repositories in "${filterCategory}"`}
          </p>
          {filterCategory === "all" && (
            <Button onClick={openCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Add your first repository
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
