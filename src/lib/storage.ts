import type { PostureReading, AlertSettings, DeviceState, UserProfile } from './types';

const KEYS = {
  readings: 'cipass.readings',
  alerts:   'cipass.alerts',
  device:   'cipass.device',
  user:     'cipass.user',
} as const;

function read<T>(k: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(k);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write<T>(k: string, v: T) {
  localStorage.setItem(k, JSON.stringify(v));
}

/* Readings ring-buffer (cap at 14 days) */
const MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;

export function loadReadings(): PostureReading[] {
  const all = read<PostureReading[]>(KEYS.readings, []);
  const cutoff = Date.now() - MAX_AGE_MS;
  return all.filter(r => r.t >= cutoff);
}

export function saveReadings(rs: PostureReading[]) {
  const cutoff = Date.now() - MAX_AGE_MS;
  write(KEYS.readings, rs.filter(r => r.t >= cutoff));
}

export function appendReading(r: PostureReading) {
  const rs = loadReadings();
  rs.push(r);
  saveReadings(rs);
}

/* Alerts */
export const DEFAULT_ALERTS: AlertSettings = {
  enabled: true,
  sound: true,
  desktopNotif: false,
  delaySec: 30,
  quietStart: '22:00',
  quietEnd: '07:00',
};

export function loadAlerts(): AlertSettings {
  return { ...DEFAULT_ALERTS, ...read<Partial<AlertSettings>>(KEYS.alerts, {}) };
}
export function saveAlerts(a: AlertSettings) { write(KEYS.alerts, a); }

/* Device */
export const DEFAULT_DEVICE: DeviceState = {
  paired: false,
  connected: false,
  url: '',
  calibrationGood: 350,
  calibrationBad:  650,
  alertDelaySec: 30,
  batteryPct: null,
};

export function loadDevice(): DeviceState {
  return { ...DEFAULT_DEVICE, ...read<Partial<DeviceState>>(KEYS.device, {}) };
}
export function saveDevice(d: DeviceState) { write(KEYS.device, d); }

/* User */
export function loadUser(): UserProfile | null {
  return read<UserProfile | null>(KEYS.user, null);
}
export function saveUser(u: UserProfile | null) {
  if (u === null) localStorage.removeItem(KEYS.user);
  else write(KEYS.user, u);
}
