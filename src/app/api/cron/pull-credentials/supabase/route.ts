import "server-only";

import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { decrypt, encrypt, isEncryptedPayload } from "@/lib/crypto";
import {
  fetchSupabaseProjectApiKeys,
  fetchSupabaseProjectsForOrg,
} from "@/lib/integrations/supabase";
import { warnOnStaleMasterCredentials } from "@/lib/integrations/rotation";
import type { Credential, Integration, ProviderAccount, SupabaseConfig } from "@/lib/db/types";

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
  matched_projects: number;
  inserted: number;
  updated: number;
  skipped_manual: number;
  skipped_unchanged: number;
  skipped_unmatched: number;
  error?: string;
}

// Key name constants: anon → SUPABASE_ANON_KEY, service_role → SUPABASE_SERVICE_ROLE_KEY
const KEY_NAME_MAP: Record<string, string> = {
  anon: "SUPABASE_ANON_KEY",
  service_role: "SUPABASE_SERVICE_ROLE_KEY",
};

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
    // source === 'autopull': compare decrypted to avoid noise-free updated_at churn
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
        `[pull-credentials/supabase] update failed for ${projectId}/${name}: ${updateErr.message}`,
      );
      return;
    }
    result.updated += 1;
    return;
  }

  const { error: insertErr } = await supabase.from("credentials").insert({
    project_id: projectId,
    name,
    service: "supabase",
    key_encrypted: encrypt(value),
    expires_at: null,
    source: "autopull",
    notes,
  });
  if (insertErr) {
    console.error(
      `[pull-credentials/supabase] insert failed for ${projectId}/${name}: ${insertErr.message}`,
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
  const pat = decrypt(credential.key_encrypted);

  // external_account_id for Supabase provider accounts is the org slug
  let supabaseProjects: Awaited<ReturnType<typeof fetchSupabaseProjectsForOrg>>;
  try {
    supabaseProjects = await fetchSupabaseProjectsForOrg(
      pat,
      account.external_account_id,
    );
  } catch (err) {
    result.error = err instanceof Error ? err.message : String(err);
    return result;
  }

  for (const sp of supabaseProjects) {
    // Match via integrations row where type='supabase' and config->>project_ref = sp.ref
    const { data: integrationRow } = await supabase
      .from("integrations")
      .select("*")
      .eq("type", "supabase")
      .eq("config->>project_ref", sp.ref)
      .maybeSingle();

    if (!integrationRow) {
      result.skipped_unmatched += 1;
      continue;
    }
    const integration = integrationRow as Integration;
    if (integration.type !== "supabase") continue;
    const cfg = integration.config as SupabaseConfig;
    result.matched_projects += 1;

    let apiKeys: Awaited<ReturnType<typeof fetchSupabaseProjectApiKeys>>;
    try {
      apiKeys = await fetchSupabaseProjectApiKeys(pat, cfg.project_ref);
    } catch (err) {
      console.error(
        `[pull-credentials/supabase] api-keys fetch failed for ${sp.name} (${sp.ref}): ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      continue;
    }

    for (const key of apiKeys) {
      const credName = KEY_NAME_MAP[key.name];
      if (!credName) continue; // skip unrecognised key types

      await upsertCredential(
        supabase,
        integration.project_id,
        credName,
        key.api_key,
        `Autopulled from Supabase project ${sp.name} (${sp.ref})`,
        result,
      );
    }
  }

  return result;
}

async function run(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();

  await warnOnStaleMasterCredentials(supabase, "supabase");

  const { data: accounts, error: acctErr } = await supabase
    .from("provider_accounts")
    .select("*")
    .eq("provider", "supabase")
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
    type: "supabase",
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
