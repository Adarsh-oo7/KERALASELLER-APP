
// src/screens/products/AddProductScreen.tsx
// import React, { useState, useRef } from 'react';
// import {
//   View, Text, ScrollView, TouchableOpacity, StyleSheet,
//   ActivityIndicator, KeyboardAvoidingView, Platform, Animated,
// } from 'react-native';
// import { StackNavigationProp } from '@react-navigation/stack';
// import { Ionicons } from '@expo/vector-icons';
// import { useSafeAreaInsets } from 'react-native-safe-area-context';

// import BasicInfoComponent        from '../../components/products/BasicInfoComponent';
// import StockManagementComponent  from '../../components/products/StockManagementComponent';
// import CategorySelectorComponent from '../../components/products/CategorySelectorComponent';
// import ImageUploadComponent      from '../../components/products/ImageUploadComponent';
// import ProductService            from '../../services/ProductService';

// type Props = {
//   navigation: StackNavigationProp<any>;
//   route?: { params?: { product?: any } };
// };

// interface ProductFormData {
//   name:        string;
//   model_name:  string;
//   description: string;
//   price:       string;
//   mrp:         string;
//   total_stock:   number;
//   online_stock:  number;
//   sale_type:   'BOTH' | 'ONLINE' | 'OFFLINE';
//   category:    number | null;
//   attributes:  Record<string, string>;
//   sku?:        string;
// }

// // ── Cloudinary ────────────────────────────────────────────────────────────────

// const CLD = {
//   cloud_name:    'dnmbfeckd',
//   upload_preset: 'kerala_sellers_preset',
//   fallbacks:     ['ml_default', 'kerala_sellers_unsigned', 'unsigned_preset'],
// };

// const uploadToCloudinary = async (
//   uri: string,
//   type: 'main' | 'sub' = 'main',
//   onProgress?: (n: number) => void,
// ): Promise<{ url: string; public_id: string }> => {
//   const presets = [CLD.upload_preset, ...CLD.fallbacks];
//   let lastErr: Error | null = null;

//   for (let i = 0; i < presets.length; i++) {
//     try {
//       const fd = new FormData();
//       fd.append('file', { uri: uri.trim().replace(/^fiile:\/\//, 'file://'), type: 'image/jpeg', name: `product_${type}_${Date.now()}.jpg` } as any);
//       fd.append('upload_preset', presets[i]);
//       fd.append('cloud_name',    CLD.cloud_name);
//       fd.append('folder',        `kerala-sellers/products/${type}`);

//       const res: any = await new Promise((resolve, reject) => {
//         const xhr = new XMLHttpRequest();
//         xhr.upload.onprogress = e => e.lengthComputable && onProgress?.(Math.round((e.loaded / e.total) * 99));
//         xhr.onload    = () => xhr.status < 300 ? resolve(JSON.parse(xhr.responseText)) : reject(new Error(`${xhr.status}`));
//         xhr.onerror   = () => reject(new Error('Network error'));
//         xhr.ontimeout = () => reject(new Error('Timeout'));
//         xhr.timeout   = 60_000;
//         xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLD.cloud_name}/image/upload`);
//         xhr.send(fd);
//       });

//       onProgress?.(100);
//       return { url: res.secure_url, public_id: res.public_id };
//     } catch (e: any) {
//       lastErr = e;
//       if (i < presets.length - 1) await new Promise(r => setTimeout(r, 1_000));
//     }
//   }
//   throw new Error(`Upload failed: ${lastErr?.message}`);
// };

// // ── Helpers ───────────────────────────────────────────────────────────────────

// const extractCategoryId = (p: any): number | null => {
//   if (!p) return null;
//   if (typeof p.category === 'number') return p.category;
//   if (p.category?.id) return p.category.id;
//   if (p.category_id) return p.category_id;
//   if (typeof p.category === 'string' && !isNaN(parseInt(p.category))) return parseInt(p.category);
//   return null;
// };

// const extractAttributes = (p: any): Record<string, string> => {
//   if (!p) return {};
//   if (p.attributes && typeof p.attributes === 'object' && !Array.isArray(p.attributes)) return p.attributes;
//   if (typeof p.attributes === 'string') { try { return JSON.parse(p.attributes) || {}; } catch { return {}; } }
//   return {};
// };

// // ── Steps ─────────────────────────────────────────────────────────────────────

// const STEPS = [
//   { icon: 'document-text-outline' as const, label: 'Info',     sub: 'Name & price' },
//   { icon: 'cube-outline'          as const, label: 'Stock',    sub: 'Inventory' },
//   { icon: 'pricetags-outline'     as const, label: 'Category', sub: 'Classification' },
//   { icon: 'camera-outline'        as const, label: 'Images',   sub: 'Photos' },
// ];

// // ── Component ─────────────────────────────────────────────────────────────────

// const AddProductScreen: React.FC<Props> = ({ navigation, route }) => {
//   const insets           = useSafeAreaInsets();
//   const existingProduct  = route?.params?.product;
//   const isEditing        = !!existingProduct;

//   const [formData, setFormData] = useState<ProductFormData>({
//     name:         existingProduct?.name          || '',
//     model_name:   existingProduct?.model_name    || '',
//     description:  existingProduct?.description   || '',
//     price:        existingProduct?.price?.toString() || '',
//     mrp:          existingProduct?.mrp?.toString()   || '',
//     total_stock:  existingProduct?.total_stock   ?? 0,
//     online_stock: existingProduct?.online_stock  ?? 0,
//     sale_type:    existingProduct?.sale_type      || 'BOTH',
//     category:     extractCategoryId(existingProduct),
//     attributes:   extractAttributes(existingProduct),
//     sku:          existingProduct?.sku            || '',
//   });

//   const [mainImage,         setMainImage]         = useState('');
//   const [subImages,         setSubImages]         = useState<string[]>([]);
//   const [existingMainImage] = useState(existingProduct?.main_image_url || '');
//   const [existingSubImages] = useState<string[]>(
//     existingProduct?.sub_images?.map((i: any) => i.image_url || i.url) || []
//   );
//   const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
//   const [isUploading,    setIsUploading]    = useState(false);
//   const [isSubmitting,   setIsSubmitting]   = useState(false);
//   const [currentStep,    setCurrentStep]    = useState(1);
//   const [errors,         setErrors]         = useState<Record<string, string>>({});
//   const [submitError,    setSubmitError]    = useState('');

