"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createIntegration, type IntegrationInput } from "@/lib/db/actions";
import type { IntegrationType } from "@/lib/db/types";

const typeOptions: { value: IntegrationType; label: string }[] = [
  { value: "vercel", label: "Vercel" },
  { value: "github", label: "GitHub" },
  { value: "supabase", label: "Supabase" },
  { value: "stripe", label: "Stripe" },
  { value: "railway", label: "Railway" },
  { value: "dns", label: "DNS" },
  { value: "analytics", label: "Analytics" },
  { value: "local", label: "Local" },
];

type FormState = {
  display_name: string;
  // vercel
  vercel_project_id: string;
  team_id: string;
  // github
  owner: string;
  repo: string;
  // supabase
  project_ref: string;
  // stripe
  account_id: string;
  // railway
  service_id: string;
  environment_id: string;
  // dns / analytics
  provider: string;
  zone_id: string;
  property_id: string;
  // local
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
  service_id: "",
  environment_id: "",
  provider: "",
  zone_id: "",
  property_id: "",
  port: "",
  start_command: "",
};

function buildInput(
  projectId: string,
  type: IntegrationType,
  form: FormState,
): IntegrationInput {
  const display_name = form.display_name.trim() || null;
  switch (type) {
    case "vercel":
      return {
        project_id: projectId,
        type,
        display_name,
        config: {
          vercel_project_id: form.vercel_project_id.trim(),
          team_id: form.team_id.trim() || null,
        },
      };
    case "github":
      return {
        project_id: projectId,
        type,
        display_name,
        config: { owner: form.owner.trim(), repo: form.repo.trim() },
      };
    case "supabase":
      return {
        project_id: projectId,
        type,
        display_name,
        config: { project_ref: form.project_ref.trim() },
      };
    case "stripe":
      return {
        project_id: projectId,
        type,
        display_name,
        config: { account_id: form.account_id.trim() },
      };
    case "railway":
      return {
        project_id: projectId,
        type,
        display_name,
        config: {
          service_id: form.service_id.trim(),
          environment_id: form.environment_id.trim(),
        },
      };
    case "dns":
      return {
        project_id: projectId,
        type,
        display_name,
        config: { provider: form.provider.trim(), zone_id: form.zone_id.trim() },
      };
    case "analytics":
      return {
        project_id: projectId,
        type,
        display_name,
        config: {
          provider: form.provider.trim(),
          property_id: form.property_id.trim(),
        },
      };
    case "local": {
      const port = parseInt(form.port, 10);
      if (!Number.isFinite(port)) throw new Error("Port must be a number");
      return {
        project_id: projectId,
        type,
        display_name,
        config: { port, start_command: form.start_command.trim() || null },
      };
    }
  }
}

function validate(type: IntegrationType, form: FormState): string | null {
  switch (type) {
    case "vercel":
      return form.vercel_project_id.trim() ? null : "Vercel project ID is required";
    case "github":
      return form.owner.trim() && form.repo.trim()
        ? null
        : "Owner and repo are required";
    case "supabase":
      return form.project_ref.trim() ? null : "Project ref is required";
    case "stripe":
      return form.account_id.trim() ? null : "Account ID is required";
    case "railway":
      return form.service_id.trim() && form.environment_id.trim()
        ? null
        : "Service ID and environment ID are required";
    case "dns":
      return form.provider.trim() && form.zone_id.trim()
        ? null
        : "Provider and zone ID are required";
    case "analytics":
      return form.provider.trim() && form.property_id.trim()
        ? null
        : "Provider and property ID are required";
    case "local":
      return form.port.trim() ? null : "Port is required";
  }
}

export function NewIntegrationForm({
  projectId,
  projectSlug,
}: {
  projectId: string;
  projectSlug: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [type, setType] = useState<IntegrationType>("vercel");
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function save() {
    setError(null);
    const validationError = validate(type, form);
    if (validationError) {
      setError(validationError);
      return;
    }
    let input: IntegrationInput;
    try {
      input = buildInput(projectId, type, form);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid input");
      return;
    }
    startTransition(async () => {
      try {
        await createIntegration(input);
        router.push(`/admin/projects/${projectSlug}`);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Save failed");
      }
    });
  }

  return (
    <div className="space-y-4">
      <Field label="Type">
        <Select value={type} onValueChange={(v) => setType(v as IntegrationType)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {typeOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

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
              placeholder="ben"
            />
          </Field>
          <Field label="Repo">
            <Input
              value={form.repo}
              onChange={(e) => update("repo", e.target.value)}
              placeholder="finch"
            />
          </Field>
        </div>
      )}

      {type === "supabase" && (
        <Field label="Project ref">
          <Input
            value={form.project_ref}
            onChange={(e) => update("project_ref", e.target.value)}
            placeholder="abcdefghijklmnop"
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
              placeholder="plausible"
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
              placeholder="3000"
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
        <Button
          variant="outline"
          onClick={() => router.push(`/admin/projects/${projectSlug}`)}
        >
          Cancel
        </Button>
        <Button onClick={save} disabled={pending}>
          {pending ? "Saving..." : "Create integration"}
        </Button>
      </div>
    </div>
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
