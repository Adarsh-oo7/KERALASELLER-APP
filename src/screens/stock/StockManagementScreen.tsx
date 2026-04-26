// // src/screens/stock/StockManagementScreen.tsx
// import React, { useEffect, useState, useCallback, useContext } from 'react';
// import {
//   View, Text, StyleSheet, ScrollView, TextInput,
//   TouchableOpacity, Image, Alert, ActivityIndicator,
//   RefreshControl, Modal, Platform,
// } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import { useNavigation } from '@react-navigation/native';
// import { AppStateContext } from '../../navigation/AppNavigator';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import axios from 'axios';

// // ── Config ────────────────────────────────────────────────────────────────────

// const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8000';
// const API_URL  = `${API_BASE}/user/store/products/`;

// interface Product {
//   id: number;
//   name: string;
//   model_name?: string;
//   sku?: string;
//   online_stock: number;
//   total_stock: number;
//   price?: number;
//   image_url?: string;
//   main_image_url?: string;
// }

// type StockFilter = 'all' | 'low_stock' | 'out_of_stock' | 'overstocked';

// const getStockStatus = (p: Product) => {
//   if (p.online_stock <= 0)             return { label: 'Out of Stock', color: '#dc2626', bg: '#fef2f2', icon: 'alert-circle-outline' as const };
//   if (p.online_stock <= 5)             return { label: 'Low Stock',    color: '#d97706', bg: '#fffbeb', icon: 'warning-outline' as const };
//   if (p.online_stock > p.total_stock)  return { label: 'Overstocked',  color: '#7c3aed', bg: '#f5f3ff', icon: 'trending-up-outline' as const };
//   return                                      { label: 'In Stock',     color: '#059669', bg: '#f0fdf4', icon: 'checkmark-circle-outline' as const };
// };

// // ── CustomAmountModal ─────────────────────────────────────────────────────────

// const CustomAmountModal: React.FC<{
//   visible: boolean;
//   productName: string;
//   currentStock: number;
//   stockType: 'total' | 'online';
//   onConfirm: (amount: number) => void;
//   onCancel: () => void;
// }> = ({ visible, productName, currentStock, stockType, onConfirm, onCancel }) => {
//   const [amount, setAmount]         = useState('');
//   const [op, setOp]                 = useState<'add' | 'set'>('add');

//   const reset = () => { setAmount(''); setOp('add'); };

//   const handleConfirm = () => {
//     const n = parseInt(amount, 10);
//     if (isNaN(n) || n < 0) { Alert.alert('Invalid Amount', 'Enter a valid number.'); return; }
//     onConfirm(op === 'add' ? currentStock + n : n);
//     reset();
//   };

//   const handleCancel = () => { reset(); onCancel(); };

//   const preview = amount
//     ? op === 'add'
//       ? `New stock: ${currentStock + parseInt(amount || '0', 10)}`
//       : `Stock set to: ${amount}`
//     : '';

//   return (
//     <Modal visible={visible} transparent animationType="fade" onRequestClose={handleCancel}>
//       <View style={m.overlay}>
//         <View style={m.sheet}>
//           {/* Header */}
//           <View style={m.head}>
//             <View style={m.headIcon}>
//               <Ionicons name="calculator-outline" size={18} color="#3b82f6" />
//             </View>
//             <View style={{ flex: 1 }}>
//               <Text style={m.headTitle}>Custom Stock Amount</Text>
//               <Text style={m.headSub} numberOfLines={1}>{productName}</Text>
//             </View>
//             <TouchableOpacity style={m.closeBtn} onPress={handleCancel}>
//               <Ionicons name="close" size={18} color="#6b7280" />
//             </TouchableOpacity>
//           </View>

//           <ScrollView style={{ padding: 16 }} showsVerticalScrollIndicator={false}>
//             {/* Current stock */}
//             <View style={m.currentRow}>
//               <Text style={m.currentLabel}>Current {stockType === 'total' ? 'Total' : 'Online'} Stock</Text>
//               <Text style={m.currentVal}>{currentStock}</Text>
//             </View>

//             {/* Operation toggle */}
//             <View style={m.toggleRow}>
//               {(['add', 'set'] as const).map(o => (
//                 <TouchableOpacity
//                   key={o}
//                   style={[m.toggleBtn, op === o && m.toggleBtnActive]}
//                   onPress={() => setOp(o)}
//                 >
//                   <Ionicons
//                     name={o === 'add' ? 'add-circle-outline' : 'create-outline'}
//                     size={15}
//                     color={op === o ? '#fff' : '#3b82f6'}
//                   />
//                   <Text style={[m.toggleText, op === o && m.toggleTextActive]}>
//                     {o === 'add' ? 'Add to Stock' : 'Set Exact'}
//                   </Text>
//                 </TouchableOpacity>
//               ))}
//             </View>

//             {/* Input */}
//             <Text style={m.fieldLabel}>{op === 'add' ? 'Amount to Add' : 'Set Stock To'}</Text>
//             <TextInput
//               style={m.input}
//               value={amount}
//               onChangeText={setAmount}
//               keyboardType="numeric"
//               placeholder="Enter amount"
//               placeholderTextColor="#9ca3af"
//               autoFocus
//             />
//             {!!preview && <Text style={m.preview}>{preview}</Text>}

//             {/* Quick presets */}
//             {op === 'add' && (
//               <View style={{ marginTop: 16 }}>
//                 <Text style={m.presetsLabel}>Quick Presets</Text>
//                 <View style={m.presetsRow}>
//                   {[5, 10, 25, 50, 100].map(n => (
//                     <TouchableOpacity key={n} style={m.preset} onPress={() => setAmount(String(n))}>
//                       <Text style={m.presetText}>+{n}</Text>
//                     </TouchableOpacity>
//                   ))}
//                 </View>
//               </View>
//             )}

//             {/* Buttons */}
//             <View style={m.btnRow}>
//               <TouchableOpacity style={m.cancelBtn} onPress={handleCancel}>
//                 <Text style={m.cancelBtnText}>Cancel</Text>
//               </TouchableOpacity>
//               <TouchableOpacity
//                 style={[m.confirmBtn, !amount && { opacity: 0.5 }]}
//                 onPress={handleConfirm}
//                 disabled={!amount}
//               >
//                 <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
//                 <Text style={m.confirmBtnText}>Confirm</Text>
//               </TouchableOpacity>
//             </View>
//           </ScrollView>
//         </View>
//       </View>
//     </Modal>
//   );
// };

// // ── ConfirmationModal ─────────────────────────────────────────────────────────

// const ConfirmationModal: React.FC<{
//   visible: boolean;
//   message: string;
//   onConfirm: (note: string) => void;
//   onCancel: () => void;
//   isLoading: boolean;
// }> = ({ visible, message, onConfirm, onCancel, isLoading }) => {
//   const [note, setNote] = useState('');

//   const handleCancel = () => { setNote(''); onCancel(); };
//   const handleConfirm = () => { onConfirm(note); setNote(''); };

//   return (
//     <Modal visible={visible} transparent animationType="fade" onRequestClose={handleCancel}>
//       <View style={m.overlay}>
//         <View style={m.sheet}>
//           {/* Header */}
//           <View style={m.head}>
//             <View style={[m.headIcon, { backgroundColor: '#eff6ff' }]}>
//               <Ionicons name="cube-outline" size={18} color="#3b82f6" />
//             </View>
//             <Text style={[m.headTitle, { fontSize: 15 }]}>Confirm Stock Update</Text>
//             <TouchableOpacity style={m.closeBtn} onPress={handleCancel} disabled={isLoading}>
//               <Ionicons name="close" size={18} color="#6b7280" />
//             </TouchableOpacity>
//           </View>

//           <View style={{ padding: 16 }}>
//             <Text style={m.confirmMsg}>{message}</Text>

//             <Text style={m.fieldLabel}>Reason for change (optional)</Text>
//             <TextInput
//               style={[m.input, m.textarea]}
//               value={note}
//               onChangeText={setNote}
//               placeholder="e.g., weekly restock, sale, correction"
//               placeholderTextColor="#9ca3af"
//               multiline
//               numberOfLines={3}
//               editable={!isLoading}
//             />

