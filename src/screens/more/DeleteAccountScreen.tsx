import React, { useState } from 'react';
import { Alert, Linking, StyleSheet, Text, View } from 'react-native';

import { Button, Card, Header, Input, Screen } from '../../components';
import { APP_DISPLAY_NAME, PRIVACY_POLICY_URL, SUPPORT_EMAIL } from '../../config/legal';
import { useAuth } from '../../context/AuthContext';
import { useOnlineGuard } from '../../hooks/useOnlineGuard';
import { deleteSellerAccount } from '../../api/seller';
import { apiError } from '../../lib/format';
import { COLORS, FONT_SCALE, SPACING, TYPOGRAPHY } from '../../theme';
import type { MainStackScreenProps } from '../../navigation/types';

export default function DeleteAccountScreen({ navigation }: MainStackScreenProps<'DeleteAccount'>) {
  const { logout } = useAuth();
  const { requireOnline } = useOnlineGuard();
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (confirm.trim().toUpperCase() !== 'DELETE') {
      Alert.alert('Confirm deletion', 'Type DELETE to permanently close this seller account.');
      return;
    }
    if (!requireOnline('Deleting your account')) return;
    setSaving(true);
    try {
      await deleteSellerAccount();
      await logout();
      Alert.alert(
        'Account deleted',
        `Your ${APP_DISPLAY_NAME} seller account is closed on this device and on the server. Shop login will no longer work.`,
      );
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      const message =
        status === 404
          ? `The live server does not have account deletion yet. Email ${SUPPORT_EMAIL} from this seller phone to close the account.`
          : `${apiError(err, 'Try again while online.')} You can also email ${SUPPORT_EMAIL}.`;
      Alert.alert('Could not delete yet', message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen scroll keyboardAvoiding edges={['bottom']} gradient={false} statusBarStyle="light-content">
      <Header
        tone="brand"
        title="Delete account"
        subtitle="Required by Google Play"
        onBack={() => navigation.goBack()}
      />
      <View style={styles.content}>
        <Card>
          <Text style={styles.title} maxFontSizeMultiplier={FONT_SCALE.heading}>
            Close this seller account
          </Text>
          <Text style={styles.body} maxFontSizeMultiplier={FONT_SCALE.body}>
            This signs you out, disables login for this shop, and hides the public storefront. Order
            history needed for GST or disputes may be kept. This cannot be undone from the app.
          </Text>
          <Text
            style={styles.link}
            onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}
            accessibilityRole="link"
          >
            Read the privacy policy
          </Text>
        </Card>
        <Input
          label="Type DELETE to confirm"
          value={confirm}
          onChangeText={setConfirm}
          autoCapitalize="characters"
          placeholder="DELETE"
          editable={!saving}
        />
        <Button
          label="Delete my account"
          onPress={submit}
          loading={saving}
          disabled={saving || confirm.trim().toUpperCase() !== 'DELETE'}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: SPACING.lg, gap: SPACING.md },
  title: { ...TYPOGRAPHY.heading, color: COLORS.error, marginBottom: SPACING.sm },
  body: { ...TYPOGRAPHY.body, color: COLORS.textSecondary },
  link: { ...TYPOGRAPHY.bodyStrong, color: COLORS.primary, marginTop: SPACING.md },
});
