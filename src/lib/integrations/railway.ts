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

export async function fetchRailwayDeploymentSnapshot(
  config: RailwayConfig,
  pat: string,
): Promise<RailwayDeploymentSnapshot> {
  if (!config.project_id || !config.service_id || !config.environment_id) {
    throw new Error(
      "Railway config missing project_id / service_id / environment_id",
    );
  }

  const res = await fetch(RAILWAY_GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${pat}`,
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
    throw new Error(
      `Railway API ${res.status} ${res.statusText}${body ? `: ${body.slice(0, 300)}` : ""}`,
    );
  }

  const payload = (await res.json()) as {
    data?: {
      deployments?: {
        edges?: Array<{ node?: RailwayDeploymentRaw }>;
      };
    };
    errors?: Array<{ message: string }>;
  };

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
