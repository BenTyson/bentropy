import { getLocalServices, getProjectMinis } from "@/lib/db/queries";
import { ServicesClient } from "./ServicesClient";

export const dynamic = "force-dynamic";

export default async function ServicesPage() {
  const [services, projects] = await Promise.all([
    getLocalServices(),
    getProjectMinis(),
  ]);
  return <ServicesClient initial={services} projects={projects} />;
}
