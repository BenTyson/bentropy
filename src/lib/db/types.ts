export type ProjectStatus = "active" | "shipped" | "concept";

export interface Project {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string | null;
  problem: string | null;
  solution: string | null;
  outcome: string | null;
  tech_stack: string[];
  status: ProjectStatus;
  featured: boolean;
  display_order: number;
  demo_url: string | null;
  repo_url: string | null;
  image_url: string | null;
  primary_domain?: string | null;
  vercel_project_id?: string | null;
  archived_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Credential {
  id: string;
  name: string;
  service: string;
  key_encrypted: string;
  project_id: string | null;
  expires_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface LocalService {
  id: string;
  name: string;
  port: number;
  project_id: string | null;
  start_command: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Repository {
  id: string;
  name: string;
  url: string;
  project_id: string | null;
  category: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Login {
  id: string;
  service: string;
  username_encrypted: string;
  password_encrypted: string;
  url: string | null;
  category: string | null;
  notes: string | null;
  last_used: string | null;
  created_at: string;
  updated_at: string;
}

export interface Note {
  id: string;
  title: string;
  content: string | null;
  tags: string[];
  pinned: boolean;
  project_id: string | null;
  created_at: string;
  updated_at: string;
}

export type IntegrationType =
  | "vercel"
  | "github"
  | "supabase"
  | "stripe"
  | "railway"
  | "dns"
  | "analytics"
  | "local";

export type SyncStatus = "ok" | "stale" | "error";

export interface VercelConfig {
  vercel_project_id: string;
  team_id?: string | null;
}

export interface GithubConfig {
  owner: string;
  repo: string;
}

export interface SupabaseConfig {
  project_ref: string;
}

export interface StripeConfig {
  account_id: string;
}

export interface RailwayConfig {
  service_id: string;
  environment_id: string;
}

export interface DnsConfig {
  provider: string;
  zone_id: string;
}

export interface AnalyticsConfig {
  provider: string;
  property_id: string;
}

export interface LocalIntegrationConfig {
  port: number;
  start_command?: string | null;
}

export type IntegrationConfigFor<T extends IntegrationType> =
  T extends "vercel"
    ? VercelConfig
    : T extends "github"
      ? GithubConfig
      : T extends "supabase"
        ? SupabaseConfig
        : T extends "stripe"
          ? StripeConfig
          : T extends "railway"
            ? RailwayConfig
            : T extends "dns"
              ? DnsConfig
              : T extends "analytics"
                ? AnalyticsConfig
                : T extends "local"
                  ? LocalIntegrationConfig
                  : never;

type BaseIntegration = {
  id: string;
  project_id: string;
  display_name: string | null;
  secret_ref: string | null;
  last_synced_at: string | null;
  sync_status: SyncStatus | null;
  sync_error: string | null;
  created_at: string;
  updated_at: string;
};

export type Integration = {
  [T in IntegrationType]: BaseIntegration & {
    type: T;
    config: IntegrationConfigFor<T>;
  };
}[IntegrationType];

export interface IntegrationSnapshot {
  id: string;
  integration_id: string;
  snapshot: Record<string, unknown>;
  fetched_at: string;
}

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: Project;
        Insert: Partial<Omit<Project, "id" | "created_at" | "updated_at">> & {
          slug: string;
          name: string;
          tagline: string;
        };
        Update: Partial<Omit<Project, "id">>;
      };
      credentials: {
        Row: Credential;
        Insert: Omit<Credential, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Credential, "id">>;
      };
      local_services: {
        Row: LocalService;
        Insert: Omit<LocalService, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<LocalService, "id">>;
      };
      repositories: {
        Row: Repository;
        Insert: Omit<Repository, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Repository, "id">>;
      };
      logins: {
        Row: Login;
        Insert: Omit<Login, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Login, "id">>;
      };
      notes: {
        Row: Note;
        Insert: Omit<Note, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Note, "id">>;
      };
      integrations: {
        Row: Integration;
        Insert: Omit<Integration, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Integration, "id">>;
      };
      integration_snapshots: {
        Row: IntegrationSnapshot;
        Insert: Omit<IntegrationSnapshot, "id" | "fetched_at">;
        Update: Partial<Omit<IntegrationSnapshot, "id">>;
      };
    };
  };
}
