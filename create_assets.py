#!/usr/bin/env python3
"""
Simple script to create placeholder asset images for Mill Receipt Pro
Requires: pip install pillow
"""

from PIL import Image, ImageDraw, ImageFont

# App color
ORANGE = (255, 166, 43)  # #ffa62b

def create_icon(size, filename):
    """Create a simple icon with 'M' letter"""
    img = Image.new('RGB', (size, size), color=ORANGE)
    draw = ImageDraw.Draw(img)
    
    # Draw a simple 'M' in the center
    try:
        # Try to use a large font
        font = ImageFont.truetype("arial.ttf", size // 2)
    except:
        # Fallback to default font
        font = ImageFont.load_default()
    
    text = "M"
    # Get text bounding box
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    # Center the text
    x = (size - text_width) // 2
    y = (size - text_height) // 2
    
    draw.text((x, y), text, fill=(255, 255, 255), font=font)
    img.save(filename)
    print(f"✓ Created {filename}")

def create_splash(filename):
    """Create splash screen"""
    img = Image.new('RGB', (1284, 2778), color=ORANGE)
    draw = ImageDraw.Draw(img)
    
    try:
        font = ImageFont.truetype("arial.ttf", 120)
    except:
        font = ImageFont.load_default()
    
    text = "Mill Receipt Pro"
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    
    x = (1284 - text_width) // 2
    y = 1389 - 60  # Center vertically
    
    draw.text((x, y), text, fill=(255, 255, 255), font=font)
    img.save(filename)
    print(f"✓ Created {filename}")

if __name__ == "__main__":
    import os
    
    # Create assets directory if it doesn't exist
    if not os.path.exists('assets'):
        os.makedirs('assets')
    
    print("Creating asset images...")
    create_icon(1024, 'assets/icon.png')
    create_icon(1024, 'assets/adaptive-icon.png')
    create_splash('assets/splash.png')
    print("\n✅ All assets created successfully!")
    print("You can now run: npm start")
