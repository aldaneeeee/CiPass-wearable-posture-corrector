import { useApp } from '../context/AppContext';
import { Wifi, WifiOff, Loader2, FlaskConical, Battery, BatteryLow } from 'lucide-react';

export default function ConnectionBadge() {
  const { connection, battery } = useApp();

  let label = '', cls = '', Icon = WifiOff;
  switch (connection) {
    case 'connected':   label = 'Connected';  cls = 'pill-good';  Icon = Wifi; break;
    case 'connecting':  label = 'Connecting'; cls = 'pill-muted'; Icon = Loader2; break;
    case 'error':       label = 'No device';  cls = 'pill-bad';   Icon = WifiOff; break;
    case 'mock':        label = 'Mock data';  cls = 'pill-warn';  Icon = FlaskConical; break;
    default:            label = 'Idle';       cls = 'pill-muted'; Icon = WifiOff;
  }

  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
      <div className="flex items-center justify-between">
        <span className={cls}>
          <Icon className={`w-3.5 h-3.5 ${connection === 'connecting' ? 'animate-spin' : ''}`} />
          {label}
        </span>
        {battery !== null && (
          <span className="inline-flex items-center gap-1 text-xs text-slate-600">
            {battery < 20
              ? <BatteryLow className="w-4 h-4 text-rose-500" />
              : <Battery className="w-4 h-4" />}
            {battery}%
          </span>
        )}
      </div>
    </div>
  );
}
