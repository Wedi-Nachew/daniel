import { Platform, PermissionsAndroid, Alert } from 'react-native';
import { format } from 'date-fns';

// Note: react-native-esc-pos-printer integration
// This is a placeholder implementation since the library needs native setup
// Actual implementation will work after running: npx expo prebuild

export const requestBluetoothPermissions = async () => {
  if (Platform.OS === 'android') {
    try {
      const apiLevel = Platform.Version;
      
      if (apiLevel >= 31) {
        // Android 12+
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);
        
        return (
          granted['android.permission.BLUETOOTH_SCAN'] === PermissionsAndroid.RESULTS.GRANTED &&
          granted['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.GRANTED
        );
      } else {
        // Android 11 and below
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADMIN,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);
        
        return (
          granted['android.permission.BLUETOOTH'] === PermissionsAndroid.RESULTS.GRANTED &&
          granted['android.permission.BLUETOOTH_ADMIN'] === PermissionsAndroid.RESULTS.GRANTED
        );
      }
    } catch (err) {
      console.warn('Permission error:', err);
      return false;
    }
  }
  return true; // iOS doesn't need runtime permissions
};

export const scanForPrinters = async () => {
  try {
    const hasPermission = await requestBluetoothPermissions();
    if (!hasPermission) {
      Alert.alert('Permission Required', 'Bluetooth permissions are required to scan for printers.');
      return [];
    }
    
    // Placeholder: Real implementation uses react-native-esc-pos-printer
    // const devices = await EscPosPrinter.discover();
    // return devices;
    
    return [];
  } catch (error) {
    console.error('Scan error:', error);
    return [];
  }
};

export const connectToPrinter = async (printer) => {
  try {
    // Placeholder: Real implementation
    // await EscPosPrinter.init({
    //   target: printer.target,
    //   seriesName: 'EPOS2_TM_M30',
    //   language: 'EPOS2_LANG_EN',
    // });
    
    return true;
  } catch (error) {
    console.error('Connection error:', error);
    return false;
  }
};

export const printReceipt = async (receipt, business, isCopy = false) => {
  try {
    const formattedDate = format(new Date(receipt.date), 'MM/dd/yyyy HH:mm');
    
    // Placeholder: Real implementation with react-native-esc-pos-printer
    /*
    const printing = new EscPosPrinter.printing();
    
    // Note: business.logo can be displayed in app receipts but cannot be printed on thermal printers
    // Thermal printers only support text output
    
    await printing
      .initialize()
      .align('center')
      .size(2, 2)
      .line(business.name || 'Mill House')
      .size(1, 1)
      .line(business.phone || '')
      .line(business.address || '')
      .line('================================')
      .feed(1)
      .align('left')
      .text(`Receipt #: ${receipt.id.slice(-8)}`)
      .feed(1)
      .text(`Date: ${formattedDate}`)
      .feed(1)
      .align('center')
      .line('================================');
    
    if (isCopy) {
      await printing
        .size(2, 2)
        .line('*** COPY / ቅጂ ***')
        .size(1, 1)
        .line('================================');
    }
    
    for (const item of receipt.lines) {
      await printing
        .align('left')
        .line(item.name.substring(0, 18))
        .text(`  ${item.qty}x${item.price}  ${item.total}`)
        .feed(1);
    }
    
    await printing
      .align('center')
      .line('================================')
      .size(2, 1)
      .align('left')
      .text('Total:')
      .align('right')
      .line(receipt.total)
      .size(1, 1)
      .align('center')
      .line('Thank you for your business!')
      .line('ብምምጻእኩም የቐንየለይ!')
      .feed(3)
      .cut()
      .send();
    */
    
    // Simulated success for development
    console.log('Print receipt:', receipt.id);
    return true;
  } catch (error) {
    console.error('Print error:', error);
    return false;
  }
};
