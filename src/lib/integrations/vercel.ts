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