//             <View style={m.btnRow}>
//               <TouchableOpacity style={m.cancelBtn} onPress={handleCancel} disabled={isLoading}>
//                 <Text style={m.cancelBtnText}>Cancel</Text>
//               </TouchableOpacity>
//               <TouchableOpacity
//                 style={[m.confirmBtn, isLoading && { opacity: 0.6 }]}
//                 onPress={handleConfirm}
//                 disabled={isLoading}
//               >
//                 {isLoading
//                   ? <ActivityIndicator color="#fff" size="small" />
//                   : <><Ionicons name="checkmark-circle-outline" size={16} color="#fff" /><Text style={m.confirmBtnText}>Confirm</Text></>
//                 }
//               </TouchableOpacity>
//             </View>
//           </View>
//         </View>
//       </View>
//     </Modal>
//   );
// };

// // ── StockControl ──────────────────────────────────────────────────────────────

// const StockControl: React.FC<{
//   value: number;
//   color: string;
//   disabled: boolean;
//   maxValue?: number;
//   onDecrease: () => void;
//   onIncrease: () => void;
//   onChange: (v: string) => void;
//   onCustom: () => void;
// }> = ({ value, color, disabled, maxValue, onDecrease, onIncrease, onChange, onCustom }) => {
//   const atMax = maxValue !== undefined && value >= maxValue;

//   return (
//     <View style={{ gap: 8 }}>
//       <View style={sc.row}>
//         <TouchableOpacity
//           style={[sc.circleBtn, { borderColor: color }, (disabled || value <= 0) && sc.circleBtnDim]}
//           onPress={onDecrease}
//           disabled={disabled || value <= 0}
//         >
//           <Ionicons name="remove" size={16} color={(disabled || value <= 0) ? '#d1d5db' : color} />
//         </TouchableOpacity>

//         <View style={[sc.inputWrap, { borderColor: color }]}>
//           <TextInput
//             style={sc.input}
//             value={String(value ?? 0)}
//             onChangeText={onChange}
//             keyboardType="numeric"
//             textAlign="center"
//             editable={!disabled}
//             selectTextOnFocus
//           />
//         </View>

//         <TouchableOpacity
//           style={[sc.circleBtn, { borderColor: color }, (disabled || atMax) && sc.circleBtnDim]}
//           onPress={onIncrease}
//           disabled={disabled || atMax}
//         >
//           <Ionicons name="add" size={16} color={(disabled || atMax) ? '#d1d5db' : color} />
//         </TouchableOpacity>
//       </View>

//       <TouchableOpacity
//         style={[sc.customBtn, { backgroundColor: color }, disabled && { opacity: 0.5 }]}
//         onPress={onCustom}
//         disabled={disabled}
//       >
//         <Ionicons name="calculator-outline" size={13} color="#fff" />
//         <Text style={sc.customBtnText}>Custom Amount</Text>
//       </TouchableOpacity>
//     </View>
//   );
// };

// // ── Main screen ───────────────────────────────────────────────────────────────

// const StockManagementScreen: React.FC = () => {
//   const navigation = useNavigation();
//   const { setCurrentTitle, setCurrentSubtitle } = useContext(AppStateContext);

//   const [products, setProducts]                 = useState<Product[]>([]);
//   const [filtered, setFiltered]                 = useState<Product[]>([]);
//   const [isLoading, setIsLoading]               = useState(true);
//   const [search, setSearch]                     = useState('');
//   const [filter, setFilter]                     = useState<StockFilter>('all');
//   const [error, setError]                       = useState('');
//   const [updatingId, setUpdatingId]             = useState<number | null>(null);
//   const [confirmation, setConfirmation]         = useState<{ message: string; onConfirm: (note: string) => void } | null>(null);
//   const [customModal, setCustomModal]           = useState<{
//     productId: number; productName: string; currentStock: number; stockType: 'total_stock' | 'online_stock';
//   } | null>(null);

//   useEffect(() => {
//     setCurrentTitle('Stock Management');
//     setCurrentSubtitle('Quick inventory updates');
//   }, []);

//   const fetchData = useCallback(async () => {
//     const token = await AsyncStorage.getItem('accessToken');
//     if (!token) { setError('Authentication required.'); setIsLoading(false); return; }
//     try {
//       setIsLoading(true); setError('');
//       const res = await axios.get(API_URL, { headers: { Authorization: `Bearer ${token}` } });
//       const data: Product[] = res.data.results || res.data || [];
//       setProducts(data);
//     } catch (e: any) {
//       setError(e.response?.status === 401 ? 'Session expired. Please login again.' : 'Failed to load products. Check your connection.');
//     } finally { setIsLoading(false); }
//   }, []);

//   useEffect(() => { fetchData(); }, [fetchData]);

//   useEffect(() => {
//     let out = [...products];
//     if (search.trim()) {
//       const q = search.toLowerCase();
//       out = out.filter(p => p.name?.toLowerCase().includes(q) || p.model_name?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q));
//     }
//     if (filter === 'low_stock')    out = out.filter(p => p.online_stock > 0 && p.online_stock <= 5);
//     if (filter === 'out_of_stock') out = out.filter(p => p.online_stock <= 0);
//     if (filter === 'overstocked')  out = out.filter(p => p.online_stock > p.total_stock);
//     setFiltered(out);
//   }, [products, search, filter]);

//   const handleStockChange = (productId: number, stockType: 'total_stock' | 'online_stock', newValue: string | number) => {
//     const val = Math.max(0, parseInt(String(newValue), 10));
//     if (isNaN(val)) return;
//     const product = products.find(p => p.id === productId);
//     if (!product) return;
//     const prev  = product[stockType];
//     const diff  = val - prev;
//     const label = stockType === 'total_stock' ? 'Total Stock' : 'Online Stock';

//     setConfirmation({
//       message: `Update ${product.name}'s ${label} from ${prev} to ${val}${diff > 0 ? ` (+${diff})` : diff < 0 ? ` (${diff})` : ''}?`,
//       onConfirm: async (note: string) => {
//         setUpdatingId(productId);
//         try {
//           const token = await AsyncStorage.getItem('accessToken');
//           await axios.patch(`${API_URL}${productId}/update-stock/`, {
//             [stockType]: val,
//             note: note || `${label} updated via mobile`,
//           }, { headers: { Authorization: `Bearer ${token}` } });
//           await fetchData();
//           Alert.alert('Updated!', `${product.name}'s ${label.toLowerCase()} set to ${val}.`);
//         } catch (e: any) {
//           const msg = e.response?.data?.error || e.response?.data?.message || 'Could not update stock.';
//           setError(msg);
//           Alert.alert('Update Failed', msg);
//           await fetchData();
//         } finally { setConfirmation(null); setUpdatingId(null); }
//       },
//     });
//   };

//   // Stats
//   const inStock  = products.filter(p => p.online_stock > 5).length;
//   const lowStock = products.filter(p => p.online_stock > 0 && p.online_stock <= 5).length;
//   const outStock = products.filter(p => p.online_stock <= 0).length;
//   const overStock = products.filter(p => p.online_stock > p.total_stock).length;

//   const FILTER_TABS: { key: StockFilter; label: string; count: number; color: string; icon: any }[] = [
//     { key: 'all',          label: 'All',     count: products.length, color: '#3b82f6', icon: 'grid-outline' },
//     { key: 'low_stock',    label: 'Low',     count: lowStock,        color: '#d97706', icon: 'warning-outline' },
//     { key: 'out_of_stock', label: 'Out',     count: outStock,        color: '#dc2626', icon: 'alert-circle-outline' },
//     { key: 'overstocked',  label: 'Over',    count: overStock,       color: '#7c3aed', icon: 'trending-up-outline' },
//   ];

//   return (
//     <View style={s.screen}>

//       {/* Modals */}
//       {confirmation && (
//         <ConfirmationModal
//           visible
//           message={confirmation.message}
//           onConfirm={confirmation.onConfirm}
//           onCancel={() => { setConfirmation(null); fetchData(); }}
//           isLoading={updatingId !== null}
//         />
//       )}
//       {customModal && (
//         <CustomAmountModal
//           visible
//           productName={customModal.productName}
//           currentStock={customModal.currentStock}
//           stockType={customModal.stockType === 'total_stock' ? 'total' : 'online'}
//           onConfirm={amt => { handleStockChange(customModal.productId, customModal.stockType, amt); setCustomModal(null); }}
//           onCancel={() => setCustomModal(null)}
//         />
//       )}

