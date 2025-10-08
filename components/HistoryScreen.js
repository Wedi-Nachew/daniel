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
} from 'react-native';
import { COLORS } from '../utils/constants';
import {
  format,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  parseISO,
  addDays,
  subDays,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
} from 'date-fns';
import { loadSecurity, saveSecurity, deleteReceipt, clearAllReceipts } from '../utils/storage';
import { hashPin, hashAnswer } from '../utils/security';
import { printReceipt } from '../utils/printer';

export default function HistoryScreen({
  receipts,
  setReceipts,
  business,
  translations,
  printerStatus,
}) {
  const t = translations;
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [hasPin, setHasPin] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // PIN setup state
  const [setupPin, setSetupPin] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [securityAnswerInput, setSecurityAnswerInput] = useState('');
  const [securityQuestion2, setSecurityQuestion2] = useState('');
  const [securityAnswerInput2, setSecurityAnswerInput2] = useState('');
  
  // Unlock state
  const [unlockPin, setUnlockPin] = useState('');
  
  // Reset state
  const [showResetModal, setShowResetModal] = useState(false);
  const [storedQuestion, setStoredQuestion] = useState('');
  const [storedQuestion2, setStoredQuestion2] = useState('');
  const [resetAnswer, setResetAnswer] = useState('');
  const [resetAnswer2, setResetAnswer2] = useState('');
  const [resetNewPin, setResetNewPin] = useState('');

  // Delete modals state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [receiptToDelete, setReceiptToDelete] = useState(null);
  const [showClearAllModal, setShowClearAllModal] = useState(false);

  // History filter state
  const [filteredReceipts, setFilteredReceipts] = useState([]);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [activeRange, setActiveRange] = useState('daily');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [customRange, setCustomRange] = useState(null);
  useEffect(() => {
    checkPinStatus();
  }, []);

  const checkPinStatus = async () => {
    const security = await loadSecurity();
    setHasPin(!!security.pin);
    if (security.question) {
      setStoredQuestion(security.question);
    }
    if (security.question2) {
      setStoredQuestion2(security.question2);
    }
    setLoading(false);
  };

  const sortReceiptsDesc = (list) =>
    [...list].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const filterReceiptsByRange = (sourceReceipts, range) => {
    if (!range) {
      return sortReceiptsDesc(sourceReceipts);
    }

    const { start, end } = range;
    return sortReceiptsDesc(
      sourceReceipts.filter((r) => {
        const receiptDate = new Date(r.date);
        return receiptDate >= start && receiptDate <= end;
      })
    );
  };

  const getDateRange = () => {
    if (activeRange === 'custom') {
      return customRange;
    }

    switch (activeRange) {
      case 'daily':
        return {
          start: startOfDay(selectedDate),
          end: endOfDay(selectedDate),
        };
      case 'weekly':
        return {
          start: startOfWeek(selectedDate, { weekStartsOn: 1 }),
          end: endOfWeek(selectedDate, { weekStartsOn: 1 }),
        };
      case 'monthly':
        return {
          start: startOfMonth(selectedDate),
          end: endOfMonth(selectedDate),
        };
      default:
        return null;
    }
  };

  const formatRangeLabel = () => {
    const range = getDateRange();
    if (!range) {
      return t.selectDate;
    }

    if (activeRange === 'daily') {
      return format(range.start, 'MMMM dd, yyyy');
    }

    if (activeRange === 'weekly') {
      return `${format(range.start, 'MMM dd')} - ${format(range.end, 'MMM dd, yyyy')}`;
    }

    if (activeRange === 'monthly') {
      return format(range.start, 'MMMM yyyy');
    }

    if (activeRange === 'custom' && customRange) {
      return `${format(customRange.start, 'MMM dd, yyyy')} - ${format(customRange.end, 'MMM dd, yyyy')}`;
    }

    return t.selectDate;
  };

  const handleRangeChange = (range) => {
    setActiveRange(range);
    if (range !== 'custom') {
      setCustomRange(null);
      setSelectedDate(new Date());
    }
  };

  const handlePreviousRange = () => {
    if (activeRange === 'custom') return;

    switch (activeRange) {
      case 'daily':
        setSelectedDate((prev) => subDays(prev, 1));
        break;
      case 'weekly':
        setSelectedDate((prev) => subWeeks(prev, 1));
        break;
      case 'monthly':
        setSelectedDate((prev) => subMonths(prev, 1));
        break;
      default:
        break;
    }
  };

  const handleNextRange = () => {
    if (activeRange === 'custom') return;

    switch (activeRange) {
      case 'daily':
        setSelectedDate((prev) => addDays(prev, 1));
        break;
      case 'weekly':
        setSelectedDate((prev) => addWeeks(prev, 1));
        break;
      case 'monthly':
        setSelectedDate((prev) => addMonths(prev, 1));
        break;
      default:
        break;
    }
  };

  const handleToday = () => {
    if (activeRange === 'custom') {
      setCustomRange({ start: startOfDay(new Date()), end: endOfDay(new Date()) });
      setFilterFrom(format(new Date(), 'yyyy-MM-dd'));
      setFilterTo(format(new Date(), 'yyyy-MM-dd'));
    }
    setSelectedDate(new Date());
  };

  useEffect(() => {
    if (!isUnlocked) return;

    const range = getDateRange();
    setFilteredReceipts(filterReceiptsByRange(receipts, range));
  }, [receipts, isUnlocked, activeRange, selectedDate, customRange]);

  const handleSetPin = async () => {
    if (setupPin.length !== 4) {
      Alert.alert(t.error, t.pinMustBe4Digits);
      return;
    }
    if (!securityQuestion.trim() || !securityAnswerInput.trim() || !securityQuestion2.trim() || !securityAnswerInput2.trim()) {
      Alert.alert(t.error, t.allFieldsRequired);
      return;
    }

    const hashedPin = await hashPin(setupPin);
    const hashedAnswer = await hashAnswer(securityAnswerInput);
    const hashedAnswer2 = await hashAnswer(securityAnswerInput2);
    
    await saveSecurity(hashedPin, securityQuestion, hashedAnswer, securityQuestion2, hashedAnswer2);
    
    setHasPin(true);
    setIsUnlocked(true);
    setFilteredReceipts(filterReceiptsByRange(receipts, getDateRange()));
    Alert.alert(t.success, t.pinSet);
  };

  const handleUnlock = async () => {
    if (unlockPin.length !== 4) {
      Alert.alert(t.error, t.pinMustBe4Digits);
      return;
    }

    const security = await loadSecurity();
    const hashedInput = await hashPin(unlockPin);
    
    if (hashedInput === security.pin) {
      setIsUnlocked(true);
      setFilteredReceipts(filterReceiptsByRange(receipts, getDateRange()));
      setUnlockPin('');
    } else {
      Alert.alert(t.error, t.incorrectPin);
    }
  };

  const handleResetPin = async () => {
    if (!resetAnswer.trim() || !resetAnswer2.trim() || resetNewPin.length !== 4) {
      Alert.alert(t.error, t.allFieldsRequired);
      return;
    }

    const security = await loadSecurity();
    const hashedAnswer1 = await hashAnswer(resetAnswer.trim());
    const hashedAnswer2 = await hashAnswer(resetAnswer2.trim());
    
    // Both security questions must be answered correctly
    if (hashedAnswer1 === security.answer && hashedAnswer2 === security.answer2) {
      const newHashedPin = await hashPin(resetNewPin);
      await saveSecurity(newHashedPin, security.question, security.answer, security.question2, security.answer2);
      
      setShowResetModal(false);
      setIsUnlocked(true);
      setFilteredReceipts(filterReceiptsByRange(receipts, getDateRange()));
      setResetAnswer('');
      setResetAnswer2('');
      setResetNewPin('');
      Alert.alert(t.success, t.pinSet);
    } else {
      Alert.alert(t.error, t.incorrectAnswer);
    }
  };

  const applyFilter = () => {
    if (!filterFrom || !filterTo) {
      setFilteredReceipts(receipts);
      setShowFilterModal(false);
      return;
    }

    try {
      const from = startOfDay(parseISO(filterFrom));
      const to = endOfDay(parseISO(filterTo));

      if (from > to) {
        Alert.alert(t.error, t.invalidDateRange);
        return;
      }

      const filtered = receipts.filter(r => {
        const receiptDate = new Date(r.date);
        return receiptDate >= from && receiptDate <= to;
      });

      setCustomRange({ start: from, end: to });
      setActiveRange('custom');
      setFilteredReceipts(filterReceiptsByRange(receipts, { start: from, end: to }));
      setShowFilterModal(false);
    } catch (error) {
      Alert.alert(t.error, t.invalidDateRange);
    }
  };

  const handlePrintCopy = async (receipt) => {
    const updatedReceipt = { ...receipt, isCopy: true };
    const updatedReceipts = receipts.map(r => 
      r.id === receipt.id ? updatedReceipt : r
    );
    setReceipts(updatedReceipts);
    setFilteredReceipts((prev) =>
      prev.map((r) => (r.id === receipt.id ? updatedReceipt : r))
    );

    if (printerStatus === 'connected') {
      const success = await printReceipt(updatedReceipt, business, true);
      if (success) {
        Alert.alert(t.success, t.printSuccess);
      } else {
        Alert.alert(t.error, t.printError);
      }
    } else {
      Alert.alert(t.error, t.printerError);
    }
  };

  const handleDeleteReceipt = (receipt) => {
    setReceiptToDelete(receipt);
    setShowDeleteModal(true);
  };

  const confirmDeleteReceipt = async () => {
    if (!receiptToDelete) return;

    const success = await deleteReceipt(receiptToDelete.id);
    if (success) {
      const updatedReceipts = receipts.filter(r => r.id !== receiptToDelete.id);
      setReceipts(updatedReceipts);
      setFilteredReceipts((prev) => prev.filter((r) => r.id !== receiptToDelete.id));
      Alert.alert(t.success, t.receiptDeleted);
    } else {
      Alert.alert(t.error, t.printError);
    }

    setShowDeleteModal(false);
    setReceiptToDelete(null);
  };

  const handleClearAll = () => {
    setShowClearAllModal(true);
  };

  const confirmClearAll = async () => {
    const success = await clearAllReceipts();
    if (success) {
      setReceipts([]);
      setFilteredReceipts([]);
      Alert.alert(t.success, t.allReceiptsCleared);
    } else {
      Alert.alert(t.error, t.printError);
    }

    setShowClearAllModal(false);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>{t.loading}</Text>
      </View>
    );
  }

  // PIN Setup Screen
  if (!hasPin) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🔐 {t.setPin}</Text>
          
          <Text style={styles.label}>PIN (4 digits)</Text>
          <TextInput
            style={styles.input}
            placeholder={t.pinPlaceholder}
            value={setupPin}
            onChangeText={setSetupPin}
            keyboardType="numeric"
            maxLength={4}
            secureTextEntry
            placeholderTextColor={COLORS.textLight}
            blurOnSubmit={false}
            returnKeyType="done"
            autoCorrect={false}
            autoCapitalize="none"
          />
          
          <Text style={styles.label}>{t.securityQuestion}</Text>
          <TextInput
            style={styles.input}
            placeholder={t.securityQuestionExample}
            value={securityQuestion}
            onChangeText={setSecurityQuestion}
            placeholderTextColor={COLORS.textLight}
          />
          
          <Text style={styles.label}>{t.securityAnswer}</Text>
          <TextInput
            style={styles.input}
            placeholder={t.answerPlaceholder}
            value={securityAnswerInput}
            onChangeText={setSecurityAnswerInput}
            placeholderTextColor={COLORS.textLight}
          />

          <Text style={styles.label}>{t.securityQuestion2}</Text>
          <TextInput
            style={styles.input}
            placeholder={t.securityQuestionExample2}
            value={securityQuestion2}
            onChangeText={setSecurityQuestion2}
            placeholderTextColor={COLORS.textLight}
          />
          
          <Text style={styles.label}>{t.securityAnswer2}</Text>
          <TextInput
            style={styles.input}
            placeholder={t.answerPlaceholder}
            value={securityAnswerInput2}
            onChangeText={setSecurityAnswerInput2}
            placeholderTextColor={COLORS.textLight}
          />

          <TouchableOpacity style={styles.primaryButton} onPress={handleSetPin}>
            <Text style={styles.buttonText}>{t.setPin}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // Unlock Screen
  if (!isUnlocked) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.lockIcon}>🔐</Text>
          <Text style={styles.lockTitle}>{t.ownerAccess}</Text>
          
          <Text style={styles.label}>{t.enterPin}</Text>
          <TextInput
            style={styles.input}
            placeholder={t.pinPlaceholder}
            value={unlockPin}
            onChangeText={setUnlockPin}
            keyboardType="numeric"
            maxLength={4}
            secureTextEntry
            placeholderTextColor={COLORS.textLight}
            blurOnSubmit={false}
            returnKeyType="done"
            autoCorrect={false}
            autoCapitalize="none"
          />

          <TouchableOpacity style={styles.primaryButton} onPress={handleUnlock}>
            <Text style={styles.buttonText}>{t.unlock}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setShowResetModal(true)}>
            <Text style={styles.forgotPinText}>{t.forgotPin}</Text>
          </TouchableOpacity>
        </View>

        {/* Reset PIN Modal */}
        <Modal visible={showResetModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{t.resetPin}</Text>
              
              <Text style={styles.label}>{storedQuestion}</Text>
              <TextInput
                style={styles.input}
                placeholder={t.securityAnswer}
                value={resetAnswer}
                onChangeText={setResetAnswer}
                placeholderTextColor={COLORS.textLight}
              />
              
              <Text style={styles.label}>{storedQuestion2}</Text>
              <TextInput
                style={styles.input}
                placeholder={t.securityAnswer2}
                value={resetAnswer2}
                onChangeText={setResetAnswer2}
                placeholderTextColor={COLORS.textLight}
              />
              
              <Text style={styles.label}>{t.newPin}</Text>
              <TextInput
                style={styles.input}
                placeholder={t.pinPlaceholder}
                value={resetNewPin}
                onChangeText={setResetNewPin}
                keyboardType="numeric"
                maxLength={4}
                secureTextEntry
                placeholderTextColor={COLORS.textLight}
                blurOnSubmit={false}
                returnKeyType="done"
                autoCorrect={false}
                autoCapitalize="none"
              />

              <TouchableOpacity style={styles.primaryButton} onPress={handleResetPin}>
                <Text style={styles.buttonText}>{t.resetPin}</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => setShowResetModal(false)}
              >
                <Text style={styles.cancelButtonText}>{t.cancel}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>
    );
  }

  // History View
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📜 {t.history}</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilterModal(true)}
          >
            <Text style={styles.filterButtonText}>📅 {t.filterByDate}</Text>
          </TouchableOpacity>
          {filteredReceipts.length > 0 && (
            <TouchableOpacity
              style={styles.clearAllButton}
              onPress={handleClearAll}
            >
              <Text style={styles.clearAllButtonText}>🗑️ {t.clearAll}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.rangeTabs}>
        <TouchableOpacity
          style={[styles.rangeTab, activeRange === 'daily' && styles.rangeTabActive]}
          onPress={() => handleRangeChange('daily')}
        >
          <Text style={[styles.rangeTabText, activeRange === 'daily' && styles.rangeTabTextActive]}>
            {t.daily}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.rangeTab, activeRange === 'weekly' && styles.rangeTabActive]}
          onPress={() => handleRangeChange('weekly')}
        >
          <Text style={[styles.rangeTabText, activeRange === 'weekly' && styles.rangeTabTextActive]}>
            {t.weekly}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.rangeTab, activeRange === 'monthly' && styles.rangeTabActive]}
          onPress={() => handleRangeChange('monthly')}
        >
          <Text style={[styles.rangeTabText, activeRange === 'monthly' && styles.rangeTabTextActive]}>
            {t.monthly}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.dateNav}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={handlePreviousRange}
          disabled={activeRange === 'custom'}
        >
          <Text style={[styles.navButtonText, activeRange === 'custom' && styles.navButtonTextDisabled]}>←</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.dateDisplay} onPress={handleToday}>
          <Text style={styles.dateText}>{formatRangeLabel()}</Text>
          <Text style={styles.todayHint}>{t.selectDate}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navButton}
          onPress={handleNextRange}
          disabled={activeRange === 'custom'}
        >
          <Text style={[styles.navButtonText, activeRange === 'custom' && styles.navButtonTextDisabled]}>→</Text>
        </TouchableOpacity>
      </View>

      <ScrollView>
        {filteredReceipts.length === 0 ? (
          <View style={styles.card}>
            <Text style={styles.emptyText}>{t.noReceiptsFound}</Text>
          </View>
        ) : (
          filteredReceipts.map((receipt) => (
            <View key={receipt.id} style={styles.card}>
              <View style={styles.receiptHeader}>
                <View>
                  <Text style={styles.receiptId}>
                    {t.receiptNo}: {receipt.id.slice(-8)}
                  </Text>
                  <Text style={styles.receiptDate}>
                    {format(new Date(receipt.date), 'MMM dd, yyyy HH:mm')}
                  </Text>
                </View>
                <View style={styles.receiptRight}>
                  <Text style={styles.receiptTotal}>{receipt.total}</Text>
                  {receipt.isCopy && (
                    <View style={styles.copyBadge}>
                      <Text style={styles.copyBadgeText}>{t.copy}</Text>
                    </View>
                  )}
                </View>
              </View>

              {receipt.lines.map((line) => (
                <Text key={line.id} style={styles.lineText}>
                  • {line.name} - {line.qty} × {line.price} = {line.total}
                </Text>
              ))}

              <TouchableOpacity 
                style={styles.printCopyButton}
                onPress={() => handlePrintCopy(receipt)}
              >
                <Text style={styles.printCopyButtonText}>🖨️ {t.printCopy}</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.deleteButton}
                onPress={() => handleDeleteReceipt(receipt)}
              >
                <Text style={styles.deleteButtonText}>🗑️ {t.deleteReceipt}</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      {/* Filter Modal */}
      <Modal visible={showFilterModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t.filterByDate}</Text>
            
            <Text style={styles.label}>{t.from}</Text>
            <TextInput
              style={styles.input}
              placeholder={t.dateFormat}
              value={filterFrom}
              onChangeText={setFilterFrom}
              placeholderTextColor={COLORS.textLight}
            />
            
            <Text style={styles.label}>{t.to}</Text>
            <TextInput
              style={styles.input}
              placeholder={t.dateFormat}
              value={filterTo}
              onChangeText={setFilterTo}
              placeholderTextColor={COLORS.textLight}
            />

            <TouchableOpacity style={styles.primaryButton} onPress={applyFilter}>
              <Text style={styles.buttonText}>{t.calculate}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={() => setShowFilterModal(false)}
            >
              <Text style={styles.cancelButtonText}>{t.cancel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Delete Receipt Modal */}
      <Modal visible={showDeleteModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t.deleteConfirmation}</Text>
            <Text style={styles.confirmationText}>{t.deleteReceiptMessage}</Text>

            <TouchableOpacity 
              style={[styles.primaryButton, styles.deleteConfirmButton]} 
              onPress={confirmDeleteReceipt}
            >
              <Text style={styles.buttonText}>{t.confirmDelete}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={() => setShowDeleteModal(false)}
            >
              <Text style={styles.cancelButtonText}>{t.cancel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Clear All Modal */}
      <Modal visible={showClearAllModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t.clearAllConfirmation}</Text>
            <Text style={styles.confirmationText}>{t.clearAllMessage}</Text>

            <TouchableOpacity 
              style={[styles.primaryButton, styles.deleteConfirmButton]} 
              onPress={confirmClearAll}
            >
              <Text style={styles.buttonText}>{t.confirmClearAll}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={() => setShowClearAllModal(false)}
            >
              <Text style={styles.cancelButtonText}>{t.cancel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  rangeTabs: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  rangeTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  rangeTabActive: {
    borderBottomColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  rangeTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textLight,
  },
  rangeTabTextActive: {
    color: COLORS.primary,
  },
  dateNav: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonText: {
    fontSize: 20,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  navButtonTextDisabled: {
    color: COLORS.textLight,
  },
  dateDisplay: {
    flex: 1,
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  todayHint: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 2,
  },
  filterButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  filterButtonText: {
    color: COLORS.surface,
    fontSize: 12,
    fontWeight: '600',
  },
  clearAllButton: {
    backgroundColor: COLORS.error,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  clearAllButtonText: {
    color: COLORS.surface,
    fontSize: 12,
    fontWeight: '600',
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
  lockIcon: {
    fontSize: 64,
    textAlign: 'center',
    marginBottom: 16,
  },
  lockTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
    marginTop: 8,
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
  primaryButton: {
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
  forgotPinText: {
    color: COLORS.primary,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
    textDecorationLine: 'underline',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  cancelButton: {
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelButtonText: {
    color: COLORS.textLight,
    fontSize: 16,
    fontWeight: '600',
  },
  receiptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  receiptId: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  receiptDate: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  receiptRight: {
    alignItems: 'flex-end',
  },
  receiptTotal: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  copyBadge: {
    backgroundColor: COLORS.warning,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  copyBadgeText: {
    color: COLORS.surface,
    fontSize: 10,
    fontWeight: 'bold',
  },
  lineText: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 4,
  },
  printCopyButton: {
    backgroundColor: COLORS.success,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  printCopyButtonText: {
    color: COLORS.surface,
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: COLORS.error,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  deleteButtonText: {
    color: COLORS.surface,
    fontSize: 14,
    fontWeight: '600',
  },
  confirmationText: {
    fontSize: 16,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  deleteConfirmButton: {
    backgroundColor: COLORS.error,
    marginBottom: 12,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: COLORS.textLight,
    paddingVertical: 20,
  },
  loadingText: {
    textAlign: 'center',
    fontSize: 16,
    color: COLORS.textLight,
    marginTop: 50,
  },
});
