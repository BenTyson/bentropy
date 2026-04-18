import { getLogins } from "@/lib/db/queries";
import { LoginsClient } from "./LoginsClient";

export const dynamic = "force-dynamic";

export default async function LoginsPage() {
  const logins = await getLogins();
  return <LoginsClient initial={logins} />;
}
