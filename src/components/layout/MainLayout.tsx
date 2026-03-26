// src/components/MainLayout.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';

interface Props {
  children:       React.ReactNode;
  navigation:     StackNavigationProp<any>;
  headerTitle?:   string;
  /** Optional icon + handler rendered on the right side of the header */
  rightIcon?:     { name: React.ComponentProps<typeof Ionicons>['name']; onPress: () => void };
  /** Hide the back button — useful for root screens inside a stack */
  hideBack?:      boolean;
}

const MainLayout: React.FC<Props> = ({
  children,
  navigation,
  headerTitle  = 'Kerala Sellers',
  rightIcon,
  hideBack     = false,
}) => (
  <SafeAreaView style={s.root} edges={['top', 'left', 'right']}>
    <StatusBar barStyle="dark-content" backgroundColor="white" />

    {/* Header */}
    <View style={s.header}>
      {/* Left — back button */}
      <View style={s.side}>
        {!hideBack && (
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={s.iconBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={22} color="#3b82f6" />
          </TouchableOpacity>
        )}
      </View>

      {/* Centre — title */}
      <Text style={s.title} numberOfLines={1}>{headerTitle}</Text>

      {/* Right — optional action */}
      <View style={s.side}>
        {rightIcon && (
          <TouchableOpacity
            onPress={rightIcon.onPress}
            style={s.iconBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name={rightIcon.name} size={22} color="#3b82f6" />
          </TouchableOpacity>
        )}
      </View>
    </View>

    {/* Content */}
    <View style={s.content}>{children}</View>
  </SafeAreaView>
);

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#f8fafc' },

  header:  {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1, borderBottomColor: '#e5e7eb',
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
      android: { elevation: 2 },
    }),
  },
  side:    { width: 40, alignItems: 'center' },   // fixed width keeps title centred
  iconBtn: { padding: 6 },
  title:   { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: '#111827' },

  content: { flex: 1 },
});

export default MainLayout;
