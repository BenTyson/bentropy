import "server-only";

import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { decrypt, encrypt, isEncryptedPayload } from "@/lib/crypto";
import {
  fetchRailwayProjectsForWorkspace,
  fetchRailwayVariables,
} from "@/lib/integrations/railway";
import type {
  Credential,
  Integration,
  ProviderAccount,
  RailwayConfig,
} from "@/lib/db/types";

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
  skipped_existing: number;
  skipped_unmatched: number;
  error?: string;
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
    skipped_existing: 0,
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

  let railwayProjects: Awaited<ReturnType<typeof fetchRailwayProjectsForWorkspace>>;
  try {
    railwayProjects = await fetchRailwayProjectsForWorkspace(
      pat,
      account.external_account_id,
    );
  } catch (err) {
    result.error = err instanceof Error ? err.message : String(err);
    return result;
  }

  for (const rp of railwayProjects) {
    // Railway projects don't have a direct column on projects — match via an
    // existing railway integration whose config.project_id equals the Railway
    // API id. That same integration pins the service + environment the user
    // cares about, so we pull variables from exactly that scope.
    const { data: integrationRow } = await supabase
      .from("integrations")
      .select("*")
      .eq("type", "railway")
      .eq("config->>project_id", rp.id)
      .maybeSingle();

    if (!integrationRow) {
      result.skipped_unmatched += 1;
      continue;
    }
    const integration = integrationRow as Integration;
    if (integration.type !== "railway") continue;
    const cfg = integration.config as RailwayConfig;
    result.matched_projects += 1;

    let variables: Record<string, string>;
    try {
      variables = await fetchRailwayVariables(
        pat,
        cfg.project_id,
        cfg.environment_id,
        cfg.service_id,
      );
    } catch (err) {
      console.error(
        `[pull-credentials/railway] variables fetch failed for ${rp.name} (${rp.id}): ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      continue;
    }

    for (const [key, value] of Object.entries(variables)) {
      const { data: existing } = await supabase
        .from("credentials")
        .select("id")
        .eq("project_id", integration.project_id)
        .eq("name", key)
        .maybeSingle();

      if (existing) {
        result.skipped_existing += 1;
        continue;
      }

      const { error: insertErr } = await supabase.from("credentials").insert({
        project_id: integration.project_id,
        name: key,
        service: "railway",
        key_encrypted: encrypt(value),
        expires_at: null,
        notes: `Autopulled from Railway project ${rp.name}`,
      });
      if (insertErr) {
        console.error(
          `[pull-credentials/railway] insert failed for ${integration.project_id}/${key}: ${insertErr.message}`,
        );
        continue;
      }
      result.inserted += 1;
    }
  }

  return result;
}

async function run(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();

  const { data: accounts, error: acctErr } = await supabase
    .from("provider_accounts")
    .select("*")
    .eq("provider", "railway")
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
      acc.skipped_existing += r.skipped_existing;
      acc.skipped_unmatched += r.skipped_unmatched;
      acc.matched_projects += r.matched_projects;
      if (r.error) acc.errors += 1;
      return acc;
    },
    { inserted: 0, skipped_existing: 0, skipped_unmatched: 0, matched_projects: 0, errors: 0 },
  );

  return NextResponse.json({
    type: "railway",
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
