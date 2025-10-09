# Bluetooth Printer Quick Reference

## 🚀 Quick Start (5 Steps)

### 1. **Enable Bluetooth**
- Turn on Bluetooth on your Android device
- Turn on your thermal printer

### 2. **Open Printer Modal**
- Tap the 🖨️ icon in the app header
- Modal opens from bottom

### 3. **Scan for Printers**
- Tap "🔍 Scan for Printers" button
- Grant Bluetooth permissions if prompted
- Wait for scan to complete (up to 10 seconds)

### 4. **Connect**
- Tap on your printer from the list
- Wait for connection (green dot = connected)
- Modal closes automatically

### 5. **Print**
- From Billing screen: Create receipt → Tap "Print" button
- From History screen: Tap receipt → "Print" or "Print Copy"

## 📱 Status Indicators

| Color | Status | Meaning |
|-------|--------|---------|
| 🟢 Green | Connected | Ready to print |
| 🔴 Red | Disconnected | No printer connected |
| 🟡 Yellow | Scanning/Connecting | Operation in progress |

## 🔑 Key Functions

### From Code

```javascript
import { 
  scanForPrinters, 
  connectToPrinter, 
  printReceipt,
  getActivePrinter,
  isBluetoothEnabled 
} from './utils/printer';

// Quick scan and connect
const result = await scanForPrinters();
await connectToPrinter(result.printers[0]);

// Quick print
await printReceipt(receiptData, businessInfo);

// Check status
const printer = getActivePrinter();
const btEnabled = await isBluetoothEnabled();
```

## 🐛 Quick Fixes

| Problem | Solution |
|---------|----------|
| No devices found | 1. Enable Bluetooth<br>2. Turn on printer<br>3. Move closer |
| Can't connect | 1. Restart printer<br>2. Unpair from system BT settings<br>3. Try again |
| Print fails | 1. Check connection (green dot)<br>2. Verify printer has paper<br>3. Print test page |
| No permissions | Settings → Apps → Permissions → Enable Bluetooth |

## 🔍 Diagnostic Screen

Access via bottom navigation "Bluetooth" tab:

1. **Test Permissions** → Should show "✅ Granted"
2. **Check Bluetooth** → Should show "✅ Enabled"  
3. **Scan Devices** → Lists all found devices
4. **Tap Device** → Connects and shows status
5. **Check Logs** → See detailed operation logs

## 📄 Receipt Format

```
================================
      Your Business Name
      +1 234 567 8900
      123 Main Street
================================

Receipt #: 12345678
Date: 10/09/2025 14:30
--------------------------------

Item Name
  Qty x Price    Total

================================
Total: AMOUNT
================================
Thank you!
```

## ⚙️ Configuration

### Business Info (Settings Screen)
- Business Name
- Phone Number
- Address

### Printer Settings
- Auto-saves last connected printer
- Auto-reconnects on app start

## 🔐 Permissions Required

**Android 12+:**
- Bluetooth Scan
- Bluetooth Connect
- Fine Location

**Android 11 and below:**
- Bluetooth
- Bluetooth Admin
- Fine Location

## 📦 Supported Printers

### Tested Models
- MUNBYN ITPP129, ITPP941
- Rongta RPP210, RPP300
- Xprinter XP-P300, XP-P800
- GOOJPRT PT-210, PT-300

### Requirements
- Bluetooth Low Energy (BLE) support
- ESC/POS command compatibility
- 58mm or 80mm thermal paper

## 🛠️ Debug Mode

Enable in `utils/printer.js`:
```javascript
const DEBUG_MODE = true;
```

View logs:
```bash
npx react-native log-android
```

## 📞 Emergency Steps

If nothing works:

1. **Restart Everything**
   - Close app completely
   - Turn off printer
   - Disable Bluetooth
   - Enable Bluetooth
   - Turn on printer
   - Open app

2. **Reset Printer Connection**
   - Settings → Bluetooth
   - Forget/Unpair printer
   - Return to app
   - Scan and connect again

3. **Clear App Data**
   - Settings → Apps → Mill Receipt Pro
   - Storage → Clear Data
   - Open app and reconfigure

## ✅ Daily Checklist

**Before Opening:**
- [ ] Printer powered on
- [ ] Printer has paper
- [ ] Bluetooth enabled on device

**After Opening:**
- [ ] Check printer status (green dot)
- [ ] Print test page to verify
- [ ] Configure business info if needed

**End of Day:**
- [ ] Print final receipt copy for records
- [ ] Turn off printer to save power

## 🎯 Best Practices

1. **Keep Printer Nearby**: Within 10 meters of device
2. **Maintain Paper**: Check paper roll regularly
3. **Charge Battery**: Keep printer charged (if battery-powered)
4. **Test Daily**: Print test page at start of day
5. **Save Receipts**: Use "Print Copy" for duplicate records

## 📚 Full Documentation

For detailed information, see:
- `BLUETOOTH_PRINTER_SETUP.md` - Complete setup guide
- `README.md` - Project overview
- `DAILY_OPERATIONS_GUIDE.md` - Daily usage instructions

