# Owner Quick Guide - License Management

## 🚀 Quick Start

### How to Generate License Keys for Customers

1. **Open Admin Panel**
   - Open your app
   - Go to Settings
   - Tap the version number **7 times quickly**
   - **Enter admin password** (default: `admin2024`)
   - Admin panel opens

2. **Generate Key**
   - Customer sends you their Device ID
   - Enter Device ID in admin panel
   - Enter their Business Name (optional)
   - Tap "Generate License Key"
   - Copy the key

3. **Send to Customer**
   - Send the license key via WhatsApp/Email
   - Customer enters it in their app
   - Done! ✅

### 📱 Where to Find Device ID

**For Customers:**
- When they first open the app, the **License Activation screen** shows their Device ID
- They can tap "Copy Device ID" button to copy it
- It looks like: `A1B2C3D4E5F6G7H8` (16 characters)

**For You (Testing):**
- Open app on your device
- If already activated, you won't see it
- To see it: Clear app data or use Settings → Admin Panel → it shows there too

## 🔐 Security

- **Master Key**: Located in `utils/constants.js` - Change it to your own secret!
- **Admin Access**: Hidden - only you know about the 7-tap feature
- **Device Binding**: Each key only works on one specific device
- **No Sharing**: APK sharing won't work - each device needs its own key

## ⚙️ Configuration

Edit `utils/constants.js`:

```javascript
export const LICENSE_CONFIG = {
  MASTER_KEY: 'YOUR_SECRET_KEY_HERE',     // ⚠️ CHANGE THIS!
  TRIAL_DAYS: 5,                          // Trial period (now 5 days)
  REQUIRE_ACTIVATION: true,               // Enable/disable licensing
  ADMIN_PASSWORD: 'your_password_here',   // ⚠️ CHANGE THIS!
};
```

**⚠️ IMPORTANT: Change both MASTER_KEY and ADMIN_PASSWORD before distributing!**

## 💰 Monetization

You now control who uses your app:
- Charge per license/device
- Offer trial period (5 days default)
- Track all activations
- Prevent APK sharing

## 📱 Customer Flow

1. Customer installs APK
2. Gets **5-day trial** automatically
3. Sees their **Device ID** prominently displayed on license screen
4. Can tap "Copy Device ID" to copy it
5. Contacts you for activation
6. You generate and send key (requires YOUR password)
7. Customer activates
8. App works forever on that device

## 🛠️ Troubleshooting

**Customer says key doesn't work:**
- Check if Device ID matches exactly
- Verify key was copied correctly (with dashes)
- Make sure business name matches if you used one

**Want to disable licensing:**
- Set `REQUIRE_ACTIVATION: false` in constants.js
- Rebuild app

**Want to change trial period:**
- Set `TRIAL_DAYS: X` in constants.js (X = number of days)
- Rebuild app

## 📊 Tracking Customers

Keep a simple spreadsheet:
| Device ID | Business Name | License Key | Date Issued | Status |
|-----------|---------------|-------------|-------------|--------|
| ABC123... | Mill House A  | XXXX-XXXX...| 2024-01-15  | Active |

## ⚠️ Important

- **Never share your Master Key**
- **Keep admin panel secret** (7-tap feature)
- **Test on a device first** before distributing
- **Backup customer records** (Device IDs and keys)

---

**Your app is now protected and monetizable! 🎉**
