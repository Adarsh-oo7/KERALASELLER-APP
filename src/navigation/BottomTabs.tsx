import React, { useRef, useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
  Dimensions,
  ScrollView, // ✅ FIXED: Added ScrollView import
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppStateContext } from '../navigation/AppNavigator';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface TabRoute {
  key: string;
  name: string;
}

interface TabState {
  index: number;
  routes: TabRoute[];
}

interface TabDescriptor {
  options: any;
  navigation: any;
}

interface BottomTabsProps {
  state: TabState;
  descriptors: { [key: string]: TabDescriptor };
  navigation: any;
}

const BottomTabs: React.FC<BottomTabsProps> = ({ state, descriptors, navigation }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  
  // ✅ Get notification count from context (with fallback)
  const appStateContext = useContext(AppStateContext);
  const notificationCount = appStateContext?.notificationCount || 0;
  
  // Animation refs
  const bubblePosition = useRef(new Animated.Value(0)).current;
  const bubbleScale = useRef(new Animated.Value(1)).current;
  
  const tabAnimations = useRef(
    Array(5).fill(0).map(() => ({ // ✅ BACK TO: 5 tabs (keeping it simple)
      scale: new Animated.Value(1),
      translateY: new Animated.Value(0),
    }))
  ).current;

  // ✅ SIMPLIFIED: Keep original 5 tabs, notifications via TopBar only
  const tabItems = [
    { id: 'dashboard', name: 'Dashboard', icon: 'home-outline', iconFilled: 'home', route: 'Dashboard' },
    { id: 'products', name: 'Products', icon: 'cube-outline', iconFilled: 'cube', route: 'Products' },
    { id: 'add', name: 'Add', icon: 'add-circle-outline', iconFilled: 'add-circle', route: 'AddProduct', isSpecial: true },
    { id: 'orders', name: 'Orders', icon: 'bag-handle-outline', iconFilled: 'bag-handle', route: 'Orders' },
    { id: 'history', name: 'History', icon: 'time-outline', iconFilled: 'time', route: 'History' },
  ];

  // ✅ BACK TO: Calculate precise bubble position for 5 tabs
  const calculateBubblePosition = (tabIndex: number): number => {
    const MARGIN = 16;
    const PADDING = 8;
    const BUBBLE_WIDTH = 60;
    
    const containerWidth = SCREEN_WIDTH - (MARGIN * 2);
    const contentWidth = containerWidth - (PADDING * 2);
    const tabWidth = contentWidth / 5; // ✅ 5 tabs
    
    // Calculate the center of the target tab
    const tabCenterX = tabIndex * tabWidth + (tabWidth / 2);
    
    // Position bubble center at tab center
    return tabCenterX - (BUBBLE_WIDTH / 2);
  };

  // ✅ Get current tab index (simplified)
  const getCurrentTabIndex = (): number => {
    const currentRouteName = state.routes[state.index]?.name;
    const tabIndex = tabItems.findIndex(item => item.route === currentRouteName);
    return tabIndex >= 0 ? tabIndex : 0; // Default to Dashboard if not found
  };

  // Initialize bubble position
  useEffect(() => {
    const initialIndex = getCurrentTabIndex();
    const initialPosition = calculateBubblePosition(initialIndex);
    
    bubblePosition.setValue(initialPosition);
    setIsInitialized(true);
  }, []);

  // Animate bubble when tab changes
  useEffect(() => {
    if (!isInitialized) return;
    
    const currentIndex = getCurrentTabIndex();
    const targetPosition = calculateBubblePosition(currentIndex);
    
    Animated.parallel([
      Animated.spring(bubblePosition, {
        toValue: targetPosition,
        useNativeDriver: true,
        tension: 80,
        friction: 12,
      }),
      Animated.sequence([
        Animated.timing(bubbleScale, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.spring(bubbleScale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 150,
          friction: 7,
        }),
      ]),
    ]).start();
  }, [state.index, isInitialized]);

  const handleTabPress = (item: any, index: number): void => {
    const currentIndex = getCurrentTabIndex();
    if (currentIndex === index) return;

    // Tab press animation
    Animated.parallel([
      Animated.sequence([
        Animated.timing(tabAnimations[index].scale, {
          toValue: 0.85,
          duration: 80,
          useNativeDriver: true,
        }),
        Animated.spring(tabAnimations[index].scale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 200,
          friction: 8,
        }),
      ]),
      Animated.sequence([
        Animated.timing(tabAnimations[index].translateY, {
          toValue: -3,
          duration: 80,
          useNativeDriver: true,
        }),
        Animated.spring(tabAnimations[index].translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 200,
          friction: 8,
        }),
      ]),
    ]).start();

    // Navigate
    navigation.navigate(item.route);
  };

  return (
    <View style={styles.container}>
      <View style={styles.curvedBackground}>
        
        {/* Animated Bubble */}
        <Animated.View
          style={[
            styles.movingBubble,
            {
              opacity: isInitialized ? 1 : 0,
              transform: [
                { translateX: bubblePosition },
                { scale: bubbleScale },
              ],
            },
          ]}
        />

        {/* Tabs Container */}
        <View style={styles.tabContainer}>
          {tabItems.map((item, index) => {
            const currentIndex = getCurrentTabIndex();
            const isActive = currentIndex === index;
            
            return (
              <TouchableOpacity
                key={item.id}
                style={styles.tabItem}
                onPress={() => handleTabPress(item, index)}
                activeOpacity={0.9}
              >
                <Animated.View
                  style={[
                    styles.tabContent,
                    {
                      transform: [
                        { scale: tabAnimations[index].scale },
                        { translateY: tabAnimations[index].translateY },
                      ],
                    },
                  ]}
                >
                  {/* Icon Container */}
                  <View
                    style={[
                      styles.iconWrapper,
                      item.isSpecial && !isActive && styles.specialIconWrapper,
                    ]}
                  >
                    <Ionicons
                      name={isActive ? item.iconFilled : item.icon}
                      size={item.isSpecial ? 30 : 26} // ✅ BACK TO: Original sizes
                      color={isActive ? '#ffffff' : item.isSpecial ? '#3b82f6' : '#94a3b8'}
                    />
                  </View>
                  
                  {/* Label */}
                  <Text
                    style={[
                      styles.label,
                      item.isSpecial && !isActive && styles.specialLabel,
                      isActive && styles.activeLabel,
                    ]}
                    numberOfLines={1}
                  >
                    {item.name}
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

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f9fafb',
    paddingBottom: Platform.OS === 'ios' ? 30 : 16,
    paddingTop: 6,
  },

  curvedBackground: {
    position: 'relative',
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    borderRadius: 30,
    paddingVertical: 10,
    paddingHorizontal: 8,
    
    // iOS shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    
    // Android shadow
    elevation: 6,
    
    // Border
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.03)',
  },

  movingBubble: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 60,
    height: 60,
    backgroundColor: '#3b82f6',
    borderRadius: 30,
    
    // Glow effect
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 10,
  },

  tabContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    height: 60,
    zIndex: 2,
  },

  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },

  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40, // ✅ BACK TO: Original sizes
    height: 40,
    marginBottom: 2,
  },

  specialIconWrapper: {
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(59, 130, 246, 0.15)',
  },

  label: {
    fontSize: 10, // ✅ BACK TO: Original font size
    color: '#94a3b8',
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.3,
    marginTop: 1,
  },

  specialLabel: {
    color: '#3b82f6',
    fontWeight: '700',
  },

  activeLabel: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 10.5,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

export default BottomTabs;
