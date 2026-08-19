import React, { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { Button, Card, Header, Input, LoadingState, Screen } from '../../components';
import { COLORS, FONT_SCALE, SPACING, TYPOGRAPHY } from '../../theme';
import { createStaff, fetchStaff, updateStaff, type StoreStaffMember } from '../../api/seller';
import { apiError } from '../../lib/format';
import type { MainStackScreenProps } from '../../navigation/types';

export default function StaffScreen({ navigation }: MainStackScreenProps<'Staff'>) {
  const [staff, setStaff] = useState<StoreStaffMember[]>([]);
  const [used, setUsed] = useState(0);
  const [maxStaff, setMaxStaff] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setError('');
    try {
      const data = await fetchStaff();
      setStaff(data.staff || []);
      setUsed(data.staff_used || 0);
      setMaxStaff(data.max_staff ?? null);
    } catch (err) {
      setError(apiError(err, 'Could not load staff.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const add = async () => {
    setSaving(true);
    try {
      await createStaff({ name, phone, password, role: 'cashier' });
      setName('');
      setPhone('');
      setPassword('');
      await load();
    } catch (err) {
      Alert.alert('Could not add staff', apiError(err, 'Try again.'));
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (member: StoreStaffMember) => {
    if (member.is_store_owner) return;
    try {
      await updateStaff(member.id, { is_active: !member.is_active });
      await load();
    } catch (err) {
      Alert.alert('Update failed', apiError(err, 'Try again.'));
    }
  };

  return (
    <Screen scroll edges={['bottom']} gradient={false} statusBarStyle="light-content">
      <Header tone="brand" title="Staff" subtitle="Add logins for your shop" onBack={() => navigation.goBack()} />
      <View style={styles.content}>
        {loading ? <LoadingState message="Loading staff…" /> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Text style={styles.meta}>
          {used} of {maxStaff ?? 'unlimited'} additional staff used
        </Text>
        <Card>
          <Text style={styles.kicker}>Add cashier</Text>
          <Input label="Name" value={name} onChangeText={setName} />
          <Input label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <Input label="Password" value={password} onChangeText={setPassword} secure />
          <Button label="Create login" onPress={add} loading={saving} disabled={!name || !phone || !password} />
        </Card>
        {staff.map((member) => (
          <Card key={String(member.id)}>
            <Text style={styles.name} maxFontSizeMultiplier={FONT_SCALE.body}>{member.name}</Text>
            <Text style={styles.meta}>{member.phone} · {member.role}{member.is_active ? '' : ' · inactive'}</Text>
            {member.is_store_owner ? (
              <Text style={styles.meta}>Store owner</Text>
            ) : (
              <Button
                label={member.is_active ? 'Deactivate' : 'Activate'}
                variant="secondary"
                onPress={() => toggle(member)}
              />
            )}
          </Card>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: SPACING.md, gap: SPACING.md },
  kicker: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, marginBottom: SPACING.sm },
  name: { ...TYPOGRAPHY.body, fontWeight: '600', color: COLORS.textPrimary },
  meta: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary },
  error: { ...TYPOGRAPHY.body, color: COLORS.error },
});
