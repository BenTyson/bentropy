import * as React from "react";
import { cn } from "@/lib/utils";

interface IconBtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  danger?: boolean;
}

export const IconBtn = React.forwardRef<HTMLButtonElement, IconBtnProps>(
  ({ icon, danger, className, ...rest }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex h-7 w-7 items-center justify-center rounded-[var(--radius-admin-md)] text-ink-muted transition-colors duration-100",
          "hover:bg-surface-panel-hi",
          danger ? "hover:text-[var(--red)]" : "hover:text-ink",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40",
          "disabled:opacity-40 disabled:pointer-events-none",
          className,
        )}
        {...rest}
      >
        {icon}
      </button>
    );
  },
);
IconBtn.displayName = "IconBtn";
