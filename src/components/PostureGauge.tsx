import type { PostureStatus } from '../lib/types';

interface Props {
  /** flex value 0–1023 */
  value: number;
  goodMax: number;
  badMin: number;
  status: PostureStatus;
}

/**
 * Circular gauge that fills based on how far the current flex value sits
 * between the calibrated "upright" and "slouching" thresholds.
 */
export default function PostureGauge({ value, goodMax, badMin, status }: Props) {
  const min = Math.max(0, goodMax - 100);
  const max = badMin + 100;
  const pct = clamp((value - min) / (max - min), 0, 1);

  const radius = 88;
  const stroke = 14;
  const c = 2 * Math.PI * radius;
  const dash = c * pct;

  const color =
    status === 'good'      ? 'stroke-brand-500'
    : status === 'slouching' ? 'stroke-rose-500'
    : 'stroke-slate-300';

  const label =
    status === 'good'      ? 'Upright'
    : status === 'slouching' ? 'Slouching'
    : 'Calibrating';

  return (
    <div className="relative w-[220px] h-[220px]">
      <svg viewBox="0 0 220 220" className="-rotate-90 w-full h-full">
        <circle
          cx="110" cy="110" r={radius}
          className="stroke-slate-100"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx="110" cy="110" r={radius}
          className={`${color} transition-all duration-500`}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="text-3xl font-semibold">{label}</div>
          <div className="text-sm text-sub mt-1">flex {value}</div>
        </div>
      </div>
    </div>
  );
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}
