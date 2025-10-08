# Mill Receipt Pro - Complete Owner Guide

## 🚀 Quick Start (First Time Setup)

### 1. Install Dependencies
```bash
npm install
```

### 2. Change Security Settings (CRITICAL!)
Edit `utils/constants.js`:

```javascript
export const LICENSE_CONFIG = {
  MASTER_KEY: 'YOUR_SECRET_KEY_HERE',        // ⚠️ CHANGE THIS!
  TRIAL_DAYS: 5,                             // 5-day trial period
  REQUIRE_ACTIVATION: true,                  // Keep true for protection
  ADMIN_PASSWORD: 'YOUR_PASSWORD_HERE',      // ⚠️ CHANGE THIS!
};
```

**Write these down somewhere safe!**

### 3. Update Contact Info
Edit `utils/translations.js`:
```javascript
developerEmail: '📧 your_email@example.com',
developerPhone: '📱 +291-XXX-XXXXXX',
developerWebsite: '🌐 www.yourwebsite.com',
```

### 4. Test the App
```bash
npm start
```

### 5. Build APK
```bash
eas build --platform android
```

---

## 📱 Where Customers Find Device ID

**It's the FIRST thing they see!**

When customers install your app:
1. License Activation screen appears
2. Device ID shown in large highlighted box
3. "Copy Device ID" button below it
4. One tap to copy

Format: `A1B2C3D4E5F6G7H8` (16 characters)

**Also visible in Settings:**
- New "Device ID" card at top of Settings screen
- Always accessible
- Copy button included

---

## 🔑 How to Generate License Keys

### Step-by-Step:

1. **Open Admin Panel**
   - Open your app
   - Go to Settings tab
   - Scroll to "Version" section
   - **Tap version number 7 times quickly**
   - Password prompt appears

2. **Enter Password**
   - Enter YOUR admin password
   - (The one you set in constants.js)
   - Admin panel opens

3. **Generate Key**
   - Enter customer's Device ID
   - Enter their Business Name (optional)
   - Tap "Generate License Key"
   - Key appears: `XXXX-XXXX-XXXX-XXXX`

4. **Copy & Send**
   - Tap "Copy License Key"
   - Send to customer via WhatsApp/Email

**Time: ~30 seconds per customer**

---

## 💬 Customer Communication Templates

### When Customer Contacts You:

**Customer:** "I want to use Mill Receipt Pro. My Device ID is A1B2C3D4E5F6G7H8"

**Your Response:**
```
Thank you for choosing Mill Receipt Pro! 🎉

I've generated your license key:
XXXX-XXXX-XXXX-XXXX

To activate:
1. Open the app
2. Enter this license key
3. Tap "Activate App"

Your app is now activated for lifetime use!

Price: $30 (one-time payment)
Payment: [Your payment method]

Questions? Contact me anytime!
```

### Initial Marketing Message:
```
🎉 Mill Receipt Pro - Professional Receipt Management

Features:
✓ Bluetooth receipt printing
✓ Inventory management
✓ Analytics & reports
✓ Bilingual (English/Tigrinya)
✓ PIN-protected history
✓ Offline operation

Trial: 5 days FREE
License: $30 (one-time, lifetime)

Download: [APK Link]
Support: [Your Contact]
```

---

## 🔐 Security Features

Your app has **triple-layer protection**:

