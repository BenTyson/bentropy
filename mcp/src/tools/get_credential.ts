import type { SupabaseClient } from "@supabase/supabase-js";
import type { Credential, Project } from "../../../src/lib/db/types.js";
import { decrypt, isEncryptedPayload } from "../../../src/lib/crypto.js";

export const getCredentialDefinition = {
  name: "get_credential",
  description:
    "Decrypt and return the plaintext value of a single credential on a project. This is the only MCP tool that returns plaintext — only call it when the caller genuinely needs the raw value (e.g. to run a CLI). Never log the returned value.",
  inputSchema: {
    type: "object",
    properties: {
      project: {
        type: "string",
        description: "The project slug (e.g. 'finch').",
      },
      name: {
        type: "string",
        description:
          "The credential's `name` field (e.g. 'Vercel PAT'). Case-sensitive exact match.",
      },
    },
    required: ["project", "name"],
    additionalProperties: false,
  },
} as const;

export interface GetCredentialArgs {
  project?: unknown;
  name?: unknown;
}

function assertArgs(args: GetCredentialArgs): {
  project: string;
  name: string;
} {
  if (typeof args.project !== "string" || args.project.trim() === "") {
    throw new Error("get_credential: `project` must be a non-empty string");
  }
  if (typeof args.name !== "string" || args.name.trim() === "") {
    throw new Error("get_credential: `name` must be a non-empty string");
  }
  return { project: args.project.trim(), name: args.name.trim() };
}

export async function runGetCredential(
  supabase: SupabaseClient,
  rawArgs: GetCredentialArgs,
) {
  const { project: slug, name } = assertArgs(rawArgs);

  const { data: projectData, error: projectErr } = await supabase
    .from("projects")
    .select("id, slug")
    .eq("slug", slug)
    .single();

  if (projectErr || !projectData) {
    throw new Error(`get_credential: project with slug '${slug}' not found`);
  }
  const project = projectData as Pick<Project, "id" | "slug">;

  const { data: credData, error: credErr } = await supabase
    .from("credentials")
    .select("*")
    .eq("project_id", project.id)
    .eq("name", name)
    .maybeSingle();

  if (credErr) throw new Error(`get_credential: ${credErr.message}`);
  if (!credData) {
    throw new Error(
      `get_credential: no credential named '${name}' on project '${slug}'`,
    );
  }
  const credential = credData as Credential;

  if (!isEncryptedPayload(credential.key_encrypted)) {
    throw new Error(
      `get_credential: '${name}' is not a valid encrypted payload (likely a PLACEHOLDER_ left from seeding). Replace it via /admin/credentials.`,
    );
  }

  // Wrap decrypt so plaintext never reaches error strings.
  let plaintext: string;
  try {
    plaintext = decrypt(credential.key_encrypted);
  } catch {
    throw new Error(
      "get_credential: decrypt failed. Check ENCRYPTION_KEY matches the key used to encrypt this credential.",
    );
  }

  return {
    name: credential.name,
    service: credential.service,
    value: plaintext,
    expires_at: credential.expires_at,
  };
}
