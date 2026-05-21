import type { PostureReading, PostureStatus } from './types';

type Listener = (r: PostureReading) => void;
type StatusListener = (s: ConnectionState) => void;

export type ConnectionState = 'idle' | 'connecting' | 'connected' | 'error' | 'mock';

interface ClientOpts {
  /** ws://host:port — when empty, the client emits mock data instead */
  url: string;
  /** flex value below which posture counts as "good" */
  goodMax: number;
  /** flex value above which posture counts as "slouching" */
  badMin: number;
}

/**
 * Talks to the Arduino R4 WiFi over WebSocket. The Arduino sketch should push
 * JSON frames like: { "flex": 412, "battery": 78 } — battery is optional.
 *
 * If no URL is configured, the client falls back to a mock generator so the UI
 * is fully usable before the hardware is wired up.
 */
export class ArduinoClient {
  private ws: WebSocket | null = null;
  private mockTimer: number | null = null;
  private reconnectTimer: number | null = null;
  private listeners = new Set<Listener>();
  private statusListeners = new Set<StatusListener>();
  private state: ConnectionState = 'idle';
  private lastBattery: number | null = null;

  constructor(private opts: ClientOpts) {}

  onReading(fn: Listener) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
  onStatus(fn: StatusListener) {
    this.statusListeners.add(fn);
    fn(this.state);
    return () => this.statusListeners.delete(fn);
  }

  get battery() { return this.lastBattery; }
  get status() { return this.state; }

  private setState(s: ConnectionState) {
    this.state = s;
    this.statusListeners.forEach(l => l(s));
  }

  private classify(flex: number): PostureStatus {
    if (flex <= this.opts.goodMax) return 'good';
    if (flex >= this.opts.badMin)  return 'slouching';
    // borderline values count as good — sensitivity tunable via calibration
    return 'good';
  }

  private emit(flex: number) {
    const reading: PostureReading = {
      t: Date.now(),
      flex,
      status: this.classify(flex),
    };
    this.listeners.forEach(l => l(reading));
  }

  /** Update calibration thresholds at runtime. */
  setCalibration(goodMax: number, badMin: number) {
    this.opts.goodMax = goodMax;
    this.opts.badMin = badMin;
  }

  connect() {
    this.disconnect();

    if (!this.opts.url) {
      this.startMock();
      return;
    }

    this.setState('connecting');
    try {
      const ws = new WebSocket(this.opts.url);
      this.ws = ws;

      ws.onopen = () => this.setState('connected');
      ws.onclose = () => {
        this.setState('error');
        // try again in 3s
        this.reconnectTimer = window.setTimeout(() => this.connect(), 3000);
      };
      ws.onerror = () => this.setState('error');
      ws.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data);
          if (typeof data.battery === 'number') this.lastBattery = data.battery;
          if (typeof data.flex === 'number') this.emit(data.flex);
        } catch {
          // ignore non-JSON frames
        }
      };
    } catch {
      this.setState('error');
      this.startMock();
    }
  }

  disconnect() {
    if (this.reconnectTimer) { clearTimeout(this.reconnectTimer); this.reconnectTimer = null; }
    if (this.mockTimer)      { clearInterval(this.mockTimer);    this.mockTimer = null; }
    if (this.ws) {
      this.ws.onopen = this.ws.onclose = this.ws.onerror = this.ws.onmessage = null;
      try { this.ws.close(); } catch { /* noop */ }
      this.ws = null;
    }
    this.setState('idle');
  }

  /* ----- mock data ----- */
  private startMock() {
    this.setState('mock');
    this.lastBattery = 82;

    // simulate a slow-drifting flex value with occasional slouch episodes
    let value = 320;
    let slouching = false;
    let slouchCountdown = 60;

    this.mockTimer = window.setInterval(() => {
      slouchCountdown -= 1;
      if (slouchCountdown <= 0) {
        slouching = !slouching;
        slouchCountdown = slouching ? 25 + Math.floor(Math.random() * 30)
                                    : 80 + Math.floor(Math.random() * 100);
      }
      const target = slouching ? 720 : 340;
      value += (target - value) * 0.15 + (Math.random() - 0.5) * 20;
      value = Math.max(50, Math.min(1000, value));
      this.emit(Math.round(value));
    }, 1000);
  }
}
