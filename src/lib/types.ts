export type PostureStatus = 'good' | 'slouching' | 'unknown';

export interface PostureReading {
  /** ms since epoch */
  t: number;
  /** raw flex sensor value (0–1023) */
  flex: number;
  /** derived status */
  status: PostureStatus;
}

export interface DailySummary {
  /** YYYY-MM-DD */
  day: string;
  goodMinutes: number;
  slouchingMinutes: number;
  totalMinutes: number;
  goodPct: number;
}

export interface DeviceState {
  paired: boolean;
  connected: boolean;
  /** WebSocket URL the app last tried */
  url: string;
  /** flex value the user set as "upright" */
  calibrationGood: number;
  /** flex value the user set as "slouching" */
  calibrationBad: number;
  /** seconds of bad posture before an alert fires */
  alertDelaySec: number;
  /** battery percentage reported by device (0-100), null if unknown */
  batteryPct: number | null;
}

export interface AlertSettings {
  enabled: boolean;
  sound: boolean;
  desktopNotif: boolean;
  /** in seconds */
  delaySec: number;
  /** quiet hours, 24h "HH:MM" */
  quietStart: string;
  quietEnd: string;
}

export interface UserProfile {
  email: string;
  name: string;
  /** ms since epoch */
  createdAt: number;
}
