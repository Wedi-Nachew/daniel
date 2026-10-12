import React, { useState, useEffect, useMemo } from 'react';
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
  addDays,
  addWeeks,
  addMonths,
  subDays,
  subWeeks,
  subMonths,
  parseISO,
  eachHourOfInterval,
} from 'date-fns';
import { loadSecurity, saveSecurity, deleteReceipt, clearAllReceipts } from '../utils/storage';
import { hashPin, hashAnswer } from '../utils/security';
import { printReceipt } from '../utils/print';

// Inline UnpaidReceiptsList component for use in HistoryScreen
const UnpaidReceiptsList = ({ receipts, setReceipts, business, translations }) => {
  const t = translations;
  const [query, setQuery] = useState('');
  const [minAmt, setMinAmt] = useState('');
  const [maxAmt, setMaxAmt] = useState('');
  const [selected, setSelected] = useState(null);
  const [payment, setPayment] = useState('');
  const [payer, setPayer] = useState('');

  const unpaid = useMemo(() => {
    const list = receipts.filter(r => !r.is_paid || (r.unpaid_amount && r.unpaid_amount > 0));
    const filtered = list.filter(r => {
      const matchQuery = query.trim() === '' || (r.customer_name || '').toLowerCase().includes(query.toLowerCase()) || r.id.includes(query);
      const minOk = minAmt.trim() === '' || (parseFloat(r.unpaid_amount) >= parseFloat(minAmt || '0'));
      const maxOk = maxAmt.trim() === '' || (parseFloat(r.unpaid_amount) <= parseFloat(maxAmt || '999999'));
      return matchQuery && minOk && maxOk;
    });
    return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [receipts, query, minAmt, maxAmt]);

  const settlePayment = async (receipt) => {
    const amount = parseFloat(payment || '0');
    if (isNaN(amount) || amount <= 0) {
      Alert.alert(t.error || 'Error', t.enterValidPayment || 'Enter a valid payment amount');
      return;
    }
    if (amount > receipt.unpaid_amount) {
      Alert.alert(t.error || 'Error', t.paymentExceedsUnpaid || 'Payment exceeds unpaid amount');
      return;
    }
    const remaining = parseFloat((receipt.unpaid_amount - amount).toFixed(2));
    const updated = {
      ...receipt,
      paid_amount: parseFloat((parseFloat(receipt.paid_amount || 0) + amount).toFixed(2)),
      unpaid_amount: remaining,
      is_paid: remaining <= 0,
      payment_history: [
        ...(receipt.payment_history || []),
        { date: new Date().toISOString(), amount, method: 'cash', payer_name: payer || '' },
      ],
    };
    const newReceipts = receipts.map(r => (r.id === receipt.id ? updated : r));
    setReceipts(newReceipts);
    setSelected(updated);
    setPayment('');
    setPayer('');

    // Print confirmation slip
    try {
      await printReceipt(
        {
          id: `${receipt.id}-CONF`,
          date: new Date().toISOString(),
          lines: [
            { id: 'p1', name: t.paymentReceived || 'Payment Received', qty: 1, price: amount, total: amount },
            { id: 'p2', name: `${t.forReceipt || 'For Receipt'} #${receipt.id.slice(-8)}`, qty: 1, price: 0, total: 0 },
            { id: 'p3', name: `${t.remaining || 'Remaining'}: ${remaining.toFixed(2)}`, qty: 1, price: 0, total: 0 },
          ],
          total: amount,
          isCopy: false,
        },
        business,
        false
      );
    } catch {}
  };

  return (
    <View style={styles.unpaidContainer}>
      <View style={styles.unpaidFilters}>
        <TextInput
          style={styles.unpaidInput}
          placeholder={t.searchUnpaidPlaceholder || 'Search by customer or receipt id'}
          value={query}
          onChangeText={setQuery}
          placeholderTextColor={COLORS.textLight}
        />
        <View style={styles.unpaidRow}>
          <TextInput
            style={[styles.unpaidInput, { flex: 1 }]}
            placeholder={t.minUnpaid || 'Min unpaid'}
            value={minAmt}
            onChangeText={setMinAmt}
            keyboardType="decimal-pad"
            placeholderTextColor={COLORS.textLight}
          />
          <TextInput
            style={[styles.unpaidInput, { flex: 1 }]}
            placeholder={t.maxUnpaid || 'Max unpaid'}
            value={maxAmt}
            onChangeText={setMaxAmt}
            keyboardType="decimal-pad"
            placeholderTextColor={COLORS.textLight}
          />
        </View>
      </View>

      {unpaid.length === 0 ? (
        <View style={styles.unpaidEmptyCard}>
          <Text style={styles.unpaidEmptyIcon}>💳</Text>
          <Text style={styles.unpaidEmptyText}>{t.noUnpaidReceipts || 'No unpaid receipts'}</Text>
        </View>
      ) : (
        unpaid.map(r => (
          <View key={r.id} style={styles.unpaidCard}>
            <View style={styles.unpaidHeaderRow}>
              <View>
                <Text style={styles.unpaidRId}>#{r.id.slice(-8)}</Text>
                <Text style={styles.unpaidRDate}>{format(new Date(r.date), 'MMM dd, yyyy • HH:mm')}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.unpaidAmount}>{r.unpaid_amount?.toFixed ? r.unpaid_amount.toFixed(2) : r.unpaid_amount}</Text>
                {!!r.customer_name && <Text style={styles.unpaidCustomer}>{r.customer_name}</Text>}
              </View>
            </View>

            <View style={styles.unpaidPayRow}>
              <TextInput
                style={[styles.unpaidInput, { flex: 1 }]}
                placeholder={t.paymentAmount || 'Payment amount'}
                value={selected?.id === r.id ? payment : ''}
                onChangeText={setPayment}
                keyboardType="decimal-pad"
                placeholderTextColor={COLORS.textLight}
                onFocus={() => setSelected(r)}
              />
              <TextInput
                style={[styles.unpaidInput, { flex: 1 }]}
                placeholder={t.payerNameOptional || 'Payer name (optional)'}
                value={selected?.id === r.id ? payer : ''}
                onChangeText={setPayer}
                placeholderTextColor={COLORS.textLight}
                onFocus={() => setSelected(r)}
              />
              <TouchableOpacity style={styles.unpaidPayBtn} onPress={() => settlePayment(r)}>
                <Text style={styles.unpaidPayText}>✓</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </View>
  );
};

export default function HistoryScreenNew({ 
  receipts, 
  setReceipts, 
  business, 
  translations,
  printerStatus 
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
  const [showResetForm, setShowResetForm] = useState(false);
  const [storedQuestion, setStoredQuestion] = useState('');
  const [storedQuestion2, setStoredQuestion2] = useState('');
  const [resetAnswer, setResetAnswer] = useState('');
  const [resetAnswer2, setResetAnswer2] = useState('');
  const [resetNewPin, setResetNewPin] = useState('');
  
  // Calendar navigation state
  const [activeTab, setActiveTab] = useState('daily');
  const [showUnpaidOnly, setShowUnpaidOnly] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showHourlyFilter, setShowHourlyFilter] = useState(false);
  const [startHour, setStartHour] = useState('');
  const [endHour, setEndHour] = useState('');
  
  // Delete/Clear state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [receiptToDelete, setReceiptToDelete] = useState(null);
  const [showClearAllModal, setShowClearAllModal] = useState(false);

  useEffect(() => {
    checkPinStatus();
  }, []);

  const checkPinStatus = async () => {
    try {
      const security = await loadSecurity();
      setHasPin(!!security?.pin);
      if (security?.question) {
        setStoredQuestion(security.question);
      }
      if (security?.question2) {
        setStoredQuestion2(security.question2);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error checking PIN status:', error);
      setLoading(false);
    }
  };

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
    Alert.alert(t.success, t.pinSet);
  };

  const handleUnlock = async () => {
    if (unlockPin.length !== 4) {
      Alert.alert(t.error, t.pinMustBe4Digits);
      return;
    }

    try {
      const security = await loadSecurity();
      const hashedInput = await hashPin(unlockPin);
      
      if (hashedInput === security?.pin) {
        setIsUnlocked(true);
        setUnlockPin('');
      } else {
        Alert.alert(t.error, t.incorrectPin);
      }
    } catch (error) {
      console.error('Error unlocking:', error);
      Alert.alert(t.error, t.failedToUnlock);
    }
  };

  const handleResetPin = async () => {
    if (!resetAnswer.trim() || !resetAnswer2.trim() || resetNewPin.length !== 4) {
      Alert.alert(t.error, t.allFieldsRequired);
      return;
    }

    try {
      const security = await loadSecurity();
      const hashedAnswer1 = await hashAnswer(resetAnswer.trim());
      const hashedAnswer2 = await hashAnswer(resetAnswer2.trim());
      
      if (hashedAnswer1 === security?.answer && hashedAnswer2 === security?.answer2) {
        const newHashedPin = await hashPin(resetNewPin);
        await saveSecurity(newHashedPin, security.question, security.answer, security.question2, security.answer2);
        
        setShowResetForm(false);
        setIsUnlocked(true);
        setResetAnswer('');
        setResetAnswer2('');
        setResetNewPin('');
        Alert.alert(t.success, t.pinSet);
      } else {
        Alert.alert(t.error, t.incorrectAnswer);
      }
    } catch (error) {
      console.error('Error resetting PIN:', error);
      Alert.alert(t.error, t.failedToResetPin);
    }
  };

  const getFilteredReceipts = () => {
    let start, end;

    switch (activeTab) {
      case 'daily':
        start = startOfDay(selectedDate);
        end = endOfDay(selectedDate);
        break;
      case 'weekly':
        start = startOfWeek(selectedDate, { weekStartsOn: 1 });
        end = endOfWeek(selectedDate, { weekStartsOn: 1 });
        break;
      case 'monthly':
        start = startOfMonth(selectedDate);
        end = endOfMonth(selectedDate);
        break;
      default:
        start = startOfDay(selectedDate);
        end = endOfDay(selectedDate);
    }

    let filtered = receipts.filter(r => {
      const receiptDate = new Date(r.date);
      return receiptDate >= start && receiptDate <= end;
    });

    // Apply hourly filter if set
    if (startHour !== '' && endHour !== '') {
      const startH = parseInt(startHour);
      const endH = parseInt(endHour);
      
      if (!isNaN(startH) && !isNaN(endH) && startH >= 0 && startH <= 23 && endH >= 0 && endH <= 23) {
        filtered = filtered.filter(r => {
          const receiptDate = new Date(r.date);
          const hour = receiptDate.getHours();
          if (startH <= endH) {
            return hour >= startH && hour <= endH;
          } else {
            return hour >= startH || hour <= endH;
          }
        });
      }
    }

    return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const handlePrevious = () => {
    switch (activeTab) {
      case 'daily':
        setSelectedDate(subDays(selectedDate, 1));
        break;
      case 'weekly':
        setSelectedDate(subWeeks(selectedDate, 1));
        break;
      case 'monthly':
        setSelectedDate(subMonths(selectedDate, 1));
        break;
    }
  };

  const handleNext = () => {
    switch (activeTab) {
      case 'daily':
        setSelectedDate(addDays(selectedDate, 1));
        break;
      case 'weekly':
        setSelectedDate(addWeeks(selectedDate, 1));
        break;
      case 'monthly':
        setSelectedDate(addMonths(selectedDate, 1));
        break;
    }
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  const formatDateRange = () => {
    switch (activeTab) {
      case 'daily':
        return format(selectedDate, 'MMMM dd, yyyy');
      case 'weekly':
        return `${format(startOfWeek(selectedDate, { weekStartsOn: 1 }), 'MMM dd')} - ${format(
          endOfWeek(selectedDate, { weekStartsOn: 1 }),
          'MMM dd, yyyy'
        )}`;
      case 'monthly':
        return format(selectedDate, 'MMMM yyyy');
      default:
        return '';
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
      Alert.alert(t.success, t.allReceiptsCleared);
    } else {
      Alert.alert(t.error, t.printError);
    }

    setShowClearAllModal(false);
  };

  const handlePrintCopy = async (receipt) => {
    const updatedReceipt = { ...receipt, isCopy: true };
    const updatedReceipts = receipts.map(r => 
      r.id === receipt.id ? updatedReceipt : r
    );
    setReceipts(updatedReceipts);

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

  const filteredReceipts = isUnlocked ? getFilteredReceipts() : [];

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t.loading}</Text>
        </View>
      </View>
    );
  }

  // PIN Setup Screen
  if (!hasPin) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🔐 {t.setPin}</Text>
        </View>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.card}>
            <Text style={styles.formTitle}>Create Security PIN</Text>
            <Text style={styles.formSubtitle}>
              Protect your receipt history with a 4-digit PIN
            </Text>
            
            <Text style={styles.label}>PIN (4 digits)</Text>
            <TextInput
              style={styles.input}
              placeholder="••••"
              value={setupPin}
              onChangeText={setSetupPin}
              keyboardType="numeric"
              maxLength={4}
              secureTextEntry
              placeholderTextColor={COLORS.textLight}
            />
            
            <Text style={styles.label}>{t.securityQuestion}</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., What is your mother's name?"
              value={securityQuestion}
              onChangeText={setSecurityQuestion}
              placeholderTextColor={COLORS.textLight}
            />
            
            <Text style={styles.label}>{t.securityAnswer}</Text>
            <TextInput
              style={styles.input}
              placeholder="Your answer"
              value={securityAnswerInput}
              onChangeText={setSecurityAnswerInput}
              placeholderTextColor={COLORS.textLight}
            />

            <Text style={styles.label}>{t.securityQuestion2}</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., What is your pet's name?"
              value={securityQuestion2}
              onChangeText={setSecurityQuestion2}
              placeholderTextColor={COLORS.textLight}
            />
            
            <Text style={styles.label}>{t.securityAnswer2}</Text>
            <TextInput
              style={styles.input}
              placeholder="Your answer"
              value={securityAnswerInput2}
              onChangeText={setSecurityAnswerInput2}
              placeholderTextColor={COLORS.textLight}
            />

            <TouchableOpacity style={styles.primaryButton} onPress={handleSetPin}>
              <Text style={styles.buttonText}>{t.setPin}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Unlock Screen
  if (!isUnlocked) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🔐 {t.history}</Text>
        </View>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.lockCard}>
            <Text style={styles.lockIcon}>🔒</Text>
            <Text style={styles.lockTitle}>{t.ownerAccess}</Text>
            <Text style={styles.lockSubtitle}>Enter your PIN to view history</Text>
            
            <TextInput
              style={styles.pinInput}
              placeholder="••••"
              value={unlockPin}
              onChangeText={setUnlockPin}
              keyboardType="numeric"
              maxLength={4}
              secureTextEntry
              placeholderTextColor={COLORS.textLight}
            />

            <TouchableOpacity style={styles.primaryButton} onPress={handleUnlock}>
              <Text style={styles.buttonText}>{t.unlock}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.forgotButton}
              onPress={() => setShowResetForm(!showResetForm)}
            >
              <Text style={styles.forgotButtonText}>
                {showResetForm ? '✕ Cancel' : '🔑 ' + t.forgotPin}
              </Text>
            </TouchableOpacity>

            {showResetForm && (
              <View style={styles.resetForm}>
                <Text style={styles.resetTitle}>{t.resetPin}</Text>
                
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
                  placeholder="••••"
                  value={resetNewPin}
                  onChangeText={setResetNewPin}
                  keyboardType="numeric"
                  maxLength={4}
                  secureTextEntry
                  placeholderTextColor={COLORS.textLight}
                />

                <TouchableOpacity style={styles.primaryButton} onPress={handleResetPin}>
                  <Text style={styles.buttonText}>{t.resetPin}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    );
  }

  // History View
  return (
    <View style={styles.container}>
      {/* Tab Header */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'daily' && styles.tabActive]}
          onPress={() => {
            setActiveTab('daily');
            setSelectedDate(new Date());
          }}
        >
          <Text style={[styles.tabText, activeTab === 'daily' && styles.tabTextActive]}>
            {t.daily}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'weekly' && styles.tabActive]}
          onPress={() => {
            setActiveTab('weekly');
            setSelectedDate(new Date());
          }}
        >
          <Text style={[styles.tabText, activeTab === 'weekly' && styles.tabTextActive]}>
            {t.weekly}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'monthly' && styles.tabActive]}
          onPress={() => {
            setActiveTab('monthly');
            setSelectedDate(new Date());
          }}
        >
          <Text style={[styles.tabText, activeTab === 'monthly' && styles.tabTextActive]}>
            {t.monthly}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView>
        {/* Unpaid toggle */}
        <View style={{ padding: 16, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
          <TouchableOpacity
            style={{ alignSelf: 'flex-end', backgroundColor: COLORS.primary + '15', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 }}
            onPress={() => setShowUnpaidOnly(!showUnpaidOnly)}
          >
            <Text style={{ color: COLORS.primary, fontWeight: '600' }}>{showUnpaidOnly ? (t.showAll || 'Show All') : (t.showUnpaid || 'Show Unpaid')}</Text>
          </TouchableOpacity>
        </View>

        {showUnpaidOnly && (
          <View style={{ minHeight: 200 }}>
            {/* Inline unpaid list */}
            <UnpaidReceiptsList 
              receipts={receipts} 
              setReceipts={setReceipts} 
              business={business} 
              translations={t} 
            />
          </View>
        )}

        {/* Date Navigation */}
        <View style={styles.dateNav}>
          <TouchableOpacity style={styles.navButton} onPress={handlePrevious}>
            <Text style={styles.navButtonText}>←</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.dateDisplay} onPress={handleToday}>
            <Text style={styles.dateText}>{formatDateRange()}</Text>
            <Text style={styles.todayHint}>Tap for today</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navButton} onPress={handleNext}>
            <Text style={styles.navButtonText}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Hourly Filter */}
        {activeTab === 'daily' && (
          <View style={styles.hourlyFilterContainer}>
            <TouchableOpacity
              style={styles.hourlyFilterToggle}
              onPress={() => setShowHourlyFilter(!showHourlyFilter)}
            >
              <Text style={styles.hourlyFilterToggleText}>
                ⏰ {showHourlyFilter ? 'Hide' : 'Filter by'} Hour Range
              </Text>
            </TouchableOpacity>

            {showHourlyFilter && (
              <View style={styles.hourlyFilterForm}>
                <View style={styles.hourInputRow}>
                  <View style={styles.hourInputGroup}>
                    <Text style={styles.hourLabel}>From Hour</Text>
                    <TextInput
                      style={styles.hourInput}
                      placeholder="0-23"
                      value={startHour}
                      onChangeText={setStartHour}
                      keyboardType="number-pad"
                      maxLength={2}
                      placeholderTextColor={COLORS.textLight}
                    />
                  </View>

                  <Text style={styles.hourSeparator}>→</Text>

                  <View style={styles.hourInputGroup}>
                    <Text style={styles.hourLabel}>To Hour</Text>
                    <TextInput
                      style={styles.hourInput}
                      placeholder="0-23"
                      value={endHour}
                      onChangeText={setEndHour}
                      keyboardType="number-pad"
                      maxLength={2}
                      placeholderTextColor={COLORS.textLight}
                    />
                  </View>

                  <TouchableOpacity
                    style={styles.clearHourButton}
                    onPress={() => {
                      setStartHour('');
                      setEndHour('');
                    }}
                  >
                    <Text style={styles.clearHourButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
                {(startHour !== '' || endHour !== '') && (
                  <Text style={styles.hourHint}>
                    Showing receipts between {startHour || '0'}:00 - {endHour || '23'}:00
                  </Text>
                )}
              </View>
            )}
          </View>
        )}

        {/* Clear All Button */}
        {filteredReceipts.length > 0 && (
          <View style={styles.clearAllContainer}>
            <TouchableOpacity
              style={styles.clearAllButton}
              onPress={handleClearAll}
            >
              <Text style={styles.clearAllButtonText}>🗑️ {t.clearAll}</Text>
            </TouchableOpacity>
          </View>
        )}

        {!showUnpaidOnly && (filteredReceipts.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📜</Text>
            <Text style={styles.emptyText}>{t.noReceiptsFound}</Text>
            <Text style={styles.emptySubtext}>No receipts in selected period</Text>
          </View>
        ) : (
          filteredReceipts.map((receipt) => (
            <View key={receipt.id} style={styles.receiptCard}>
              <View style={styles.receiptHeader}>
                <View>
                  <Text style={styles.receiptId}>
                    #{receipt.id.slice(-8)}
                  </Text>
                  <Text style={styles.receiptDate}>
                    {format(new Date(receipt.date), 'MMM dd, yyyy • HH:mm')}
                  </Text>
                </View>
                <View style={styles.receiptHeaderRight}>
                  <Text style={styles.receiptTotal}>{receipt.total}</Text>
                  {receipt.isCopy && (
                    <View style={styles.copyBadge}>
                      <Text style={styles.copyBadgeText}>{t.copy}</Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.receiptItems}>
                {receipt.lines.map((line) => (
                  <View key={line.id} style={styles.receiptLineItem}>
                    <Text style={styles.lineItemName}>{line.name}</Text>
                    <Text style={styles.lineItemTotal}>
                      {line.qty} × {line.price} = {line.total}
                    </Text>
                  </View>
                ))}
              </View>

              <View style={styles.receiptActions}>
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
                  <Text style={styles.deleteButtonText}>🗑️ {t.delete}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        ))}
      </ScrollView>

      {/* Delete Receipt Modal */}
      <Modal visible={showDeleteModal} transparent animationType="fade">
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
      <Modal visible={showClearAllModal} transparent animationType="fade">
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  filterButton: {
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterButtonText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    backgroundColor: COLORS.surface,
    padding: 24,
    borderRadius: 16,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 14,
    color: COLORS.textLight,
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
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: '600',
  },
  lockCard: {
    backgroundColor: COLORS.surface,
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  lockIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  lockTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  lockSubtitle: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 32,
    textAlign: 'center',
  },
  pinInput: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: 12,
    padding: 16,
    fontSize: 24,
    letterSpacing: 10,
    textAlign: 'center',
    marginBottom: 16,
    width: '100%',
    backgroundColor: COLORS.surface,
    color: COLORS.text,
  },
  forgotButton: {
    marginTop: 16,
    padding: 12,
  },
  forgotButtonText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  resetForm: {
    width: '100%',
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  resetTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  filterCard: {
    backgroundColor: COLORS.surface,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfColumn: {
    flex: 1,
  },
  secondaryButton: {
    backgroundColor: COLORS.background,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  secondaryButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  emptyCard: {
    backgroundColor: COLORS.surface,
    padding: 40,
    marginHorizontal: 16,
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
  receiptCard: {
    backgroundColor: COLORS.surface,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
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
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  receiptDate: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  receiptHeaderRight: {
    alignItems: 'flex-end',
  },
  receiptTotal: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  copyBadge: {
    backgroundColor: COLORS.warning + '20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  copyBadgeText: {
    color: COLORS.warning,
    fontSize: 10,
    fontWeight: 'bold',
  },
  receiptItems: {
    marginBottom: 12,
  },
  receiptLineItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  lineItemName: {
    fontSize: 14,
    color: COLORS.text,
    flex: 1,
  },
  lineItemTotal: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  printCopyButton: {
    flex: 1,
    backgroundColor: COLORS.primary + '15',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  printCopyButtonText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textLight,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textLight,
  },
  tabTextActive: {
    color: COLORS.primary,
  },
  dateNav: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.surface,
    marginBottom: 16,
  },
  navButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonText: {
    fontSize: 24,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  dateDisplay: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 12,
  },
  dateText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 2,
  },
  todayHint: {
    fontSize: 11,
    color: COLORS.textLight,
  },
  hourlyFilterContainer: {
    backgroundColor: COLORS.surface,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  hourlyFilterToggle: {
    paddingVertical: 8,
  },
  hourlyFilterToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    textAlign: 'center',
  },
  hourlyFilterForm: {
    marginTop: 12,
  },
  hourInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  hourInputGroup: {
    flex: 1,
  },
  hourLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    marginBottom: 6,
  },
  hourInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    color: COLORS.text,
  },
  hourSeparator: {
    fontSize: 20,
    color: COLORS.textLight,
    marginBottom: 12,
  },
  clearHourButton: {
    backgroundColor: COLORS.error + '15',
    width: 40,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 0,
  },
  clearHourButtonText: {
    fontSize: 18,
    color: COLORS.error,
    fontWeight: 'bold',
  },
  hourHint: {
    fontSize: 12,
    color: COLORS.primary,
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '600',
  },
  clearAllContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  clearAllButton: {
    backgroundColor: COLORS.error,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  clearAllButtonText: {
    color: COLORS.surface,
    fontSize: 14,
    fontWeight: '600',
  },
  receiptActions: {
    flexDirection: 'row',
    gap: 8,
  },
  deleteButton: {
    flex: 1,
    backgroundColor: COLORS.error + '15',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: COLORS.error,
    fontSize: 14,
    fontWeight: '600',
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
  confirmationText: {
    fontSize: 16,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  deleteConfirmButton: {
    backgroundColor: COLORS.error,
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
  // Unpaid receipts styles
  unpaidContainer: {
    backgroundColor: COLORS.background,
  },
  unpaidFilters: {
    padding: 16,
  },
  unpaidInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 12,
  },
  unpaidRow: {
    flexDirection: 'row',
    gap: 12,
  },
  unpaidEmptyCard: {
    backgroundColor: COLORS.surface,
    padding: 32,
    margin: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  unpaidEmptyIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  unpaidEmptyText: {
    fontSize: 16,
    color: COLORS.textLight,
  },
  unpaidCard: {
    backgroundColor: COLORS.surface,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
  },
  unpaidHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  unpaidRId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  unpaidRDate: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  unpaidAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.error,
  },
  unpaidCustomer: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  unpaidPayRow: {
    flexDirection: 'row',
    gap: 8,
  },
  unpaidPayBtn: {
    backgroundColor: COLORS.success,
    borderRadius: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unpaidPayText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
