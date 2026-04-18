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
  StickyNote,
  Pin,
  PinOff,
  Pencil,
  Trash2,
  Search,
  Clock,
} from "lucide-react";
import type { NoteWithProject } from "@/lib/db/queries";
import {
  createNote,
  deleteNote,
  toggleNotePinned,
  updateNote,
  type NoteInput,
} from "@/lib/db/actions";

type ProjectMini = { id: string; name: string };

const NONE = "__none__";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTag, setFilterTag] = useState<string>("all");

  const notes = initial;

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
    const input = toInput(form);
    startTransition(async () => {
      try {
        if (editing) await updateNote(editing.id, input);
        else await createNote(input);
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

  const allTags = Array.from(new Set(notes.flatMap((n) => n.tags))).sort();

  const filteredNotes = notes.filter((note) => {
    const matchesSearch =
      searchQuery === "" ||
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = filterTag === "all" || note.tags.includes(filterTag);
    return matchesSearch && matchesTag;
  });

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold">Notes</h1>
          <p className="text-muted-foreground">Quick notes and scratchpad.</p>
        </motion.div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}>
              <Plus className="w-4 h-4 mr-2" />
              New Note
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Note" : "New Note"}</DialogTitle>
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
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={save} disabled={pending}>
                  {pending ? "Saving..." : editing ? "Save Changes" : "Create Note"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          <Badge
            variant={filterTag === "all" ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setFilterTag("all")}
          >
            All
          </Badge>
          {allTags.map((tag) => (
            <Badge
              key={tag}
              variant={filterTag === tag ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setFilterTag(tag)}
            >
              {tag}
            </Badge>
          ))}
        </div>
      </motion.div>

      {error && !isDialogOpen && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredNotes.map((note, index) => (
          <motion.div
            key={note.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className={note.pinned ? "border-accent-blue/50" : ""}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    {note.pinned && <Pin className="w-3 h-3 text-accent-blue" />}
                    {note.title}
                  </CardTitle>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => togglePinned(note.id, note.pinned)}
                      disabled={pending}
                    >
                      {note.pinned ? (
                        <PinOff className="w-3 h-3" />
                      ) : (
                        <Pin className="w-3 h-3" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEdit(note)}
                    >
                      <Pencil className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => remove(note.id)}
                      disabled={pending}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {note.content && (
                  <p className="text-sm text-muted-foreground line-clamp-4 whitespace-pre-wrap">
                    {note.content}
                  </p>
                )}

                {note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {note.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="text-xs cursor-pointer"
                        onClick={() => setFilterTag(tag)}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {formatDate(note.updated_at)}
                  {note.project_name && (
                    <span className="ml-2">• {note.project_name}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {filteredNotes.length === 0 && (
        <div className="text-center py-12">
          <StickyNote className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">
            {searchQuery || filterTag !== "all"
              ? "No notes match your search"
              : "No notes yet"}
          </p>
          {!searchQuery && filterTag === "all" && (
            <Button onClick={openCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Create your first note
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
