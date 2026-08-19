import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { Button, Card, EmptyState, ErrorState, Header, LoadingState, Screen } from '../../components';
import { COLORS, FONT_SCALE, MIN_TOUCH_TARGET, SPACING, TYPOGRAPHY } from '../../theme';
import { fetchNotifications, markAllNotificationsRead, markNotificationRead, type NotificationItem } from '../../api/seller';
import { apiError, formatDate } from '../../lib/format';
import type { MainStackScreenProps } from '../../navigation/types';

export default function NotificationsScreen({ navigation }: MainStackScreenProps<'Notifications'>) {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      setItems(await fetchNotifications());
    } catch (err) {
      setError(apiError(err, 'Could not load notifications.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const titleOf = (item: NotificationItem) => item.title || item.verb || 'Update';
  const bodyOf = (item: NotificationItem) => item.message || item.description || '';

  return (
    <Screen scroll edges={['bottom']} gradient={false} statusBarStyle="light-content">
      <Header tone="brand" title="Notifications" onBack={() => navigation.goBack()} />
      <View style={styles.content}>
        {items.some((item) => !item.is_read) ? (
          <Button
            label="Mark all read"
            variant="secondary"
            size="sm"
            onPress={async () => {
              await markAllNotificationsRead();
              await load();
            }}
          />
        ) : null}
        {loading ? <LoadingState message="Loading alerts…" /> : null}
        {error ? <ErrorState message={error} onRetry={load} /> : null}
        {!loading && !error && items.length === 0 ? (
          <EmptyState icon="notifications-outline" title="You're all caught up" />
        ) : null}
        {items.map((item) => (
          <TouchableOpacity
            key={item.id}
            onPress={async () => {
              if (!item.is_read) await markNotificationRead(item.id);
              await load();
            }}
          >
            <Card>
              <View style={styles.row}>
                <Text style={styles.title} maxFontSizeMultiplier={FONT_SCALE.body}>{titleOf(item)}</Text>
                {!item.is_read ? <View style={styles.dot} /> : null}
              </View>
              {bodyOf(item) ? <Text style={styles.body}>{bodyOf(item)}</Text> : null}
              <Text style={styles.meta}>{formatDate(item.created_at)}</Text>
            </Card>
          </TouchableOpacity>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: SPACING.lg, gap: SPACING.md },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: SPACING.sm },
  title: { ...TYPOGRAPHY.bodyStrong, color: COLORS.textPrimary, flex: 1 },
  body: { ...TYPOGRAPHY.body, color: COLORS.textSecondary, marginTop: 4 },
  meta: { ...TYPOGRAPHY.caption, color: COLORS.textTertiary, marginTop: 8 },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
});
