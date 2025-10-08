# ✅ Final Setup Checklist - Before Distribution

## Step 1: Change Security Credentials (CRITICAL!)

### A. Change Admin Password
Open `utils/constants.js` and change:

```javascript
ADMIN_PASSWORD: 'admin2024',  // ← CHANGE THIS!
```

To something secure like:
```javascript
ADMIN_PASSWORD: 'MySecurePass2024!',
```

### B. Change Master Key
In the same file, change:

```javascript
MASTER_KEY: 'MRP2024_MASTER_KEY_SECURE',  // ← CHANGE THIS!
```

To something unique like:
```javascript
MASTER_KEY: 'MyUniqueSecretKey_2024_MillPro',
```

**⚠️ Write these down somewhere safe! You'll need the password to access admin panel.**

---

## Step 2: Update Contact Information

Edit `utils/translations.js` and update:

```javascript
developerEmail: '📧 YOUR_EMAIL@example.com',
developerPhone: '📱 +291-XXX-XXXXXX',
developerWebsite: '🌐 www.yourwebsite.com',
```

---

## Step 3: Test the App

```bash
npm start
```

Then test:

### A. Test License Screen
- [ ] App shows license screen on first launch
- [ ] Device ID is visible and can be copied
- [ ] Trial shows "5 days remaining"
- [ ] "Continue with Trial" button works

### B. Test Admin Panel
- [ ] Go to Settings
- [ ] Tap version 7 times
- [ ] Password prompt appears
- [ ] Enter YOUR new password
- [ ] Admin panel opens
- [ ] Can generate license keys

### C. Test Activation
- [ ] Generate a test key for your Device ID
- [ ] Clear app data
- [ ] Enter the key in license screen
- [ ] App activates successfully
- [ ] Restart app - stays activated

### D. Test History Features
- [ ] Calendar navigation works (Daily/Weekly/Monthly)
- [ ] Hourly filter works
- [ ] Delete receipt works
- [ ] Clear all works

---

## Step 4: Build Release APK

```bash
eas build --platform android --profile production
```

Or if you don't have EAS configured:

```bash
eas build --platform android --profile preview
```

---

## Step 5: Prepare Customer Materials

### A. Create Welcome Message Template

```
🎉 Welcome to Mill Receipt Pro!

Your 5-day FREE trial has started.

To activate after trial:
1. Open the app
2. Copy your Device ID (shown on screen)
3. Send me: Device ID + Your Business Name
4. I'll send you a license key
5. Enter key to activate

Price: $30 (one-time, lifetime access)

Contact: [Your Email/Phone]
```

### B. Create Activation Instructions

```
Thank you for your purchase! 🎉

Your License Key: XXXX-XXXX-XXXX-XXXX

To activate:
1. Open Mill Receipt Pro
2. Enter the license key above
3. Tap "Activate App"

Your app is now activated for lifetime use!

Need help? Contact me anytime.
```

---

## Step 6: Distribution Checklist

Before sharing the APK:

- [ ] Admin password changed from default
- [ ] Master key changed from default
- [ ] Contact info updated in translations
- [ ] Tested on at least 2 devices
- [ ] License generation works
- [ ] License activation works
- [ ] Trial period shows correctly (5 days)
- [ ] APK built and tested
- [ ] Customer support templates ready

---

## Step 7: First Customer Test

Give APK to a trusted friend/family member:

1. They install and see Device ID
2. They send you the Device ID
3. You generate key (7 taps + password)
4. You send them the key
5. They activate successfully
6. ✅ System works!

---

## 🎯 Quick Reference Card (Print This!)

```
═══════════════════════════════════════════
    MILL RECEIPT PRO - OWNER CARD
═══════════════════════════════════════════

Admin Password: [Write yours here]
Master Key: [Keep in constants.js]

To Generate License:
1. Settings → Tap version 7x
2. Enter password
3. Enter customer Device ID
4. Generate & copy key
5. Send to customer

Trial Period: 5 days
Price: $XX per license

Support: [Your contact info]
═══════════════════════════════════════════
```

---

## ✨ You're Ready!

Once you complete this checklist:

✅ Your app is **fully protected**
✅ Only YOU can generate license keys
✅ Customers get 5-day trial
✅ Device ID is easy to find
✅ Admin panel is password-protected
✅ Ready to distribute and monetize

**Start distributing your app and earning revenue! 💰**

---

## 📞 Need Help?

If you encounter issues:
1. Check `TESTING_LICENSE_SYSTEM.md` for detailed testing
2. Review `SECURITY_SUMMARY.md` for security details
3. See `WHERE_IS_DEVICE_ID.md` for Device ID location
4. Read `DAILY_OPERATIONS_GUIDE.md` for day-to-day operations

**Everything is documented and ready to go! 🚀**
