import React, { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { Button, Card, Header, Input, LoadingState, Screen } from '../../components';
import { COLORS, SPACING, TYPOGRAPHY } from '../../theme';
import { createBranch, fetchBranches } from '../../api/seller';
import { apiError } from '../../lib/format';
import type { MainStackScreenProps } from '../../navigation/types';

export default function LocationsScreen({ navigation }: MainStackScreenProps<'Locations'>) {
  const [rows, setRows] = useState<{ id: number; name: string; address?: string; is_primary: boolean }[]>([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      setRows(await fetchBranches());
    } catch (err) {
      setError(apiError(err, 'Extra locations are not on the current plan.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const add = async () => {
    try {
      await createBranch({ name });
      setName('');
      await load();
    } catch (err) {
      Alert.alert('Could not add', apiError(err, 'Your plan may only allow the main shop.'));
    }
  };

  return (
    <Screen scroll keyboardAvoiding edges={['bottom']} gradient={false} statusBarStyle="light-content">
      <Header tone="brand" title="Locations" subtitle="Extra counters on this shop" onBack={() => navigation.goBack()} />
      <View style={styles.content}>
        {loading ? <LoadingState message="Loading…" /> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Input label="New location name" value={name} onChangeText={setName} placeholder="Second counter" />
        <Button label="Add location" onPress={add} disabled={!name.trim()} />
        <Card>
          {rows.map((row) => (
            <Text key={row.id} style={styles.row}>{row.name}{row.is_primary ? ' · Main' : ''}</Text>
          ))}
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: SPACING.lg, gap: SPACING.sm },
  error: { ...TYPOGRAPHY.body, color: COLORS.error },
  row: { ...TYPOGRAPHY.body, color: COLORS.textPrimary, marginBottom: SPACING.sm },
});
