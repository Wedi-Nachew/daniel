import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Modal,
  Image,
} from 'react-native';
import { COLORS } from '../utils/constants';
import { format, startOfDay } from 'date-fns';
import { printReceipt, generatePDFReceipt, printPDFReceipt, generateAndSharePDFReceipt, testTigrinyaPDF, testTigrinyaHTML, printReceiptAsImage, generateAndShareReceiptImage } from '../utils/print';
export default function QuickBillingScreenNew({ 
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
  const [showPreview, setShowPreview] = useState(false);
  const [isPaid, setIsPaid] = useState(true);
  const [showUnpaidModal, setShowUnpaidModal] = useState(false);
  const [unpaidMode, setUnpaidMode] = useState('full'); // 'full' | 'partial'
  const [partialPaidAmount, setPartialPaidAmount] = useState('');
  const [customerName, setCustomerName] = useState('');

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

    let paidAmount = grandTotal;
    let unpaidAmount = 0;
    let customer = '';
    if (!isPaid) {
      if (unpaidMode === 'full') {
        paidAmount = 0;
        unpaidAmount = grandTotal;
      } else {
        const paid = parseFloat(partialPaidAmount || '0');
        if (isNaN(paid) || paid < 0 || paid > grandTotal) {
          Alert.alert(t.error, 'Enter a valid paid amount');
          return;
        }
        paidAmount = paid;
        unpaidAmount = parseFloat((grandTotal - paid).toFixed(2));
      }
      customer = customerName.trim();
    }

    const receipt = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      lines: currentLines,
      total: grandTotal.toFixed(2),
      isCopy: false,
      // unpaid feature fields
      is_paid: isPaid,
      paid_amount: parseFloat(paidAmount.toFixed(2)),
      unpaid_amount: parseFloat(unpaidAmount.toFixed(2)),
      customer_name: customer || '',
      payment_history: [],
    };

    const newReceipts = [...receipts, receipt];
    setReceipts(newReceipts);
    setCurrentLines([]);
    setShowPreview(false);
    setIsPaid(true);
    setUnpaidMode('full');
    setPartialPaidAmount('');
    setCustomerName('');

    if (printerStatus === 'connected') {
      // Show print options
        Alert.alert(
          'Print Options',
          'Choose how to print the receipt:',
          [
            {
              text: 'Thermal Printer (Text)',
              onPress: async () => {
                const success = await printReceipt(receipt, business, false);
                if (success) {
                  Alert.alert(t.success, t.receiptSaved);
                } else {
                  Alert.alert(t.error, t.printError);
                }
              }
            },
            {
              text: 'Thermal Printer (Image)',
              onPress: async () => {
                const success = await printReceiptAsImage(receipt, business, false);
                if (success) {
                  Alert.alert(t.success, 'Receipt printed as image with perfect Tigrinya!');
                } else {
                  Alert.alert(t.error, 'Failed to print as image');
                }
              }
            },
            {
              text: 'Print PDF',
              onPress: async () => {
                const success = await printPDFReceipt(receipt, business, false);
                if (success) {
                  Alert.alert(t.success, 'PDF printed successfully!');
                } else {
                  Alert.alert(t.error, 'Failed to print PDF');
                }
              }
            },
            {
              text: 'Generate & Share PDF',
              onPress: async () => {
                const pdfUri = await generateAndSharePDFReceipt(receipt, business, false);
                if (pdfUri) {
                  Alert.alert(t.success, 'PDF receipt generated and ready to share!');
                }
              }
            },
            {
              text: 'Generate & Share Image',
              onPress: async () => {
                const imageUri = await generateAndShareReceiptImage(receipt, business, false);
                if (imageUri) {
                  Alert.alert(t.success, 'Receipt image generated and ready to share!');
                }
              }
            },
            {
              text: 'Skip Printing',
              onPress: () => {
                Alert.alert(t.success, t.receiptSaved);
              }
            }
          ]
        );
    } else {
      // Generate and share PDF when printer not connected
      const pdfUri = await generateAndSharePDFReceipt(receipt, business, false);
      if (pdfUri) {
        Alert.alert(t.success, 'PDF receipt generated and ready to share!');
      } else {
        Alert.alert(t.success, t.receiptSaved);
      }
    }
  };

  const PreviewModal = () => (
    <Modal
      visible={showPreview}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowPreview(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>🧾 {t.previewReceipt}</Text>
            <TouchableOpacity onPress={() => setShowPreview(false)}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.receiptPreview}>
            {/* Receipt Content */}
            <View style={styles.receiptPaper}>
              <View style={styles.receiptHeader}>
                {business.logo && (
                  <Image
                    source={{ uri: business.logo }}
                    style={styles.businessLogo}
                    resizeMode="contain"
                  />
                )}
                <Text style={styles.modernBusinessName}>
                  {business.name || 'Mill House'}
                </Text>
                {business.phone && (
                  <Text style={styles.modernBusinessInfo}>{business.phone}</Text>
                )}
                {business.address && (
                  <Text style={styles.modernBusinessInfo}>{business.address}</Text>
                )}
              </View>

              <View style={styles.modernReceiptMeta}>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>{t.receiptNo}:</Text>
                  <Text style={styles.metaValue}>#{Date.now().toString().slice(-8)}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>{t.date}:</Text>
                  <Text style={styles.metaValue}>{format(new Date(), 'MM/dd/yyyy, hh:mm a')}</Text>
                </View>
              </View>

              <View style={styles.modernReceiptItems}>
                {currentLines.map((line) => (
                  <View key={line.id} style={styles.modernPreviewItem}>
                    <View style={styles.itemRow}>
                      <Text style={styles.modernItemName}>{line.name}</Text>
                      <View style={styles.itemQtyPrice}>
                        <Text style={styles.modernItemQty}>{line.qty}</Text>
                        <Text style={styles.modernItemTotal}>{line.total.toFixed(2)}</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>

              <View style={styles.modernTotalSection}>
                <Text style={styles.modernTotalLabel}>{t.total}:</Text>
                <Text style={styles.modernTotalAmount}>{grandTotal.toFixed(2)}</Text>
              </View>

              <View style={styles.modernThankYou}>
                <Text style={styles.thankYouText}>Thank you! / የቐንየለይ!</Text>
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.proceedButton}
              onPress={handlePrintAndSave}
            >
              <Text style={styles.proceedButtonText}>🖨️ {t.printAndSave}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const UnpaidModal = () => (
    <Modal
      visible={showUnpaidModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowUnpaidModal(false)}
    >
      <View style={styles.uModalOverlay}>
        <View style={styles.uModalContent}>
          <Text style={styles.uTitle}>{t.unpaidDetails || 'Unpaid Details'}</Text>

          <View style={styles.uRow}>
            <TouchableOpacity
              style={[styles.uOption, unpaidMode === 'full' && styles.uOptionActive]}
              onPress={() => setUnpaidMode('full')}
            >
              <Text style={[styles.uOptionText, unpaidMode === 'full' && styles.uOptionTextActive]}>{t.fullyUnpaid || 'Fully Unpaid'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.uOption, unpaidMode === 'partial' && styles.uOptionActive]}
              onPress={() => setUnpaidMode('partial')}
            >
              <Text style={[styles.uOptionText, unpaidMode === 'partial' && styles.uOptionTextActive]}>{t.partial || 'Partial'}</Text>
            </TouchableOpacity>
          </View>

          {unpaidMode === 'partial' && (
            <View style={{ marginTop: 12 }}>
              <Text style={styles.inputLabel}>{t.amountPaidNow || 'Amount Paid Now'}</Text>
              <TextInput
                style={styles.modernInput}
                placeholder="0.00"
                value={partialPaidAmount}
                onChangeText={setPartialPaidAmount}
                keyboardType="decimal-pad"
                placeholderTextColor={COLORS.textLight}
              />
            </View>
          )}

          <View style={{ marginTop: 12 }}>
            <Text style={styles.inputLabel}>{t.customerNameOptional || 'Customer Name (optional)'}</Text>
            <TextInput
              style={styles.modernInput}
              placeholder="Customer name"
              value={customerName}
              onChangeText={setCustomerName}
              placeholderTextColor={COLORS.textLight}
            />
          </View>

          <TouchableOpacity
            style={[styles.proceedButton, { marginTop: 16 }]}
            onPress={() => setShowUnpaidModal(false)}
          >
            <Text style={styles.proceedButtonText}>{t.done || 'Done'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Stats Cards */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: COLORS.primary }]}>
          <Text style={styles.statEmoji}>📝</Text>
          <Text style={styles.statValue}>{todayCount}</Text>
          <Text style={styles.statLabel}>{t.todayReceipts}</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: COLORS.secondary }]}>
          <Text style={styles.statEmoji}>💰</Text>
          <Text style={styles.statValue}>{todayRevenue.toFixed(2)}</Text>
          <Text style={styles.statLabel}>{t.todayRevenue}</Text>
        </View>
      </View>

      {/* Test Buttons for Tigrinya PDF */}
      <View style={styles.testButtonsRow}>
        <TouchableOpacity 
          style={[styles.testButton, { backgroundColor: COLORS.success }]}
          onPress={testTigrinyaPDF}
        >
          <Text style={styles.testButtonText}>🧪 Test Tigrinya PDF</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.testButton, { backgroundColor: COLORS.warning }]}
          onPress={testTigrinyaHTML}
        >
          <Text style={styles.testButtonText}>🌐 Test Tigrinya HTML</Text>
        </TouchableOpacity>
      </View>

      {/* Input Form */}
      <View style={styles.card}>
        {/* Paid / Unpaid Toggle */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, justifyContent: 'space-between' }}>
          <Text style={styles.inputLabel}>{t.paymentStatus || 'Payment Status'}</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              style={[styles.uPill, isPaid && styles.uPillActive]}
              onPress={() => setIsPaid(true)}
            >
              <Text style={[styles.uPillText, isPaid && styles.uPillTextActive]}>{t.paid || 'Paid'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.uPill, !isPaid && styles.uPillActive]}
              onPress={() => { setIsPaid(false); setShowUnpaidModal(true); }}
            >
              <Text style={[styles.uPillText, !isPaid && styles.uPillTextActive]}>{t.unpaid || 'Unpaid'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.inputLabel}>{t.itemName}</Text>
        <TextInput
          style={styles.modernInput}
          placeholder="Service"
          value={itemName}
          onChangeText={setItemName}
          placeholderTextColor={COLORS.textLight}
        />
        
        <View style={styles.row}>
          <View style={styles.halfColumn}>
            <Text style={styles.inputLabel}>{t.quantity}</Text>
            <TextInput
              style={[styles.modernInput, styles.centerInput]}
              placeholder="0"
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="numeric"
              placeholderTextColor={COLORS.textLight}
              blurOnSubmit={false}
              returnKeyType="done"
              autoCorrect={false}
              autoCapitalize="none"
            />
          </View>
          <View style={styles.halfColumn}>
            <Text style={styles.inputLabel}>{t.unitPrice}</Text>
            <TextInput
              style={styles.modernInput}
              placeholder="0.00"
              value={price}
              onChangeText={setPrice}
              keyboardType="decimal-pad"
              placeholderTextColor={COLORS.textLight}
              blurOnSubmit={false}
              returnKeyType="done"
              autoCorrect={false}
              autoCapitalize="none"
            />
          </View>
        </View>

        <TouchableOpacity style={styles.modernAddButton} onPress={addItem}>
          <Text style={styles.modernAddButtonText}>+ {t.addItem}</Text>
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

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.previewButton}
              onPress={() => setShowPreview(true)}
            >
              <Text style={styles.previewButtonText}>👁️ {t.preview}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.printButton} onPress={handlePrintAndSave}>
              <Text style={styles.buttonText}>🖨️ {t.print}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <PreviewModal />
      <UnpaidModal />
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
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
    opacity: 0.9,
  },
  testButtonsRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  testButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  testButtonText: {
    color: COLORS.surface,
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  card: {
    backgroundColor: COLORS.surface,
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: COLORS.shadow,
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
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
    marginTop: 12,
  },
  modernInput: {
    backgroundColor: '#F3F4F6',
    borderWidth: 0,
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    color: COLORS.text,
  },
  centerInput: {
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfColumn: {
    flex: 1,
  },
  modernAddButton: {
    backgroundColor: '#4F46E5',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  modernAddButtonText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: '600',
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
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  previewButton: {
    flex: 1,
    backgroundColor: COLORS.primary + '15',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  previewButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  printButton: {
    flex: 1,
    backgroundColor: COLORS.success,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    elevation: 10,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  closeIcon: {
    fontSize: 24,
    color: COLORS.textLight,
    paddingHorizontal: 8,
  },
  receiptPreview: {
    maxHeight: 400,
  },
  receiptPaper: {
    backgroundColor: COLORS.surface,
    margin: 12,
    padding: 16,
    borderRadius: 12,
    elevation: 4,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  receiptHeader: {
    alignItems: 'center',
    marginBottom: 12,
  },
  businessLogo: {
    width: 60,
    height: 60,
    marginBottom: 8,
    borderRadius: 8,
  },
  modernBusinessName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
    textAlign: 'center',
  },
  modernBusinessInfo: {
    fontSize: 11,
    color: COLORS.textLight,
    marginBottom: 1,
    textAlign: 'center',
  },
  modernReceiptMeta: {
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  metaLabel: {
    fontSize: 11,
    color: COLORS.textLight,
  },
  metaValue: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.text,
  },
  modernReceiptItems: {
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.text,
  },
  modernPreviewItem: {
    marginBottom: 6,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  modernItemName: {
    fontSize: 13,
    color: COLORS.text,
    flex: 1,
    marginRight: 8,
  },
  itemQtyPrice: {
    flexDirection: 'row',
    gap: 12,
  },
  modernItemQty: {
    fontSize: 13,
    color: COLORS.text,
    minWidth: 20,
  },
  modernItemTotal: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    minWidth: 50,
    textAlign: 'right',
  },
  modernTotalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modernTotalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  modernTotalAmount: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4F46E5',
  },
  modernThankYou: {
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  thankYouText: {
    fontSize: 11,
    color: COLORS.textLight,
    marginBottom: 2,
  },
  thankYouTextTi: {
    fontSize: 11,
    color: COLORS.textLight,
  },
  modalActions: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  proceedButton: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  proceedButtonText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: 'bold',
  },
  // unpaid modal
  uModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  uModalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 20,
    width: '100%',
  },
  uTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  uRow: {
    flexDirection: 'row',
    gap: 8,
  },
  uOption: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  uOptionActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  uOptionText: {
    color: COLORS.text,
    fontWeight: '600',
  },
  uOptionTextActive: {
    color: COLORS.primary,
  },
  uPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  uPillActive: {
    backgroundColor: COLORS.primary + '10',
    borderColor: COLORS.primary,
  },
  uPillText: {
    color: COLORS.text,
    fontWeight: '600',
  },
  uPillTextActive: {
    color: COLORS.primary,
  },
});