//       {/* ── Stat bar ── */}
//       <View style={s.statBar}>
//         {[
//           { label: 'Total',    value: products.length, color: '#3b82f6' },
//           { label: 'In Stock', value: inStock,          color: '#059669' },
//           { label: 'Low',      value: lowStock,         color: '#d97706' },
//           { label: 'Out',      value: outStock,         color: '#dc2626' },
//         ].map((item, idx, arr) => (
//           <React.Fragment key={item.label}>
//             <View style={s.statItem}>
//               <Text style={[s.statVal, { color: item.color }]}>{item.value}</Text>
//               <Text style={s.statLabel}>{item.label}</Text>
//             </View>
//             {idx < arr.length - 1 && <View style={s.statDivider} />}
//           </React.Fragment>
//         ))}
//       </View>

//       {/* ── Error banner ── */}
//       {!!error && (
//         <View style={s.errorBanner}>
//           <Ionicons name="alert-circle-outline" size={15} color="#dc2626" />
//           <Text style={s.errorText}>{error}</Text>
//           <TouchableOpacity onPress={() => setError('')}>
//             <Ionicons name="close" size={15} color="#dc2626" />
//           </TouchableOpacity>
//         </View>
//       )}

//       {/* ── Search + filter ── */}

// <View style={s.toolBar}>
//   {/* Search */}
//   <View style={s.searchBox}>
//     <Ionicons name="search-outline" size={15} color="#9ca3af" />
//     <TextInput
//       style={s.searchInput}
//       value={search}
//       onChangeText={setSearch}
//       placeholder="Search products..."
//       placeholderTextColor="#9ca3af"
//     />
//     {!!search && (
//       <TouchableOpacity onPress={() => setSearch('')}>
//         <Ionicons name="close-circle" size={15} color="#9ca3af" />
//       </TouchableOpacity>
//     )}
//   </View>

//   {/* Filter tabs */}
//   <ScrollView
//     horizontal
//     showsHorizontalScrollIndicator={false}
//     contentContainerStyle={s.filterRow}
//     bounces={false}
//   >
//     {FILTER_TABS.map(tab => {
//       const active = filter === tab.key;
//       return (
//         <TouchableOpacity
//           key={tab.key}
//           style={[s.filterTab, active && { backgroundColor: tab.color, borderColor: tab.color }]}
//           onPress={() => setFilter(tab.key)}
//           activeOpacity={0.8}
//         >
//           <Ionicons
//             name={tab.icon}
//             size={13}
//             color={active ? '#fff' : tab.color}
//           />
//           <Text style={[s.filterTabLabel, active && s.filterTabLabelActive]}>
//             {tab.label}
//           </Text>
//           <View style={[s.filterCount, { backgroundColor: active ? 'rgba(255,255,255,0.25)' : tab.color + '18' }]}>
//             <Text style={[s.filterCountText, { color: active ? '#fff' : tab.color }]}>
//               {tab.count}
//             </Text>
//           </View>
//         </TouchableOpacity>
//       );
//     })}
//   </ScrollView>
// </View>


//       {/* ── Product list ── */}
//       <ScrollView
//         style={s.list}
//         contentContainerStyle={s.listContent}
//         refreshControl={<RefreshControl refreshing={false} onRefresh={fetchData} tintColor="#3b82f6" />}
//         showsVerticalScrollIndicator={false}
//       >
//         {isLoading ? (
//           <View style={s.centered}>
//             <ActivityIndicator size="large" color="#3b82f6" />
//             <Text style={s.loadingText}>Loading inventory...</Text>
//           </View>

//         ) : filtered.length > 0 ? filtered.map(product => {
//           const status    = getStockStatus(product);
//           const updating  = updatingId === product.id;
//           const progress  = Math.min((product.online_stock / Math.max(product.total_stock, 1)) * 100, 100);
//           const imgUri    = product.image_url || product.main_image_url;

//           return (
//             <View key={product.id} style={s.card}>

//               {/* Product header */}
//               <View style={s.cardTop}>
//                 <View style={s.imgWrap}>
//                   {imgUri
//                     ? <Image source={{ uri: imgUri }} style={s.img} />
//                     : <View style={s.imgPlaceholder}><Ionicons name="cube-outline" size={24} color="#9ca3af" /></View>
//                   }
//                   <View style={[s.imgDot, { backgroundColor: status.color }]} />
//                 </View>

//                 <View style={{ flex: 1 }}>
//                   <Text style={s.productName} numberOfLines={2}>{product.name}</Text>
//                   {!!product.model_name && (
//                     <View style={s.metaRow}>
//                       <Ionicons name="car-outline" size={11} color="#9ca3af" />
//                       <Text style={s.metaText} numberOfLines={1}>{product.model_name}</Text>
//                     </View>
//                   )}
//                   <View style={s.metaRow}>
//                     {!!product.sku && (
//                       <Text style={s.skuText}>{product.sku}</Text>
//                     )}
//                     {!!product.price && (
//                       <Text style={s.priceText}>₹{product.price.toLocaleString('en-IN')}</Text>
//                     )}
//                   </View>
//                 </View>

//                 <View style={[s.statusPill, { backgroundColor: status.bg }]}>
//                   <Ionicons name={status.icon} size={10} color={status.color} />
//                   <Text style={[s.statusPillText, { color: status.color }]}>{status.label}</Text>
//                 </View>
//               </View>

//               {/* Progress bar */}
//               <View style={s.progressWrap}>
//                 <View style={s.progressTrack}>
//                   <View style={[s.progressFill, { width: `${progress}%`, backgroundColor: status.color }]} />
//                 </View>
//                 <Text style={s.progressText}>{product.online_stock} of {product.total_stock} available online</Text>
//               </View>

//               {/* Stock controls */}
//               <View style={s.controlsWrap}>
//                 <View style={s.controlSection}>
//                   <View style={s.controlHead}>
//                     <Ionicons name="cube-outline" size={13} color="#3b82f6" />
//                     <Text style={s.controlLabel}>Total Stock</Text>
//                   </View>
//                   <StockControl
//                     value={product.total_stock}
//                     color="#3b82f6"
//                     disabled={updating}
//                     onDecrease={() => handleStockChange(product.id, 'total_stock', product.total_stock - 1)}
//                     onIncrease={() => handleStockChange(product.id, 'total_stock', product.total_stock + 1)}
//                     onChange={v => handleStockChange(product.id, 'total_stock', v)}
//                     onCustom={() => setCustomModal({ productId: product.id, productName: product.name, currentStock: product.total_stock, stockType: 'total_stock' })}
//                   />
//                 </View>

//                 <View style={s.controlSection}>
//                   <View style={s.controlHead}>
//                     <Ionicons name="globe-outline" size={13} color="#059669" />
//                     <Text style={s.controlLabel}>Online Stock</Text>
//                   </View>
//                   <StockControl
//                     value={product.online_stock}
//                     color="#059669"
//                     disabled={updating}
//                     maxValue={product.total_stock}
//                     onDecrease={() => handleStockChange(product.id, 'online_stock', product.online_stock - 1)}
//                     onIncrease={() => handleStockChange(product.id, 'online_stock', product.online_stock + 1)}
//                     onChange={v => handleStockChange(product.id, 'online_stock', v)}
//                     onCustom={() => setCustomModal({ productId: product.id, productName: product.name, currentStock: product.online_stock, stockType: 'online_stock' })}
//                   />
//                 </View>
//               </View>

