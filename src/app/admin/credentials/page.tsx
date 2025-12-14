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
import type { Credential } from "@/lib/supabase/types";

// Placeholder data
const initialCredentials: (Credential & { project_name?: string })[] = [
  {
    id: "1",
    name: "Vercel API Token",
    service: "Vercel",
    key_encrypted: "vcel_xxxxxxxxxxxxxxxxxxxx",
    project_id: "1",
    project_name: "QR Forge",
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
    notes: "Production deployment token",
    created_at: new Date().toISOString(),
  },
  {
    id: "2",
    name: "OpenAI API Key",
    service: "OpenAI",
    key_encrypted: "sk-xxxxxxxxxxxxxxxxxxxx",
    project_id: "2",
    project_name: "Scribe",
    expires_at: null,
    notes: "GPT-4 access",
    created_at: new Date().toISOString(),
  },
  {
    id: "3",
    name: "Supabase Anon Key",
    service: "Supabase",
    key_encrypted: "eyJhbGciOiJIUzI1NiIsInR...",
    project_id: null,
    project_name: undefined,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days - expiring soon!
    notes: "Bentropy project",
    created_at: new Date().toISOString(),
  },
];

interface CredentialFormData {
  name: string;
  service: string;
  key: string;
  project_id: string;
  expires_at: string;
  notes: string;
}

const emptyForm: CredentialFormData = {
  name: "",
  service: "",
  key: "",
  project_id: "",
  expires_at: "",
  notes: "",
};

export default function CredentialsPage() {
  const [credentials, setCredentials] = useState(initialCredentials);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCredential, setEditingCredential] = useState<Credential | null>(null);
  const [formData, setFormData] = useState<CredentialFormData>(emptyForm);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleOpenCreate = () => {
    setEditingCredential(null);
    setFormData(emptyForm);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (credential: Credential) => {
    setEditingCredential(credential);
    setFormData({
      name: credential.name,
      service: credential.service,
      key: credential.key_encrypted,
      project_id: credential.project_id || "",
      expires_at: credential.expires_at
        ? new Date(credential.expires_at).toISOString().split("T")[0]
        : "",
      notes: credential.notes || "",
    });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (editingCredential) {
      setCredentials((prev) =>
        prev.map((c) =>
          c.id === editingCredential.id
            ? {
                ...c,
                name: formData.name,
                service: formData.service,
                key_encrypted: formData.key,
                project_id: formData.project_id || null,
                expires_at: formData.expires_at
                  ? new Date(formData.expires_at).toISOString()
                  : null,
                notes: formData.notes,
              }
            : c
        )
      );
    } else {
      const newCredential: Credential & { project_name?: string } = {
        id: crypto.randomUUID(),
        name: formData.name,
        service: formData.service,
        key_encrypted: formData.key,
        project_id: formData.project_id || null,
        expires_at: formData.expires_at
          ? new Date(formData.expires_at).toISOString()
          : null,
        notes: formData.notes,
        created_at: new Date().toISOString(),
      };
      setCredentials((prev) => [...prev, newCredential]);
    }

    setIsDialogOpen(false);
    setFormData(emptyForm);
    setEditingCredential(null);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this credential?")) {
      setCredentials((prev) => prev.filter((c) => c.id !== id));
    }
  };

  const toggleVisibility = (id: string) => {
    setVisibleKeys((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const copyToClipboard = async (id: string, key: string) => {
    await navigator.clipboard.writeText(key);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const isExpiringSoon = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    const daysUntilExpiry =
      (new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return daysUntilExpiry <= 14;
  };

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt).getTime() < Date.now();
  };

  const expiringCount = credentials.filter(
    (c) => isExpiringSoon(c.expires_at) && !isExpired(c.expires_at)
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl font-bold">Credentials Vault</h1>
          <p className="text-muted-foreground">
            Securely store and manage API keys and secrets
          </p>
        </motion.div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Add Credential
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingCredential ? "Edit Credential" : "Add Credential"}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Name</label>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Vercel API Token"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Service</label>
                  <Input
                    value={formData.service}
                    onChange={(e) =>
                      setFormData({ ...formData, service: e.target.value })
                    }
                    placeholder="Vercel"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">API Key / Secret</label>
                <Input
                  type="password"
                  value={formData.key}
                  onChange={(e) =>
                    setFormData({ ...formData, key: e.target.value })
                  }
                  placeholder="sk-xxxx..."
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
                  <label className="text-sm font-medium">Expires</label>
                  <Input
                    type="date"
                    value={formData.expires_at}
                    onChange={(e) =>
                      setFormData({ ...formData, expires_at: e.target.value })
                    }
                  />
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
                  {editingCredential ? "Save Changes" : "Add Credential"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Expiring Alert */}
      {expiringCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-lg bg-entropy-drifting/10 border border-entropy-drifting/30 flex items-center gap-3"
        >
          <AlertTriangle className="w-5 h-5 text-entropy-drifting" />
          <span className="text-sm">
            <strong>{expiringCount} credential{expiringCount > 1 ? "s" : ""}</strong> expiring
            within 14 days
          </span>
        </motion.div>
      )}

      {/* Credentials Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {credentials.map((credential, index) => (
          <motion.div
            key={credential.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card
              className={`${
                isExpired(credential.expires_at)
                  ? "border-entropy-chaos/50"
                  : isExpiringSoon(credential.expires_at)
                  ? "border-entropy-drifting/50"
                  : ""
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-accent-violet" />
                    <CardTitle className="text-base">{credential.name}</CardTitle>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleOpenEdit(credential)}
                    >
                      <Pencil className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(credential.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <Badge variant="secondary" className="w-fit text-xs">
                  {credential.service}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Key display */}
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-surface-1 p-2 rounded font-mono truncate">
                    {visibleKeys.has(credential.id)
                      ? credential.key_encrypted
                      : "••••••••••••••••"}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => toggleVisibility(credential.id)}
                  >
                    {visibleKeys.has(credential.id) ? (
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
                      copyToClipboard(credential.id, credential.key_encrypted)
                    }
                  >
                    {copiedId === credential.id ? (
                      <Check className="w-3 h-3 text-entropy-ordered" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </Button>
                </div>

                {/* Meta info */}
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {credential.project_name && (
                    <span className="flex items-center gap-1">
                      Project: {credential.project_name}
                    </span>
                  )}
                  {credential.expires_at && (
                    <span
                      className={`flex items-center gap-1 ${
                        isExpired(credential.expires_at)
                          ? "text-entropy-chaos"
                          : isExpiringSoon(credential.expires_at)
                          ? "text-entropy-drifting"
                          : ""
                      }`}
                    >
                      <Clock className="w-3 h-3" />
                      {isExpired(credential.expires_at)
                        ? "Expired"
                        : `Expires ${new Date(credential.expires_at).toLocaleDateString()}`}
                    </span>
                  )}
                </div>

                {credential.notes && (
                  <p className="text-xs text-muted-foreground">
                    {credential.notes}
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {credentials.length === 0 && (
        <div className="text-center py-12">
          <Key className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">No credentials stored yet</p>
          <Button onClick={handleOpenCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Add your first credential
          </Button>
        </div>
      )}
    </div>
  );
}
