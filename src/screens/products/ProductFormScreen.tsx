import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

import {
  Button,
  Chip,
  Header,
  Input,
  LoadingState,
  Notice,
  Screen,
  BarcodeMark,
  BarcodeScannerModal,
  DescriptionEditor,
} from '../../components';
import { COLORS, FONT_SCALE, MIN_TOUCH_TARGET, RADIUS, SPACING, TYPOGRAPHY } from '../../theme';
import {
  addCategoryAttribute,
  deleteProductVariant,
  fetchCategories,
  fetchProduct,
  fetchProducts,
  fetchSellingStatus,
  saveProduct,
  saveProductVariant,
  type Category,
  type Product,
  type ProductSubImage,
} from '../../api/seller';
import { apiError } from '../../lib/format';
import { codesFromProduct, findProductByCode, generateShopBarcode, storedBarcode } from '../../lib/barcode';
import {
  SELL_UNITS,
  UNIT_ATTRIBUTE,
  attributeNames,
  compactAttributes,
  findCategory,
  seedAttributes,
  type SellUnit,
} from '../../lib/categories';
import { uploadImageAsset } from '../../lib/cloudinary';
import { descriptionIsEmpty, sanitizeDescriptionHtml } from '../../lib/htmlDescription';
import { useOnlineGuard } from '../../hooks/useOnlineGuard';
import type { MainStackScreenProps } from '../../navigation/types';
import CategoryPicker from './CategoryPicker';

const SALE_TYPES = [
  { id: 'BOTH', label: 'Online + shop' },
  { id: 'ONLINE', label: 'Online only' },
  { id: 'OFFLINE', label: 'Shop only' },
] as const;

const MAX_SUB_IMAGES = 4;

type SubImage = { url: string; public_id?: string };
type VariantDraft = {
  key: string;
  id?: number;
  name: string;
  price: string;
  total_stock: string;
  online_stock: string;
};

