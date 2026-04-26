// import React, { useState, useCallback } from 'react';
// import { View, StyleSheet, StatusBar, Platform } from 'react-native';
// import { useSafeAreaInsets } from 'react-native-safe-area-context';
// import TopBar from './TopBar';
// import DrawerLayout from './DrawerLayout';

// interface AppLayoutProps {
//   children: React.ReactNode;
//   title?: string;
//   subtitle?: string;
//   showNotifications?: boolean;
//   notificationCount?: number;
//   backgroundColor?: string;
// }

// const AppLayout: React.FC<AppLayoutProps> = ({
//   children,
//   title = 'Kerala Sellers',
//   subtitle,
//   showNotifications = true,
//   notificationCount = 0,
//   backgroundColor = '#ffffff',
// }) => {
//   const [isDrawerOpen, setIsDrawerOpen] = useState(false);
//   const insets = useSafeAreaInsets();

//   const toggleDrawer = useCallback(() => setIsDrawerOpen(p => !p), []);
//   const openDrawer  = useCallback(() => setIsDrawerOpen(true), []);
//   const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);

//   // Actual top bar height = safe area top + bar content height (56px)
//   const TOP_BAR_HEIGHT = insets.top + 56;

//   return (
//     <View style={s.root}>
//       <StatusBar
//         barStyle="dark-content"
//         backgroundColor={backgroundColor}
//         translucent={Platform.OS === 'android'}
//       />

//       {/* ── Fixed TopBar ── */}
//       <View style={[s.topBar, { height: TOP_BAR_HEIGHT, backgroundColor }]}>
//         <TopBar
//           title={title}
//           subtitle={subtitle}
//           onMenuPress={toggleDrawer}
//           showNotifications={showNotifications}
//           notificationCount={notificationCount}
//           backgroundColor={backgroundColor}
//         />
//       </View>

//       {/* ── Content below TopBar ── */}
//       <View style={[s.body, { marginTop: TOP_BAR_HEIGHT }]}>
//         <DrawerLayout
//           isOpen={isDrawerOpen}
//           onClose={closeDrawer}
//           onOpen={openDrawer}
//         >
//           <View style={s.content}>
//             {children}
//           </View>
//         </DrawerLayout>
//       </View>
//     </View>
//   );
// };

// const s = StyleSheet.create({
//   root: {
//     flex: 1,
//     backgroundColor: '#f1f5f9',
//   },
//   topBar: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     zIndex: 100,
//     // Shadow so content scrolls under it cleanly
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.06,
//     shadowRadius: 8,
//     elevation: 4,
//   },
//   body: {
//     flex: 1,
//   },
//   content: {
//     flex: 1,
//     backgroundColor: '#f1f5f9',
//   },
// });

// export default AppLayout;
// src/components/AppLayout.tsx
import React from 'react';
import { View, StyleSheet, StatusBar, Platform } from 'react-native';

interface AppLayoutProps {
  children: React.ReactNode;
  backgroundColor?: string;
}

const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  backgroundColor = '#f1f5f9',
}) => (
  <View style={[s.root, { backgroundColor }]}>
    <StatusBar
      barStyle="dark-content"
      backgroundColor={backgroundColor}
      translucent={Platform.OS === 'android'}
    />
    {children}
  </View>
);

const s = StyleSheet.create({
  root: { flex: 1 },
});

export default AppLayout;