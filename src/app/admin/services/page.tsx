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
import type { LocalService } from "@/lib/supabase/types";

// Placeholder data
const initialServices: (LocalService & { project_name?: string })[] = [
  {
    id: "1",
    name: "Bentropy Dev",
    port: 3344,
    project_id: null,
    project_name: undefined,
    start_command: "npm run dev -- -p 3344",
    notes: "This project",
    is_active: true,
  },
  {
    id: "2",
    name: "QR Forge Dev",
    port: 3000,
    project_id: "1",
    project_name: "QR Forge",
    start_command: "npm run dev",
    notes: null,
    is_active: false,
  },
  {
    id: "3",
    name: "Scribe API",
    port: 8000,
    project_id: "2",
    project_name: "Scribe",
    start_command: "python -m uvicorn main:app --reload --port 8000",
    notes: "FastAPI backend",
    is_active: false,
  },
  {
    id: "4",
    name: "Postgres",
    port: 5432,
    project_id: null,
    project_name: undefined,
    start_command: "brew services start postgresql",
    notes: "Local database",
    is_active: true,
  },
];

interface ServiceFormData {
  name: string;
  port: string;
  project_id: string;
  start_command: string;
  notes: string;
}

const emptyForm: ServiceFormData = {
  name: "",
  port: "",
  project_id: "",
  start_command: "",
  notes: "",
};

export default function ServicesPage() {
  const [services, setServices] = useState(initialServices);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<LocalService | null>(null);
  const [formData, setFormData] = useState<ServiceFormData>(emptyForm);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleOpenCreate = () => {
    setEditingService(null);
    setFormData(emptyForm);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (service: LocalService) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      port: service.port.toString(),
      project_id: service.project_id || "",
      start_command: service.start_command || "",
      notes: service.notes || "",
    });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (editingService) {
      setServices((prev) =>
        prev.map((s) =>
          s.id === editingService.id
            ? {
                ...s,
                name: formData.name,
                port: parseInt(formData.port),
                project_id: formData.project_id || null,
                start_command: formData.start_command || null,
                notes: formData.notes || null,
              }
            : s
        )
      );
    } else {
      const newService: LocalService & { project_name?: string } = {
        id: crypto.randomUUID(),
        name: formData.name,
        port: parseInt(formData.port),
        project_id: formData.project_id || null,
        start_command: formData.start_command || null,
        notes: formData.notes || null,
        is_active: false,
      };
      setServices((prev) => [...prev, newService]);
    }

    setIsDialogOpen(false);
    setFormData(emptyForm);
    setEditingService(null);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this service?")) {
      setServices((prev) => prev.filter((s) => s.id !== id));
    }
  };

  const toggleActive = (id: string) => {
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, is_active: !s.is_active } : s))
    );
  };

  const copyCommand = async (id: string, command: string) => {
    await navigator.clipboard.writeText(command);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const activeCount = services.filter((s) => s.is_active).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl font-bold">Local Services</h1>
          <p className="text-muted-foreground">
            Track dev servers and local ports
          </p>
        </motion.div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Add Service
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingService ? "Edit Service" : "Add Service"}
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
                    placeholder="My Dev Server"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Port</label>
                  <Input
                    type="number"
                    value={formData.port}
                    onChange={(e) =>
                      setFormData({ ...formData, port: e.target.value })
                    }
                    placeholder="3000"
                  />
                </div>
              </div>

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
                <label className="text-sm font-medium">Start Command</label>
                <Input
                  value={formData.start_command}
                  onChange={(e) =>
                    setFormData({ ...formData, start_command: e.target.value })
                  }
                  placeholder="npm run dev"
                  className="font-mono text-sm"
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
                  {editingService ? "Save Changes" : "Add Service"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Services Banner */}
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
          <strong>{activeCount}</strong> service{activeCount !== 1 ? "s" : ""}{" "}
          running
        </span>
      </motion.div>

      {/* Services Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((service, index) => (
          <motion.div
            key={service.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card
              className={
                service.is_active ? "border-entropy-ordered/50" : ""
              }
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        service.is_active
                          ? "bg-entropy-ordered animate-pulse"
                          : "bg-muted-foreground"
                      }`}
                    />
                    <CardTitle className="text-base">{service.name}</CardTitle>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => toggleActive(service.id)}
                    >
                      {service.is_active ? (
                        <Square className="w-3 h-3" />
                      ) : (
                        <Play className="w-3 h-3" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleOpenEdit(service)}
                    >
                      <Pencil className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(service.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Port and link */}
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="font-mono text-lg px-3 py-1"
                  >
                    :{service.port}
                  </Badge>
                  <a
                    href={`http://localhost:${service.port}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent-blue hover:underline flex items-center gap-1 text-sm"
                  >
                    Open <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {/* Start command */}
                {service.start_command && (
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs bg-surface-1 p-2 rounded font-mono truncate flex items-center gap-2">
                      <Terminal className="w-3 h-3 text-muted-foreground" />
                      {service.start_command}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() =>
                        copyCommand(service.id, service.start_command!)
                      }
                    >
                      {copiedId === service.id ? (
                        <Check className="w-3 h-3 text-entropy-ordered" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                )}

                {/* Meta info */}
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {service.project_name && (
                    <span>Project: {service.project_name}</span>
                  )}
                </div>

                {service.notes && (
                  <p className="text-xs text-muted-foreground">
                    {service.notes}
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {services.length === 0 && (
        <div className="text-center py-12">
          <Server className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">No services tracked yet</p>
          <Button onClick={handleOpenCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Add your first service
          </Button>
        </div>
      )}
    </div>
  );
}
