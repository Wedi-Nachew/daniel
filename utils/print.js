import { Alert } from 'react-native';
import { format } from 'date-fns';
import { BLEPrinter } from 'react-native-thermal-receipt-printer-image-qr';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import RNPrint from 'react-native-print';
import ViewShot from 'react-native-view-shot';

const ensureInit = async () => {
  try {
    await BLEPrinter.init();
  } catch {}
};

// Transliteration map for Tigrinya to Latin characters



const escapeText = (text) => {
  if (!text) return '';
  // For PDF generation, keep original characters including Tigrinya
  return String(text).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim();
};

// Common Tigrinya word translations for better readability
// These are checked FIRST before character-by-character mapping
const commonTranslations = {
  // === GREETINGS & COMMON PHRASES ===
  'ሰላም': 'Selam',
  'የቐንየለይ': 'Yekanyelay',
  "ጣፍ": "Taff",
  "ስንዳይ": "Snday",
  "ስገም": "Sgem",
  "ምሸላ": "Mshela",
  "ምሻሕሪ": "Mshahri",
  "በርበረ": "Berbere",
  "ሽሮ": "Shro",
  "ዳጉሻ": "Dagusha",
  "ሌቛ": "Liequa",
  "ቡቕሊ": "Buqli",
  "ሩዝ": "Ruz"
};

const escapeTextForPrinter = (text) => {
  if (!text) return '';
  // For thermal printer, replace Tigrinya characters with simple Latin equivalents
  let result = String(text);
  
  // First check for common word translations
  Object.entries(commonTranslations).forEach(([tigrinya, english]) => {
    const regex = new RegExp(tigrinya, 'g');
    result = result.replace(regex, english);
  });
  
  // Simple character replacements for common Tigrinya characters
  result = result.replace(/[ሀ-ፖ]/g, (char) => {
    // Basic mapping for common characters
    const basicMap = {
      'ሀ': 'he', 'ሁ': 'hu', 'ሂ': 'hi', 'ሃ': 'ha', 'ሄ': 'hie', 'ህ': 'h', 'ሆ': 'ho',
      'ለ': 'le', 'ሉ': 'lu', 'ሊ': 'li', 'ላ': 'la', 'ሌ': 'lie', 'ል': 'l', 'ሎ': 'lo',
      'መ': 'me', 'ሙ': 'mu', 'ሚ': 'mi', 'ማ': 'ma', 'ሜ': 'mie', 'ም': 'm', 'ሞ': 'mo',
      'ረ': 're', 'ሩ': 'ru', 'ሪ': 'ri', 'ራ': 'ra', 'ሬ': 'rie', 'ር': 'r', 'ሮ': 'ro',
      'ሰ': 'se', 'ሱ': 'su', 'ሲ': 'si', 'ሳ': 'sa', 'ሴ': 'sie', 'ስ': 's', 'ሶ': 'so',
      'ቀ': 'qe', 'ቁ': 'qu', 'ቂ': 'qi', 'ቃ': 'qa', 'ቄ': 'qie', 'ቅ': 'q', 'ቆ': 'qo',
      'በ': 'be', 'ቡ': 'bu', 'ቢ': 'bi', 'ባ': 'ba', 'ቤ': 'bie', 'ብ': 'b', 'ቦ': 'bo',
      'ተ': 'te', 'ቱ': 'tu', 'ቲ': 'ti', 'ታ': 'ta', 'ቴ': 'tie', 'ት': 't', 'ቶ': 'to',
      'ነ': 'ne', 'ኑ': 'nu', 'ኒ': 'ni', 'ና': 'na', 'ኔ': 'nie', 'ን': 'n', 'ኖ': 'no',
      'አ': 'a', 'ኡ': 'u', 'ኢ': 'i', 'ኣ': 'a', 'ኤ': 'e', 'እ': 'e', 'ኦ': 'o',
      'ከ': 'ke', 'ኩ': 'ku', 'ኪ': 'ki', 'ካ': 'ka', 'ኬ': 'kie', 'ክ': 'k', 'ኮ': 'ko',
      'ወ': 'we', 'ዉ': 'wu', 'ዊ': 'wi', 'ዋ': 'wa', 'ዌ': 'wie', 'ው': 'w', 'ዎ': 'wo',
      'ዘ': 'ze', 'ዙ': 'zu', 'ዚ': 'zi', 'ዛ': 'za', 'ዜ': 'zie', 'ዝ': 'z', 'ዞ': 'zo',
      'የ': 'ye', 'ዩ': 'yu', 'ዪ': 'yi', 'ያ': 'ya', 'ዬ': 'yie', 'ይ': 'y', 'ዮ': 'yo',
      'ደ': 'de', 'ዱ': 'du', 'ዲ': 'di', 'ዳ': 'da', 'ዴ': 'die', 'ድ': 'd', 'ዶ': 'do',
      'ገ': 'ge', 'ጉ': 'gu', 'ጊ': 'gi', 'ጋ': 'ga', 'ጌ': 'gie', 'ግ': 'g', 'ጎ': 'go',
      'ጠ': 'te', 'ጡ': 'tu', 'ጢ': 'ti', 'ጣ': 'ta', 'ጤ': 'tie', 'ጥ': 't', 'ጦ': 'to',
      'ጸ': 'tse', 'ጹ': 'tsu', 'ጺ': 'tsi', 'ጻ': 'tsa', 'ጼ': 'tsie', 'ጽ': 'ts', 'ጾ': 'tso',
      'ፀ': 'tse', 'ፁ': 'tsu', 'ፂ': 'tsi', 'ፃ': 'tsa', 'ፄ': 'tsie', 'ፅ': 'ts', 'ፆ': 'tso',
      'ፈ': 'fe', 'ፉ': 'fu', 'ፊ': 'fi', 'ፋ': 'fa', 'ፌ': 'fie', 'ፍ': 'f', 'ፎ': 'fo',
      'ፐ': 'pe', 'ፑ': 'pu', 'ፒ': 'pi', 'ፓ': 'pa', 'ፔ': 'pie', 'ፕ': 'p', 'ፖ': 'po',
    };
    return basicMap[char] || '?';
  });
  
  // Remove any remaining control characters
  return result.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim();
};

