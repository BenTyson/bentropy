import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Credential,
  Integration,
  IntegrationSnapshot,
  LocalService,
  Note,
  Project,
  Repository,
} from "../../../src/lib/db/types.js";

export const getProjectDefinition = {
  name: "get_project",
  description:
    "Full rollup for a single project by slug: project row, credentials (names + masked values — NEVER plaintext; use get_credential for that), repositories, local services, notes, and integrations each paired with their most recent integration_snapshots row.",
  inputSchema: {
    type: "object",
    properties: {
      slug: {
        type: "string",
        description: "The project slug (e.g. 'finch', 'saltgoat').",
      },
    },
    required: ["slug"],
    additionalProperties: false,
  },
} as const;

type MaskedCredential = Omit<Credential, "key_encrypted"> & {
  key_masked: string;
};

function maskCredential(credential: Credential): MaskedCredential {
  const { key_encrypted: _keyEncrypted, ...rest } = credential;
  return {
    ...rest,
    key_masked: "••••••••",
  };
}

export interface GetProjectArgs {
  slug?: unknown;
}

function assertArgs(args: GetProjectArgs): { slug: string } {
  if (typeof args.slug !== "string" || args.slug.trim() === "") {
    throw new Error("get_project: `slug` must be a non-empty string");
  }
  return { slug: args.slug.trim() };
}

export async function runGetProject(
  supabase: SupabaseClient,
  rawArgs: GetProjectArgs,
) {
  const { slug } = assertArgs(rawArgs);

  const { data: projectData, error: projectErr } = await supabase
    .from("projects")
    .select("*")
    .eq("slug", slug)
    .single();

  if (projectErr || !projectData) {
    throw new Error(`get_project: project with slug '${slug}' not found`);
  }
  const project = projectData as Project;

  const [credentials, repositories, localServices, notes, integrations] =
    await Promise.all([
      supabase
        .from("credentials")
        .select("*")
        .eq("project_id", project.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("repositories")
        .select("*")
        .eq("project_id", project.id)
        .order("name", { ascending: true }),
      supabase
        .from("local_services")
        .select("*")
        .eq("project_id", project.id)
        .order("port", { ascending: true }),
      supabase
        .from("notes")
        .select("*")
        .eq("project_id", project.id)
        .order("pinned", { ascending: false })
        .order("updated_at", { ascending: false }),
      supabase
        .from("integrations")
        .select("*")
        .eq("project_id", project.id)
        .order("type", { ascending: true }),
    ]);

  if (credentials.error)
    throw new Error(`get_project credentials: ${credentials.error.message}`);
  if (repositories.error)
    throw new Error(`get_project repositories: ${repositories.error.message}`);
  if (localServices.error)
    throw new Error(`get_project local_services: ${localServices.error.message}`);
  if (notes.error) throw new Error(`get_project notes: ${notes.error.message}`);
  if (integrations.error)
    throw new Error(`get_project integrations: ${integrations.error.message}`);

  const integrationRows = (integrations.data ?? []) as Integration[];

  const integrationsWithSnapshot = await Promise.all(
    integrationRows.map(async (integration) => {
      const { data: snap } = await supabase
        .from("integration_snapshots")
        .select("*")
        .eq("integration_id", integration.id)
        .order("fetched_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      return {
        ...integration,
        latest_snapshot: (snap ?? null) as IntegrationSnapshot | null,
      };
    }),
  );

  return {
    project,
    credentials: ((credentials.data ?? []) as Credential[]).map(maskCredential),
    repositories: (repositories.data ?? []) as Repository[],
    local_services: (localServices.data ?? []) as LocalService[],
    notes: (notes.data ?? []) as Note[],
    integrations: integrationsWithSnapshot,
  };
}
