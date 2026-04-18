import { getCredentials, getProjectMinis } from "@/lib/db/queries";
import { CredentialsClient } from "./CredentialsClient";

export const dynamic = "force-dynamic";

export default async function CredentialsPage() {
  const [credentials, projects] = await Promise.all([
    getCredentials(),
    getProjectMinis(),
  ]);
  return <CredentialsClient initial={credentials} projects={projects} />;
}
