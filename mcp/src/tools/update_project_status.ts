import type { SupabaseClient } from "@supabase/supabase-js";
import type { Project, ProjectStatus } from "../../../src/lib/db/types.js";

const VALID_STATUSES: ProjectStatus[] = ["active", "shipped", "concept"];

export const updateProjectStatusDefinition = {
  name: "update_project_status",
  description:
    "Update the status of a project. Valid statuses: 'active', 'shipped', 'concept'. The updated_at timestamp is bumped automatically by a DB trigger.",
  inputSchema: {
    type: "object",
    properties: {
      slug: {
        type: "string",
        description: "The project slug (e.g. 'finch', 'saltgoat').",
      },
      status: {
        type: "string",
        enum: ["active", "shipped", "concept"],
        description: "New status for the project.",
      },
    },
    required: ["slug", "status"],
    additionalProperties: false,
  },
} as const;

export interface UpdateProjectStatusArgs {
  slug?: unknown;
  status?: unknown;
}

function assertArgs(args: UpdateProjectStatusArgs): {
  slug: string;
  status: ProjectStatus;
} {
  if (typeof args.slug !== "string" || args.slug.trim() === "") {
    throw new Error("update_project_status: `slug` must be a non-empty string");
  }
  if (
    typeof args.status !== "string" ||
    !(VALID_STATUSES as string[]).includes(args.status)
  ) {
    throw new Error(
      `update_project_status: \`status\` must be one of ${VALID_STATUSES.join(", ")}`,
    );
  }
  return { slug: args.slug.trim(), status: args.status as ProjectStatus };
}

export async function runUpdateProjectStatus(
  supabase: SupabaseClient,
  rawArgs: UpdateProjectStatusArgs,
) {
  const { slug, status } = assertArgs(rawArgs);

  const { data: projectData, error: lookupErr } = await supabase
    .from("projects")
    .select("id, slug")
    .eq("slug", slug)
    .single();

  if (lookupErr || !projectData) {
    throw new Error(
      `update_project_status: project with slug '${slug}' not found`,
    );
  }
  const project = projectData as Pick<Project, "id" | "slug">;

  const { data, error } = await supabase
    .from("projects")
    .update({ status })
    .eq("id", project.id)
    .select("id, slug, name, status, updated_at")
    .single();

  if (error || !data) {
    throw new Error(
      `update_project_status: update failed — ${error?.message ?? "no data returned"}`,
    );
  }

  return data as Pick<Project, "id" | "slug" | "name" | "status" | "updated_at">;
}
