"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Pencil, Trash2 } from "lucide-react";
import {
  deleteIntegration,
  updateIntegration,
  type IntegrationUpdateInput,
} from "@/lib/db/actions";
import type {
  Integration,
  IntegrationType,
  IntegrationConfigFor,
} from "@/lib/db/types";

type FormState = {
  display_name: string;
  vercel_project_id: string;
  team_id: string;
  owner: string;
  repo: string;
  project_ref: string;
  account_id: string;
  railway_project_id: string;
  service_id: string;
  environment_id: string;
  provider: string;
  zone_id: string;
  property_id: string;
  port: string;
  start_command: string;
};

const emptyForm: FormState = {
  display_name: "",
  vercel_project_id: "",
  team_id: "",
  owner: "",
  repo: "",
  project_ref: "",
  account_id: "",
  railway_project_id: "",
  service_id: "",
  environment_id: "",
  provider: "",
  zone_id: "",
  property_id: "",
  port: "",
  start_command: "",
};

function configToForm(integration: Integration): FormState {
  const base: FormState = {
    ...emptyForm,
    display_name: integration.display_name ?? "",
  };
  switch (integration.type) {
    case "vercel":
      return {
        ...base,
        vercel_project_id: integration.config.vercel_project_id,
        team_id: integration.config.team_id ?? "",
      };
    case "github":
      return {
        ...base,
        owner: integration.config.owner,
        repo: integration.config.repo,
      };
    case "supabase":
      return { ...base, project_ref: integration.config.project_ref };
    case "stripe":
      return { ...base, account_id: integration.config.account_id };
    case "railway":
      return {
        ...base,
        railway_project_id: integration.config.project_id,
        service_id: integration.config.service_id,
        environment_id: integration.config.environment_id,
      };
    case "dns":
      return {
        ...base,
        provider: integration.config.provider,
        zone_id: integration.config.zone_id,
      };
    case "analytics":
      return {
        ...base,
        provider: integration.config.provider,
        property_id: integration.config.property_id,
      };
    case "local":
      return {
        ...base,
        port: String(integration.config.port),
        start_command: integration.config.start_command ?? "",
      };
  }
}

function buildConfig(
  type: IntegrationType,
  form: FormState,
): IntegrationConfigFor<IntegrationType> {
  switch (type) {
    case "vercel":
      return {
        vercel_project_id: form.vercel_project_id.trim(),
        team_id: form.team_id.trim() || null,
      };
    case "github":
      return { owner: form.owner.trim(), repo: form.repo.trim() };
    case "supabase":
      return { project_ref: form.project_ref.trim() };
    case "stripe":
      return { account_id: form.account_id.trim() };
    case "railway":
      return {
        project_id: form.railway_project_id.trim(),
        service_id: form.service_id.trim(),
        environment_id: form.environment_id.trim(),
      };
    case "dns":
      return { provider: form.provider.trim(), zone_id: form.zone_id.trim() };
    case "analytics":
      return {
        provider: form.provider.trim(),
        property_id: form.property_id.trim(),
      };
    case "local": {
      const port = parseInt(form.port, 10);
      if (!Number.isFinite(port)) throw new Error("Port must be a number");
      return { port, start_command: form.start_command.trim() || null };
    }
  }
}

function validate(type: IntegrationType, form: FormState): string | null {
  switch (type) {
    case "vercel":
      return form.vercel_project_id.trim() ? null : "Vercel project ID is required";
    case "github":
      return form.owner.trim() && form.repo.trim() ? null : "Owner and repo are required";
    case "supabase":
      return form.project_ref.trim() ? null : "Project ref is required";
    case "stripe":
      return form.account_id.trim() ? null : "Account ID is required";
    case "railway":
      return form.railway_project_id.trim() && form.service_id.trim() && form.environment_id.trim()
        ? null
        : "Project ID, service ID, and environment ID are required";
    case "dns":
      return form.provider.trim() && form.zone_id.trim() ? null : "Provider and zone ID are required";
    case "analytics":
      return form.provider.trim() && form.property_id.trim() ? null : "Provider and property ID are required";
    case "local":
      return form.port.trim() ? null : "Port is required";
  }
}

