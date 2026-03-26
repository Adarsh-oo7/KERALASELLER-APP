// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   ScrollView,
//   TouchableOpacity,
//   RefreshControl,
//   ActivityIndicator,
//   Alert,
// } from 'react-native';
// import { LinearGradient } from 'expo-linear-gradient';
// import { Ionicons } from '@expo/vector-icons';
// import { StackNavigationProp } from '@react-navigation/stack';
// import NotificationService from '../../services/NotificationService';

// // Updated colors for modern design
// const COLORS = {
//   primary: '#3b82f6',
//   primaryLight: '#60a5fa',
//   primarySoft: '#eff6ff',
//   success: '#10b981',
//   error: '#ef4444',
//   warning: '#f59e0b',
//   surface: '#ffffff',
//   background: '#f8fafc',
//   textPrimary: '#1f2937',
//   textSecondary: '#6b7280',
//   textTertiary: '#9ca3af',
//   borderLight: '#e5e7eb',
//   shadowColored: '#3b82f6',
//   shadowMedium: '#000000',
// };

// type NotificationsScreenProps = {
//   navigation: StackNavigationProp<any>;
// };

// interface Notification {
//   id: string;
//   type: 'order' | 'stock' | 'payment' | 'system' | 'marketing';
//   title: string;
//   message: string;
//   time: string;
//   unread: boolean;
//   actionable: boolean;
//   action_url?: string;
// }

// const NotificationsScreen: React.FC<NotificationsScreenProps> = ({ navigation }) => {
//   const [notifications, setNotifications] = useState<Notification[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [filter, setFilter] = useState<'all' | 'unread'>('all');

//   // Sample notifications for Kerala Sellers (fallback)
//   const sampleNotifications: Notification[] = [
//     {
//       id: '1',
//       type: 'order',
//       title: 'New Order Received! 🎉',
//       message: 'Order #KS1234 from Priya Nair for Samsung Galaxy A54 (₹2,450)',
//       time: '2 minutes ago',
//       unread: true,
//       actionable: true,
//       action_url: 'Orders'
//     },
//     {
//       id: '2',
//       type: 'stock',
//       title: 'Low Stock Alert ⚠️',
//       message: 'Samsung Galaxy A54 is running low. Only 3 units left in stock.',
//       time: '1 hour ago',
//       unread: true,
//       actionable: true,
//       action_url: 'Products'
//     },
//     {
//       id: '3',
//       type: 'payment',
//       title: 'Payment Received ✅',
//       message: '₹2,450 payment received from customer Priya Nair via UPI',
//       time: '3 hours ago',
//       unread: false,
//       actionable: false
//     },
//     {
//       id: '4',
//       type: 'order',
//       title: 'Order Delivered 📦',
//       message: 'Order #KS1233 has been successfully delivered to Rajesh Kumar',
//       time: '5 hours ago',
//       unread: false,
//       actionable: true,
//       action_url: 'Orders'
//     },
//     {
//       id: '5',
//       type: 'system',
//       title: 'Profile Updated 👤',
//       message: 'Your Kerala Sellers store profile has been successfully updated',
//       time: '1 day ago',
//       unread: false,
//       actionable: false
//     },
//     {
//       id: '6',
//       type: 'marketing',
//       title: 'Boost Your Sales! 📈',
//       message: 'Try our new marketing tools to reach more customers in Kerala',
//       time: '2 days ago',
//       unread: false,
//       actionable: true,
//       action_url: 'Dashboard'
//     },
//     {
//       id: '7',
//       type: 'stock',
//       title: 'Restock Suggestion 📋',
//       message: 'iPhone 14 is selling well. Consider restocking soon.',
//       time: '3 days ago',
//       unread: false,
//       actionable: true,
//       action_url: 'Products'
//     }
//   ];

//   useEffect(() => {
//     loadNotifications();
//   }, []);

//   // ✅ UPDATED: Load notifications using NotificationService
//   const loadNotifications = async (): Promise<void> => {
//     try {
//       console.log('🔔 NotificationsScreen: Loading notifications...');
      
//       // ✅ USE SERVICE: Load from NotificationService
//       const response = await NotificationService.getNotifications();
//       setNotifications(response.data);
      
//       console.log('✅ Notifications loaded:', response.data.length);
      
