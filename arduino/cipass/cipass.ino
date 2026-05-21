/*
 * CiPASS — Arduino UNO R4 WiFi sketch
 * ------------------------------------
 * Reads a flex sensor on A0 and broadcasts the value over WebSocket once per
 * second, so the CiPASS web app can render live posture data.
 *
 * Hardware:
 *   - Arduino UNO R4 WiFi
 *   - Flex sensor (e.g. Spectra Symbol 2.2") in series with a 10k resistor
 *     to form a voltage divider:
 *
 *         3.3V ── [flex] ──┬── A0
 *                          └── [10k] ── GND
 *
 *   - Optional: small vibration motor or buzzer on D9 for haptic feedback.
 *
 * Library:
 *   - Install "ArduinoWebsockets" by Gil Maimon via the Library Manager.
 *
 * Setup:
 *   1. Set WIFI_SSID and WIFI_PASS below.
 *   2. Upload, open the Serial Monitor at 115200 baud.
 *   3. Note the printed IP, e.g. "Server up at ws://192.168.1.42:81".
 *   4. In the CiPASS web app → Device → paste that URL → Save & connect.
 */

#include <WiFiS3.h>
#include <ArduinoWebsockets.h>

// ---- USER CONFIG ----
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASS = "YOUR_WIFI_PASSWORD";
const uint16_t WS_PORT = 81;
const uint8_t  FLEX_PIN = A0;
const uint8_t  BUZZER_PIN = 9;   // optional, comment out usage if not wired
const uint32_t SAMPLE_MS = 1000; // 1 reading/sec
// ---------------------

using namespace websockets;

WebsocketsServer server;
WebsocketsClient client;
bool clientConnected = false;
uint32_t lastSample = 0;

void connectWifi() {
  Serial.print("Connecting to WiFi");
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(500);
  }
  Serial.println();
  Serial.print("Server up at ws://");
  Serial.print(WiFi.localIP());
  Serial.print(":");
  Serial.println(WS_PORT);
}

// Rough battery estimate from the R4's onboard VIN/analog read.
// If you're USB-powered you can just leave this as a constant.
int readBatteryPct() {
  return 82; // placeholder — replace with real divider if you add a LiPo
}

void setup() {
  Serial.begin(115200);
  while (!Serial && millis() < 3000) { /* wait briefly */ }

  pinMode(FLEX_PIN, INPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);

  connectWifi();
  server.listen(WS_PORT);
  Serial.println("Waiting for a CiPASS web client...");
}

void loop() {
  // accept a single client at a time
  if (server.poll()) {
    client = server.accept();
    clientConnected = true;
    Serial.println("Client connected.");
  }

  if (clientConnected) {
    if (!client.available()) {
      Serial.println("Client disconnected.");
      clientConnected = false;
    } else {
      client.poll(); // drain incoming
    }
  }

  uint32_t now = millis();
  if (now - lastSample >= SAMPLE_MS) {
    lastSample = now;
    int flex = analogRead(FLEX_PIN); // 0..1023 on UNO R4

    if (clientConnected && client.available()) {
      char buf[80];
      snprintf(buf, sizeof(buf),
               "{\"flex\":%d,\"battery\":%d}", flex, readBatteryPct());
      client.send(buf);
    }
    Serial.print("flex="); Serial.println(flex);
  }
}
