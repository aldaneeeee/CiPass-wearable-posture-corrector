import { useState } from 'react';
import { Bell, BellOff, Volume2, Monitor, MoonStar, Save } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { useApp } from '../context/AppContext';

export default function Alerts() {
  const { alerts, setAlerts } = useApp();
  const [draft, setDraft] = useState(alerts);
  const [flash, setFlash] = useState(false);

  const save = () => {
    setAlerts(draft);
    setFlash(true);
    setTimeout(() => setFlash(false), 1500);
  };

  const requestNotif = async () => {
    if (!('Notification' in window)) return;
    const perm = await Notification.requestPermission();
    if (perm === 'granted') setDraft({ ...draft, desktopNotif: true });
  };

  return (
    <>
      <PageHeader
        title="Alerts"
        subtitle="Decide when and how CiPASS nudges you to straighten up."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold">Slouching alerts</h2>
              <p className="text-sm text-sub">Trigger a nudge after sustained bad posture.</p>
            </div>
            <Toggle
              checked={draft.enabled}
              onChange={(v) => setDraft({ ...draft, enabled: v })}
              label={draft.enabled ? 'On' : 'Off'}
              Icon={draft.enabled ? Bell : BellOff}
            />
          </div>

          <div className="space-y-5 opacity-100" style={{ opacity: draft.enabled ? 1 : 0.5, pointerEvents: draft.enabled ? 'auto' : 'none' }}>
            <Row icon={<Volume2 className="w-4 h-4" />} label="Sound" hint="Soft chime through your speakers">
              <Toggle checked={draft.sound} onChange={(v) => setDraft({ ...draft, sound: v })} />
            </Row>

            <Row icon={<Monitor className="w-4 h-4" />} label="Desktop notification" hint="Browser notification (requires permission)">
              <div className="flex items-center gap-2">
                <Toggle checked={draft.desktopNotif} onChange={(v) => v ? requestNotif() : setDraft({ ...draft, desktopNotif: false })} />
              </div>
            </Row>

            <div>
              <label className="label">Trigger after slouching for</label>
              <div className="flex items-center gap-2">
                <input
                  type="range" min={5} max={120} step={5}
                  className="flex-1 accent-brand-500"
                  value={draft.delaySec}
                  onChange={e => setDraft({ ...draft, delaySec: Number(e.target.value) })}
                />
                <span className="font-mono text-sm w-16 text-right">{draft.delaySec}s</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label flex items-center gap-1.5"><MoonStar className="w-3.5 h-3.5" /> Quiet hours start</label>
                <input
                  type="time"
                  className="input"
                  value={draft.quietStart}
                  onChange={e => setDraft({ ...draft, quietStart: e.target.value })}
                />
              </div>
              <div>
                <label className="label flex items-center gap-1.5"><MoonStar className="w-3.5 h-3.5" /> Quiet hours end</label>
                <input
                  type="time"
                  className="input"
                  value={draft.quietEnd}
                  onChange={e => setDraft({ ...draft, quietEnd: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <button className="btn-primary" onClick={save}>
              <Save className="w-4 h-4" /> Save settings
            </button>
            {flash && <span className="text-xs text-brand-600">Saved.</span>}
          </div>
        </div>

        <div className="card">
          <div className="text-sub text-sm mb-1">Preview</div>
          <div className="font-semibold mb-4">How an alert will feel</div>

          <div className="rounded-xl border border-slate-100 p-4 bg-slate-50">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-brand-500 text-white grid place-items-center">
                <Bell className="w-4 h-4" />
              </div>
              <div className="text-sm">
                <div className="font-medium">Sit up straight 🌿</div>
                <div className="text-sub text-xs">You've been slouching for {draft.delaySec}s.</div>
              </div>
            </div>
          </div>

          <p className="text-xs text-sub mt-4">
            Alerts won't fire during quiet hours
            {' '}({draft.quietStart}–{draft.quietEnd}).
            There's a 30-second cooldown between alerts so you don't get spammed.
          </p>
        </div>
      </div>
    </>
  );
}

function Row({ icon, label, hint, children }: { icon: React.ReactNode; label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-slate-50 grid place-items-center text-slate-600">{icon}</div>
        <div>
          <div className="font-medium text-sm">{label}</div>
          {hint && <div className="text-xs text-sub">{hint}</div>}
        </div>
      </div>
      <div>{children}</div>
    </div>
  );
}

function Toggle({ checked, onChange, label, Icon }: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  Icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={[
        'inline-flex items-center gap-2 px-2.5 py-1.5 rounded-full text-xs font-medium transition-colors',
        checked ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-600',
      ].join(' ')}
      aria-pressed={checked}
    >
      {Icon && <Icon className="w-3.5 h-3.5" />}
      <span className={`w-8 h-4 rounded-full relative ${checked ? 'bg-white/30' : 'bg-white'}`}>
        <span className={[
          'absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all',
          checked ? 'left-[18px]' : 'left-0.5',
          checked ? '' : 'bg-slate-400',
        ].join(' ')} />
      </span>
      {label}
    </button>
  );
}