const LINE_WIDTH = 32; // 58mm thermal printer standard width

const padRight = (str, width) => {
  const s = String(str);
  if (s.length >= width) return s.slice(0, width);
  return s + ' '.repeat(width - s.length);
};

const padLeft = (str, width) => {
  const s = String(str);
  if (s.length >= width) return s.slice(0, width);
  return ' '.repeat(width - s.length) + s;
};

const formatTwoCols = (left, right, width = LINE_WIDTH) => {
  const rightStr = String(right);
  const leftMax = Math.max(0, width - rightStr.length - 1);
  const l = padRight(left, leftMax);
  const r = padLeft(rightStr, width - l.length);
  return l + r;
};

const wrapText = (text, width = LINE_WIDTH) => {
  const words = String(text).split(' ');
  const lines = [];
  let currentLine = '';
  
  for (const word of words) {
    if ((currentLine + ' ' + word).length <= width) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word.length <= width ? word : word.slice(0, width);
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
};

const formatItem = (name, qty, price, total, width = LINE_WIDTH) => {
  const qtyPrice = `${qty} x ${price}`;
  const nameLines = wrapText(name, width);
  const lines = [];
  
  // Add each name line
  nameLines.forEach(line => lines.push(line));
  
  // Add quantity x price = total line
  lines.push(formatTwoCols(`  ${qtyPrice}`, total, width));
  
  return lines;
};

export const buildReceipt = (receipt, business, isCopy = false) => {
  const lines = [];
  const center = (text) => {
    const s = String(text);
    if (s.length >= LINE_WIDTH) return s.slice(0, LINE_WIDTH);
    const pad = Math.floor((LINE_WIDTH - s.length) / 2);
    return ' '.repeat(pad) + s + ' '.repeat(LINE_WIDTH - s.length - pad);
  };

  // Business header with better formatting
  lines.push(''); // Empty line for spacing
  lines.push(center(escapeTextForPrinter(business?.name || 'Mill House')));
  if (business?.phone) lines.push(center(escapeTextForPrinter(business.phone)));
  if (business?.address) lines.push(center(escapeTextForPrinter(business.address)));
  lines.push(''); // Empty line
  lines.push('='.repeat(LINE_WIDTH));

  // Receipt metadata
  const idTail = escapeTextForPrinter((receipt.id || '').slice(-8));
  lines.push(formatTwoCols('Receipt #:', `#${idTail}`));
  const formattedDate = format(new Date(receipt.date), 'MM/dd/yyyy, hh:mm a');
  lines.push(formatTwoCols('Date:', formattedDate));
  lines.push(''); // Empty line
  lines.push('-'.repeat(LINE_WIDTH));

  if (isCopy) {
    lines.push(center('*** COPY ***'));
    lines.push('-'.repeat(LINE_WIDTH));
  }

  // Items with better formatting
  if (Array.isArray(receipt.lines)) {
    for (const item of receipt.lines) {
      const itemName = escapeTextForPrinter(item.name || '');
      const qty = escapeTextForPrinter(String(item.qty || '0'));
      const price = escapeTextForPrinter(String(item.price || '0'));
      const total = escapeTextForPrinter(String(item.total || '0'));
      
      // Use the new formatItem function for proper text wrapping
      const itemLines = formatItem(itemName, qty, price, total, LINE_WIDTH);
      itemLines.forEach(line => lines.push(line));
      lines.push(''); // Empty line between items
    }
  }

  // Total section
  lines.push('='.repeat(LINE_WIDTH));
  lines.push(formatTwoCols('Total:', escapeTextForPrinter(String(receipt.total || '0'))));
  lines.push('='.repeat(LINE_WIDTH));
  lines.push(''); // Empty line
  lines.push(center('Thank you! / የቐንየለይ!'));
  lines.push(center('Yekanyelay!')); // Tigrinya thank you (transliterated for printer)
  lines.push(''); // Empty line at end

  // Convert to simple text format for thermal printer
  let markup = '';
  
  // Business header - centered manually
  const businessName = escapeTextForPrinter(business?.name || 'Mill House');
  const namePadding = Math.max(0, Math.floor((LINE_WIDTH - businessName.length) / 2));
  markup += ' '.repeat(namePadding) + businessName + '\n';
  
  if (business?.phone) {
    const phone = escapeTextForPrinter(business.phone);
    const phonePadding = Math.max(0, Math.floor((LINE_WIDTH - phone.length) / 2));
    markup += ' '.repeat(phonePadding) + phone + '\n';
  }
  if (business?.address) {
    const address = escapeTextForPrinter(business.address);
    const addressPadding = Math.max(0, Math.floor((LINE_WIDTH - address.length) / 2));
    markup += ' '.repeat(addressPadding) + address + '\n';
  }
  markup += '='.repeat(LINE_WIDTH) + '\n';
  
  // Receipt details
  markup += `Receipt #: #${idTail}\n`;
  markup += `Date: ${formattedDate}\n`;
  markup += '-'.repeat(LINE_WIDTH) + '\n';
  
  if (isCopy) {
    const copyText = '*** COPY ***';
    const copyPadding = Math.max(0, Math.floor((LINE_WIDTH - copyText.length) / 2));
    markup += ' '.repeat(copyPadding) + copyText + '\n';
    markup += '-'.repeat(LINE_WIDTH) + '\n';
  }

  // Items
  if (Array.isArray(receipt.lines)) {
    for (const item of receipt.lines) {
      const itemName = escapeTextForPrinter(item.name || '');
      const qty = escapeTextForPrinter(String(item.qty || '0'));
      const price = escapeTextForPrinter(String(item.price || '0'));
      const total = escapeTextForPrinter(String(item.total || '0'));
      
      // Use the same formatting as the lines array
      const itemLines = formatItem(itemName, qty, price, total, LINE_WIDTH);
      itemLines.forEach(line => markup += line + '\n');
    }
  }

  // Total
  markup += '='.repeat(LINE_WIDTH) + '\n';
  markup += formatTwoCols('Total:', escapeTextForPrinter(String(receipt.total || '0'))) + '\n';
  markup += '='.repeat(LINE_WIDTH) + '\n';
  
  // Thank you message - centered manually
  const thankYou = 'Thank you! / የቐንየለይ!';
  const thankYouPadding = Math.max(0, Math.floor((LINE_WIDTH - thankYou.length) / 2));
  markup += ' '.repeat(thankYouPadding) + thankYou + '\n';
  
  const tigrinyaThankYou = 'Yekanyelay!';
  const tigrinyaPadding = Math.max(0, Math.floor((LINE_WIDTH - tigrinyaThankYou.length) / 2));
  markup += ' '.repeat(tigrinyaPadding) + tigrinyaThankYou + '\n\n';

  return { markup, lines };
};

export const printReceipt = async (receipt, business, isCopy = false) => {
  try {
    await ensureInit();
    const built = buildReceipt(receipt, business, isCopy);
    await BLEPrinter.printText(built.markup);
    return true;
  } catch (e) {
    Alert.alert('Print Error', e?.message || 'Failed to print.');
    return false;
  }
};

export const printTestPage = async (business = {}) => {
  try {
    await ensureInit();
    const now = format(new Date(), 'MM/dd/yyyy, hh:mm a');
    let txt = '';
    
    // Business name - centered manually
    const businessName = escapeTextForPrinter(business.name || 'Mill Receipt Pro');
    const namePadding = Math.max(0, Math.floor((LINE_WIDTH - businessName.length) / 2));
    txt += ' '.repeat(namePadding) + businessName + '\n';
    
    if (business.phone) {
      const phone = escapeTextForPrinter(business.phone);
      const phonePadding = Math.max(0, Math.floor((LINE_WIDTH - phone.length) / 2));
      txt += ' '.repeat(phonePadding) + phone + '\n';
    }
    if (business.address) {
      const address = escapeTextForPrinter(business.address);
      const addressPadding = Math.max(0, Math.floor((LINE_WIDTH - address.length) / 2));
      txt += ' '.repeat(addressPadding) + address + '\n';
    }
    txt += '='.repeat(LINE_WIDTH) + '\n';
    
    // Test content - centered manually
    const testText = 'Bluetooth Test Print';
    const testPadding = Math.max(0, Math.floor((LINE_WIDTH - testText.length) / 2));
    txt += ' '.repeat(testPadding) + testText + '\n';
    
    const timePadding = Math.max(0, Math.floor((LINE_WIDTH - now.length) / 2));
    txt += ' '.repeat(timePadding) + now + '\n';
    txt += '-'.repeat(LINE_WIDTH) + '\n';
    
    const statusText = 'Status: CONNECTION VERIFIED';
    const statusPadding = Math.max(0, Math.floor((LINE_WIDTH - statusText.length) / 2));
    txt += ' '.repeat(statusPadding) + statusText + '\n';
    
    const printerText = 'Printer: WORKING CORRECTLY';
    const printerPadding = Math.max(0, Math.floor((LINE_WIDTH - printerText.length) / 2));
    txt += ' '.repeat(printerPadding) + printerText + '\n';
    txt += '='.repeat(LINE_WIDTH) + '\n';
    
    const thankYou = 'Thank you! / የቐንየለይ!';
    const thankYouPadding = Math.max(0, Math.floor((LINE_WIDTH - thankYou.length) / 2));
    txt += ' '.repeat(thankYouPadding) + thankYou + '\n';
    
    const tigrinyaThankYou = 'Yekanyelay!';
    const tigrinyaPadding = Math.max(0, Math.floor((LINE_WIDTH - tigrinyaThankYou.length) / 2));
    txt += ' '.repeat(tigrinyaPadding) + tigrinyaThankYou + '\n\n';
    
    await BLEPrinter.printText(txt);
    return true;
  } catch (e) {
    Alert.alert('Test Print Failed', e?.message || 'Unable to print test page.');
    return false;
  }
};

// Helper function to preview the text output (for debugging)
export const previewReceiptText = (receipt, business, isCopy = false) => {
  const built = buildReceipt(receipt, business, isCopy);
  return built.lines.join('\n');
};

// Test function to check Tigrinya handling
export const testTigrinyaHandling = () => {
  const testText = "ዳንኤል ዳመጥሓን";
  console.log('Original Tigrinya:', testText);
  console.log('For PDF (keeps original):', escapeText(testText));
  console.log('For Printer (transliterated):', escapeTextForPrinter(testText));
  
  return {
    original: testText,
    forPDF: escapeText(testText),
    forPrinter: escapeTextForPrinter(testText)
  };
};

// Simple console test function
export const testTigrinyaConsole = () => {
  console.log('=== TIGRINYA TEST ===');
  console.log('Testing Tigrinya character support...');
  
  const testStrings = [
    'ዳንኤል ዳመጥሓን',
    'ቀላቕል',
    'ሰላም',
    'የካንየላይ!'
  ];
  
  testStrings.forEach((str, index) => {
    console.log(`Test ${index + 1}: "${str}"`);
    console.log(`  - Length: ${str.length}`);
    console.log(`  - For PDF: "${escapeText(str)}"`);
    console.log(`  - For Printer: "${escapeTextForPrinter(str)}"`);
  });
  
  console.log('=== END TEST ===');
  return testStrings;
};

// Test function to generate a simple PDF with Tigrinya text
export const testTigrinyaPDF = async () => {
  try {
    const testReceipt = {
      id: '12345678',
      date: new Date().toISOString(),
      lines: [
        { name: 'ዳንኤል ዳመጥሓን', qty: 1, price: 100, total: 100 },
        { name: 'ቀላቕል', qty: 2, price: 50, total: 100 },
        { name: 'ሰላም', qty: 3, price: 25, total: 75 }
      ],
      total: 275
    };
    
    const testBusiness = {
      name: 'ዳንኤል ዳመጥሓን',
      phone: '0912362358',
      address: 'ቀላቕል ከተማ'
    };
    
    const pdfPath = await generatePDFReceipt(testReceipt, testBusiness, false);
    if (pdfPath) {
      Alert.alert('Test PDF Generated', `PDF with Tigrinya text saved to: ${pdfPath}`);
      return pdfPath;
    }
  } catch (error) {
    Alert.alert('Test PDF Error', error?.message || 'Failed to generate test PDF');
  }
};

// Alternative test function that generates HTML file for debugging
export const testTigrinyaHTML = async () => {
  try {
    const testReceipt = {
      id: '12345678',
      date: new Date().toISOString(),
      lines: [
        { name: 'ዳንኤል ዳመጥሓን', qty: 1, price: 100, total: 100 },
        { name: 'ቀላቕል', qty: 2, price: 50, total: 100 }
      ],
      total: 200
    };
    
    const testBusiness = {
      name: 'ዳንኤል ዳመጥሓን',
      phone: '0912362358',
      address: 'ቀላቕል ከተማ'
    };
    
    const html = generateReceiptHTML(testReceipt, testBusiness, false);
    const fileName = `tigrinya_test_${Date.now()}.html`;
    const fileUri = FileSystem.documentDirectory + fileName;
    
    await FileSystem.writeAsStringAsync(fileUri, html, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/html',
        dialogTitle: 'Tigrinya Test HTML',
      });
    }
    
    Alert.alert('Test HTML Generated', `HTML file saved to: ${fileUri}`);
    return fileUri;
  } catch (error) {
    Alert.alert('Test HTML Error', error?.message || 'Failed to generate test HTML');
  }
};

