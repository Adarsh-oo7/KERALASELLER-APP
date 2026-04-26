
// src/navigation/BottomTabs.tsx
// import React, { useRef, useEffect, useState, useContext } from 'react';
// import {
//   View, Text, TouchableOpacity, StyleSheet,
//   Platform, Animated, Dimensions,
// } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import { useSafeAreaInsets } from 'react-native-safe-area-context';
// import { AppStateContext } from '../navigation/AppNavigator';

// const { width: SW } = Dimensions.get('window');

// const MARGIN    = 14;
// const PADDING   = 8;
// const TAB_COUNT = 5;
// const BUBBLE_W  = 56;
// const BUBBLE_H  = 56;
// const BAR_H     = 64;

// interface TabRoute { key: string; name: string; }
// interface TabState { index: number; routes: TabRoute[]; }
// interface TabDescriptor { options: any; navigation: any; }
// interface BottomTabsProps {
//   state: TabState;
//   descriptors: { [key: string]: TabDescriptor };
//   navigation: any;
// }

// const TABS = [
//   { id: 'dashboard', label: 'Home',     icon: 'home-outline' as const,       iconFilled: 'home' as const,        route: 'Dashboard'  },
//   { id: 'products',  label: 'Products', icon: 'cube-outline' as const,        iconFilled: 'cube' as const,         route: 'Products'   },
//   { id: 'add',       label: 'Add',      icon: 'add-circle-outline' as const,  iconFilled: 'add-circle' as const,   route: 'AddProduct', isSpecial: true },
//   { id: 'orders',    label: 'Orders',   icon: 'bag-handle-outline' as const,  iconFilled: 'bag-handle' as const,  route: 'Orders'     },
//   { id: 'history',   label: 'History',  icon: 'time-outline' as const,        iconFilled: 'time' as const,         route: 'History'    },
// ];

// const bubbleX = (idx: number): number => {
//   const contentW = (SW - MARGIN * 2) - PADDING * 2;
//   const tabW     = contentW / TAB_COUNT;
//   return idx * tabW + tabW / 2 - BUBBLE_W / 2;
// };

// const BottomTabs: React.FC<BottomTabsProps> = ({ state, descriptors, navigation }) => {
//   const { notificationCount = 0 } = useContext(AppStateContext) || {};
//   const insets = useSafeAreaInsets();
//   const [ready, setReady] = useState(false);

//   const bubblePos   = useRef(new Animated.Value(0)).current;
//   const bubbleScale = useRef(new Animated.Value(1)).current;
//   const tabScales   = useRef(TABS.map(() => new Animated.Value(1))).current;
//   const tabShifts   = useRef(TABS.map(() => new Animated.Value(0))).current;

//   const activeIdx = (() => {
//     const name = state.routes[state.index]?.name;
//     const i = TABS.findIndex(t => t.route === name);
//     return i >= 0 ? i : 0;
//   })();

//   useEffect(() => {
//     bubblePos.setValue(bubbleX(activeIdx));
//     setReady(true);
//   }, []);

//   useEffect(() => {
//     if (!ready) return;
//     Animated.parallel([
//       Animated.spring(bubblePos, {
//         toValue: bubbleX(activeIdx),
//         useNativeDriver: true,
//         tension: 70, friction: 11,
//       }),
//       Animated.sequence([
//         Animated.timing(bubbleScale, { toValue: 0.9, duration: 80, useNativeDriver: true }),
//         Animated.spring(bubbleScale, { toValue: 1, useNativeDriver: true, tension: 160, friction: 7 }),
//       ]),
//     ]).start();
//   }, [activeIdx, ready]);

//   const handlePress = (tab: typeof TABS[0], idx: number) => {
//     if (idx === activeIdx) return;
//     Animated.parallel([
//       Animated.sequence([
//         Animated.timing(tabScales[idx], { toValue: 0.8, duration: 70, useNativeDriver: true }),
//         Animated.spring(tabScales[idx],  { toValue: 1,   useNativeDriver: true, tension: 200, friction: 8 }),
//       ]),
//       Animated.sequence([
//         Animated.timing(tabShifts[idx], { toValue: -4, duration: 70, useNativeDriver: true }),
//         Animated.spring(tabShifts[idx],  { toValue: 0,  useNativeDriver: true, tension: 200, friction: 8 }),
//       ]),
//     ]).start();
//     navigation.navigate(tab.route);
//   };