//     } catch (error) {
//       console.error('❌ NotificationsScreen: Error loading notifications:', error);
//       // Fallback to sample data if service fails
//       setNotifications(sampleNotifications);
//     } finally {
//       setLoading(false);
//       setRefreshing(false);
//     }
//   };

//   const onRefresh = (): void => {
//     setRefreshing(true);
//     loadNotifications();
//   };

//   // ✅ UPDATED: Mark all as read using NotificationService
//   const markAllAsRead = async (): Promise<void> => {
//     try {
//       console.log('🔔 Marking all notifications as read...');
      
//       await NotificationService.markAllAsRead();
      
//       setNotifications(prevNotifications =>
//         prevNotifications.map(notification => ({
//           ...notification,
//           unread: false
//         }))
//       );
      
//       Alert.alert('✅ Success', 'All notifications marked as read');
      
//     } catch (error) {
//       console.error('❌ Failed to mark all as read:', error);
//       Alert.alert('❌ Error', 'Failed to mark notifications as read');
//     }
//   };

//   // ✅ UPDATED: Clear all notifications using NotificationService
//   const clearAllNotifications = (): void => {
//     Alert.alert(
//       'Clear All Notifications',
//       'Are you sure you want to clear all notifications? This action cannot be undone.',
//       [
//         { text: 'Cancel', style: 'cancel' },
//         { 
//           text: 'Clear All', 
//           style: 'destructive',
//           onPress: async () => {
//             try {
//               await NotificationService.clearAll();
//               setNotifications([]);
//               Alert.alert('🗑️ Cleared', 'All notifications have been cleared');
//             } catch (error) {
//               console.error('❌ Failed to clear notifications:', error);
//               Alert.alert('❌ Error', 'Failed to clear notifications');
//             }
//           }
//         }
//       ]
//     );
//   };

//   // ✅ UPDATED: Handle notification press with service integration
//   const handleNotificationPress = async (notification: Notification): Promise<void> => {
//     try {
//       // ✅ Mark as read using service
//       if (notification.unread) {
//         await NotificationService.markAsRead(notification.id);
//       }
      
//       // Update local state
//       setNotifications(prevNotifications =>
//         prevNotifications.map(n =>
//           n.id === notification.id ? { ...n, unread: false } : n
//         )
//       );

//       if (notification.actionable && notification.action_url) {
//         // Navigate to relevant screen
//         try {
//           if (notification.action_url === 'Orders' || notification.action_url === 'Products') {
//             // Navigate to MainTabs with specific screen
//             navigation.navigate('MainTabs', { screen: notification.action_url });
//           } else if (notification.action_url === 'Dashboard') {
//             navigation.navigate('MainTabs', { screen: 'Dashboard' });
//           } else {
//             navigation.navigate(notification.action_url);
//           }
//         } catch (navError) {
//           Alert.alert('Navigation Error', 'Could not open the requested page');
//         }
//       } else {
//         // Show notification details
//         Alert.alert(
//           notification.title,
//           `${notification.message}\n\nTime: ${notification.time}`,
//           [{ text: 'OK' }]
//         );
//       }
      
//     } catch (error) {
//       console.error('❌ Failed to handle notification press:', error);
//       // Still update UI even if service call fails
//       setNotifications(prevNotifications =>
//         prevNotifications.map(n =>
//           n.id === notification.id ? { ...n, unread: false } : n
//         )
//       );
//     }
//   };

//   const getNotificationIcon = (type: string): string => {
//     switch (type) {
//       case 'order': return 'receipt';
//       case 'stock': return 'cube';
//       case 'payment': return 'card';
//       case 'system': return 'settings';
//       case 'marketing': return 'megaphone';
//       default: return 'notifications';
//     }
//   };

//   const getNotificationColor = (type: string): string => {
//     switch (type) {
//       case 'order': return COLORS.primary;
//       case 'stock': return COLORS.error;
//       case 'payment': return COLORS.success;
//       case 'system': return COLORS.textSecondary;
//       case 'marketing': return COLORS.warning;
//       default: return COLORS.primary;
//     }
//   };

//   const filteredNotifications = notifications.filter(notification => {
//     if (filter === 'all') return true;
//     if (filter === 'unread') return notification.unread;
//     return true;
//   });

