# How to Build APK Locally

## Method 1: Using Expo (Recommended for Quick Testing)

### Step 1: Install Expo CLI
```bash
npm install -g expo-cli
```

### Step 2: Build APK
```bash
npx expo export --platform android
```

This creates an optimized bundle, but you'll need to use EAS Build or Android Studio for the actual APK.

---

## Method 2: Using EAS Build (Cloud - Easiest)

### Step 1: Install EAS CLI
```bash
npm install -g eas-cli
```

### Step 2: Login to Expo
```bash
eas login
```

### Step 3: Configure EAS (First Time Only)
```bash
eas build:configure
```

### Step 4: Build APK
```bash
# For testing (faster)
eas build --platform android --profile preview

# For production (optimized)
eas build --platform android --profile production
```

The APK will be built in the cloud and you'll get a download link.

---

## Method 3: Using Android Studio (Fully Local)

This is the truly local method that doesn't require cloud services.

### Prerequisites:
1. **Android Studio** installed
2. **Java JDK** installed
3. **Android SDK** configured

### Step 1: Eject from Expo
```bash
npx expo prebuild
```

This creates `android/` and `ios/` folders.

### Step 2: Open in Android Studio
1. Open Android Studio
2. File → Open → Select the `android` folder
3. Wait for Gradle sync to complete

### Step 3: Build APK
```bash
cd android
./gradlew assembleRelease
```

Or in Android Studio:
- Build → Build Bundle(s) / APK(s) → Build APK(s)

### Step 4: Find Your APK
The APK will be at:
```
android/app/build/outputs/apk/release/app-release.apk
```

---

## Method 4: Quick Local Build (Recommended)

### Step 1: Install Required Tools
```bash
npm install -g eas-cli
```

### Step 2: Configure for Local Build
Create/update `eas.json`:

```json
{
  "build": {
    "preview": {
      "android": {
        "buildType": "apk",
        "gradleCommand": ":app:assembleRelease"
      }
    },
    "production": {
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

### Step 3: Build Locally
```bash
eas build --platform android --profile preview --local
```

**Note:** This requires Android Studio and SDK installed.

---

## 🚀 Fastest Method (For Your Case)

Since you already have `eas.json`, use this:

### Option A: Cloud Build (Easiest - No Setup)
```bash
# Install EAS CLI if not installed
npm install -g eas-cli

# Login (create free Expo account if needed)
eas login

# Build APK (takes 10-15 minutes)
eas build --platform android --profile preview
```

You'll get a download link for the APK.

### Option B: Local Build (If You Have Android Studio)
```bash
# Prebuild native code
npx expo prebuild

# Build APK
cd android
./gradlew assembleRelease

# APK location:
# android/app/build/outputs/apk/release/app-release.apk
```

---

## 📱 After Building

### 1. Test the APK
- Install on a test device
- Test all features
- Verify license system works
- Check Device ID displays correctly

### 2. Sign the APK (For Production)
If using local build, you need to sign it:

```bash
# Generate keystore (first time only)
keytool -genkey -v -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000

# Sign APK
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore my-release-key.keystore app-release.apk my-key-alias

# Optimize APK
zipalign -v 4 app-release.apk app-release-aligned.apk
```

### 3. Distribute
- Upload to Google Drive
- Share via WhatsApp
- Email to customers
- Host on your website

---

## ⚡ Quick Command Reference

```bash
# Cloud build (easiest)
eas build --platform android --profile preview

# Local build (requires Android Studio)
npx expo prebuild
cd android
./gradlew assembleRelease

# Development build
npx expo run:android

# Start dev server
npm start
```

---

## 🎯 Recommended Approach

**For your first APK:**

1. Use **EAS Cloud Build** (easiest):
   ```bash
   npm install -g eas-cli
   eas login
   eas build --platform android --profile preview
   ```

2. Wait 10-15 minutes
3. Download APK from the link
4. Test on device
5. Distribute to customers

**For future builds:**
- Set up local Android Studio build for faster iterations
- Use cloud build for production releases

---

## 💡 Tips

- **First time?** Use cloud build (EAS) - it's easier
- **Have Android Studio?** Use local build - it's faster
- **Testing?** Use `--profile preview` for APK
- **Production?** Use `--profile production` for optimized build
- **Signing?** EAS handles it automatically, local build needs manual signing

---

**Choose the method that works best for you! 🚀**
