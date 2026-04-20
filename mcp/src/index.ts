#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { createServiceClient } from "./supabase.js";
import {
  listProjectsDefinition,
  runListProjects,
} from "./tools/list_projects.js";
import { getProjectDefinition, runGetProject } from "./tools/get_project.js";
import {
  listIntegrationsDefinition,
  runListIntegrations,
} from "./tools/list_integrations.js";
import {
  getCredentialDefinition,
  runGetCredential,
} from "./tools/get_credential.js";
import { addNoteDefinition, runAddNote } from "./tools/add_note.js";
import {
  updateProjectStatusDefinition,
  runUpdateProjectStatus,
} from "./tools/update_project_status.js";
import {
  upsertCredentialDefinition,
  runUpsertCredential,
} from "./tools/upsert_credential.js";

function checkEnv() {
  const missing: string[] = [];
  const url =
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) missing.push("SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL)");
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY)
    missing.push("SUPABASE_SERVICE_ROLE_KEY");
  if (!process.env.ENCRYPTION_KEY) missing.push("ENCRYPTION_KEY");
  if (missing.length > 0) {
    // Write to stderr so it doesn't corrupt the stdio JSON-RPC channel.
    console.error(
      `[bentropy-mcp] missing required env vars: ${missing.join(", ")}`,
    );
    process.exit(1);
  }
}

async function main() {
  checkEnv();

  const supabase = createServiceClient();

  const server = new Server(
    { name: "bentropy", version: "0.1.0" },
    { capabilities: { tools: {} } },
  );

  const tools = [
    listProjectsDefinition,
    getProjectDefinition,
    listIntegrationsDefinition,
    getCredentialDefinition,
    addNoteDefinition,
    updateProjectStatusDefinition,
    upsertCredentialDefinition,
  ];

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools,
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
      const result = await dispatch(name, args ?? {});
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        isError: true,
        content: [{ type: "text", text: message }],
      };
    }
  });

  async function dispatch(name: string, args: Record<string, unknown>) {
    switch (name) {
      case "list_projects":
        return runListProjects(supabase);
      case "get_project":
        return runGetProject(supabase, args);
      case "list_integrations":
        return runListIntegrations(supabase, args);
      case "get_credential":
        return runGetCredential(supabase, args);
      case "add_note":
        return runAddNote(supabase, args);
      case "update_project_status":
        return runUpdateProjectStatus(supabase, args);
      case "upsert_credential":
        return runUpsertCredential(supabase, args);
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[bentropy-mcp] stdio server ready");
}

main().catch((err) => {
  console.error("[bentropy-mcp] fatal:", err);
  process.exit(1);
});
