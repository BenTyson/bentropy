import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Integration,
  IntegrationSnapshot,
  Project,
} from "../../../src/lib/db/types.js";

export const listIntegrationsDefinition = {
  name: "list_integrations",
  description:
    "List every integration on a single project (by slug) together with its most recent snapshot and live sync state (sync_status, last_synced_at, sync_error). Use to answer 'is Finch's Vercel deploy healthy right now?'",
  inputSchema: {
    type: "object",
    properties: {
      project: {
        type: "string",
        description: "The project slug (e.g. 'finch', 'saltgoat').",
      },
    },
    required: ["project"],
    additionalProperties: false,
  },
} as const;

export interface ListIntegrationsArgs {
  project?: unknown;
}

function assertArgs(args: ListIntegrationsArgs): { project: string } {
  if (typeof args.project !== "string" || args.project.trim() === "") {
    throw new Error("list_integrations: `project` must be a non-empty string");
  }
  return { project: args.project.trim() };
}

export async function runListIntegrations(
  supabase: SupabaseClient,
  rawArgs: ListIntegrationsArgs,
) {
  const { project: slug } = assertArgs(rawArgs);

  const { data: projectData, error: projectErr } = await supabase
    .from("projects")
    .select("id, slug, name")
    .eq("slug", slug)
    .single();

  if (projectErr || !projectData) {
    throw new Error(
      `list_integrations: project with slug '${slug}' not found`,
    );
  }
  const project = projectData as Pick<Project, "id" | "slug" | "name">;

  const { data: integrations, error: integrationsErr } = await supabase
    .from("integrations")
    .select("*")
    .eq("project_id", project.id)
    .order("type", { ascending: true });

  if (integrationsErr) {
    throw new Error(`list_integrations: ${integrationsErr.message}`);
  }

  const rows = (integrations ?? []) as Integration[];

  const withSnapshots = await Promise.all(
    rows.map(async (integration) => {
      const { data: snap } = await supabase
        .from("integration_snapshots")
        .select("*")
        .eq("integration_id", integration.id)
        .order("fetched_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      return {
        id: integration.id,
        type: integration.type,
        display_name: integration.display_name,
        config: integration.config,
        sync_status: integration.sync_status,
        last_synced_at: integration.last_synced_at,
        sync_error: integration.sync_error,
        latest_snapshot: (snap ?? null) as IntegrationSnapshot | null,
      };
    }),
  );

  return {
    project: { slug: project.slug, name: project.name },
    integrations: withSnapshots,
  };
}