export function IntegrationEditButton({
  integration,
  projectSlug,
}: {
  integration: Integration;
  projectSlug?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function openEdit() {
    setForm(configToForm(integration));
    setError(null);
    setIsOpen(true);
  }

  function save() {
    setError(null);
    const validationError = validate(integration.type, form);
    if (validationError) {
      setError(validationError);
      return;
    }
    let config: IntegrationConfigFor<IntegrationType>;
    try {
      config = buildConfig(integration.type, form);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid input");
      return;
    }
    const input: IntegrationUpdateInput = {
      display_name: form.display_name.trim() || null,
      config,
    };
    startTransition(async () => {
      try {
        await updateIntegration(integration.id, input, projectSlug);
        setIsOpen(false);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Save failed");
      }
    });
  }

  function remove() {
    if (!confirm("Delete this integration?")) return;
    startTransition(async () => {
      try {
        await deleteIntegration(integration.id, projectSlug);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Delete failed");
      }
    });
  }

  const type = integration.type;

  return (
    <>
      <div className="flex gap-0.5">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={openEdit}
          disabled={pending}
        >
          <Pencil className="w-3 h-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-destructive hover:text-destructive"
          onClick={remove}
          disabled={pending}
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit {type.charAt(0).toUpperCase() + type.slice(1)} Integration</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Field label="Display name (optional)">
              <Input
                value={form.display_name}
                onChange={(e) => update("display_name", e.target.value)}
                placeholder="e.g. Production"
              />
            </Field>

            {type === "vercel" && (
              <>
                <Field label="Vercel project ID">
                  <Input
                    value={form.vercel_project_id}
                    onChange={(e) => update("vercel_project_id", e.target.value)}
                    placeholder="prj_..."
                  />
                </Field>
                <Field label="Team ID (optional)">
                  <Input
                    value={form.team_id}
                    onChange={(e) => update("team_id", e.target.value)}
                    placeholder="team_..."
                  />
                </Field>
              </>
            )}

            {type === "github" && (
              <div className="grid grid-cols-2 gap-4">
                <Field label="Owner">
                  <Input
                    value={form.owner}
                    onChange={(e) => update("owner", e.target.value)}
                  />
                </Field>
                <Field label="Repo">
                  <Input
                    value={form.repo}
                    onChange={(e) => update("repo", e.target.value)}
                  />
                </Field>
              </div>
            )}

            {type === "supabase" && (
              <Field label="Project ref">
                <Input
                  value={form.project_ref}
                  onChange={(e) => update("project_ref", e.target.value)}
                />
              </Field>
            )}

            {type === "stripe" && (
              <Field label="Account ID">
                <Input
                  value={form.account_id}
                  onChange={(e) => update("account_id", e.target.value)}
                  placeholder="acct_..."
                />
              </Field>
            )}

            {type === "railway" && (
              <>
                <Field label="Railway project ID">
                  <Input
                    value={form.railway_project_id}
                    onChange={(e) => update("railway_project_id", e.target.value)}
                  />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Service ID">
                    <Input
                      value={form.service_id}
                      onChange={(e) => update("service_id", e.target.value)}
                    />
                  </Field>
                  <Field label="Environment ID">
                    <Input
                      value={form.environment_id}
                      onChange={(e) => update("environment_id", e.target.value)}
                    />
                  </Field>
                </div>
              </>
            )}

            {type === "dns" && (
              <div className="grid grid-cols-2 gap-4">
                <Field label="Provider">
                  <Input
                    value={form.provider}
                    onChange={(e) => update("provider", e.target.value)}
                    placeholder="cloudflare"
                  />
                </Field>
                <Field label="Zone ID">
                  <Input
                    value={form.zone_id}
                    onChange={(e) => update("zone_id", e.target.value)}
                  />
                </Field>
              </div>
            )}

            {type === "analytics" && (
              <div className="grid grid-cols-2 gap-4">
                <Field label="Provider">
                  <Input
                    value={form.provider}
                    onChange={(e) => update("provider", e.target.value)}
                    placeholder="umami"
                  />
                </Field>
                <Field label="Property ID">
                  <Input
                    value={form.property_id}
                    onChange={(e) => update("property_id", e.target.value)}
                  />
                </Field>
              </div>
            )}

            {type === "local" && (
              <div className="grid grid-cols-2 gap-4">
                <Field label="Port">
                  <Input
                    type="number"
                    value={form.port}
                    onChange={(e) => update("port", e.target.value)}
                  />
                </Field>
                <Field label="Start command (optional)">
                  <Input
                    value={form.start_command}
                    onChange={(e) => update("start_command", e.target.value)}
                    placeholder="npm run dev"
                  />
                </Field>
              </div>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button onClick={save} disabled={pending}>
                {pending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}
