"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { decrypt, encrypt } from "@/lib/crypto";
import { syncIntegrationById } from "@/lib/integrations/sync";
import type {
  IntegrationConfigFor,
  IntegrationType,
  ProjectStatus,
} from "./types";

async function db() {
  return createClient();
}

function nullable(value: string | null | undefined): string | null {
  if (value === undefined || value === null) return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

// ===== Projects =====

export interface ProjectInput {
  name: string;
  slug: string;
  tagline: string;
  description?: string | null;
  problem?: string | null;
  solution?: string | null;
  outcome?: string | null;
  tech_stack: string[];
  status: ProjectStatus;
  featured: boolean;
  demo_url?: string | null;
  repo_url?: string | null;
  primary_domain?: string | null;
  vercel_project_id?: string | null;
}

export async function createProject(input: ProjectInput) {
  const supabase = await db();
  const { error } = await supabase.from("projects").insert({
    slug: input.slug,
    name: input.name,
    tagline: input.tagline,
    description: nullable(input.description),
    problem: nullable(input.problem),
    solution: nullable(input.solution),
    outcome: nullable(input.outcome),
    tech_stack: input.tech_stack,
    status: input.status,
    featured: input.featured,
    demo_url: nullable(input.demo_url),
    repo_url: nullable(input.repo_url),
    primary_domain: nullable(input.primary_domain),
    vercel_project_id: nullable(input.vercel_project_id),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/projects");
  revalidatePath("/admin");
}

export async function updateProject(id: string, input: ProjectInput) {
  const supabase = await db();
  const { error } = await supabase
    .from("projects")
    .update({
      slug: input.slug,
      name: input.name,
      tagline: input.tagline,
      description: nullable(input.description),
      problem: nullable(input.problem),
      solution: nullable(input.solution),
      outcome: nullable(input.outcome),
      tech_stack: input.tech_stack,
      status: input.status,
      featured: input.featured,
      demo_url: nullable(input.demo_url),
      repo_url: nullable(input.repo_url),
      primary_domain: nullable(input.primary_domain),
      vercel_project_id: nullable(input.vercel_project_id),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/projects");
  revalidatePath("/admin");
}

export async function deleteProject(id: string) {
  const supabase = await db();
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/projects");
  revalidatePath("/admin");
}

export async function toggleProjectFeatured(id: string, featured: boolean) {
  const supabase = await db();
  const { error } = await supabase
    .from("projects")
    .update({ featured })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/projects");
}

// ===== Credentials =====

export interface CredentialInput {
  name: string;
  service: string;
  key: string;
  project_id?: string | null;
  expires_at?: string | null;
  notes?: string | null;
}

export async function createCredential(input: CredentialInput) {
  const supabase = await db();
  const { error } = await supabase.from("credentials").insert({
    name: input.name,
    service: input.service,
    key_encrypted: encrypt(input.key),
    project_id: nullable(input.project_id),
    expires_at: input.expires_at ? new Date(input.expires_at).toISOString() : null,
    notes: nullable(input.notes),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/credentials");
  revalidatePath("/admin");
}

export async function updateCredential(id: string, input: CredentialInput) {
  const supabase = await db();
  const patch: Record<string, unknown> = {
    name: input.name,
    service: input.service,
    project_id: nullable(input.project_id),
    expires_at: input.expires_at
      ? new Date(input.expires_at).toISOString()
      : null,
    notes: nullable(input.notes),
  };
  if (input.key.trim()) patch.key_encrypted = encrypt(input.key);
  const { error } = await supabase.from("credentials").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/credentials");
}

export async function revealCredential(id: string): Promise<string> {
  const supabase = await db();
  const { data, error } = await supabase
    .from("credentials")
    .select("key_encrypted")
    .eq("id", id)
    .single();
  if (error) throw new Error(error.message);
  return decrypt(data.key_encrypted);
}

export async function deleteCredential(id: string) {
  const supabase = await db();
  const { error } = await supabase.from("credentials").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/credentials");
  revalidatePath("/admin");
}

// ===== Local services =====

export interface ServiceInput {
  name: string;
  port: number;
  project_id?: string | null;
  start_command?: string | null;
  notes?: string | null;
}

export async function createService(input: ServiceInput) {
  const supabase = await db();
  const { error } = await supabase.from("local_services").insert({
    name: input.name,
    port: input.port,
    project_id: nullable(input.project_id),
    start_command: nullable(input.start_command),
    notes: nullable(input.notes),
    is_active: false,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/services");
  revalidatePath("/admin");
}

export async function updateService(id: string, input: ServiceInput) {
  const supabase = await db();
  const { error } = await supabase
    .from("local_services")
    .update({
      name: input.name,
      port: input.port,
      project_id: nullable(input.project_id),
      start_command: nullable(input.start_command),
      notes: nullable(input.notes),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/services");
}

export async function deleteService(id: string) {
  const supabase = await db();
  const { error } = await supabase.from("local_services").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/services");
  revalidatePath("/admin");
}

export async function toggleServiceActive(id: string, isActive: boolean) {
  const supabase = await db();
  const { error } = await supabase
    .from("local_services")
    .update({ is_active: isActive })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/services");
  revalidatePath("/admin");
}

// ===== Repositories =====

export interface RepoInput {
  name: string;
  url: string;
  project_id?: string | null;
  category?: string | null;
  notes?: string | null;
}

export async function createRepo(input: RepoInput) {
  const supabase = await db();
  const { error } = await supabase.from("repositories").insert({
    name: input.name,
    url: input.url,
    project_id: nullable(input.project_id),
    category: nullable(input.category),
    notes: nullable(input.notes),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/repos");
  revalidatePath("/admin");
}

export async function updateRepo(id: string, input: RepoInput) {
  const supabase = await db();
  const { error } = await supabase
    .from("repositories")
    .update({
      name: input.name,
      url: input.url,
      project_id: nullable(input.project_id),
      category: nullable(input.category),
      notes: nullable(input.notes),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/repos");
}

export async function deleteRepo(id: string) {
  const supabase = await db();
  const { error } = await supabase.from("repositories").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/repos");
  revalidatePath("/admin");
}

// ===== Logins =====

export interface LoginInput {
  service: string;
  username: string;
  password: string;
  url?: string | null;
  category?: string | null;
  notes?: string | null;
}

export async function createLogin(input: LoginInput) {
  const supabase = await db();
  const { error } = await supabase.from("logins").insert({
    service: input.service,
    username_encrypted: encrypt(input.username),
    password_encrypted: encrypt(input.password),
    url: nullable(input.url),
    category: nullable(input.category),
    notes: nullable(input.notes),
    last_used: null,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/logins");
}

export async function updateLogin(id: string, input: LoginInput) {
  const supabase = await db();
  const { error } = await supabase
    .from("logins")
    .update({
      service: input.service,
      username_encrypted: encrypt(input.username),
      password_encrypted: encrypt(input.password),
      url: nullable(input.url),
      category: nullable(input.category),
      notes: nullable(input.notes),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/logins");
}

export async function deleteLogin(id: string) {
  const supabase = await db();
  const { error } = await supabase.from("logins").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/logins");
}

// ===== Notes =====

export interface NoteInput {
  title: string;
  content?: string | null;
  tags: string[];
  project_id?: string | null;
}

export async function createNote(input: NoteInput) {
  const supabase = await db();
  const { error } = await supabase.from("notes").insert({
    title: input.title,
    content: nullable(input.content),
    tags: input.tags,
    pinned: false,
    project_id: nullable(input.project_id),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/notes");
}

export async function updateNote(id: string, input: NoteInput) {
  const supabase = await db();
  const { error } = await supabase
    .from("notes")
    .update({
      title: input.title,
      content: nullable(input.content),
      tags: input.tags,
      project_id: nullable(input.project_id),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/notes");
}

export async function deleteNote(id: string) {
  const supabase = await db();
  const { error } = await supabase.from("notes").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/notes");
}

export async function toggleNotePinned(id: string, pinned: boolean) {
  const supabase = await db();
  const { error } = await supabase
    .from("notes")
    .update({ pinned })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/notes");
}

// ===== Integrations =====

export interface IntegrationInput<T extends IntegrationType = IntegrationType> {
  project_id: string;
  type: T;
  display_name?: string | null;
  config: IntegrationConfigFor<T>;
  secret_ref?: string | null;
}

export async function createIntegration(input: IntegrationInput) {
  const supabase = await db();

  const { data: project, error: projErr } = await supabase
    .from("projects")
    .select("id, slug")
    .eq("id", input.project_id)
    .single();
  if (projErr || !project) {
    throw new Error("Project not found");
  }

  const { error } = await supabase.from("integrations").insert({
    project_id: input.project_id,
    type: input.type,
    display_name: nullable(input.display_name),
    config: input.config,
    secret_ref: nullable(input.secret_ref),
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/projects/${project.slug}`);
  revalidatePath("/admin/integrations");
  revalidatePath("/admin");
}

export async function deleteIntegration(id: string, projectSlug?: string) {
  const supabase = await db();
  const { error } = await supabase.from("integrations").delete().eq("id", id);
  if (error) throw new Error(error.message);
  if (projectSlug) revalidatePath(`/admin/projects/${projectSlug}`);
  revalidatePath("/admin/integrations");
}

export interface IntegrationUpdateInput {
  display_name?: string | null;
  config: IntegrationConfigFor<IntegrationType>;
  secret_ref?: string | null;
}

export async function updateIntegration(
  id: string,
  input: IntegrationUpdateInput,
  projectSlug?: string,
) {
  const supabase = await db();
  const { error } = await supabase
    .from("integrations")
    .update({
      display_name: nullable(input.display_name),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      config: input.config as any,
      secret_ref: nullable(input.secret_ref),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  if (projectSlug) revalidatePath(`/admin/projects/${projectSlug}`);
  revalidatePath("/admin/integrations");
}

// ===== Provider accounts =====

export interface ProviderAccountInput {
  provider: string;
  display_name: string;
  external_account_id: string;
  master_credential_id?: string | null;
}

export async function createProviderAccount(input: ProviderAccountInput) {
  const supabase = await db();
  const { error } = await supabase.from("provider_accounts").insert({
    provider: input.provider,
    display_name: input.display_name,
    external_account_id: input.external_account_id,
    master_credential_id: nullable(input.master_credential_id),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/provider-accounts");
}

export interface ProviderAccountUpdateInput {
  display_name: string;
  external_account_id: string;
  master_credential_id?: string | null;
}

export async function updateProviderAccount(id: string, input: ProviderAccountUpdateInput) {
  const supabase = await db();
  const { error } = await supabase
    .from("provider_accounts")
    .update({
      display_name: input.display_name,
      external_account_id: input.external_account_id,
      master_credential_id: nullable(input.master_credential_id),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/provider-accounts");
}

export async function deleteProviderAccount(id: string) {
  const supabase = await db();
  const { error } = await supabase
    .from("provider_accounts")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/provider-accounts");
}

export async function refreshIntegration(
  id: string,
  projectSlug?: string,
): Promise<{ status: "ok" | "error"; error?: string }> {
  const supabase = createServiceClient();
  const result = await syncIntegrationById(supabase, id);

  if (projectSlug) revalidatePath(`/admin/projects/${projectSlug}`);
  revalidatePath("/admin/integrations");
  revalidatePath("/admin");

  return { status: result.status, error: result.error };
}