//               {/* Updating overlay */}
//               {updating && (
//                 <View style={s.updatingBanner}>
//                   <ActivityIndicator size="small" color="#3b82f6" />
//                   <Text style={s.updatingText}>Updating stock levels...</Text>
//                 </View>
//               )}
//             </View>
//           );
//         }) : (
//           <View style={s.centered}>
//             <View style={s.emptyIcon}>
//               <Ionicons name="cube-outline" size={36} color="#d1d5db" />
//             </View>
//             <Text style={s.emptyTitle}>No products found</Text>
//             <Text style={s.emptySub}>
//               {search || filter !== 'all'
//                 ? 'No products match your current filters.'
//                 : "You haven't added any products yet."}
//             </Text>
//             {(search || filter !== 'all') && (
//               <TouchableOpacity style={s.clearBtn} onPress={() => { setSearch(''); setFilter('all'); }}>
//                 <Ionicons name="refresh-outline" size={15} color="#3b82f6" />
//                 <Text style={s.clearBtnText}>Clear Filters</Text>
//               </TouchableOpacity>
//             )}
//           </View>
//         )}
//       </ScrollView>
//     </View>
//   );
// };

// // ── Styles ────────────────────────────────────────────────────────────────────

// const s = StyleSheet.create({
//   screen:  { flex: 1, backgroundColor: '#f1f5f9' },
//   centered: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 12 },
//   loadingText: { fontSize: 14, color: '#6b7280', fontWeight: '500' },

//   // Stat bar
//   statBar: {
//     flexDirection: 'row', alignItems: 'center',
//     backgroundColor: 'white', marginHorizontal: 14, marginTop: 12,
//     borderRadius: 12, paddingVertical: 12, paddingHorizontal: 8,
//     borderWidth: 1, borderColor: '#f3f4f6',
//   },
//   statItem:    { flex: 1, alignItems: 'center' },
//   statDivider: { width: 1, height: 28, backgroundColor: '#f3f4f6' },
//   statVal:     { fontSize: 18, fontWeight: '900' },
//   statLabel:   { fontSize: 10, color: '#9ca3af', fontWeight: '600', marginTop: 2 },

//   // Error
//   errorBanner: {
//     flexDirection: 'row', alignItems: 'center', gap: 8,
//     backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fca5a5',
//     marginHorizontal: 14, marginTop: 10, padding: 12, borderRadius: 10,
//   },
//   errorText: { flex: 1, fontSize: 12, color: '#dc2626', fontWeight: '500' },

//   // Search + filter
// // ── Replace these styles in StyleSheet s ─────────────────────────────────────

// toolBar: {
//   paddingHorizontal: 14,
//   marginTop: 12,
//   gap: 10,
// },
// searchBox: {
//   flexDirection: 'row',
//   alignItems: 'center',
//   gap: 8,
//   backgroundColor: 'white',
//   borderRadius: 12,
//   borderWidth: 1,
//   borderColor: '#e5e7eb',
//   paddingHorizontal: 12,
//   paddingVertical: 11,
// },
// searchInput: {
//   flex: 1,
//   fontSize: 14,
//   color: '#111827',
//   padding: 0,
// },

// // ── Filter row
// filterRow: {
//   flexDirection: 'row',
//   gap: 8,
//   paddingVertical: 2,      // prevents clipped shadows
//   paddingHorizontal: 1,
// },
// filterTab: {
//   flexDirection: 'row',
//   alignItems: 'center',
//   gap: 6,
//   backgroundColor: 'white',
//   borderWidth: 1.5,
//   borderColor: '#e5e7eb',
//   paddingHorizontal: 13,
//   paddingVertical: 9,
//   borderRadius: 10,
//   // shadow so inactive tabs don't look flat
//   ...Platform.select({
//     ios: {
//       shadowColor: '#000',
//       shadowOffset: { width: 0, height: 1 },
//       shadowOpacity: 0.06,
//       shadowRadius: 3,
//     },
//     android: { elevation: 2 },
//   }),
// },
// filterTabLabel: {
//   fontSize: 13,
//   fontWeight: '700',
//   color: '#6b7280',
// },
// filterTabLabelActive: {
//   color: '#ffffff',
// },
// filterCount: {
//   minWidth: 20,
//   height: 20,
//   borderRadius: 10,
//   alignItems: 'center',
//   justifyContent: 'center',
//   paddingHorizontal: 5,
// },
// filterCountText: {
//   fontSize: 11,
//   fontWeight: '800',
// },
//   filterTabText: { fontSize: 11, fontWeight: '700', color: '#6b7280' },
//   filterBadge: { minWidth: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
//   filterBadgeText: { fontSize: 10, fontWeight: '700' },

//   // List
//   list:        { flex: 1, marginTop: 12 },
//   listContent: { paddingHorizontal: 14, paddingBottom: 40 },

//   // Card
//   card: {
//     backgroundColor: 'white', borderRadius: 14, padding: 14,
//     marginBottom: 14, borderWidth: 1, borderColor: '#f3f4f6',
//   },
//   cardTop:   { flexDirection: 'row', gap: 12, marginBottom: 14 },
//   imgWrap:   { position: 'relative' },
//   img:        { width: 52, height: 52, borderRadius: 10, borderWidth: 1, borderColor: '#f3f4f6' },
//   imgPlaceholder: { width: 52, height: 52, borderRadius: 10, backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center' },
//   imgDot:    { position: 'absolute', top: -3, right: -3, width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: 'white' },
//   productName: { fontSize: 14, fontWeight: '800', color: '#111827', lineHeight: 20, marginBottom: 4 },
//   metaRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
//   metaText:  { fontSize: 11, color: '#9ca3af', flex: 1 },
//   skuText:   { fontSize: 10, color: '#9ca3af', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
//   priceText: { fontSize: 12, fontWeight: '700', color: '#059669' },
//   statusPill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
//   statusPillText: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },

//   // Progress
//   progressWrap:  { marginBottom: 14 },
//   progressTrack: { height: 5, backgroundColor: '#f3f4f6', borderRadius: 3, overflow: 'hidden', marginBottom: 5 },
//   progressFill:  { height: '100%', borderRadius: 3 },
//   progressText:  { fontSize: 11, color: '#9ca3af', textAlign: 'center' },

//   // Controls
//   controlsWrap:  { gap: 12 },
//   controlSection: { backgroundColor: '#f9fafb', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#f3f4f6' },
//   controlHead:   { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
//   controlLabel:  { fontSize: 12, fontWeight: '700', color: '#374151' },

//   // Updating banner
//   updatingBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center', marginTop: 10, backgroundColor: '#eff6ff', borderRadius: 8, paddingVertical: 10 },
//   updatingText:   { fontSize: 12, color: '#3b82f6', fontWeight: '600' },

//   // Empty
//   emptyIcon:  { width: 72, height: 72, borderRadius: 36, backgroundColor: '#f9fafb', justifyContent: 'center', alignItems: 'center' },
//   emptyTitle: { fontSize: 16, fontWeight: '800', color: '#111827' },
//   emptySub:   { fontSize: 13, color: '#9ca3af', textAlign: 'center', lineHeight: 20 },
//   clearBtn:   { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#eff6ff', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
//   clearBtnText: { fontSize: 13, fontWeight: '700', color: '#3b82f6' },
// });

// // ── StockControl styles ───────────────────────────────────────────────────────

// const sc = StyleSheet.create({
//   row:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
//   circleBtn: { width: 38, height: 38, borderRadius: 19, borderWidth: 2, alignItems: 'center', justifyContent: 'center', backgroundColor: 'white' },
//   circleBtnDim: { borderColor: '#e5e7eb', backgroundColor: '#f9fafb' },
//   inputWrap: { minWidth: 68, borderWidth: 2, borderRadius: 10, backgroundColor: 'white' },
//   input:     { height: 38, textAlign: 'center', fontSize: 17, fontWeight: '800', color: '#111827', paddingHorizontal: 8 },
//   customBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 9, borderRadius: 8 },
//   customBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },
// });

// // ── Modal styles ──────────────────────────────────────────────────────────────

