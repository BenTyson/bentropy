import type { SupabaseClient } from "@supabase/supabase-js";
import type { Project } from "../../../src/lib/db/types.js";

export const listProjectsDefinition = {
  name: "list_projects",
  description:
    "List every project registered in the Bentropy hub. Returns slug, name, status, primary domain, and tagline for each — the compact rollup used to pick a project before drilling in with get_project.",
  inputSchema: {
    type: "object",
    properties: {},
    additionalProperties: false,
  },
} as const;

export async function runListProjects(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("projects")
    .select("slug, name, status, primary_domain, tagline")
    .order("display_order", { ascending: true });

  if (error) throw new Error(`list_projects: ${error.message}`);

  const rows = (data ?? []) as Pick<
    Project,
    "slug" | "name" | "status" | "primary_domain" | "tagline"
  >[];

  return rows;
}
