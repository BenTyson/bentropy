import "server-only";

export interface UmamiWebsite {
  id: string;
  name: string;
  domain: string;
}

interface UmamiAuthResponse {
  token: string;
}

export async function fetchUmamiWebsites(
  baseUrl: string,
  username: string,
  password: string,
): Promise<UmamiWebsite[]> {
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!loginRes.ok) {
    const body = await loginRes.text();
    throw new Error(`Umami auth error ${loginRes.status}: ${body}`);
  }
  const authData = (await loginRes.json()) as UmamiAuthResponse;
  const token = authData.token;

  // pageSize=999 to get all websites in one shot (self-hosted instances are small)
  const sitesRes = await fetch(`${baseUrl}/api/websites?pageSize=999`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!sitesRes.ok) {
    const body = await sitesRes.text();
    throw new Error(`Umami websites API error ${sitesRes.status}: ${body}`);
  }

  const raw = (await sitesRes.json()) as
    | { data: { id: string; name: string; domain: string }[] }
    | { id: string; name: string; domain: string }[];

  const list = Array.isArray(raw) ? raw : (raw.data ?? []);

  return list.map((site) => ({ id: site.id, name: site.name, domain: site.domain }));
}
