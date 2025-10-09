import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Order {
  id: number;
  status: string;
  created_at: string;
  updated_at?: string;
  shipping_provider?: string;
}

interface OrderTimelineProps {
  order: Order;
}

const OrderTimeline: React.FC<OrderTimelineProps> = ({ order }) => {
  const getSteps = () => {
    const steps = [
      { key: 'PENDING', label: 'Order Placed', icon: '📝', completed: false },
      { key: 'PROCESSING', label: 'Processing', icon: '⚙️', completed: false },
      { key: 'SHIPPED', label: 'Shipped', icon: '🚚', completed: false },
      { key: 'DELIVERED', label: 'Delivered', icon: '✅', completed: false },
    ];

    const statusOrder = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
    const currentIndex = statusOrder.indexOf(order.status);

    return steps.map((step, index) => ({
      ...step,
      completed: index <= currentIndex,
      active: index === currentIndex,
    }));
  };

  const steps = getSteps();

  return (
    <View style={styles.container}>
      {steps.map((step, index) => (
        <View key={step.key} style={styles.stepContainer}>
          <View style={styles.stepContent}>
            <View style={[
              styles.stepIcon,
              step.completed && styles.stepIconCompleted,
              step.active && styles.stepIconActive,
            ]}>
              <Text style={[
                styles.stepIconText,
                step.completed && styles.stepIconTextCompleted,
              ]}>
                {step.icon}
              </Text>
            </View>
            
            <View style={styles.stepTextContainer}>
              <Text style={[
                styles.stepLabel,
                step.completed && styles.stepLabelCompleted,
                step.active && styles.stepLabelActive,
              ]}>
                {step.label}
              </Text>
              
              {step.active && order.updated_at && (
                <Text style={styles.stepDate}>
                  {new Date(order.updated_at).toLocaleDateString('en-IN')}
                </Text>
              )}
              
              {step.key === 'SHIPPED' && step.completed && order.shipping_provider && (
                <Text style={styles.stepDetail}>
                  via {order.shipping_provider}
                </Text>
              )}
            </View>
          </View>
          
          {index < steps.length - 1 && (
            <View style={[
              styles.stepLine,
              step.completed && styles.stepLineCompleted,
            ]} />
          )}
        </View>
      ))}
      
      {order.status === 'CANCELLED' && (
        <View style={styles.cancelledStep}>
          <View style={styles.cancelledIcon}>
            <Text style={styles.cancelledIconText}>❌</Text>
          </View>
          <Text style={styles.cancelledLabel}>Order Cancelled</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  stepContainer: {
    marginBottom: 16,
  },
  stepContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  stepIconCompleted: {
    backgroundColor: '#d1fae5',
    borderColor: '#059669',
  },
  stepIconActive: {
    backgroundColor: '#dbeafe',
    borderColor: '#3b82f6',
  },
  stepIconText: {
    fontSize: 16,
  },
  stepIconTextCompleted: {
    fontSize: 16,
  },
  stepTextContainer: {
    flex: 1,
  },
  stepLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  stepLabelCompleted: {
    color: '#059669',
    fontWeight: '600',
  },
  stepLabelActive: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  stepDate: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  stepDetail: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
    fontStyle: 'italic',
  },
  stepLine: {
    width: 2,
    height: 16,
    backgroundColor: '#e5e7eb',
    marginLeft: 19,
    marginTop: 4,
  },
  stepLineCompleted: {
    backgroundColor: '#059669',
  },
  cancelledStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
    padding: 12,
    backgroundColor: '#fee2e2',
    borderRadius: 8,
  },
  cancelledIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fecaca',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelledIconText: {
    fontSize: 14,
  },
  cancelledLabel: {
    fontSize: 14,
    color: '#991b1b',
    fontWeight: '600',
  },
});

export default OrderTimeline;