//   // FIX: use real insets for bottom padding — handles gesture bar on Android 10+
//   // and home indicator on iPhone
//   const bottomPad = Platform.OS === 'ios'
//     ? Math.max(insets.bottom, 16)
//     : Math.max(insets.bottom, 8);

//   return (
//     <View style={[s.root, { paddingBottom: bottomPad }]}>
//       <View style={s.bar}>

//         {/* Sliding bubble */}
//         <Animated.View
//           style={[
//             s.bubble,
//             {
//               opacity: ready ? 1 : 0,
//               transform: [{ translateX: bubblePos }, { scale: bubbleScale }],
//             },
//           ]}
//         />

//         {/* Tabs */}
//         <View style={s.tabs}>
//           {TABS.map((tab, idx) => {
//             const isActive  = idx === activeIdx;
//             const isSpecial = !!tab.isSpecial;

//             return (
//               <TouchableOpacity
//                 key={tab.id}
//                 style={s.tab}
//                 onPress={() => handlePress(tab, idx)}
//                 activeOpacity={0.85}
//               >
//                 <Animated.View
//                   style={[
//                     s.tabInner,
//                     { transform: [{ scale: tabScales[idx] }, { translateY: tabShifts[idx] }] },
//                   ]}
//                 >
//                   <View style={[s.iconWrap, isSpecial && !isActive && s.specialIconWrap]}>
//                     <Ionicons
//                       name={isActive ? tab.iconFilled : tab.icon}
//                       size={isSpecial ? 28 : 24}
//                       color={isActive ? '#ffffff' : isSpecial ? '#3b82f6' : '#94a3b8'}
//                     />
//                     {tab.id === 'orders' && notificationCount > 0 && !isActive && (
//                       <View style={s.notifDot}>
//                         <Text style={s.notifDotText}>
//                           {notificationCount > 9 ? '9+' : String(notificationCount)}
//                         </Text>
//                       </View>
//                     )}
//                   </View>
//                   <Text style={[
//                     s.label,
//                     isActive && s.labelActive,
//                     isSpecial && !isActive && s.labelSpecial,
//                   ]}>
//                     {tab.label}
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

// const s = StyleSheet.create({
//   root: {
//     backgroundColor: '#f1f5f9',
//     paddingTop: 8,
//   },
//   bar: {
//     position: 'relative',
//     backgroundColor: '#ffffff',
//     marginHorizontal: MARGIN,
//     borderRadius: 28,
//     paddingVertical: PADDING,
//     paddingHorizontal: PADDING,
//     height: BAR_H + PADDING * 2,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.07,
//     shadowRadius: 16,
//     elevation: 8,
//     borderWidth: 1,
//     borderColor: '#f3f4f6',
//   },
//   bubble: {
//     position: 'absolute',
//     top: PADDING, left: PADDING,
//     width: BUBBLE_W, height: BUBBLE_H,
//     borderRadius: BUBBLE_W / 2,
//     backgroundColor: '#3b82f6',
//     shadowColor: '#3b82f6',
//     shadowOffset: { width: 0, height: 6 },
//     shadowOpacity: 0.4,
//     shadowRadius: 14,
//     elevation: 10,
//   },
//   tabs: {
//     flexDirection: 'row',
//     height: BAR_H,
//     alignItems: 'center',
//     zIndex: 2,
//   },
//   tab:      { flex: 1, alignItems: 'center', justifyContent: 'center', height: '100%' },
//   tabInner: { alignItems: 'center', justifyContent: 'center', gap: 3 },
//   iconWrap: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
//   specialIconWrap: {
//     backgroundColor: 'rgba(59,130,246,0.08)',
//     borderRadius: 19,
//     borderWidth: 1.5,
//     borderColor: 'rgba(59,130,246,0.15)',
//   },
//   notifDot: {
//     position: 'absolute', top: 0, right: 0,
//     backgroundColor: '#ef4444',
//     borderRadius: 8, minWidth: 16, height: 16,
//     justifyContent: 'center', alignItems: 'center',
//     paddingHorizontal: 3,
//     borderWidth: 1.5, borderColor: '#ffffff',
//   },
//   notifDotText: { fontSize: 9, fontWeight: '800', color: 'white' },
//   label:        { fontSize: 10, color: '#94a3b8', fontWeight: '600', letterSpacing: 0.2 },
//   labelActive:  { color: '#ffffff', fontWeight: '700', fontSize: 10 },
//   labelSpecial: { color: '#3b82f6', fontWeight: '700' },
// });