1. **Hidden Gesture**: 7 taps on version (customers don't know this)
2. **Password Protected**: Requires YOUR password to access admin panel
3. **Device-Specific Keys**: Keys only work on the device they were made for

**Result:** Even if someone discovers the 7-tap secret, they CANNOT generate keys without your password!

---

## 💰 Pricing & Revenue

### Suggested Pricing:
- **Trial**: 5 days FREE
- **License**: $20-50 per device (one-time)
- **Transfer**: $10 (if customer changes device)

### Revenue Example:
- 10 customers/month × $30 = **$300/month**
- 50 customers/month × $30 = **$1,500/month**
- 100 customers/month × $30 = **$3,000/month**

### Payment Methods:
- Mobile money
- Bank transfer
- Cash (for local customers)

---

## 📊 Customer Tracking

Keep a simple spreadsheet:

| Date | Customer | Business | Device ID | License Key | Paid | Status |
|------|----------|----------|-----------|-------------|------|--------|
| 2024-01-15 | John Doe | ABC Mill | A1B2C3D4... | 1A2B-3C4D... | $30 | Active |
| 2024-01-16 | Jane Smith | XYZ Mill | B2C3D4E5... | 2B3C-4D5E... | $30 | Active |

---

## 🎯 Daily Operations

### Morning Routine:
1. Check messages for new license requests
2. Open admin panel (7 taps + password)
3. Generate keys for new customers
4. Send keys and collect payment

### When Customer Needs Help:
- Device ID location: "Open app, it's on the first screen"
- Activation: "Enter the key I sent you and tap Activate"
- Transfer: "Send me your new Device ID, I'll generate a new key"

---

## 🛠️ Troubleshooting

### Customer: "I can't find my Device ID"
> "Open the app. If you haven't activated yet, it's on the first screen in a big box. If already activated, go to Settings and you'll see it at the top."

### Customer: "The license key doesn't work"
> "Please check:
> 1. Key entered exactly as provided (with dashes)
> 2. Using the same device you sent the Device ID from
> 3. Try copying and pasting the key"

### Customer: "I got a new phone"
> "No problem! Open the app on your new phone, send me the new Device ID, and I'll generate a new key for you. [Optional: $10 transfer fee]"

### You: "Forgot admin password"
> Check `utils/constants.js` - your password is there

---

## ⚙️ Configuration Options

### Change Trial Period:
```javascript
// utils/constants.js
TRIAL_DAYS: 5,  // Change to any number of days
```

### Disable Licensing (For Testing):
```javascript
// utils/constants.js
REQUIRE_ACTIVATION: false,  // App works without license
```

### Change Admin Password:
```javascript
// utils/constants.js
ADMIN_PASSWORD: 'your_new_password',
```

**After changes, rebuild the app!**

---

## 📱 App Features (What Customers Get)

### Billing
- Quick manual billing
- Inventory-based billing
- Real-time calculations
- Print receipts via Bluetooth

### History
- View all past receipts
- Calendar navigation (Daily/Weekly/Monthly)
- Hourly filtering
- Delete individual receipts
- Clear all receipts
- Reprint copies
- PIN protected

### Analytics
- Date range analysis
- Hourly breakdown
- Top services/items
- Revenue tracking

### Inventory
- Add/edit items
- Set prices
- Quick billing from inventory

### Settings
- Business info with logo
- Language toggle (English/Tigrinya)
- Device ID display
- Printer connection

---

## ✅ Pre-Distribution Checklist

Before sharing your APK:

- [ ] Changed `ADMIN_PASSWORD` in constants.js
- [ ] Changed `MASTER_KEY` in constants.js
- [ ] Updated contact info in translations.js
- [ ] Tested on 2+ devices
- [ ] Verified admin panel opens (7 taps + password)
- [ ] Generated and tested a license key
- [ ] Activated successfully
- [ ] Built release APK
- [ ] Prepared customer support templates
- [ ] Set your pricing

---

## 🎉 You're Ready!

Your app is now:
✅ **Protected** - Triple-layer security
✅ **Monetizable** - Charge per license
✅ **Professional** - Complete feature set
✅ **Bilingual** - English & Tigrinya
✅ **Offline** - No internet needed
✅ **Trackable** - Know who uses it

**Start distributing and earning! 💰**

---

## 📞 Support

If you need help:
- Review `SECURITY_SUMMARY.md` for security details
- Check `FINAL_SETUP_CHECKLIST.md` for setup steps
- See `DAILY_OPERATIONS_GUIDE.md` for daily tasks

**Everything is documented and ready to go! 🚀**
