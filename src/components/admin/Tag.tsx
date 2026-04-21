import * as React from "react";
import { cn } from "@/lib/utils";

interface TagProps {
  children: React.ReactNode;
  className?: string;
}

export function Tag({ children, className }: TagProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center h-[18px] px-1.5 rounded-[var(--radius-admin-sm)] border border-line text-[11px] text-ink-muted whitespace-nowrap",
        "font-[var(--font-admin-mono)] [font-variant-numeric:tabular-nums]",
        className,
      )}
    >
      {children}
    </span>
  );
}
