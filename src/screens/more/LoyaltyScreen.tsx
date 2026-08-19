import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { Button, Card, Header, Input, Screen } from '../../components';
import { COLORS, SPACING, TYPOGRAPHY } from '../../theme';
import { adjustLoyalty, lookupLoyalty } from '../../api/seller';
import { apiError } from '../../lib/format';
import type { MainStackScreenProps } from '../../navigation/types';

export default function LoyaltyScreen({ navigation }: MainStackScreenProps<'Loyalty'>) {
  const [phone, setPhone] = useState('');
  const [balance, setBalance] = useState<number | null>(null);
  const [error, setError] = useState('');

  const search = async () => {
    try {
      const data = await lookupLoyalty(phone);
      setBalance(data.balance);
      setError('');
    } catch (err) {
      setBalance(null);
      setError(apiError(err, 'Loyalty is not on the current plan.'));
    }
  };

  const give = async () => {
    try {
      const data = await adjustLoyalty({ phone, points: 1, note: 'Manual' });
      setBalance(data.balance);
    } catch (err) {
      Alert.alert('Could not adjust', apiError(err, 'Try again.'));
    }
  };

  return (
    <Screen scroll keyboardAvoiding edges={['bottom']} gradient={false} statusBarStyle="light-content">
      <Header tone="brand" title="Loyalty" subtitle="Points on the customer phone" onBack={() => navigation.goBack()} />
      <View style={styles.content}>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Input label="Customer phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <Button label="Look up" onPress={search} disabled={phone.replace(/\D/g, '').length < 10} />
        {balance != null ? (
          <Card>
            <Text style={styles.balance}>{balance} points</Text>
            <Button label="Add 1 point" variant="secondary" onPress={give} />
          </Card>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: SPACING.lg, gap: SPACING.sm },
  error: { ...TYPOGRAPHY.body, color: COLORS.error },
  balance: { ...TYPOGRAPHY.heading, color: COLORS.primary, marginBottom: SPACING.md },
});
