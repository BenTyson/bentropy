import { getCredentialMinis, getProviderAccounts } from "@/lib/db/queries";
import { ProviderAccountsClient } from "./ProviderAccountsClient";

export const dynamic = "force-dynamic";

export default async function ProviderAccountsPage() {
  const [accounts, credentials] = await Promise.all([
    getProviderAccounts(),
    getCredentialMinis(),
  ]);
  return (
    <ProviderAccountsClient initial={accounts} credentials={credentials} />
  );
}