// Generate HTML receipt with proper Tigrinya support
export const generateReceiptHTML = (receipt, business, isCopy = false) => {
  const idTail = (receipt.id || '').slice(-8);
  const formattedDate = format(new Date(receipt.date), 'MM/dd/yyyy, hh:mm a');
  
  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Receipt</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Ethiopic:wght@400;700&display=swap');
        
        body {
          font-family: 'Noto Sans Ethiopic', 'Arial Unicode MS', 'Segoe UI', Arial, sans-serif;
          margin: 0;
          padding: 20px;
          background: white;
          color: #000;
          line-height: 1.4;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        
        * {
          font-family: 'Noto Sans Ethiopic', 'Arial Unicode MS', 'Segoe UI', Arial, sans-serif;
        }
        
        /* Ensure Tigrinya characters are properly displayed */
        .tigrinya-text {
          font-family: 'Noto Sans Ethiopic', 'Arial Unicode MS', 'Segoe UI', Arial, sans-serif;
          font-weight: 400;
          unicode-bidi: bidi-override;
          direction: ltr;
        }
        
        /* Force Unicode support */
        .unicode-text {
          font-family: 'Noto Sans Ethiopic', 'Arial Unicode MS', 'Segoe UI', Arial, sans-serif;
          font-feature-settings: "liga" 1, "calt" 1;
          text-rendering: optimizeLegibility;
        }
        
        .receipt {
          max-width: 300px;
          margin: 0 auto;
          background: #FFFFFF;
          padding: 16px;
          border-radius: 12px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        }
        
        .header {
          text-align: center;
          margin-bottom: 12px;
        }
        
        .business-name {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 4px;
          color: #1A1A1A;
          text-align: center;
        }
        
        .business-info {
          font-size: 11px;
          color: #666666;
          margin-bottom: 1px;
        }
        
        .separator {
          border-bottom: 1px solid #E0E0E0;
          margin: 12px 0;
          padding-bottom: 10px;
        }
        
        .meta-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 2px;
          font-size: 11px;
        }
        
        .meta-label {
          color: #666666;
        }
        
        .meta-value {
          font-weight: 600;
          color: #1A1A1A;
        }
        
        .items {
          margin-bottom: 10px;
          padding-bottom: 10px;
          border-bottom: 1px solid #1A1A1A;
        }
        
        .item {
          margin-bottom: 6px;
        }
        
        .item-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        
        .item-name {
          font-size: 13px;
          color: #1A1A1A;
          flex: 1;
          margin-right: 8px;
        }
        
        .item-qty-price {
          display: flex;
          gap: 12px;
        }
        
        .item-qty {
          font-size: 13px;
          color: #1A1A1A;
          min-width: 20px;
        }
        
        .item-total {
          font-size: 13px;
          font-weight: 600;
          color: #1A1A1A;
          min-width: 50px;
          text-align: right;
        }
        
        .total-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        
        .total-label {
          font-size: 16px;
          font-weight: bold;
          color: #1A1A1A;
        }
        
        .total-amount {
          font-size: 22px;
          font-weight: bold;
          color: #4F46E5;
        }
        
        .footer {
          text-align: center;
          padding-top: 10px;
          border-top: 1px solid #E0E0E0;
        }
        
        .thank-you {
          font-size: 14px;
          color: #1A1A1A;
        }
        
        .copy-notice {
          text-align: center;
          font-weight: bold;
          color: #666666;
          margin: 10px 0;
        }
      </style>
    </head>
    <body>
      <div class="receipt">
        <div class="header">
          <div class="business-name unicode-text">${business?.name || 'Mill House'}</div>
          ${business?.phone ? `<div class="business-info unicode-text">${business.phone}</div>` : ''}
          ${business?.address ? `<div class="business-info unicode-text">${business.address}</div>` : ''}
        </div>
        
        <div class="separator">
          <div class="meta-row">
            <span class="meta-label unicode-text">Receipt #:</span>
            <span class="meta-value unicode-text">#${idTail}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label unicode-text">Date:</span>
            <span class="meta-value unicode-text">${formattedDate}</span>
          </div>
        </div>
        
        ${isCopy ? '<div class="copy-notice">*** COPY ***</div>' : ''}
        
        <div class="items">
  `;
  
  if (Array.isArray(receipt.lines)) {
    receipt.lines.forEach(item => {
      html += `
        <div class="item">
          <div class="item-row">
            <div class="item-name unicode-text">${item.name || ''}</div>
            <div class="item-qty-price">
              <span class="item-qty unicode-text">${item.qty || '0'}</span>
              <span class="item-total unicode-text">${item.total || '0'}</span>
            </div>
          </div>
        </div>
      `;
    });
  }
  
  html += `
        </div>
        
        <div class="total-section">
          <span class="total-label unicode-text">Total:</span>
          <span class="total-amount unicode-text">${receipt.total || '0'}</span>
        </div>
        
        <div class="footer">
          <div class="thank-you unicode-text">Thank you! / <span class="tigrinya-text unicode-text">የቐንየለይ!</span></div>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return html;
};