function newVariantKey() {
  return `v-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function emptyVariant(price = ''): VariantDraft {
  return { key: newVariantKey(), name: '', price, total_stock: '0', online_stock: '0' };
}

function parseUnit(value: unknown): SellUnit {
  const text = String(value || '').trim().toLowerCase();
  if (text === 'kg' || text === 'kilogram' || text === 'kilograms') return 'Kg';
  if (text === 'litre' || text === 'liter' || text === 'l' || text === 'ltr') return 'Litre';
  return 'Piece';
}

function subImageUrl(image: ProductSubImage): string {
  return image.cloudinary_image_url || image.image_url || image.cloudinary_url || image.thumbnail_url || '';
}

function attributesFromProduct(product: Product): Record<string, string> {
  const raw = product.attributes && typeof product.attributes === 'object' ? product.attributes : {};
  const next: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (key.toLowerCase() === UNIT_ATTRIBUTE || value == null) continue;
    next[key] = String(value);
  }
  return next;
}

export default function ProductFormScreen({ navigation, route }: MainStackScreenProps<'ProductForm'>) {
  const productId = route.params?.productId;
  const { requireOnline } = useOnlineGuard();
  const [loading, setLoading] = useState(Boolean(productId));
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
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
  const [mainImage, setMainImage] = useState<SubImage | null>(null);
  const [subImages, setSubImages] = useState<SubImage[]>([]);
  const [subImagesDirty, setSubImagesDirty] = useState(false);
  const [weightKg, setWeightKg] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState(route.params?.barcode || '');
  const [costPrice, setCostPrice] = useState('');
  const [hsnCode, setHsnCode] = useState('');
  const [gstRate, setGstRate] = useState('');
  const [showOnHomepage, setShowOnHomepage] = useState(true);
  const [unit, setUnit] = useState<SellUnit>('Piece');
  const [attributes, setAttributes] = useState<Record<string, string>>({});
  const [newAttribute, setNewAttribute] = useState('');
  const [variants, setVariants] = useState<VariantDraft[]>([]);
  const [originalVariantIds, setOriginalVariantIds] = useState<number[]>([]);
  const [moreOpen, setMoreOpen] = useState(false);
  const [scanner, setScanner] = useState(false);

  const selectedCategory = findCategory(categories, categoryId) || null;
  const busy = saving || uploading;

  useEffect(() => {
    if (!selectedCategory) return;
    setAttributes((prev) => seedAttributes(prev, attributeNames(selectedCategory)));
  }, [selectedCategory]);

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
        hydrateProduct(product);
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

  const hydrateProduct = (product: Product) => {
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
    setMainImage(
      product.main_image_url || product.thumbnail_url
        ? { url: product.main_image_url || product.thumbnail_url || '' }
        : null,
    );
    const mainUrl = product.main_image_url || product.thumbnail_url || '';
    setSubImages(
      (product.sub_images || [])
        .map((image) => ({
          url: subImageUrl(image),
          public_id: image.cloudinary_public_id || undefined,
        }))
        .filter((image) => image.url && image.url !== mainUrl)
        .slice(0, MAX_SUB_IMAGES),
    );
    setSubImagesDirty(false);
    setWeightKg(product.weight_kg != null && product.weight_kg !== '' ? String(product.weight_kg) : '');
    setSku(product.sku || '');
    setBarcode(product.barcode || route.params?.barcode || '');
    setCostPrice(product.cost_price != null && product.cost_price !== '' ? String(product.cost_price) : '');
    setHsnCode(product.hsn_code || '');
    setGstRate(product.gst_rate != null && Number(product.gst_rate) !== 0 ? String(product.gst_rate) : '');
    setShowOnHomepage(product.show_on_homepage !== false && product.sale_type !== 'OFFLINE');
    const raw = product.attributes && typeof product.attributes === 'object' ? product.attributes : {};
    setUnit(parseUnit(raw[UNIT_ATTRIBUTE] ?? raw.Unit));
    setAttributes(attributesFromProduct(product));
    const loadedVariants = (product.variants || []).filter((row) => row.is_active !== false);
    setOriginalVariantIds(loadedVariants.map((row) => row.id));
    setVariants(
      loadedVariants.map((row) => ({
        key: `id-${row.id}`,
        id: row.id,
        name: row.name || '',
        price: row.price != null && row.price !== '' ? String(row.price) : String(product.price ?? ''),
        total_stock: String(row.total_stock ?? 0),
        online_stock: String(row.online_stock ?? 0),
      })),
    );
    const optionalFilled = Boolean(
      product.model_name
        || product.mrp
        || product.barcode
        || product.sku
        || product.weight_kg
        || product.cost_price
        || product.hsn_code
        || (product.gst_rate != null && Number(product.gst_rate) !== 0),
    );
    if (optionalFilled) setMoreOpen(true);
  };

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

  const onSelectCategory = (category: Category | null) => {
    setCategoryId(category?.id ?? null);
    if (!category) return;
    setAttributes(seedAttributes({}, attributeNames(category)));
  };

  const pickImages = async (kind: 'main' | 'sub') => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Photo access needed', 'Allow photos to add product images.');
      return;
    }
    const remaining = MAX_SUB_IMAGES - subImages.length;
    if (kind === 'sub' && remaining <= 0) {
      Alert.alert('Extra photos', 'You can add 4 extra photos besides the main one.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsMultipleSelection: kind === 'sub',
      selectionLimit: kind === 'sub' ? remaining : 1,
    });
    if (result.canceled || !result.assets?.length) return;
    try {
      setUploading(true);
      setFormError('');
      const uploaded: SubImage[] = [];
      for (const asset of result.assets) {
        if (!asset.uri) continue;
        uploaded.push(await uploadImageAsset(asset.uri));
      }
      if (kind === 'main') {
        if (uploaded[0]) setMainImage(uploaded[0]);
      } else {
        setSubImages((current) => [...current, ...uploaded].slice(0, MAX_SUB_IMAGES));
        setSubImagesDirty(true);
      }
    } catch (err) {
      Alert.alert('Image upload failed', apiError(err, 'Try another photo.'));
    } finally {
      setUploading(false);
    }
  };

  const addAttribute = async () => {
    const label = newAttribute.trim();
    if (!label) {
      Alert.alert('Product detail', 'Type what this product needs, like Size, Color, or Length.');
      return;
    }
    if (label.toLowerCase() === UNIT_ATTRIBUTE) {
      Alert.alert('Product detail', 'Use Sold by for piece, kg, or litre.');
      return;
    }
    setAttributes((prev) => ({ ...prev, [label]: prev[label] ?? '' }));
    setNewAttribute('');
    if (categoryId) {
      try {
        await addCategoryAttribute(categoryId, label);
        const cats = await fetchCategories().catch(() => categories);
        setCategories(cats);
      } catch {
        // Still kept on this product even if the shared category list could not be updated.
      }
    }
  };

  const updateVariant = (key: string, patch: Partial<VariantDraft>) => {
    setVariants((current) => current.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  };

  const removeVariant = (key: string) => {
    setVariants((current) => current.filter((row) => row.key !== key));
  };

  const filledVariants = variants.filter((row) => row.name.trim());

  const onSave = async () => {
    if (!requireOnline('Saving a product')) return;
    setFormError('');
    const nextFields: Record<string, string> = {};
    if (!name.trim()) nextFields.name = 'Enter the product name.';
    if (!price.trim() || Number.isNaN(Number(price)) || Number(price) <= 0) nextFields.price = 'Enter a valid selling price.';
    if (descriptionIsEmpty(description)) nextFields.description = 'Add a product description.';
    if (!categoryId) nextFields.category = 'Pick a category.';
    if (!productId && !mainImage?.url) nextFields.image = 'Add a main photo.';
    if (mrp && Number(mrp) < Number(price)) nextFields.mrp = 'MRP cannot be lower than selling price.';
    if (Object.keys(nextFields).length) {
      setFieldErrors(nextFields);
      setFormError('Fix the highlighted fields, then save.');
      return;
    }
    setFieldErrors({});
    if (!name.trim() || !price.trim()) {
      setFormError('Name and selling price are required.');
      return;
    }
    if (descriptionIsEmpty(description)) {
      setFormError('Add a product description. Tell buyers what it is, materials or ingredients, and who it is for.');
      return;
    }
    if (!categoryId) {
      setFormError('Pick a category. Open the folders until you reach the product type.');
      return;
    }
    if (!productId && !mainImage?.url) {
      setFormError('Add a main photo. You can add up to 4 extra photos.');
      return;
    }
    const priceNum = Number(price);
    const mrpNum = mrp ? Number(mrp) : undefined;
    if (Number.isNaN(priceNum) || priceNum <= 0) {
      setFormError('Enter a valid selling price.');
      return;
    }
    if (mrpNum != null && mrpNum < priceNum) {
      setFormError('MRP cannot be lower than selling price.');
      return;
    }
    const parsedVariants = filledVariants.map((row) => {
      const variantPrice = row.price.trim() === '' ? priceNum : Number(row.price);
      const total = Math.max(0, parseInt(row.total_stock || '0', 10) || 0);
      const online = Math.max(0, parseInt(row.online_stock || '0', 10) || 0);
      return { ...row, variantPrice, total, online };
    });
    if (parsedVariants.some((row) => Number.isNaN(row.variantPrice) || row.variantPrice < 0)) {
      setFormError('Each size or pack needs a valid price.');
      return;
    }
    if (parsedVariants.some((row) => row.online > row.total)) {
      setFormError('Online stock cannot be more than shop stock on a size or pack.');
      return;
    }
    const total = parsedVariants.length
      ? parsedVariants.reduce((sum, row) => sum + row.total, 0)
      : Math.max(0, parseInt(totalStock || '0', 10) || 0);
    const online = parsedVariants.length
      ? parsedVariants.reduce((sum, row) => sum + row.online, 0)
      : Math.max(0, parseInt(onlineStock || '0', 10) || 0);
    if (online > total) {
      setFormError('Online stock cannot be more than shop stock.');
      return;
    }
    const weightNum = weightKg.trim() ? Number(weightKg) : null;
    if (weightNum != null && (!Number.isFinite(weightNum) || weightNum <= 0)) {
      setFormError('Enter packed weight in kg, for example 0.25 or 1.5.');
      return;
    }
    if (duplicate) {
      setFormError(`${storedBarcode(barcode)} is already on ${duplicate.name}. Use a different code.`);
      return;
    }
    setSaving(true);
    try {
      if (!productId) {
        const selling = await fetchSellingStatus().catch(() => null);
        if (selling && !selling.is_ready_to_sell) {
          setFormError(
            (selling.missing_step_messages || []).join(' ')
              || 'Finish store profile, Razorpay, and subscription before adding products.',
          );
          return;
        }
      }
      const saved = await saveProduct(
        {
          name: name.trim(),
          model_name: modelName.trim(),
          description: sanitizeDescriptionHtml(description),
          price: priceNum,
          mrp: mrpNum ?? null,
          total_stock: total,
          online_stock: online,
          sale_type: saleType,
          category: categoryId,
          attributes: compactAttributes(attributes, unit),
          main_image_url: mainImage?.url || undefined,
          ...((!productId || subImagesDirty)
            ? {
                sub_image_urls: subImages.map((image) => ({
                  url: image.url,
                  public_id: image.public_id,
                })),
              }
            : {}),
          weight_kg: weightNum,
          sku: sku.trim(),
          barcode: storedBarcode(barcode),
          cost_price: costPrice.trim() === '' ? null : Number(costPrice),
          hsn_code: hsnCode.trim(),
          gst_rate: gstRate.trim() === '' || Number.isNaN(Number(gstRate)) ? 0 : Number(gstRate),
          show_on_homepage: saleType === 'OFFLINE' ? false : showOnHomepage,
        },
        productId,
      );
      const keptIds = new Set(parsedVariants.map((row) => row.id).filter((id): id is number => Boolean(id)));
      for (const id of originalVariantIds) {
        if (!keptIds.has(id)) {
          await deleteProductVariant(saved.id, id).catch(() => undefined);
        }
      }
      for (const row of parsedVariants) {
        await saveProductVariant(
          saved.id,
          {
            name: row.name.trim(),
            price: row.variantPrice,
            total_stock: row.total,
            online_stock: row.online,
          },
          row.id,
        );
      }
      navigation.goBack();
    } catch (err) {
      const message = apiError(err, 'Check the details and try again.');
      setFormError(message);
      Alert.alert('Could not save', message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingState message="Loading product…" />;
  }

  const attributeKeys = Object.keys(attributes);

  return (
    <Screen scroll keyboardAvoiding edges={['bottom']} gradient={false} statusBarStyle="light-content">
      <Header
        tone="brand"
        title={productId ? 'Edit product' : 'Add product'}
        subtitle="Name, description, price, category, and photos first — GST and similar stay folded below"
        onBack={() => navigation.goBack()}
      />
      <View style={styles.content}>
        {formError ? <Notice title="Fix this to save" message={formError} tone="warning" /> : null}

        <Input label="Product name *" value={name} onChangeText={(text) => { setName(text); setFieldErrors((p) => ({ ...p, name: '' })); }} error={fieldErrors.name} placeholder="Cotton shorts" />
        <DescriptionEditor value={description} onChange={(html) => { setDescription(html); setFieldErrors((p) => ({ ...p, description: '' })); }} />
        {fieldErrors.description ? <Text style={styles.error}>{fieldErrors.description}</Text> : null}
        <Input label="Selling price *" value={price} onChangeText={(text) => { setPrice(text); setFieldErrors((p) => ({ ...p, price: '' })); }} error={fieldErrors.price} keyboardType="decimal-pad" prefix="₹" />
        {fieldErrors.category ? <Text style={styles.error}>{fieldErrors.category}</Text> : null}
        {fieldErrors.image ? <Text style={styles.error}>{fieldErrors.image}</Text> : null}

        <Text style={styles.label} maxFontSizeMultiplier={FONT_SCALE.body}>Where can it sell? *</Text>
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

        <CategoryPicker
          categories={categories}
          selectedId={categoryId}
          onSelect={onSelectCategory}
          onCategoriesChanged={setCategories}
        />

        <Text style={styles.label} maxFontSizeMultiplier={FONT_SCALE.body}>Sold by</Text>
        <Text style={styles.helper}>Piece for clothes and counted items. Kg or litre for grocery and liquids.</Text>
        <View style={styles.row}>
          {SELL_UNITS.map((item) => (
            <Chip key={item} label={item} selected={unit === item} onPress={() => setUnit(item)} />
          ))}
        </View>

        {selectedCategory || attributeKeys.length > 0 ? (
          <>
            <Text style={styles.label} maxFontSizeMultiplier={FONT_SCALE.body}>
              {selectedCategory ? `${selectedCategory.name} details` : 'Product details'}
            </Text>
            <Text style={styles.helper}>Fill size, color, length, or any detail this type needs. Add a missing one below.</Text>
            {attributeKeys.map((key) => (
              <Input
                key={key}
                label={key}
                value={attributes[key]}
                onChangeText={(value) => setAttributes((prev) => ({ ...prev, [key]: value }))}
                placeholder={`Enter ${key.toLowerCase()}`}
              />
            ))}
            <Input
              label="Add a missing detail"
              value={newAttribute}
              onChangeText={setNewAttribute}
              placeholder="Length, Material, Flavour…"
            />
            <Button label="Add this detail" variant="secondary" size="sm" onPress={addAttribute} disabled={busy} />
          </>
        ) : null}

        <Text style={styles.label} maxFontSizeMultiplier={FONT_SCALE.body}>Sizes, colors, or packs</Text>
        <Text style={styles.helper}>
          Use this when one product has more than one option — Red / XL, 32 waist, 1 kg, 500 ml. Skip if it has one price and stock.
        </Text>
        {variants.map((row) => (
          <View key={row.key} style={styles.variant}>
            <Input
              label="Option name"
              value={row.name}
              onChangeText={(value) => updateVariant(row.key, { name: value })}
              placeholder={unit === 'Kg' ? '1 kg' : unit === 'Litre' ? '500 ml' : 'Red / XL'}
            />
            <View style={styles.split}>
              <View style={styles.splitItem}>
                <Input
                  label="Price"
                  value={row.price}
                  onChangeText={(value) => updateVariant(row.key, { price: value })}
                  keyboardType="decimal-pad"
                  prefix="₹"
                />
              </View>
              <View style={styles.splitItem}>
                <Input
                  label="Shop stock"
                  value={row.total_stock}
                  onChangeText={(value) => updateVariant(row.key, { total_stock: value })}
                  keyboardType="number-pad"
                />
              </View>
              <View style={styles.splitItem}>
                <Input
                  label="Online"
                  value={row.online_stock}
                  onChangeText={(value) => updateVariant(row.key, { online_stock: value })}
                  keyboardType="number-pad"
                />
              </View>
            </View>
            <Button label="Remove option" variant="ghost" size="sm" onPress={() => removeVariant(row.key)} />
          </View>
        ))}
        <Button
          label="Add size / pack"
          variant="secondary"
          size="sm"
          onPress={() => setVariants((current) => [...current, emptyVariant(price)])}
          disabled={busy}
        />

        {filledVariants.length === 0 ? (
          <>
            <Input label="Shop stock *" value={totalStock} onChangeText={setTotalStock} keyboardType="number-pad" />
            <Input label="Online stock" value={onlineStock} onChangeText={setOnlineStock} keyboardType="number-pad" />
          </>
        ) : (
          <Text style={styles.helper}>Shop and online stock are taken from the options above.</Text>
        )}

        <Text style={styles.label} maxFontSizeMultiplier={FONT_SCALE.body}>Photos *</Text>
        <Text style={styles.helper}>1 main photo, plus up to 4 extra angles. Same as the website.</Text>
        {mainImage?.url ? <Image source={{ uri: mainImage.url }} style={styles.mainImage} /> : null}
        <Button
          label={mainImage ? 'Change main photo' : 'Add main photo'}
          variant="secondary"
          onPress={() => pickImages('main')}
          disabled={busy}
        />
        <View style={styles.thumbs}>
          {subImages.map((image, index) => (
            <View key={`${image.url}-${index}`} style={styles.thumbWrap}>
              <Image source={{ uri: image.url }} style={styles.thumb} />
              <TouchableOpacity
                style={styles.thumbRemove}
                onPress={() => {
                  setSubImages((current) => current.filter((_, item) => item !== index));
                  setSubImagesDirty(true);
                }}
                accessibilityRole="button"
                accessibilityLabel="Remove extra photo"
              >
                <Ionicons name="close" size={14} color={COLORS.onPrimary} />
              </TouchableOpacity>
            </View>
          ))}
          {subImages.length < MAX_SUB_IMAGES ? (
            <TouchableOpacity
              style={styles.thumbAdd}
              onPress={() => pickImages('sub')}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel="Add extra photo"
            >
              <Ionicons name="add" size={22} color={COLORS.primary} />
              <Text style={styles.thumbAddLabel}>{subImages.length}/{MAX_SUB_IMAGES}</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <TouchableOpacity
          style={styles.moreHeader}
          onPress={() => setMoreOpen((open) => !open)}
          accessibilityRole="button"
          accessibilityState={{ expanded: moreOpen }}
        >
          <View style={styles.moreCopy}>
            <Text style={styles.moreTitle}>More details (optional)</Text>
            <Text style={styles.helper}>Barcode, weight, GST, and similar fields. Open only if you need them.</Text>
          </View>
          <Ionicons name={moreOpen ? 'chevron-up' : 'chevron-down'} size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>

        {moreOpen ? (
          <View style={styles.moreBody}>
            <Input label="Model / variant name" value={modelName} onChangeText={setModelName} placeholder="Red XL" />
            <Input label="MRP" value={mrp} onChangeText={setMrp} keyboardType="decimal-pad" prefix="₹" />
            <Text style={styles.label} maxFontSizeMultiplier={FONT_SCALE.body}>Barcode</Text>
            <Text style={styles.helper}>Create a shop sticker, or attach the barcode already printed on the packet.</Text>
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
            <Input label="HSN" value={hsnCode} onChangeText={setHsnCode} placeholder="For GST invoice" />
            <Input
              label="GST % (optional)"
              helper="Leave blank if this product has no GST. Blank is saved as 0."
              value={gstRate}
              onChangeText={setGstRate}
              keyboardType="decimal-pad"
              placeholder="18"
            />
            {saleType !== 'OFFLINE' ? (
              <Chip
                label={showOnHomepage ? 'On Kerala Sellers home' : 'Hidden from Kerala Sellers home'}
                selected={showOnHomepage}
                onPress={() => setShowOnHomepage((on) => !on)}
              />
            ) : null}
          </View>
        ) : null}

        <Button
          label={productId ? 'Save changes' : 'Add product'}
          onPress={onSave}
          loading={saving}
          disabled={busy}
        />
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
  content: { padding: SPACING.lg, gap: SPACING.sm },
  label: {
    ...TYPOGRAPHY.label,
    color: COLORS.textPrimary,
    marginTop: SPACING.sm,
  },
  helper: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  error: {
    ...TYPOGRAPHY.caption,
    color: COLORS.error,
  },
  warn: {
    ...TYPOGRAPHY.caption,
    color: COLORS.error,
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: SPACING.sm },
  variant: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    backgroundColor: COLORS.surface,
    gap: SPACING.xs,
  },
  split: { flexDirection: 'row', gap: SPACING.sm },
  splitItem: { flex: 1 },
  mainImage: {
    width: '100%',
    height: 180,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceSecondary,
  },
  thumbs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  thumbWrap: { position: 'relative' },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceSecondary,
  },
  thumbRemove: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbAdd: {
    width: 72,
    height: 72,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    minHeight: MIN_TOUCH_TARGET,
  },
  thumbAddLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  moreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.md,
    minHeight: MIN_TOUCH_TARGET,
  },
  moreCopy: { flex: 1, gap: 2 },
  moreTitle: {
    ...TYPOGRAPHY.bodyStrong,
    color: COLORS.textPrimary,
  },
  moreBody: { gap: SPACING.sm, marginBottom: SPACING.md },
});