//   const slideAnim = useRef(new Animated.Value(0)).current;

//   // ── Transitions ───────────────────────────────────────────────────────────

//   const animateStep = (next: number) => {
//     const dir = next > currentStep ? 40 : -40;
//     slideAnim.setValue(dir);
//     setCurrentStep(next);
//     Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 120, friction: 9 }).start();
//   };

//   // ── Derived ───────────────────────────────────────────────────────────────

//   const discount = (() => {
//     const mrp = parseFloat(formData.mrp), price = parseFloat(formData.price);
//     if (mrp > price && !isNaN(mrp) && !isNaN(price))
//       return { amount: mrp - price, pct: Math.round(((mrp - price) / mrp) * 100) };
//     return null;
//   })();

//   const canGoNext = (): boolean => {
//     switch (currentStep) {
//       case 1: return !!(formData.name.trim() && formData.price && parseFloat(formData.price) > 0);
//       case 2: return formData.online_stock >= 0 && formData.total_stock >= 0 && formData.online_stock <= formData.total_stock;
//       case 3: return formData.category !== null;
//       case 4: return !!(mainImage || existingMainImage);
//       default: return false;
//     }
//   };

//   // ── Handlers ──────────────────────────────────────────────────────────────

//   const updateFormData = (updates: Partial<ProductFormData>) => {
//     setFormData(prev => {
//       const next = { ...prev, ...updates };
//       if (updates.total_stock !== undefined && updates.total_stock < prev.online_stock)
//         next.online_stock = updates.total_stock;
//       return next;
//     });
//     const cleaned = { ...errors };
//     Object.keys(updates).forEach(k => { delete cleaned[k]; if (k === 'total_stock' || k === 'online_stock') delete cleaned.stock; });
//     setErrors(cleaned);
//     setSubmitError('');
//   };

//   const validateForm = (): boolean => {
//     const e: Record<string, string> = {};
//     if (!formData.name.trim())                                          e.name      = 'Product name is required';
//     else if (formData.name.length < 3)                                  e.name      = 'Name must be at least 3 characters';
//     if (!formData.price || parseFloat(formData.price) <= 0)             e.price     = 'Valid price is required';
//     if (formData.mrp && parseFloat(formData.mrp) < parseFloat(formData.price)) e.mrp = 'MRP must be ≥ selling price';
//     if (formData.online_stock > formData.total_stock)                   e.online_stock = 'Online stock cannot exceed total stock';
//     if (!formData.category)                                             e.category  = 'Please select a category';
//     if (!isEditing && !mainImage && !existingMainImage)                 e.mainImage = 'Main product image is required';
//     setErrors(e);
//     return Object.keys(e).length === 0;
//   };

//   const uploadImages = async () => {
//     const result: { main_image_url?: string; sub_image_urls?: { url: string; public_id: string }[] } = {};
//     setIsUploading(true);
//     try {
//       if (mainImage) {
//         const r = await uploadToCloudinary(mainImage, 'main', p => setUploadProgress(prev => ({ ...prev, main: p })));
//         result.main_image_url = r.url;
//       }
//       if (subImages.length > 0) {
//         result.sub_image_urls = [];
//         for (let i = 0; i < subImages.length; i++) {
//           const r = await uploadToCloudinary(subImages[i], 'sub', p => setUploadProgress(prev => ({ ...prev, [`sub_${i}`]: p })));
//           result.sub_image_urls!.push(r);
//         }
//       }
//     } finally {
//       setIsUploading(false);
//       setUploadProgress({});
//     }
//     return result;
//   };

//   const handleSubmit = async () => {
//     setSubmitError('');
//     if (!validateForm()) {
//       setSubmitError(Object.values(errors)[0] || 'Please fix the errors and try again');
//       return;
//     }
//     setIsSubmitting(true);
//     try {
//       const imageUrls = (mainImage || subImages.length > 0) ? await uploadImages() : {};
//       const payload: any = {
//         name:         formData.name.trim(),
//         model_name:   formData.model_name.trim(),
//         description:  formData.description.trim(),
//         price:        parseFloat(formData.price),
//         mrp:          parseFloat(formData.mrp || formData.price),
//         total_stock:  parseInt(formData.total_stock.toString()),
//         online_stock: parseInt(formData.online_stock.toString()),
//         sale_type:    formData.sale_type,
//         category:     formData.category,
//         attributes:   formData.attributes || {},
//       };
//       if (formData.sku?.trim())                  payload.sku             = formData.sku.trim();
//       if (imageUrls.main_image_url)              payload.main_image_url  = imageUrls.main_image_url;
//       if (imageUrls.sub_image_urls?.length)      payload.sub_image_urls  = imageUrls.sub_image_urls;

//       if (isEditing) {
//         await ProductService.updateProductWithoutImages(existingProduct.id, payload);
//       } else {
//         await ProductService.createProductWithoutImages(payload);
//       }

//       navigation.reset({ index: 0, routes: [{ name: 'MainTabs', params: { screen: 'Products' } }] });
//     } catch (e: any) {
//       setSubmitError(
//         e.message?.includes('upload')  ? 'Image upload failed. Check your connection.' :
//         e.message?.includes('Network') ? 'Network error. Please try again.' :
//         e.message || 'Something went wrong. Please try again.'
//       );
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   // ── Render ────────────────────────────────────────────────────────────────

//   return (
//     <KeyboardAvoidingView
//       style={[s.screen, { paddingTop: insets.top }]}
//       behavior={Platform.OS === 'ios' ? 'padding' : undefined}
//     >

//       {/* ── Header ── */}
//       <View style={s.header}>
//         <TouchableOpacity
//           style={s.headerBackBtn}
//           onPress={() => currentStep > 1 ? animateStep(currentStep - 1) : navigation.goBack()}
//           hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
//         >
//           <Ionicons name="arrow-back" size={20} color="#374151" />
//         </TouchableOpacity>

//         <View style={s.headerMid}>
//           <Text style={s.headerTitle}>{isEditing ? 'Edit Product' : 'Add Product'}</Text>
//           <Text style={s.headerSub}>{STEPS[currentStep - 1].label} · {STEPS[currentStep - 1].sub}</Text>
//         </View>

