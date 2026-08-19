import React, { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { Button, Card, Header, Input, LoadingState, Screen } from '../../components';
import { COLORS, SPACING, TYPOGRAPHY } from '../../theme';
import { createExpense, fetchExpenses } from '../../api/seller';
import { apiError, formatInr } from '../../lib/format';
import type { MainStackScreenProps } from '../../navigation/types';

export default function ExpensesScreen({ navigation }: MainStackScreenProps<'Expenses'>) {
  const [rows, setRows] = useState<{ id: number; title: string; amount: number; category: string }[]>([]);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      setRows(await fetchExpenses());
    } catch (err) {
      setError(apiError(err, 'Expenses are not on the current plan.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const add = async () => {
    try {
      await createExpense({ title, amount: Number(amount), category: 'general' });
      setTitle('');
      setAmount('');
      await load();
    } catch (err) {
      Alert.alert('Could not save', apiError(err, 'Try again.'));
    }
  };

  return (
    <Screen scroll keyboardAvoiding edges={['bottom']} gradient={false} statusBarStyle="light-content">
      <Header tone="brand" title="Expenses" subtitle="Shop costs used in profit" onBack={() => navigation.goBack()} />
      <View style={styles.content}>
        {loading ? <LoadingState message="Loading…" /> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Input label="What did you pay for?" value={title} onChangeText={setTitle} placeholder="Rent, petrol…" />
        <Input label="Amount" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" prefix="₹" />
        <Button label="Add expense" onPress={add} disabled={!title.trim() || !amount} />
        <Card>
          {rows.length === 0 ? <Text style={styles.meta}>No expenses yet.</Text> : rows.map((row) => (
            <Text key={row.id} style={styles.row}>{row.title} · {formatInr(row.amount)}</Text>
          ))}
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: SPACING.lg, gap: SPACING.sm },
  error: { ...TYPOGRAPHY.body, color: COLORS.error },
  meta: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary },
  row: { ...TYPOGRAPHY.body, color: COLORS.textPrimary, marginBottom: SPACING.sm },
});
