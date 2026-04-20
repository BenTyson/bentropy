"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FolderKanban,
  Key,
  Server,
  GitBranch,
  Lock,
  StickyNote,
  LogOut,
  Gauge,
  Plug,
  Building2,
} from "lucide-react";
import { motion } from "framer-motion";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/projects", label: "Projects", icon: FolderKanban },
  { href: "/admin/integrations", label: "Integrations", icon: Plug },
  { href: "/admin/provider-accounts", label: "Providers", icon: Building2 },
  { href: "/admin/credentials", label: "Credentials", icon: Key },
  { href: "/admin/services", label: "Services", icon: Server },
  { href: "/admin/repos", label: "Repositories", icon: GitBranch },
  { href: "/admin/logins", label: "Logins", icon: Lock },
  { href: "/admin/notes", label: "Notes", icon: StickyNote },
];

interface SidebarProps {
  entropyLevel?: number; // 0-100
}

export function Sidebar({ entropyLevel = 42 }: SidebarProps) {
  const pathname = usePathname();

  const getEntropyColor = (level: number) => {
    if (level < 30) return "text-entropy-ordered";
    if (level < 70) return "text-entropy-drifting";
    return "text-entropy-chaos";
  };

  const getEntropyLabel = (level: number) => {
    if (level < 30) return "Ordered";
    if (level < 70) return "Drifting";
    return "Chaos";
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold gradient-text">Bentropy</span>
          <span className="text-xs text-muted-foreground">Admin</span>
        </Link>
      </div>

      {/* Entropy Meter */}
      <div className="px-6 py-4 border-b border-sidebar-border">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Gauge className={cn("w-4 h-4", getEntropyColor(entropyLevel))} />
            <span className="text-xs text-muted-foreground">Entropy Level</span>
          </div>
          <span className={cn("text-xs font-medium", getEntropyColor(entropyLevel))}>
            {getEntropyLabel(entropyLevel)}
          </span>
        </div>
        <div className="h-2 bg-surface-2 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${entropyLevel}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={cn(
              "h-full rounded-full",
              entropyLevel < 30
                ? "bg-entropy-ordered"
                : entropyLevel < 70
                ? "bg-entropy-drifting"
                : "bg-entropy-chaos"
            )}
          />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors relative",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="admin-nav-indicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-accent-blue rounded-r"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Back to Site
        </Link>
      </div>
    </aside>
  );
}
