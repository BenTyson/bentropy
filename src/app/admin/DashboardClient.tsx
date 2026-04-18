"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FolderKanban,
  Key,
  Server,
  GitBranch,
  AlertTriangle,
  Zap,
} from "lucide-react";
import Link from "next/link";
import type { DashboardStats } from "@/lib/db/queries";

const quickActions = [
  { label: "New Project", href: "/admin/projects", icon: FolderKanban },
  { label: "Add Credential", href: "/admin/credentials", icon: Key },
  { label: "Track Service", href: "/admin/services", icon: Server },
  { label: "Link Repo", href: "/admin/repos", icon: GitBranch },
];

export function DashboardClient({ stats }: { stats: DashboardStats }) {
  const entropyLabel =
    stats.expiringCredentials === 0 && stats.runningServices > 0
      ? "Ordered"
      : stats.expiringCredentials > 0
        ? "Drifting"
        : "Quiet";

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold mb-2">Command Center</h1>
        <p className="text-muted-foreground">
          Your war room against entropy. Monitor, manage, and maintain order.
        </p>
      </motion.div>

      {stats.expiringCredentials > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 rounded-lg bg-entropy-drifting/10 border border-entropy-drifting/30 flex items-center gap-3"
        >
          <AlertTriangle className="w-5 h-5 text-entropy-drifting" />
          <span className="text-sm">
            <strong>{stats.expiringCredentials} credential{stats.expiringCredentials === 1 ? "" : "s"}</strong>{" "}
            expiring within 14 days.{" "}
            <Link
              href="/admin/credentials"
              className="text-accent-blue hover:underline"
            >
              Review now
            </Link>
          </span>
        </motion.div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          href="/admin/projects"
          title="Active Projects"
          value={stats.activeProjects}
          subtitle="victories against entropy"
          icon={FolderKanban}
          accent="text-accent-blue"
          delay={0.1}
        />
        <StatCard
          href="/admin/credentials"
          title="Credentials"
          value={stats.totalCredentials}
          subtitle="API keys & secrets stored"
          icon={Key}
          accent="text-accent-violet"
          delay={0.15}
        />
        <StatCard
          href="/admin/services"
          title="Running Services"
          value={stats.runningServices}
          subtitle="local dev servers active"
          icon={Server}
          accent="text-entropy-ordered"
          delay={0.2}
        />
        <StatCard
          href="/admin/repos"
          title="Repositories"
          value={stats.repositories}
          subtitle="linked GitHub repos"
          icon={GitBranch}
          accent="text-accent-cyan"
          delay={0.25}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-accent-blue" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {quickActions.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="flex items-center gap-3 p-3 rounded-lg bg-surface-1 hover:bg-surface-2 transition-colors"
                >
                  <action.icon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{action.label}</span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="bg-gradient-to-r from-surface-1 to-surface-2">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-muted-foreground mb-2">Current entropy status:</p>
              <p className="text-lg">
                <span className="text-entropy-drifting font-semibold">
                  {entropyLabel}
                </span>
                {stats.expiringCredentials > 0 && (
                  <> — {stats.expiringCredentials} credential{stats.expiringCredentials === 1 ? "" : "s"} need attention,{" "}
                  {stats.runningServices} service{stats.runningServices === 1 ? "" : "s"} running</>
                )}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Keep pushing back against the chaos.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

function StatCard({
  href,
  title,
  value,
  subtitle,
  icon: Icon,
  accent,
  delay,
}: {
  href: string;
  title: string;
  value: number;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Link href={href}>
        <Card className="hover:border-accent-blue/50 transition-colors cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {title}
            </CardTitle>
            <Icon className={`w-4 h-4 ${accent}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{value}</div>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
