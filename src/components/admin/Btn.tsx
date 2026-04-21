import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md";

interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: React.ReactNode;
  asChild?: boolean;
}

const base =
  "inline-flex items-center gap-1.5 rounded-[var(--radius-admin-lg)] font-medium select-none whitespace-nowrap transition-colors duration-100 disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40";

const variants: Record<Variant, string> = {
  primary:
    "bg-[var(--accent)] text-[var(--accent-fg)] border border-[var(--accent)] hover:brightness-110",
  secondary:
    "bg-surface-panel text-ink border border-line-strong hover:bg-surface-panel-hi",
  ghost: "bg-transparent text-ink hover:bg-surface-panel-hi",
};

const sizes: Record<Size, string> = {
  sm: "h-7 px-2.5 text-[12px]",
  md: "h-8 px-3.5 text-[13px]",
};

export const Btn = React.forwardRef<HTMLButtonElement, BtnProps>(
  ({ variant = "primary", size = "md", icon, className, children, ...rest }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        {...rest}
      >
        {icon && <span className="-ml-0.5 inline-flex shrink-0">{icon}</span>}
        {children}
      </button>
    );
  },
);
Btn.displayName = "Btn";
