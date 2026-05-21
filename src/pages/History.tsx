import { useMemo } from 'react';
import { Download, CalendarDays } from 'lucide-react';
import {
  BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell,
} from 'recharts';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import { useApp } from '../context/AppContext';
import { summarizeByDay } from '../lib/aggregate';
import { downloadCsv, readingsToCsv } from '../lib/csv';

export default function History() {
  const { readings } = useApp();

  const days = useMemo(() => summarizeByDay(readings).slice(-7), [readings]);

  const totals = useMemo(() => {
    const good = days.reduce((s, d) => s + d.goodMinutes, 0);
    const bad  = days.reduce((s, d) => s + d.slouchingMinutes, 0);
    const total = good + bad;
    return {
      goodMin: round1(good),
      badMin:  round1(bad),
      total:   round1(total),
      goodPct: total ? Math.round((good / total) * 100) : 0,
      avg:     days.length ? round1(total / days.length) : 0,
    };
  }, [days]);

  const exportCsv = () => {
    const csv = readingsToCsv(readings);
    const stamp = new Date().toISOString().slice(0, 10);
    downloadCsv(`cipass-history-${stamp}.csv`, csv);
  };

  return (
    <>
      <PageHeader
        title="History"
        subtitle="Your posture over the last seven days."
        action={
          <button className="btn-outline" onClick={exportCsv} disabled={!readings.length}>
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <StatCard
          tone="good"
          icon={<CalendarDays className="w-4 h-4 text-brand-600" />}
          label="7-day upright"
          value={`${totals.goodPct}%`}
          hint={`${totals.goodMin} min upright`}
        />
        <StatCard label="Slouching" value={`${totals.badMin} min`} hint="across 7 days" />
        <StatCard label="Tracked" value={`${totals.total} min`} hint="total session time" />
        <StatCard label="Daily avg" value={`${totals.avg} min`} hint="across days with data" />
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm text-sub">Minutes per day</div>
            <div className="font-semibold">Upright vs. slouching</div>
          </div>
          <div className="text-xs text-sub flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-brand-500" /> upright
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-400" /> slouching
            </span>
          </div>
        </div>

        <div className="h-72">
          {days.length === 0 ? (
            <div className="h-full grid place-items-center text-sub text-sm">
              No data yet — connect your device or let mock data build up.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={days.map(d => ({
                day: d.day.slice(5),
                upright: d.goodMinutes,
                slouching: d.slouchingMinutes,
              }))} barGap={6}>
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ border: 'none', borderRadius: 12, boxShadow: '0 6px 24px rgba(15,23,42,0.08)' }}
                  labelStyle={{ color: '#64748b', fontSize: 12 }}
                />
                <Bar dataKey="upright" stackId="a" radius={[6, 6, 0, 0]} isAnimationActive={false}>
                  {days.map((_, i) => <Cell key={i} fill="#38bdf8" />)}
                </Bar>
                <Bar dataKey="slouching" stackId="a" radius={[6, 6, 0, 0]} isAnimationActive={false}>
                  {days.map((_, i) => <Cell key={i} fill="#e36b6b" />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="card mt-6">
        <div className="flex items-center justify-between mb-3">
          <div className="font-semibold">Day-by-day</div>
          <div className="text-xs text-sub">{days.length} day{days.length === 1 ? '' : 's'}</div>
        </div>
        <div className="overflow-hidden rounded-xl border border-slate-100">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-sub text-left">
              <tr>
                <th className="px-4 py-2 font-medium">Day</th>
                <th className="px-4 py-2 font-medium">Upright</th>
                <th className="px-4 py-2 font-medium">Slouching</th>
                <th className="px-4 py-2 font-medium">Total</th>
                <th className="px-4 py-2 font-medium">% upright</th>
              </tr>
            </thead>
            <tbody>
              {days.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-sub">No history yet.</td></tr>
              )}
              {days.map(d => (
                <tr key={d.day} className="border-t border-slate-100">
                  <td className="px-4 py-2">{d.day}</td>
                  <td className="px-4 py-2">{d.goodMinutes} min</td>
                  <td className="px-4 py-2">{d.slouchingMinutes} min</td>
                  <td className="px-4 py-2">{d.totalMinutes} min</td>
                  <td className="px-4 py-2">
                    <span className={d.goodPct >= 70 ? 'pill-good' : d.goodPct >= 40 ? 'pill-warn' : 'pill-bad'}>
                      {d.goodPct}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function round1(n: number) { return Math.round(n * 10) / 10; }
