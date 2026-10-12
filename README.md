# Mill Receipt Pro 🧾
### *Offline Mobile Point-of-Sale & Receipt System for Grain Mills*

[![React Native](https://img.shields.io/badge/React%20Native-0.74.5-61DAFB?logo=react&logoColor=white)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-SDK%2051-000020?logo=expo&logoColor=white)](https://expo.dev/)
[![Platform](https://img.shields.io/badge/Platform-Android%20%7C%20iOS-3DDC84?logo=android&logoColor=white)](https://www.android.com/)
[![Offline First](https://img.shields.io/badge/Architecture-100%25%20Offline%20First-success)](#architecture--data-flow)
[![Language](https://img.shields.io/badge/Languages-English%20%7C%20ትግርኛ%20(Tigrinya)-orange)](#bilingual-support)
[![License](https://img.shields.io/badge/License-Commercial%20Proprietary-red)](#licensing--activation)

---

## Executive Overview 🌾

**Mill Receipt Pro** is a robust, production-grade mobile Point-of-Sale (POS) and accounting application engineered specifically for grain mill houses (*መጥሓን*) in Ethiopia and the wider region. 

Designed for environments where network connectivity and power infrastructure can be intermittent, the application operates **100% offline**. It pairs directly with portable **58mm ESC/POS Bluetooth thermal printers** to generate fast, bilingual customer receipts, track customer credit and debt repayments, manage grain service pricing, and deliver actionable revenue analytics without requiring internet access or cloud subscriptions.

---

## Key Features ✨

### 🧾 1. Rapid Milling Billing & Pre-sets
- **Lightning-Fast Ticket Generation**: Add line items with quantity (kg/bags) and unit pricing with real-time total calculations.
- **Preconfigured Grain Catalog**: Instant support for regional staples including **Taff (ጣፍ)**, **Wheat / Snday (ስንዳይ)**, **Barley / Sgem (ስገም)**, **Sorghum / Mshela (ምሸላ)**, **Berbere (በርበረ)**, **Shro (ሽሮ)**, **Dagusha (ዳጉሻ)**, and more.
- **Live Receipt Preview**: Full modal preview displaying business branding, line items, timestamps, and payment status prior to printing.

### 💳 2. Credit & Unpaid Debt Ledger
- **Flexible Payment Status**: Mark receipts as **Fully Paid**, **Fully Unpaid**, or **Partially Paid** at checkout.
- **Customer Debt Tracking**: Associate outstanding balances with customer names for transparent credit recording.
- **Partial Payment Settlement**: Dedicated debt management screen allowing customers to pay down debts over time with automatic balance recalculation.
- **Audit Trails & Confirmation Slips**: Logs every payment event with timestamps and prints dedicated settlement slips (`-CONF`).

### 🖨️ 3. Dual Print Engine (Bluetooth Thermal + High-Res PDF)
- **Direct ESC/POS BLE Thermal Printing**: Fast 58mm mobile receipt printing using low-energy Bluetooth.
- **Smart Phonetic Tigrinya Transliteration**: Automatic Ge'ez-to-Latin transliteration and dictionary matching so standard ESC/POS printers render Tigrinya names cleanly without missing characters.
- **Native Ge'ez Ethiopic PDF Export**: High-fidelity PDF generation (`react-native-html-to-pdf`) preserving native Tigrinya typography (`ትግርኛ`) with system print and instant messaging sharing (`expo-sharing`).
- **Auto-Reconnect & Self-Healing**: Background Bluetooth polling with automatic reconnection to previously paired printers.

### 📊 4. Business Analytics & Financial Insights
- **Flexible Time Horizons**: Real-time sales aggregation across **Daily**, **Weekly**, and **Monthly** intervals.
- **Hourly Traffic Distribution**: Visualizes peak milling hours so owners can optimize staff and machinery operation.
- **Top Service Ranking**: Identifies top-performing grains and services ranked by total revenue contribution.
- **Duplicate Protection**: Duplicate/reprinted receipts are automatically excluded from financial metrics to prevent distorted accounting.

### 📦 5. Inventory & Service Pricing Management
- **Customizable Services**: Define and update milling rates per grain type.
- **Instant Synchronization**: Changes to service prices reflect immediately in the billing catalog.

### 🔐 6. Role-Based Security & PIN Protection
- **Restricted Access**: Protects transaction history, receipt deletion, and settings with a 4-digit PIN.
- **Cryptographic Hashing**: PINs and security answers are hashed using **SHA-256 with salt** via `expo-crypto` (zero plaintext storage).
- **Two-Factor Recovery**: Built-in security question verification allows safe PIN resets without data wipe.
- **Watermarked Reprints**: Reprinted slips are watermarked with `* COPY / ቅዳሕ *` to prevent ticket fraud.

### 🔑 7. Device-Bound Hardware Licensing
- **Device-Tied Activation**: Generates a tamper-resistant 16-character Hardware Device ID tied to device hardware.
- **Configurable Free Trial**: Automatic 5-day trial period with live countdown banner.
- **Cryptographic License Keys**: SHA-256 signature verification preventing key piracy across different devices.
- **Hidden Admin Generator**: Secure multi-tap owner panel for instant customer key generation.

---

## System Architecture 🏗️

```
┌─────────────────────────────────────────────────────────────────┐
│                    Mill Receipt Pro (Client)                    │
├─────────────────┬───────────────────────────────┬───────────────┤
│   Presentation  │         Business Logic        │    Storage    │
├─────────────────┼───────────────────────────────┼───────────────┤
│ • Quick Billing │ • Pricing & Tax Computation   │ • Receipts    │
│ • Debt Ledger   │ • Phonetic Transliteration    │ • Business    │
│ • Analytics     │ • SHA-256 Cryptographic Auth  │ • Inventory   │
│ • Settings      │ • ESC/POS Byte Formatting     │ • Security    │
│ • Printer Modal │ • License Validation          │ • Preferences │
└────────┬────────┴───────────────┬───────────────┴───────┬───────┘
         │                        │                       │
         ▼                        ▼                       ▼
┌──────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ 58mm BLE Thermal │    │ High-Res Ge'ez   │    │  AsyncStorage   │
│ ESC/POS Printer  │    │ PDF / Share      │    │  Local Engine   │
└──────────────────┘    └──────────────────┘    └─────────────────┘
```

---

## Tech Stack 🛠️

| Category | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | [React Native 0.74.5](https://reactnative.dev/) | Cross-platform native mobile runtime |
| **Tooling** | [Expo SDK 51](https://expo.dev/) & [Expo Router 3.5](https://docs.expo.dev/router/introduction/) | Application lifecycle, routing, and native plugins |
| **UI Components** | [React Native Paper 5.12](https://callstack.github.io/react-native-paper/) | Modern Material Design UI components |
| **Hardware Printing** | `react-native-thermal-receipt-printer-image-qr` | Low-level ESC/POS Bluetooth protocol communication |
| **Document Engine** | `react-native-html-to-pdf` & `react-native-print` | High-resolution PDF generation with Ethiopic font support |
| **Cryptography** | `expo-crypto` & `expo-device` | SHA-256 PIN hashing, device fingerprinting & license generation |
| **Data Storage** | `@react-native-async-storage/async-storage` | High-performance, zero-latency local persistent key-value store |
| **Date & Time** | `date-fns 3.0` | Calendar parsing, shift intervals, and report aggregation |

---

## Prerequisites & Requirements 📋

- **Node.js**: `v18.0.0` or higher ([Download Node.js](https://nodejs.org/))
- **Package Manager**: `npm` (`v9+`) or `yarn`
- **Expo CLI**: `npx expo`
- **Mobile Hardware**:
  - Android device running **Android 8.0 (Oreo)** or higher (Android 12+ fully supported with granular Bluetooth permissions).
  - Portable **58mm ESC/POS Bluetooth Thermal Printer** (e.g., MPT-II, POS-5802, Goojprt, or equivalent).

> **Important**: Native Bluetooth hardware modules cannot run inside generic Expo Go client apps. You must generate a development build (`npx expo run:android`) or standalone production APK.

---
## Operational Guide 📖

### 1. Bluetooth Printer Pairing
1. Power on your 58mm thermal printer and enable Bluetooth on the mobile device.
2. Tap the **Printer Icon (🖨️)** in the top navigation bar.
3. Tap **"Scan Printers"** to locate nearby Bluetooth devices.
4. Select your printer from the list; the indicator turns **Green** upon connection.
5. The app automatically remembers and reconnects to this device on subsequent launches.

### 2. Processing a Milling Order
1. In the **Billing** tab, select a grain type or type a custom service name.
2. Enter the quantity and unit price, then tap **"+ Add Item"**.
3. Choose the payment status:
   - **Paid**: Order is settled immediately.
   - **Unpaid / Partial**: Specify the amount collected now and enter the customer's name.
4. Tap **"🖨️ Print"** to send the ESC/POS receipt directly to the thermal printer, or **"👁️ Preview"** to inspect and generate a shareable PDF.

### 3. Managing Customer Debts
1. Navigate to the **Unpaid (💳)** tab.
2. Search by customer name, ticket ID, or balance range.
3. Tap on a customer record to view balance history.
4. Enter payment amount received and tap **"Settle Payment"** to update balances and print a confirmation slip.

### 4. End-of-Day Financial Reconciliation
1. Open the **Analytics (📊)** tab.
2. Toggle between **Daily**, **Weekly**, or **Monthly** views.
3. Review total gross revenue, ticket count, and the hourly traffic graph to assess daily operations.

### 5. Accessing Protected History
1. Open the **History (📜)** tab.
2. Enter your 4-digit security PIN to unlock the archive.
3. Search or reprint any prior receipt.

---
