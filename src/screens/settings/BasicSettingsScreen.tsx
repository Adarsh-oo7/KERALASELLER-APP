import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Switch, Text, useWindowDimensions, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { Button, Header, Input, LoadingState, Notice, Screen } from '../../components';
import { COLORS, FONT_SCALE, MIN_TOUCH_TARGET, RADIUS, SPACING, TYPOGRAPHY } from '../../theme';
import {
  fetchSellingStatus,
  fetchPredefinedBanners,
  fetchStoreProfile,
  patchStoreProfile,
  selectedPredefinedBannerIds,
  storeProfileIsReady,
  type PredefinedBanner,
  type StoreProfile,
} from '../../api/seller';
import { apiError } from '../../lib/format';
import { uploadImage } from '../../lib/cloudinary';
import { useOnlineGuard } from '../../hooks/useOnlineGuard';
import { skipSetupToDashboard } from '../../lib/setupFlow';
import type { MainStackScreenProps } from '../../navigation/types';

async function pickAndUpload(label: string): Promise<string | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    Alert.alert('Photo access needed', `Allow photos to upload a ${label}.`);
    return null;
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.7,
  });
  if (result.canceled || !result.assets[0]?.uri) return null;
  return uploadImage(result.assets[0].uri);
}

export default function BasicSettingsScreen({ navigation, route }: MainStackScreenProps<'BasicSettings'>) {
  const setup = Boolean(route.params?.setup);
  const { requireOnline } = useOnlineGuard();
  const { width } = useWindowDimensions();
  const tileWidth = (width - SPACING.lg * 2 - SPACING.sm) / 2;
  const [profile, setProfile] = useState<StoreProfile>({});
  const [gallery, setGallery] = useState<PredefinedBanner[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState('');
  const [profileComplete, setProfileComplete] = useState(false);

  const load = useCallback(async () => {
    try {
      const [store, banners] = await Promise.all([
        fetchStoreProfile(),
        fetchPredefinedBanners().catch(() => [] as PredefinedBanner[]),
      ]);
      setProfile(store);
      setGallery(banners);
      setSelectedIds(selectedPredefinedBannerIds(store));
      setProfileComplete(storeProfileIsReady(store));
    } catch (err) {
      Alert.alert('Could not load settings', apiError(err, 'Try again.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const selectedBanners = useMemo(
    () =>
      selectedIds.map((id, index) => {
        const fromGallery = gallery.find((banner) => banner.id === id);
        const fallback = [profile.banner_1_url, profile.banner_2_url, profile.banner_3_url][index];
        return {
          id,
          name: fromGallery?.name || `Banner ${index + 1}`,
          url: fromGallery?.image_url || fallback || '',
        };
      }),
    [gallery, profile.banner_1_url, profile.banner_2_url, profile.banner_3_url, selectedIds],
  );

  const setField = (key: keyof StoreProfile, value: string | boolean) => {
    setProfile((prev) => ({ ...prev, [key]: value }));
  };

  const toggleBanner = (id: number) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((item) => item !== id);
      if (prev.length >= 3) {
        Alert.alert('Max 3 banners', 'Remove one before selecting another.');
        return prev;
      }
      return [...prev, id];
    });
  };

  const uploadLogo = async () => {
    setUploading('logo');
    try {
      const url = await pickAndUpload('logo');
      if (!url) return;
      const saved = await patchStoreProfile({ cloudinary_logo: { url } });
      setProfile(saved);
      setProfileComplete(storeProfileIsReady(saved));
    } catch (err) {
      Alert.alert('Could not upload logo', apiError(err, 'Try again.'));
    } finally {
      setUploading('');
    }
  };

  const uploadCustomBanner = async () => {
    setUploading('banner');
    try {
      const url = await pickAndUpload('banner');
      if (!url) return;
      const saved = await patchStoreProfile({
        cloudinary_banner_1: { url },
        predefined_banner_1: null,
        predefined_banner_2: null,
        predefined_banner_3: null,
      });
      setProfile(saved);
      setSelectedIds([]);
    } catch (err) {
      Alert.alert('Could not upload banner', apiError(err, 'Try again.'));
    } finally {
      setUploading('');
    }
  };

  const continueSetup = async () => {
    const selling = await fetchSellingStatus().catch(() => null);
    const razorpayReady = Boolean(selling?.requirements?.payment_gateway?.complete);
    const subscriptionReady = Boolean(selling?.requirements?.subscription?.complete);
    if (!razorpayReady) {
      navigation.navigate('Payments', { setup: true });
      return;
    }
    if (!subscriptionReady) {
      navigation.navigate('Subscription', { setup: true });
      return;
    }
    skipSetupToDashboard(navigation);
  };

  const save = async () => {
    if (!requireOnline('Saving store settings')) return;
    setSaving(true);
    try {
      const saved = await patchStoreProfile({
        name: profile.name,
        description: profile.description,
        tagline: profile.tagline,
        whatsapp_number: profile.whatsapp_number,
        business_address: profile.business_address,
        instagram_link: (profile.instagram_link || '').trim() || null,
        facebook_link: (profile.facebook_link || '').trim() || null,
        delivery_time_local: profile.delivery_time_local,
        delivery_time_national: profile.delivery_time_national,
        accepts_cod: Boolean(profile.accepts_cod),
        predefined_banner_1: selectedIds[0] ?? null,
        predefined_banner_2: selectedIds[1] ?? null,
        predefined_banner_3: selectedIds[2] ?? null,
      });
      setProfile(saved);
      setSelectedIds(selectedPredefinedBannerIds(saved));
      setProfileComplete(storeProfileIsReady(saved));
      Alert.alert('Saved', 'Store settings updated.');
      if (setup) {
        await continueSetup();
      }
    } catch (err) {
      Alert.alert('Could not save', apiError(err, 'Try again.'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState message="Loading basic settings…" />;

  return (
    <Screen scroll keyboardAvoiding edges={['bottom']} gradient={false} statusBarStyle="light-content">
      <Header tone="brand" title="Basic settings" subtitle="Shop name, logo, WhatsApp, and banners" onBack={() => navigation.goBack()} />
      <View style={styles.content}>
        <Text style={styles.section} maxFontSizeMultiplier={FONT_SCALE.body}>Logo</Text>
        {profile.logo_url ? <Image source={{ uri: profile.logo_url }} style={styles.logo} /> : (
          <Text style={styles.help}>A logo is required before you can add products or go live.</Text>
        )}
        <Button
          label={profile.logo_url ? 'Replace logo' : 'Upload logo'}
          variant="secondary"
          onPress={uploadLogo}
          loading={uploading === 'logo'}
          disabled={Boolean(uploading)}
        />

        <Text style={styles.section} maxFontSizeMultiplier={FONT_SCALE.body}>
          Banners
        </Text>
        <Text style={styles.help}>
          {gallery.length > 0
            ? `Tap to select up to 3 (${selectedIds.length}/3), then save.`
            : 'No gallery banners yet. Contact admin, or upload your own.'}
        </Text>
        {selectedBanners.length > 0 ? (
          <View style={styles.selectedRow}>
            {selectedBanners.map((banner, index) => (
              <View key={`${banner.id}-${index}`} style={styles.selectedTile}>
                {banner.url ? <Image source={{ uri: banner.url }} style={styles.selectedImage} /> : null}
                <View style={styles.orderBadge}>
                  <Text style={styles.orderText}>{index + 1}</Text>
                </View>
                <Pressable
                  onPress={() => toggleBanner(banner.id)}
                  style={styles.removeBadge}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${banner.name}`}
                >
                  <Ionicons name="close" size={14} color={COLORS.onPrimary} />
                </Pressable>
              </View>
            ))}
          </View>
        ) : null}
        <View style={styles.gallery}>
          {gallery.map((banner) => {
            const selected = selectedIds.includes(banner.id);
            const order = selected ? selectedIds.indexOf(banner.id) + 1 : 0;
            return (
              <Pressable
                key={banner.id}
                onPress={() => toggleBanner(banner.id)}
                style={[styles.tile, { width: tileWidth }, selected && styles.tileSelected]}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={banner.name || `Banner ${banner.id}`}
              >
                <Image source={{ uri: banner.image_url }} style={styles.tileImage} />
                {selected ? (
                  <View style={styles.check}>
                    <Ionicons name="checkmark" size={12} color={COLORS.onPrimary} />
                    <Text style={styles.checkText}>{order}</Text>
                  </View>
                ) : null}
                {banner.name ? (
                  <Text style={styles.tileName} numberOfLines={1} maxFontSizeMultiplier={FONT_SCALE.caption}>
                    {banner.name}
                  </Text>
                ) : null}
              </Pressable>
            );
          })}
        </View>
        <Button
          label="Upload your own banner"
          variant="ghost"
          onPress={uploadCustomBanner}
          loading={uploading === 'banner'}
          disabled={Boolean(uploading)}
        />

        <Input label="Shop name" value={profile.name || ''} onChangeText={(v) => setField('name', v)} />
        <Input label="Tagline" value={profile.tagline || ''} onChangeText={(v) => setField('tagline', v)} />
        <Input label="Description" value={profile.description || ''} onChangeText={(v) => setField('description', v)} multiline />
        <Input label="WhatsApp number" value={profile.whatsapp_number || ''} onChangeText={(v) => setField('whatsapp_number', v)} keyboardType="phone-pad" />
        <Input
          label="Business address"
          value={profile.business_address || ''}
          onChangeText={(v) => setField('business_address', v)}
          multiline
        />
        <Input
          label="Instagram link (optional)"
          helper="Not required to go live or add products."
          value={profile.instagram_link || ''}
          onChangeText={(v) => setField('instagram_link', v)}
          autoCapitalize="none"
          placeholder="https://instagram.com/yourshop"
        />
        <Input
          label="Facebook link (optional)"
          helper="Not required to go live or add products."
          value={profile.facebook_link || ''}
          onChangeText={(v) => setField('facebook_link', v)}
          autoCapitalize="none"
          placeholder="https://facebook.com/yourshop"
        />
        <Input label="Local delivery time" value={profile.delivery_time_local || ''} onChangeText={(v) => setField('delivery_time_local', v)} placeholder="Same day / 2 hours" />
        <Input label="National delivery time" value={profile.delivery_time_national || ''} onChangeText={(v) => setField('delivery_time_national', v)} placeholder="3–5 days" />
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel} maxFontSizeMultiplier={FONT_SCALE.body}>Accept cash on delivery</Text>
          <Switch
            value={Boolean(profile.accepts_cod)}
            onValueChange={(value) => setField('accepts_cod', value)}
            trackColor={{ false: COLORS.inputBorder, true: COLORS.accent }}
            accessibilityLabel="Accept cash on delivery"
          />
        </View>
        <Button label="Save settings" onPress={save} loading={saving} disabled={saving} />
        {!profileComplete ? (
          <>
            <Notice
              tone="info"
              title="You can finish this later"
              message="Skip does not unlock products or your public shop link. This step stays on your dashboard checklist."
            />
            <Button
              label="Skip for now"
              variant="ghost"
              onPress={() => skipSetupToDashboard(navigation)}
            />
          </>
        ) : setup ? (
            <Button
              label="Continue setup"
              variant="secondary"
              onPress={() => {
                continueSetup().catch(() => navigation.navigate('Payments', { setup: true }));
              }}
            />
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: SPACING.lg },
  section: { ...TYPOGRAPHY.bodyStrong, color: COLORS.textPrimary, marginTop: SPACING.md, marginBottom: SPACING.sm },
  help: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, marginBottom: SPACING.sm },
  logo: { width: 96, height: 96, borderRadius: RADIUS.md, marginBottom: SPACING.sm, backgroundColor: COLORS.surfaceSecondary },
  selectedRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.md },
  selectedTile: {
    width: 110,
    aspectRatio: 16 / 9,
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: COLORS.success,
    backgroundColor: COLORS.surfaceSecondary,
  },
  selectedImage: { width: '100%', height: '100%' },
  orderBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: COLORS.success,
    borderRadius: 3,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  orderText: { ...TYPOGRAPHY.caption, color: COLORS.onPrimary, fontWeight: '700' },
  removeBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 3,
    backgroundColor: COLORS.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gallery: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.md },
  tile: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceSecondary,
  },
  tileSelected: { borderColor: COLORS.success },
  tileImage: { width: '100%', aspectRatio: 16 / 9 },
  tileName: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textPrimary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  check: {
    position: 'absolute',
    top: 6,
    right: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: COLORS.success,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  checkText: { ...TYPOGRAPHY.caption, color: COLORS.onPrimary, fontWeight: '700' },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: MIN_TOUCH_TARGET,
    marginBottom: SPACING.lg,
  },
  switchLabel: { ...TYPOGRAPHY.bodyStrong, color: COLORS.textPrimary, flex: 1, paddingRight: SPACING.md },
});
