import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Button, Chip, Input } from '../../components';
import { COLORS, FONT_SCALE, MIN_TOUCH_TARGET, RADIUS, SPACING, TYPOGRAPHY } from '../../theme';
import { createCategory, type Category } from '../../api/seller';
import { apiError } from '../../lib/format';
import { childrenOf, findCategory, hasChildren, pathTo } from '../../lib/categories';

type Props = {
  categories: Category[];
  selectedId: number | null;
  onSelect: (category: Category | null) => void;
  onCategoriesChanged: (next: Category[]) => void;
};

export default function CategoryPicker({
  categories,
  selectedId,
  onSelect,
  onCategoriesChanged,
}: Props) {
  const selected = findCategory(categories, selectedId) || null;
  const [folderId, setFolderId] = useState<number | null>(selected?.parent ?? null);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (selected?.parent != null) setFolderId(selected.parent);
  }, [selected?.id, selected?.parent]);

  const folder = findCategory(categories, folderId) || null;
  const crumbs = pathTo(categories, folderId);
  const visible = useMemo(() => childrenOf(categories, folderId), [categories, folderId]);

  const openFolder = (category: Category) => {
    setFolderId(category.id);
    onSelect(null);
  };

  const onPressCategory = (category: Category) => {
    if (hasChildren(categories, category.id)) {
      openFolder(category);
      return;
    }
    onSelect(category);
  };

  const goBack = () => {
    setFolderId(folder?.parent ?? null);
    onSelect(null);
  };

  const onCreate = async () => {
    const name = newName.trim();
    if (!name) {
      Alert.alert('Category name', 'Type the category to add at this level.');
      return;
    }
    setCreating(true);
    try {
      const created = await createCategory({ name, parent: folderId });
      const next = categories.some((cat) => cat.id === created.id)
        ? categories.map((cat) => (cat.id === created.id ? { ...cat, ...created } : cat))
        : [...categories, created];
      onCategoriesChanged(next);
      setNewName('');
      if (!hasChildren(next, created.id)) onSelect(created);
    } catch (err) {
      Alert.alert('Could not add category', apiError(err, 'Try a different name, or pick one that is already listed.'));
    } finally {
      setCreating(false);
    }
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label} maxFontSizeMultiplier={FONT_SCALE.body}>
        Category *
      </Text>
      <Text style={styles.helper}>
        Open a folder, then pick the final type. Example: Dress → Male → Bottom → Shorts. Add a missing folder or type here.
      </Text>

      {selected ? (
        <View style={styles.selected}>
          <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
          <Text style={styles.selectedText} maxFontSizeMultiplier={FONT_SCALE.body}>
            {pathTo(categories, selected.id).map((cat) => cat.name).join(' → ')}
          </Text>
          <TouchableOpacity
            onPress={() => onSelect(null)}
            accessibilityRole="button"
            accessibilityLabel="Clear category"
            hitSlop={8}
          >
            <Ionicons name="close" size={18} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>
      ) : null}

      {crumbs.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.crumbs}>
          <Chip
            label="All"
            selected={false}
            onPress={() => {
              setFolderId(null);
              onSelect(null);
            }}
          />
          {crumbs.map((crumb, index) => (
            <Chip
              key={crumb.id}
              label={crumb.name}
              selected={index === crumbs.length - 1}
              onPress={() => {
                setFolderId(crumb.id);
                onSelect(null);
              }}
            />
          ))}
        </ScrollView>
      ) : null}

      {folderId != null ? (
        <TouchableOpacity onPress={goBack} style={styles.back} accessibilityRole="button" accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={16} color={COLORS.primary} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      ) : null}

      <Text style={styles.level} maxFontSizeMultiplier={FONT_SCALE.caption}>
        {folder ? `${folder.name} — pick a type or a sub folder` : 'Browse categories'}
      </Text>

      <ScrollView
        style={styles.list}
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
      >
        {visible.length === 0 ? (
          <Text style={styles.empty}>Nothing here yet. Add this category below.</Text>
        ) : (
          visible.map((category) => {
            const folderItem = hasChildren(categories, category.id);
            const isSelected = selectedId === category.id;
            return (
              <TouchableOpacity
                key={category.id}
                onPress={() => onPressCategory(category)}
                style={[styles.row, isSelected && styles.rowSelected]}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={category.name}
              >
                <Ionicons
                  name={folderItem ? 'folder-outline' : 'pricetag-outline'}
                  size={18}
                  color={folderItem ? COLORS.accent : COLORS.primary}
                />
                <Text style={styles.rowName} maxFontSizeMultiplier={FONT_SCALE.body}>
                  {category.name}
                </Text>
                <Text style={styles.rowHint}>
                  {folderItem ? 'Open' : isSelected ? 'Selected' : 'Select'}
                </Text>
                {folderItem ? <Ionicons name="chevron-forward" size={16} color={COLORS.textTertiary} /> : null}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      <Input
        label={folder ? `Add under ${folder.name}` : 'Add a main category'}
        value={newName}
        onChangeText={setNewName}
        placeholder={folder ? 'Shorts, Top, 1 kg pack…' : 'Dress, Grocery, Electronics…'}
      />
      <Button
        label={creating ? 'Adding…' : 'Add this category'}
        variant="secondary"
        size="sm"
        onPress={onCreate}
        loading={creating}
        disabled={creating}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: SPACING.lg, gap: SPACING.sm },
  label: {
    ...TYPOGRAPHY.label,
    color: COLORS.textPrimary,
  },
  helper: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  selected: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.successMuted,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  selectedText: {
    ...TYPOGRAPHY.callout,
    color: COLORS.textPrimary,
    flex: 1,
  },
  crumbs: { paddingBottom: SPACING.xs },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    minHeight: MIN_TOUCH_TARGET - 8,
  },
  backText: {
    ...TYPOGRAPHY.label,
    color: COLORS.primary,
  },
  level: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  list: {
    maxHeight: 260,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
  },
  empty: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    padding: SPACING.md,
  },
  row: {
    minHeight: MIN_TOUCH_TARGET,
    paddingHorizontal: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  rowSelected: {
    backgroundColor: COLORS.primaryMuted,
  },
  rowName: {
    ...TYPOGRAPHY.body,
    color: COLORS.textPrimary,
    flex: 1,
  },
  rowHint: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textTertiary,
  },
});
