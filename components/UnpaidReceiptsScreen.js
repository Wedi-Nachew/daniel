import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { COLORS } from '../utils/constants';
import { format } from 'date-fns';
import { saveReceipts } from '../utils/storage';
import { printReceipt } from '../utils/print';

export default function UnpaidReceiptsScreen({ receipts, setReceipts, business, translations }) {
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
    await saveReceipts(newReceipts);
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
    <ScrollView style={styles.container}>
      <View style={styles.filters}>
        <TextInput
          style={styles.input}
          placeholder={t.searchUnpaidPlaceholder || 'Search by customer or receipt id'}
          value={query}
          onChangeText={setQuery}
          placeholderTextColor={COLORS.textLight}
        />
        <View style={styles.row}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder={t.minUnpaid || 'Min unpaid'}
            value={minAmt}
            onChangeText={setMinAmt}
            keyboardType="decimal-pad"
            placeholderTextColor={COLORS.textLight}
          />
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder={t.maxUnpaid || 'Max unpaid'}
            value={maxAmt}
            onChangeText={setMaxAmt}
            keyboardType="decimal-pad"
            placeholderTextColor={COLORS.textLight}
          />
        </View>
      </View>

      {unpaid.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>💳</Text>
          <Text style={styles.emptyText}>{t.noUnpaidReceipts || 'No unpaid receipts'}</Text>
        </View>
      ) : (
        unpaid.map(r => (
          <View key={r.id} style={styles.card}>
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.rId}>#{r.id.slice(-8)}</Text>
                <Text style={styles.rDate}>{format(new Date(r.date), 'MMM dd, yyyy • HH:mm')}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.unpaid}>{r.unpaid_amount?.toFixed ? r.unpaid_amount.toFixed(2) : r.unpaid_amount}</Text>
                {!!r.customer_name && <Text style={styles.customer}>{r.customer_name}</Text>}
              </View>
            </View>

            <View style={styles.payRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder={t.paymentAmount || 'Payment amount'}
                value={selected?.id === r.id ? payment : ''}
                onChangeText={setPayment}
                keyboardType="decimal-pad"
                placeholderTextColor={COLORS.textLight}
                onFocus={() => setSelected(r)}
              />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder={t.payerNameOptional || 'Payer name (optional)'}
                value={selected?.id === r.id ? payer : ''}
                onChangeText={setPayer}
                placeholderTextColor={COLORS.textLight}
                onFocus={() => setSelected(r)}
              />
              <TouchableOpacity style={styles.payBtn} onPress={() => settlePayment(r)}>
                <Text style={styles.payText}>✓</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  filters: { padding: 16 },
  input: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 12,
  },
  row: { flexDirection: 'row', gap: 12 },
  emptyCard: { backgroundColor: COLORS.surface, padding: 32, margin: 16, borderRadius: 12, alignItems: 'center' },
  emptyIcon: { fontSize: 48, marginBottom: 8 },
  emptyText: { fontSize: 16, color: COLORS.textLight },
  card: { backgroundColor: COLORS.surface, padding: 16, marginHorizontal: 16, marginBottom: 12, borderRadius: 12 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  rId: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  rDate: { fontSize: 12, color: COLORS.textLight },
  unpaid: { fontSize: 18, fontWeight: 'bold', color: COLORS.error },
  customer: { fontSize: 12, color: COLORS.textLight },
  payRow: { flexDirection: 'row', gap: 8 },
  payBtn: { backgroundColor: COLORS.success, borderRadius: 8, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  payText: { color: COLORS.surface, fontSize: 16, fontWeight: 'bold' },
});


