# Build Release APK Using Gradlew - Step by Step Guide

## 🎯 Goal
Build a production-ready APK locally using gradlew for your Bluetooth thermal printer app.

---

## 📋 Prerequisites

Before starting, ensure you have:
- ✅ Node.js installed (v18+)
- ✅ Java JDK installed (JDK 11 or 17 recommended)
- ✅ Android SDK installed (via Android Studio or standalone)
- ✅ Environment variables set: `ANDROID_HOME`, `JAVA_HOME`

### Check Your Setup
```bash
# Check Node.js
node --version

# Check Java
java -version

# Check Android SDK
echo $ANDROID_HOME  # or: echo %ANDROID_HOME% on Windows
```

---

## 🚀 Step-by-Step Build Process

### Step 1: Generate Native Android Project
Since this is an Expo project, you need to generate the native Android code first:

```bash
# Clean prebuild (removes existing android folder if any)
npx expo prebuild --clean

# This will:
# - Create android/ folder
# - Generate all native code
# - Configure Bluetooth printer module
# - Set up permissions
```

**Expected output:**
```
✔ Created native android project
✔ Configured Android manifest
✔ Linked native modules
```

---

### Step 2: Navigate to Android Directory
```bash
cd android
```

---

### Step 3: Check Available Gradle Tasks (Optional)
```bash
# List all build tasks
./gradlew tasks --all | grep -i release

# Or on Windows:
gradlew.bat tasks --all | findstr /i release
```

---

### Step 4: Build Release APK
```bash
# On macOS/Linux:
./gradlew assembleRelease

# On Windows:
gradlew.bat assembleRelease
```

**What this does:**
- Compiles your app in release mode
- Optimizes the code
- Generates APK file
- Signs with debug keystore (for testing)

**Build time:** 2-5 minutes depending on your machine

---

### Step 5: Locate Your APK
After successful build, your APK will be at:
```
android/app/build/outputs/apk/release/app-release.apk
```

**From project root:**
```bash
# On macOS/Linux:
ls -lh android/app/build/outputs/apk/release/

# On Windows:
dir android\app\build\outputs\apk\release\
```

---

## 🔐 Production Build with Custom Signing

For production distribution, you should sign with your own keystore:

### Step 1: Generate Keystore (First Time Only)
```bash
# Generate a release keystore
keytool -genkey -v -keystore my-mill-receipt-release-key.keystore \
  -alias mill-receipt-key \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000

# You'll be asked for:
# - Keystore password (REMEMBER THIS!)
# - Your name, organization, etc.
```

**⚠️ IMPORTANT:** 
- Store the keystore file safely
- Remember the password
- Never commit keystore to git
- Make backups!

### Step 2: Configure Gradle for Signing
Edit `android/app/build.gradle`:

```gradle
android {
    ...
    signingConfigs {
        release {
            storeFile file('../my-mill-receipt-release-key.keystore')
            storePassword 'YOUR_KEYSTORE_PASSWORD'
            keyAlias 'mill-receipt-key'
            keyPassword 'YOUR_KEY_PASSWORD'
        }
    }
    
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

### Step 3: Build Signed Release
```bash
cd android
./gradlew assembleRelease
```

Now your APK is properly signed for production!

---

## 🧪 Alternative: Build APK Bundle (AAB)

For Google Play Store, use AAB instead of APK:

```bash
cd android
./gradlew bundleRelease
```

**Output location:**
```
android/app/build/outputs/bundle/release/app-release.aab
```

---

## 📱 Install & Test APK

### Install on Connected Device
```bash
# From project root
cd android
./gradlew installRelease

# Or manually with adb
adb install app/build/outputs/apk/release/app-release.apk
```

### Transfer to Other Devices
```bash
# Copy APK to desktop
cp android/app/build/outputs/apk/release/app-release.apk ~/Desktop/MillReceiptPro.apk

# Or specific location
cp android/app/build/outputs/apk/release/app-release.apk /path/to/destination/
```

---

## 🛠️ Troubleshooting

### Issue 1: `android` folder not found
**Solution:** Run prebuild first
```bash
npx expo prebuild --clean
```

### Issue 2: Gradle daemon fails
**Solution:** Stop and restart
```bash
cd android
./gradlew --stop
./gradlew assembleRelease
```

### Issue 3: Build fails with "SDK not found"
**Solution:** Set ANDROID_HOME
```bash
# macOS/Linux (add to ~/.bashrc or ~/.zshrc)
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools

# Windows (System Environment Variables)
ANDROID_HOME = C:\Users\YourName\AppData\Local\Android\Sdk
```

### Issue 4: Java version mismatch
**Solution:** Use Java 11 or 17
```bash
# Check Java version
java -version

