// Database types for Bentropy
// These match the Supabase schema defined in the plan

export type ProjectStatus = "active" | "shipped" | "concept";

export interface Project {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string | null;
  problem: string | null; // "The entropy state"
  solution: string | null; // "Bentropy applied"
  outcome: string | null; // "Order achieved"
  tech_stack: string[];
  status: ProjectStatus;
  featured: boolean;
  display_order: number;
  demo_url: string | null;
  repo_url: string | null;
  image_url: string | null;
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
}

export interface LocalService {
  id: string;
  name: string;
  port: number;
  project_id: string | null;
  start_command: string | null;
  notes: string | null;
  is_active: boolean;
}

export interface Repository {
  id: string;
  name: string;
  url: string;
  project_id: string | null;
  category: string | null;
  notes: string | null;
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

// Database schema type for Supabase client
export interface Database {
  public: {
    Tables: {
      projects: {
        Row: Project;
        Insert: Omit<Project, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Project, "id">>;
      };
      credentials: {
        Row: Credential;
        Insert: Omit<Credential, "id" | "created_at">;
        Update: Partial<Omit<Credential, "id">>;
      };
      local_services: {
        Row: LocalService;
        Insert: Omit<LocalService, "id">;
        Update: Partial<Omit<LocalService, "id">>;
      };
      repositories: {
        Row: Repository;
        Insert: Omit<Repository, "id">;
        Update: Partial<Omit<Repository, "id">>;
      };
      logins: {
        Row: Login;
        Insert: Omit<Login, "id" | "created_at">;
        Update: Partial<Omit<Login, "id">>;
      };
      notes: {
        Row: Note;
        Insert: Omit<Note, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Note, "id">>;
      };
    };
  };
}