//   const unreadCount = notifications.filter(n => n.unread).length;

//   if (loading) {
//     return (
//       <View style={styles.container}>
//         <View style={styles.loadingContainer}>
//           <ActivityIndicator size="large" color={COLORS.primary} />
//           <Text style={styles.loadingText}>Loading notifications...</Text>
//         </View>
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       <ScrollView 
//         style={styles.scrollContainer}
//         refreshControl={
//           <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
//         }
//         showsVerticalScrollIndicator={false}
//       >
        
//         {/* ✅ UPDATED: Header Section */}
//         <View style={styles.headerCard}>
//           <LinearGradient 
//             colors={[COLORS.primary, COLORS.primaryLight]} 
//             style={styles.headerGradient}
//           >
//             <View style={styles.headerIconContainer}>
//               <Ionicons name="notifications" size={32} color={COLORS.surface} />
//             </View>
//             <Text style={styles.headerTitle}>Notifications</Text>
//             <Text style={styles.headerSubtitle}>
//               Stay updated with your Kerala Sellers business
//             </Text>
//             {unreadCount > 0 && (
//               <View style={styles.unreadBadge}>
//                 <Text style={styles.unreadBadgeText}>{unreadCount} unread</Text>
//               </View>
//             )}
//           </LinearGradient>
//         </View>

//         {/* Action Buttons */}
//         <View style={styles.actionsContainer}>
//           <TouchableOpacity 
//             style={[styles.actionButton, unreadCount === 0 && styles.disabledButton]}
//             onPress={markAllAsRead}
//             disabled={unreadCount === 0}
//             activeOpacity={0.7}
//           >
//             <Ionicons 
//               name="checkmark-done" 
//               size={16} 
//               color={unreadCount > 0 ? COLORS.primary : COLORS.textTertiary} 
//             />
//             <Text style={[
//               styles.actionButtonText, 
//               { color: unreadCount > 0 ? COLORS.primary : COLORS.textTertiary }
//             ]}>
//               Mark All Read
//             </Text>
//           </TouchableOpacity>
          
//           <TouchableOpacity 
//             style={[styles.actionButton, notifications.length === 0 && styles.disabledButton]}
//             onPress={clearAllNotifications}
//             disabled={notifications.length === 0}
//             activeOpacity={0.7}
//           >
//             <Ionicons 
//               name="trash-outline" 
//               size={16} 
//               color={notifications.length > 0 ? COLORS.error : COLORS.textTertiary} 
//             />
//             <Text style={[
//               styles.actionButtonText, 
//               { color: notifications.length > 0 ? COLORS.error : COLORS.textTertiary }
//             ]}>
//               Clear All
//             </Text>
//           </TouchableOpacity>
//         </View>

//         {/* Filter Tabs */}
//         <View style={styles.filterContainer}>
//           <TouchableOpacity 
//             style={[styles.filterTab, filter === 'all' && styles.activeFilter]}
//             onPress={() => setFilter('all')}
//             activeOpacity={0.7}
//           >
//             <Text style={[styles.filterText, filter === 'all' && styles.activeFilterText]}>
//               All ({notifications.length})
//             </Text>
//           </TouchableOpacity>
//           <TouchableOpacity 
//             style={[styles.filterTab, filter === 'unread' && styles.activeFilter]}
//             onPress={() => setFilter('unread')}
//             activeOpacity={0.7}
//           >
//             <Text style={[styles.filterText, filter === 'unread' && styles.activeFilterText]}>
//               Unread ({unreadCount})
//             </Text>
//           </TouchableOpacity>
//         </View>

//         {/* Notifications List */}
//         <View style={styles.notificationsContainer}>
//           <View style={styles.sectionHeader}>
//             <Text style={styles.sectionTitle}>Recent Notifications</Text>
//             <Text style={styles.sectionCount}>
//               {filteredNotifications.length} notification{filteredNotifications.length !== 1 ? 's' : ''}
//             </Text>
//           </View>
          
