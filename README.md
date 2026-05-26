# CiPASS — Posture Companion

Web app for a DIY wearable posture corrector built with an **Arduino UNO R4 WiFi** + **flex sensor**.

- Live posture monitoring via WebSocket (with a mock-data fallback so the UI works without hardware)
- 7-day history with charts and CSV export
- Device pairing & in-app calibration
- Configurable alerts (sound + desktop notification, quiet hours, sustain delay)
- Local sign-in stub — easy to swap for a real auth backend later

## Quick start

```bash
npm install
npm run dev
```

Open <http://localhost:5173>. Sign in with any email (it's a local stub) and you'll land on the dashboard. By default the app emits mock data so you can play with the whole UI before wiring up the Arduino.

## Connecting the Arduino UNO R4 WiFi

### 1. Wire the flex sensor

Flex sensors are variable resistors — pair one with a 10 kΩ resistor to make a voltage divider:

```
  3.3 V ── [ flex sensor ] ──┬── A0
                             └── [ 10 kΩ ] ── GND
```

Optional: a small buzzer or vibration motor on **D9** for haptic feedback.

### 2. Flash the sketch

The sketch lives at [arduino/cipass/cipass.ino](arduino/cipass/cipass.ino).

1. Install the **Arduino UNO R4 Boards** package in the Arduino IDE.
2. Install the **ArduinoWebsockets** library by *Gil Maimon* via the Library Manager.
3. Open `arduino/cipass/cipass.ino` and set `WIFI_SSID` and `WIFI_PASS`.
4. Upload to the board.
5. Open the Serial Monitor at **115200 baud** — you'll see a line like:

   ```
   Server up at ws://192.168.1.42:81
   ```

### 3. Pair from the web app

1. In the running web app, go to **Device**.
2. Paste the WebSocket URL (e.g. `ws://192.168.1.42:81`) into the field.
3. Click **Save & connect**. The status pill in the sidebar should switch to **Connected** within a couple of seconds.
4. Sit upright and click **Set to current reading** under "Upright". Slouch and do the same under "Slouching". Click **Save calibration**.

That's it — live readings will start flowing into the dashboard and history.

## Project structure

```
src/
  components/       UI primitives (Layout, gauge, badges, cards)
  context/          AppContext — wires the Arduino client into React state
  lib/
    arduinoClient   WebSocket client + mock data generator
    aggregate       per-day summaries, recent series
    storage         localStorage persistence
    csv             CSV export
    types           shared TS types
  pages/            Dashboard, History, Device, Alerts, Profile, Login
arduino/cipass/     Arduino R4 WiFi sketch
```

## How the data flows

```
flex sensor ─► Arduino R4 ─► WebSocket :81 ─► ArduinoClient
                                              │
                                              ├─► appendReading() → localStorage
                                              ├─► AppContext.latest (React state)
                                              └─► alert engine (sustain + cooldown)
```

When `VITE_ARDUINO_WS_URL` is empty *and* no URL is configured on the Device page, the client switches to a mock generator that simulates realistic slouch episodes. You can override the default via `.env.local`:

```
VITE_ARDUINO_WS_URL=ws://192.168.1.42:81
```

## Deploying online (Vercel + ngrok bridge)

The Arduino lives on your home LAN, so a deployed Vercel site can't reach it
directly. The included **bridge** ([bridge/bridge.js](bridge/bridge.js)) fixes
that by running on your laptop and tunneling Arduino frames out through
[ngrok](https://ngrok.com/).

```
browser (https://your-site.vercel.app)
   │  wss://abc.ngrok-free.app
   ▼
 ngrok ──► bridge (localhost:3001) ──► Arduino (ws://192.168.x.x:81)
```

### 1. Run the bridge

```bash
cd bridge
npm install
ARDUINO_WS_URL=ws://192.168.1.42:81 npm start
```

Leave this terminal running. It prints `Arduino connected.` once it reaches
the board, then forwards every frame to any browser that connects.

### 2. Expose it with ngrok

In a second terminal:

```bash
ngrok http 3001
```

ngrok prints a public URL like `https://abc-123.ngrok-free.app`. The matching
WebSocket URL is the same hostname with `wss://`:

```
wss://abc-123.ngrok-free.app
```

> Use `ngrok http`, **not** `ngrok tcp` — Vercel sites are served over HTTPS,
> and browsers will block an insecure `ws://` connection from a secure page.
> `ngrok http` automatically upgrades to `wss://`.

### 3. Deploy the frontend to Vercel

```bash
npm install -g vercel
vercel
```

Once deployed, open the live site, go to **Device**, and paste your
`wss://…ngrok-free.app` URL. The dashboard will start showing real readings
from anywhere in the world — as long as your laptop is running the bridge
and ngrok.

## What's not built (yet)

- Real backend / cloud sync — accounts are local-only.
- Multi-device support — one wearable per browser.
- PDF report export — CSV is implemented; a styled PDF is on the roadmap.
- Mobile-native shell — the web app is responsive but not packaged as iOS/Android yet.

## Scripts

- `npm run dev` — Vite dev server on port 5173
- `npm run build` — TypeScript check + production build
- `npm run preview` — preview the production build locally
- `cd bridge && npm start` — run the WS→WS bridge for ngrok/Vercel deploys
