import { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-edge bg-surface p-5 ${className}`}>{children}</div>
  );
}

export function CardTitle({ children, sub }: { children: ReactNode; sub?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-sm font-semibold tracking-wide text-foreground uppercase">{children}</h2>
      {sub && <p className="mt-1 text-xs text-muted">{sub}</p>}
    </div>
  );
}

const badgeTones: Record<string, string> = {
  neutral: "bg-surface2 text-muted border-edge",
  accent: "bg-accent/10 text-accent border-accent/30",
  warn: "bg-warn/10 text-warn border-warn/30",
  danger: "bg-danger/10 text-danger border-danger/30",
  info: "bg-info/10 text-info border-info/30",
};

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: keyof typeof badgeTones }) {
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium ${badgeTones[tone]}`}>
      {children}
    </span>
  );
}

export function scoreTone(score: number, threshold = 75): "accent" | "warn" | "danger" {
  if (score >= threshold) return "accent";
  if (score >= threshold - 20) return "warn";
  return "danger";
}

const toneColor = { accent: "var(--accent)", warn: "var(--warn)", danger: "var(--danger)" };

/** SVG donut score ring, the signature visual of every report. */
export function ScoreRing({ score, size = 96, label, threshold = 75 }: { score: number; size?: number; label?: string; threshold?: number }) {
  const tone = scoreTone(score, threshold);
  const r = (size - 10) / 2;
  const c = 2 * Math.PI * r;
  const filled = (score / 100) * c;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth="7" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={toneColor[tone]}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${c - filled}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" fill="var(--foreground)" fontSize={size / 4} fontWeight="700">
          {score}
        </text>
      </svg>
      {label && <span className="text-[11px] font-medium tracking-wide text-muted uppercase">{label}</span>}
    </div>
  );
}

export function Bar({ value, tone }: { value: number; tone?: "accent" | "warn" | "danger" }) {
  const t = tone ?? scoreTone(value);
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface2">
      <div className="h-full rounded-full" style={{ width: `${Math.min(value, 100)}%`, background: toneColor[t] }} />
    </div>
  );
}

export function EmptyState({ title, hint, action }: { title: string; hint: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-edge-strong py-16 text-center">
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="mt-1 max-w-sm text-xs text-muted">{hint}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export const inputCls =
  "w-full rounded-lg border border-edge bg-surface2 px-3 py-2 text-sm text-foreground placeholder-faint outline-none transition focus:border-accent/60 focus:ring-1 focus:ring-accent/30";

export const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-accent-dim px-4 py-2 text-sm font-semibold text-[#06281c] transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40";

export const btnSecondary =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-edge-strong bg-surface2 px-4 py-2 text-sm font-medium text-foreground transition hover:border-accent/50 hover:text-accent disabled:cursor-not-allowed disabled:opacity-40";

export const btnDanger =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-danger/40 bg-danger/10 px-3 py-1.5 text-xs font-medium text-danger transition hover:bg-danger/20";