//           {filteredNotifications.length > 0 ? (
//             filteredNotifications.map((notification, index) => (
//               <TouchableOpacity 
//                 key={notification.id} 
//                 style={[
//                   styles.notificationItem,
//                   notification.unread && styles.unreadNotification,
//                   index === filteredNotifications.length - 1 && styles.lastNotificationItem
//                 ]}
//                 onPress={() => handleNotificationPress(notification)}
//                 activeOpacity={0.7}
//               >
//                 <View style={[
//                   styles.notificationIcon,
//                   { backgroundColor: `${getNotificationColor(notification.type)}15` }
//                 ]}>
//                   <Ionicons 
//                     name={getNotificationIcon(notification.type) as any} 
//                     size={20} 
//                     color={getNotificationColor(notification.type)} 
//                   />
//                 </View>
                
//                 <View style={styles.notificationContent}>
//                   <View style={styles.notificationHeader}>
//                     <Text style={styles.notificationTitle} numberOfLines={2}>
//                       {notification.title}
//                     </Text>
//                     {notification.unread && <View style={styles.unreadDot} />}
//                   </View>
//                   <Text style={styles.notificationMessage} numberOfLines={3}>
//                     {notification.message}
//                   </Text>
//                   <View style={styles.notificationFooter}>
//                     <Text style={styles.notificationTime}>
//                       {notification.time}
//                     </Text>
//                     {notification.actionable && (
//                       <View style={styles.actionableTag}>
//                         <Text style={styles.actionableText}>Tap to view</Text>
//                       </View>
//                     )}
//                   </View>
//                 </View>
                
//                 {notification.actionable && (
//                   <View style={styles.chevronContainer}>
//                     <Ionicons name="chevron-forward" size={16} color={COLORS.textTertiary} />
//                   </View>
//                 )}
//               </TouchableOpacity>
//             ))
//           ) : (
//             <View style={styles.emptyContainer}>
//               <View style={styles.emptyIconContainer}>
//                 <Ionicons 
//                   name={filter === 'all' ? 'notifications-off-outline' : 'checkmark-circle-outline'} 
//                   size={48} 
//                   color={COLORS.textTertiary} 
//                 />
//               </View>
//               <Text style={styles.emptyTitle}>
//                 {filter === 'all' ? 'No notifications yet' : 'All caught up!'}
//               </Text>
//               <Text style={styles.emptySubtitle}>
//                 {filter === 'all' 
//                   ? 'Your notifications will appear here when you have activity on your store'
//                   : 'All notifications have been read. Check back later for updates.'
//                 }
//               </Text>
//               {filter === 'unread' && (
//                 <TouchableOpacity 
//                   style={styles.viewAllButton}
//                   onPress={() => setFilter('all')}
//                   activeOpacity={0.7}
//                 >
//                   <Text style={styles.viewAllText}>View All Notifications</Text>
//                 </TouchableOpacity>
//               )}
//             </View>
//           )}
//         </View>

//         <View style={{ height: 40 }} />
//       </ScrollView>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: COLORS.background,
//   },
//   scrollContainer: {
//     flex: 1,
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     gap: 16,
//   },
//   loadingText: {
//     fontSize: 16,
//     color: COLORS.textSecondary,
//   },
  
//   // Header card
//   headerCard: {
//     margin: 20,
//     borderRadius: 16,
//     overflow: 'hidden',
//     elevation: 4,
//     shadowColor: COLORS.shadowColored,
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.2,
//     shadowRadius: 8,
//   },
//   headerGradient: {
//     padding: 24,
//     alignItems: 'center',
//     position: 'relative',
//   },
//   headerIconContainer: {
//     marginBottom: 12,
//   },
//   headerTitle: {
//     fontSize: 20,
//     fontWeight: '700',
//     color: COLORS.surface,
//     marginBottom: 4,
//   },
//   headerSubtitle: {
//     fontSize: 14,
//     color: 'rgba(255, 255, 255, 0.9)',
//     textAlign: 'center',
//   },
//   unreadBadge: {
//     position: 'absolute',
//     top: 16,
//     right: 16,
//     backgroundColor: COLORS.error,
//     borderRadius: 12,
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//   },
//   unreadBadgeText: {
//     color: COLORS.surface,
//     fontSize: 12,
//     fontWeight: '600',
//   },
  
