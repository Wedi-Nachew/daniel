# Mill Receipt Pro 🧾

A professional, production-ready mobile application for local mill houses in Eritrea. Built with React Native and Expo, this app enables mill owners and workers to create, print, and manage milling service receipts offline using Bluetooth thermal printers.

## Features ✨

- **Quick Billing**: Fast receipt creation with real-time calculations
- **Analytics Dashboard**: Revenue tracking with custom date ranges
- **Receipt History**: PIN-protected access to view and reprint past receipts
- **Bluetooth Printing**: Support for ESC/POS thermal printers (58mm optimized)
- **Bilingual Support**: Full support for English and Tigrigna (ትግርኛ)
- **Offline First**: Works completely offline, no internet required
- **Business Branding**: Upload logo and customize business information

## Tech Stack 🛠️

- **React Native**: 0.74.0
- **Expo**: ~51.0.0
- **Expo Router**: ~3.5.0
- **React Native Paper**: Material Design components
- **AsyncStorage**: Local data persistence
- **Expo Crypto**: Secure PIN hashing
- **date-fns**: Date manipulation
- **react-native-esc-pos-printer**: Bluetooth thermal printer integration

## Prerequisites 📋

Before you begin, ensure you have the following installed:

- **Node.js**: v18 or higher ([Download](https://nodejs.org/))
- **npm** or **yarn**: Package manager
- **Expo CLI**: Install globally with `npm install -g expo-cli`
- **Expo Go App**: Install on your mobile device from App Store or Play Store

For iOS development:
- macOS with Xcode installed
- iOS Simulator

For Android development:
- Android Studio with SDK
- Android Emulator or physical device

## Installation 🚀

### 1. Clone or Download the Project

```bash
cd mill-receipt-pro
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Start the Development Server

```bash
npm start
# or
expo start
```

This will open the Expo Developer Tools in your browser.

### 4. Run on Device/Emulator

**Using Expo Go (Easiest for Development):**
- Scan the QR code with your phone's camera (iOS) or Expo Go app (Android)
- The app will load on your device

**Using iOS Simulator:**
```bash
npm run ios
```

**Using Android Emulator:**
```bash
npm run android
```

## Project Structure 📁

```
mill-receipt-pro/
├── app/
│   ├── _layout.js              # Root layout with providers
│   └── index.js                # Main app with navigation
├── components/
│   ├── QuickBillingScreen.js   # Quick billing screen
│   ├── AnalyticsScreen.js      # Analytics and reports
│   ├── HistoryScreen.js        # PIN-protected history
│   └── SettingsScreen.js       # Settings and business info
├── utils/
│   ├── constants.js            # Color theme and constants
│   ├── translations.js         # Bilingual translations
│   ├── storage.js              # AsyncStorage operations
│   ├── security.js             # PIN hashing utilities
│   └── printer.js              # Bluetooth printer functions
├── assets/
│   ├── icon.png                # App icon (1024x1024)
│   ├── splash.png              # Splash screen
│   └── adaptive-icon.png       # Android adaptive icon
├── package.json
├── app.json
└── README.md
```

## Configuration ⚙️

### App Configuration (app.json)

The `app.json` file contains all app-level configurations:

- **App Name**: Mill Receipt Pro
- **Bundle ID**: com.millreceiptpro.app
- **Version**: 1.0.0
- **Permissions**: Bluetooth, Camera, Storage

### Color Theme

The app uses a modern purple/violet gradient theme defined in `utils/constants.js`:

```javascript
Primary: #7C3AED (Purple)
Secondary: #EC4899 (Pink)
Success: #10B981 (Green)
Error: #EF4444 (Red)
```

## Bluetooth Printer Setup 🖨️

### Supported Printers

This app uses `react-native-esc-pos-printer` which supports:
- ESC/POS standard thermal printers
- Bluetooth, USB, and Network connectivity
- 58mm thermal paper (optimized)

### Connecting a Printer

1. Tap the printer icon (🖨️) in the top-right corner
2. Tap "Scan Printers" to search for available Bluetooth printers
3. Select your printer from the list
4. Status dot will turn green when connected

### Android Permissions

The app automatically requests the following permissions on Android:
- Android 12+: `BLUETOOTH_SCAN`, `BLUETOOTH_CONNECT`, `ACCESS_FINE_LOCATION`
- Android 11 and below: `BLUETOOTH`, `BLUETOOTH_ADMIN`, `ACCESS_FINE_LOCATION`

### Troubleshooting Printer Issues

**No printers found:**
- Ensure Bluetooth is enabled on your device
- Make sure the printer is powered on and in pairing mode
- Check that location permissions are granted (required for Bluetooth scanning on Android)

**Connection fails:**
- Unpair the printer from device Bluetooth settings and try again
- Restart the printer
- Ensure the printer is not connected to another device

**Print doesn't work:**
- Verify printer status shows green dot (connected)
- Check printer has paper loaded
- Ensure printer supports ESC/POS commands

## Usage Guide 📖

### Quick Billing

1. Enter item name, quantity, and unit price
2. Tap "Add Item" to add to current bill
3. Add multiple items as needed
4. Review the current bill with total
5. Tap "Print & Save" to save and print receipt

### Analytics

1. Select date range using "From" and "To" fields (YYYY-MM-DD format)
2. Tap "Calculate" to generate analytics
3. View total receipts and revenue
4. See top services ranked by revenue

### History (PIN-Protected)

**First Time Setup:**
1. Create a 4-digit PIN
2. Set a security question and answer
3. PIN is securely hashed using SHA-256

**Unlocking:**
1. Enter your 4-digit PIN
2. Tap "Unlock"

**Forgot PIN:**
1. Tap "Forgot PIN?"
2. Answer your security question
3. Set a new PIN

**Viewing & Reprinting:**
1. Browse all past receipts
2. Filter by date range
3. Tap "Print Copy" to reprint (adds COPY watermark)

### Settings

**Language:**
- Switch between English and Tigrigna (ትግርኛ)
- All text updates immediately

**Business Logo:**
- Upload from gallery or take photo
- Displayed on printed receipts

**Business Information:**
- Set business name, phone, address
- Auto-saves as you type
- Printed on all receipts

## Building for Production 🏗️

### Create Development Build

For Bluetooth printer support, you need to create a development build (Expo Go doesn't support native modules):

```bash
npx expo prebuild
```

### Build for Android (APK)

```bash
# Build APK locally
npm run android --variant release

# Or use EAS Build (recommended)
npm install -g eas-cli
eas build --platform android --profile production
```

### Build for iOS (IPA)

```bash
# Requires Apple Developer account
npm run ios --configuration Release

# Or use EAS Build
eas build --platform ios --profile production
```

### EAS Build Configuration

Create `eas.json`:

```json
{
  "build": {
    "production": {
      "android": {
        "buildType": "apk"
      },
      "ios": {
        "buildConfiguration": "Release"
      }
    }
  }
}
```

## Data Management 💾

### Storage

All data is stored locally using AsyncStorage:
- **Receipts**: JSON array of all receipts
- **Business Info**: Business name, phone, address, logo
- **Security**: Hashed PIN and security Q&A
- **Language**: Selected language (en/ti)

### Data Persistence

- Receipts are auto-saved when created
- Business info saves automatically on change
- No data is sent to external servers
- All data stays on device

### Data Security

- PINs are hashed using SHA-256 with salt
- Security answers are case-insensitive and hashed
- No plaintext passwords are stored

## Customization 🎨

### Changing Colors

Edit `utils/constants.js`:

```javascript
export const COLORS = {
  primary: '#YOUR_COLOR',
  // ... other colors
};
```

### Adding Languages

Edit `utils/translations.js` and add new language:

```javascript
export const translations = {
  en: { /* English */ },
  ti: { /* Tigrigna */ },
  ar: { /* Your new language */ },
};
```

### Modifying Receipt Format

Edit `utils/printer.js` in the `printReceipt` function to customize layout.

## Troubleshooting 🔧

### App won't start

```bash
# Clear cache and reinstall
rm -rf node_modules
npm install
npx expo start -c
```

### Build errors

```bash
# Clear Expo cache
npx expo start -c

# Reset Metro bundler
npx react-native start --reset-cache
```

### AsyncStorage issues

```bash
# Clear app data on device or emulator
# iOS: Delete app and reinstall
# Android: Settings > Apps > Mill Receipt Pro > Clear Data
```

## Known Limitations ⚠️

1. **Bluetooth Printer**: Requires physical testing with real printer (simulator won't work)
2. **Expo Go**: Bluetooth printing only works in development builds, not Expo Go
3. **Platform-Specific**: Some features may behave differently on iOS vs Android

## Support & Contact 📞

**Developer**: Mill Receipt Pro Team
**Email**: developer@millreceiptpro.com
**Phone**: +291-XXX-XXXXXX
**Website**: www.millreceiptpro.com

For technical support, feature requests, or bug reports, please contact us via email or phone.

## License 📄

Copyright © 2024 Mill Receipt Pro. All rights reserved.

## Version History 📝

### Version 1.0.0 (Current)
- Initial release
- Quick billing with item management
- Analytics with date range filtering
- PIN-protected history
- Bluetooth thermal printer support
- Bilingual support (English/Tigrigna)
- Business branding (logo & info)
- Offline-first architecture

## Acknowledgments 🙏

Built with:
- React Native & Expo
- React Native Paper
- Expo ecosystem libraries
- react-native-esc-pos-printer
- Open source community

---

Made with ❤️ for mill houses in Eritrea
