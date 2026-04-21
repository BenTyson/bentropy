"use client";

import { cn } from "@/lib/utils";

interface SegControlProps<T extends string> {
  options: readonly T[];
  active: T;
  onChange?: (value: T) => void;
  className?: string;
  renderLabel?: (value: T) => React.ReactNode;
}

export function SegControl<T extends string>({
  options,
  active,
  onChange,
  className,
  renderLabel,
}: SegControlProps<T>) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-0.5 p-0.5 rounded-[var(--radius-admin-xl)] border border-line bg-surface-panel",
        className,
      )}
    >
      {options.map((opt) => {
        const isActive = opt === active;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange?.(opt)}
            className={cn(
              "h-6 px-2.5 rounded-[var(--radius-admin-md)] text-[12px] font-medium leading-none transition-colors duration-100",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40",
              isActive
                ? "bg-surface-panel-hi text-ink"
                : "text-ink-muted hover:text-ink",
            )}
          >
            {renderLabel ? renderLabel(opt) : opt}
          </button>
        );
      })}
    </div>
  );
}