//   // Action buttons
//   actionsContainer: {
//     flexDirection: 'row',
//     marginHorizontal: 20,
//     marginBottom: 16,
//     gap: 12,
//   },
//   actionButton: {
//     flex: 1,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     backgroundColor: COLORS.surface,
//     padding: 12,
//     borderRadius: 8,
//     gap: 8,
//     elevation: 1,
//     shadowColor: COLORS.shadowMedium,
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.1,
//     shadowRadius: 2,
//   },
//   disabledButton: {
//     opacity: 0.6,
//   },
//   actionButtonText: {
//     fontWeight: '600',
//     fontSize: 14,
//   },
  
//   // Filter tabs
//   filterContainer: {
//     flexDirection: 'row',
//     marginHorizontal: 20,
//     marginBottom: 20,
//     backgroundColor: COLORS.surface,
//     borderRadius: 8,
//     padding: 4,
//     elevation: 2,
//     shadowColor: COLORS.shadowMedium,
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.1,
//     shadowRadius: 2,
//   },
//   filterTab: {
//     flex: 1,
//     paddingVertical: 10,
//     alignItems: 'center',
//     borderRadius: 6,
//   },
//   activeFilter: {
//     backgroundColor: COLORS.primary,
//   },
//   filterText: {
//     fontSize: 14,
//     color: COLORS.textSecondary,
//     fontWeight: '500',
//   },
//   activeFilterText: {
//     color: COLORS.surface,
//     fontWeight: '600',
//   },
  
//   // Notifications container
//   notificationsContainer: {
//     backgroundColor: COLORS.surface,
//     marginHorizontal: 20,
//     padding: 20,
//     borderRadius: 12,
//     elevation: 2,
//     shadowColor: COLORS.shadowMedium,
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//   },
//   sectionHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 16,
//   },
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: COLORS.textPrimary,
//   },
//   sectionCount: {
//     fontSize: 12,
//     color: COLORS.textTertiary,
//     backgroundColor: COLORS.background,
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     borderRadius: 12,
//   },
  
//   // Notification items
//   notificationItem: {
//     flexDirection: 'row',
//     alignItems: 'flex-start',
//     paddingVertical: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: COLORS.borderLight,
//     gap: 12,
//   },
//   lastNotificationItem: {
//     borderBottomWidth: 0,
//   },
//   unreadNotification: {
//     backgroundColor: COLORS.primarySoft,
//     borderRadius: 8,
//     paddingHorizontal: 8,
//     marginHorizontal: -8,
//   },
//   notificationIcon: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginTop: 4,
//   },
//   notificationContent: {
//     flex: 1,
//   },
//   notificationHeader: {
//     flexDirection: 'row',
//     alignItems: 'flex-start',
//     justifyContent: 'space-between',
//     marginBottom: 6,
//   },
//   notificationTitle: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: COLORS.textPrimary,
//     flex: 1,
//     marginRight: 8,
//   },
//   unreadDot: {
//     width: 8,
//     height: 8,
//     borderRadius: 4,
//     backgroundColor: COLORS.error,
//     marginTop: 4,
//   },
//   notificationMessage: {
//     fontSize: 14,
//     color: COLORS.textSecondary,
//     marginBottom: 8,
//     lineHeight: 20,
//   },
//   notificationFooter: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//   },
//   notificationTime: {
//     fontSize: 12,
//     color: COLORS.textTertiary,
//   },
//   actionableTag: {
//     backgroundColor: COLORS.primary + '15',
//     paddingHorizontal: 6,
//     paddingVertical: 2,
//     borderRadius: 4,
//   },
//   actionableText: {
//     fontSize: 10,
//     color: COLORS.primary,
//     fontWeight: '600',
//   },
//   chevronContainer: {
//     marginTop: 4,
//   },
  
//   // Empty state
//   emptyContainer: {
//     alignItems: 'center',
//     paddingVertical: 40,
//   },
//   emptyIconContainer: {
//     marginBottom: 16,
//   },
//   emptyTitle: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: COLORS.textSecondary,
//     marginBottom: 8,
//     textAlign: 'center',
//   },
//   emptySubtitle: {
//     fontSize: 14,
//     color: COLORS.textTertiary,
//     textAlign: 'center',
//     lineHeight: 20,
//     marginBottom: 20,
//   },
//   viewAllButton: {
//     backgroundColor: COLORS.primary,
//     paddingHorizontal: 20,
//     paddingVertical: 10,
//     borderRadius: 8,
//   },
//   viewAllText: {
//     color: COLORS.surface,
//     fontSize: 14,
//     fontWeight: '600',
//   },
// });

