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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pill } from "@/components/admin/Pill";
import type { PillTone } from "@/components/admin/Pill";
import type { Integration, IntegrationType, SyncStatus } from "@/lib/db/types";
import { refreshIntegration } from "@/lib/db/actions";
import { RefreshButton } from "./RefreshButton";
import { IntegrationEditButton } from "./IntegrationEditButton";

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

const statusTone: Record<SyncStatus, PillTone> = {
  ok: "active",
  stale: "warn",
  error: "bad",
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
      return integration.config.service_id || integration.config.project_id;
    case "dns":
      return `${integration.config.provider}:${integration.config.zone_id}`;
    case "analytics":
      return `${integration.config.provider}:${integration.config.property_id}`;
    case "local":
      return `:${integration.config.port}`;
  }
}

export function IntegrationCard({
  integration,
  projectSlug,
}: {
  integration: Integration;
  projectSlug?: string;
}) {
  const meta = typeMeta[integration.type];
  const Icon = meta.icon;
  const summary = configSummary(integration);
  const status = integration.sync_status;
  const canRefresh = integration.type === "vercel" || integration.type === "railway";

  const refreshAction = refreshIntegration.bind(null, integration.id, projectSlug);

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
          <div className="flex items-center gap-1 shrink-0">
            {status ? (
              <Pill tone={statusTone[status]}>{status}</Pill>
            ) : (
              <Pill tone="concept">pending</Pill>
            )}
            <IntegrationEditButton
              integration={integration}
              projectSlug={projectSlug}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {summary && (
          <div className="text-xs font-[var(--font-admin-mono)] text-muted-foreground truncate">
            {summary}
          </div>
        )}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Activity className="w-3 h-3" />
            {formatRelative(integration.last_synced_at)}
          </div>
          <RefreshButton action={refreshAction} disabled={!canRefresh} />
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
