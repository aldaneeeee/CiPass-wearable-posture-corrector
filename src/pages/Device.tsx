import { useEffect, useState } from 'react';
import {
  BluetoothSearching, RefreshCcw, Save, Wand2, Cpu, Wifi,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { useApp } from '../context/AppContext';

export default function Device() {
  const { device, setDevice, latest, connection, reconnect, battery } = useApp();
  const [url, setUrl] = useState(device.url);
  const [goodMax, setGoodMax] = useState(device.calibrationGood);
  const [badMin, setBadMin]   = useState(device.calibrationBad);
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => { setUrl(device.url); }, [device.url]);

  const save = () => {
    setDevice({
      ...device,
      url: url.trim(),
      paired: !!url.trim(),
      calibrationGood: goodMax,
      calibrationBad: badMin,
    });
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
  };

  const captureUpright = () => {
    if (latest) setGoodMax(latest.flex);
  };
  const captureSlouch = () => {
    if (latest) setBadMin(latest.flex);
  };

  return (
    <>
      <PageHeader
        title="Device"
        subtitle="Pair your Arduino UNO R4 WiFi and calibrate the flex sensor."
        action={
          <button className="btn-outline" onClick={reconnect}>
            <RefreshCcw className="w-4 h-4" /> Reconnect
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-2">
          <div className="flex items-center gap-2 mb-1 text-sub text-sm">
            <BluetoothSearching className="w-4 h-4" /> Pairing
          </div>
          <h2 className="font-semibold mb-4">Wearable connection</h2>

          <label className="label" htmlFor="ws-url">WebSocket URL</label>
          <input
            id="ws-url"
            className="input"
            placeholder="ws://192.168.1.42:81"
            value={url}
            onChange={e => setUrl(e.target.value)}
          />
          <p className="text-xs text-sub mt-2">
            <strong>Local network:</strong> after flashing the CiPASS sketch, the Arduino prints its IP on
            the Serial Monitor — paste it here with port <code>81</code>, e.g. <code>ws://192.168.1.42:81</code>.
          </p>
          <p className="text-xs text-sub mt-1">
            <strong>Deployed site (Vercel):</strong> run the bridge in <code>bridge/</code> + <code>ngrok http 3001</code>,
            then paste the <code>wss://…ngrok-free.app</code> URL here. See the README for the full walkthrough.
          </p>

          <div className="mt-4 flex items-center gap-2">
            <button className="btn-primary" onClick={save}>
              <Save className="w-4 h-4" /> Save & connect
            </button>
            {savedFlash && <span className="text-xs text-brand-600">Saved.</span>}
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <InfoTile
              icon={<Wifi className="w-4 h-4" />}
              label="Status"
              value={statusLabel(connection)}
            />
            <InfoTile
              icon={<Cpu className="w-4 h-4" />}
              label="Last reading"
              value={latest ? `flex ${latest.flex}` : '—'}
            />
            <InfoTile
              icon={<RefreshCcw className="w-4 h-4" />}
              label="Battery"
              value={battery !== null ? `${battery}%` : '—'}
            />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-1 text-sub text-sm">
            <Wand2 className="w-4 h-4" /> Calibration
          </div>
          <h2 className="font-semibold mb-4">Posture thresholds</h2>

          <label className="label">Upright (flex ≤)</label>
          <div className="flex items-center gap-2">
            <input
              type="range" min={0} max={1023}
              value={goodMax}
              onChange={e => setGoodMax(Number(e.target.value))}
              className="flex-1 accent-brand-500"
            />
            <span className="font-mono text-sm w-12 text-right">{goodMax}</span>
          </div>
          <button className="btn-ghost mt-1 text-xs" onClick={captureUpright} disabled={!latest}>
            Set to current reading
          </button>

          <label className="label mt-5">Slouching (flex ≥)</label>
          <div className="flex items-center gap-2">
            <input
              type="range" min={0} max={1023}
              value={badMin}
              onChange={e => setBadMin(Number(e.target.value))}
              className="flex-1 accent-rose-500"
            />
            <span className="font-mono text-sm w-12 text-right">{badMin}</span>
          </div>
          <button className="btn-ghost mt-1 text-xs" onClick={captureSlouch} disabled={!latest}>
            Set to current reading
          </button>

          <button className="btn-primary mt-5 w-full" onClick={save}>
            <Save className="w-4 h-4" /> Save calibration
          </button>
          <p className="text-xs text-sub mt-3">
            Tip: sit upright and tap “Set to current reading”, then slouch and tap the other. Saving applies the
            new thresholds instantly.
          </p>
        </div>
      </div>
    </>
  );
}

function InfoTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
      <div className="flex items-center gap-2 text-sub text-xs">{icon}{label}</div>
      <div className="font-medium mt-1">{value}</div>
    </div>
  );
}

function statusLabel(c: string) {
  switch (c) {
    case 'connected':  return 'Connected';
    case 'connecting': return 'Connecting…';
    case 'mock':       return 'Mock data';
    case 'error':      return 'No device';
    default:           return 'Idle';
  }
}