// export default NotificationsScreen;
// src/screens/notifications/NotificationsScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import NotificationService from '../../services/NotificationService';

type Props = { navigation: StackNavigationProp<any> };

interface Notification {
  id:          string;
  type:        'order' | 'stock' | 'payment' | 'system' | 'marketing';
  title:       string;
  message:     string;
  time:        string;
  unread:      boolean;
  actionable:  boolean;
  action_url?: string;
}

// ── Fallback sample data ───────────────────────────────────────────────────────

const SAMPLE: Notification[] = [
  { id: '1', type: 'order',     title: 'New Order Received',    message: 'Order #KS1234 from Priya Nair for Samsung Galaxy A54 (₹2,450)',  time: '2 min ago',  unread: true,  actionable: true,  action_url: 'Orders' },
  { id: '2', type: 'stock',     title: 'Low Stock Alert',       message: 'Samsung Galaxy A54 is running low. Only 3 units left.',           time: '1 hr ago',   unread: true,  actionable: true,  action_url: 'Products' },
  { id: '3', type: 'payment',   title: 'Payment Received',      message: '₹2,450 received from Priya Nair via UPI.',                        time: '3 hr ago',   unread: false, actionable: false },
  { id: '4', type: 'order',     title: 'Order Delivered',       message: 'Order #KS1233 delivered to Rajesh Kumar.',                        time: '5 hr ago',   unread: false, actionable: true,  action_url: 'Orders' },
  { id: '5', type: 'system',    title: 'Profile Updated',       message: 'Your store profile was successfully updated.',                    time: '1 day ago',  unread: false, actionable: false },
  { id: '6', type: 'marketing', title: 'Boost Your Sales',      message: 'Try our new marketing tools to reach more customers.',           time: '2 days ago', unread: false, actionable: true,  action_url: 'Dashboard' },
  { id: '7', type: 'stock',     title: 'Restock Suggestion',    message: 'iPhone 14 is selling well. Consider restocking soon.',           time: '3 days ago', unread: false, actionable: true,  action_url: 'Products' },
];

// ── Icon / colour helpers ─────────────────────────────────────────────────────

const TYPE_ICON: Record<Notification['type'], string> = {
  order:     'receipt',
  stock:     'cube',
  payment:   'card',
  system:    'settings',
  marketing: 'megaphone',
};

const TYPE_COLOR: Record<Notification['type'], string> = {
  order:     '#3b82f6',
  stock:     '#ef4444',
  payment:   '#10b981',
  system:    '#6b7280',
  marketing: '#f59e0b',
};

// ── Component ─────────────────────────────────────────────────────────────────