# If wrong version, install JDK 11 or 17
# macOS: brew install openjdk@11
# Windows: Download from Oracle/Adoptium
```

### Issue 5: Out of memory
**Solution:** Increase Gradle memory
Edit `android/gradle.properties`:
```properties
org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=512m
```

### Issue 6: Build succeeds but APK is huge
**Solution:** Enable shrinking (already in build.gradle)
```gradle
buildTypes {
    release {
        minifyEnabled true
        shrinkResources true
    }
}
```

---

## 📊 Build Optimization Tips

### 1. Clean Build (if having issues)
```bash
cd android
./gradlew clean
./gradlew assembleRelease
```

### 2. Build with Debug Info (for troubleshooting)
```bash
./gradlew assembleRelease --stacktrace --info
```

### 3. Parallel Build (faster)
Edit `android/gradle.properties`:
```properties
org.gradle.parallel=true
org.gradle.daemon=true
org.gradle.configureondemand=true
```

### 4. Use Build Cache
```properties
android.enableBuildCache=true
org.gradle.caching=true
```

---

## 🎯 Complete Build Script

For convenience, create a build script:

**`build-release.sh` (macOS/Linux):**
```bash
#!/bin/bash

echo "🏗️  Building Mill Receipt Pro APK..."

# Step 1: Generate native code
echo "📱 Generating native Android code..."
npx expo prebuild --clean

# Step 2: Build release APK
echo "🔨 Building release APK..."
cd android
./gradlew assembleRelease

# Step 3: Copy APK to root
echo "📦 Copying APK..."
cp app/build/outputs/apk/release/app-release.apk ../MillReceiptPro.apk

echo "✅ Build complete! APK: MillReceiptPro.apk"
```

**Make executable:**
```bash
chmod +x build-release.sh
./build-release.sh
```

**`build-release.bat` (Windows):**
```batch
@echo off
echo 🏗️  Building Mill Receipt Pro APK...

echo 📱 Generating native Android code...
call npx expo prebuild --clean

echo 🔨 Building release APK...
cd android
call gradlew.bat assembleRelease

echo 📦 Copying APK...
copy app\build\outputs\apk\release\app-release.apk ..\MillReceiptPro.apk

echo ✅ Build complete! APK: MillReceiptPro.apk
cd ..
```

**Run:**
```cmd
build-release.bat
```

---

## 📋 Quick Command Reference

```bash
# 1. Generate native code
npx expo prebuild --clean

# 2. Build release APK
cd android && ./gradlew assembleRelease

# 3. Build release AAB (for Play Store)
cd android && ./gradlew bundleRelease

# 4. Install on device
cd android && ./gradlew installRelease

# 5. Clean build
cd android && ./gradlew clean assembleRelease

# 6. Build with logs
cd android && ./gradlew assembleRelease --stacktrace --info
```

---

## ✅ Build Checklist

Before distributing your APK:

- [ ] Updated version in `app.json` (version & versionCode)
- [ ] Tested all features on development build
- [ ] Verified Bluetooth printer works
- [ ] Tested license system
- [ ] Checked business info displays correctly
- [ ] Verified all screens work
- [ ] Tested on different Android versions
- [ ] Signed with production keystore (for production)
- [ ] Tested APK on fresh device
- [ ] Verified APK size is reasonable (< 50MB)

---

## 🚀 Your Build Commands

Since you want to use gradlew for local release:

### First Time Build:
```bash
# 1. Generate Android project
npx expo prebuild --clean

# 2. Navigate to Android folder
cd android

# 3. Build release APK
./gradlew assembleRelease

# 4. Find APK at:
# android/app/build/outputs/apk/release/app-release.apk
```

### Subsequent Builds:
```bash
# Just rebuild (android folder already exists)
cd android
./gradlew assembleRelease
```

### Clean Build:
```bash
cd android
./gradlew clean
./gradlew assembleRelease
```

---

## 📱 Distribution

After building:

1. **Rename APK** for clarity:
   ```bash
   mv app-release.apk MillReceiptPro-v1.0.0.apk
   ```

2. **Share via:**
   - Google Drive
   - WhatsApp
   - Email
   - Your website
   - Direct USB transfer

3. **Installation Instructions for Users:**
   - Enable "Install from Unknown Sources"
   - Download APK
   - Tap to install
   - Grant required permissions (Bluetooth, Location)

---

## 🎉 Success!

Your release APK is ready for distribution! 🚀

**APK Location:** `android/app/build/outputs/apk/release/app-release.apk`

**What's Included:**
- ✅ Bluetooth thermal printer support
- ✅ License system
- ✅ Offline-first architecture
- ✅ Bilingual support (English/Tigrigna)
- ✅ All features optimized and production-ready

---

*Build Guide Version: 1.0*  
*For: Mill Receipt Pro*  
*Last Updated: October 9, 2025*

