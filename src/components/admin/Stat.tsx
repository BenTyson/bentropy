import { cn } from "@/lib/utils";

type DeltaTone = "muted" | "amber" | "red" | "green";

interface StatProps {
  label: string;
  value: string | number;
  delta?: string;
  deltaTone?: DeltaTone;
  sub?: string;
  divider?: boolean;
  className?: string;
}

const deltaColor: Record<DeltaTone, string> = {
  muted: "var(--muted)",
  amber: "var(--amber)",
  red: "var(--red)",
  green: "var(--green)",
};

export function Stat({
  label,
  value,
  delta,
  deltaTone = "muted",
  sub,
  divider,
  className,
}: StatProps) {
  return (
    <div
      className={cn(
        "px-5 py-4 flex flex-col gap-1.5",
        divider && "border-l border-line",
        className,
      )}
    >
      <div className="text-[11px] font-medium uppercase tracking-[0.4px] text-ink-muted">
        {label}
      </div>
      <div className="flex items-baseline gap-2">
        <span
          className="font-[var(--font-admin-mono)] text-[30px] leading-none text-ink"
          style={{ fontVariantNumeric: "tabular-nums", letterSpacing: "-0.5px" }}
        >
          {value}
        </span>
        {delta && (
          <span
            className="font-[var(--font-admin-mono)] text-[11px] leading-none"
            style={{
              fontVariantNumeric: "tabular-nums",
              color: deltaColor[deltaTone],
            }}
          >
            {delta}
          </span>
        )}
      </div>
      {sub && <div className="text-[12px] text-ink-faint">{sub}</div>}
    </div>
  );
}

interface StatRowProps {
  children: React.ReactNode;
  className?: string;
}

export function StatRow({ children, className }: StatRowProps) {
  const items = Array.isArray(children) ? children : [children];
  return (
    <div
      className={cn(
        "border border-line rounded-[var(--radius-admin-2xl)] bg-surface-panel grid",
        className,
      )}
      style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
    >
      {children}
    </div>
  );
}