// export default BottomTabs;




// src/navigation/BottomTabs.tsx
import React, { useRef, useEffect, useState, useContext } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Platform, Animated, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppStateContext } from '../context/AppStateContext';

const { width: SW } = Dimensions.get('window');

const MARGIN    = 16;
const PADDING   = 6;
const TAB_COUNT = 5;
const BUBBLE_W  = 52;
const BUBBLE_H  = 52;
const BAR_H     = 60;

interface TabRoute { key: string; name: string; }
interface TabState { index: number; routes: TabRoute[]; }
interface TabDescriptor { options: any; navigation: any; }
interface BottomTabsProps {
  state: TabState;
  descriptors: { [key: string]: TabDescriptor };
  navigation: any;
}

const TABS = [
  { id: 'dashboard', label: 'Home',     icon: 'home-outline' as const,       iconFilled: 'home' as const,        route: 'Dashboard'  },
  { id: 'products',  label: 'Products', icon: 'cube-outline' as const,        iconFilled: 'cube' as const,         route: 'Products'   },
  { id: 'add',       label: 'Add',      icon: 'add' as const,                 iconFilled: 'add' as const,          route: 'AddProduct', isSpecial: true },
  { id: 'orders',    label: 'Orders',   icon: 'bag-handle-outline' as const,  iconFilled: 'bag-handle' as const,   route: 'Orders'     },
  { id: 'history',   label: 'History',  icon: 'time-outline' as const,        iconFilled: 'time' as const,         route: 'History'    },
];

const bubbleX = (idx: number): number => {
  const contentW = SW - MARGIN * 2 - PADDING * 2;
  const tabW     = contentW / TAB_COUNT;
  return idx * tabW + tabW / 2 - BUBBLE_W / 2;
};