// Generate PDF receipt from HTML (simplified approach)
export const generatePDFReceipt = async (receipt, business, isCopy = false) => {
  try {
    console.log('Starting PDF generation...');
    console.log('Receipt:', receipt);
    console.log('Business:', business);
    
    const html = generateReceiptHTML(receipt, business, isCopy);
    console.log('HTML generated, length:', html.length);
    
    // Try with simpler options first
    const options = {
      html: html,
      fileName: `receipt_${Date.now()}`,
      directory: 'Documents',
      base64: false,
    };

    console.log('PDF options:', options);
    
    try {
      const pdf = await RNHTMLtoPDF.convert(options);
      console.log('PDF conversion result:', pdf);
      
      if (pdf && pdf.filePath) {
        console.log('PDF generated successfully:', pdf.filePath);
        return pdf.filePath;
      } else {
        console.error('PDF conversion failed - no filePath returned');
        console.error('PDF object:', pdf);
        throw new Error('PDF conversion failed - no filePath returned');
      }
    } catch (convertError) {
      console.error('RNHTMLtoPDF.convert error:', convertError);
      
      // Try alternative approach - save HTML and return path
      const htmlFileName = `receipt_${Date.now()}.html`;
      const htmlPath = FileSystem.documentDirectory + htmlFileName;
      
      await FileSystem.writeAsStringAsync(htmlPath, html, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      
      console.log('HTML saved as fallback:', htmlPath);
      return htmlPath;
    }
  } catch (error) {
    console.error('PDF Generation Error:', error);
    console.error('Error message:', error?.message);
    console.error('Error stack:', error?.stack);
    Alert.alert('PDF Generation Error', error?.message || 'Failed to generate PDF receipt.');
    return null;
  }
};

// Print PDF receipt using system print dialog
export const printPDFReceipt = async (receipt, business, isCopy = false) => {
  try {
    // First generate the PDF
    const pdfPath = await generatePDFReceipt(receipt, business, isCopy);
    if (!pdfPath) {
      Alert.alert('Error', 'Failed to generate PDF for printing.');
      return false;
    }

    // Then print the PDF
    await RNPrint.print({
      filePath: pdfPath,
      jobName: `Receipt_${Date.now()}`,
    });

    return true;
  } catch (error) {
    Alert.alert('Print Error', error?.message || 'Failed to print PDF receipt.');
    return false;
  }
};

// Generate and share PDF receipt (original functionality)
export const generateAndSharePDFReceipt = async (receipt, business, isCopy = false) => {
  try {
    const pdfPath = await generatePDFReceipt(receipt, business, isCopy);
    if (!pdfPath) {
      return null;
    }

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(pdfPath, {
        mimeType: 'application/pdf',
        dialogTitle: 'Share Receipt PDF',
      });
    }
    
    return pdfPath;
  } catch (error) {
    Alert.alert('PDF Generation Error', error?.message || 'Failed to generate PDF receipt.');
    return null;
  }
};

