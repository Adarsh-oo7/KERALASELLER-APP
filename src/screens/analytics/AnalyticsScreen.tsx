import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import MainLayout from '../../components/layout/MainLayout';

export default function AnalyticsScreen({ navigation }: { navigation: any }) {
  return (
    <MainLayout 
      navigation={navigation} 
      currentTab="analytics"
      headerTitle="Analytics"
    >
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <LinearGradient
            colors={[COLORS.secondary, COLORS.secondaryLight]}
            style={styles.heroGradient}
          >
            <MaterialIcons name="analytics" size={60} color={COLORS.surface} />
            <Text style={styles.heroTitle}>Business Analytics</Text>
            <Text style={styles.heroSubtitle}>
              Track your business performance and growth metrics
            </Text>
          </LinearGradient>
        </View>

        {/* Performance Metrics */}
        <View style={styles.metricsContainer}>
          <Text style={styles.sectionTitle}>This Month's Performance</Text>
          
          <View style={styles.metricsGrid}>
            <MetricCard
              title="Total Revenue"
              value="₹45,750"
              change="+15%"
              icon="trending-up"
              color={COLORS.success}
            />
            <MetricCard
              title="Orders"
              value="123"
              change="+8%"
              icon="receipt"
              color={COLORS.primary}
            />
            <MetricCard
              title="Customers"
              value="89"
              change="+12%"
              icon="people"
              color={COLORS.facebook}
            />
            <MetricCard
              title="Avg Order"
              value="₹372"
              change="+3%"
              icon="calculator"
              color={COLORS.secondary}
            />
          </View>
        </View>

        {/* Coming Soon Analytics */}
        <View style={styles.featuresContainer}>
          <Text style={styles.sectionTitle}>Coming Soon</Text>
          
          <AnalyticsFeature
            icon="bar-chart"
            title="Sales Charts"
            description="Visual charts showing daily, weekly, and monthly sales trends"
          />
          
          <AnalyticsFeature
            icon="pie-chart"
            title="Product Performance"
            description="Detailed breakdown of your best-selling products"
          />
          
          <AnalyticsFeature
            icon="location"
            title="Geographic Analytics"
            description="See where your customers are located across Kerala"
          />
          
          <AnalyticsFeature
            icon="time"
            title="Time-based Insights"
            description="Understand peak sales hours and seasonal trends"
          />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </MainLayout>
  );
}

// Metric Card Component
const MetricCard = ({ title, value, change, icon, color }) => (
  <View style={styles.metricCard}>
    <View style={[styles.metricIcon, { backgroundColor: `${color}15` }]}>
      <Ionicons name={icon} size={20} color={color} />
    </View>
    <View style={styles.metricContent}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricTitle}>{title}</Text>
      <View style={styles.metricChange}>
        <Ionicons name="arrow-up" size={12} color={COLORS.success} />
        <Text style={styles.changeText}>{change}</Text>
      </View>
    </View>
  </View>
);

// Analytics Feature Component
const AnalyticsFeature = ({ icon, title, description }) => (
  <View style={styles.featureCard}>
    <View style={styles.featureIcon}>
      <Ionicons name={icon} size={24} color={COLORS.primary} />
    </View>
    <View style={styles.featureContent}>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDescription}>{description}</Text>
    </View>
    <Ionicons name="arrow-forward" size={20} color={COLORS.textTertiary} />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  heroSection: {
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: COLORS.shadowColored,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  heroGradient: {
    padding: 32,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.surface,
    marginTop: 16,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 22,
  },
  metricsContainer: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    width: '48%',
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: COLORS.shadowMedium,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  metricIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  metricContent: {
    gap: 4,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  metricTitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  metricChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  changeText: {
    fontSize: 12,
    color: COLORS.success,
    fontWeight: '600',
  },
  featuresContainer: {
    margin: 16,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: COLORS.shadowMedium,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    gap: 16,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
});
