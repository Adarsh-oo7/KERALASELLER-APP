// import React, { useRef, useEffect, useState, useContext } from 'react';
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   StyleSheet,
//   Platform,
//   Animated,
//   Dimensions,
//   ScrollView, // ✅ FIXED: Added ScrollView import
// } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import { AppStateContext } from '../navigation/AppNavigator';

// const { width: SCREEN_WIDTH } = Dimensions.get('window');

// interface TabRoute {
//   key: string;
//   name: string;
// }

// interface TabState {
//   index: number;
//   routes: TabRoute[];
// }

// interface TabDescriptor {
//   options: any;
//   navigation: any;
// }

// interface BottomTabsProps {
//   state: TabState;
//   descriptors: { [key: string]: TabDescriptor };
//   navigation: any;
// }

// const BottomTabs: React.FC<BottomTabsProps> = ({ state, descriptors, navigation }) => {
//   const [isInitialized, setIsInitialized] = useState(false);
  
//   // ✅ Get notification count from context (with fallback)
//   const appStateContext = useContext(AppStateContext);
//   const notificationCount = appStateContext?.notificationCount || 0;
  
//   // Animation refs
//   const bubblePosition = useRef(new Animated.Value(0)).current;
//   const bubbleScale = useRef(new Animated.Value(1)).current;
  
//   const tabAnimations = useRef(
//     Array(5).fill(0).map(() => ({ // ✅ BACK TO: 5 tabs (keeping it simple)
//       scale: new Animated.Value(1),
//       translateY: new Animated.Value(0),
//     }))
//   ).current;

//   // ✅ SIMPLIFIED: Keep original 5 tabs, notifications via TopBar only
//   const tabItems = [
//     { id: 'dashboard', name: 'Dashboard', icon: 'home-outline', iconFilled: 'home', route: 'Dashboard' },
//     { id: 'products', name: 'Products', icon: 'cube-outline', iconFilled: 'cube', route: 'Products' },
//     { id: 'add', name: 'Add', icon: 'add-circle-outline', iconFilled: 'add-circle', route: 'AddProduct', isSpecial: true },
//     { id: 'orders', name: 'Orders', icon: 'bag-handle-outline', iconFilled: 'bag-handle', route: 'Orders' },
//     { id: 'history', name: 'History', icon: 'time-outline', iconFilled: 'time', route: 'History' },
//   ];

//   // ✅ BACK TO: Calculate precise bubble position for 5 tabs
//   const calculateBubblePosition = (tabIndex: number): number => {
//     const MARGIN = 16;
//     const PADDING = 8;
//     const BUBBLE_WIDTH = 60;
    
//     const containerWidth = SCREEN_WIDTH - (MARGIN * 2);
//     const contentWidth = containerWidth - (PADDING * 2);
//     const tabWidth = contentWidth / 5; // ✅ 5 tabs
    
//     // Calculate the center of the target tab
//     const tabCenterX = tabIndex * tabWidth + (tabWidth / 2);
    
//     // Position bubble center at tab center
//     return tabCenterX - (BUBBLE_WIDTH / 2);
//   };

//   // ✅ Get current tab index (simplified)
//   const getCurrentTabIndex = (): number => {
//     const currentRouteName = state.routes[state.index]?.name;
//     const tabIndex = tabItems.findIndex(item => item.route === currentRouteName);
//     return tabIndex >= 0 ? tabIndex : 0; // Default to Dashboard if not found
//   };

//   // Initialize bubble position
//   useEffect(() => {
//     const initialIndex = getCurrentTabIndex();
//     const initialPosition = calculateBubblePosition(initialIndex);
    
//     bubblePosition.setValue(initialPosition);
//     setIsInitialized(true);
//   }, []);

//   // Animate bubble when tab changes
//   useEffect(() => {
//     if (!isInitialized) return;
    
//     const currentIndex = getCurrentTabIndex();
//     const targetPosition = calculateBubblePosition(currentIndex);
    
//     Animated.parallel([
//       Animated.spring(bubblePosition, {
//         toValue: targetPosition,
//         useNativeDriver: true,
//         tension: 80,
//         friction: 12,
//       }),
//       Animated.sequence([
//         Animated.timing(bubbleScale, {
//           toValue: 0.95,
//           duration: 100,
//           useNativeDriver: true,
//         }),
//         Animated.spring(bubbleScale, {
//           toValue: 1,
//           useNativeDriver: true,
//           tension: 150,
//           friction: 7,
//         }),
//       ]),
//     ]).start();
//   }, [state.index, isInitialized]);

