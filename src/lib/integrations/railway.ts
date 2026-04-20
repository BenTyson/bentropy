import "server-only";

import type { RailwayConfig } from "@/lib/db/types";

export interface RailwayDeploymentSnapshot {
  deployment_id: string | null;
  status: string | null;
  url: string | null;
  created_at: string | null;
  static_url: string | null;
  meta: Record<string, unknown> | null;
  raw: Record<string, unknown>;
}

const RAILWAY_GRAPHQL_ENDPOINT = "https://backboard.railway.com/graphql/v2";

const LATEST_DEPLOYMENT_QUERY = /* GraphQL */ `
  query LatestDeployment(
    $projectId: String!
    $serviceId: String!
    $environmentId: String!
  ) {
    deployments(
      first: 1
      input: {
        projectId: $projectId
        serviceId: $serviceId
        environmentId: $environmentId
      }
    ) {
      edges {
        node {
          id
          status
          createdAt
          staticUrl
          url
          meta
        }
      }
    }
  }
`;

interface RailwayDeploymentRaw {
  id?: string;
  status?: string;
  createdAt?: string;
  staticUrl?: string;
  url?: string;
  meta?: Record<string, unknown>;
}

type RailwayGraphQLResponse = {
  data?: {
    deployments?: {
      edges?: Array<{ node?: RailwayDeploymentRaw }>;
    };
  };
  errors?: Array<{ message: string }>;
};

