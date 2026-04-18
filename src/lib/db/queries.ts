import "server-only";
import { createClient } from "@/lib/supabase/server";
import type {
  Credential,
  Integration,
  LocalService,
  Login,
  Note,
  Project,
  Repository,
} from "./types";

export interface ProjectRollup {
  project: Project;
  credentials: Credential[];
  repositories: Repository[];
  localServices: LocalService[];
  notes: Note[];
  integrations: Integration[];
}

export async function getProjectBySlug(
  slug: string,
): Promise<ProjectRollup | null> {
  const supabase = await createClient();

  const { data: project, error } = await supabase
    .from("projects")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !project) return null;

  const [credentials, repositories, localServices, notes, integrations] =
    await Promise.all([
      supabase
        .from("credentials")
        .select("*")
        .eq("project_id", project.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("repositories")
        .select("*")
        .eq("project_id", project.id)
        .order("name", { ascending: true }),
      supabase
        .from("local_services")
        .select("*")
        .eq("project_id", project.id)
        .order("port", { ascending: true }),
      supabase
        .from("notes")
        .select("*")
        .eq("project_id", project.id)
        .order("pinned", { ascending: false })
        .order("updated_at", { ascending: false }),
      supabase
        .from("integrations")
        .select("*")
        .eq("project_id", project.id)
        .order("type", { ascending: true }),
    ]);

  return {
    project: project as Project,
    credentials: (credentials.data ?? []) as Credential[],
    repositories: (repositories.data ?? []) as Repository[],
    localServices: (localServices.data ?? []) as LocalService[],
    notes: (notes.data ?? []) as Note[],
    integrations: (integrations.data ?? []) as Integration[],
  };
}

export async function getAllIntegrations(): Promise<
  (Integration & { project_name: string | null; project_slug: string | null })[]
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("integrations")
    .select("*, projects(name, slug)")
    .order("type", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => {
    const { projects, ...rest } = row as Integration & {
      projects: { name: string; slug: string } | null;
    };
    return {
      ...rest,
      project_name: projects?.name ?? null,
      project_slug: projects?.slug ?? null,
    };
  });
}

export async function getProjects(): Promise<Project[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("display_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Project[];
}

export async function getProjectMinis(): Promise<
  Pick<Project, "id" | "slug" | "name">[]
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("id, slug, name")
    .order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export type CredentialWithProject = Credential & { project_name: string | null };

export async function getCredentials(): Promise<CredentialWithProject[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("credentials")
    .select("*, projects(name)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => {
    const { projects, ...rest } = row as Credential & {
      projects: { name: string } | null;
    };
    return { ...rest, project_name: projects?.name ?? null };
  });
}

export type LocalServiceWithProject = LocalService & {
  project_name: string | null;
};

export async function getLocalServices(): Promise<LocalServiceWithProject[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("local_services")
    .select("*, projects(name)")
    .order("port", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => {
    const { projects, ...rest } = row as LocalService & {
      projects: { name: string } | null;
    };
    return { ...rest, project_name: projects?.name ?? null };
  });
}

export type RepositoryWithProject = Repository & {
  project_name: string | null;
};

export async function getRepositories(): Promise<RepositoryWithProject[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("repositories")
    .select("*, projects(name)")
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => {
    const { projects, ...rest } = row as Repository & {
      projects: { name: string } | null;
    };
    return { ...rest, project_name: projects?.name ?? null };
  });
}

export async function getLogins(): Promise<Login[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("logins")
    .select("*")
    .order("service", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Login[];
}

export type NoteWithProject = Note & { project_name: string | null };

export async function getNotes(): Promise<NoteWithProject[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notes")
    .select("*, projects(name)")
    .order("pinned", { ascending: false })
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => {
    const { projects, ...rest } = row as Note & {
      projects: { name: string } | null;
    };
    return { ...rest, project_name: projects?.name ?? null };
  });
}

export interface DashboardStats {
  activeProjects: number;
  totalCredentials: number;
  runningServices: number;
  repositories: number;
  expiringCredentials: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient();
  const fourteenDaysOut = new Date(
    Date.now() + 14 * 24 * 60 * 60 * 1000,
  ).toISOString();

  const [activeProjects, credentials, services, repos, expiring] =
    await Promise.all([
      supabase
        .from("projects")
        .select("id", { count: "exact", head: true })
        .eq("status", "active"),
      supabase.from("credentials").select("id", { count: "exact", head: true }),
      supabase
        .from("local_services")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true),
      supabase
        .from("repositories")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("credentials")
        .select("id", { count: "exact", head: true })
        .not("expires_at", "is", null)
        .lte("expires_at", fourteenDaysOut)
        .gte("expires_at", new Date().toISOString()),
    ]);

  return {
    activeProjects: activeProjects.count ?? 0,
    totalCredentials: credentials.count ?? 0,
    runningServices: services.count ?? 0,
    repositories: repos.count ?? 0,
    expiringCredentials: expiring.count ?? 0,
  };
}