//         <View style={s.stepBadge}>
//           <Text style={s.stepBadgeText}>{currentStep} / 4</Text>
//         </View>
//       </View>

//       {/* ── Progress bar ── */}
//       <View style={s.progressTrack}>
//         <Animated.View style={[s.progressFill, { width: `${(currentStep / 4) * 100}%` }]} />
//       </View>

//       {/* ── Step indicator ── */}
//       <View style={s.stepsRow}>
//         {STEPS.map((step, i) => {
//           const n      = i + 1;
//           const done   = currentStep > n;
//           const active = currentStep === n;
//           return (
//             <React.Fragment key={n}>
//               <View style={s.stepItem}>
//                 <View style={[s.stepDot, done && s.stepDotDone, active && s.stepDotActive]}>
//                   {done
//                     ? <Ionicons name="checkmark" size={13} color="white" />
//                     : <Ionicons name={step.icon} size={14} color={active ? 'white' : '#9ca3af'} />
//                   }
//                 </View>
//                 <Text style={[s.stepLabel, active && s.stepLabelActive, done && s.stepLabelDone]}>
//                   {step.label}
//                 </Text>
//               </View>
//               {i < 3 && <View style={[s.stepConnector, done && s.stepConnectorDone]} />}
//             </React.Fragment>
//           );
//         })}
//       </View>

//       {/* ── Content ── */}
//       <ScrollView
//         style={s.scroll}
//         contentContainerStyle={s.scrollContent}
//         keyboardShouldPersistTaps="handled"
//         showsVerticalScrollIndicator={false}
//       >
//         <Animated.View style={{ transform: [{ translateX: slideAnim }] }}>

//           {/* Submit error banner */}
//           {!!submitError && (
//             <View style={s.submitError}>
//               <Ionicons name="alert-circle" size={15} color="#991b1b" />
//               <Text style={s.submitErrorText}>{submitError}</Text>
//             </View>
//           )}

//           {/* Step 1 */}
//           {currentStep === 1 && (
//             <>
//               <BasicInfoComponent formData={formData} updateFormData={updateFormData} errors={errors} />
//               {discount && (
//                 <View style={s.discountCard}>
//                   <View style={s.discountIconWrap}>
//                     <Ionicons name="pricetag" size={18} color="#059669" />
//                   </View>
//                   <View style={{ flex: 1 }}>
//                     <Text style={s.discountTitle}>{discount.pct}% discount for customers</Text>
//                     <Text style={s.discountSub}>Customers save ₹{discount.amount.toLocaleString('en-IN')} per unit</Text>
//                   </View>
//                 </View>
//               )}
//             </>
//           )}

//           {/* Step 2 */}
//           {currentStep === 2 && (
//             <StockManagementComponent formData={formData} updateFormData={updateFormData} errors={errors} />
//           )}

//           {/* Step 3 */}
//           {currentStep === 3 && (
//             <CategorySelectorComponent
//               selectedCategory={formData.category}
//               onCategorySelect={(id: number) => updateFormData({ category: id })}
//               onAttributesChange={(attrs: Record<string, string>) => updateFormData({ attributes: attrs })}
//               error={errors.category}
//               existingAttributes={formData.attributes}
//             />
//           )}

//           {/* Step 4 */}
//           {currentStep === 4 && (
//             <>
//               <ImageUploadComponent
//                 mainImage={mainImage}
//                 subImages={subImages}
//                 existingMainImage={existingMainImage}
//                 existingSubImages={existingSubImages}
//                 onMainImageChange={setMainImage}
//                 onSubImagesChange={(imgs: string[]) => {
//                   if (imgs.length <= 4) setSubImages(imgs);
//                 }}
//                 maxSubImages={4}
//                 error={errors.mainImage}
//               />

//               {/* Upload progress */}
//               {isUploading && (
//                 <View style={s.uploadCard}>
//                   <View style={s.uploadCardHeader}>
//                     <ActivityIndicator size="small" color="#3b82f6" />
//                     <Text style={s.uploadCardTitle}>Uploading images…</Text>
//                   </View>
//                   {Object.entries(uploadProgress).map(([key, pct]) => (
//                     <View key={key} style={s.uploadRow}>
//                       <View style={s.uploadRowTop}>
//                         <Text style={s.uploadRowLabel}>
//                           {key === 'main' ? 'Main image' : `Image ${parseInt(key.split('_')[1]) + 1}`}
//                         </Text>
//                         <Text style={s.uploadRowPct}>{pct}%</Text>
//                       </View>
//                       <View style={s.uploadTrack}>
//                         <View style={[s.uploadFill, { width: `${pct}%` }]} />
//                       </View>
//                     </View>
//                   ))}
//                 </View>
//               )}
//             </>
//           )}

//         </Animated.View>
//       </ScrollView>

//       {/* ── Footer ── */}
//       <View style={[s.footer, { paddingBottom: insets.bottom + 12 }]}>
//         {currentStep > 1 ? (
//           <TouchableOpacity style={s.backFooterBtn} onPress={() => animateStep(currentStep - 1)}>
//             <Ionicons name="chevron-back" size={17} color="#6b7280" />
//             <Text style={s.backFooterText}>Back</Text>
//           </TouchableOpacity>
//         ) : (
//           <View style={s.backFooterBtn} />
//         )}

//         {currentStep < 4 ? (
//           <TouchableOpacity
//             style={[s.nextBtn, !canGoNext() && s.btnDisabled]}
//             onPress={() => canGoNext() && animateStep(currentStep + 1)}
//             disabled={!canGoNext()}
//             activeOpacity={0.85}
//           >
//             <Text style={[s.nextBtnText, !canGoNext() && s.btnTextDisabled]}>Continue</Text>
//             <Ionicons name="chevron-forward" size={17} color={canGoNext() ? 'white' : '#9ca3af'} />
//           </TouchableOpacity>
//         ) : (
//           <TouchableOpacity
//             style={[s.submitBtn, (isSubmitting || isUploading || !canGoNext()) && s.btnDisabled]}
//             onPress={handleSubmit}
//             disabled={isSubmitting || isUploading || !canGoNext()}
//             activeOpacity={0.85}
//           >
//             {isSubmitting || isUploading ? (
//               <><ActivityIndicator size="small" color="white" /><Text style={s.submitBtnText}>{isUploading ? 'Uploading…' : isEditing ? 'Updating…' : 'Creating…'}</Text></>
//             ) : (
//               <><Ionicons name={isEditing ? 'checkmark-circle' : 'add-circle'} size={18} color="white" /><Text style={s.submitBtnText}>{isEditing ? 'Update Product' : 'Create Product'}</Text></>
//             )}
//           </TouchableOpacity>
//         )}
//       </View>