//   const handleTabPress = (item: any, index: number): void => {
//     const currentIndex = getCurrentTabIndex();
//     if (currentIndex === index) return;

//     // Tab press animation
//     Animated.parallel([
//       Animated.sequence([
//         Animated.timing(tabAnimations[index].scale, {
//           toValue: 0.85,
//           duration: 80,
//           useNativeDriver: true,
//         }),
//         Animated.spring(tabAnimations[index].scale, {
//           toValue: 1,
//           useNativeDriver: true,
//           tension: 200,
//           friction: 8,
//         }),
//       ]),
//       Animated.sequence([
//         Animated.timing(tabAnimations[index].translateY, {
//           toValue: -3,
//           duration: 80,
//           useNativeDriver: true,
//         }),
//         Animated.spring(tabAnimations[index].translateY, {
//           toValue: 0,
//           useNativeDriver: true,
//           tension: 200,
//           friction: 8,
//         }),
//       ]),
//     ]).start();

//     // Navigate
//     navigation.navigate(item.route);
//   };

//   return (
//     <View style={styles.container}>
//       <View style={styles.curvedBackground}>
        
//         {/* Animated Bubble */}
//         <Animated.View
//           style={[
//             styles.movingBubble,
//             {
//               opacity: isInitialized ? 1 : 0,
//               transform: [
//                 { translateX: bubblePosition },
//                 { scale: bubbleScale },
//               ],
//             },
//           ]}
//         />

//         {/* Tabs Container */}
//         <View style={styles.tabContainer}>
//           {tabItems.map((item, index) => {
//             const currentIndex = getCurrentTabIndex();
//             const isActive = currentIndex === index;
            
//             return (
//               <TouchableOpacity
//                 key={item.id}
//                 style={styles.tabItem}
//                 onPress={() => handleTabPress(item, index)}
//                 activeOpacity={0.9}
//               >
//                 <Animated.View
//                   style={[
//                     styles.tabContent,
//                     {
//                       transform: [
//                         { scale: tabAnimations[index].scale },
//                         { translateY: tabAnimations[index].translateY },
//                       ],
//                     },
//                   ]}
//                 >
//                   {/* Icon Container */}
//                   <View
//                     style={[
//                       styles.iconWrapper,
//                       item.isSpecial && !isActive && styles.specialIconWrapper,
//                     ]}
//                   >
//                     <Ionicons
//                       name={isActive ? item.iconFilled : item.icon}
//                       size={item.isSpecial ? 30 : 26} // ✅ BACK TO: Original sizes
//                       color={isActive ? '#ffffff' : item.isSpecial ? '#3b82f6' : '#94a3b8'}
//                     />
//                   </View>
                  
//                   {/* Label */}
//                   <Text
//                     style={[
//                       styles.label,
//                       item.isSpecial && !isActive && styles.specialLabel,
//                       isActive && styles.activeLabel,
//                     ]}
//                     numberOfLines={1}
//                   >
//                     {item.name}
//                   </Text>
//                 </Animated.View>
//               </TouchableOpacity>
//             );
//           })}
//         </View>
//       </View>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     backgroundColor: '#f9fafb',
//     paddingBottom: Platform.OS === 'ios' ? 30 : 16,
//     paddingTop: 6,
//   },

//   curvedBackground: {
//     position: 'relative',
//     backgroundColor: '#ffffff',
//     marginHorizontal: 16,
//     borderRadius: 30,
//     paddingVertical: 10,
//     paddingHorizontal: 8,
    
//     // iOS shadow
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.06,
//     shadowRadius: 16,
    
//     // Android shadow
//     elevation: 6,
    
//     // Border
//     borderWidth: 1,
//     borderColor: 'rgba(0, 0, 0, 0.03)',
//   },

//   movingBubble: {
//     position: 'absolute',
//     top: 8,
//     left: 8,
//     width: 60,
//     height: 60,
//     backgroundColor: '#3b82f6',
//     borderRadius: 30,
    
//     // Glow effect
//     shadowColor: '#3b82f6',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.35,
//     shadowRadius: 12,
//     elevation: 10,
//   },

//   tabContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-evenly',
//     height: 60,
//     zIndex: 2,
//   },

//   tabItem: {
//     flex: 1,
//     alignItems: 'center',
//     justifyContent: 'center',
//     height: '100%',
//   },

//   tabContent: {
//     alignItems: 'center',
//     justifyContent: 'center',
//   },

