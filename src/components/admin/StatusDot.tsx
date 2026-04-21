type Tone = "green" | "amber" | "red" | "muted";

interface StatusDotProps {
  tone: Tone;
  size?: number;
  className?: string;
}

const toneVar: Record<Tone, string> = {
  green: "var(--green)",
  amber: "var(--amber)",
  red: "var(--red)",
  muted: "var(--faint)",
};

export function StatusDot({ tone, size = 6, className }: StatusDotProps) {
  return (
    <span
      aria-hidden
      className={`inline-block rounded-full shrink-0 ${className ?? ""}`}
      style={{
        width: size,
        height: size,
        background: toneVar[tone],
      }}
    />
  );
}
