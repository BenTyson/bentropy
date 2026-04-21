import * as React from "react";
import { cn } from "@/lib/utils";

export type PillTone =
  | "active"
  | "shipped"
  | "concept"
  | "warn"
  | "bad"
  | "default";

interface PillProps {
  tone?: PillTone;
  children: React.ReactNode;
  className?: string;
}

const toneStyle: Record<PillTone, React.CSSProperties> = {
  active: {
    background: "color-mix(in oklab, var(--green) 14%, var(--panel))",
    color: "color-mix(in oklab, var(--green) 80%, var(--text))",
    borderColor: "color-mix(in oklab, var(--green) 22%, var(--border))",
  },
  shipped: {
    background: "color-mix(in oklab, var(--accent) 12%, var(--panel))",
    color: "color-mix(in oklab, var(--accent) 70%, var(--text))",
    borderColor: "color-mix(in oklab, var(--accent) 18%, var(--border))",
  },
  concept: {
    background: "var(--panel-hi)",
    color: "var(--muted)",
    borderColor: "var(--border)",
  },
  warn: {
    background: "color-mix(in oklab, var(--amber) 14%, var(--panel))",
    color: "color-mix(in oklab, var(--amber) 80%, var(--text))",
    borderColor: "color-mix(in oklab, var(--amber) 22%, var(--border))",
  },
  bad: {
    background: "color-mix(in oklab, var(--red) 14%, var(--panel))",
    color: "color-mix(in oklab, var(--red) 80%, var(--text))",
    borderColor: "color-mix(in oklab, var(--red) 22%, var(--border))",
  },
  default: {
    background: "var(--panel-hi)",
    color: "var(--text)",
    borderColor: "var(--border)",
  },
};

export function Pill({ tone = "default", children, className }: PillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center h-[18px] px-2 rounded-[var(--radius-admin-md)] border text-[11px] font-medium lowercase leading-none whitespace-nowrap",
        className,
      )}
      style={toneStyle[tone]}
    >
      {children}
    </span>
  );
}
