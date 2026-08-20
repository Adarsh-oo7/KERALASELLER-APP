import React, { useCallback, useState } from 'react';
import { Alert, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { Button, Card, Header, Screen } from '../../components';
import { useStoreAccess } from '../../hooks/useStoreAccess';
import { DAILY_TOOLS, moveDailyTool, type DailyToolId } from '../../lib/dailyTools';
import { loadDailyToolIds, saveDailyToolIds } from '../../lib/dailyToolsStore';
import { canUseTool } from '../../lib/storeAccess';
import type { MainStackScreenProps } from '../../navigation/types';
import { COLORS, FONT_SCALE, MIN_TOUCH_TARGET, SPACING, TYPOGRAPHY } from '../../theme';

export default function HomeToolsScreen({ navigation }: MainStackScreenProps<'HomeTools'>) {
  const { allowed, isOwner } = useStoreAccess();
  const [ids, setIds] = useState<DailyToolId[]>([]);
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let live = true;
      loadDailyToolIds().then((next) => {
        if (live) setIds(next);
      });
      return () => {
        live = false;
      };
    }, []),
  );

  const toggle = (id: DailyToolId, on: boolean) => {
    setIds((prev) => (on ? (prev.includes(id) ? prev : [...prev, id]) : prev.filter((item) => item !== id)));
  };

  const save = async () => {
    setSaving(true);
    try {
      await saveDailyToolIds(ids);
      navigation.goBack();
    } catch {
      Alert.alert('Could not save', 'Try again.');
    } finally {
      setSaving(false);
    }
  };

  const selected = ids
    .map((id) => DAILY_TOOLS.find((tool) => tool.id === id))
    .filter((tool): tool is NonNullable<typeof tool> => Boolean(tool) && canUseTool(allowed, tool.permission, isOwner));
  const available = DAILY_TOOLS.filter((tool) => canUseTool(allowed, tool.permission, isOwner) && !ids.includes(tool.id));

  return (
    <Screen scroll edges={['bottom']} gradient={false} statusBarStyle="light-content">
      <Header
        tone="brand"
        title="Daily tools"
        subtitle="Pick what appears on Home, then reorder it"
        onBack={() => navigation.goBack()}
      />
      <View style={styles.content}>
        <Text style={styles.section}>On Home</Text>
        <Card>
          {selected.length === 0 ? (
            <Text style={styles.empty}>Nothing on Home yet. Turn tools on below.</Text>
          ) : selected.map((tool, index) => (
            <View key={tool.id} style={[styles.row, index < selected.length - 1 && styles.divider]}>
              <View style={styles.icon}>
                <Ionicons name={tool.icon as keyof typeof Ionicons.glyphMap} size={20} color={COLORS.primary} />
              </View>
              <View style={styles.copy}>
                <Text style={styles.label} maxFontSizeMultiplier={FONT_SCALE.body}>{tool.label}</Text>
                <Text style={styles.hint} maxFontSizeMultiplier={FONT_SCALE.caption}>{tool.hint}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setIds((prev) => moveDailyTool(prev, tool.id, -1))}
                style={styles.step}
                accessibilityRole="button"
                accessibilityLabel={`Move ${tool.label} up`}
                disabled={index === 0}
              >
                <Ionicons name="chevron-up" size={18} color={index === 0 ? COLORS.textTertiary : COLORS.textPrimary} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setIds((prev) => moveDailyTool(prev, tool.id, 1))}
                style={styles.step}
                accessibilityRole="button"
                accessibilityLabel={`Move ${tool.label} down`}
                disabled={index === selected.length - 1}
              >
                <Ionicons name="chevron-down" size={18} color={index === selected.length - 1 ? COLORS.textTertiary : COLORS.textPrimary} />
              </TouchableOpacity>
              <Switch
                value
                onValueChange={() => toggle(tool.id, false)}
                trackColor={{ false: COLORS.inputBorder, true: COLORS.primary }}
                accessibilityLabel={`Hide ${tool.label} from Home`}
              />
            </View>
          ))}
        </Card>

        {available.length > 0 ? (
          <>
            <Text style={styles.section}>Available</Text>
            <Card>
              {available.map((tool, index) => (
                <View key={tool.id} style={[styles.row, index < available.length - 1 && styles.divider]}>
                  <View style={styles.icon}>
                    <Ionicons name={tool.icon as keyof typeof Ionicons.glyphMap} size={20} color={COLORS.primary} />
                  </View>
                  <View style={styles.copy}>
                    <Text style={styles.label} maxFontSizeMultiplier={FONT_SCALE.body}>{tool.label}</Text>
                    <Text style={styles.hint} maxFontSizeMultiplier={FONT_SCALE.caption}>{tool.hint}</Text>
                  </View>
                  <Switch
                    value={false}
                    onValueChange={() => toggle(tool.id, true)}
                    trackColor={{ false: COLORS.inputBorder, true: COLORS.primary }}
                    accessibilityLabel={`Show ${tool.label} on Home`}
                  />
                </View>
              ))}
            </Card>
          </>
        ) : null}

        <Button label="Save home tools" onPress={() => void save()} loading={saving} disabled={saving} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: SPACING.lg, gap: SPACING.md },
  section: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, marginLeft: 4 },
  empty: { ...TYPOGRAPHY.body, color: COLORS.textSecondary, padding: SPACING.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: MIN_TOUCH_TARGET,
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
  },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.inputBorder },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.glassOverlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1 },
  label: { ...TYPOGRAPHY.bodyStrong, color: COLORS.textPrimary },
  hint: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, marginTop: 2 },
  step: {
    minWidth: MIN_TOUCH_TARGET - 8,
    minHeight: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
