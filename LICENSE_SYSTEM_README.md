# App Licensing System - Owner Guide

## Overview
Your Mill Receipt Pro app now has a comprehensive licensing system that prevents unauthorized use. Each installation requires a unique license key that only you can generate.

## How It Works

### 1. **Device-Specific Licensing**
- Each device gets a unique Device ID when the app is first installed
- License keys are generated specifically for each Device ID
- Keys cannot be shared between devices - they only work on the device they were created for

### 2. **Trial Period**
- New installations get a **7-day free trial**
- After 7 days, users must activate with a license key
- Trial countdown is shown in the app

### 3. **Activation Process**

#### For Customers:
1. Install the app
2. App shows their unique Device ID
3. Customer contacts you with:
   - Device ID
   - Business Name
4. Customer receives license key from you
5. Customer enters key in app to activate

#### For You (Owner):
1. Customer sends you their Device ID
2. Open the app Settings screen
3. **Tap the version number 7 times** to open Admin Panel
4. Enter customer's Device ID and Business Name
5. Generate license key
6. Copy and send key to customer

## Configuration

### Enable/Disable Licensing
Edit `utils/constants.js`:

```javascript
export const LICENSE_CONFIG = {
  MASTER_KEY: 'MRP2024_MASTER_KEY_SECURE',  // ⚠️ Change this to your own secret
  TRIAL_DAYS: 5,                             // Number of trial days
  REQUIRE_ACTIVATION: true,                  // Set to false to disable licensing
  ADMIN_PASSWORD: 'admin2024',               // ⚠️ Change this to your own password
};
```

### Change Master Key & Admin Password (REQUIRED!)
For better security:
1. **MASTER_KEY**: Change to your own secret phrase. This ensures only you can generate valid keys.
2. **ADMIN_PASSWORD**: Change to your own password. This protects the admin panel even if someone discovers the 7-tap secret.

## Security Features

✅ **Device Binding**: Keys only work on the specific device they were generated for
✅ **Unique IDs**: Each device has a unique identifier
✅ **Encrypted Validation**: Keys are validated using SHA-256 hashing
✅ **No Server Required**: Everything works offline
✅ **Hidden Admin Panel**: Only accessible by tapping version 7 times + password
✅ **Password Protected**: Admin panel requires password authentication
✅ **Trial Period**: Gives customers time to test before purchasing (5 days)

## Admin Access

### Opening Admin Panel:
1. Go to Settings screen
2. Scroll to Developer Info section
3. Tap on the **Version number 7 times quickly**
4. **Enter admin password** (default: `admin2024` - CHANGE THIS!)
5. Admin License Generator panel opens

### Generating License Keys:
1. Open Admin Panel (7 taps + password)
2. Enter customer's Device ID
3. Enter customer's Business Name (optional)
4. Tap "Generate License Key"
5. Copy the generated key
6. Send to customer via email/WhatsApp/etc.

### 📱 Where Customers Find Their Device ID:
- **First Launch**: Device ID is displayed prominently on the License Activation screen
- **Copy Button**: They can tap "Copy Device ID" to copy it to clipboard
- **Format**: 16-character code like `A1B2C3D4E5F6G7H8`
- **Location**: Top section of the license screen, in a highlighted box

## Customer Support Script

When a customer contacts you for activation:

```
Thank you for choosing Mill Receipt Pro!

To activate your app, please provide:
1. Your Device ID (shown in the app)
2. Your Business Name

I will generate a unique license key for your device.

Trial Period: 5 days
License: Lifetime (one-time activation)
```

## Troubleshooting

### Customer can't activate:
- Verify they entered the key correctly (with dashes)
- Confirm the Device ID matches what you used to generate the key
- Check if they're using the correct business name

### Want to transfer license:
- Generate a new key for the new device
- Old key will stop working on old device

### Disable licensing temporarily:
- Set `REQUIRE_ACTIVATION: false` in `utils/constants.js`
- Rebuild the app

## Revenue Protection

This system ensures:
- ✅ You control who uses your app
- ✅ Each customer needs a unique key
- ✅ APK sharing doesn't work (each device needs activation)
- ✅ You can track how many licenses you've issued
- ✅ You can charge per activation/license

## Recommended Pricing Model

1. **Free Trial**: 7 days (already configured)
2. **One-Time License**: $X per device/business
3. **Subscription**: $X per month (you can add expiration dates)
4. **Enterprise**: Unlimited devices for $X

## Next Steps

1. **Test the system**: Install on a test device and go through activation
2. **Change the Master Key**: Update `MASTER_KEY` in constants.js to your own secret
3. **Set your pricing**: Decide how much to charge per license
4. **Create customer support process**: How customers will contact you for keys
5. **Keep records**: Track which Device IDs you've issued keys for

## Important Notes

⚠️ **Keep the Master Key Secret**: Never share the `MASTER_KEY` from constants.js
⚠️ **Admin Panel is Hidden**: Only you know about the 7-tap secret
⚠️ **Backup Customer Data**: Keep a record of Device IDs and issued keys
⚠️ **Test Before Distribution**: Make sure licensing works before giving to customers

---

**Your app is now protected! 🎉**

Only devices with valid license keys (generated by you) can use the app after the trial period.
