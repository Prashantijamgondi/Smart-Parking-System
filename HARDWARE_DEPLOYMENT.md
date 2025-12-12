# Hardware Deployment Guide (ESP8266)

Unlike the Backend (Render) or Frontend (Vercel), "deploying" the hardware code means **uploading it physically** to the ESP8266 chip.

## Prerequisites
1.  **Arduino IDE** installed on your computer.
2.  **ESP8266 Drivers** installed (CH340 or CP210x, depending on your board).
3.  **Blynk Library** installed in Arduino IDE (`Sketch` -> `Include Library` -> `Manage Libraries` -> Search "Blynk" -> Install).
4.  **ESP8266 Board Manager** installed (`Tools` -> `Board` -> `Boards Manager` -> Search "esp8266" -> Install).

## Steps to Upload

### 1. Open the Project
1.  Navigate to your project folder: `c:\new-projects\smart-parking-system`
2.  Double-click `parking_system.ino`.
3.  Arduino IDE will open. You should see two tabs:
    *   `parking_system.ino` (The main code)
    *   `secrets.h` (The configuration file)

### 2. Configure Environment (`secrets.h`)
1.  Click on the `secrets.h` tab.
2.  Update the **WiFi Credentials** for the location where the device will run:
    ```cpp
    #define WIFI_SSID "Actual_WiFi_Name"
    #define WIFI_PASS "Actual_WiFi_Password"
    ```
3.  Verify your **Pin/Port Configuration** matches your actual wiring:
    ```cpp
    #define PIN_IR_SLOT1 D1
    // ... etc
    ```

### 3. Connect Hardware
1.  Connect your ESP8266 NodeMCU to your computer via a Micro-USB data cable.
2.  In Arduino IDE, go to **Tools**.
3.  **Board**: Select `NodeMCU 1.0 (ESP-12E Module)`.
4.  **Port**: Select the COM port that appears (e.g., `COM3`, `COM5`).

### 4. Upload
1.  Click the **Arrow Icon (→)** in the top left corner (or go to `Sketch` -> `Upload`).
2.  Wait for the compilation and uploading process to finish.
3.  You will see "Done uploading" at the bottom.

## Verification
1.  Open the **Serial Monitor** (Magnifying glass icon in top right).
2.  Set baud rate to **115200**.
3.  Press the **RST** (Reset) button on the ESP8266.
4.  You should see:
    ```
    Connecting to WiFi: YourWifiName
    ...
    Connected to Blynk Cloud
    ```

## Production Note
Once uploaded, the code is "burned" onto the chip. You can unplug it from your computer and plug it into any USB power wall adapter at the parking lot. As long as the configured WiFi is available, it will connect to the cloud automatically.
