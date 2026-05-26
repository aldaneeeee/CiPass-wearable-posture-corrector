/*
 * CiPASS bridge — WebSocket-to-WebSocket proxy
 * --------------------------------------------
 * The Arduino R4 is on your home LAN (e.g. ws://192.168.1.42:81) and is not
 * reachable from the public internet. A site deployed to Vercel can't talk to
 * it directly. This bridge runs on your laptop and:
 *
 *   1. Connects to the Arduino as a WebSocket client.
 *   2. Hosts its own WebSocket server on port 3001.
 *   3. Forwards every frame from the Arduino to every connected browser.
 *
 * You then run `ngrok http 3001` to give the bridge a public https URL, and
 * paste the matching wss:// URL into the Device page of the deployed app.
 *
 *   browser (wss://abc.ngrok-free.app)
 *      │
 *      ▼
 *   ngrok ──► bridge (localhost:3001) ──► Arduino (ws://192.168.x.x:81)
 *
 * Usage:
 *   ARDUINO_WS_URL=ws://192.168.1.42:81 npm start
 */

const { WebSocketServer, WebSocket } = require('ws');

const ARDUINO_URL = process.env.ARDUINO_WS_URL || 'ws://192.168.1.42:81';
const PORT = Number(process.env.PORT || 3001);
const RECONNECT_MS = 3000;

const clients = new Set();
let arduino = null;
let lastFrame = null;

function log(...args) {
  console.log(`[${new Date().toISOString()}]`, ...args);
}

function connectToArduino() {
  log(`Connecting to Arduino at ${ARDUINO_URL}…`);
  const ws = new WebSocket(ARDUINO_URL);
  arduino = ws;

  ws.on('open', () => {
    log('Arduino connected.');
  });

  ws.on('message', (data, isBinary) => {
    const frame = isBinary ? data : data.toString();
    lastFrame = frame;
    for (const client of clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(frame);
      }
    }
  });

  ws.on('close', () => {
    log(`Arduino disconnected. Retrying in ${RECONNECT_MS}ms…`);
    arduino = null;
    setTimeout(connectToArduino, RECONNECT_MS);
  });

  ws.on('error', (err) => {
    log('Arduino socket error:', err.message);
    try { ws.close(); } catch { /* noop */ }
  });
}

const wss = new WebSocketServer({ port: PORT });
log(`Bridge WebSocket server listening on ws://localhost:${PORT}`);

wss.on('connection', (client, req) => {
  clients.add(client);
  log(`Browser connected (${clients.size} total) from ${req.socket.remoteAddress}`);

  if (lastFrame !== null) {
    try { client.send(lastFrame); } catch { /* noop */ }
  }

  client.on('close', () => {
    clients.delete(client);
    log(`Browser disconnected (${clients.size} remaining)`);
  });

  client.on('error', (err) => {
    log('Browser socket error:', err.message);
  });
});

connectToArduino();

process.on('SIGINT', () => {
  log('Shutting down…');
  if (arduino) try { arduino.close(); } catch { /* noop */ }
  wss.close(() => process.exit(0));
});
