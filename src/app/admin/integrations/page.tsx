import Link from "next/link";
import { Plug } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IntegrationCard } from "@/components/admin/IntegrationCard";
import { getAllIntegrations } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export default async function IntegrationsPage() {
  const integrations = await getAllIntegrations();

  const byProject = new Map<
    string,
    { slug: string; name: string; rows: typeof integrations }
  >();
  for (const row of integrations) {
    if (!row.project_slug || !row.project_name) continue;
    const key = row.project_slug;
    const existing = byProject.get(key);
    if (existing) {
      existing.rows.push(row);
    } else {
      byProject.set(key, {
        slug: row.project_slug,
        name: row.project_name,
        rows: [row],
      });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Integrations</h1>
        <p className="text-muted-foreground">
          Every connected service across every project.
        </p>
      </div>

      {byProject.size === 0 ? (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Plug className="w-4 h-4 text-muted-foreground" />
              <CardTitle>No integrations yet</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Visit a project detail page and click "Add integration".
            </p>
          </CardContent>
        </Card>
      ) : (
        Array.from(byProject.values()).map((group) => (
          <Card key={group.slug}>
            <CardHeader>
              <Link
                href={`/admin/projects/${group.slug}`}
                className="flex items-center gap-2 hover:underline"
              >
                <CardTitle>{group.name}</CardTitle>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {group.rows.map((integration) => (
                  <IntegrationCard key={integration.id} integration={integration} />
                ))}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
