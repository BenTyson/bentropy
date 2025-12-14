"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FolderKanban,
  Key,
  Server,
  GitBranch,
  AlertTriangle,
  Clock,
  Zap,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

// Placeholder stats - would come from Supabase
const stats = {
  activeProjects: 4,
  totalCredentials: 12,
  runningServices: 3,
  repositories: 8,
  expiringCredentials: 2,
  recentActivity: [
    { type: "project", action: "Updated QR Forge", time: "2 hours ago" },
    { type: "credential", action: "Added Vercel API key", time: "5 hours ago" },
    { type: "service", action: "Started dev server on :3000", time: "1 day ago" },
    { type: "note", action: "Created implementation notes", time: "2 days ago" },
  ],
};

const quickActions = [
  { label: "New Project", href: "/admin/projects/new", icon: FolderKanban },
  { label: "Add Credential", href: "/admin/credentials/new", icon: Key },
  { label: "Track Service", href: "/admin/services/new", icon: Server },
  { label: "Link Repo", href: "/admin/repos/new", icon: GitBranch },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold mb-2">Command Center</h1>
        <p className="text-muted-foreground">
          Your war room against entropy. Monitor, manage, and maintain order.
        </p>
      </motion.div>

      {/* Alert Banner */}
      {stats.expiringCredentials > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 rounded-lg bg-entropy-drifting/10 border border-entropy-drifting/30 flex items-center gap-3"
        >
          <AlertTriangle className="w-5 h-5 text-entropy-drifting" />
          <span className="text-sm">
            <strong>{stats.expiringCredentials} credentials</strong> expiring soon.{" "}
            <Link
              href="/admin/credentials"
              className="text-accent-blue hover:underline"
            >
              Review now
            </Link>
          </span>
        </motion.div>
      )}

      {/* Stats Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Link href="/admin/projects">
            <Card className="hover:border-accent-blue/50 transition-colors cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Active Projects
                </CardTitle>
                <FolderKanban className="w-4 h-4 text-accent-blue" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeProjects}</div>
                <p className="text-xs text-muted-foreground">
                  victories against entropy
                </p>
              </CardContent>
            </Card>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Link href="/admin/credentials">
            <Card className="hover:border-accent-violet/50 transition-colors cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Credentials
                </CardTitle>
                <Key className="w-4 h-4 text-accent-violet" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalCredentials}</div>
                <p className="text-xs text-muted-foreground">
                  API keys & secrets stored
                </p>
              </CardContent>
            </Card>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Link href="/admin/services">
            <Card className="hover:border-entropy-ordered/50 transition-colors cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Running Services
                </CardTitle>
                <Server className="w-4 h-4 text-entropy-ordered" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.runningServices}</div>
                <p className="text-xs text-muted-foreground">
                  local dev servers active
                </p>
              </CardContent>
            </Card>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Link href="/admin/repos">
            <Card className="hover:border-accent-cyan/50 transition-colors cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Repositories
                </CardTitle>
                <GitBranch className="w-4 h-4 text-accent-cyan" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.repositories}</div>
                <p className="text-xs text-muted-foreground">linked GitHub repos</p>
              </CardContent>
            </Card>
          </Link>
        </motion.div>
      </div>

      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
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
              <div className="grid grid-cols-2 gap-3">
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

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-accent-violet" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.recentActivity.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 border-b border-border last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <Badge
                        variant="outline"
                        className="text-xs capitalize bg-surface-1"
                      >
                        {activity.type}
                      </Badge>
                      <span className="text-sm">{activity.action}</span>
                    </div>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {activity.time}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Entropy Status */}
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
                  Drifting
                </span>{" "}
                — {stats.expiringCredentials} credentials need attention,{" "}
                {stats.runningServices} services running
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
