import { cn } from "@/lib/utils";

interface ServiceDotProps {
  service: string;
  className?: string;
}

export function ServiceDot({ service, className }: ServiceDotProps) {
  const letter = (service?.[0] ?? "?").toUpperCase();
  return (
    <span
      title={service}
      className={cn(
        "inline-flex items-center justify-center w-[18px] h-[18px] rounded-[3px] border border-line bg-surface-bg",
        "text-[10px] text-ink-muted leading-none shrink-0",
        "font-[var(--font-admin-mono)]",
        className,
      )}
    >
      {letter}
    </span>
  );
}
