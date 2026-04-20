import "server-only";

import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { decrypt, encrypt, isEncryptedPayload } from "@/lib/crypto";
import { fetchUmamiWebsites } from "@/lib/integrations/analytics";
import { warnOnStaleMasterCredentials } from "@/lib/integrations/rotation";
import type { AnalyticsConfig, Credential, Integration, ProviderAccount } from "@/lib/db/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get("authorization") ?? "";
  return header === `Bearer ${secret}`;
}

interface AccountResult {
  provider_account_id: string;
  display_name: string;
  umami_base_url: string;
  websites_found: number;
  matched_projects: number;
  inserted: number;
  updated: number;
  skipped_manual: number;
  skipped_unchanged: number;
  skipped_unmatched: number;
  error?: string;
}

async function upsertCredential(
  supabase: ReturnType<typeof createServiceClient>,
  projectId: string,
  name: string,
  value: string,
  notes: string,
  result: AccountResult,
): Promise<void> {
  const { data: existing } = await supabase
    .from("credentials")
    .select("id, source, key_encrypted")
    .eq("project_id", projectId)
    .eq("name", name)
    .maybeSingle();

  if (existing) {
    const row = existing as Pick<Credential, "id" | "source" | "key_encrypted">;
    if (row.source === "manual") {
      result.skipped_manual += 1;
      return;
    }
    let existingPlaintext: string | null = null;
    try {
      if (isEncryptedPayload(row.key_encrypted)) {
        existingPlaintext = decrypt(row.key_encrypted);
      }
    } catch {
      // Can't decrypt — treat as changed
    }
    if (existingPlaintext === value) {
      result.skipped_unchanged += 1;
      return;
    }
    const { error: updateErr } = await supabase
      .from("credentials")
      .update({ key_encrypted: encrypt(value) })
      .eq("id", row.id);
    if (updateErr) {
      console.error(
        `[pull-credentials/analytics] update failed for ${projectId}/${name}: ${updateErr.message}`,
      );
      return;
    }
    result.updated += 1;
    return;
  }

  const { error: insertErr } = await supabase.from("credentials").insert({
    project_id: projectId,
    name,
    service: "analytics",
    key_encrypted: encrypt(value),
    expires_at: null,
    source: "autopull",
    notes,
  });
  if (insertErr) {
    console.error(
      `[pull-credentials/analytics] insert failed for ${projectId}/${name}: ${insertErr.message}`,
    );
    return;
  }
  result.inserted += 1;
}

async function processAccount(
  supabase: ReturnType<typeof createServiceClient>,
  account: ProviderAccount,
): Promise<AccountResult> {
  const result: AccountResult = {
    provider_account_id: account.id,
    display_name: account.display_name,
    // external_account_id is the Umami instance base URL
    umami_base_url: account.external_account_id,
    websites_found: 0,
    matched_projects: 0,
    inserted: 0,
    updated: 0,
    skipped_manual: 0,
    skipped_unchanged: 0,
    skipped_unmatched: 0,
  };

  if (!account.master_credential_id) {
    result.error = "no master_credential_id on provider_account";
    return result;
  }

  const { data: credRow, error: credErr } = await supabase
    .from("credentials")
    .select("*")
    .eq("id", account.master_credential_id)
    .single();
  if (credErr || !credRow) {
    result.error = `master credential ${account.master_credential_id} not found`;
    return result;
  }
  const credential = credRow as Credential;
  if (!isEncryptedPayload(credential.key_encrypted)) {
    result.error = `master credential "${credential.name}" key is not an encrypted payload`;
    return result;
  }

  // Master credential must be JSON: {"username":"...","password":"..."}
  let username: string;
  let password: string;
  try {
    const parsed = JSON.parse(decrypt(credential.key_encrypted)) as {
      username: string;
      password: string;
    };
    username = parsed.username;
    password = parsed.password;
    if (!username || !password) throw new Error("missing username or password");
  } catch (err) {
    result.error = `master credential parse error: ${err instanceof Error ? err.message : String(err)}`;
    return result;
  }

  let websites: Awaited<ReturnType<typeof fetchUmamiWebsites>>;
  try {
    websites = await fetchUmamiWebsites(account.external_account_id, username, password);
  } catch (err) {
    result.error = err instanceof Error ? err.message : String(err);
    return result;
  }
  result.websites_found = websites.length;

  for (const site of websites) {
    const { data: integrationRow } = await supabase
      .from("integrations")
      .select("*")
      .eq("type", "analytics")
      .eq("config->>property_id", site.id)
      .maybeSingle();

    if (!integrationRow) {
      result.skipped_unmatched += 1;
      continue;
    }
    const integration = integrationRow as Integration;
    if (integration.type !== "analytics") continue;
    const cfg = integration.config as AnalyticsConfig;
    void cfg;
    result.matched_projects += 1;

    await upsertCredential(
      supabase,
      integration.project_id,
      "UMAMI_WEBSITE_ID",
      site.id,
      `Autopulled from Umami ${account.display_name} (${account.external_account_id}) — ${site.name} (${site.domain})`,
      result,
    );
  }

  return result;
}

async function run(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();

  await warnOnStaleMasterCredentials(supabase, "analytics");

  const { data: accounts, error: acctErr } = await supabase
    .from("provider_accounts")
    .select("*")
    .eq("provider", "analytics")
    .not("master_credential_id", "is", null);
  if (acctErr) {
    return NextResponse.json({ error: acctErr.message }, { status: 500 });
  }

  const results: AccountResult[] = [];
  for (const account of (accounts ?? []) as ProviderAccount[]) {
    results.push(await processAccount(supabase, account));
  }

  const summary = results.reduce(
    (acc, r) => {
      acc.inserted += r.inserted;
      acc.updated += r.updated;
      acc.skipped_manual += r.skipped_manual;
      acc.skipped_unchanged += r.skipped_unchanged;
      acc.skipped_unmatched += r.skipped_unmatched;
      acc.matched_projects += r.matched_projects;
      if (r.error) acc.errors += 1;
      return acc;
    },
    {
      inserted: 0,
      updated: 0,
      skipped_manual: 0,
      skipped_unchanged: 0,
      skipped_unmatched: 0,
      matched_projects: 0,
      errors: 0,
    },
  );

  return NextResponse.json({
    type: "analytics",
    accounts: results.length,
    ...summary,
    results,
  });
}

export async function GET(request: Request) {
  return run(request);
}

export async function POST(request: Request) {
  return run(request);
}