async function railwayPost(
  headers: Record<string, string>,
  config: RailwayConfig,
): Promise<{ httpStatus: number; payload: RailwayGraphQLResponse; body?: string }> {
  const res = await fetch(RAILWAY_GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      ...headers,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    cache: "no-store",
    body: JSON.stringify({
      query: LATEST_DEPLOYMENT_QUERY,
      variables: {
        projectId: config.project_id,
        serviceId: config.service_id,
        environmentId: config.environment_id,
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    return { httpStatus: res.status, payload: {}, body };
  }

  const payload = (await res.json()) as RailwayGraphQLResponse;
  return { httpStatus: res.status, payload };
}

function isAuthError(result: {
  httpStatus: number;
  payload: RailwayGraphQLResponse;
}): boolean {
  if (result.httpStatus === 401 || result.httpStatus === 403) return true;
  const msg = result.payload.errors?.map((e) => e.message).join(" ") ?? "";
  return /not authorized|unauthorized|problem processing request/i.test(msg);
}

export async function fetchRailwayDeploymentSnapshot(
  config: RailwayConfig,
  pat: string,
): Promise<RailwayDeploymentSnapshot> {
  if (!config.project_id || !config.service_id || !config.environment_id) {
    throw new Error(
      "Railway config missing project_id / service_id / environment_id",
    );
  }

  // Railway has two token types with different headers:
  //   - Project token (created from a project's Tokens settings): Project-Access-Token
  //   - Account / team token (account/tokens): Authorization: Bearer
  // Try project-token first (more common for per-project integrations); fall
  // back to bearer on auth failure. Only one extra request on mis-match.
  let result = await railwayPost({ "Project-Access-Token": pat }, config);
  if (isAuthError(result)) {
    result = await railwayPost({ Authorization: `Bearer ${pat}` }, config);
  }

  if (result.httpStatus < 200 || result.httpStatus >= 300) {
    throw new Error(
      `Railway API ${result.httpStatus}${result.body ? `: ${result.body.slice(0, 300)}` : ""}`,
    );
  }

  const payload = result.payload;

  if (payload.errors?.length) {
    throw new Error(
      `Railway GraphQL error: ${payload.errors.map((e) => e.message).join("; ")}`,
    );
  }

  const latest = payload.data?.deployments?.edges?.[0]?.node;

  if (!latest) {
    return {
      deployment_id: null,
      status: null,
      url: null,
      created_at: null,
      static_url: null,
      meta: null,
      raw: (payload.data ?? {}) as Record<string, unknown>,
    };
  }

  return {
    deployment_id: latest.id ?? null,
    status: latest.status ?? null,
    url: latest.url ?? latest.staticUrl ?? null,
    created_at: latest.createdAt ?? null,
    static_url: latest.staticUrl ?? null,
    meta: latest.meta ?? null,
    raw: latest as unknown as Record<string, unknown>,
  };
}

// --- M6 Session B: project + variables autopull ----------------------------

export interface RailwayProjectSummary {
  id: string;
  name: string;
}

const PROJECTS_QUERY = /* GraphQL */ `
  query ProjectsForWorkspace($teamId: String) {
    projects(teamId: $teamId) {
      edges {
        node {
          id
          name
        }
      }
    }
  }
`;

const VARIABLES_QUERY = /* GraphQL */ `
  query Variables(
    $projectId: String!
    $environmentId: String!
    $serviceId: String!
  ) {
    variables(
      projectId: $projectId
      environmentId: $environmentId
      serviceId: $serviceId
    )
  }
`;

type RailwayAuthHeaders = Record<string, string>;

async function railwayGraphql<T>(
  query: string,
  variables: Record<string, unknown>,
  pat: string,
): Promise<T> {
  // Account/team tokens want Authorization: Bearer. Project tokens want
  // Project-Access-Token. Listing projects and cross-service variables both
  // need an account/team scope — project tokens won't authorize `projects`.
  // Try bearer first here; fall back to project-token for parity with the
  // deployment client.
  const body = JSON.stringify({ query, variables });

  async function post(headers: RailwayAuthHeaders) {
    const res = await fetch(RAILWAY_GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      cache: "no-store",
      body,
    });
    const status = res.status;
    let payload: { data?: T; errors?: Array<{ message: string }> } = {};
    let raw = "";
    if (status >= 200 && status < 300) {
      payload = await res.json();
    } else {
      raw = await res.text().catch(() => "");
    }
    return { status, payload, raw };
  }

  let result = await post({ Authorization: `Bearer ${pat}` });
  const errMsg = result.payload.errors?.map((e) => e.message).join(" ") ?? "";
  if (
    result.status === 401 ||
    result.status === 403 ||
    /not authorized|unauthorized|problem processing request/i.test(errMsg)
  ) {
    result = await post({ "Project-Access-Token": pat });
  }

  if (result.status < 200 || result.status >= 300) {
    throw new Error(
      `Railway API ${result.status}${result.raw ? `: ${result.raw.slice(0, 300)}` : ""}`,
    );
  }
  if (result.payload.errors?.length) {
    throw new Error(
      `Railway GraphQL error: ${result.payload.errors.map((e) => e.message).join("; ")}`,
    );
  }
  if (!result.payload.data) {
    throw new Error("Railway GraphQL returned no data");
  }
  return result.payload.data;
}

export async function fetchRailwayProjectsForWorkspace(
  pat: string,
  workspaceId: string | null,
): Promise<RailwayProjectSummary[]> {
  const data = await railwayGraphql<{
    projects?: { edges?: Array<{ node?: { id?: string; name?: string } }> };
  }>(PROJECTS_QUERY, { teamId: workspaceId ?? null }, pat);

  const out: RailwayProjectSummary[] = [];
  for (const edge of data.projects?.edges ?? []) {
    const node = edge.node;
    if (node?.id && node?.name) out.push({ id: node.id, name: node.name });
  }
  return out;
}

export async function fetchRailwayVariables(
  pat: string,
  projectId: string,
  environmentId: string,
  serviceId: string,
): Promise<Record<string, string>> {
  const data = await railwayGraphql<{ variables?: Record<string, string> }>(
    VARIABLES_QUERY,
    { projectId, environmentId, serviceId },
    pat,
  );
  const raw = data.variables ?? {};
  // Railway sometimes includes null-valued keys for referenced-but-unset vars.
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (typeof v === "string" && v.length > 0) out[k] = v;
  }
  return out;
}