//   iconWrapper: {
//     alignItems: 'center',
//     justifyContent: 'center',
//     width: 40, // ✅ BACK TO: Original sizes
//     height: 40,
//     marginBottom: 2,
//   },

//   specialIconWrapper: {
//     backgroundColor: 'rgba(59, 130, 246, 0.08)',
//     borderRadius: 20,
//     borderWidth: 1.5,
//     borderColor: 'rgba(59, 130, 246, 0.15)',
//   },

//   label: {
//     fontSize: 10, // ✅ BACK TO: Original font size
//     color: '#94a3b8',
//     fontWeight: '600',
//     textAlign: 'center',
//     letterSpacing: 0.3,
//     marginTop: 1,
//   },

//   specialLabel: {
//     color: '#3b82f6',
//     fontWeight: '700',
//   },

//   activeLabel: {
//     color: '#ffffff',
//     fontWeight: '700',
//     fontSize: 10.5,
//     textShadowColor: 'rgba(0, 0, 0, 0.1)',
//     textShadowOffset: { width: 0, height: 1 },
//     textShadowRadius: 2,
//   },
// });

// export default BottomTabs;
import React, { useRef, useEffect, useState, useContext } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Platform, Animated, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppStateContext } from '../navigation/AppNavigator';

const { width: SW } = Dimensions.get('window');

const MARGIN      = 14;
const PADDING     = 8;
const TAB_COUNT   = 5;
const BUBBLE_W    = 56;
const BUBBLE_H    = 56;
const BAR_H       = 64;

interface TabRoute { key: string; name: string; }
interface TabState { index: number; routes: TabRoute[]; }
interface TabDescriptor { options: any; navigation: any; }
interface BottomTabsProps {
  state: TabState;
  descriptors: { [key: string]: TabDescriptor };
  navigation: any;
}

const TABS = [
  { id: 'dashboard', label: 'Home',     icon: 'home-outline' as const,        iconFilled: 'home' as const,         route: 'Dashboard'  },
  { id: 'products',  label: 'Products', icon: 'cube-outline' as const,         iconFilled: 'cube' as const,          route: 'Products'   },
  { id: 'add',       label: 'Add',      icon: 'add-circle-outline' as const,   iconFilled: 'add-circle' as const,    route: 'AddProduct', isSpecial: true },
  { id: 'orders',    label: 'Orders',   icon: 'bag-handle-outline' as const,   iconFilled: 'bag-handle' as const,   route: 'Orders'     },
  { id: 'history',   label: 'History',  icon: 'time-outline' as const,         iconFilled: 'time' as const,          route: 'History'    },
];

// Precise bubble X for a given tab index
const bubbleX = (idx: number): number => {
  const contentW = (SW - MARGIN * 2) - PADDING * 2;
  const tabW     = contentW / TAB_COUNT;
  return idx * tabW + tabW / 2 - BUBBLE_W / 2;
};

