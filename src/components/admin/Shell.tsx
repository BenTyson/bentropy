"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  Plug,
  Building2,
  Key,
  Server,
  GitBranch,
  Lock,
  StickyNote,
  Search,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { KeyHint } from "./KeyHint";
import { StatusDot } from "./StatusDot";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  count?: number | string;
  warn?: boolean;
  exact?: boolean;
}

const workspace: NavItem[] = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/projects", label: "Projects", icon: FolderKanban },
  { href: "/admin/integrations", label: "Integrations", icon: Plug },
  { href: "/admin/provider-accounts", label: "Providers", icon: Building2 },
];

const resources: NavItem[] = [
  { href: "/admin/credentials", label: "Credentials", icon: Key },
  { href: "/admin/services", label: "Services", icon: Server },
  { href: "/admin/repos", label: "Repos", icon: GitBranch },
  { href: "/admin/logins", label: "Logins", icon: Lock },
  { href: "/admin/notes", label: "Notes", icon: StickyNote },
];

interface ShellProps {
  breadcrumb?: string[];
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export function Shell({ breadcrumb, title, subtitle, actions, children }: ShellProps) {
  return (
    <div className="min-h-screen bg-surface-bg text-ink flex">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar breadcrumb={breadcrumb} />
        <main className="flex-1 min-w-0 px-8 py-6">
          {(title || actions) && (
            <PageHeader title={title} subtitle={subtitle} actions={actions} />
          )}
          {children}
        </main>
      </div>
    </div>
  );
}

function Sidebar() {
  const pathname = usePathname() ?? "";
  return (
    <aside className="w-[232px] shrink-0 h-screen sticky top-0 border-r border-line bg-surface-panel flex flex-col">
      <div className="px-4 pt-4 pb-3 flex items-center gap-2.5">
        <span
          aria-hidden
          className="inline-flex items-center justify-center w-[26px] h-[26px] rounded-[6px] bg-[var(--accent)] text-[var(--accent-fg)] font-[var(--font-admin-mono)] text-[14px] font-medium leading-none"
        >
          b
        </span>
        <div className="flex flex-col leading-tight">
          <span className="text-[13px] font-medium text-ink">Bentropy</span>
          <span className="text-[11px] text-ink-faint">Workspace</span>
        </div>
      </div>

      <div className="px-3 pb-3">
        <SearchInput />
      </div>

      <nav className="flex-1 overflow-y-auto px-2 pb-4 flex flex-col gap-4">
        <NavSection label="Workspace" items={workspace} pathname={pathname} />
        <NavSection label="Resources" items={resources} pathname={pathname} />
      </nav>

      <SidebarFooter />
    </aside>
  );
}

function SearchInput() {
  return (
    <label className="group flex items-center gap-2 h-8 px-2.5 rounded-[var(--radius-admin-xl)] border border-line bg-surface-bg/40 hover:border-line-strong transition-colors duration-100">
      <Search size={14} strokeWidth={1.5} className="text-ink-faint" />
      <input
        type="text"
        placeholder="Search"
        className="flex-1 min-w-0 bg-transparent border-0 outline-none text-[12px] text-ink placeholder:text-ink-faint"
      />
      <KeyHint>⌘K</KeyHint>
    </label>
  );
}

function NavSection({
  label,
  items,
  pathname,
}: {
  label: string;
  items: NavItem[];
  pathname: string;
}) {
  return (
    <div>
      <div className="px-2.5 mb-1.5 text-[10px] font-medium uppercase tracking-[0.4px] text-ink-faint">
        {label}
      </div>
      <ul className="flex flex-col">
        {items.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "relative flex items-center gap-2.5 h-8 pl-2.5 pr-2 rounded-[var(--radius-admin-lg)] text-[13px] transition-colors duration-100",
                  isActive
                    ? "bg-surface-panel-hi text-ink"
                    : "text-ink-muted hover:text-ink hover:bg-surface-panel-hi/60",
                )}
              >
                {isActive && (
                  <span
                    aria-hidden
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4 rounded-r-sm bg-[var(--accent)]"
                  />
                )}
                <Icon
                  size={14}
                  strokeWidth={1.5}
                  className={isActive ? "text-ink" : "text-ink-muted"}
                />
                <span className="flex-1 truncate">{item.label}</span>
                {item.count !== undefined && (
                  <span
                    className={cn(
                      "font-[var(--font-admin-mono)] text-[10px] tabular-nums",
                      item.warn ? "text-[var(--amber)]" : "text-ink-faint",
                    )}
                  >
                    {item.count}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function SidebarFooter() {
  // Static placeholder sparkline — real uptime data wires in later
  const bars = React.useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => {
        const seed = (i * 13) % 7;
        return 60 + (seed * 5);
      }),
    [],
  );
  return (
    <div className="px-4 py-3 border-t border-line">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-medium uppercase tracking-[0.4px] text-ink-faint">
          System
        </span>
        <span className="font-[var(--font-admin-mono)] text-[11px] text-ink-muted tabular-nums">
          99.9%
        </span>
      </div>
      <div className="flex items-end gap-[2px] h-6">
        {bars.map((h, i) => (
          <span
            key={i}
            className="flex-1 rounded-[1px] bg-surface-panel-hi"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    </div>
  );
}

function TopBar({ breadcrumb }: { breadcrumb?: string[] }) {
  return (
    <header className="h-11 shrink-0 sticky top-0 z-10 border-b border-line bg-surface-bg/80 backdrop-blur-md flex items-center justify-between px-8">
      <div className="flex items-center gap-1.5 min-w-0 text-[12px] text-ink-muted">
        {breadcrumb?.length ? (
          breadcrumb.map((crumb, i) => (
            <React.Fragment key={`${crumb}-${i}`}>
              {i > 0 && (
                <ChevronRight size={12} strokeWidth={1.5} className="text-ink-faint" />
              )}
              <span
                className={cn(
                  "truncate",
                  i === breadcrumb.length - 1 ? "text-ink" : "text-ink-muted",
                )}
              >
                {crumb}
              </span>
            </React.Fragment>
          ))
        ) : (
          <span className="text-ink-faint">—</span>
        )}
      </div>
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1.5 text-[11px] text-ink-muted">
          <StatusDot tone="green" />
          <span>MCP</span>
        </span>
        <span className="font-[var(--font-admin-mono)] text-[11px] text-ink-faint tabular-nums">
          v0.1.0
        </span>
        <span
          aria-hidden
          className="w-[26px] h-[26px] rounded-full bg-surface-panel-hi border border-line"
        />
      </div>
    </header>
  );
}

function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-6 mb-6">
      <div className="min-w-0">
        {title && (
          <h1
            className="text-[22px] font-medium text-ink leading-tight"
            style={{ letterSpacing: "-0.3px" }}
          >
            {title}
          </h1>
        )}
        {subtitle && (
          <p className="text-[13px] text-ink-muted mt-1">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
