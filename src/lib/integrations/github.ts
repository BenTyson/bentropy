import "server-only";

import type { GithubConfig } from "@/lib/db/types";

export interface GithubPull {
  number: number;
  title: string;
  user: string | null;
  updated_at: string | null;
}

export interface GithubSnapshot {
  default_branch: string | null;
  last_pushed_at: string | null;
  stars: number | null;
  open_issues_count: number | null;
  open_pr_count: number;
  latest_commit_sha: string | null;
  pulls: GithubPull[];
  raw_repo: Record<string, unknown>;
  raw_pulls: Record<string, unknown>[];
  raw_commit: Record<string, unknown> | null;
}

async function githubFetch(
  url: string,
  pat: string,
): Promise<Response> {
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${pat}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    cache: "no-store",
  });

  const remaining = res.headers.get("X-RateLimit-Remaining");
  if (remaining !== null && parseInt(remaining, 10) < 100) {
    console.warn(
      `[github] rate limit low: ${remaining} requests remaining (resets ${res.headers.get("X-RateLimit-Reset")})`,
    );
  }

  return res;
}

export async function fetchGithubSnapshot(
  config: GithubConfig,
  pat: string,
): Promise<GithubSnapshot> {
  const { owner, repo } = config;
  const base = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;

  const [repoRes, pullsRes, commitRes] = await Promise.all([
    githubFetch(base, pat),
    githubFetch(`${base}/pulls?state=open&per_page=20`, pat),
    githubFetch(`${base}/commits?per_page=1`, pat),
  ]);

  if (!repoRes.ok) {
    const body = await repoRes.text().catch(() => "");
    if (repoRes.status === 404) {
      throw new Error(
        `GitHub API 404: repo '${owner}/${repo}' not found or PAT lacks 'repo' scope. Check the integration config and credential.`,
      );
    }
    throw new Error(
      `GitHub API ${repoRes.status} ${repoRes.statusText}${body ? `: ${body.slice(0, 300)}` : ""}`,
    );
  }

  const repoData = (await repoRes.json()) as Record<string, unknown>;

  let pullsData: Record<string, unknown>[] = [];
  if (pullsRes.ok) {
    pullsData = (await pullsRes.json()) as Record<string, unknown>[];
  }

  let rawCommit: Record<string, unknown> | null = null;
  if (commitRes.ok) {
    const commits = (await commitRes.json()) as Record<string, unknown>[];
    rawCommit = commits[0] ?? null;
  }

  const pulls: GithubPull[] = pullsData.map((pr) => ({
    number: (pr.number as number) ?? 0,
    title: (pr.title as string) ?? "",
    user:
      pr.user && typeof pr.user === "object"
        ? ((pr.user as Record<string, unknown>).login as string) ?? null
        : null,
    updated_at: (pr.updated_at as string) ?? null,
  }));

  return {
    default_branch: (repoData.default_branch as string) ?? null,
    last_pushed_at: (repoData.pushed_at as string) ?? null,
    stars: (repoData.stargazers_count as number) ?? null,
    open_issues_count: (repoData.open_issues_count as number) ?? null,
    open_pr_count: pulls.length,
    latest_commit_sha:
      rawCommit && typeof rawCommit.sha === "string" ? rawCommit.sha : null,
    pulls,
    raw_repo: repoData,
    raw_pulls: pullsData,
    raw_commit: rawCommit,
  };
}
