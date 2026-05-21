import { useMemo } from 'react';
import { Clock, Sparkles, TrendingUp, Zap } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, YAxis, XAxis, Tooltip, ReferenceLine } from 'recharts';
import PageHeader from '../components/PageHeader';
import PostureModel from '../components/PostureModel';
import StatCard from '../components/StatCard';
import { useApp } from '../context/AppContext';
import { recentSeries, todaysSummary } from '../lib/aggregate';

export default function Dashboard() {
  const { latest, readings, device, user } = useApp();

  const series = useMemo(() => {
    return recentSeries(readings, 10).map(r => ({
      t: r.t,
      flex: r.flex,
      time: new Date(r.t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }));
  }, [readings]);

  const today = useMemo(() => todaysSummary(readings), [readings]);

  const value = latest?.flex ?? Math.round((device.calibrationGood + device.calibrationBad) / 2);
  const status = latest?.status ?? 'unknown';

  const streakMin = useMemo(() => currentStreakMinutes(readings), [readings]);

  return (
    <>
      <PageHeader
        title={`Hi${user ? `, ${user.name.split(' ')[0]}` : ''}`}
        subtitle="Here's how your posture is doing today."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-2 flex flex-col md:flex-row items-center gap-6">
          <div className="w-full md:w-[50%] h-[380px] rounded-xl overflow-hidden bg-gradient-to-b from-brand-50 to-white grid place-items-center">
            <PostureModel
              value={value}
              goodMax={device.calibrationGood}
              badMin={device.calibrationBad}
              status={status}
            />
          </div>
          <div className="flex-1">
            <div className="text-sub text-sm">Live posture</div>
            <div className="text-3xl font-semibold mt-1">
              {status === 'good' && <span className="text-brand-600">Looking great</span>}
              {status === 'slouching' && <span className="text-rose-600">Sit up straight</span>}
              {status === 'unknown' && <span className="text-slate-500">Waiting on device…</span>}
            </div>
            <div className="mt-3 inline-flex items-center gap-1.5 pill-muted font-mono">
              flex {value}
            </div>
            <p className="text-sub mt-3 text-sm max-w-sm">
              The model bends in real time with your flex sensor. Thresholds:
              good ≤ <strong>{device.calibrationGood}</strong>, slouching ≥ <strong>{device.calibrationBad}</strong>.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <StatCard
            tone="good"
            icon={<Sparkles className="w-4 h-4 text-brand-600" />}
            label="Upright today"
            value={`${today.goodPct}%`}
            hint={`${today.goodMinutes} min of ${today.totalMinutes} min tracked`}
          />
          <StatCard
            icon={<Clock className="w-4 h-4" />}
            label="Current streak"
            value={`${streakMin} min`}
            hint={status === 'good' ? 'Keep it up' : 'Reset when you straighten back up'}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm text-sub">Last 10 minutes</div>
              <div className="font-semibold">Flex sensor reading</div>
            </div>
            <div className="text-xs text-sub flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-500" /> upright
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400" /> slouching
              </span>
            </div>
          </div>
          <div className="h-56">
            {series.length < 2 ? (
              <div className="h-full grid place-items-center text-sub text-sm">
                Collecting data… give it a moment.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={series}>
                  <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} minTickGap={28} />
                  <YAxis domain={[0, 1023]} stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} width={32} />
                  <Tooltip
                    contentStyle={{ border: 'none', borderRadius: 12, boxShadow: '0 6px 24px rgba(15,23,42,0.08)' }}
                    labelStyle={{ color: '#64748b', fontSize: 12 }}
                  />
                  <ReferenceLine y={device.calibrationGood} stroke="#38bdf8" strokeDasharray="4 4" />
                  <ReferenceLine y={device.calibrationBad}  stroke="#e36b6b" strokeDasharray="4 4" />
                  <Line type="monotone" dataKey="flex" stroke="#0284c7" strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="card flex flex-col gap-4">
          <div className="flex items-center gap-2 text-sub text-sm">
            <TrendingUp className="w-4 h-4" />
            <span>Today at a glance</span>
          </div>
          <div className="flex gap-2 items-baseline">
            <span className="text-3xl font-semibold">{today.totalMinutes}</span>
            <span className="text-sm text-sub">min tracked</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg bg-brand-50 p-3">
              <div className="text-brand-700 font-semibold">{today.goodMinutes} min</div>
              <div className="text-xs text-brand-700/70">upright</div>
            </div>
            <div className="rounded-lg bg-rose-50 p-3">
              <div className="text-rose-700 font-semibold">{today.slouchingMinutes} min</div>
              <div className="text-xs text-rose-700/70">slouching</div>
            </div>
          </div>
          <div className="text-xs text-sub flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5" />
            Data syncs every second while connected.
          </div>
        </div>
      </div>
    </>
  );
}

function currentStreakMinutes(rs: ReturnType<typeof useApp>['readings']): number {
  if (rs.length === 0) return 0;
  const target = rs[rs.length - 1].status;
  if (target === 'unknown') return 0;
  let i = rs.length - 1;
  const end = rs[i].t;
  while (i >= 0 && rs[i].status === target) i--;
  const startT = rs[i + 1]?.t ?? end;
  return Math.max(0, Math.round((end - startT) / 60_000));
}
