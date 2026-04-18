import { getProjects } from "@/lib/db/queries";
import { ProjectsClient } from "./ProjectsClient";

export const dynamic = "force-dynamic";

export default async function ProjectsAdminPage() {
  const projects = await getProjects();
  return <ProjectsClient initial={projects} />;
}
