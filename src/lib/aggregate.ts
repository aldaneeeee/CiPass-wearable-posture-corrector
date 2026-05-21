import type { DailySummary, PostureReading } from './types';

const MS_PER_MIN = 60_000;

function dayKey(t: number): string {
  const d = new Date(t);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Each reading represents ~1 second of posture. We aggregate by day, counting
 * good vs slouching seconds and converting to minutes.
 */
export function summarizeByDay(rs: PostureReading[]): DailySummary[] {
  const byDay = new Map<string, { good: number; bad: number }>();

  for (const r of rs) {
    const k = dayKey(r.t);
    const cur = byDay.get(k) ?? { good: 0, bad: 0 };
    if (r.status === 'good') cur.good += 1;
    else if (r.status === 'slouching') cur.bad += 1;
    byDay.set(k, cur);
  }

  return [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, v]) => {
      const goodMinutes = v.good / 60;
      const slouchingMinutes = v.bad / 60;
      const totalMinutes = goodMinutes + slouchingMinutes;
      return {
        day,
        goodMinutes: round1(goodMinutes),
        slouchingMinutes: round1(slouchingMinutes),
        totalMinutes: round1(totalMinutes),
        goodPct: totalMinutes > 0 ? Math.round((goodMinutes / totalMinutes) * 100) : 0,
      };
    });
}

/** Returns readings within the last `windowMin` minutes, downsampled to ~120 points. */
export function recentSeries(rs: PostureReading[], windowMin = 10): PostureReading[] {
  const cutoff = Date.now() - windowMin * MS_PER_MIN;
  const recent = rs.filter(r => r.t >= cutoff);
  const step = Math.max(1, Math.floor(recent.length / 120));
  const out: PostureReading[] = [];
  for (let i = 0; i < recent.length; i += step) out.push(recent[i]);
  if (recent.length && out[out.length - 1] !== recent[recent.length - 1]) {
    out.push(recent[recent.length - 1]);
  }
  return out;
}

export function todaysSummary(rs: PostureReading[]): DailySummary {
  const key = dayKey(Date.now());
  return summarizeByDay(rs).find(s => s.day === key) ?? {
    day: key, goodMinutes: 0, slouchingMinutes: 0, totalMinutes: 0, goodPct: 0,
  };
}

function round1(n: number) { return Math.round(n * 10) / 10; }
