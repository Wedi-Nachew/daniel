import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { COLORS } from '../utils/constants';
import { format, startOfDay } from 'date-fns';
import { printReceipt } from '../utils/print';

export default function QuickBillingScreen({ 
  receipts, 
  setReceipts, 
  business, 
  translations,
  printerStatus 
}) {
  const t = translations;
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [currentLines, setCurrentLines] = useState([]);

  // Calculate today's stats
  const today = startOfDay(new Date());
  const todayReceipts = receipts.filter(r => {
    const receiptDate = startOfDay(new Date(r.date));
    return receiptDate.getTime() === today.getTime() && !r.isCopy;
  });
  const todayCount = todayReceipts.length;
  const todayRevenue = todayReceipts.reduce((sum, r) => sum + parseFloat(r.total), 0);

  const addItem = () => {
    if (!itemName.trim() || !quantity || !price) {
      Alert.alert(t.error, t.allFieldsRequired);
      return;
    }

    const qty = parseFloat(quantity);
    const unitPrice = parseFloat(price);

    if (qty <= 0 || unitPrice <= 0) {
      Alert.alert(t.error, t.allFieldsRequired);
      return;
    }

    const total = qty * unitPrice;
    const newLine = {
      id: Date.now().toString(),
      name: itemName.trim(),
      qty,
      price: unitPrice,
      total: parseFloat(total.toFixed(2)),
    };

    setCurrentLines([...currentLines, newLine]);
    setItemName('');
    setQuantity('');
    setPrice('');
  };

  const removeItem = (id) => {
    setCurrentLines(currentLines.filter(line => line.id !== id));
  };

  const grandTotal = currentLines.reduce((sum, line) => sum + line.total, 0);

  const handlePrintAndSave = async () => {
    if (currentLines.length === 0) {
      Alert.alert(t.error, t.allFieldsRequired);
      return;
    }

    const receipt = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      lines: currentLines,
      total: grandTotal.toFixed(2),
      isCopy: false,
    };

    const newReceipts = [...receipts, receipt];
    setReceipts(newReceipts);
    setCurrentLines([]);

    if (printerStatus === 'connected') {
      const success = await printReceipt(receipt, business, false);
      if (success) {
        Alert.alert(t.success, t.receiptSaved);
      } else {
        Alert.alert(t.error, t.printError);
      }
    } else {
      Alert.alert(t.success, t.receiptSaved);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Stats Cards */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, styles.purpleGradient]}>
          <Text style={styles.statEmoji}>📝</Text>
          <Text style={styles.statValue}>{todayCount}</Text>
          <Text style={styles.statLabel}>{t.todayReceipts}</Text>
        </View>
        <View style={[styles.statCard, styles.pinkGradient]}>
          <Text style={styles.statEmoji}>💰</Text>
          <Text style={styles.statValue}>{todayRevenue.toFixed(2)}</Text>
          <Text style={styles.statLabel}>{t.todayRevenue}</Text>
        </View>
      </View>

      {/* Input Form */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>⚡ {t.quickBilling}</Text>
        
        <TextInput
          style={styles.input}
          placeholder={t.enterItemName}
          value={itemName}
          onChangeText={setItemName}
          placeholderTextColor={COLORS.textLight}
        />
        
        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.halfInput]}
            placeholder={t.enterQuantity}
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="numeric"
            placeholderTextColor={COLORS.textLight}
          />
          <TextInput
            style={[styles.input, styles.halfInput]}
            placeholder={t.enterPrice}
            value={price}
            onChangeText={setPrice}
            keyboardType="decimal-pad"
            placeholderTextColor={COLORS.textLight}
          />
        </View>

        <TouchableOpacity style={styles.addButton} onPress={addItem}>
          <Text style={styles.buttonText}>➕ {t.addItem}</Text>
        </TouchableOpacity>
      </View>

      {/* Current Bill */}
      {currentLines.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📄 {t.currentBill}</Text>
          
          {currentLines.map((line) => (
            <View key={line.id} style={styles.lineItem}>
              <View style={styles.lineItemLeft}>
                <Text style={styles.lineItemName}>{line.name}</Text>
                <Text style={styles.lineItemDetails}>
                  {line.qty} × {line.price.toFixed(2)}
                </Text>
              </View>
              <View style={styles.lineItemRight}>
                <Text style={styles.lineItemTotal}>{line.total.toFixed(2)}</Text>
                <TouchableOpacity onPress={() => removeItem(line.id)}>
                  <Text style={styles.deleteButton}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          <View style={styles.separator} />
          
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{t.total}:</Text>
            <Text style={styles.totalValue}>{grandTotal.toFixed(2)}</Text>
          </View>

          <TouchableOpacity style={styles.printButton} onPress={handlePrintAndSave}>
            <Text style={styles.buttonText}>🖨️ {t.printAndSave}</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 16,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  purpleGradient: {
    backgroundColor: COLORS.primary,
  },
  pinkGradient: {
    backgroundColor: COLORS.secondary,
  },
  statEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.surface,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.surface,
    textAlign: 'center',
  },
  card: {
    backgroundColor: COLORS.surface,
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: COLORS.surface,
    color: COLORS.text,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: '600',
  },
  lineItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  lineItemLeft: {
    flex: 1,
  },
  lineItemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  lineItemDetails: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  lineItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  lineItemTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  deleteButton: {
    fontSize: 20,
  },
  separator: {
    height: 2,
    backgroundColor: COLORS.border,
    marginVertical: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  totalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  printButton: {
    backgroundColor: COLORS.success,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
});