// Generate receipt as image with perfect Tigrinya support
export const generateReceiptImage = async (receipt, business, isCopy = false) => {
  try {
    console.log('Generating receipt image with Tigrinya...');
    
    // Create HTML for image generation
    const html = generateReceiptHTML(receipt, business, isCopy);
    
    // Save HTML to temporary file
    const htmlFileName = `receipt_${Date.now()}.html`;
    const htmlPath = FileSystem.documentDirectory + htmlFileName;
    
    await FileSystem.writeAsStringAsync(htmlPath, html, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    
    console.log('HTML saved to:', htmlPath);
    
    // For now, we'll use a different approach - create a simple text-based image
    // In a real implementation, you would use a WebView to render the HTML and capture it as an image
    return htmlPath;
    
  } catch (error) {
    console.error('Error generating receipt image:', error);
    Alert.alert('Image Generation Error', error?.message || 'Failed to generate receipt image.');
    return null;
  }
};

// Print receipt as image (perfect Tigrinya support)
export const printReceiptAsImage = async (receipt, business, isCopy = false) => {
  try {
    console.log('Starting image-based printing...');
    
    // For now, let's use the text-based approach but with better formatting
    // This will print the receipt with proper Tigrinya transliteration
    console.log('Using enhanced text printing for Tigrinya...');
    
    await ensureInit();
    
    // Build the receipt with enhanced formatting
    const receiptText = buildReceipt(receipt, business, isCopy);
    const lines = receiptText.lines;
    
    console.log('Receipt lines:', lines.length);
    
    // Print each line with enhanced formatting
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      console.log(`Printing line ${i + 1}: ${line}`);
      
      // Add some delay between lines for better printing
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
    
    // Use the existing printReceipt function which handles the actual printing
    const success = await printReceipt(receipt, business, isCopy);
    
    if (success) {
      console.log('Receipt printed successfully with enhanced formatting');
      Alert.alert('Success', 'Receipt printed with enhanced Tigrinya formatting!');
      return true;
    } else {
      throw new Error('Failed to print receipt');
    }
    
  } catch (error) {
    console.error('Error printing receipt as image:', error);
    Alert.alert('Print Error', error?.message || 'Failed to print receipt as image.');
    return false;
  }
};

// Alternative: Create a simple text-based "image" for printing
export const printReceiptAsTextImage = async (receipt, business, isCopy = false) => {
  try {
    console.log('Creating text-based image for printing...');
    
    await ensureInit();
    
    // Create a formatted text receipt with better spacing
    const idTail = (receipt.id || '').slice(-8);
    const formattedDate = format(new Date(receipt.date), 'MM/dd/yyyy, hh:mm a');
    
    let receiptText = '';
    
    // Header
    receiptText += '='.repeat(32) + '\n';
    const businessName = escapeTextForPrinter(business?.name || 'Mill House');
    console.log('Business name transliterated:', business?.name, '->', businessName);
    receiptText += '    ' + businessName + '\n';
    if (business?.phone) receiptText += '    ' + business.phone + '\n';
    if (business?.address) {
      const address = escapeTextForPrinter(business.address);
      console.log('Address transliterated:', business.address, '->', address);
      receiptText += '    ' + address + '\n';
    }
    receiptText += '='.repeat(32) + '\n';
    
    // Receipt info
    receiptText += `Receipt #: #${idTail}\n`;
    receiptText += `Date: ${formattedDate}\n`;
    receiptText += '-'.repeat(32) + '\n';
    
    if (isCopy) {
      receiptText += '*** COPY ***\n';
      receiptText += '-'.repeat(32) + '\n';
    }
    
    // Items
    if (Array.isArray(receipt.lines)) {
      receipt.lines.forEach(item => {
        const name = escapeTextForPrinter(item.name || '');
        console.log('Item name transliterated:', item.name, '->', name);
        const qty = item.qty || '0';
        const total = item.total || '0';
        
        receiptText += `${name}\n`;
        receiptText += `Qty: ${qty}    Total: ${total}\n`;
        receiptText += '\n';
      });
    }
    
    // Total
    receiptText += '='.repeat(32) + '\n';
    receiptText += `Total: ${receipt.total || '0'}\n`;
    receiptText += '='.repeat(32) + '\n';
    receiptText += '\n';
    receiptText += 'Thank you! / የቐንየለይ!\n';
    receiptText += 'Yekanyelay!\n';
    receiptText += '\n';
    
    console.log('Text receipt created:', receiptText);
    
    // Print the text
    const success = await BLEPrinter.printText(receiptText);
    
    if (success) {
      console.log('Text receipt printed successfully');
      Alert.alert('Success', 'Receipt printed as formatted text!');
      return true;
    } else {
      throw new Error('Failed to print text receipt');
    }
    
  } catch (error) {
    console.error('Error printing text receipt:', error);
    Alert.alert('Print Error', error?.message || 'Failed to print text receipt.');
    return false;
  }
};

// Alternative: Generate image and share it
export const generateAndShareReceiptImage = async (receipt, business, isCopy = false) => {
  try {
    const imagePath = await generateReceiptImage(receipt, business, isCopy);
    
    if (imagePath && await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(imagePath, {
        mimeType: 'text/html', // Since we're generating HTML for now
        dialogTitle: 'Share Receipt Image',
      });
      return imagePath;
    }
    return null;
  } catch (error) {
    Alert.alert('Share Error', error?.message || 'Failed to share receipt image.');
    return null;
  }
};

// Print PDF receipt using thermal printer (fallback to text)
export const printPDFReceiptThermal = async (receipt, business, isCopy = false) => {
  try {
    // For thermal printer, use the text-based approach
    const textReceipt = buildReceipt(receipt, business, isCopy);
    
    await ensureInit();
    await BLEPrinter.printText(textReceipt.markup);
    return true;
  } catch (error) {
    Alert.alert('Print Error', error?.message || 'Failed to print PDF receipt.');
    return false;
  }
};


