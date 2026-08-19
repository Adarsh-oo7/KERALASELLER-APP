import React, { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { Button, Header, Input, LoadingState, Notice, Screen } from '../../components';
import { COLORS, FONT_SCALE, MIN_TOUCH_TARGET, SPACING, TYPOGRAPHY } from '../../theme';
import {
  fetchHomepageListing,
  fetchStoreProfile,
  patchStoreProfile,
  saveHomepageListing,
  storeProfileIsReady,
  submitHomepageListing,
  type HomepageListing,
  type StoreProfile,
} from '../../api/seller';
import { apiError } from '../../lib/format';
import { uploadImage } from '../../lib/cloudinary';
import {
  defaultPolicy,
  POLICY_FIELDS,
  policiesFromStore,
  type PolicyKey,
  type ShopPolicies,
} from '../../lib/storePolicies';
import type { MainStackScreenProps } from '../../navigation/types';

export default function HomepageListingScreen({ navigation }: MainStackScreenProps<'HomepageListing'>) {
  const [listing, setListing] = useState<HomepageListing | null>(null);
  const [profileReady, setProfileReady] = useState(false);
  const [ownerName, setOwnerName] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [license, setLicense] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('Kerala');
  const [pincode, setPincode] = useState('');
  const [docUrl, setDocUrl] = useState('');
  const [shopName, setShopName] = useState('this shop');
  const [policies, setPolicies] = useState<ShopPolicies>(policiesFromStore({ name: 'this shop' }));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPolicies, setSavingPolicies] = useState(false);
  const [savingProducts, setSavingProducts] = useState(false);
  const [uploading, setUploading] = useState(false);

  const applyListing = (data: HomepageListing, profile?: StoreProfile) => {
    setListing(data);
    setOwnerName(data.business?.owner_name || profile?.owner_name || '');
    setGstNumber(data.business?.gst_number || profile?.gst_number || '');
    setLicense(data.business?.business_license || profile?.business_license || '');
    setAddress(data.location?.business_address || profile?.business_address || '');
    setCity(data.location?.city || profile?.city || '');
    setStateName(data.location?.state || profile?.state || 'Kerala');
    setPincode(data.location?.pincode || profile?.pincode || '');
    setDocUrl(data.business?.verification_doc_url || profile?.verification_doc_url || '');
  };

  const load = useCallback(async () => {
    try {
      const [data, profile] = await Promise.all([
        fetchHomepageListing(),
        fetchStoreProfile().catch(() => ({}) as StoreProfile),
      ]);
      applyListing(data, profile);
      setShopName(profile?.name || 'this shop');
      setPolicies(policiesFromStore(profile));
      setProfileReady(storeProfileIsReady(profile));
    } catch (err) {
      Alert.alert('Could not load listing request', apiError(err, 'Try again.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const payload = () => ({
    owner_name: ownerName,
    gst_number: gstNumber,
    business_license: license,
    business_address: address,
    city,
    state: stateName,
    pincode,
    ...(docUrl ? { cloudinary_document: { url: docUrl } } : {}),
  });

  const saveDraft = async () => {
    setSaving(true);
    try {
      const data = await saveHomepageListing(payload());
      applyListing(data);
      Alert.alert('Saved', 'Business details saved. Submit when every required field is complete.');
    } catch (err) {
      Alert.alert('Could not save', apiError(err, 'Try again.'));
    } finally {
      setSaving(false);
    }
  };

  const submit = async () => {
    if (!profileReady) {
      Alert.alert(
        'Store profile first',
        'Add store name, description, WhatsApp, and logo in Store settings before requesting a home listing.',
      );
      return;
    }
    setSaving(true);
    try {
      const data = await submitHomepageListing(payload());
      applyListing(data);
      Alert.alert(
        'Request sent',
        'A Kerala Sellers superuser will verify your business details. Products appear on the home page only after approval.',
      );
    } catch (err) {
      Alert.alert('Could not submit', apiError(err, 'Complete the missing details and try again.'));
      load();
    } finally {
      setSaving(false);
    }
  };

  const savePolicies = async () => {
    setSavingPolicies(true);
    try {
      const saved = await patchStoreProfile(policies);
      setPolicies(policiesFromStore({ ...saved, name: saved.name || shopName }));
      Alert.alert('Policies saved', 'Buyers will see these on your shop. Kerala Sellers remains the software provider only.');
    } catch (err) {
      Alert.alert(
        'Could not save policies',
        apiError(err, 'The server may still need the shop policy fields update.'),
      );
    } finally {
      setSavingPolicies(false);
    }
  };

  const uploadDoc = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Photo access needed', 'Allow photos to upload GST or license proof.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (result.canceled || !result.assets[0]?.uri) return;
    setUploading(true);
    try {
      const url = await uploadImage(result.assets[0].uri);
      setDocUrl(url);
      await saveHomepageListing({ ...payload(), cloudinary_document: { url } });
    } catch (err) {
      Alert.alert('Could not upload document', apiError(err, 'Try again.'));
    } finally {
      setUploading(false);
    }
  };

  const status = listing?.status || 'not_requested';
  const locked = status === 'pending' || status === 'approved';

  return (
    <Screen scroll edges={['bottom']} gradient={false} statusBarStyle="light-content">
      <Header
        tone="brand"
        title="Advanced settings"
        subtitle="Verify, then pick home page products"
        onBack={() => navigation.goBack()}
      />
      <View style={styles.content}>
        {loading ? <LoadingState message="Loading listing request…" /> : null}

        {status === 'approved' ? (
          <Notice
            tone="success"
            title="Listed on Kerala Sellers"
            message="A superuser verified this shop. Choose which products appear on the Kerala Sellers home page."
          />
        ) : null}
        {status === 'pending' ? (
          <Notice
            tone="info"
            title="Waiting for verification"
            message="Your request is with the Kerala Sellers team. Products stay off the home page until a superuser approves."
          />
        ) : null}
        {status === 'rejected' ? (
          <Notice
            tone="warning"
            title="Request rejected"
            message={listing?.note || 'Update the business details and send the request again.'}
          />
        ) : null}
        {status === 'not_requested' ? (
          <Notice
            tone="info"
            title="Home listing is not automatic"
            message="Complete business details, location, and a verification document, then request listing. Only a superuser can approve it."
          />
        ) : null}

        {!profileReady ? (
          <TouchableOpacity
            onPress={() => navigation.navigate('BasicSettings')}
            style={styles.linkRow}
            accessibilityRole="button"
            accessibilityLabel="Open store settings"
          >
            <Ionicons name="storefront-outline" size={20} color={COLORS.primary} />
            <Text style={styles.linkText}>Finish store name, WhatsApp, and logo first</Text>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textTertiary} />
          </TouchableOpacity>
        ) : null}

        {listing?.missing_labels && listing.missing_labels.length > 0 && status !== 'approved' ? (
          <Text style={styles.missing}>
            Still needed: {listing.missing_labels.join(', ')}
          </Text>
        ) : null}

        <Input label="Owner / proprietor name" value={ownerName} onChangeText={setOwnerName} editable={!locked} />
        <Input label="GST number" value={gstNumber} onChangeText={setGstNumber} autoCapitalize="characters" editable={!locked} />
        <Input label="Business license number" value={license} onChangeText={setLicense} editable={!locked} />
        <Input
          label="Business address"
          value={address}
          onChangeText={setAddress}
          multiline
          editable={!locked}
        />
        <Input label="City / locality" value={city} onChangeText={setCity} editable={!locked} />
        <Input label="State" value={stateName} onChangeText={setStateName} editable={!locked} />
        <Input
          label="PIN code"
          value={pincode}
          onChangeText={setPincode}
          keyboardType="number-pad"
          maxLength={6}
          editable={!locked}
        />

        <TouchableOpacity
          onPress={locked ? undefined : uploadDoc}
          style={styles.docRow}
          accessibilityRole="button"
          accessibilityLabel="Upload verification document"
        >
          <Ionicons name={docUrl ? 'document-attach' : 'cloud-upload-outline'} size={20} color={COLORS.primary} />
          <View style={styles.copy}>
            <Text style={styles.label}>{docUrl ? 'Verification document uploaded' : 'Upload GST / license photo'}</Text>
            <Text style={styles.hint}>{uploading ? 'Uploading…' : 'Required for superuser verification'}</Text>
          </View>
        </TouchableOpacity>

        {locked ? null : (
          <>
            <Button label={saving ? 'Saving…' : 'Save details'} onPress={saveDraft} disabled={saving || uploading} />
            <Button
              label={saving ? 'Submitting…' : 'Request home page listing'}
              onPress={submit}
              disabled={saving || uploading}
            />
          </>
        )}

        <Text style={styles.section}>Home page products</Text>
        <Notice
          tone="info"
          title="Your shop page stays the same"
          message={
            status === 'approved'
              ? 'Turn on only the products buyers should see on keralasellers.in. Shop-only items never appear there.'
              : 'Pick now. They appear on the Kerala Sellers home page after a superuser verifies the shop.'
          }
        />
        {(listing?.products || []).map((item) => (
          <TouchableOpacity
            key={item.id}
            disabled={!item.eligible}
            onPress={() => {
              setListing((current) =>
                current
                  ? {
                      ...current,
                      products: (current.products || []).map((row) =>
                        row.id === item.id ? { ...row, show_on_homepage: !row.show_on_homepage } : row,
                      ),
                    }
                  : current,
              );
            }}
            style={styles.docRow}
            accessibilityRole="button"
            accessibilityLabel={item.name}
          >
            <Ionicons
              name={item.show_on_homepage ? 'checkmark-circle' : 'ellipse-outline'}
              size={20}
              color={item.eligible ? COLORS.primary : COLORS.textTertiary}
            />
            <View style={styles.copy}>
              <Text style={styles.label}>{item.name}</Text>
              <Text style={styles.hint}>{item.eligible ? 'Can list on home' : 'Shop only'}</Text>
            </View>
          </TouchableOpacity>
        ))}
        <Button
          label={savingProducts ? 'Saving products…' : 'Save home page products'}
          onPress={async () => {
            setSavingProducts(true);
            try {
              const data = await saveHomepageListing({
                homepage_product_ids: (listing?.products || [])
                  .filter((row) => row.eligible && row.show_on_homepage)
                  .map((row) => row.id),
              });
              applyListing(data);
              Alert.alert('Saved', 'Home page products updated.');
            } catch (err) {
              Alert.alert('Could not save', apiError(err, 'Try again.'));
            } finally {
              setSavingProducts(false);
            }
          }}
          disabled={savingProducts || !(listing?.products || []).length}
        />

        <Text style={styles.section}>Shop policies</Text>
        <Notice
          tone="info"
          title="Kerala Sellers is a SaaS tool"
          message="Buyers complain to you if something goes wrong. Kerala Sellers may ask for clarification or remove the shop. We are not responsible for your products, delivery, or refunds."
        />
        {POLICY_FIELDS.map((item) => (
          <View key={item.key} style={styles.policyBlock}>
            <Input
              label={item.title}
              helper={item.hint}
              value={policies[item.key]}
              onChangeText={(value) => setPolicies((current) => ({ ...current, [item.key]: value }))}
              multiline
              numberOfLines={10}
              textAlignVertical="top"
            />
            <TouchableOpacity
              onPress={() =>
                setPolicies((current) => ({
                  ...current,
                  [item.key]: defaultPolicy(item.key as PolicyKey, shopName),
                }))
              }
              accessibilityRole="button"
              accessibilityLabel={`Restore Kerala Sellers default for ${item.title}`}
            >
              <Text style={styles.restore}>Restore Kerala Sellers default</Text>
            </TouchableOpacity>
          </View>
        ))}
        <Button
          label={savingPolicies ? 'Saving policies…' : 'Save shop policies'}
          onPress={savePolicies}
          disabled={savingPolicies}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: SPACING.lg, gap: SPACING.md },
  missing: { ...TYPOGRAPHY.caption, color: COLORS.warning },
  linkRow: {
    minHeight: MIN_TOUCH_TARGET,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  linkText: { ...TYPOGRAPHY.bodyStrong, color: COLORS.primary, flex: 1 },
  docRow: {
    minHeight: MIN_TOUCH_TARGET,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  copy: { flex: 1 },
  label: { ...TYPOGRAPHY.bodyStrong, color: COLORS.textPrimary },
  hint: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, marginTop: 2 },
  section: { ...TYPOGRAPHY.title, color: COLORS.textPrimary, marginTop: SPACING.lg },
  policyBlock: { gap: SPACING.xs },
  restore: { ...TYPOGRAPHY.bodyStrong, color: COLORS.primary },
});
