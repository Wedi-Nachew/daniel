import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
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
  eachHourOfInterval,
  eachDayOfInterval,
  addDays,
  addWeeks,
  addMonths,
  subDays,
  subWeeks,
  subMonths,
} from 'date-fns';

export default function AnalyticsScreenNew({ receipts, translations }) {
  const t = translations;
  const [activeTab, setActiveTab] = useState('daily'); // daily, weekly, monthly
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showHourlyFilter, setShowHourlyFilter] = useState(false);
  const [startHour, setStartHour] = useState('');
  const [endHour, setEndHour] = useState('');

  const getFilteredReceipts = () => {
    let start, end;

    switch (activeTab) {
      case 'daily':
        start = startOfDay(selectedDate);
        end = endOfDay(selectedDate);
        break;
      case 'weekly':
        start = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Monday
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
      if (r.isCopy) return false;
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
            // Handle overnight ranges like 22:00 to 02:00
            return hour >= startH || hour <= endH;
          }
        });
      }
    }

    return filtered;
  };

  const calculateStats = () => {
    const filtered = getFilteredReceipts();
    const totalReceipts = filtered.length;
    const totalRevenue = filtered.reduce((sum, r) => sum + parseFloat(r.total), 0);

    // Service aggregation
    const serviceMap = {};
    filtered.forEach(receipt => {
      receipt.lines.forEach(line => {
        if (!serviceMap[line.name]) {
          serviceMap[line.name] = { name: line.name, revenue: 0, quantity: 0 };
        }
        serviceMap[line.name].revenue += line.total;
        serviceMap[line.name].quantity += line.qty;
      });
    });

    const topServices = Object.values(serviceMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    return { totalReceipts, totalRevenue, topServices, filtered };
  };

  const getHourlyBreakdown = () => {
    const filtered = getFilteredReceipts();
    const start = startOfDay(selectedDate);
    const end = endOfDay(selectedDate);
    const hours = eachHourOfInterval({ start, end });

    return hours.map(hour => {
      const hourEnd = new Date(hour.getTime() + 60 * 60 * 1000);
      const hourReceipts = filtered.filter(r => {
        const receiptDate = new Date(r.date);
        return receiptDate >= hour && receiptDate < hourEnd;
      });

      const revenue = hourReceipts.reduce((sum, r) => sum + parseFloat(r.total), 0);

      return {
        hour: format(hour, 'HH:00'),
        receipts: hourReceipts.length,
        revenue,
      };
    }).filter(h => h.receipts > 0 || h.revenue > 0);
  };

  const getDailyBreakdown = () => {
    const start = activeTab === 'weekly'
      ? startOfWeek(selectedDate, { weekStartsOn: 1 })
      : startOfMonth(selectedDate);
    const end = activeTab === 'weekly'
      ? endOfWeek(selectedDate, { weekStartsOn: 1 })
      : endOfMonth(selectedDate);

    const days = eachDayOfInterval({ start, end });
    const filtered = getFilteredReceipts();

    return days.map(day => {
      const dayStart = startOfDay(day);
      const dayEnd = endOfDay(day);
      const dayReceipts = filtered.filter(r => {
        const receiptDate = new Date(r.date);
        return receiptDate >= dayStart && receiptDate <= dayEnd;
      });

      const revenue = dayReceipts.reduce((sum, r) => sum + parseFloat(r.total), 0);

      return {
        date: format(day, 'MMM dd'),
        receipts: dayReceipts.length,
        revenue,
      };
    });
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

  const stats = calculateStats();
  const breakdown = activeTab === 'daily' ? getHourlyBreakdown() : getDailyBreakdown();

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

        {/* Stats Cards */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: COLORS.primary }]}>
            <Text style={styles.statEmoji}>📝</Text>
            <Text style={styles.statValue}>{stats.totalReceipts}</Text>
            <Text style={styles.statLabel}>{t.receipts}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: COLORS.secondary }]}>
            <Text style={styles.statEmoji}>💰</Text>
            <Text style={styles.statValue}>{stats.totalRevenue.toFixed(2)}</Text>
            <Text style={styles.statLabel}>{t.revenue}</Text>
          </View>
        </View>

        {/* Breakdown Chart */}
        {breakdown.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {activeTab === 'daily' ? '⏰ ' + t.hourlyBreakdown : '📊 Daily Breakdown'}
            </Text>

            {breakdown.map((item, index) => {
              const maxRevenue = Math.max(...breakdown.map(b => b.revenue), 1);
              const percentage = (item.revenue / maxRevenue) * 100;

              return (
                <View key={index} style={styles.breakdownItem}>
                  <View style={styles.breakdownHeader}>
                    <Text style={styles.breakdownLabel}>
                      {activeTab === 'daily' ? item.hour : item.date}
                    </Text>
                    <View style={styles.breakdownStats}>
                      <Text style={styles.breakdownReceipts}>{item.receipts} 📝</Text>
                      <Text style={styles.breakdownRevenue}>{item.revenue.toFixed(2)}</Text>
                    </View>
                  </View>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${percentage}%`,
                          backgroundColor: COLORS.primary,
                        },
                      ]}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Top Services */}
        {stats.topServices.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🏆 {t.topServices}</Text>

            {stats.topServices.map((service, index) => (
              <View key={service.name} style={styles.serviceItem}>
                <View style={styles.serviceRank}>
                  <Text style={styles.rankNumber}>{index + 1}</Text>
                </View>
                <View style={styles.serviceInfo}>
                  <Text style={styles.serviceName}>{service.name}</Text>
                  <Text style={styles.serviceQty}>{service.quantity.toFixed(1)} kg</Text>
                </View>
                <Text style={styles.serviceRevenue}>{service.revenue.toFixed(2)}</Text>
              </View>
            ))}
          </View>
        )}

        {stats.totalReceipts === 0 && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📊</Text>
            <Text style={styles.emptyText}>{t.noReceiptsFound}</Text>
            <Text style={styles.emptySubtext}>No data for selected period</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
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
    opacity: 0.9,
  },
  card: {
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
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  breakdownItem: {
    marginBottom: 16,
  },
  breakdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  breakdownLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  breakdownStats: {
    flexDirection: 'row',
    gap: 12,
  },
  breakdownReceipts: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  breakdownRevenue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  progressBar: {
    height: 8,
    backgroundColor: COLORS.background,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  serviceRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rankNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 2,
  },
  serviceQty: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  serviceRevenue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
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
});
