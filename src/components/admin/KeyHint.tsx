import { cn } from "@/lib/utils";

interface KeyHintProps {
  children: React.ReactNode;
  className?: string;
}

export function KeyHint({ children, className }: KeyHintProps) {
  return (
    <kbd
      className={cn(
        "inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-[var(--radius-admin-sm)] border border-line bg-surface-panel-hi text-ink-muted",
        "font-[var(--font-admin-mono)] text-[10px] leading-none whitespace-nowrap",
        className,
      )}
    >
      {children}
    </kbd>
  );
}
