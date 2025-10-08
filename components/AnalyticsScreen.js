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
import { startOfDay, endOfDay, parseISO } from 'date-fns';

export default function AnalyticsScreen({ receipts, translations }) {
  const t = translations;
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [results, setResults] = useState(null);

  const calculateAnalytics = () => {
    if (!fromDate || !toDate) {
      Alert.alert(t.error, t.allFieldsRequired);
      return;
    }

    try {
      const from = startOfDay(parseISO(fromDate));
      const to = endOfDay(parseISO(toDate));

      if (from > to) {
        Alert.alert(t.error, t.invalidDateRange);
        return;
      }

      // Filter receipts in date range
      const filteredReceipts = receipts.filter(r => {
        if (r.isCopy) return false;
        const receiptDate = new Date(r.date);
        return receiptDate >= from && receiptDate <= to;
      });

      // Calculate totals
      const totalReceipts = filteredReceipts.length;
      const totalRevenue = filteredReceipts.reduce(
        (sum, r) => sum + parseFloat(r.total),
        0
      );

      // Aggregate by service
      const serviceMap = {};
      filteredReceipts.forEach(receipt => {
        receipt.lines.forEach(line => {
          if (!serviceMap[line.name]) {
            serviceMap[line.name] = {
              name: line.name,
              revenue: 0,
              quantity: 0,
            };
          }
          serviceMap[line.name].revenue += line.total;
          serviceMap[line.name].quantity += line.qty;
        });
      });

      // Sort by revenue
      const topServices = Object.values(serviceMap).sort(
        (a, b) => b.revenue - a.revenue
      );

      setResults({
        totalReceipts,
        totalRevenue,
        topServices,
      });
    } catch (error) {
      Alert.alert(t.error, t.invalidDateRange);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Date Range Selector */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📅 {t.selectDateRange}</Text>
        
        <Text style={styles.label}>{t.from}</Text>
        <TextInput
          style={styles.input}
          placeholder={t.dateFormat}
          value={fromDate}
          onChangeText={setFromDate}
          placeholderTextColor={COLORS.textLight}
        />
        
        <Text style={styles.label}>{t.to}</Text>
        <TextInput
          style={styles.input}
          placeholder={t.dateFormat}
          value={toDate}
          onChangeText={setToDate}
          placeholderTextColor={COLORS.textLight}
        />

        <TouchableOpacity style={styles.calculateButton} onPress={calculateAnalytics}>
          <Text style={styles.buttonText}>📊 {t.calculate}</Text>
        </TouchableOpacity>
      </View>

      {/* Results */}
      {results && (
        <>
          {/* Stats Cards */}
          <View style={styles.statsRow}>
            <View style={[styles.statCard, styles.purpleGradient]}>
              <Text style={styles.statEmoji}>📝</Text>
              <Text style={styles.statValue}>{results.totalReceipts}</Text>
              <Text style={styles.statLabel}>{t.totalReceipts}</Text>
            </View>
            <View style={[styles.statCard, styles.pinkGradient]}>
              <Text style={styles.statEmoji}>💰</Text>
              <Text style={styles.statValue}>{results.totalRevenue.toFixed(2)}</Text>
              <Text style={styles.statLabel}>{t.totalRevenue}</Text>
            </View>
          </View>

          {/* Top Services */}
          {results.topServices.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>🏆 {t.topServices}</Text>
              
              {results.topServices.map((service, index) => (
                <View key={service.name} style={styles.serviceItem}>
                  <View style={styles.serviceLeft}>
                    <Text style={styles.serviceName}>
                      {index + 1}. {service.name}
                    </Text>
                    <Text style={styles.serviceDetails}>
                      {service.quantity.toFixed(2)} kg
                    </Text>
                  </View>
                  <Text style={styles.serviceRevenue}>
                    {service.revenue.toFixed(2)}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {results.totalReceipts === 0 && (
            <View style={styles.card}>
              <Text style={styles.emptyText}>{t.noReceiptsFound}</Text>
            </View>
          )}
        </>
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
  calculateButton: {
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
  serviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  serviceLeft: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  serviceDetails: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  serviceRevenue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: COLORS.textLight,
    paddingVertical: 20,
  },
});
