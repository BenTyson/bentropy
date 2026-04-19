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
