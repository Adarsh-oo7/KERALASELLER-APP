import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableWithoutFeedback,
  Animated,
  Dimensions,
  PanResponder,
} from 'react-native';
import SideBar from './SideBar';

const { width, height } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(width * 0.85, 320); // Maximum 320px width
const DRAWER_THRESHOLD = width * 0.3; // 30% of screen width to trigger open/close
const EDGE_HIT_WIDTH = 20; // Touch area on left edge to start dragging

interface DrawerLayoutProps {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  onOpen?: () => void;
}

const DrawerLayout: React.FC<DrawerLayoutProps> = ({ 
  children, 
  isOpen, 
  onClose, 
  onOpen 
}) => {
  const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const [isDragging, setIsDragging] = useState(false);

  // ✅ PAN RESPONDER: Handle drag gestures like LinkedIn
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (evt) => {
        const { pageX } = evt.nativeEvent;
        // Only respond to touches near the left edge or when drawer is open
        return pageX < EDGE_HIT_WIDTH || isOpen;
      },
      
      onStartShouldSetPanResponderCapture: () => false,
      
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        const { pageX } = evt.nativeEvent;
        const { dx, dy } = gestureState;
        
        // Only respond if:
        // 1. Touch started near left edge and moving right, OR
        // 2. Drawer is open and moving left, OR
        // 3. Horizontal movement is greater than vertical
        return (
          (pageX < EDGE_HIT_WIDTH && dx > 10) ||
          (isOpen && dx < -10) ||
          Math.abs(dx) > Math.abs(dy)
        );
      },
      
      onPanResponderGrant: () => {
        setIsDragging(true);
        // Stop any running animations
        translateX.stopAnimation();
        backdropOpacity.stopAnimation();
      },
      
      onPanResponderMove: (evt, gestureState) => {
        const { dx } = gestureState;
        let newTranslateX;
        
        if (isOpen) {
          // Drawer is open, allow dragging left to close
          newTranslateX = Math.min(0, Math.max(-DRAWER_WIDTH, dx));
        } else {
          // Drawer is closed, allow dragging right to open
          newTranslateX = Math.min(0, Math.max(-DRAWER_WIDTH, -DRAWER_WIDTH + dx));
        }
        
        translateX.setValue(newTranslateX);
        
        // Update backdrop opacity based on drawer position
        const progress = 1 - Math.abs(newTranslateX) / DRAWER_WIDTH;
        backdropOpacity.setValue(progress * 0.5);
      },
      
      onPanResponderRelease: (evt, gestureState) => {
        const { dx, vx } = gestureState;
        setIsDragging(false);
        
        // Determine if we should open or close based on:
        // 1. Distance dragged (threshold)
        // 2. Velocity of the gesture
        const shouldOpen = isOpen 
          ? dx > -DRAWER_THRESHOLD && vx > -0.3 // Keep open if not dragged far enough
          : dx > DRAWER_THRESHOLD || vx > 0.3; // Open if dragged far enough or fast
        
        if (shouldOpen && !isOpen) {
          onOpen?.();
          openDrawer();
        } else if (!shouldOpen && isOpen) {
          onClose();
          closeDrawer();
        } else {
          // Snap back to current state
          if (isOpen) {
            openDrawer();
          } else {
            closeDrawer();
          }
        }
      },
    })
  ).current;

  // ✅ ANIMATION FUNCTIONS
  const openDrawer = () => {
    Animated.parallel([
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0.5,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeDrawer = () => {
    Animated.parallel([
      Animated.spring(translateX, {
        toValue: -DRAWER_WIDTH,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // ✅ HANDLE PROP CHANGES
  useEffect(() => {
    if (isOpen) {
      openDrawer();
    } else {
      closeDrawer();
    }
  }, [isOpen]);

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      {/* Main Content */}
      {children}
      
      {/* ✅ DRAWER MODAL: Always render for gesture handling */}
      <Modal
        visible={isOpen || isDragging}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={onClose}
      >
        <View style={styles.modalContainer}>
          {/* ✅ DRAWER: Positioned on the LEFT */}
          <Animated.View 
            style={[
              styles.drawer,
              { transform: [{ translateX }] }
            ]}
          >
            <SideBar onClose={onClose} isVisible={isOpen} />
          </Animated.View>
          
          {/* ✅ BACKDROP: Covers remaining space on the RIGHT */}
          <TouchableWithoutFeedback onPress={onClose}>
            <Animated.View 
              style={[
                styles.backdrop,
                { opacity: backdropOpacity }
              ]} 
            />
          </TouchableWithoutFeedback>
        </View>
      </Modal>

      {/* ✅ INVISIBLE EDGE DETECTOR: For starting gestures */}
      {!isOpen && (
        <View style={styles.edgeDetector} {...panResponder.panHandlers} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  modalContainer: {
    flex: 1,
    flexDirection: 'row', // ✅ LEFT-TO-RIGHT layout
  },
  
  // ✅ DRAWER: Positioned on the LEFT
  drawer: {
    width: DRAWER_WIDTH,
    height: height,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 }, // ✅ RIGHT shadow for left drawer
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 16,
    zIndex: 1000,
  },
  
  // ✅ BACKDROP: Covers the remaining space
  backdrop: {
    flex: 1,
    backgroundColor: '#000000',
  },
  
  // ✅ EDGE DETECTOR: Invisible touch area on left edge
  edgeDetector: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: EDGE_HIT_WIDTH,
    height: height,
    backgroundColor: 'transparent',
    zIndex: 999,
  },
});

export default DrawerLayout;
