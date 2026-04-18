import { getProjectMinis, getRepositories } from "@/lib/db/queries";
import { ReposClient } from "./ReposClient";

export const dynamic = "force-dynamic";

export default async function ReposPage() {
  const [repos, projects] = await Promise.all([
    getRepositories(),
    getProjectMinis(),
  ]);
  return <ReposClient initial={repos} projects={projects} />;
}
