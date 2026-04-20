import "server-only";

export interface CloudflareZone {
  id: string;
  name: string;
}

interface CloudflareZonesResponse {
  success: boolean;
  result: { id: string; name: string }[];
  result_info: {
    page: number;
    per_page: number;
    total_count: number;
    total_pages: number;
  };
  errors: { code: number; message: string }[];
}

export async function fetchCloudflareZones(apiToken: string): Promise<CloudflareZone[]> {
  const zones: CloudflareZone[] = [];
  let page = 1;

  while (true) {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/zones?per_page=50&page=${page}`,
      {
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Cloudflare zones API error ${res.status}: ${body}`);
    }

    const data = (await res.json()) as CloudflareZonesResponse;

    if (!data.success) {
      const msg = data.errors?.[0]?.message ?? "unknown error";
      throw new Error(`Cloudflare zones API returned success=false: ${msg}`);
    }

    for (const zone of data.result) {
      zones.push({ id: zone.id, name: zone.name });
    }

    if (page >= data.result_info.total_pages) break;
    page += 1;
  }

  return zones;
}
