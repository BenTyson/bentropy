import "server-only";

import type { VercelConfig } from "@/lib/db/types";

export interface VercelDeploymentSnapshot {
  deployment_id: string | null;
  state: string | null;
  url: string | null;
  created_at: string | null;
  commit_sha: string | null;
  commit_message: string | null;
  branch: string | null;
  target: string | null;
  raw: Record<string, unknown>;
}

interface VercelDeploymentRaw {
  uid?: string;
  state?: string;
  url?: string;
  created?: number;
  createdAt?: number;
  target?: string;
  meta?: {
    githubCommitSha?: string;
    githubCommitMessage?: string;
    githubCommitRef?: string;
  };
}

export async function fetchVercelDeploymentSnapshot(
  config: VercelConfig,
  pat: string,
): Promise<VercelDeploymentSnapshot> {
  const params = new URLSearchParams({
    projectId: config.vercel_project_id,
    limit: "1",
  });
  if (config.team_id) params.set("teamId", config.team_id);

  const res = await fetch(
    `https://api.vercel.com/v6/deployments?${params.toString()}`,
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
      `Vercel API ${res.status} ${res.statusText}${body ? `: ${body.slice(0, 300)}` : ""}`,
    );
  }

  const payload = (await res.json()) as { deployments?: VercelDeploymentRaw[] };
  const latest = payload.deployments?.[0];

  if (!latest) {
    return {
      deployment_id: null,
      state: null,
      url: null,
      created_at: null,
      commit_sha: null,
      commit_message: null,
      branch: null,
      target: null,
      raw: payload as unknown as Record<string, unknown>,
    };
  }

  const createdMs = latest.createdAt ?? latest.created ?? null;

  return {
    deployment_id: latest.uid ?? null,
    state: latest.state ?? null,
    url: latest.url ? `https://${latest.url}` : null,
    created_at: createdMs ? new Date(createdMs).toISOString() : null,
    commit_sha: latest.meta?.githubCommitSha ?? null,
    commit_message: latest.meta?.githubCommitMessage ?? null,
    branch: latest.meta?.githubCommitRef ?? null,
    target: latest.target ?? null,
    raw: latest as unknown as Record<string, unknown>,
  };
}

// --- M6 Session B: project + env autopull ----------------------------------

export interface VercelProjectSummary {
  id: string;
  name: string;
}

interface VercelProjectsPage {
  projects?: Array<{ id?: string; name?: string }>;
  pagination?: { next?: number | null };
}

// Only send teamId when it looks like a real Vercel team id. Personal-account
// PATs reject the param.
function teamIdParam(externalAccountId: string | null | undefined): string | null {
  if (!externalAccountId) return null;
  return externalAccountId.startsWith("team_") ? externalAccountId : null;
}

export async function fetchVercelProjectsForAccount(
  pat: string,
  externalAccountId: string | null,
): Promise<VercelProjectSummary[]> {
  const teamId = teamIdParam(externalAccountId);
  const out: VercelProjectSummary[] = [];
  let until: number | null = null;

  // Hard cap iterations so a broken pagination response can't loop forever.
  for (let i = 0; i < 20; i++) {
    const params = new URLSearchParams({ limit: "100" });
    if (teamId) params.set("teamId", teamId);
    if (until !== null) params.set("until", String(until));

    const res = await fetch(
      `https://api.vercel.com/v9/projects?${params.toString()}`,
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
        `Vercel API ${res.status} ${res.statusText}${body ? `: ${body.slice(0, 300)}` : ""}`,
      );
    }

    const page = (await res.json()) as VercelProjectsPage;
    for (const p of page.projects ?? []) {
      if (p.id && p.name) out.push({ id: p.id, name: p.name });
    }
    const next = page.pagination?.next ?? null;
    if (!next) break;
    until = next;
  }

  return out;
}

export interface VercelEnvVar {
  key: string;
  value: string;
  type: string;
  target: string[];
}

interface VercelEnvRaw {
  key?: string;
  value?: string | null;
  type?: string;
  target?: string[];
}

export async function fetchVercelProjectEnv(
  pat: string,
  projectId: string,
  externalAccountId: string | null,
): Promise<VercelEnvVar[]> {
  const teamId = teamIdParam(externalAccountId);
  const params = new URLSearchParams({ decrypt: "true" });
  if (teamId) params.set("teamId", teamId);

  const res = await fetch(
    `https://api.vercel.com/v9/projects/${encodeURIComponent(projectId)}/env?${params.toString()}`,
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
      `Vercel env API ${res.status} ${res.statusText}${body ? `: ${body.slice(0, 300)}` : ""}`,
    );
  }

  const payload = (await res.json()) as { envs?: VercelEnvRaw[] };
  const out: VercelEnvVar[] = [];
  for (const e of payload.envs ?? []) {
    if (!e.key) continue;
    if (e.type === "system") continue;
    if (e.type !== "encrypted" && e.type !== "plain") continue;
    if (typeof e.value !== "string" || e.value.length === 0) continue;
    out.push({
      key: e.key,
      value: e.value,
      type: e.type,
      target: e.target ?? [],
    });
  }
  return out;
}