// const m = StyleSheet.create({
//   overlay:    { flex: 1, backgroundColor: 'rgba(15,23,42,0.65)', justifyContent: 'center', alignItems: 'center', padding: 20 },
//   sheet:      { backgroundColor: 'white', borderRadius: 18, width: '100%', maxWidth: 400, maxHeight: '80%', overflow: 'hidden' },
//   head:       { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
//   headIcon:   { width: 34, height: 34, borderRadius: 9, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center' },
//   headTitle:  { fontSize: 16, fontWeight: '800', color: '#111827', flex: 1 },
//   headSub:    { fontSize: 12, color: '#9ca3af', marginTop: 1 },
//   closeBtn:   { width: 30, height: 30, borderRadius: 8, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center' },
//   currentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f9fafb', padding: 14, borderRadius: 10, marginBottom: 16 },
//   currentLabel: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
//   currentVal:   { fontSize: 20, fontWeight: '900', color: '#3b82f6' },
//   toggleRow:  { flexDirection: 'row', gap: 8, marginBottom: 16 },
//   toggleBtn:  { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10, borderWidth: 2, borderColor: '#3b82f6', backgroundColor: 'white' },
//   toggleBtnActive: { backgroundColor: '#3b82f6' },
//   toggleText: { fontSize: 12, fontWeight: '700', color: '#3b82f6' },
//   toggleTextActive: { color: '#fff' },
//   fieldLabel: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 8 },
//   input:      { borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, fontWeight: '700', color: '#111827', backgroundColor: '#f9fafb' },
//   textarea:   { minHeight: 80, textAlignVertical: 'top', fontWeight: '400', fontSize: 14 },
//   preview:    { fontSize: 12, fontWeight: '700', color: '#059669', textAlign: 'center', marginTop: 8 },
//   presetsLabel: { fontSize: 11, fontWeight: '700', color: '#9ca3af', marginBottom: 8, textTransform: 'uppercase' },
//   presetsRow: { flexDirection: 'row', gap: 6 },
//   preset:     { flex: 1, paddingVertical: 8, backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe', borderRadius: 8, alignItems: 'center' },
//   presetText: { fontSize: 12, fontWeight: '800', color: '#3b82f6' },
//   btnRow:     { flexDirection: 'row', gap: 10, marginTop: 20 },
//   cancelBtn:  { flex: 1, paddingVertical: 13, backgroundColor: '#f3f4f6', borderRadius: 10, alignItems: 'center' },
//   cancelBtnText: { fontSize: 14, fontWeight: '700', color: '#374151' },
//   confirmBtn: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 13, backgroundColor: '#3b82f6', borderRadius: 10 },
//   confirmBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
//   confirmMsg: { fontSize: 14, color: '#374151', lineHeight: 22, textAlign: 'center', marginBottom: 16 },
// });

// export default StockManagementScreen;
// src/screens/stock/StockManagementScreen.tsx
import React, { useEffect, useState, useCallback, useContext } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Image, Alert, ActivityIndicator,
  RefreshControl, Modal, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { AppStateContext } from '../../context/AppStateContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// ── Config ────────────────────────────────────────────────────────────────────

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8000';
const API_URL  = `${API_BASE}/user/store/products/`;

interface Product {
  id: number;
  name: string;
  model_name?: string;
  sku?: string;
  online_stock: number;
  total_stock: number;
  price?: number;
  image_url?: string;
  main_image_url?: string;
}

type StockFilter = 'all' | 'low_stock' | 'out_of_stock' | 'overstocked';
type CustomOp    = 'add' | 'subtract' | 'set';

const getStockStatus = (p: Product) => {
  if (p.online_stock <= 0)            return { label: 'Out of Stock', color: '#dc2626', bg: '#fef2f2', icon: 'alert-circle-outline'    as const };
  if (p.online_stock <= 5)            return { label: 'Low Stock',    color: '#d97706', bg: '#fffbeb', icon: 'warning-outline'          as const };
  if (p.online_stock > p.total_stock) return { label: 'Overstocked',  color: '#7c3aed', bg: '#f5f3ff', icon: 'trending-up-outline'      as const };
  return                                     { label: 'In Stock',     color: '#059669', bg: '#f0fdf4', icon: 'checkmark-circle-outline' as const };
};

// ── CustomAmountModal ─────────────────────────────────────────────────────────

