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
import type { Login } from "@/lib/supabase/types";

// Placeholder data
const initialLogins: Login[] = [
  {
    id: "1",
    service: "Vercel",
    username_encrypted: "ben@example.com",
    password_encrypted: "••••••••••••",
    url: "https://vercel.com",
    category: "Hosting",
    notes: "Main deployment account",
    last_used: new Date().toISOString(),
    created_at: new Date().toISOString(),
  },
  {
    id: "2",
    service: "GitHub",
    username_encrypted: "BenTyson",
    password_encrypted: "••••••••••••",
    url: "https://github.com",
    category: "Development",
    notes: "Personal account",
    last_used: new Date().toISOString(),
    created_at: new Date().toISOString(),
  },
  {
    id: "3",
    service: "Supabase",
    username_encrypted: "ben@example.com",
    password_encrypted: "••••••••••••",
    url: "https://supabase.com",
    category: "Database",
    notes: null,
    last_used: null,
    created_at: new Date().toISOString(),
  },
  {
    id: "4",
    service: "OpenAI",
    username_encrypted: "ben@example.com",
    password_encrypted: "••••••••••••",
    url: "https://platform.openai.com",
    category: "AI",
    notes: "API access",
    last_used: null,
    created_at: new Date().toISOString(),
  },
];

const categories = ["Hosting", "Development", "Database", "AI", "Analytics", "Social", "Other"];

interface LoginFormData {
  service: string;
  username: string;
  password: string;
  url: string;
  category: string;
  notes: string;
}

const emptyForm: LoginFormData = {
  service: "",
  username: "",
  password: "",
  url: "",
  category: "",
  notes: "",
};

export default function LoginsPage() {
  const [logins, setLogins] = useState(initialLogins);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLogin, setEditingLogin] = useState<Login | null>(null);
  const [formData, setFormData] = useState<LoginFormData>(emptyForm);
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const handleOpenCreate = () => {
    setEditingLogin(null);
    setFormData(emptyForm);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (login: Login) => {
    setEditingLogin(login);
    setFormData({
      service: login.service,
      username: login.username_encrypted,
      password: login.password_encrypted,
      url: login.url || "",
      category: login.category || "",
      notes: login.notes || "",
    });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (editingLogin) {
      setLogins((prev) =>
        prev.map((l) =>
          l.id === editingLogin.id
            ? {
                ...l,
                service: formData.service,
                username_encrypted: formData.username,
                password_encrypted: formData.password,
                url: formData.url || null,
                category: formData.category || null,
                notes: formData.notes || null,
              }
            : l
        )
      );
    } else {
      const newLogin: Login = {
        id: crypto.randomUUID(),
        service: formData.service,
        username_encrypted: formData.username,
        password_encrypted: formData.password,
        url: formData.url || null,
        category: formData.category || null,
        notes: formData.notes || null,
        last_used: null,
        created_at: new Date().toISOString(),
      };
      setLogins((prev) => [...prev, newLogin]);
    }

    setIsDialogOpen(false);
    setFormData(emptyForm);
    setEditingLogin(null);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this login?")) {
      setLogins((prev) => prev.filter((l) => l.id !== id));
    }
  };

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const copyToClipboard = async (fieldId: string, value: string) => {
    await navigator.clipboard.writeText(value);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const filteredLogins =
    filterCategory === "all"
      ? logins
      : logins.filter((l) => l.category === filterCategory);

  const usedCategories = Array.from(new Set(logins.map((l) => l.category).filter(Boolean)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl font-bold">Login Manager</h1>
          <p className="text-muted-foreground">
            Securely store service credentials
          </p>
        </motion.div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Add Login
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingLogin ? "Edit Login" : "Add Login"}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Service</label>
                  <Input
                    value={formData.service}
                    onChange={(e) =>
                      setFormData({ ...formData, service: e.target.value })
                    }
                    placeholder="GitHub"
                  />
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
                <label className="text-sm font-medium">Username / Email</label>
                <Input
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  placeholder="user@example.com"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Password</label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="••••••••"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">URL</label>
                <Input
                  value={formData.url}
                  onChange={(e) =>
                    setFormData({ ...formData, url: e.target.value })
                  }
                  placeholder="https://..."
                />
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
                  {editingLogin ? "Save Changes" : "Add Login"}
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

      {/* Logins Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredLogins.map((login, index) => (
          <motion.div
            key={login.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-accent-violet" />
                    <CardTitle className="text-base">{login.service}</CardTitle>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleOpenEdit(login)}
                    >
                      <Pencil className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(login.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                {login.category && (
                  <Badge variant="secondary" className="w-fit text-xs">
                    {login.category}
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Username */}
                <div className="flex items-center gap-2">
                  <User className="w-3 h-3 text-muted-foreground" />
                  <code className="flex-1 text-xs bg-surface-1 p-2 rounded font-mono truncate">
                    {login.username_encrypted}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() =>
                      copyToClipboard(`${login.id}-user`, login.username_encrypted)
                    }
                  >
                    {copiedField === `${login.id}-user` ? (
                      <Check className="w-3 h-3 text-entropy-ordered" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </Button>
                </div>

                {/* Password */}
                <div className="flex items-center gap-2">
                  <Lock className="w-3 h-3 text-muted-foreground" />
                  <code className="flex-1 text-xs bg-surface-1 p-2 rounded font-mono">
                    {visiblePasswords.has(login.id)
                      ? login.password_encrypted
                      : "••••••••••••"}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => togglePasswordVisibility(login.id)}
                  >
                    {visiblePasswords.has(login.id) ? (
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
                      copyToClipboard(`${login.id}-pass`, login.password_encrypted)
                    }
                  >
                    {copiedField === `${login.id}-pass` ? (
                      <Check className="w-3 h-3 text-entropy-ordered" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </Button>
                </div>

                {/* URL */}
                {login.url && (
                  <a
                    href={login.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent-blue hover:underline flex items-center gap-1 text-sm"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Open site
                  </a>
                )}

                {login.notes && (
                  <p className="text-xs text-muted-foreground">{login.notes}</p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {filteredLogins.length === 0 && (
        <div className="text-center py-12">
          <Lock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">
            {filterCategory === "all"
              ? "No logins stored yet"
              : `No logins in "${filterCategory}"`}
          </p>
          {filterCategory === "all" && (
            <Button onClick={handleOpenCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Add your first login
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
