import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

import { Button, Chip, Header, Input, LoadingState, Screen, BarcodeMark, BarcodeScannerModal } from '../../components';
import { COLORS, FONT_SCALE, SPACING, TYPOGRAPHY } from '../../theme';
import { fetchCategories, fetchProduct, fetchProducts, fetchSellingStatus, saveProduct, type Category, type Product } from '../../api/seller';
import { apiError } from '../../lib/format';
import { codesFromProduct, findProductByCode, generateShopBarcode, storedBarcode } from '../../lib/barcode';
import { uploadImage } from '../../lib/cloudinary';
import { useOnlineGuard } from '../../hooks/useOnlineGuard';
import type { MainStackScreenProps } from '../../navigation/types';

const SALE_TYPES = [
  { id: 'BOTH', label: 'Online + shop' },
  { id: 'ONLINE', label: 'Online only' },
  { id: 'OFFLINE', label: 'Shop only' },
] as const;

export default function ProductFormScreen({ navigation, route }: MainStackScreenProps<'ProductForm'>) {
  const productId = route.params?.productId;
  const { requireOnline } = useOnlineGuard();
  const [loading, setLoading] = useState(Boolean(productId));
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [catalog, setCatalog] = useState<Product[]>([]);
  const [name, setName] = useState('');
  const [modelName, setModelName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [mrp, setMrp] = useState('');
  const [totalStock, setTotalStock] = useState('0');
  const [onlineStock, setOnlineStock] = useState('0');
  const [saleType, setSaleType] = useState<'BOTH' | 'ONLINE' | 'OFFLINE'>('BOTH');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState(route.params?.barcode || '');
  const [costPrice, setCostPrice] = useState('');
  const [hsnCode, setHsnCode] = useState('');
  const [gstRate, setGstRate] = useState('');
  const [showOnHomepage, setShowOnHomepage] = useState(true);
  const [scanner, setScanner] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [cats, products] = await Promise.all([
          fetchCategories().catch(() => [] as Category[]),
          fetchProducts({ page_size: 200 }).catch(() => [] as Product[]),
        ]);
        if (!cancelled) {
          setCategories(cats);
          setCatalog(products);
        }
      } catch {
        // Categories and existing codes are helpful, not required to save.
      }
      if (!productId) {
        try {
          const selling = await fetchSellingStatus();
          if (!cancelled && !selling.is_ready_to_sell) {
            Alert.alert(
              'Shop not live yet',
              'Finish store profile, Razorpay, and subscription before adding products.',
              [{ text: 'OK', onPress: () => navigation.goBack() }],
            );
          }
        } catch {
          // Status check is best-effort; the API still rejects create if incomplete.
        }
        return;
      }
      try {
        const product = await fetchProduct(productId);
        if (cancelled) return;
        setName(product.name);
        setModelName(product.model_name ?? '');
        setDescription(product.description ?? '');
        setPrice(String(product.price ?? ''));
        setMrp(product.mrp != null ? String(product.mrp) : '');
        setTotalStock(String(product.total_stock ?? 0));
        setOnlineStock(String(product.online_stock ?? 0));
        setSaleType(product.sale_type || 'BOTH');
        const cat = product.category;
        setCategoryId(typeof cat === 'object' && cat ? cat.id : typeof cat === 'number' ? cat : null);
        setImageUrl(product.main_image_url || product.thumbnail_url || '');
        setWeightKg(product.weight_kg != null && product.weight_kg !== '' ? String(product.weight_kg) : '');
        setSku(product.sku || '');
        setBarcode(product.barcode || route.params?.barcode || '');
        setCostPrice(product.cost_price != null && product.cost_price !== '' ? String(product.cost_price) : '');
        setHsnCode(product.hsn_code || '');
        setGstRate(product.gst_rate != null && Number(product.gst_rate) !== 0 ? String(product.gst_rate) : '');
        setShowOnHomepage(product.show_on_homepage !== false && product.sale_type !== 'OFFLINE');
      } catch (err) {
        Alert.alert('Could not load product', apiError(err, 'Try again.'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [productId, navigation, route.params?.barcode]);

  const takenCodes = useMemo(
    () => catalog.flatMap((product) => codesFromProduct(product)),
    [catalog],
  );

  const duplicate = useMemo(() => {
    const code = storedBarcode(barcode);
    if (!code) return null;
    const match = findProductByCode(catalog, code);
    if (!match) return null;
    if (productId && match.product.id === productId) return null;
    return match.product;
  }, [barcode, catalog, productId]);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Photo access needed', 'Allow photos to add a product image.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (result.canceled || !result.assets[0]?.uri) return;
    try {
      setSaving(true);
      setImageUrl(await uploadImage(result.assets[0].uri));
    } catch (err) {
      Alert.alert('Image upload failed', apiError(err, 'Try another photo.'));
    } finally {
      setSaving(false);
    }
  };

  const onSave = async () => {
    if (!requireOnline('Saving a product')) return;
    if (!name.trim() || !price.trim()) {
      Alert.alert('Required', 'Name and selling price are required.');
      return;
    }
    const priceNum = Number(price);
    const mrpNum = mrp ? Number(mrp) : undefined;
    const total = Math.max(0, parseInt(totalStock || '0', 10) || 0);
    const online = Math.max(0, parseInt(onlineStock || '0', 10) || 0);
    if (Number.isNaN(priceNum) || priceNum <= 0) {
      Alert.alert('Price', 'Enter a valid selling price.');
      return;
    }
    if (mrpNum != null && mrpNum < priceNum) {
      Alert.alert('MRP', 'MRP cannot be lower than selling price.');
      return;
    }
    if (online > total) {
      Alert.alert('Stock', 'Online stock cannot be more than shop stock.');
      return;
    }
    const weightNum = weightKg.trim() ? Number(weightKg) : null;
    if (weightNum != null && (!Number.isFinite(weightNum) || weightNum <= 0)) {
      Alert.alert('Weight', 'Enter packed weight in kg, for example 0.25 or 1.5.');
      return;
    }
    if (duplicate) {
      Alert.alert('Barcode already used', `${storedBarcode(barcode)} is already on ${duplicate.name}. Use a different code.`);
      return;
    }
    setSaving(true);
    try {
      if (!productId) {
        const selling = await fetchSellingStatus().catch(() => null);
        if (selling && !selling.is_ready_to_sell) {
          Alert.alert(
            'Shop not live yet',
            (selling.missing_step_messages || []).join(' ') ||
              'Finish store profile, Razorpay, and subscription before adding products.',
          );
          return;
        }
      }
      await saveProduct(
        {
          name: name.trim(),
          model_name: modelName.trim(),
          description: description.trim(),
          price: priceNum,
          mrp: mrpNum ?? null,
          total_stock: total,
          online_stock: online,
          sale_type: saleType,
          category: categoryId,
          main_image_url: imageUrl || undefined,
          weight_kg: weightNum,
          sku: sku.trim(),
          barcode: storedBarcode(barcode),
          cost_price: costPrice.trim() === '' ? null : Number(costPrice),
          hsn_code: hsnCode.trim(),
          gst_rate: gstRate.trim() === '' ? null : Number(gstRate),
          show_on_homepage: saleType === 'OFFLINE' ? false : showOnHomepage,
        },
        productId,
      );
      navigation.goBack();
    } catch (err) {
      Alert.alert('Could not save', apiError(err, 'Check the details and try again.'));
    } finally {
      setSaving(false);
    }
  };

  const flatCategories = categories.flatMap((cat) => [
    cat,
    ...(cat.children || []).map((child) => ({ ...child, parent: cat.id })),
  ]);

  if (loading) {
    return <LoadingState message="Loading product…" />;
  }

  return (
    <Screen scroll keyboardAvoiding edges={['bottom']} gradient={false} statusBarStyle="light-content">
      <Header
        tone="brand"
        title={productId ? 'Edit product' : 'Add product'}
        subtitle="Keep it simple — you can change this later"
        onBack={() => navigation.goBack()}
      />
      <View style={styles.content}>
        <Input label="Product name" value={name} onChangeText={setName} placeholder="Cotton shirt" />
        <Input label="Model / variant" value={modelName} onChangeText={setModelName} placeholder="Red XL" />
        <Input
          label="Description"
          value={description}
          onChangeText={setDescription}
          placeholder="Short details for buyers"
          multiline
        />
        <Input label="Selling price" value={price} onChangeText={setPrice} keyboardType="decimal-pad" prefix="₹" />
        <Input label="MRP (optional)" value={mrp} onChangeText={setMrp} keyboardType="decimal-pad" prefix="₹" />

        <Text style={styles.label} maxFontSizeMultiplier={FONT_SCALE.body}>Barcode</Text>
        <Text style={styles.helper}>
          Create a shop sticker, or attach the barcode already printed on the packet.
        </Text>
        <Input
          label="Packet or shop code"
          value={barcode}
          onChangeText={setBarcode}
          placeholder="Scan or type the existing barcode"
          autoCapitalize="characters"
        />
        <View style={styles.row}>
          <Chip label="Scan existing" selected={false} onPress={() => setScanner(true)} />
          <Chip
            label="Create shop code"
            selected={false}
            onPress={() => setBarcode(generateShopBarcode([...takenCodes, barcode, sku]))}
          />
          {barcode ? <Chip label="Clear" selected={false} onPress={() => setBarcode('')} /> : null}
        </View>
        {duplicate ? (
          <Text style={styles.warn}>Already on {duplicate.name}. Pick another code before saving.</Text>
        ) : null}
        {storedBarcode(barcode) ? <BarcodeMark value={storedBarcode(barcode)} /> : null}

        <Input
          label="Packed weight (kg)"
          helper="Used for extra delivery charge. Checkout adds weight × quantity, then picks your delivery slab."
          value={weightKg}
          onChangeText={setWeightKg}
          keyboardType="decimal-pad"
          placeholder="0.25"
        />
        <Input label="SKU" value={sku} onChangeText={setSku} placeholder="Optional" />
        <Input label="Cost price (private)" value={costPrice} onChangeText={setCostPrice} keyboardType="decimal-pad" prefix="₹" placeholder="Optional" />
        <Input label="HSN (optional)" value={hsnCode} onChangeText={setHsnCode} placeholder="For GST invoice" />
        <Input label="GST % (optional)" value={gstRate} onChangeText={setGstRate} keyboardType="decimal-pad" placeholder="18" />
        <Input label="Shop stock" value={totalStock} onChangeText={setTotalStock} keyboardType="number-pad" />
        <Input label="Online stock" value={onlineStock} onChangeText={setOnlineStock} keyboardType="number-pad" />

        <Text style={styles.label} maxFontSizeMultiplier={FONT_SCALE.body}>Where can it sell?</Text>
        <View style={styles.row}>
          {SALE_TYPES.map((item) => (
            <Chip
              key={item.id}
              label={item.label}
              selected={saleType === item.id}
              onPress={() => {
                setSaleType(item.id);
                if (item.id === 'OFFLINE') setShowOnHomepage(false);
              }}
            />
          ))}
        </View>
        {saleType !== 'OFFLINE' ? (
          <Chip
            label={showOnHomepage ? 'On Kerala Sellers home' : 'Hidden from Kerala Sellers home'}
            selected={showOnHomepage}
            onPress={() => setShowOnHomepage((on) => !on)}
          />
        ) : null}

        {flatCategories.length > 0 ? (
          <>
            <Text style={styles.label} maxFontSizeMultiplier={FONT_SCALE.body}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
              {flatCategories.map((cat) => (
                <Chip
                  key={cat.id}
                  label={cat.name}
                  selected={categoryId === cat.id}
                  onPress={() => setCategoryId(cat.id)}
                />
              ))}
            </ScrollView>
          </>
        ) : null}

        {imageUrl ? <Image source={{ uri: imageUrl }} style={styles.image} /> : null}
        <Button label={imageUrl ? 'Change photo' : 'Add photo'} variant="secondary" onPress={pickImage} disabled={saving} />
        <Button label={productId ? 'Save changes' : 'Add product'} onPress={onSave} loading={saving} disabled={saving} />
      </View>
      <BarcodeScannerModal
        visible={scanner}
        title="Scan packet barcode"
        onClose={() => setScanner(false)}
        onScan={(code) => {
          setScanner(false);
          setBarcode(storedBarcode(code));
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: SPACING.lg },
  label: {
    ...TYPOGRAPHY.label,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  helper: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  warn: {
    ...TYPOGRAPHY.caption,
    color: COLORS.error,
    marginBottom: SPACING.sm,
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: SPACING.lg },
  image: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginBottom: SPACING.md,
    backgroundColor: COLORS.surfaceSecondary,
  },
});