const BottomTabs: React.FC<BottomTabsProps> = ({ state, descriptors, navigation }) => {
  const { notificationCount = 0 } = useContext(AppStateContext) || {};
  const insets = useSafeAreaInsets();
  const [ready, setReady] = useState(false);

  const bubblePos   = useRef(new Animated.Value(0)).current;
  const bubbleScale = useRef(new Animated.Value(1)).current;
  const tabScales   = useRef(TABS.map(() => new Animated.Value(1))).current;
  const tabShifts   = useRef(TABS.map(() => new Animated.Value(0))).current;

  const activeIdx = (() => {
    const name = state.routes[state.index]?.name;
    const i = TABS.findIndex(t => t.route === name);
    return i >= 0 ? i : 0;
  })();

  useEffect(() => {
    bubblePos.setValue(bubbleX(activeIdx));
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    Animated.parallel([
      Animated.spring(bubblePos, {
        toValue: bubbleX(activeIdx),
        useNativeDriver: true,
        tension: 80, friction: 12,
      }),
      Animated.sequence([
        Animated.timing(bubbleScale, { toValue: 0.88, duration: 80, useNativeDriver: true }),
        Animated.spring(bubbleScale, { toValue: 1, useNativeDriver: true, tension: 180, friction: 7 }),
      ]),
    ]).start();
  }, [activeIdx, ready]);

  const handlePress = (tab: typeof TABS[0], idx: number) => {
    if (idx === activeIdx) return;
    Animated.parallel([
      Animated.sequence([
        Animated.timing(tabScales[idx], { toValue: 0.82, duration: 60, useNativeDriver: true }),
        Animated.spring(tabScales[idx], { toValue: 1,    useNativeDriver: true, tension: 220, friction: 8 }),
      ]),
      Animated.sequence([
        Animated.timing(tabShifts[idx], { toValue: -5, duration: 60, useNativeDriver: true }),
        Animated.spring(tabShifts[idx], { toValue: 0,  useNativeDriver: true, tension: 220, friction: 8 }),
      ]),
    ]).start();
    navigation.navigate(tab.route);
  };

  const bottomOffset = Platform.OS === 'ios'
    ? Math.max(insets.bottom, 16)
    : Math.max(insets.bottom + 8, 14);

  return (
    <View
      style={[s.root, { bottom: bottomOffset }]}
      pointerEvents="box-none"
    >
      <View style={s.bar}>

        {/* Sliding bubble — z:1, sits BELOW tab content */}
        <Animated.View
          style={[
            s.bubble,
            {
              opacity: ready ? 1 : 0,
              transform: [{ translateX: bubblePos }, { scale: bubbleScale }],
            },
          ]}
        />

        {/* Tabs — z:2 container, z:3 inner content */}
        <View style={s.tabs}>
          {TABS.map((tab, idx) => {
            const isActive  = idx === activeIdx;
            const isSpecial = !!tab.isSpecial;

            if (isSpecial) {
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={s.tab}
                  onPress={() => handlePress(tab, idx)}
                  activeOpacity={0.85}
                >
                  <Animated.View
                    style={[
                      s.fabBtn,
                      isActive && s.fabBtnActive,
                      { transform: [{ scale: tabScales[idx] }, { translateY: tabShifts[idx] }] },
                    ]}
                  >
                    <Ionicons
                      name="add"
                      size={28}
                      color={isActive ? '#ffffff' : '#3b82f6'}
                    />
                  </Animated.View>
<Text style={[s.label, isActive ? s.labelActive : s.labelSpecial]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            }

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
                  <View style={s.iconWrap}>
                    <Ionicons
                      name={isActive ? tab.iconFilled : tab.icon}
                      size={22}
                      color={isActive ? '#ffffff' : '#94a3b8'}
                    />
                    {tab.id === 'orders' && notificationCount > 0 && !isActive && (
                      <View style={s.notifDot}>
                        <Text style={s.notifDotText}>
                          {notificationCount > 9 ? '9+' : String(notificationCount)}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={[s.label, isActive && s.labelActive]}>
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
  // Floating: absolute position, hovers above screen edge
  root: {
    position: 'absolute',
    left: MARGIN,
    right: MARGIN,
    backgroundColor: 'transparent',
  },
  bar: {
    position: 'relative',
    backgroundColor: '#ffffff',
    borderRadius: 26,
    paddingVertical: PADDING,
    paddingHorizontal: PADDING,
    height: BAR_H + PADDING * 2,
    shadowColor: '#475569',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },

  // z:1 — bubble stays BEHIND all tab content
  bubble: {
    position: 'absolute',
    top: PADDING, left: PADDING,
    width: BUBBLE_W, height: BUBBLE_H,
    borderRadius: BUBBLE_W / 2,
    backgroundColor: '#2563eb',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 10,
    zIndex: 1,
  },

  // z:2 — tabs row sits above bubble
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

  // z:3 — inner content (icon + label) always on top
  tabInner: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    zIndex: 3,
  },

  iconWrap: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },

  fabBtn: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: '#eff6ff',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 2,
    borderWidth: 1.5, borderColor: '#bfdbfe',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 3,
  },
  fabBtnActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
    shadowOpacity: 0.4,
  },

  notifDot: {
    position: 'absolute', top: -1, right: -1,
    backgroundColor: '#ef4444',
    borderRadius: 8, minWidth: 15, height: 15,
    justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 2,
    borderWidth: 1.5, borderColor: '#ffffff',
    zIndex: 4,
  },
  notifDotText: {
    fontSize: 8, fontWeight: '800', color: '#ffffff',
  },

  label: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '600',
    letterSpacing: 0.1,
    zIndex: 3,
  },
  // ✅ WHITE on active — was blue-on-blue before, now visible
  labelActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  // Special (Add tab) label — blue when inactive
  labelSpecial: {
    color: '#3b82f6',
  },
});

export default BottomTabs;