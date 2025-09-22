#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ---!!! اطلاعات خود را در این سه خط وارد کنید !!!---
const char* ssid = "w";
const char* password = "p";
const char* serverUrl = "s"; // از آدرس بدون اسلش شروع می‌کنیم
// --- --- --- --- --- --- --- --- --- --- --- --- ---

const int BUTTON_PIN = 0;
const int LED_PIN = 2;

bool isDeviceOn = false;

void sendStatus(String status) {
  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("Sending status: ");
    Serial.println(status);

    HTTPClient http;
    WiFiClient client;
    http.begin(client, serverUrl);
    http.addHeader("Content-Type", "application/json");

    StaticJsonDocument<32> doc;
    doc["status"] = status;
    String payload;
    serializeJson(doc, payload);

    int httpResponseCode = http.POST(payload);

    // --- بخش جدید برای مدیریت دستی ریدایرکت ---
    if (httpResponseCode == HTTP_CODE_FOUND || httpResponseCode == HTTP_CODE_MOVED_PERMANENTLY || httpResponseCode == 307 || httpResponseCode == 308) {
      Serial.print("Redirect detected with code: ");
      Serial.println(httpResponseCode);
      
      // آدرس جدید را از هدر 'Location' بخوان
      String newUrl = http.header("Location");
      Serial.print("Following redirect to: ");
      Serial.println(newUrl);
      http.end(); // درخواست اول را ببند

      // یک درخواست جدید به آدرس ریدایرکت شده بفرست
      http.begin(client, newUrl);
      http.addHeader("Content-Type", "application/json");
      httpResponseCode = http.POST(payload);
    }
    // --- پایان بخش جدید ---

    if (httpResponseCode > 0) {
      Serial.printf("Final HTTP Response code: %d\n", httpResponseCode);
    } else {
      Serial.printf("Error: %s\n", http.errorToString(httpResponseCode).c_str());
    }
    http.end();
  } else {
    Serial.println("WiFi Disconnected.");
  }
}

void setup() {
  Serial.begin(115200);
  delay(100);
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, HIGH);

  Serial.println("Connecting to WiFi...");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected!");
  Serial.println(WiFi.localIP());

  sendStatus("OFF");
}

void loop() {
  if (digitalRead(BUTTON_PIN) == LOW) {
    delay(50);
    isDeviceOn = !isDeviceOn;
    if (isDeviceOn) {
      digitalWrite(LED_PIN, LOW);
      sendStatus("ON");
    } else {
      digitalWrite(LED_PIN, HIGH);
      sendStatus("OFF");
    }
    while (digitalRead(BUTTON_PIN) == LOW);
    delay(50);
  }
}
