# Assets Required

This folder needs the following image files for the app to work properly:

## Required Files

### 1. icon.png
- **Size**: 1024x1024 pixels
- **Format**: PNG with transparency
- **Purpose**: App icon shown on device home screen
- **Design**: Purple gradient background (#7C3AED) with white mill/receipt icon

### 2. splash.png
- **Size**: 1284x2778 pixels (iPhone 13 Pro Max resolution)
- **Format**: PNG
- **Purpose**: Splash screen shown when app launches
- **Design**: Purple gradient (#7C3AED) with app logo and name

### 3. adaptive-icon.png
- **Size**: 1024x1024 pixels
- **Format**: PNG with transparency
- **Purpose**: Android adaptive icon (foreground layer)
- **Design**: Same as icon.png but with padding for Android's adaptive icon system

## How to Create Icons

### Option 1: Use Figma/Design Tool
1. Create 1024x1024 artboard
2. Add purple gradient background
3. Add white mill icon or "MRP" text
4. Export as PNG

### Option 2: Use Online Icon Generators
- [App Icon Generator](https://www.appicon.co/)
- [MakeAppIcon](https://makeappicon.com/)
- Upload a base image and it generates all sizes

### Option 3: Use Expo Asset Tools
```bash
npx expo-optimize
```

## Temporary Solution

For development, you can use placeholder images:

1. Create simple colored squares in any image editor
2. Name them correctly (icon.png, splash.png, adaptive-icon.png)
3. Place in this assets/ folder

## Quick Create Using ImageMagick

If you have ImageMagick installed:

```bash
# Icon
convert -size 1024x1024 xc:"#7C3AED" -gravity center -pointsize 400 -fill white -annotate +0+0 "M" icon.png

# Splash
convert -size 1284x2778 xc:"#7C3AED" -gravity center -pointsize 200 -fill white -annotate +0+0 "Mill Receipt Pro" splash.png

# Adaptive Icon
convert -size 1024x1024 xc:"#7C3AED" -gravity center -pointsize 400 -fill white -annotate +0+0 "M" adaptive-icon.png
```

## Note

The app will not build/run without these image files. Create them before running `npm start`.
