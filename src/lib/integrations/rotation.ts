import "server-only";

import type { createServiceClient } from "@/lib/supabase/service";

const STALE_DAYS = 180;

export async function warnOnStaleMasterCredentials(
  supabase: ReturnType<typeof createServiceClient>,
  provider: string,
): Promise<void> {
  const { data: accounts } = await supabase
    .from("provider_accounts")
    .select("id, display_name, master_credential_id")
    .eq("provider", provider)
    .not("master_credential_id", "is", null);

  if (!accounts?.length) return;

  const credIds = accounts.map((a) => a.master_credential_id as string);
  const { data: creds } = await supabase
    .from("credentials")
    .select("id, name, created_at")
    .in("id", credIds);

  const credMap = new Map((creds ?? []).map((c) => [c.id, c]));
  const now = Date.now();

  for (const account of accounts) {
    const cred = credMap.get(account.master_credential_id as string);
    if (!cred) continue;
    const ageDays = Math.floor(
      (now - new Date(cred.created_at).getTime()) / (1000 * 60 * 60 * 24),
    );
    if (ageDays >= STALE_DAYS) {
      console.warn(
        `[rotation] Stale master credential: provider=${provider} account="${account.display_name}" ` +
          `credential="${cred.name}" age=${ageDays}d (>${STALE_DAYS}d) — consider rotating`,
      );
    }
  }
}
