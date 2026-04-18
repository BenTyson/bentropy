import {
  Activity,
  BarChart3,
  CreditCard,
  Database,
  Github,
  Globe,
  Server,
  Terminal,
  Triangle,
} from "lucide-react";
import type { ComponentType } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Integration, IntegrationType, SyncStatus } from "@/lib/db/types";

const typeMeta: Record<
  IntegrationType,
  { label: string; icon: ComponentType<{ className?: string }> }
> = {
  vercel: { label: "Vercel", icon: Triangle },
  github: { label: "GitHub", icon: Github },
  supabase: { label: "Supabase", icon: Database },
  stripe: { label: "Stripe", icon: CreditCard },
  railway: { label: "Railway", icon: Server },
  dns: { label: "DNS", icon: Globe },
  analytics: { label: "Analytics", icon: BarChart3 },
  local: { label: "Local", icon: Terminal },
};

const statusColors: Record<SyncStatus, string> = {
  ok: "bg-entropy-ordered text-white",
  stale: "bg-entropy-drifting text-white",
  error: "bg-entropy-chaos text-white",
};

function formatRelative(iso: string | null): string {
  if (!iso) return "Never synced";
  const delta = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(delta / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

function configSummary(integration: Integration): string | null {
  switch (integration.type) {
    case "vercel":
      return integration.config.vercel_project_id;
    case "github":
      return `${integration.config.owner}/${integration.config.repo}`;
    case "supabase":
      return integration.config.project_ref;
    case "stripe":
      return integration.config.account_id;
    case "railway":
      return integration.config.service_id;
    case "dns":
      return `${integration.config.provider}:${integration.config.zone_id}`;
    case "analytics":
      return `${integration.config.provider}:${integration.config.property_id}`;
    case "local":
      return `:${integration.config.port}`;
  }
}

export function IntegrationCard({ integration }: { integration: Integration }) {
  const meta = typeMeta[integration.type];
  const Icon = meta.icon;
  const summary = configSummary(integration);
  const status = integration.sync_status;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
            <CardTitle className="text-sm truncate">
              {integration.display_name || meta.label}
            </CardTitle>
          </div>
          {status ? (
            <Badge className={statusColors[status]}>{status}</Badge>
          ) : (
            <Badge variant="outline">pending</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {summary && (
          <div className="text-xs font-mono text-muted-foreground truncate">
            {summary}
          </div>
        )}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Activity className="w-3 h-3" />
            {formatRelative(integration.last_synced_at)}
          </div>
          <Button size="sm" variant="outline" disabled>
            Refresh
          </Button>
        </div>
        {integration.sync_error && (
          <p className="text-xs text-destructive line-clamp-2">
            {integration.sync_error}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export { typeMeta as integrationTypeMeta };
