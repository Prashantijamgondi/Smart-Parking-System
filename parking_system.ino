/*
 * Smart Parking System - ESP8266 Code
 * Refactored to use secrets.h for configuration
 */

#include "secrets.h"
#include <ESP8266WiFi.h>
#include <BlynkSimpleEsp8266.h>

// Variables from config
char ssid[] = WIFI_SSID;
char pass[] = WIFI_PASS;

// Slot status (0 = Empty, 1 = Occupied)
int slot1Status = 0;
int slot2Status = 0;
int slot3Status = 0;

// Previous status for change detection
int prevSlot1Status = 0;
int prevSlot2Status = 0;
int prevSlot3Status = 0;

// Slot reservation status from Blynk/Frontend
int slot1Reserved = 0;
int slot2Reserved = 0;
int slot3Reserved = 0;

BlynkTimer timer;

void setup() {
  Serial.begin(115200);
  delay(100);
  
  Serial.println("\n\n=================================");
  Serial.println("  Smart Parking System v1.0");
  Serial.println("  Backend Compatible Version");
  Serial.println("=================================\n");
  
  // Initialize pins
  pinMode(PIN_IR_SLOT1, INPUT);
  pinMode(PIN_IR_SLOT2, INPUT);
  pinMode(PIN_IR_SLOT3, INPUT);
  
  pinMode(PIN_LED_SLOT1, OUTPUT);
  pinMode(PIN_LED_SLOT2, OUTPUT);
  pinMode(PIN_LED_SLOT3, OUTPUT);
  
  // Turn off all LEDs initially
  digitalWrite(PIN_LED_SLOT1, LOW);
  digitalWrite(PIN_LED_SLOT2, LOW);
  digitalWrite(PIN_LED_SLOT3, LOW);
  
  Serial.println("Hardware initialized...");
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);
  
  // Connect to Blynk
  Blynk.begin(BLYNK_AUTH_TOKEN, ssid, pass);
  
  // Setup timer to check sensors every 500ms
  timer.setInterval(500L, checkSensors);
  
  Serial.println("\n✓ System Ready!");
  Serial.println("✓ Connected to Blynk");
  Serial.println("✓ Monitoring parking slots...\n");
}

void loop() {
  Blynk.run();
  timer.run();
}

void checkSensors() {
  // Read IR sensors (LOW = Object detected, HIGH = No object)
  int slot1IR = digitalRead(PIN_IR_SLOT1);
  int slot2IR = digitalRead(PIN_IR_SLOT2);
  int slot3IR = digitalRead(PIN_IR_SLOT3);

  // Update slot status (1 = Occupied, 0 = Empty)
  slot1Status = (slot1IR == LOW) ? 1 : 0;
  slot2Status = (slot2IR == LOW) ? 1 : 0;
  slot3Status = (slot3IR == LOW) ? 1 : 0;
  
  // Handle Slot 1
  if (slot1Status != prevSlot1Status) {
    handleSlotChange(1, slot1Status, PIN_LED_SLOT1);
    Blynk.virtualWrite(VPIN_SLOT1_STATUS, slot1Status);
    
    if (slot1Status == 0) {
      // Vehicle exited - reset reservation
      slot1Reserved = 0;
      Blynk.virtualWrite(VPIN_SLOT1_RESERVE, 0);
    }
    
    prevSlot1Status = slot1Status;
  }
  
  // Handle Slot 2
  if (slot2Status != prevSlot2Status) {
    handleSlotChange(2, slot2Status, PIN_LED_SLOT2);
    Blynk.virtualWrite(VPIN_SLOT2_STATUS, slot2Status);
    
    if (slot2Status == 0) {
      slot2Reserved = 0;
      Blynk.virtualWrite(VPIN_SLOT2_RESERVE, 0);
    }
    
    prevSlot2Status = slot2Status;
  }
  
  // Handle Slot 3
  if (slot3Status != prevSlot3Status) {
    handleSlotChange(3, slot3Status, PIN_LED_SLOT3);
    Blynk.virtualWrite(VPIN_SLOT3_STATUS, slot3Status);
    
    if (slot3Status == 0) {
      slot3Reserved = 0;
      Blynk.virtualWrite(VPIN_SLOT3_RESERVE, 0);
    }
    
    prevSlot3Status = slot3Status;
  }
  
  // Update LED based on reservation and occupancy
  updateLED(PIN_LED_SLOT1, slot1Status, slot1Reserved);
  updateLED(PIN_LED_SLOT2, slot2Status, slot2Reserved);
  updateLED(PIN_LED_SLOT3, slot3Status, slot3Reserved);
}

void handleSlotChange(int slotNum, int status, int ledPin) {
  if (status == 1) {
    Serial.print("🚗 Slot ");
    Serial.print(slotNum);
    Serial.println(" - Vehicle Entered");
  } else {
    Serial.print("🚙 Slot ");
    Serial.print(slotNum);
    Serial.println(" - Vehicle Exited");
  }
}

void updateLED(int ledPin, int occupied, int reserved) {
  if (occupied) {
    // Red - Occupied (LED ON continuously)
    digitalWrite(ledPin, HIGH);
  } else if (reserved) {
    // Yellow/Blinking - Reserved (simulate with fast blink)
    digitalWrite(ledPin, (millis() / 250) % 2);
  } else {
    // Green - Available (LED OFF)
    digitalWrite(ledPin, LOW);
  }
}

// Blynk handlers for reservation from frontend/app
BLYNK_WRITE(VPIN_SLOT1_RESERVE) {
  slot1Reserved = param.asInt();
  Serial.print("📱 Slot 1 Reservation: ");
  Serial.println(slot1Reserved ? "Reserved ✓" : "Cancelled ✗");
}

BLYNK_WRITE(VPIN_SLOT2_RESERVE) {
  slot2Reserved = param.asInt();
  Serial.print("📱 Slot 2 Reservation: ");
  Serial.println(slot2Reserved ? "Reserved ✓" : "Cancelled ✗");
}

BLYNK_WRITE(VPIN_SLOT3_RESERVE) {
  slot3Reserved = param.asInt();
  Serial.print("📱 Slot 3 Reservation: ");
  Serial.println(slot3Reserved ? "Reserved ✓" : "Cancelled ✗");
}

// Sync on connect
BLYNK_CONNECTED() {
  Serial.println("\n✓ Connected to Blynk Cloud");
  Serial.println("✓ Syncing virtual pins...\n");
  Blynk.syncVirtual(VPIN_SLOT1_RESERVE, VPIN_SLOT2_RESERVE, VPIN_SLOT3_RESERVE);
}