//     </KeyboardAvoidingView>
//   );
// };

// // ── Styles ────────────────────────────────────────────────────────────────────

// const s = StyleSheet.create({
//   screen:           { flex: 1, backgroundColor: '#f1f5f9' },

//   // Header
//   header:           { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'white',
//                       paddingHorizontal: 16, paddingVertical: 13,
//                       borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
//                       ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 }, android: { elevation: 2 } }) },
//   headerBackBtn:    { width: 36, height: 36, borderRadius: 10, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' },
//   headerMid:        { flex: 1 },
//   headerTitle:      { fontSize: 16, fontWeight: '800', color: '#111827' },
//   headerSub:        { fontSize: 11, color: '#9ca3af', marginTop: 1 },
//   stepBadge:        { backgroundColor: '#eff6ff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
//   stepBadgeText:    { fontSize: 12, fontWeight: '700', color: '#3b82f6' },

//   // Progress bar
//   progressTrack:    { height: 3, backgroundColor: '#e5e7eb' },
//   progressFill:     { height: 3, backgroundColor: '#3b82f6' },

//   // Step indicator
//   stepsRow:         { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
//   stepItem:         { alignItems: 'center', gap: 5 },
//   stepDot:          { width: 34, height: 34, borderRadius: 17, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#e5e7eb' },
//   stepDotActive:    { backgroundColor: '#3b82f6', borderColor: '#3b82f6',
//                       shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 3 },
//   stepDotDone:      { backgroundColor: '#10b981', borderColor: '#10b981' },
//   stepLabel:        { fontSize: 9, color: '#9ca3af', fontWeight: '600', textAlign: 'center' },
//   stepLabelActive:  { color: '#3b82f6', fontWeight: '700' },
//   stepLabelDone:    { color: '#10b981' },
//   stepConnector:    { flex: 1, height: 2, backgroundColor: '#e5e7eb', marginBottom: 14 },
//   stepConnectorDone:{ backgroundColor: '#10b981' },

//   // Scroll
//   scroll:           { flex: 1 },
//   scrollContent:    { padding: 16, paddingBottom: 32 },

//   // Submit error banner
//   submitError:      { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fef2f2',
//                       borderWidth: 1, borderColor: '#fecaca', borderRadius: 12, padding: 12, marginBottom: 14 },
//   submitErrorText:  { flex: 1, fontSize: 13, color: '#991b1b', fontWeight: '500' },

//   // Discount card
//   discountCard:     { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#f0fdf4',
//                       borderRadius: 12, padding: 14, marginTop: 14, borderWidth: 1, borderColor: '#bbf7d0' },
//   discountIconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#dcfce7', justifyContent: 'center', alignItems: 'center' },
//   discountTitle:    { fontSize: 13, fontWeight: '700', color: '#15803d' },
//   discountSub:      { fontSize: 12, color: '#16a34a', marginTop: 2 },

//   // Upload progress card
//   uploadCard:       { backgroundColor: 'white', borderRadius: 14, padding: 16, marginTop: 14, gap: 12,
//                       borderWidth: 1, borderColor: '#e5e7eb',
//                       shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
//   uploadCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
//   uploadCardTitle:  { fontSize: 13, fontWeight: '600', color: '#374151' },
//   uploadRow:        { gap: 6 },
//   uploadRowTop:     { flexDirection: 'row', justifyContent: 'space-between' },
//   uploadRowLabel:   { fontSize: 12, color: '#6b7280', fontWeight: '500' },
//   uploadRowPct:     { fontSize: 12, fontWeight: '700', color: '#3b82f6' },
//   uploadTrack:      { height: 5, backgroundColor: '#e5e7eb', borderRadius: 3, overflow: 'hidden' },
//   uploadFill:       { height: 5, backgroundColor: '#3b82f6', borderRadius: 3 },

//   // Footer
//   footer:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
//                       backgroundColor: 'white', paddingHorizontal: 16, paddingTop: 12,
//                       borderTopWidth: 1, borderTopColor: '#e5e7eb', gap: 10,
//                       ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.06, shadowRadius: 4 }, android: { elevation: 4 } }) },
//   backFooterBtn:    { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 16,
//                       paddingVertical: 12, borderRadius: 12, backgroundColor: '#f3f4f6', minWidth: 84, justifyContent: 'center' },
//   backFooterText:   { fontSize: 14, fontWeight: '600', color: '#6b7280' },
//   nextBtn:          { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
//                       backgroundColor: '#3b82f6', paddingVertical: 13, borderRadius: 12,
//                       shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4 },
//   nextBtnText:      { fontSize: 15, fontWeight: '700', color: 'white' },
//   submitBtn:        { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
//                       backgroundColor: '#10b981', paddingVertical: 13, borderRadius: 12,
//                       shadowColor: '#10b981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4 },
//   submitBtnText:    { fontSize: 15, fontWeight: '700', color: 'white' },
//   btnDisabled:      { backgroundColor: '#e5e7eb', shadowOpacity: 0, elevation: 0 },
//   btnTextDisabled:  { color: '#9ca3af' },
// });// src/screens/products/AddProductScreen.tsx
// src/screens/products/AddProductScreen.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, Animated,
  StatusBar,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BasicInfoComponent        from '../../components/products/BasicInfoComponent';
import StockManagementComponent  from '../../components/products/StockManagementComponent';
import CategorySelectorComponent from '../../components/products/CategorySelectorComponent';
import ImageUploadComponent      from '../../components/products/ImageUploadComponent';
import ProductService            from '../../services/ProductService';

type Props = {
  navigation: StackNavigationProp<any>;
  route?: { params?: { product?: any } };
};

interface ProductFormData {
  name:         string;
  model_name:   string;
  description:  string;
  price:        string;
  mrp:          string;
  total_stock:  number;
  online_stock: number;
  sale_type:    'BOTH' | 'ONLINE' | 'OFFLINE';
  category:     number | null;
  attributes:   Record<string, string>;
  sku?:         string;
}

