import Link from "next/link";
import { Panel } from "@/components/admin/Panel";
import { Stat, StatRow } from "@/components/admin/Stat";
import { Pill } from "@/components/admin/Pill";
import { StatusDot } from "@/components/admin/StatusDot";
import { KeyHint } from "@/components/admin/KeyHint";
import type { DashboardStats } from "@/lib/db/queries";
import type { ProjectStatus } from "@/lib/db/types";

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return `${Math.floor(days / 7)}w`;
}

function daysUntil(iso: string): string {
  const days = Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
  if (days <= 0) return "expired";
  return `${days}d`;
}

const healthDot: Record<ProjectStatus, "green" | "amber" | "muted"> = {
  active: "green",
  shipped: "amber",
  concept: "muted",
};

const shortcuts = [
  { keys: ["⌘K"], label: "Search" },
  { keys: ["⌘N"], label: "New project" },
  { keys: ["G", "P"], label: "Go to projects" },
  { keys: ["G", "C"], label: "Go to credentials" },
] as const;

export function DashboardClient({ stats }: { stats: DashboardStats }) {
  return (
    <div>
      <div className="mb-6">
        <h1
          className="text-[22px] font-medium text-ink leading-tight"
          style={{ letterSpacing: "-0.3px" }}
        >
          Overview
        </h1>
      </div>

      <StatRow className="mb-6">
        <Stat label="Active projects" value={stats.activeProjects} />
        <Stat label="Integrations" value={stats.totalIntegrations} divider />
        <Stat
          label="Credentials"
          value={stats.totalCredentials}
          delta={
            stats.expiringCredentials > 0
              ? `${stats.expiringCredentials} expiring`
              : undefined
          }
          deltaTone="amber"
          divider
        />
        <Stat label="Services" value={stats.runningServices} divider />
      </StatRow>

      <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 272px" }}>
        {/* Left column */}
        <div className="flex flex-col gap-4">
          <Panel title="Recent projects" pad={false}>
            {stats.recentProjects.length === 0 ? (
              <div className="px-4 py-3 text-[13px] text-ink-muted">
                No projects yet.
              </div>
            ) : (
              <ul>
                {stats.recentProjects.map((project, i) => (
                  <li
                    key={project.id}
                    className={i > 0 ? "border-t border-line" : ""}
                  >
                    <Link
                      href={`/admin/projects/${project.slug}`}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-[rgba(255,255,255,0.015)] transition-colors duration-100"
                    >
                      <StatusDot
                        tone={healthDot[project.status] ?? "muted"}
                      />
                      <span className="flex-1 min-w-0 text-[13px] text-ink truncate">
                        {project.name}
                      </span>
                      <Pill tone={project.status}>{project.status}</Pill>
                      <span className="font-[var(--font-admin-mono)] text-[11px] text-ink-faint tabular-nums ml-3 shrink-0">
                        {relativeTime(project.updated_at)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Activity" pad={false}>
            <div className="px-4 py-3 text-[13px] text-ink-muted">
              No recent activity.
            </div>
            {/* TODO: wire activity feed (MCP / deploy / secret events) */}
          </Panel>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">
          <Panel
            title="Attention"
            actions={
              <Link
                href="/admin/credentials"
                className="inline-flex items-center h-7 px-2.5 rounded-[var(--radius-admin-lg)] text-[12px] font-medium text-ink border border-line-strong bg-surface-panel hover:bg-surface-panel-hi transition-colors duration-100"
              >
                View all
              </Link>
            }
            pad={false}
          >
            {stats.expiringList.length === 0 ? (
              <div className="px-4 py-3 text-[13px] text-ink-muted">
                All credentials healthy.
              </div>
            ) : (
              <ul>
                {stats.expiringList.map((cred, i) => (
                  <li
                    key={cred.id}
                    className={`flex items-center gap-2 px-4 py-2.5 ${i > 0 ? "border-t border-line" : ""}`}
                  >
                    <span className="flex-1 min-w-0 text-[13px] text-ink truncate">
                      {cred.name}
                    </span>
                    {cred.project_name && (
                      <span className="text-[11px] text-ink-faint truncate max-w-[80px] shrink-0">
                        {cred.project_name}
                      </span>
                    )}
                    <Pill tone="warn">{daysUntil(cred.expires_at)}</Pill>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Shortcuts" pad={false}>
            <ul>
              {shortcuts.map((sc, i) => (
                <li
                  key={sc.label}
                  className={`flex items-center justify-between gap-3 px-4 py-2.5 ${i > 0 ? "border-t border-line" : ""}`}
                >
                  <span className="text-[13px] text-ink-muted">{sc.label}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    {sc.keys.map((k) => (
                      <KeyHint key={k}>{k}</KeyHint>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}
