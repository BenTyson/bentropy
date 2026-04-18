import { getNotes, getProjectMinis } from "@/lib/db/queries";
import { NotesClient } from "./NotesClient";

export const dynamic = "force-dynamic";

export default async function NotesPage() {
  const [notes, projects] = await Promise.all([
    getNotes(),
    getProjectMinis(),
  ]);
  return <NotesClient initial={notes} projects={projects} />;
}