const CLD = {
  cloud_name:    'dnmbfeckd',
  upload_preset: 'kerala_sellers_preset',
  fallbacks:     ['ml_default', 'kerala_sellers_unsigned', 'unsigned_preset'],
};

const uploadToCloudinary = async (
  uri: string,
  type: 'main' | 'sub' = 'main',
  onProgress?: (n: number) => void,
): Promise<{ url: string; public_id: string }> => {
  const presets = [CLD.upload_preset, ...CLD.fallbacks];
  let lastErr: Error | null = null;
  for (let i = 0; i < presets.length; i++) {
    try {
      const fd = new FormData();
      fd.append('file', {
        uri: uri.trim().replace(/^fiile:\/\//, 'file://'),
        type: 'image/jpeg',
        name: `product_${type}_${Date.now()}.jpg`,
      } as any);
      fd.append('upload_preset', presets[i]);
      fd.append('cloud_name',    CLD.cloud_name);
      fd.append('folder',        `kerala-sellers/products/${type}`);
      const res: any = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.onprogress = e =>
          e.lengthComputable && onProgress?.(Math.round((e.loaded / e.total) * 99));
        xhr.onload    = () => xhr.status < 300
          ? resolve(JSON.parse(xhr.responseText))
          : reject(new Error(`${xhr.status}`));
        xhr.onerror   = () => reject(new Error('Network error'));
        xhr.ontimeout = () => reject(new Error('Timeout'));
        xhr.timeout   = 60_000;
        xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLD.cloud_name}/image/upload`);
        xhr.send(fd);
      });
      onProgress?.(100);
      return { url: res.secure_url, public_id: res.public_id };
    } catch (e: any) {
      lastErr = e;
      if (i < presets.length - 1) await new Promise(r => setTimeout(r, 1_000));
    }
  }
  throw new Error(`Upload failed: ${lastErr?.message}`);
};

const extractCategoryId = (p: any): number | null => {
  if (!p) return null;
  if (typeof p.category === 'number') return p.category;
  if (p.category?.id) return p.category.id;
  if (p.category_id) return p.category_id;
  if (typeof p.category === 'string' && !isNaN(parseInt(p.category)))
    return parseInt(p.category);
  return null;
};

const extractAttributes = (p: any): Record<string, string> => {
  if (!p) return {};
  if (p.attributes && typeof p.attributes === 'object' && !Array.isArray(p.attributes))
    return p.attributes;
  if (typeof p.attributes === 'string') {
    try { return JSON.parse(p.attributes) || {}; } catch { return {}; }
  }
  return {};
};

const STEPS = [
  { icon: 'document-text-outline' as const, label: 'Info',     sub: 'Name & price',   color: '#3b82f6', bg: '#eff6ff' },
  { icon: 'cube-outline'          as const, label: 'Stock',    sub: 'Inventory',       color: '#8b5cf6', bg: '#f5f3ff' },
  { icon: 'pricetags-outline'     as const, label: 'Category', sub: 'Classification',  color: '#f59e0b', bg: '#fffbeb' },
  { icon: 'camera-outline'        as const, label: 'Images',   sub: 'Photos',          color: '#10b981', bg: '#ecfdf5' },
];

const AddProductScreen: React.FC<Props> = ({ navigation, route }) => {
  const insets          = useSafeAreaInsets();
  const existingProduct = route?.params?.product;
  const isEditing       = !!existingProduct;

  useFocusEffect(
    useCallback(() => {
      let tabNav: any = navigation.getParent();
      while (tabNav && tabNav.getState?.()?.type !== 'tab') {
        tabNav = tabNav.getParent?.();
      }
      if (tabNav) {
        tabNav.setOptions({ tabBarStyle: { display: 'none' } });
        return () => tabNav.setOptions({ tabBarStyle: undefined });
      }
    }, [navigation])
  );

  const [formData, setFormData] = useState<ProductFormData>({
    name:         existingProduct?.name              || '',
    model_name:   existingProduct?.model_name        || '',
    description:  existingProduct?.description       || '',
    price:        existingProduct?.price?.toString()  || '',
    mrp:          existingProduct?.mrp?.toString()    || '',
    total_stock:  existingProduct?.total_stock       ?? 0,
    online_stock: existingProduct?.online_stock      ?? 0,
    sale_type:    existingProduct?.sale_type          || 'BOTH',
    category:     extractCategoryId(existingProduct),
    attributes:   extractAttributes(existingProduct),
    sku:          existingProduct?.sku                || '',
  });

  const [mainImage,         setMainImage]    = useState('');
  const [subImages,         setSubImages]    = useState<string[]>([]);
  const [existingMainImage]                  = useState(existingProduct?.main_image_url || '');
  const [existingSubImages]                  = useState<string[]>(
    existingProduct?.sub_images?.map((i: any) => i.image_url || i.url) || []
  );
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [isUploading,    setIsUploading]    = useState(false);
  const [isSubmitting,   setIsSubmitting]   = useState(false);
  const [currentStep,    setCurrentStep]    = useState(1);
  const [errors,         setErrors]         = useState<Record<string, string>>({});
  const [submitError,    setSubmitError]    = useState('');

  const slideAnim    = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(25)).current;
  const fadeAnim     = useRef(new Animated.Value(1)).current;
  const scrollRef    = useRef<ScrollView>(null);

  useEffect(() => {
    Animated.spring(progressAnim, {
      toValue: (currentStep / 4) * 100,
      useNativeDriver: false,
      tension: 60, friction: 10,
    }).start();
  }, [currentStep]);

  const animateStep = (next: number) => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
    const dir = next > currentStep ? 40 : -40;
    Animated.timing(fadeAnim, { toValue: 0, duration: 80, useNativeDriver: true }).start(() => {
      slideAnim.setValue(dir);
      setCurrentStep(next);
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 130, friction: 10 }),
        Animated.timing(fadeAnim,  { toValue: 1, duration: 180, useNativeDriver: true }),
      ]).start();
    });
  };

  const discount = (() => {
    const mrp = parseFloat(formData.mrp), price = parseFloat(formData.price);
    if (mrp > price && !isNaN(mrp) && !isNaN(price))
      return { amount: mrp - price, pct: Math.round(((mrp - price) / mrp) * 100) };
    return null;
  })();

  const canGoNext = (): boolean => {
    switch (currentStep) {
      case 1: return !!(formData.name.trim() && formData.price && parseFloat(formData.price) > 0);
      case 2: return formData.online_stock >= 0 && formData.total_stock >= 0
                     && formData.online_stock <= formData.total_stock;
      case 3: return formData.category !== null;
      case 4: return !!(mainImage || existingMainImage);
      default: return false;
    }
  };

  const updateFormData = (updates: Partial<ProductFormData>) => {
    setFormData(prev => {
      const next = { ...prev, ...updates };
      if (updates.total_stock !== undefined && updates.total_stock < prev.online_stock)
        next.online_stock = updates.total_stock;
      return next;
    });
    const cleaned = { ...errors };
    Object.keys(updates).forEach(k => {
      delete cleaned[k];
      if (k === 'total_stock' || k === 'online_stock') delete cleaned.stock;
    });
    setErrors(cleaned);
    setSubmitError('');
  };

  const validateForm = (): boolean => {
    const e: Record<string, string> = {};
    if (!formData.name.trim())                                                  e.name         = 'Product name is required';
    else if (formData.name.length < 3)                                          e.name         = 'Name must be at least 3 characters';
    if (!formData.price || parseFloat(formData.price) <= 0)                     e.price        = 'Valid price is required';
    if (formData.mrp && parseFloat(formData.mrp) < parseFloat(formData.price))  e.mrp          = 'MRP must be ≥ selling price';
    if (formData.online_stock > formData.total_stock)                           e.online_stock = 'Online stock cannot exceed total stock';
    if (!formData.category)                                                     e.category     = 'Please select a category';
    if (!isEditing && !mainImage && !existingMainImage)                         e.mainImage    = 'Main product image is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const uploadImages = async () => {
    const result: { main_image_url?: string; sub_image_urls?: { url: string; public_id: string }[] } = {};
    setIsUploading(true);
    try {
      if (mainImage) {
        const r = await uploadToCloudinary(
          mainImage, 'main',
          p => setUploadProgress(prev => ({ ...prev, main: p }))
        );
        result.main_image_url = r.url;
      }
      if (subImages.length > 0) {
        result.sub_image_urls = [];
        for (let i = 0; i < subImages.length; i++) {
          const r = await uploadToCloudinary(
            subImages[i], 'sub',
            p => setUploadProgress(prev => ({ ...prev, [`sub_${i}`]: p }))
          );
          result.sub_image_urls!.push(r);
        }
      }
    } finally {
      setIsUploading(false);
      setUploadProgress({});
    }
    return result;
  };

  const handleSubmit = async () => {
    setSubmitError('');
    if (!validateForm()) {
      setSubmitError(Object.values(errors)[0] || 'Please fix the errors and try again');
      return;
    }
    setIsSubmitting(true);
    try {
      const imageUrls = (mainImage || subImages.length > 0) ? await uploadImages() : {};
      const payload: any = {
        name:         formData.name.trim(),
        model_name:   formData.model_name.trim(),
        description:  formData.description.trim(),
        price:        parseFloat(formData.price),
        mrp:          parseFloat(formData.mrp || formData.price),
        total_stock:  parseInt(formData.total_stock.toString()),
        online_stock: parseInt(formData.online_stock.toString()),
        sale_type:    formData.sale_type,
        category:     formData.category,
        attributes:   formData.attributes || {},
      };
      if (formData.sku?.trim())             payload.sku            = formData.sku.trim();
      if (imageUrls.main_image_url)         payload.main_image_url = imageUrls.main_image_url;
      if (imageUrls.sub_image_urls?.length) payload.sub_image_urls = imageUrls.sub_image_urls;

      if (isEditing) {
        await ProductService.updateProductWithoutImages(existingProduct.id, payload);
      } else {
        await ProductService.createProductWithoutImages(payload);
      }
      navigation.reset({ index: 0, routes: [{ name: 'MainTabs', params: { screen: 'Products' } }] });
    } catch (e: any) {
      setSubmitError(
        e.message?.includes('upload')  ? 'Image upload failed. Check your connection.' :
        e.message?.includes('Network') ? 'Network error. Please try again.' :
        e.message || 'Something went wrong. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeStep = STEPS[currentStep - 1];
  const isLastStep = currentStep === 4;
  const isBusy     = isSubmitting || isUploading;

  return (
    <View style={[s.screen, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* ── Header ─────────────────────────────────────────────────── */}
      <View style={[s.header, { backgroundColor: activeStep.bg }]}>
        <View style={s.headerRow}>
          <TouchableOpacity
            style={s.headerBack}
            onPress={() => currentStep > 1 ? animateStep(currentStep - 1) : navigation.goBack()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons
              name={currentStep > 1 ? 'chevron-back' : 'close'}
              size={20}
              color={activeStep.color}
            />
          </TouchableOpacity>

          <View style={s.headerTitleBlock}>
            <Text style={[s.headerTitle, { color: activeStep.color }]}>
              {isEditing ? 'Edit Product' : 'Add Product'}
            </Text>
            <Text style={s.headerSub}>{activeStep.sub}</Text>
          </View>

          <View style={[s.stepBadge, { backgroundColor: activeStep.color }]}>
            <Text style={s.stepBadgeText}>{currentStep} / 4</Text>
          </View>
        </View>

        <View style={s.stepDots}>
          {STEPS.map((step, i) => {
            const n      = i + 1;
            const done   = currentStep > n;
            const active = currentStep === n;
            return (
              <React.Fragment key={n}>
                <TouchableOpacity
                  style={[
                    s.dot,
                    done   && { backgroundColor: '#10b981', borderColor: '#10b981' },
                    active && { backgroundColor: activeStep.color, borderColor: activeStep.color, width: 32 },
                    !done && !active && s.dotInactive,
                  ]}
                  onPress={() => done ? animateStep(n) : undefined}
                  activeOpacity={done ? 0.7 : 1}
                  disabled={!done}
                >
                  {done ? (
                    <Ionicons name="checkmark" size={10} color="white" />
                  ) : (
                    <>
                      <Ionicons name={step.icon} size={10} color={active ? 'white' : '#94a3b8'} />
                      {active && <Text style={s.dotLabel}>{step.label}</Text>}
                    </>
                  )}
                </TouchableOpacity>
                {i < 3 && (
                  <View style={[s.dotLine, done && { backgroundColor: '#10b981' }]} />
                )}
              </React.Fragment>
            );
          })}
        </View>

        <View style={s.progressTrack}>
          <Animated.View style={[s.progressFill, {
            width: progressAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
            backgroundColor: activeStep.color,
          }]} />
        </View>
      </View>

      {/* ── Scroll ──────────────────────────────────────────────────── */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={scrollRef}
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* ── ANIMATED FORM CONTENT — pure inputs only ─────────── */}
          <Animated.View style={{ transform: [{ translateX: slideAnim }], opacity: fadeAnim }}>

            {/* Error banner */}
            {!!submitError && (
              <View style={s.errorBanner}>
                <Ionicons name="alert-circle" size={15} color="#991b1b" />
                <Text style={s.errorBannerText}>{submitError}</Text>
                <TouchableOpacity
                  onPress={() => setSubmitError('')}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close" size={14} color="#991b1b" />
                </TouchableOpacity>
              </View>
            )}

            {/* Step 1 — form fields only, NO discount card here */}
            {currentStep === 1 && (
              <BasicInfoComponent
                formData={formData}
                updateFormData={updateFormData}
                errors={errors}
              />
            )}

            {/* Step 2 */}
            {currentStep === 2 && (
              <StockManagementComponent
                formData={formData}
                updateFormData={updateFormData}
                errors={errors}
              />
            )}

            {/* Step 3 */}
            {currentStep === 3 && (
              <CategorySelectorComponent
                selectedCategory={formData.category}
                onCategorySelect={(id: number) => updateFormData({ category: id })}
                onAttributesChange={(attrs: Record<string, string>) =>
                  updateFormData({ attributes: attrs })
                }
                error={errors.category}
                existingAttributes={formData.attributes}
              />
            )}

            {/* Step 4 */}
            {currentStep === 4 && (
              <>
                <ImageUploadComponent
                  mainImage={mainImage}
                  subImages={subImages}
                  existingMainImage={existingMainImage}
                  existingSubImages={existingSubImages}
                  onMainImageChange={setMainImage}
                  onSubImagesChange={(imgs: string[]) => {
                    if (imgs.length <= 4) setSubImages(imgs);
                  }}
                  maxSubImages={4}
                  error={errors.mainImage}
                />
                {isUploading && (
                  <View style={s.uploadCard}>
                    <View style={s.uploadCardHeader}>
                      <ActivityIndicator size="small" color="#10b981" />
                      <Text style={s.uploadCardTitle}>Uploading images…</Text>
                      <Text style={s.uploadCardSub}>
                        {Object.values(uploadProgress).filter(p => p === 100).length}/
                        {Object.keys(uploadProgress).length} done
                      </Text>
                    </View>
                    {Object.entries(uploadProgress).map(([key, pct]) => (
                      <View key={key} style={s.uploadRow}>
                        <View style={s.uploadRowTop}>
                          <Text style={s.uploadRowLabel}>
                            {key === 'main'
                              ? '📷 Main image'
                              : `📷 Image ${parseInt(key.split('_')[1]) + 1}`}
                          </Text>
                          <Text style={[s.uploadRowPct, pct === 100 && s.uploadRowPctDone]}>
                            {pct === 100 ? '✓' : `${pct}%`}
                          </Text>
                        </View>
                        <View style={s.uploadTrack}>
                          <View style={[s.uploadFill, {
                            width: `${pct}%` as any,
                            backgroundColor: pct === 100 ? '#10b981' : '#3b82f6',
                          }]} />
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </>
            )}
          </Animated.View>

          {/* ══════════════════════════════════════════════════════════
              DIVIDER + BUTTONS — always above tips
              ══════════════════════════════════════════════════════════ */}
          <View style={s.footerDivider} />

          <View style={s.footer}>
            {currentStep > 1 ? (
              <TouchableOpacity
                style={s.backBtn}
                onPress={() => animateStep(currentStep - 1)}
                activeOpacity={0.7}
              >
                <Ionicons name="chevron-back" size={16} color="#6b7280" />
                <Text style={s.backBtnText}>Back</Text>
              </TouchableOpacity>
            ) : (
              <View style={s.backBtnSpacer} />
            )}

            {!isLastStep ? (
              <TouchableOpacity
                style={[
                  s.nextBtn,
                  {
                    backgroundColor: canGoNext() ? activeStep.color : '#e5e7eb',
                    shadowColor: canGoNext() ? activeStep.color : 'transparent',
                  },
                ]}
                onPress={() => canGoNext() && animateStep(currentStep + 1)}
                disabled={!canGoNext()}
                activeOpacity={0.85}
              >
                <Text style={[s.nextBtnText, !canGoNext() && s.btnTextDisabled]}>
                  Continue
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={canGoNext() ? 'white' : '#9ca3af'}
                />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[s.submitBtn, (isBusy || !canGoNext()) && s.btnDisabled]}
                onPress={handleSubmit}
                disabled={isBusy || !canGoNext()}
                activeOpacity={0.85}
              >
                {isBusy ? (
                  <>
                    <ActivityIndicator size="small" color="white" />
                    <Text style={s.submitBtnText}>
                      {isUploading ? 'Uploading…' : isEditing ? 'Updating…' : 'Creating…'}
                    </Text>
                  </>
                ) : (
                  <>
                    <Ionicons
                      name={isEditing ? 'checkmark-circle' : 'add-circle'}
                      size={18}
                      color="white"
                    />
                    <Text style={s.submitBtnText}>
                      {isEditing ? 'Update Product' : 'Create Product'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* ══════════════════════════════════════════════════════════
              TIPS SECTION — always below buttons
              Order: discount card (step 1 only) → step label card
              ══════════════════════════════════════════════════════════ */}
          <Animated.View style={{ opacity: fadeAnim }}>

            {/* ✅ "Better for sales" discount tip — step 1 only, BELOW buttons */}
            {currentStep === 1 && discount && (
              <View style={[s.discountCard, { marginTop: 16 }]}>
                <View style={s.discountLeft}>
                  <Text style={s.discountPct}>{discount.pct}%</Text>
                  <Text style={s.discountHint}>OFF</Text>
                </View>
                <View style={s.discountDivider} />
                <View style={{ flex: 1 }}>
                  <Text style={s.discountTitle}>
                    Customers save ₹{discount.amount.toLocaleString('en-IN')}
                  </Text>
                  <Text style={s.discountSub}>per unit · great for conversions</Text>
                </View>
                <Ionicons name="trending-up" size={20} color="#059669" />
              </View>
            )}

            {/* Step label tip card */}
            <View style={[s.stepCard, { borderLeftColor: activeStep.color, marginTop: 12 }]}>
              <View style={[s.stepCardIcon, { backgroundColor: activeStep.color + '18' }]}>
                <Ionicons name={activeStep.icon} size={18} color={activeStep.color} />
              </View>
              <View>
                <Text style={[s.stepCardTitle, { color: activeStep.color }]}>
                  Step {currentStep}: {activeStep.label}
                </Text>
                <Text style={s.stepCardSub}>{activeStep.sub}</Text>
              </View>
            </View>

          </Animated.View>

          {/* Safe-area spacer — clears system nav bar */}
          <View style={{ height: Math.max(insets.bottom, 24) + 24 }} />

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8fafc' },

  header: {
    paddingHorizontal: 14, paddingTop: 10, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: '#e2e8f0', gap: 12,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6 },
      android: { elevation: 3 },
    }),
  },
  headerRow:        { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerBack: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1, borderColor: '#e2e8f0',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitleBlock: { flex: 1 },
  headerTitle:      { fontSize: 16, fontWeight: '800', letterSpacing: -0.3 },
  headerSub:        { fontSize: 11, color: '#94a3b8', fontWeight: '500', marginTop: 1 },
  stepBadge:        { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  stepBadgeText:    { fontSize: 11, fontWeight: '800', color: 'white' },

  stepDots:    { flexDirection: 'row', alignItems: 'center' },
  dot: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    width: 26, height: 26, borderRadius: 99,
    borderWidth: 2, borderColor: '#e2e8f0',
    alignSelf: 'center', justifyContent: 'center',
    overflow: 'hidden', paddingHorizontal: 6,
  },
  dotInactive: { backgroundColor: '#f8fafc', borderColor: '#e2e8f0' },
  dotLabel:    { fontSize: 9, fontWeight: '800', color: 'white' },
  dotLine:     { flex: 1, height: 2, backgroundColor: '#e2e8f0', borderRadius: 1, marginHorizontal: 3 },

  progressTrack: { height: 3, backgroundColor: 'rgba(0,0,0,0.06)', borderRadius: 2, overflow: 'hidden' },
  progressFill:  { height: 3, borderRadius: 2 },

  scroll:        { flex: 1 },
  scrollContent: { padding: 14 },

  stepCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'white', borderRadius: 14,
    padding: 12, borderLeftWidth: 4,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 },
      android: { elevation: 1 },
    }),
  },
  stepCardIcon:  { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  stepCardTitle: { fontSize: 13, fontWeight: '700' },
  stepCardSub:   { fontSize: 11, color: '#94a3b8', fontWeight: '500', marginTop: 1 },

  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fff5f5', borderWidth: 1, borderColor: '#fecaca',
    borderRadius: 12, padding: 10, marginBottom: 12,
  },
  errorBannerText: { flex: 1, fontSize: 13, color: '#991b1b', fontWeight: '500' },

  discountCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#f0fdf4', borderRadius: 14,
    padding: 12,
    borderWidth: 1, borderColor: '#bbf7d0',
  },
  discountLeft:    { alignItems: 'center', minWidth: 44 },
  discountPct:     { fontSize: 18, fontWeight: '900', color: '#15803d' },
  discountHint:    { fontSize: 9, color: '#16a34a', fontWeight: '700', letterSpacing: 1 },
  discountDivider: { width: 1, height: 36, backgroundColor: '#bbf7d0' },
  discountTitle:   { fontSize: 13, fontWeight: '700', color: '#15803d' },
  discountSub:     { fontSize: 11, color: '#16a34a', marginTop: 2 },

  uploadCard: {
    backgroundColor: 'white', borderRadius: 14,
    padding: 14, marginTop: 12, gap: 10,
    borderWidth: 1, borderColor: '#e2e8f0',
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6 },
      android: { elevation: 2 },
    }),
  },
  uploadCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  uploadCardTitle:  { fontSize: 13, fontWeight: '700', color: '#374151', flex: 1 },
  uploadCardSub:    { fontSize: 11, color: '#94a3b8', fontWeight: '500' },
  uploadRow:        { gap: 5 },
  uploadRowTop:     { flexDirection: 'row', justifyContent: 'space-between' },
  uploadRowLabel:   { fontSize: 12, color: '#6b7280', fontWeight: '500' },
  uploadRowPct:     { fontSize: 12, fontWeight: '700', color: '#3b82f6' },
  uploadRowPctDone: { color: '#10b981' },
  uploadTrack:      { height: 5, backgroundColor: '#f1f5f9', borderRadius: 3, overflow: 'hidden' },
  uploadFill:       { height: 5, borderRadius: 3 },

  footerDivider: {
    height: 1, backgroundColor: '#e5e7eb',
    marginTop: 24, marginHorizontal: -14,
  },
  footer: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', gap: 10,
    paddingTop: 16,
  },
  backBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    paddingHorizontal: 16, paddingVertical: 13,
    borderRadius: 14, backgroundColor: '#f8fafc',
    borderWidth: 1.5, borderColor: '#e2e8f0', minWidth: 84,
  },
  backBtnText:   { fontSize: 13, fontWeight: '700', color: '#6b7280' },
  backBtnSpacer: { minWidth: 84 },
  nextBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 15, borderRadius: 14,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.28, shadowRadius: 10, elevation: 5,
  },
  nextBtnText:     { fontSize: 14, fontWeight: '800', color: 'white', letterSpacing: 0.2 },
  submitBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    backgroundColor: '#10b981', paddingVertical: 15, borderRadius: 14,
    shadowColor: '#10b981', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 10, elevation: 5,
  },
  submitBtnText:   { fontSize: 14, fontWeight: '800', color: 'white', letterSpacing: 0.2 },
  btnDisabled:     { backgroundColor: '#e2e8f0', shadowOpacity: 0, elevation: 0 },
  btnTextDisabled: { color: '#94a3b8' },
});

export default AddProductScreen;