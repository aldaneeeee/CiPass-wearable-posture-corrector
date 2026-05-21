import {
  createContext, useContext, useEffect, useMemo, useRef, useState,
} from 'react';
import type { ReactNode } from 'react';
import { ArduinoClient, ConnectionState } from '../lib/arduinoClient';
import {
  loadAlerts, saveAlerts,
  loadDevice, saveDevice,
  loadReadings, appendReading,
  loadUser, saveUser,
} from '../lib/storage';
import type {
  AlertSettings, DeviceState, PostureReading, UserProfile,
} from '../lib/types';

interface AppContextValue {
  /* live */
  latest: PostureReading | null;
  connection: ConnectionState;
  battery: number | null;

  /* history */
  readings: PostureReading[];

  /* device */
  device: DeviceState;
  setDevice: (d: DeviceState) => void;
  reconnect: () => void;

  /* alerts */
  alerts: AlertSettings;
  setAlerts: (a: AlertSettings) => void;

  /* user */
  user: UserProfile | null;
  signIn: (email: string, name: string) => void;
  signOut: () => void;
}

const Ctx = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [device, _setDevice] = useState<DeviceState>(loadDevice);
  const [alerts, _setAlerts] = useState<AlertSettings>(loadAlerts);
  const [user, _setUser] = useState<UserProfile | null>(loadUser);

  const [readings, setReadings] = useState<PostureReading[]>(loadReadings);
  const [latest, setLatest] = useState<PostureReading | null>(
    () => loadReadings().slice(-1)[0] ?? null,
  );
  const [connection, setConnection] = useState<ConnectionState>('idle');
  const [battery, setBattery] = useState<number | null>(null);

  const clientRef = useRef<ArduinoClient | null>(null);
  const lastSlouchRef = useRef<number | null>(null);
  const lastAlertRef = useRef<number>(0);

  // build / rebuild client when URL or calibration changes
  useEffect(() => {
    const url = device.url || (import.meta.env.VITE_ARDUINO_WS_URL as string | undefined) || '';
    const client = new ArduinoClient({
      url,
      goodMax: device.calibrationGood,
      badMin: device.calibrationBad,
    });
    clientRef.current = client;

    const offReading = client.onReading((r) => {
      appendReading(r);
      setReadings(prev => {
        const next = prev.length > 60_000 ? prev.slice(-60_000) : prev.slice();
        next.push(r);
        return next;
      });
      setLatest(r);
      setBattery(client.battery);
      handleAlert(r);
    });

    const offStatus = client.onStatus(setConnection);
    client.connect();

    return () => {
      offReading();
      offStatus();
      client.disconnect();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [device.url, device.calibrationGood, device.calibrationBad]);

  function handleAlert(r: PostureReading) {
    if (!alerts.enabled) {
      lastSlouchRef.current = null;
      return;
    }
    if (inQuietHours(alerts.quietStart, alerts.quietEnd)) return;

    if (r.status === 'slouching') {
      if (lastSlouchRef.current === null) lastSlouchRef.current = r.t;
      const sustainedMs = r.t - (lastSlouchRef.current ?? r.t);
      const cooldownOk = r.t - lastAlertRef.current > 30_000;
      if (sustainedMs >= alerts.delaySec * 1000 && cooldownOk) {
        fireAlert();
        lastAlertRef.current = r.t;
      }
    } else {
      lastSlouchRef.current = null;
    }
  }

  function fireAlert() {
    if (alerts.sound) {
      try { beep(); } catch { /* no-op */ }
    }
    if (alerts.desktopNotif && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('Sit up straight 🌿', { body: 'You\'ve been slouching for a while.' });
    }
  }

  /* persisted setters */
  const setDevice = (d: DeviceState) => { _setDevice(d); saveDevice(d); };
  const setAlerts = (a: AlertSettings) => { _setAlerts(a); saveAlerts(a); };
  const signIn = (email: string, name: string) => {
    const u: UserProfile = { email, name, createdAt: Date.now() };
    _setUser(u); saveUser(u);
  };
  const signOut = () => { _setUser(null); saveUser(null); };

  const reconnect = () => clientRef.current?.connect();

  const value = useMemo<AppContextValue>(() => ({
    latest, connection, battery,
    readings,
    device, setDevice, reconnect,
    alerts, setAlerts,
    user, signIn, signOut,
  }), [latest, connection, battery, readings, device, alerts, user]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp must be used inside <AppProvider>');
  return v;
}

/* ---- helpers ---- */
function inQuietHours(start: string, end: string): boolean {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const now = new Date();
  const cur = now.getHours() * 60 + now.getMinutes();
  const s = sh * 60 + sm;
  const e = eh * 60 + em;
  return s <= e ? (cur >= s && cur < e) : (cur >= s || cur < e);
}

function beep() {
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.frequency.value = 660;
  gain.gain.setValueAtTime(0.001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
  osc.start();
  osc.stop(ctx.currentTime + 0.4);
}
