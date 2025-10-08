import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  Alert,
  Modal,
  Image,
} from 'react-native';
import { COLORS } from '../utils/constants';
import { format } from 'date-fns';
import { printReceipt } from '../utils/printer';

export default function InventoryBillingScreen({ 
  inventory,
  receipts, 
  setReceipts, 
  business, 
  translations,
  printerStatus 
}) {
  const t = translations;
  const [currentLines, setCurrentLines] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  const quantityInputRef = useRef(null);

  const handleItemPress = (item) => {
    setSelectedItem(item);
  };


  const handleQuantityChange = (text) => {
    setQuantity(text);
  };

  const handleAddToReceipt = () => {
    if (!quantity || parseFloat(quantity) <= 0) {
      Alert.alert(t.error, t.enterValidQuantity);
      return;
    }

    const handleModalClose = () => {
      setSelectedItem(null);
    };

    const qty = parseFloat(quantity);
    const total = qty * selectedItem.unitPrice;
    
    const newLine = {
      id: Date.now().toString(),
      name: selectedItem.name,
      qty,
      price: selectedItem.unitPrice,
      total: parseFloat(total.toFixed(2)),
    };

    setCurrentLines([...currentLines, newLine]);
    setShowQuantityModal(false);
    setQuantity('');
    setSelectedItem(null);
  };

  const removeItem = (id) => {
    setCurrentLines(currentLines.filter(line => line.id !== id));
  };

  const handleModalClose = () => {
    setSelectedItem(null);
  };

  const grandTotal = currentLines.reduce((sum, line) => sum + line.total, 0);

  const handlePrintAndSave = async () => {
    if (currentLines.length === 0) {
      Alert.alert(t.error, t.addItemsFirst);
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
    setShowPreview(false);

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

  const PreviewModal = () => {
    return (
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
                    {business.name || t.businessName}
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
                  <Text style={styles.thankYouText}>{t.thankYou}</Text>
                  <Text style={styles.thankYouTextTi}>ብምምጻእኩም የቐንየለይ!</Text>
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
  };

  const QuantityModal = ({ item, onAdd, onClose, t }) => {
    const inputRef = useRef(null);
    const [localQty, setLocalQty] = useState('');
  
    React.useEffect(() => {
      if (item) {
        setLocalQty('');
    
        // Wait for modal to actually appear before focusing
        const timeout = setTimeout(() => {
          // Two-stage delay for Android reliability
          requestAnimationFrame(() => {
            inputRef.current?.focus();
          });
        }, 250);
    
        return () => clearTimeout(timeout);
      }
    }, [item]);
    
    if (!item) return null;
  
    const handleAdd = () => {
      const qty = parseFloat(localQty);
      if (!qty || qty <= 0) {
        Alert.alert(t.error, t.enterValidQuantity);
        return;
      }
      onAdd(qty);
      onClose();
    };
  
    return (
      <Modal
        visible={!!item}
        transparent
        animationType="fade"
        onRequestClose={onClose}
      >
        <TouchableWithoutFeedback>
          <View style={styles.quantityModalOverlay}>
            <View style={styles.quantityModalContent}>
              <Text style={styles.quantityModalTitle}>{item.name}</Text>
              <Text style={styles.quantityModalSubtitle}>
                {item.unitPrice.toFixed(0)} {t.perKg}
              </Text>
  
              <Text style={styles.quantityLabel}>{t.quantity}</Text>
  
              <TextInput
                ref={inputRef}
                style={styles.quantityInput}
                value={localQty}
                onChangeText={setLocalQty}
                placeholder="0"
                keyboardType="decimal-pad"
                placeholderTextColor={COLORS.textLight}
                returnKeyType="done"
                blurOnSubmit={false}
                autoCorrect={false}
                autoCapitalize="none"
              />
  
              <View style={styles.quantityModalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={onClose}
                >
                  <Text style={styles.cancelButtonText}>{t.cancel}</Text>
                </TouchableOpacity>
  
                <TouchableOpacity
                  style={styles.addToReceiptButton}
                  onPress={handleAdd}
                >
                  <Text style={styles.addToReceiptButtonText}>{t.addToReceipt}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    );
  };
  
  
  

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🧾 {t.inventoryBilling}</Text>
      </View>

      <ScrollView>
        {/* Inventory Items Grid */}
        {inventory.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyText}>{t.noInventoryItems}</Text>
            <Text style={styles.emptySubtext}>{t.addItemsFirst}</Text>
          </View>
        ) : (
          <View style={styles.itemsGrid}>
            {inventory.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.inventoryCard}
                onPress={() => handleItemPress(item)}
              >
                <Text style={styles.inventoryCardName}>{item.name}</Text>
                <Text style={styles.inventoryCardPrice}>{item.unitPrice.toFixed(0)} {t.perKg || 'per kg'}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Current Receipt */}
        {currentLines.length > 0 && (
          <View style={styles.receiptCard}>
            <Text style={styles.receiptCardTitle}>📄 {t.currentReceipt || 'Current Receipt'}</Text>
            
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
                <Text style={styles.printButtonText}>🖨️ {t.print}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* <QuantityModal />
       */}
        <QuantityModal
  item={selectedItem}
  onAdd={(qty) => {
    const total = qty * selectedItem.unitPrice;
    const newLine = {
      id: Date.now().toString(),
      name: selectedItem.name,
      qty,
      price: selectedItem.unitPrice,
      total: parseFloat(total.toFixed(2)),
    };
    setCurrentLines((prev) => [...prev, newLine]);
  }}
  onClose={handleModalClose}
  t={t}
/>


      <PreviewModal />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  emptyCard: {
    backgroundColor: COLORS.surface,
    padding: 40,
    margin: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
  },
  inventoryCard: {
    backgroundColor: COLORS.surface,
    width: '47%',
    margin: '1.5%',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  inventoryCardName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  inventoryCardPrice: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
  },
  receiptCard: {
    backgroundColor: COLORS.surface,
    padding: 16,
    margin: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  receiptCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
  },
  lineItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  lineItemLeft: {
    flex: 1,
  },
  lineItemName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  lineItemDetails: {
    fontSize: 11,
    color: COLORS.textLight,
  },
  lineItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  lineItemTotal: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  deleteButton: {
    fontSize: 18,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  totalValue: {
    fontSize: 20,
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
  printButtonText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: '600',
  },
  quantityModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.overlay,
    padding: 20,
  },
  quantityModalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    elevation: 10,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  quantityModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  quantityModalSubtitle: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: 24,
  },
  quantityLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  quantityInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 16,
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    color: COLORS.text,
    marginBottom: 24,
  },
  quantityModalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  addToReceiptButton: {
    flex: 1,
    backgroundColor: '#4F46E5',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  addToReceiptButtonText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: '600',
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
});
