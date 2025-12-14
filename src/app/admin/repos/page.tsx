"use client";

import { useState } from "react";
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
import type { Repository } from "@/lib/supabase/types";

// Placeholder data
const initialRepos: (Repository & { project_name?: string })[] = [
  {
    id: "1",
    name: "bentropy",
    url: "https://github.com/BenTyson/bentropy",
    project_id: null,
    project_name: undefined,
    category: "Portfolio",
    notes: "This project - personal site & command center",
  },
  {
    id: "2",
    name: "qr-forge",
    url: "https://github.com/BenTyson/qr-forge",
    project_id: "1",
    project_name: "QR Forge",
    category: "Tools",
    notes: "QR code generator",
  },
  {
    id: "3",
    name: "scribe",
    url: "https://github.com/BenTyson/scribe",
    project_id: "2",
    project_name: "Scribe",
    category: "AI",
    notes: "AI documentation assistant",
  },
  {
    id: "4",
    name: "dotfiles",
    url: "https://github.com/BenTyson/dotfiles",
    project_id: null,
    project_name: undefined,
    category: "Config",
    notes: "Personal dotfiles and configs",
  },
];

const categories = ["Portfolio", "Tools", "AI", "Config", "Experiments", "Archive"];

interface RepoFormData {
  name: string;
  url: string;
  project_id: string;
  category: string;
  notes: string;
}

const emptyForm: RepoFormData = {
  name: "",
  url: "",
  project_id: "",
  category: "",
  notes: "",
};

export default function ReposPage() {
  const [repos, setRepos] = useState(initialRepos);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRepo, setEditingRepo] = useState<Repository | null>(null);
  const [formData, setFormData] = useState<RepoFormData>(emptyForm);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const handleOpenCreate = () => {
    setEditingRepo(null);
    setFormData(emptyForm);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (repo: Repository) => {
    setEditingRepo(repo);
    setFormData({
      name: repo.name,
      url: repo.url,
      project_id: repo.project_id || "",
      category: repo.category || "",
      notes: repo.notes || "",
    });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (editingRepo) {
      setRepos((prev) =>
        prev.map((r) =>
          r.id === editingRepo.id
            ? {
                ...r,
                name: formData.name,
                url: formData.url,
                project_id: formData.project_id || null,
                category: formData.category || null,
                notes: formData.notes || null,
              }
            : r
        )
      );
    } else {
      const newRepo: Repository & { project_name?: string } = {
        id: crypto.randomUUID(),
        name: formData.name,
        url: formData.url,
        project_id: formData.project_id || null,
        category: formData.category || null,
        notes: formData.notes || null,
      };
      setRepos((prev) => [...prev, newRepo]);
    }

    setIsDialogOpen(false);
    setFormData(emptyForm);
    setEditingRepo(null);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this repository?")) {
      setRepos((prev) => prev.filter((r) => r.id !== id));
    }
  };

  const copyCloneCommand = async (id: string, url: string) => {
    const command = `git clone ${url}.git`;
    await navigator.clipboard.writeText(command);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredRepos =
    filterCategory === "all"
      ? repos
      : repos.filter((r) => r.category === filterCategory);

  const usedCategories = Array.from(new Set(repos.map((r) => r.category).filter(Boolean)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl font-bold">Repository Hub</h1>
          <p className="text-muted-foreground">
            Quick access to all your GitHub repos
          </p>
        </motion.div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Add Repository
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingRepo ? "Edit Repository" : "Add Repository"}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Repository Name</label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="my-project"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">GitHub URL</label>
                <Input
                  value={formData.url}
                  onChange={(e) =>
                    setFormData({ ...formData, url: e.target.value })
                  }
                  placeholder="https://github.com/username/repo"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Project</label>
                  <Select
                    value={formData.project_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, project_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      <SelectItem value="1">QR Forge</SelectItem>
                      <SelectItem value="2">Scribe</SelectItem>
                      <SelectItem value="3">Clarify</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Notes</label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Additional notes..."
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  {editingRepo ? "Save Changes" : "Add Repository"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter */}
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

      {/* Repos Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRepos.map((repo, index) => (
          <motion.div
            key={repo.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Github className="w-4 h-4 text-muted-foreground" />
                    <CardTitle className="text-base">{repo.name}</CardTitle>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleOpenEdit(repo)}
                    >
                      <Pencil className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(repo.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                {repo.category && (
                  <Badge variant="secondary" className="w-fit text-xs">
                    {repo.category}
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Links */}
                <div className="flex items-center gap-3">
                  <a
                    href={repo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent-blue hover:underline flex items-center gap-1 text-sm"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Open in GitHub
                  </a>
                </div>

                {/* Clone command */}
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-surface-1 p-2 rounded font-mono truncate flex items-center gap-2">
                    <FolderGit2 className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                    git clone {repo.url}.git
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => copyCloneCommand(repo.id, repo.url)}
                  >
                    {copiedId === repo.id ? (
                      <Check className="w-3 h-3 text-entropy-ordered" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </Button>
                </div>

                {/* Meta info */}
                {repo.project_name && (
                  <div className="text-xs text-muted-foreground">
                    Project: {repo.project_name}
                  </div>
                )}

                {repo.notes && (
                  <p className="text-xs text-muted-foreground">{repo.notes}</p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {filteredRepos.length === 0 && (
        <div className="text-center py-12">
          <GitBranch className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">
            {filterCategory === "all"
              ? "No repositories added yet"
              : `No repositories in "${filterCategory}"`}
          </p>
          {filterCategory === "all" && (
            <Button onClick={handleOpenCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Add your first repository
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
