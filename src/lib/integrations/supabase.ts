import "server-only";

export interface SupabaseProjectSummary {
  id: string;
  ref: string;
  name: string;
  organization_id: string;
}

export interface SupabaseApiKey {
  name: string; // 'anon' | 'service_role'
  api_key: string;
}

export async function fetchSupabaseProjectsForOrg(
  pat: string,
  orgSlug: string,
): Promise<SupabaseProjectSummary[]> {
  const res = await fetch(
    `https://api.supabase.com/v1/organizations/${encodeURIComponent(orgSlug)}/projects`,
    {
      headers: {
        Authorization: `Bearer ${pat}`,
        Accept: "application/json",
      },
      cache: "no-store",
    },
  );

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `Supabase API ${res.status} ${res.statusText}${body ? `: ${body.slice(0, 300)}` : ""}`,
    );
  }

  const projects = (await res.json()) as Array<{
    id?: string;
    ref?: string;
    name?: string;
    organization_id?: string;
  }>;

  return projects
    .filter((p) => p.id && p.ref && p.name)
    .map((p) => ({
      id: p.id!,
      ref: p.ref!,
      name: p.name!,
      organization_id: p.organization_id ?? "",
    }));
}

export async function fetchSupabaseProjectApiKeys(
  pat: string,
  projectRef: string,
): Promise<SupabaseApiKey[]> {
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${encodeURIComponent(projectRef)}/api-keys`,
    {
      headers: {
        Authorization: `Bearer ${pat}`,
        Accept: "application/json",
      },
      cache: "no-store",
    },
  );

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `Supabase api-keys ${res.status} ${res.statusText}${body ? `: ${body.slice(0, 300)}` : ""}`,
    );
  }

  const keys = (await res.json()) as Array<{
    name?: string;
    api_key?: string;
  }>;

  return keys
    .filter((k) => k.name && k.api_key)
    .map((k) => ({ name: k.name!, api_key: k.api_key! }));
}
