import React, { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { Button, Card, Header, Input, LoadingState, Notice, Screen } from '../../components';
import { COLORS, SPACING, TYPOGRAPHY } from '../../theme';
import { createExpense, fetchExpenses } from '../../api/seller';
import { apiError, formatDate, formatInr, httpStatus } from '../../lib/format';
import type { MainStackScreenProps } from '../../navigation/types';

export default function ExpensesScreen({ navigation }: MainStackScreenProps<'Expenses'>) {
  const [rows, setRows] = useState<{ id: number; title: string; amount: number; category: string; spent_on?: string }[]>([]);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      setRows(await fetchExpenses());
    } catch (err) {
      const status = httpStatus(err);
      if (status === 403) {
        setError(apiError(err, 'Expense tracking is not on the current plan.'));
      } else if (status === 404) {
        setError('Expense tracking is not available on this server yet.');
      } else {
        setError(apiError(err, 'Could not load expenses. Check the connection and try again.'));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const add = async () => {
    const name = title.trim();
    const value = Number(amount);
    if (!name || !Number.isFinite(value) || value <= 0) {
      Alert.alert('Missing details', 'Enter what you paid for and a positive amount.');
      return;
    }
    setSaving(true);
    try {
      await createExpense({ title: name, amount: value, category: 'general' });
      setTitle('');
      setAmount('');
      await load();
    } catch (err) {
      Alert.alert('Could not save', apiError(err, 'Try again.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen scroll keyboardAvoiding edges={['bottom']} gradient={false} statusBarStyle="light-content">
      <Header tone="brand" title="Expenses" subtitle="Shop costs used in profit" onBack={() => navigation.goBack()} />
      <View style={styles.content}>
        {loading ? <LoadingState message="Loading expenses…" /> : null}
        {error ? <Notice tone="warning" title="Could not load expenses" message={error} /> : null}
        <Input label="What did you pay for?" value={title} onChangeText={setTitle} placeholder="Rent, petrol…" />
        <Input label="Amount" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" prefix="₹" />
        <Button
          label="Add expense"
          onPress={add}
          loading={saving}
          disabled={!title.trim() || !amount || saving}
        />
        <Card>
          {rows.length === 0 ? (
            <Text style={styles.meta}>No expenses yet. Add rent, petrol, or other shop costs here.</Text>
          ) : rows.map((row) => (
            <View key={row.id} style={styles.rowWrap}>
              <Text style={styles.row}>{row.title} · {formatInr(row.amount)}</Text>
              <Text style={styles.meta}>{row.category}{row.spent_on ? ` · ${formatDate(row.spent_on)}` : ''}</Text>
            </View>
          ))}
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: SPACING.lg, gap: SPACING.sm },
  meta: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary },
  rowWrap: { marginBottom: SPACING.sm },
  row: { ...TYPOGRAPHY.body, color: COLORS.textPrimary },
});
