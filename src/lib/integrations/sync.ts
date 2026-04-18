import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { decrypt, isEncryptedPayload } from "@/lib/crypto";
import type {
  Credential,
  Integration,
  IntegrationType,
} from "@/lib/db/types";
import { fetchVercelDeploymentSnapshot } from "./vercel";
import { fetchRailwayDeploymentSnapshot } from "./railway";

// Untyped on purpose: the generated Database types don't flow through
// writes on the integration/snapshot/log tables without widening that's
// not worth the noise here.
type Client = SupabaseClient;

export interface SyncResult {
  integration_id: string;
  status: "ok" | "error";
  error?: string;
}

/**
 * Resolve the PAT for an integration. Prefers integration.secret_ref; falls back
 * to a project-scoped credential whose `service` matches the integration type
 * (e.g. type='vercel' → credentials.service='vercel'). Throws if no candidate
 * found or payload isn't decryptable.
 */
async function resolveSecret(
  supabase: Client,
  integration: Integration,
): Promise<string> {
  let credential: Credential | null = null;

  if (integration.secret_ref) {
    const { data, error } = await supabase
      .from("credentials")
      .select("*")
      .eq("id", integration.secret_ref)
      .single();
    if (error || !data) {
      throw new Error(
        `secret_ref ${integration.secret_ref} not found in credentials`,
      );
    }
    credential = data as Credential;
  } else {
    const { data, error } = await supabase
      .from("credentials")
      .select("*")
      .eq("project_id", integration.project_id)
      .eq("service", integration.type)
      .order("created_at", { ascending: false })
      .limit(1);
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) {
      throw new Error(
        `No credential linked (integration.secret_ref is null) and no project credential with service='${integration.type}'. Create one at /admin/credentials and link it.`,
      );
    }
    credential = data[0] as Credential;
  }

  if (!isEncryptedPayload(credential.key_encrypted)) {
    throw new Error(
      `Credential "${credential.name}" key is not an encrypted payload (likely a PLACEHOLDER_). Replace via /admin/credentials.`,
    );
  }

  return decrypt(credential.key_encrypted);
}

async function runIntegrationFetch(
  integration: Integration,
  pat: string,
): Promise<Record<string, unknown>> {
  switch (integration.type) {
    case "vercel": {
      const snap = await fetchVercelDeploymentSnapshot(integration.config, pat);
      return snap as unknown as Record<string, unknown>;
    }
    case "railway": {
      const snap = await fetchRailwayDeploymentSnapshot(
        integration.config,
        pat,
      );
      return snap as unknown as Record<string, unknown>;
    }
    default:
      throw new Error(
        `sync client for integration type '${integration.type}' not implemented yet`,
      );
  }
}

export async function syncIntegration(
  supabase: Client,
  integration: Integration,
): Promise<SyncResult> {
  const startedAt = new Date().toISOString();

  try {
    const pat = await resolveSecret(supabase, integration);
    const snapshot = await runIntegrationFetch(integration, pat);
    const fetchedAt = new Date().toISOString();

    const { error: snapErr } = await supabase
      .from("integration_snapshots")
      .insert({ integration_id: integration.id, snapshot });
    if (snapErr) throw new Error(`snapshot insert: ${snapErr.message}`);

    const { error: updErr } = await supabase
      .from("integrations")
      .update({
        last_synced_at: fetchedAt,
        sync_status: "ok",
        sync_error: null,
      })
      .eq("id", integration.id);
    if (updErr) throw new Error(`integration update: ${updErr.message}`);

    await supabase.from("sync_log").insert({
      integration_id: integration.id,
      started_at: startedAt,
      finished_at: new Date().toISOString(),
      status: "ok",
      error: null,
    });

    return { integration_id: integration.id, status: "ok" };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);

    await supabase
      .from("integrations")
      .update({
        sync_status: "error",
        sync_error: message.slice(0, 500),
      })
      .eq("id", integration.id);

    await supabase.from("sync_log").insert({
      integration_id: integration.id,
      started_at: startedAt,
      finished_at: new Date().toISOString(),
      status: "error",
      error: message.slice(0, 1000),
    });

    return { integration_id: integration.id, status: "error", error: message };
  }
}

export async function syncAllOfType(
  supabase: Client,
  type: IntegrationType,
): Promise<SyncResult[]> {
  const { data, error } = await supabase
    .from("integrations")
    .select("*")
    .eq("type", type);
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as Integration[];
  const results: SyncResult[] = [];
  for (const integration of rows) {
    results.push(await syncIntegration(supabase, integration));
  }
  return results;
}

export async function syncIntegrationById(
  supabase: Client,
  integrationId: string,
): Promise<SyncResult> {
  const { data, error } = await supabase
    .from("integrations")
    .select("*")
    .eq("id", integrationId)
    .single();
  if (error || !data) {
    throw new Error(`Integration ${integrationId} not found`);
  }
  return syncIntegration(supabase, data as Integration);
}
