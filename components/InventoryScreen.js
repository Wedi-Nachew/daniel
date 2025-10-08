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

export default function InventoryScreen({ inventory, setInventory, translations }) {
  const t = translations;
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [itemName, setItemName] = useState('');
  const [currentStock, setCurrentStock] = useState('');
  const [minimumStock, setMinimumStock] = useState('');
  const [unitPrice, setUnitPrice] = useState('');

  const handleAdd = () => {
    if (!itemName.trim() || !unitPrice) {
      Alert.alert(t.error, t.allFieldsRequired);
      return;
    }

    const price = parseFloat(unitPrice);

    if (price <= 0) {
      Alert.alert(t.error, t.invalidValues);
      return;
    }

    if (editingId) {
      // Update existing item
      const updated = inventory.map(item =>
        item.id === editingId
          ? { ...item, name: itemName.trim(), unitPrice: price }
          : item
      );
      setInventory(updated);
    } else {
      // Add new item
      const newItem = {
        id: Date.now().toString(),
        name: itemName.trim(),
        unitPrice: price,
      };
      setInventory([...inventory, newItem]);
    }

    // Reset form
    setItemName('');
    setUnitPrice('');
    setEditingId(null);
    setShowAddForm(false);
  };

  const handleEdit = (item) => {
    setItemName(item.name);
    setUnitPrice(item.unitPrice.toString());
    setEditingId(item.id);
    setShowAddForm(true);
  };

  const handleDelete = (id) => {
    Alert.alert(
      t.delete,
      t.deleteItemConfirmation,
      [
        { text: t.cancel, style: 'cancel' },
        {
          text: t.delete,
          style: 'destructive',
          onPress: () => setInventory(inventory.filter(item => item.id !== id)),
        },
      ]
    );
  };


  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📦 {t.inventory}</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            setShowAddForm(!showAddForm);
            if (!showAddForm) {
              setItemName('');
              setCurrentStock('');
              setMinimumStock('');
              setUnitPrice('');
              setEditingId(null);
            }
          }}
        >
          <Text style={styles.addButtonText}>
            {showAddForm ? '✕' : '+'} {showAddForm ? t.close : t.addInventoryItem}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView>
        {/* Add/Edit Form */}
        {showAddForm && (
          <View style={styles.modernCard}>
            <Text style={styles.modernFormTitle}>
              {editingId ? t.edit + ' Item' : 'Add New Item'}
            </Text>

            <Text style={styles.modernLabel}>{t.itemName}</Text>
            <TextInput
              style={styles.modernInput}
              placeholder=""
              value={itemName}
              onChangeText={setItemName}
              placeholderTextColor={COLORS.textLight}
            />

            <Text style={styles.modernLabel}>{t.unitPrice}</Text>
            <TextInput
              style={styles.modernInput}
              placeholder=""
              value={unitPrice}
              onChangeText={setUnitPrice}
              keyboardType="decimal-pad"
              placeholderTextColor={COLORS.textLight}
            />

            <TouchableOpacity style={styles.modernSaveButton} onPress={handleAdd}>
              <Text style={styles.modernSaveButtonText}>
                + {editingId ? t.save : 'Add to Inventory'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Inventory List */}
        {inventory.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyText}>{t.inventoryItems}</Text>
            <Text style={styles.emptySubtext}>Add items to track your inventory</Text>
          </View>
        ) : (
          inventory.map((item) => (
            <View key={item.id} style={styles.simpleItemCard}>
              <View style={styles.simpleItemContent}>
                <Text style={styles.simpleItemName}>{item.name}</Text>
                <Text style={styles.simpleItemPrice}>{item.unitPrice.toFixed(0)} per kg</Text>
              </View>
              <TouchableOpacity
                style={styles.simpleDeleteButton}
                onPress={() => handleDelete(item.id)}
              >
                <Text style={styles.simpleDeleteIcon}>🗑️</Text>
              </TouchableOpacity>
            </View>
          ))
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
  addButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: COLORS.surface,
    fontSize: 14,
    fontWeight: '600',
  },
  modernCard: {
    backgroundColor: COLORS.surface,
    padding: 24,
    margin: 16,
    borderRadius: 16,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  modernFormTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 20,
  },
  modernLabel: {
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
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfColumn: {
    flex: 1,
  },
  modernSaveButton: {
    backgroundColor: '#4F46E5',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  modernSaveButtonText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: '600',
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
  simpleItemCard: {
    backgroundColor: COLORS.surface,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  simpleItemContent: {
    flex: 1,
  },
  simpleItemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  simpleItemPrice: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  simpleDeleteButton: {
    padding: 8,
  },
  simpleDeleteIcon: {
    fontSize: 20,
    color: COLORS.error,
  },
});
