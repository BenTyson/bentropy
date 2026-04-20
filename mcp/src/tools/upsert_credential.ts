import type { SupabaseClient } from "@supabase/supabase-js";
import type { Credential, Project } from "../../../src/lib/db/types.js";
import { encrypt } from "../../../src/lib/crypto.js";

export const upsertCredentialDefinition = {
  name: "upsert_credential",
  description:
    "Create or update a credential on a project. Dedup key is (project, name) — a second call with the same project + name updates the existing row rather than inserting a duplicate. The value is encrypted before storage; this tool never logs or returns the plaintext. Returns {id, name, service}.",
  inputSchema: {
    type: "object",
    properties: {
      project: {
        type: "string",
        description: "The project slug (e.g. 'finch', 'saltgoat').",
      },
      name: {
        type: "string",
        description: "Credential label (e.g. 'Vercel PAT', 'GitHub PAT').",
      },
      value: {
        type: "string",
        description: "Plaintext secret value. Will be encrypted before storage.",
      },
      service: {
        type: "string",
        description:
          "Service this credential belongs to (e.g. 'vercel', 'github', 'stripe'). Used for integration credential resolution.",
      },
      expires_at: {
        type: ["string", "null"],
        description: "ISO 8601 expiry timestamp, or null.",
      },
    },
    required: ["project", "name", "value", "service"],
    additionalProperties: false,
  },
} as const;

export interface UpsertCredentialArgs {
  project?: unknown;
  name?: unknown;
  value?: unknown;
  service?: unknown;
  expires_at?: unknown;
}

function assertArgs(args: UpsertCredentialArgs): {
  project: string;
  name: string;
  value: string;
  service: string;
  expires_at: string | null;
} {
  if (typeof args.project !== "string" || args.project.trim() === "") {
    throw new Error("upsert_credential: `project` must be a non-empty string");
  }
  if (typeof args.name !== "string" || args.name.trim() === "") {
    throw new Error("upsert_credential: `name` must be a non-empty string");
  }
  if (typeof args.value !== "string" || args.value.trim() === "") {
    throw new Error("upsert_credential: `value` must be a non-empty string");
  }
  if (typeof args.service !== "string" || args.service.trim() === "") {
    throw new Error("upsert_credential: `service` must be a non-empty string");
  }
  const expires_at =
    args.expires_at === null || args.expires_at === undefined
      ? null
      : typeof args.expires_at === "string"
        ? args.expires_at
        : null;
  return {
    project: args.project.trim(),
    name: args.name.trim(),
    value: args.value,
    service: args.service.trim(),
    expires_at,
  };
}

export async function runUpsertCredential(
  supabase: SupabaseClient,
  rawArgs: UpsertCredentialArgs,
) {
  const { project: slug, name, value, service, expires_at } = assertArgs(rawArgs);

  const { data: projectData, error: projectErr } = await supabase
    .from("projects")
    .select("id, slug")
    .eq("slug", slug)
    .single();

  if (projectErr || !projectData) {
    throw new Error(`upsert_credential: project with slug '${slug}' not found`);
  }
  const project = projectData as Pick<Project, "id" | "slug">;

  // Encrypt before any DB operation. If this throws, nothing is written.
  const key_encrypted = encrypt(value);

  // Check for existing row by (project_id, name) — update-by-match to avoid
  // relying on the partial unique index being present on older DB instances.
  const { data: existing, error: lookupErr } = await supabase
    .from("credentials")
    .select("id")
    .eq("project_id", project.id)
    .eq("name", name)
    .maybeSingle();

  if (lookupErr) {
    throw new Error(`upsert_credential: lookup failed — ${lookupErr.message}`);
  }

  if (existing) {
    const { data, error } = await supabase
      .from("credentials")
      .update({ key_encrypted, service, expires_at })
      .eq("id", (existing as Pick<Credential, "id">).id)
      .select("id, name, service")
      .single();

    if (error || !data) {
      throw new Error(
        `upsert_credential: update failed — ${error?.message ?? "no data returned"}`,
      );
    }
    return { ...(data as Pick<Credential, "id" | "name" | "service">), updated: true };
  }

  const { data, error } = await supabase
    .from("credentials")
    .insert({ project_id: project.id, name, service, key_encrypted, expires_at })
    .select("id, name, service")
    .single();

  if (error || !data) {
    throw new Error(
      `upsert_credential: insert failed — ${error?.message ?? "no data returned"}`,
    );
  }
  return { ...(data as Pick<Credential, "id" | "name" | "service">), updated: false };
}