const CustomAmountModal: React.FC<{
  visible: boolean;
  productName: string;
  currentStock: number;
  stockType: 'total' | 'online';
  onConfirm: (amount: number) => void;
  onCancel: () => void;
}> = ({ visible, productName, currentStock, stockType, onConfirm, onCancel }) => {
  const [amount, setAmount] = useState('');
  const [op, setOp]         = useState<CustomOp>('add');

  const reset = () => { setAmount(''); setOp('add'); };

  const handleConfirm = () => {
    const n = parseInt(amount, 10);
    if (isNaN(n) || n < 0) { Alert.alert('Invalid Amount', 'Enter a valid number.'); return; }
    let newVal: number;
    if      (op === 'add')      newVal = currentStock + n;
    else if (op === 'subtract') newVal = Math.max(0, currentStock - n);
    else                        newVal = n;
    onConfirm(newVal);
    reset();
  };

  const handleCancel = () => { reset(); onCancel(); };

  const preview = (() => {
    const n = parseInt(amount || '0', 10);
    if (!amount || isNaN(n)) return '';
    if (op === 'add')      return `New stock: ${currentStock + n}`;
    if (op === 'subtract') return `New stock: ${Math.max(0, currentStock - n)}`;
    return `Stock set to: ${amount}`;
  })();

  const OPS: { key: CustomOp; icon: any; label: string; activeColor: string; textColor: string }[] = [
    { key: 'add',      icon: 'add-circle-outline',    label: 'Add',      activeColor: '#3b82f6', textColor: '#3b82f6' },
    { key: 'subtract', icon: 'remove-circle-outline', label: 'Subtract', activeColor: '#dc2626', textColor: '#dc2626' },
    { key: 'set',      icon: 'create-outline',        label: 'Set Exact',activeColor: '#3b82f6', textColor: '#3b82f6' },
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleCancel}>
      <View style={m.overlay}>
        <View style={m.sheet}>
          <View style={m.head}>
            <View style={m.headIcon}>
              <Ionicons name="calculator-outline" size={18} color="#3b82f6" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={m.headTitle}>Custom Stock Amount</Text>
              <Text style={m.headSub} numberOfLines={1}>{productName}</Text>
            </View>
            <TouchableOpacity style={m.closeBtn} onPress={handleCancel}>
              <Ionicons name="close" size={18} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ padding: 16 }} showsVerticalScrollIndicator={false}>
            <View style={m.currentRow}>
              <Text style={m.currentLabel}>Current {stockType === 'total' ? 'Total' : 'Online'} Stock</Text>
              <Text style={m.currentVal}>{currentStock}</Text>
            </View>

            {/* 3-way operation toggle */}
            <View style={[m.toggleRow, { gap: 6 }]}>
              {OPS.map(o => {
                const active = op === o.key;
                return (
                  <TouchableOpacity
                    key={o.key}
                    style={[
                      m.toggleBtn,
                      { borderColor: o.textColor },
                      active && { backgroundColor: o.activeColor, borderColor: o.activeColor },
                    ]}
                    onPress={() => setOp(o.key)}
                  >
                    <Ionicons name={o.icon} size={13} color={active ? '#fff' : o.textColor} />
                    <Text style={[m.toggleText, { color: o.textColor }, active && m.toggleTextActive]}>
                      {o.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={m.fieldLabel}>
              {op === 'add' ? 'Amount to Add' : op === 'subtract' ? 'Amount to Remove' : 'Set Stock To'}
            </Text>
            <TextInput
              style={m.input}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholder="Enter amount"
              placeholderTextColor="#9ca3af"
              autoFocus
            />
            {!!preview && (
              <Text style={[m.preview, op === 'subtract' && { color: '#dc2626' }]}>{preview}</Text>
            )}

            {op !== 'set' && (
              <View style={{ marginTop: 16 }}>
                <Text style={m.presetsLabel}>Quick Presets</Text>
                <View style={m.presetsRow}>
                  {[1, 5, 10, 25, 50].map(n => (
                    <TouchableOpacity
                      key={n}
                      style={[
                        m.preset,
                        op === 'subtract' && { backgroundColor: '#fef2f2', borderColor: '#fca5a5' },
                      ]}
                      onPress={() => setAmount(String(n))}
                    >
                      <Text style={[m.presetText, op === 'subtract' && { color: '#dc2626' }]}>
                        {op === 'subtract' ? `-${n}` : `+${n}`}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <View style={m.btnRow}>
              <TouchableOpacity style={m.cancelBtn} onPress={handleCancel}>
                <Text style={m.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[m.confirmBtn, !amount && { opacity: 0.5 }]}
                onPress={handleConfirm}
                disabled={!amount}
              >
                <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
                <Text style={m.confirmBtnText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// ── ConfirmationModal ─────────────────────────────────────────────────────────

const ConfirmationModal: React.FC<{
  visible: boolean;
  message: string;
  onConfirm: (note: string) => void;
  onCancel: () => void;
  isLoading: boolean;
}> = ({ visible, message, onConfirm, onCancel, isLoading }) => {
  const [note, setNote] = useState('');
  const handleCancel  = () => { setNote(''); onCancel(); };
  const handleConfirm = () => { onConfirm(note); setNote(''); };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleCancel}>
      <View style={m.overlay}>
        <View style={m.sheet}>
          <View style={m.head}>
            <View style={[m.headIcon, { backgroundColor: '#eff6ff' }]}>
              <Ionicons name="cube-outline" size={18} color="#3b82f6" />
            </View>
            <Text style={[m.headTitle, { fontSize: 15 }]}>Confirm Stock Update</Text>
            <TouchableOpacity style={m.closeBtn} onPress={handleCancel} disabled={isLoading}>
              <Ionicons name="close" size={18} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <View style={{ padding: 16 }}>
            <Text style={m.confirmMsg}>{message}</Text>
            <Text style={m.fieldLabel}>Reason for change (optional)</Text>
            <TextInput
              style={[m.input, m.textarea]}
              value={note}
              onChangeText={setNote}
              placeholder="e.g., weekly restock, sale, correction"
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={3}
              editable={!isLoading}
            />
            <View style={m.btnRow}>
              <TouchableOpacity style={m.cancelBtn} onPress={handleCancel} disabled={isLoading}>
                <Text style={m.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[m.confirmBtn, isLoading && { opacity: 0.6 }]}
                onPress={handleConfirm}
                disabled={isLoading}
              >
                {isLoading
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <><Ionicons name="checkmark-circle-outline" size={16} color="#fff" /><Text style={m.confirmBtnText}>Confirm</Text></>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ── StockControl ──────────────────────────────────────────────────────────────
// FIX: uses localVal state so typing doesn't fire API on every keystroke.
// Commits only on blur or keyboard "Done".

const StockControl: React.FC<{
  value: number;
  color: string;
  disabled: boolean;
  maxValue?: number;
  onDecrease: () => void;
  onIncrease: () => void;
  onChange: (v: string) => void;
  onCustom: () => void;
}> = ({ value, color, disabled, maxValue, onDecrease, onIncrease, onChange, onCustom }) => {
  const [localVal, setLocalVal] = useState(String(value));
  const atMax = maxValue !== undefined && value >= maxValue;

  // Sync when external value changes (after API refresh)
  useEffect(() => { setLocalVal(String(value)); }, [value]);

  const commitChange = () => {
    const n = parseInt(localVal, 10);
    if (isNaN(n) || n < 0) { setLocalVal(String(value)); return; }
    if (n !== value) onChange(String(n));
    else setLocalVal(String(value));
  };

  return (
    <View style={{ gap: 8 }}>
      <View style={sc.row}>
        <TouchableOpacity
          style={[sc.circleBtn, { borderColor: color }, (disabled || value <= 0) && sc.circleBtnDim]}
          onPress={onDecrease}
          disabled={disabled || value <= 0}
        >
          <Ionicons name="remove" size={16} color={(disabled || value <= 0) ? '#d1d5db' : color} />
        </TouchableOpacity>

        <View style={[sc.inputWrap, { borderColor: color }]}>
          <TextInput
            style={sc.input}
            value={localVal}
            onChangeText={setLocalVal}
            onBlur={commitChange}
            onSubmitEditing={commitChange}
            keyboardType="numeric"
            textAlign="center"
            editable={!disabled}
            selectTextOnFocus
          />
        </View>

        <TouchableOpacity
          style={[sc.circleBtn, { borderColor: color }, (disabled || atMax) && sc.circleBtnDim]}
          onPress={onIncrease}
          disabled={disabled || atMax}
        >
          <Ionicons name="add" size={16} color={(disabled || atMax) ? '#d1d5db' : color} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[sc.customBtn, { backgroundColor: color }, disabled && { opacity: 0.5 }]}
        onPress={onCustom}
        disabled={disabled}
      >
        <Ionicons name="calculator-outline" size={13} color="#fff" />
        <Text style={sc.customBtnText}>Custom Amount</Text>
      </TouchableOpacity>
    </View>
  );
};

// ── Main screen ───────────────────────────────────────────────────────────────

const StockManagementScreen: React.FC = () => {
  const navigation = useNavigation();
  const { setCurrentTitle, setCurrentSubtitle } = useContext(AppStateContext);

  const [products,     setProducts]     = useState<Product[]>([]);
  const [filtered,     setFiltered]     = useState<Product[]>([]);
  const [isLoading,    setIsLoading]    = useState(true);
  const [search,       setSearch]       = useState('');
  const [filter,       setFilter]       = useState<StockFilter>('all');
  const [error,        setError]        = useState('');
  const [updatingId,   setUpdatingId]   = useState<number | null>(null);
  const [confirmation, setConfirmation] = useState<{ message: string; onConfirm: (note: string) => void } | null>(null);
  const [customModal,  setCustomModal]  = useState<{
    productId: number; productName: string; currentStock: number; stockType: 'total_stock' | 'online_stock';
  } | null>(null);

  useEffect(() => {
    setCurrentTitle('Stock Management');
    setCurrentSubtitle('Quick inventory updates');
  }, []);

  const fetchData = useCallback(async () => {
    const token = await AsyncStorage.getItem('accessToken');
    if (!token) { setError('Authentication required.'); setIsLoading(false); return; }
    try {
      setIsLoading(true); setError('');
      const res = await axios.get(API_URL, { headers: { Authorization: `Bearer ${token}` } });
      const data: Product[] = res.data.results || res.data || [];
      setProducts(data);
    } catch (e: any) {
      setError(e.response?.status === 401
        ? 'Session expired. Please login again.'
        : 'Failed to load products. Check your connection.');
    } finally { setIsLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    let out = [...products];
    if (search.trim()) {
      const q = search.toLowerCase();
      out = out.filter(p =>
        p.name?.toLowerCase().includes(q) ||
        p.model_name?.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q)
      );
    }
    if (filter === 'low_stock')    out = out.filter(p => p.online_stock > 0 && p.online_stock <= 5);
    if (filter === 'out_of_stock') out = out.filter(p => p.online_stock <= 0);
    if (filter === 'overstocked')  out = out.filter(p => p.online_stock > p.total_stock);
    setFiltered(out);
  }, [products, search, filter]);

  // FIX: auto-cap online_stock when total_stock drops below it
  const handleStockChange = (
    productId: number,
    stockType: 'total_stock' | 'online_stock',
    newValue: string | number,
  ) => {
    const val = Math.max(0, parseInt(String(newValue), 10));
    if (isNaN(val)) return;
    const product = products.find(p => p.id === productId);
    if (!product) return;
    const prev  = product[stockType];
    const diff  = val - prev;
    const label = stockType === 'total_stock' ? 'Total Stock' : 'Online Stock';

    // Warn if total drops below online
    const willCapOnline = stockType === 'total_stock' && val < product.online_stock;
    const capNote       = willCapOnline ? `\nOnline stock will also be capped to ${val}.` : '';

    setConfirmation({
      message: `Update ${product.name}'s ${label} from ${prev} to ${val}${diff > 0 ? ` (+${diff})` : diff < 0 ? ` (${diff})` : ''}?${capNote}`,
      onConfirm: async (note: string) => {
        setUpdatingId(productId);
        try {
          const token = await AsyncStorage.getItem('accessToken');

          const patchData: Record<string, any> = {
            [stockType]: val,
            note: note || `${label} updated via mobile`,
          };

          // Auto-cap online_stock if total drops below current online
          if (willCapOnline) patchData.online_stock = val;

          await axios.patch(
            `${API_URL}${productId}/update-stock/`,
            patchData,
            { headers: { Authorization: `Bearer ${token}` } },
          );
          await fetchData();
          Alert.alert('Updated!', `${product.name}'s ${label.toLowerCase()} set to ${val}.`);
        } catch (e: any) {
          const msg = e.response?.data?.error || e.response?.data?.message || 'Could not update stock.';
          setError(msg);
          Alert.alert('Update Failed', msg);
          await fetchData();
        } finally { setConfirmation(null); setUpdatingId(null); }
      },
    });
  };

  // Stats
  const inStock   = products.filter(p => p.online_stock > 5).length;
  const lowStock  = products.filter(p => p.online_stock > 0 && p.online_stock <= 5).length;
  const outStock  = products.filter(p => p.online_stock <= 0).length;
  const overStock = products.filter(p => p.online_stock > p.total_stock).length;

  const FILTER_TABS: { key: StockFilter; label: string; count: number; color: string; icon: any }[] = [
    { key: 'all',          label: 'All',  count: products.length, color: '#3b82f6', icon: 'grid-outline'          },
    { key: 'low_stock',    label: 'Low',  count: lowStock,        color: '#d97706', icon: 'warning-outline'       },
    { key: 'out_of_stock', label: 'Out',  count: outStock,        color: '#dc2626', icon: 'alert-circle-outline'  },
    { key: 'overstocked',  label: 'Over', count: overStock,       color: '#7c3aed', icon: 'trending-up-outline'   },
  ];

  return (
    <View style={s.screen}>

      {/* Modals */}
      {confirmation && (
        <ConfirmationModal
          visible
          message={confirmation.message}
          onConfirm={confirmation.onConfirm}
          onCancel={() => { setConfirmation(null); fetchData(); }}
          isLoading={updatingId !== null}
        />
      )}
      {customModal && (
        <CustomAmountModal
          visible
          productName={customModal.productName}
          currentStock={customModal.currentStock}
          stockType={customModal.stockType === 'total_stock' ? 'total' : 'online'}
          onConfirm={amt => {
            handleStockChange(customModal.productId, customModal.stockType, amt);
            setCustomModal(null);
          }}
          onCancel={() => setCustomModal(null)}
        />
      )}

      {/* ── Stat bar ── */}
      <View style={s.statBar}>
        {[
          { label: 'Total',    value: products.length, color: '#3b82f6' },
          { label: 'In Stock', value: inStock,          color: '#059669' },
          { label: 'Low',      value: lowStock,         color: '#d97706' },
          { label: 'Out',      value: outStock,         color: '#dc2626' },
        ].map((item, idx, arr) => (
          <React.Fragment key={item.label}>
            <View style={s.statItem}>
              <Text style={[s.statVal, { color: item.color }]}>{item.value}</Text>
              <Text style={s.statLabel}>{item.label}</Text>
            </View>
            {idx < arr.length - 1 && <View style={s.statDivider} />}
          </React.Fragment>
        ))}
      </View>

      {/* ── Error banner ── */}
      {!!error && (
        <View style={s.errorBanner}>
          <Ionicons name="alert-circle-outline" size={15} color="#dc2626" />
          <Text style={s.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => setError('')}>
            <Ionicons name="close" size={15} color="#dc2626" />
          </TouchableOpacity>
        </View>
      )}

      {/* ── Search + filter ── */}
      <View style={s.toolBar}>
        <View style={s.searchBox}>
          <Ionicons name="search-outline" size={15} color="#9ca3af" />
          <TextInput
            style={s.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search products..."
            placeholderTextColor="#9ca3af"
          />
          {!!search && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={15} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.filterRow}
          bounces={false}
        >
          {FILTER_TABS.map(tab => {
            const active = filter === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[s.filterTab, active && { backgroundColor: tab.color, borderColor: tab.color }]}
                onPress={() => setFilter(tab.key)}
                activeOpacity={0.8}
              >
                <Ionicons name={tab.icon} size={13} color={active ? '#fff' : tab.color} />
                <Text style={[s.filterTabLabel, active && s.filterTabLabelActive]}>{tab.label}</Text>
                <View style={[s.filterCount, { backgroundColor: active ? 'rgba(255,255,255,0.25)' : tab.color + '18' }]}>
                  <Text style={[s.filterCountText, { color: active ? '#fff' : tab.color }]}>{tab.count}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Product list ── */}
      <ScrollView
        style={s.list}
        contentContainerStyle={s.listContent}
        refreshControl={<RefreshControl refreshing={false} onRefresh={fetchData} tintColor="#3b82f6" />}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={s.centered}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={s.loadingText}>Loading inventory...</Text>
          </View>

        ) : filtered.length > 0 ? filtered.map(product => {
          const status   = getStockStatus(product);
          const updating = updatingId === product.id;
          const progress = Math.min((product.online_stock / Math.max(product.total_stock, 1)) * 100, 100);
          const imgUri   = product.image_url || product.main_image_url;

          return (
            <View key={product.id} style={s.card}>

              {/* Product header */}
              <View style={s.cardTop}>
                <View style={s.imgWrap}>
                  {imgUri
                    ? <Image source={{ uri: imgUri }} style={s.img} />
                    : <View style={s.imgPlaceholder}><Ionicons name="cube-outline" size={24} color="#9ca3af" /></View>
                  }
                  <View style={[s.imgDot, { backgroundColor: status.color }]} />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={s.productName} numberOfLines={2}>{product.name}</Text>
                  {!!product.model_name && (
                    <View style={s.metaRow}>
                      <Ionicons name="car-outline" size={11} color="#9ca3af" />
                      <Text style={s.metaText} numberOfLines={1}>{product.model_name}</Text>
                    </View>
                  )}
                  <View style={s.metaRow}>
                    {!!product.sku   && <Text style={s.skuText}>{product.sku}</Text>}
                    {!!product.price && <Text style={s.priceText}>₹{product.price.toLocaleString('en-IN')}</Text>}
                  </View>
                </View>

                <View style={[s.statusPill, { backgroundColor: status.bg }]}>
                  <Ionicons name={status.icon} size={10} color={status.color} />
                  <Text style={[s.statusPillText, { color: status.color }]}>{status.label}</Text>
                </View>
              </View>

              {/* Progress bar */}
              <View style={s.progressWrap}>
                <View style={s.progressTrack}>
                  <View style={[s.progressFill, { width: `${progress}%`, backgroundColor: status.color }]} />
                </View>
                <Text style={s.progressText}>{product.online_stock} of {product.total_stock} available online</Text>
              </View>

              {/* Stock controls */}
              <View style={s.controlsWrap}>
                <View style={s.controlSection}>
                  <View style={s.controlHead}>
                    <Ionicons name="cube-outline" size={13} color="#3b82f6" />
                    <Text style={s.controlLabel}>Total Stock</Text>
                  </View>
                  <StockControl
                    value={product.total_stock}
                    color="#3b82f6"
                    disabled={updating}
                    onDecrease={() => handleStockChange(product.id, 'total_stock', product.total_stock - 1)}
                    onIncrease={() => handleStockChange(product.id, 'total_stock', product.total_stock + 1)}
                    onChange={v => handleStockChange(product.id, 'total_stock', v)}
                    onCustom={() => setCustomModal({ productId: product.id, productName: product.name, currentStock: product.total_stock, stockType: 'total_stock' })}
                  />
                </View>

                <View style={s.controlSection}>
                  <View style={s.controlHead}>
                    <Ionicons name="globe-outline" size={13} color="#059669" />
                    <Text style={s.controlLabel}>Online Stock</Text>
                  </View>
                  <StockControl
                    value={product.online_stock}
                    color="#059669"
                    disabled={updating}
                    maxValue={product.total_stock}
                    onDecrease={() => handleStockChange(product.id, 'online_stock', product.online_stock - 1)}
                    onIncrease={() => handleStockChange(product.id, 'online_stock', product.online_stock + 1)}
                    onChange={v => handleStockChange(product.id, 'online_stock', v)}
                    onCustom={() => setCustomModal({ productId: product.id, productName: product.name, currentStock: product.online_stock, stockType: 'online_stock' })}
                  />
                </View>
              </View>

              {updating && (
                <View style={s.updatingBanner}>
                  <ActivityIndicator size="small" color="#3b82f6" />
                  <Text style={s.updatingText}>Updating stock levels...</Text>
                </View>
              )}
            </View>
          );
        }) : (
          <View style={s.centered}>
            <View style={s.emptyIcon}>
              <Ionicons name="cube-outline" size={36} color="#d1d5db" />
            </View>
            <Text style={s.emptyTitle}>No products found</Text>
            <Text style={s.emptySub}>
              {search || filter !== 'all'
                ? 'No products match your current filters.'
                : "You haven't added any products yet."}
            </Text>
            {(search || filter !== 'all') && (
              <TouchableOpacity style={s.clearBtn} onPress={() => { setSearch(''); setFilter('all'); }}>
                <Ionicons name="refresh-outline" size={15} color="#3b82f6" />
                <Text style={s.clearBtnText}>Clear Filters</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  screen:      { flex: 1, backgroundColor: '#f1f5f9' },
  centered:    { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 12 },
  loadingText: { fontSize: 14, color: '#6b7280', fontWeight: '500' },

  statBar:     { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', marginHorizontal: 14, marginTop: 12, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 8, borderWidth: 1, borderColor: '#f3f4f6' },
  statItem:    { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, height: 28, backgroundColor: '#f3f4f6' },
  statVal:     { fontSize: 18, fontWeight: '900' },
  statLabel:   { fontSize: 10, color: '#9ca3af', fontWeight: '600', marginTop: 2 },

  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fca5a5', marginHorizontal: 14, marginTop: 10, padding: 12, borderRadius: 10 },
  errorText:   { flex: 1, fontSize: 12, color: '#dc2626', fontWeight: '500' },

  toolBar:     { paddingHorizontal: 14, marginTop: 12, gap: 10 },
  searchBox:   { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'white', borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', paddingHorizontal: 12, paddingVertical: 11 },
  searchInput: { flex: 1, fontSize: 14, color: '#111827', padding: 0 },

  filterRow:          { flexDirection: 'row', gap: 8, paddingVertical: 2, paddingHorizontal: 1 },
  filterTab:          { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'white', borderWidth: 1.5, borderColor: '#e5e7eb', paddingHorizontal: 13, paddingVertical: 9, borderRadius: 10, ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3 }, android: { elevation: 2 } }) },
  filterTabLabel:     { fontSize: 13, fontWeight: '700', color: '#6b7280' },
  filterTabLabelActive: { color: '#ffffff' },
  filterCount:        { minWidth: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  filterCountText:    { fontSize: 11, fontWeight: '800' },

  list:        { flex: 1, marginTop: 12 },
  listContent: { paddingHorizontal: 14, paddingBottom: 40 },

  card:           { backgroundColor: 'white', borderRadius: 14, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: '#f3f4f6' },
  cardTop:        { flexDirection: 'row', gap: 12, marginBottom: 14 },
  imgWrap:        { position: 'relative' },
  img:            { width: 52, height: 52, borderRadius: 10, borderWidth: 1, borderColor: '#f3f4f6' },
  imgPlaceholder: { width: 52, height: 52, borderRadius: 10, backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center' },
  imgDot:         { position: 'absolute', top: -3, right: -3, width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: 'white' },
  productName:    { fontSize: 14, fontWeight: '800', color: '#111827', lineHeight: 20, marginBottom: 4 },
  metaRow:        { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  metaText:       { fontSize: 11, color: '#9ca3af', flex: 1 },
  skuText:        { fontSize: 10, color: '#9ca3af', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  priceText:      { fontSize: 12, fontWeight: '700', color: '#059669' },
  statusPill:     { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  statusPillText: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },

  progressWrap:  { marginBottom: 14 },
  progressTrack: { height: 5, backgroundColor: '#f3f4f6', borderRadius: 3, overflow: 'hidden', marginBottom: 5 },
  progressFill:  { height: '100%', borderRadius: 3 },
  progressText:  { fontSize: 11, color: '#9ca3af', textAlign: 'center' },

  controlsWrap:   { gap: 12 },
  controlSection: { backgroundColor: '#f9fafb', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#f3f4f6' },
  controlHead:    { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  controlLabel:   { fontSize: 12, fontWeight: '700', color: '#374151' },

  updatingBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center', marginTop: 10, backgroundColor: '#eff6ff', borderRadius: 8, paddingVertical: 10 },
  updatingText:   { fontSize: 12, color: '#3b82f6', fontWeight: '600' },

  emptyIcon:    { width: 72, height: 72, borderRadius: 36, backgroundColor: '#f9fafb', justifyContent: 'center', alignItems: 'center' },
  emptyTitle:   { fontSize: 16, fontWeight: '800', color: '#111827' },
  emptySub:     { fontSize: 13, color: '#9ca3af', textAlign: 'center', lineHeight: 20 },
  clearBtn:     { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#eff6ff', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  clearBtnText: { fontSize: 13, fontWeight: '700', color: '#3b82f6' },
});

const sc = StyleSheet.create({
  row:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  circleBtn:    { width: 38, height: 38, borderRadius: 19, borderWidth: 2, alignItems: 'center', justifyContent: 'center', backgroundColor: 'white' },
  circleBtnDim: { borderColor: '#e5e7eb', backgroundColor: '#f9fafb' },
  inputWrap:    { minWidth: 68, borderWidth: 2, borderRadius: 10, backgroundColor: 'white' },
  input:        { height: 38, textAlign: 'center', fontSize: 17, fontWeight: '800', color: '#111827', paddingHorizontal: 8 },
  customBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 9, borderRadius: 8 },
  customBtnText:{ fontSize: 12, fontWeight: '700', color: '#fff' },
});

const m = StyleSheet.create({
  overlay:      { flex: 1, backgroundColor: 'rgba(15,23,42,0.65)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  sheet:        { backgroundColor: 'white', borderRadius: 18, width: '100%', maxWidth: 400, maxHeight: '80%', overflow: 'hidden' },
  head:         { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  headIcon:     { width: 34, height: 34, borderRadius: 9, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center' },
  headTitle:    { fontSize: 16, fontWeight: '800', color: '#111827', flex: 1 },
  headSub:      { fontSize: 12, color: '#9ca3af', marginTop: 1 },
  closeBtn:     { width: 30, height: 30, borderRadius: 8, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center' },
  currentRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f9fafb', padding: 14, borderRadius: 10, marginBottom: 16 },
  currentLabel: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  currentVal:   { fontSize: 20, fontWeight: '900', color: '#3b82f6' },
  toggleRow:    { flexDirection: 'row', gap: 8, marginBottom: 16 },
  toggleBtn:    { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10, borderWidth: 2, borderColor: '#3b82f6', backgroundColor: 'white' },
  toggleBtnActive:  { backgroundColor: '#3b82f6' },
  toggleText:       { fontSize: 11, fontWeight: '700', color: '#3b82f6' },
  toggleTextActive: { color: '#fff' },
  fieldLabel:   { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 8 },
  input:        { borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, fontWeight: '700', color: '#111827', backgroundColor: '#f9fafb' },
  textarea:     { minHeight: 80, textAlignVertical: 'top', fontWeight: '400', fontSize: 14 },
  preview:      { fontSize: 12, fontWeight: '700', color: '#059669', textAlign: 'center', marginTop: 8 },
  presetsLabel: { fontSize: 11, fontWeight: '700', color: '#9ca3af', marginBottom: 8, textTransform: 'uppercase' },
  presetsRow:   { flexDirection: 'row', gap: 6 },
  preset:       { flex: 1, paddingVertical: 8, backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe', borderRadius: 8, alignItems: 'center' },
  presetText:   { fontSize: 12, fontWeight: '800', color: '#3b82f6' },
  btnRow:       { flexDirection: 'row', gap: 10, marginTop: 20 },
  cancelBtn:    { flex: 1, paddingVertical: 13, backgroundColor: '#f3f4f6', borderRadius: 10, alignItems: 'center' },
  cancelBtnText:{ fontSize: 14, fontWeight: '700', color: '#374151' },
  confirmBtn:   { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 13, backgroundColor: '#3b82f6', borderRadius: 10 },
  confirmBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  confirmMsg:   { fontSize: 14, color: '#374151', lineHeight: 22, textAlign: 'center', marginBottom: 16 },
});

export default StockManagementScreen;