const NotificationsScreen: React.FC<Props> = ({ navigation }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [refreshing,    setRefreshing]    = useState(false);
  const [filter,        setFilter]        = useState<'all' | 'unread'>('all');

  // ── Data ──────────────────────────────────────────────────────────────────

  const loadNotifications = useCallback(async () => {
    try {
      const response = await NotificationService.getNotifications();
      setNotifications(response.data ?? []);
    } catch {
      setNotifications(SAMPLE);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadNotifications(); }, [loadNotifications]);

  const onRefresh = () => { setRefreshing(true); loadNotifications(); };

  // ── Actions ───────────────────────────────────────────────────────────────

  const markAllAsRead = async () => {
    try {
      await NotificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
    } catch {
      Alert.alert('Error', 'Failed to mark notifications as read');
    }
  };

  const clearAll = () => {
    Alert.alert(
      'Clear All',
      'This will delete all notifications. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All', style: 'destructive',
          onPress: async () => {
            try {
              await NotificationService.clearAll();
              setNotifications([]);
            } catch {
              Alert.alert('Error', 'Failed to clear notifications');
            }
          },
        },
      ]
    );
  };

  const handlePress = async (n: Notification) => {
    // Mark read locally first (optimistic)
    setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, unread: false } : x));

    // Fire-and-forget service call
    if (n.unread) NotificationService.markAsRead(n.id).catch(() => {});

    if (n.actionable && n.action_url) {
      try {
        if (['Orders', 'Products', 'Dashboard'].includes(n.action_url)) {
          navigation.navigate('MainTabs', { screen: n.action_url });
        } else {
          navigation.navigate(n.action_url);
        }
      } catch {
        Alert.alert('Navigation Error', 'Could not open the requested page');
      }
    } else {
      Alert.alert(n.title, `${n.message}\n\n${n.time}`);
    }
  };

  // ── Derived state ─────────────────────────────────────────────────────────

  const unreadCount        = notifications.filter(n => n.unread).length;
  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => n.unread)
    : notifications;

  // ── Loading ───────────────────────────────────────────────────────────────

  if (loading) return (
    <View style={s.center}>
      <ActivityIndicator size="large" color="#3b82f6" />
      <Text style={s.loadingText}>Loading notifications…</Text>
    </View>
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <View style={s.root}>
      <ScrollView
        style={{ flex: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3b82f6']} />}
        showsVerticalScrollIndicator={false}
      >

        {/* Header */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            <Text style={s.headerTitle}>Notifications</Text>
            <Text style={s.headerSub}>Stay updated with your store activity</Text>
          </View>
          {unreadCount > 0 && (
            <View style={s.unreadPill}>
              <Text style={s.unreadPillText}>{unreadCount} unread</Text>
            </View>
          )}
        </View>

        {/* Action row */}
        <View style={s.actionRow}>
          <TouchableOpacity
            style={[s.actionBtn, unreadCount === 0 && s.actionBtnDisabled]}
            onPress={markAllAsRead}
            disabled={unreadCount === 0}
          >
            <Ionicons name="checkmark-done" size={15} color={unreadCount > 0 ? '#3b82f6' : '#9ca3af'} />
            <Text style={[s.actionBtnText, { color: unreadCount > 0 ? '#3b82f6' : '#9ca3af' }]}>
              Mark All Read
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.actionBtn, notifications.length === 0 && s.actionBtnDisabled]}
            onPress={clearAll}
            disabled={notifications.length === 0}
          >
            <Ionicons name="trash-outline" size={15} color={notifications.length > 0 ? '#ef4444' : '#9ca3af'} />
            <Text style={[s.actionBtnText, { color: notifications.length > 0 ? '#ef4444' : '#9ca3af' }]}>
              Clear All
            </Text>
          </TouchableOpacity>
        </View>

        {/* Filter tabs */}
        <View style={s.filterRow}>
          {(['all', 'unread'] as const).map(f => (
            <TouchableOpacity
              key={f}
              style={[s.filterTab, filter === f && s.filterTabActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[s.filterText, filter === f && s.filterTextActive]}>
                {f === 'all'
                  ? `All (${notifications.length})`
                  : `Unread (${unreadCount})`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* List */}
        <View style={s.listCard}>
          <View style={s.listHeader}>
            <Text style={s.listTitle}>Recent</Text>
            <View style={s.countPill}>
              <Text style={s.countText}>
                {filteredNotifications.length} {filteredNotifications.length === 1 ? 'item' : 'items'}
              </Text>
            </View>
          </View>

          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((n, i) => {
              const color = TYPE_COLOR[n.type];
              const isLast = i === filteredNotifications.length - 1;
              return (
                <TouchableOpacity
                  key={n.id}
                  style={[
                    s.notifItem,
                    n.unread && s.notifItemUnread,
                    isLast && s.notifItemLast,
                  ]}
                  onPress={() => handlePress(n)}
                  activeOpacity={0.7}
                >
                  {/* Icon */}
                  <View style={[s.notifIcon, { backgroundColor: color + '18' }]}>
                    <Ionicons name={TYPE_ICON[n.type] as any} size={20} color={color} />
                  </View>

                  {/* Content */}
                  <View style={s.notifBody}>
                    <View style={s.notifTitleRow}>
                      <Text style={s.notifTitle} numberOfLines={2}>{n.title}</Text>
                      {n.unread && <View style={s.unreadDot} />}
                    </View>
                    <Text style={s.notifMsg} numberOfLines={2}>{n.message}</Text>
                    <View style={s.notifFooter}>
                      <Text style={s.notifTime}>{n.time}</Text>
                      {n.actionable && (
                        <View style={s.tapTag}>
                          <Text style={s.tapTagText}>Tap to view</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {n.actionable && (
                    <Ionicons name="chevron-forward" size={16} color="#d1d5db" style={{ marginTop: 2 }} />
                  )}
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={s.empty}>
              <Ionicons
                name={filter === 'all' ? 'notifications-off-outline' : 'checkmark-circle-outline'}
                size={44}
                color="#d1d5db"
              />
              <Text style={s.emptyTitle}>
                {filter === 'all' ? 'No notifications yet' : 'All caught up!'}
              </Text>
              <Text style={s.emptySub}>
                {filter === 'all'
                  ? 'Activity on your store will appear here.'
                  : 'You have no unread notifications.'}
              </Text>
              {filter === 'unread' && (
                <TouchableOpacity style={s.viewAllBtn} onPress={() => setFilter('all')}>
                  <Text style={s.viewAllText}>View All</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const shadow = Platform.select({
  ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6 },
  android: { elevation: 2 },
});

const s = StyleSheet.create({
  root:            { flex: 1, backgroundColor: '#f8fafc' },
  center:          { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 14 },
  loadingText:     { fontSize: 15, color: '#6b7280' },

  // Header
  header:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16 },
  headerLeft:      { flex: 1 },
  headerTitle:     { fontSize: 24, fontWeight: '800', color: '#111827' },
  headerSub:       { fontSize: 13, color: '#6b7280', marginTop: 3 },
  unreadPill:      { backgroundColor: '#ef4444', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  unreadPillText:  { color: 'white', fontSize: 12, fontWeight: '700' },

  // Actions
  actionRow:       { flexDirection: 'row', gap: 10, marginHorizontal: 20, marginBottom: 14 },
  actionBtn:       { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: 'white', padding: 11, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb', ...shadow },
  actionBtnDisabled: { opacity: 0.5 },
  actionBtnText:   { fontSize: 13, fontWeight: '600' },

  // Filters
  filterRow:       { flexDirection: 'row', marginHorizontal: 20, marginBottom: 16, backgroundColor: 'white', borderRadius: 10, padding: 4, borderWidth: 1, borderColor: '#e5e7eb' },
  filterTab:       { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 7 },
  filterTabActive: { backgroundColor: '#3b82f6' },
  filterText:      { fontSize: 13, fontWeight: '500', color: '#6b7280' },
  filterTextActive:{ color: 'white', fontWeight: '700' },

  // List card
  listCard:        { backgroundColor: 'white', marginHorizontal: 20, borderRadius: 16, padding: 16, ...shadow },
  listHeader:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  listTitle:       { fontSize: 16, fontWeight: '700', color: '#111827' },
  countPill:       { backgroundColor: '#f3f4f6', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  countText:       { fontSize: 12, color: '#6b7280', fontWeight: '500' },

  // Notification items
  notifItem:       { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', gap: 12 },
  notifItemLast:   { borderBottomWidth: 0 },
  notifItemUnread: { backgroundColor: '#eff6ff', borderRadius: 10, paddingHorizontal: 8, marginHorizontal: -8 },
  notifIcon:       { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  notifBody:       { flex: 1 },
  notifTitleRow:   { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 },
  notifTitle:      { fontSize: 14, fontWeight: '700', color: '#111827', flex: 1, marginRight: 8 },
  unreadDot:       { width: 8, height: 8, borderRadius: 4, backgroundColor: '#3b82f6', marginTop: 4 },
  notifMsg:        { fontSize: 13, color: '#6b7280', lineHeight: 18, marginBottom: 6 },
  notifFooter:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  notifTime:       { fontSize: 11, color: '#9ca3af' },
  tapTag:          { backgroundColor: '#eff6ff', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  tapTagText:      { fontSize: 10, color: '#3b82f6', fontWeight: '600' },

  // Empty
  empty:           { alignItems: 'center', paddingVertical: 44, gap: 8 },
  emptyTitle:      { fontSize: 16, fontWeight: '700', color: '#6b7280' },
  emptySub:        { fontSize: 13, color: '#9ca3af', textAlign: 'center', lineHeight: 20, paddingHorizontal: 16 },
  viewAllBtn:      { backgroundColor: '#3b82f6', paddingHorizontal: 20, paddingVertical: 9, borderRadius: 8, marginTop: 8 },
  viewAllText:     { color: 'white', fontSize: 13, fontWeight: '600' },
});

export default NotificationsScreen;