const BottomTabs: React.FC<BottomTabsProps> = ({ state, descriptors, navigation }) => {
  const { notificationCount = 0 } = useContext(AppStateContext) || {};
  const [ready, setReady] = useState(false);

  // Animated values
  const bubblePos   = useRef(new Animated.Value(0)).current;
  const bubbleScale = useRef(new Animated.Value(1)).current;
  const tabScales   = useRef(TABS.map(() => new Animated.Value(1))).current;
  const tabShifts   = useRef(TABS.map(() => new Animated.Value(0))).current;

  const activeIdx = (() => {
    const name = state.routes[state.index]?.name;
    const i = TABS.findIndex(t => t.route === name);
    return i >= 0 ? i : 0;
  })();

  // Init
  useEffect(() => {
    bubblePos.setValue(bubbleX(activeIdx));
    setReady(true);
  }, []);

  // Bubble slide on tab change
  useEffect(() => {
    if (!ready) return;
    Animated.parallel([
      Animated.spring(bubblePos, {
        toValue: bubbleX(activeIdx),
        useNativeDriver: true,
        tension: 70, friction: 11,
      }),
      Animated.sequence([
        Animated.timing(bubbleScale, { toValue: 0.9, duration: 80, useNativeDriver: true }),
        Animated.spring(bubbleScale, { toValue: 1, useNativeDriver: true, tension: 160, friction: 7 }),
      ]),
    ]).start();
  }, [activeIdx, ready]);

  const handlePress = (tab: typeof TABS[0], idx: number) => {
    if (idx === activeIdx) return;

    // Tap animation
    Animated.parallel([
      Animated.sequence([
        Animated.timing(tabScales[idx], { toValue: 0.8, duration: 70, useNativeDriver: true }),
        Animated.spring(tabScales[idx],  { toValue: 1,   useNativeDriver: true, tension: 200, friction: 8 }),
      ]),
      Animated.sequence([
        Animated.timing(tabShifts[idx], { toValue: -4, duration: 70, useNativeDriver: true }),
        Animated.spring(tabShifts[idx],  { toValue: 0,  useNativeDriver: true, tension: 200, friction: 8 }),
      ]),
    ]).start();

    navigation.navigate(tab.route);
  };

  return (
    <View style={s.root}>
      <View style={s.bar}>

        {/* Sliding bubble */}
        <Animated.View
          style={[
            s.bubble,
            {
              opacity: ready ? 1 : 0,
              transform: [{ translateX: bubblePos }, { scale: bubbleScale }],
            },
          ]}
        />

        {/* Tabs */}
        <View style={s.tabs}>
          {TABS.map((tab, idx) => {
            const isActive  = idx === activeIdx;
            const isSpecial = !!tab.isSpecial;

            return (
              <TouchableOpacity
                key={tab.id}
                style={s.tab}
                onPress={() => handlePress(tab, idx)}
                activeOpacity={0.85}
              >
                <Animated.View
                  style={[
                    s.tabInner,
                    { transform: [{ scale: tabScales[idx] }, { translateY: tabShifts[idx] }] },
                  ]}
                >
                  {/* Icon */}
                  <View style={[
                    s.iconWrap,
                    isSpecial && !isActive && s.specialIconWrap,
                  ]}>
                    <Ionicons
                      name={isActive ? tab.iconFilled : tab.icon}
                      size={isSpecial ? 28 : 24}
                      color={
                        isActive   ? '#ffffff' :
                        isSpecial  ? '#3b82f6' :
                        '#94a3b8'
                      }
                    />

                    {/* Notification dot on Orders tab */}
                    {tab.id === 'orders' && notificationCount > 0 && !isActive && (
                      <View style={s.notifDot}>
                        <Text style={s.notifDotText}>
                          {notificationCount > 9 ? '9+' : String(notificationCount)}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Label */}
                  <Text style={[
                    s.label,
                    isActive   && s.labelActive,
                    isSpecial && !isActive && s.labelSpecial,
                  ]}>
                    {tab.label}
                  </Text>
                </Animated.View>
              </TouchableOpacity>
            );
          })}
        </View>

      </View>
    </View>
  );
};

const s = StyleSheet.create({
  root: {
    backgroundColor: '#f1f5f9',
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    paddingTop: 8,
  },

  bar: {
    position: 'relative',
    backgroundColor: '#ffffff',
    marginHorizontal: MARGIN,
    borderRadius: 28,
    paddingVertical: PADDING,
    paddingHorizontal: PADDING,
    height: BAR_H + PADDING * 2,

    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 8,

    borderWidth: 1,
    borderColor: '#f3f4f6',
  },

  // ── Bubble ──
  bubble: {
    position: 'absolute',
    top: PADDING,
    left: PADDING,
    width: BUBBLE_W,
    height: BUBBLE_H,
    borderRadius: BUBBLE_W / 2,
    backgroundColor: '#3b82f6',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 10,
  },

  // ── Tabs ──
  tabs: {
    flexDirection: 'row',
    height: BAR_H,
    alignItems: 'center',
    zIndex: 2,
  },

  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },

  tabInner: { alignItems: 'center', justifyContent: 'center', gap: 3 },

  // ── Icon ──
  iconWrap: {
    width: 38, height: 38,
    alignItems: 'center', justifyContent: 'center',
  },
  specialIconWrap: {
    backgroundColor: 'rgba(59,130,246,0.08)',
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: 'rgba(59,130,246,0.15)',
  },

  // Notification dot
  notifDot: {
    position: 'absolute', top: 0, right: 0,
    backgroundColor: '#ef4444',
    borderRadius: 8, minWidth: 16, height: 16,
    justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5, borderColor: '#ffffff',
  },
  notifDotText: { fontSize: 9, fontWeight: '800', color: 'white' },

  // ── Labels ──
  label: {
    fontSize: 10, color: '#94a3b8',
    fontWeight: '600', letterSpacing: 0.2,
  },
  labelActive: {
    color: '#ffffff', fontWeight: '700', fontSize: 10,
  },
  labelSpecial: {
    color: '#3b82f6', fontWeight: '700',
  },
});

export default BottomTabs;
