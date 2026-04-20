import type { SupabaseClient } from "@supabase/supabase-js";
import type { Note, Project } from "../../../src/lib/db/types.js";

export const addNoteDefinition = {
  name: "add_note",
  description:
    "Create a new note on a project. Resolves the project by slug. Returns the new note's id.",
  inputSchema: {
    type: "object",
    properties: {
      project: {
        type: "string",
        description: "The project slug (e.g. 'finch', 'saltgoat').",
      },
      title: {
        type: "string",
        description: "Short title for the note.",
      },
      body: {
        type: "string",
        description: "Full markdown content of the note.",
      },
      tags: {
        type: "array",
        items: { type: "string" },
        description: "Optional tag labels (e.g. ['todo', 'blocked']).",
      },
    },
    required: ["project", "title", "body"],
    additionalProperties: false,
  },
} as const;

export interface AddNoteArgs {
  project?: unknown;
  title?: unknown;
  body?: unknown;
  tags?: unknown;
}

function assertArgs(args: AddNoteArgs): {
  project: string;
  title: string;
  body: string;
  tags: string[];
} {
  if (typeof args.project !== "string" || args.project.trim() === "") {
    throw new Error("add_note: `project` must be a non-empty string");
  }
  if (typeof args.title !== "string" || args.title.trim() === "") {
    throw new Error("add_note: `title` must be a non-empty string");
  }
  if (typeof args.body !== "string") {
    throw new Error("add_note: `body` must be a string");
  }
  const tags = Array.isArray(args.tags)
    ? (args.tags as unknown[]).filter((t): t is string => typeof t === "string")
    : [];
  return {
    project: args.project.trim(),
    title: args.title.trim(),
    body: args.body,
    tags,
  };
}

export async function runAddNote(
  supabase: SupabaseClient,
  rawArgs: AddNoteArgs,
) {
  const { project: slug, title, body, tags } = assertArgs(rawArgs);

  const { data: projectData, error: projectErr } = await supabase
    .from("projects")
    .select("id, slug")
    .eq("slug", slug)
    .single();

  if (projectErr || !projectData) {
    throw new Error(`add_note: project with slug '${slug}' not found`);
  }
  const project = projectData as Pick<Project, "id" | "slug">;

  const { data, error } = await supabase
    .from("notes")
    .insert({
      project_id: project.id,
      title,
      content: body,
      tags,
      pinned: false,
    })
    .select("id, title, tags, created_at")
    .single();

  if (error || !data) {
    throw new Error(`add_note: insert failed — ${error?.message ?? "no data returned"}`);
  }

  const note = data as Pick<Note, "id" | "title" | "tags" | "created_at">;
  return { id: note.id, title: note.title, tags: note.tags, created_at: note.created_at };
}
