import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { StackNavigationProp } from '@react-navigation/stack';
import HistoryService from '../../services/HistoryService';
import { ApiError } from '../../types/api';

type HistoryScreenProps = {
  navigation: StackNavigationProp<any>;
};

interface HistoryItem {
  id: number;
  timestamp: string;
  product?: { name: string };
  product_name?: string;
  product?: string;
  action: string;
  change_total?: number;
  change_online?: number;
  user?: {
    full_name?: string;
    email?: string;
    name?: string;
  };
  note?: string;
}

interface Filters {
  action: string;
  dateRange: string;
  product: string;
}

interface Stats {
  totalChanges: number;
  totalOnlineChanges: number;
  stockIncreases: number;
  stockDecreases: number;
  actionCounts: { [key: string]: number };
}

const HistoryScreen: React.FC<HistoryScreenProps> = ({ navigation }) => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState<Filters>({
    action: 'all',
    dateRange: '30',
    product: ''
  });

  // Fetch history data
  const fetchHistory = useCallback(async () => {
    try {
      console.log('🔍 Fetching stock history...');
      setError('');
      setIsLoading(true);
      
      const response = await HistoryService.getStockHistory();
      const historyData = response.data.results || response.data || [];
      
      console.log('✅ History data received:', historyData.length, 'records');
      setHistory(historyData);
      setFilteredHistory(historyData);
    } catch (error: any) {
      console.error('❌ Failed to fetch history:', error);
      const apiError = error as ApiError;
      
      if (apiError.response?.status === 401) {
        setError('Session expired. Please login again.');
      } else if (apiError.response?.status === 404) {
        setError('Stock history service not available.');
        setHistory([]);
        setFilteredHistory([]);
      } else {
        setError('Failed to load stock history. Please try again.');
      }
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Apply filters to history
  const applyFilters = useCallback(() => {
    let filtered = [...history];

    // Filter by action type
    if (filters.action !== 'all') {
      filtered = filtered.filter(item => item.action === filters.action);
    }

    // Filter by product name
    if (filters.product.trim()) {
      filtered = filtered.filter(item => {
        const productName = getProductName(item);
        return productName.toLowerCase().includes(filters.product.toLowerCase());
      });
    }

    // Filter by date range
    if (filters.dateRange !== 'all') {
      const days = parseInt(filters.dateRange);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      filtered = filtered.filter(item => 
        new Date(item.timestamp).getTime() >= cutoffDate.getTime()
      );
    }

    setFilteredHistory(filtered);
  }, [history, filters]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const onRefresh = (): void => {
    setRefreshing(true);
    fetchHistory();
  };

  // Helper functions
  const getProductName = (item: HistoryItem): string => {
    return item.product?.name || 
           item.product_name || 
           (typeof item.product === 'string' ? item.product : '') ||
           'Unknown Product';
  };

  const getUserName = (item: HistoryItem): string => {
    if (item.user) {
      return item.user.full_name || 
             item.user.email || 
             item.user.name || 
             'System User';
    }
    return 'System';
  };

  const getActionLabel = (action: string): string => {
    switch (action) {
      case 'CREATED':
        return 'Product Created';
      case 'UPDATED':
        return 'Manual Update';
      case 'SALE':
        return 'Sale';
      case 'RETURN':
        return 'Return';
      default:
        return action?.charAt(0)?.toUpperCase() + action?.slice(1) || 'Unknown';
    }
  };

  const getActionIcon = (action: string): string => {
    switch (action) {
      case 'CREATED':
      case 'UPDATED':
      case 'RETURN':
        return 'trending-up';
      case 'SALE':
        return 'trending-down';
      default:
        return 'cube';
    }
  };

  const getActionColor = (action: string): string => {
    switch (action) {
      case 'CREATED':
      case 'RETURN':
        return '#059669'; // Green
      case 'SALE':
        return '#dc2626'; // Red
      case 'UPDATED':
        return '#3b82f6'; // Blue
      default:
        return '#6b7280'; // Gray
    }
  };

  const formatDate = (timestamp: string): string => {
    return new Date(timestamp).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate statistics
  const getStats = (): Stats => {
    return filteredHistory.reduce((acc, item) => {
      acc.totalChanges += Math.abs(item.change_total || 0);
      acc.totalOnlineChanges += Math.abs(item.change_online || 0);
      
      if ((item.change_total || 0) > 0) {
        acc.stockIncreases++;
      } else if ((item.change_total || 0) < 0) {
        acc.stockDecreases++;
      }
      
      acc.actionCounts[item.action] = (acc.actionCounts[item.action] || 0) + 1;
      
      return acc;
    }, {
      totalChanges: 0,
      totalOnlineChanges: 0,
      stockIncreases: 0,
      stockDecreases: 0,
      actionCounts: {}
    });
  };

  // Export history as CSV
  const exportHistory = async (): Promise<void> => {
    if (filteredHistory.length === 0) {
      Alert.alert('No Data', 'No history records to export');
      return;
    }

    const csvContent = [
      'Date,Product,Action,Total Change,Online Change,User,Note',
      ...filteredHistory.map(item => [
        formatDate(item.timestamp),
        getProductName(item),
        getActionLabel(item.action),
        item.change_total || 0,
        item.change_online || 0,
        getUserName(item),
        item.note || '-'
      ].join(','))
    ].join('\n');

    try {
      await Share.share({
        message: csvContent,
        title: `Stock History - ${new Date().toISOString().split('T')[0]}`,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to export history');
    }
  };

  // Clear all filters
  const clearFilters = (): void => {
    setFilters({ action: 'all', dateRange: '30', product: '' });
  };

  const stats = getStats();

  // Render history item
  const renderHistoryItem = ({ item }: { item: HistoryItem }) => (
    <View style={styles.historyItem}>
      <View style={styles.historyHeader}>
        <View style={styles.historyLeft}>
          <View style={[styles.actionIcon, { backgroundColor: `${getActionColor(item.action)}15` }]}>
            <Ionicons 
              name={getActionIcon(item.action) as any} 
              size={16} 
              color={getActionColor(item.action)} 
            />
          </View>
          <View style={styles.historyInfo}>
            <Text style={styles.productName}>{getProductName(item)}</Text>
            <Text style={styles.actionText}>{getActionLabel(item.action)}</Text>
          </View>
        </View>
        <Text style={styles.historyDate}>{formatDate(item.timestamp)}</Text>
      </View>
      
      <View style={styles.historyDetails}>
        <View style={styles.changeRow}>
          <Text style={styles.changeLabel}>Total Change:</Text>
          <Text style={[
            styles.changeValue,
            { color: (item.change_total || 0) >= 0 ? '#059669' : '#dc2626' }
          ]}>
            {(item.change_total || 0) > 0 ? `+${item.change_total || 0}` : (item.change_total || 0)}
          </Text>
        </View>
        
        <View style={styles.changeRow}>
          <Text style={styles.changeLabel}>Online Change:</Text>
          <Text style={[
            styles.changeValue,
            { color: (item.change_online || 0) >= 0 ? '#059669' : '#dc2626' }
          ]}>
            {(item.change_online || 0) > 0 ? `+${item.change_online || 0}` : (item.change_online || 0)}
          </Text>
        </View>
        
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>User: {getUserName(item)}</Text>
          {item.note && <Text style={styles.note}>Note: {item.note}</Text>}
        </View>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading stock history...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#ef4444" />
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchHistory}>
            <Ionicons name="refresh" size={18} color="white" />
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ✅ REMOVED: Custom header (now handled by TopBar) */}
      
      {/* ✅ UPDATED: Header Info Section */}
      <View style={styles.headerInfo}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Stock History ({filteredHistory.length})</Text>
          <Text style={styles.headerSubtitle}>Track inventory changes and movements</Text>
        </View>
        <TouchableOpacity style={styles.exportButton} onPress={exportHistory}>
          <Ionicons name="download" size={18} color="white" />
          <Text style={styles.exportButtonText}>Export</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Statistics Cards */}
        {filteredHistory.length > 0 && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Ionicons name="trending-up" size={20} color="#059669" />
              <View style={styles.statContent}>
                <Text style={styles.statValue}>{stats.stockIncreases}</Text>
                <Text style={styles.statLabel}>Stock Increases</Text>
              </View>
            </View>
            
            <View style={styles.statCard}>
              <Ionicons name="trending-down" size={20} color="#dc2626" />
              <View style={styles.statContent}>
                <Text style={styles.statValue}>{stats.stockDecreases}</Text>
                <Text style={styles.statLabel}>Stock Decreases</Text>
              </View>
            </View>
            
            <View style={styles.statCard}>
              <Ionicons name="cube" size={20} color="#3b82f6" />
              <View style={styles.statContent}>
                <Text style={styles.statValue}>{stats.totalChanges}</Text>
                <Text style={styles.statLabel}>Units Moved</Text>
              </View>
            </View>
            
            <View style={styles.statCard}>
              <Ionicons name="document-text" size={20} color="#8b5cf6" />
              <View style={styles.statContent}>
                <Text style={styles.statValue}>{filteredHistory.length}</Text>
                <Text style={styles.statLabel}>Total Records</Text>
              </View>
            </View>
          </View>
        )}

        {/* Filters */}
        <View style={styles.filtersContainer}>
          <View style={styles.filtersHeader}>
            <Ionicons name="funnel" size={18} color="#1f2937" />
            <Text style={styles.filtersTitle}>Filters</Text>
            {(filters.action !== 'all' || filters.product || filters.dateRange !== '30') && (
              <TouchableOpacity style={styles.clearFiltersButton} onPress={clearFilters}>
                <Text style={styles.clearFiltersText}>Clear Filters</Text>
              </TouchableOpacity>
            )}
          </View>
          
          <View style={styles.filterRow}>
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Action Type</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={filters.action}
                  onValueChange={(value) => setFilters({...filters, action: value})}
                  style={styles.picker}
                >
                  <Picker.Item label="All Actions" value="all" />
                  <Picker.Item label="Product Created" value="CREATED" />
                  <Picker.Item label="Manual Update" value="UPDATED" />
                  <Picker.Item label="Sale" value="SALE" />
                  <Picker.Item label="Return" value="RETURN" />
                </Picker>
              </View>
            </View>

            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Date Range</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={filters.dateRange}
                  onValueChange={(value) => setFilters({...filters, dateRange: value})}
                  style={styles.picker}
                >
                  <Picker.Item label="All Time" value="all" />
                  <Picker.Item label="Today" value="1" />
                  <Picker.Item label="Last 7 days" value="7" />
                  <Picker.Item label="Last 30 days" value="30" />
                  <Picker.Item label="Last 3 months" value="90" />
                </Picker>
              </View>
            </View>
          </View>

          <View style={styles.searchContainer}>
            <Ionicons name="search" size={16} color="#6b7280" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search products..."
              value={filters.product}
              onChangeText={(text) => setFilters({...filters, product: text})}
              placeholderTextColor="#9ca3af"
            />
            {filters.product.length > 0 && (
              <TouchableOpacity
                onPress={() => setFilters({...filters, product: ''})}
                style={styles.clearSearchButton}
              >
                <Ionicons name="close-circle" size={16} color="#6b7280" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* History List */}
        {filteredHistory.length > 0 ? (
          <FlatList
            data={filteredHistory}
            renderItem={renderHistoryItem}
            keyExtractor={(item) => item.id.toString()}
            style={styles.historyList}
            scrollEnabled={false}
          />
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="time-outline" size={64} color="#9ca3af" />
            </View>
            <Text style={styles.emptyTitle}>No stock history found</Text>
            <Text style={styles.emptyMessage}>
              {filters.action !== 'all' || filters.product || filters.dateRange !== '30'
                ? 'No records match your current filters. Try adjusting the filters above.'
                : 'No stock movements have been recorded yet. Stock changes will appear here when you update inventory levels.'
              }
            </Text>
            {(filters.action !== 'all' || filters.product || filters.dateRange !== '30') && (
              <TouchableOpacity style={styles.clearAllFiltersButton} onPress={clearFilters}>
                <Text style={styles.clearAllFiltersText}>Clear All Filters</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  
  // ✅ UPDATED: New header info section (compatible with TopBar)
  headerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  exportButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    color: '#6b7280',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 40,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ef4444',
  },
  errorMessage: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    padding: 20,
  },
  statCard: {
    flex: 1,
    minWidth: 140,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    gap: 12,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  
  filtersContainer: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  filtersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filtersTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 8,
    flex: 1,
  },
  clearFiltersButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  clearFiltersText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  
  filterRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  filterGroup: {
    flex: 1,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  pickerContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  picker: {
    height: 45,
  },
  
  // ✅ ENHANCED: Search container with clear button
  searchContainer: {
    position: 'relative',
    marginBottom: 0,
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
    top: 14,
    zIndex: 1,
  },
  searchInput: {
    backgroundColor: '#f8fafc',
    paddingLeft: 40,
    paddingRight: 40,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    fontSize: 14,
    color: '#374151',
  },
  clearSearchButton: {
    position: 'absolute',
    right: 12,
    top: 14,
    zIndex: 1,
  },
  
  historyList: {
    paddingHorizontal: 20,
  },
  historyItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  actionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  historyInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  actionText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  historyDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  historyDetails: {
    gap: 8,
  },
  changeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  changeLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  changeValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  metaRow: {
    gap: 4,
  },
  metaLabel: {
    fontSize: 12,
    color: '#9ca3af',
  },
  note: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  
  // ✅ ENHANCED: Empty state
  emptyState: {
    alignItems: 'center',
    padding: 40,
    gap: 16,
  },
  emptyIconContainer: {
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
  },
  emptyMessage: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 20,
  },
  clearAllFiltersButton: {
    backgroundColor: '#6b7280',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  clearAllFiltersText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default HistoryScreen;
