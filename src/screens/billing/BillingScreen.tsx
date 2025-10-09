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
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { StackNavigationProp } from '@react-navigation/stack';
import ProductService from '../../services/ProductService';
import BillingService from '../../services/BillingService';
import { ApiError } from '../../types/api';

type BillingScreenProps = {
  navigation: StackNavigationProp<any>;
};

interface Product {
  id: number;
  name: string;
  model_name?: string;
  price: string;
  total_stock: number;
  online_stock?: number;
  description?: string;
}

interface BillItem extends Product {
  quantity: number;
}

interface Customer {
  name: string;
  phone: string;
}

const BillingScreen: React.FC<BillingScreenProps> = ({ navigation }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [customer, setCustomer] = useState<Customer>({ name: '', phone: '' });
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Store information (you can fetch this from your API)
  const [storeInfo] = useState({
    name: 'Kerala Sellers Store',
    sellerName: 'Store Owner',
    address: 'Store Address, Kerala, India',
    phone: '+91 9876543210',
    email: 'store@keralasellers.com'
  });

  // Fetch products
  const fetchProducts = useCallback(async () => {
    try {
      console.log('🔍 Fetching products for billing...');
      setError('');
      setIsLoading(true);
      
      const response = await ProductService.getProducts();
      const productData = response.data.results || response.data || [];
      
      console.log('✅ Products fetched:', productData.length);
      setProducts(productData);
      setFilteredProducts(productData);
    } catch (error: any) {
      console.error('❌ Failed to fetch products:', error);
      const apiError = error as ApiError;
      
      if (apiError.response?.status === 401) {
        setError('Session expired. Please login again.');
      } else {
        setError('Failed to load products. Please refresh.');
      }
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Filter products based on search
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(product => 
        product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.model_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  }, [searchTerm, products]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts();
  };

  // Add product to bill
  const addToBill = (product: Product) => {
    if (product.total_stock <= 0) {
      setError(`${product.name} is out of stock`);
      setTimeout(() => setError(''), 3000);
      return;
    }

    setBillItems(prev => {
      const existingItem = prev.find(item => item.id === product.id);
      if (existingItem) {
        const newQuantity = existingItem.quantity + 1;
        if (newQuantity > product.total_stock) {
          setError(`Only ${product.total_stock} units available for ${product.name}`);
          setTimeout(() => setError(''), 3000);
          return prev;
        }
        return prev.map(item =>
          item.id === product.id ? { ...item, quantity: newQuantity } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });

    setSuccess(`Added ${product.name} to bill`);
    setTimeout(() => setSuccess(''), 2000);
  };

  // Update quantity
  const updateQuantity = (productId: number, quantity: number) => {
    const newQty = Math.max(1, quantity);
    const product = products.find(p => p.id === productId);
    
    if (product && newQty > product.total_stock) {
      setError(`Only ${product.total_stock} units available for ${product.name}`);
      setTimeout(() => setError(''), 3000);
      return;
    }

    setBillItems(prev => prev.map(item => 
      item.id === productId ? { ...item, quantity: newQty } : item
    ));
  };

  // Remove from bill
  const removeFromBill = (productId: number) => {
    setBillItems(prev => prev.filter(item => item.id !== productId));
  };

  // Calculate total
  const calculateTotal = () => {
    return billItems.reduce((total, item) => total + (parseFloat(item.price) * item.quantity), 0);
  };

  // Validate customer info
  const validateCustomerInfo = () => {
    if (customer.phone && customer.phone.length !== 10) {
      setError('Please enter a valid 10-digit phone number');
      return false;
    }
    return true;
  };

  // Clear bill
  const clearBill = () => {
    setBillItems([]);
    setCustomer({ name: '', phone: '' });
    setError('');
    setSuccess('Bill cleared');
    setTimeout(() => setSuccess(''), 2000);
  };

  // Generate HTML for the bill
  const generateBillHTML = (billData: any) => {
    const currentDate = new Date().toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const itemsRows = billItems.map(item => `
      <tr>
        <td>
          <div class="product-name">${item.name}</div>
          ${item.model_name ? `<div class="product-model">Model: ${item.model_name}</div>` : ''}
        </td>
        <td class="quantity">${item.quantity}</td>
        <td class="price">₹${parseFloat(item.price).toFixed(2)}</td>
        <td class="subtotal">₹${(parseFloat(item.price) * item.quantity).toFixed(2)}</td>
      </tr>
    `).join('');

    return `
<!DOCTYPE html>
<html>
<head>
    <title>Invoice #${billData.billNumber}</title>
    <meta charset="UTF-8">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body { 
            font-family: Arial, sans-serif; 
            color: #000; 
            line-height: 1.4;
            background-color: #fff;
            padding: 20px;
        }
        
        .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            background: #fff;
            border: 2px solid #000;
        }
        
        .invoice-header {
            border-bottom: 2px solid #000;
            padding: 20px;
        }
        
        .header-content {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
        }
        
        .company-info {
            flex: 1;
        }
        
        .company-name {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .company-details {
            font-size: 14px;
            line-height: 1.6;
        }
        
        .invoice-details {
            text-align: right;
        }
        
        .invoice-title {
            font-size: 32px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        
        .invoice-meta {
            font-size: 14px;
        }
        
        .invoice-body {
            padding: 20px;
        }
        
        .billing-section {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
            gap: 40px;
        }
        
        .billing-info {
            flex: 1;
        }
        
        .billing-title {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 10px;
            text-decoration: underline;
        }
        
        .billing-details {
            border: 1px solid #000;
            padding: 15px;
            font-size: 14px;
            line-height: 1.6;
        }
        
        .items-section {
            margin-bottom: 20px;
        }
        
        .items-table {
            width: 100%;
            border-collapse: collapse;
            border: 2px solid #000;
        }
        
        .items-table th {
            padding: 12px;
            text-align: left;
            font-weight: bold;
            border-bottom: 2px solid #000;
            background: #000;
            color: #fff;
        }
        
        .items-table th:last-child {
            text-align: right;
        }
        
        .items-table td {
            padding: 10px 12px;
            border-bottom: 1px solid #000;
            vertical-align: top;
        }
        
        .items-table tbody tr:last-child td {
            border-bottom: 2px solid #000;
        }
        
        .product-name {
            font-weight: bold;
            margin-bottom: 3px;
        }
        
        .product-model {
            font-size: 12px;
            font-style: italic;
        }
        
        .quantity {
            text-align: center;
            font-weight: bold;
        }
        
        .price, .subtotal {
            font-weight: bold;
        }
        
        .subtotal {
            text-align: right;
        }
        
        .totals-section {
            display: flex;
            justify-content: flex-end;
            margin-top: 10px;
        }
        
        .totals-table {
            border: 2px solid #000;
            min-width: 300px;
        }
        
        .totals-table td {
            padding: 10px 15px;
            border-bottom: 1px solid #000;
        }
        
        .totals-table tr:last-child {
            border-bottom: none;
        }
        
        .totals-table tr:last-child td {
            background: #000;
            color: #fff;
            font-weight: bold;
            font-size: 16px;
        }
        
        .totals-table td:first-child {
            text-align: left;
            font-weight: bold;
        }
        
        .totals-table td:last-child {
            text-align: right;
        }
        
        .invoice-footer {
            border-top: 2px solid #000;
            padding: 20px;
            text-align: center;
            font-size: 14px;
        }
        
        .bill-type {
            background: #f8f9fa;
            padding: 10px;
            text-align: center;
            font-weight: bold;
            border: 1px solid #000;
            margin-bottom: 20px;
        }
    </style>
</head>
<body>
    <div class="invoice-container">
        <div class="invoice-header">
            <div class="header-content">
                <div class="company-info">
                    <div class="company-name">${storeInfo.name}</div>
                    <div class="company-details">
                        ${storeInfo.sellerName}<br>
                        ${storeInfo.address}<br>
                        Phone: ${storeInfo.phone}<br>
                        Email: ${storeInfo.email}
                    </div>
                </div>
                <div class="invoice-details">
                    <div class="invoice-title">INVOICE</div>
                    <div class="invoice-meta">
                        <strong>Invoice #:</strong> ${billData.billNumber}<br>
                        <strong>Date:</strong> ${currentDate}
                    </div>
                </div>
            </div>
        </div>
        
        <div class="invoice-body">
            <div class="bill-type">
                📋 LOCAL BILL - In-Store Purchase
            </div>
            
            <div class="billing-section">
                <div class="billing-info">
                    <div class="billing-title">BILL FROM</div>
                    <div class="billing-details">
                        <strong>${storeInfo.name}</strong><br>
                        ${storeInfo.sellerName}<br>
                        ${storeInfo.address}<br>
                        Phone: ${storeInfo.phone}
                    </div>
                </div>
                
                <div class="billing-info">
                    <div class="billing-title">BILL TO</div>
                    <div class="billing-details">
                        <strong>${customer.name || 'Walk-in Customer'}</strong><br>
                        ${customer.phone ? `Phone: ${customer.phone}` : 'Phone: N/A'}<br>
                        Local Customer<br>
                        In-Store Purchase
                    </div>
                </div>
            </div>
            
            <div class="items-section">
                <table class="items-table">
                    <thead>
                        <tr>
                            <th>PRODUCT DESCRIPTION</th>
                            <th style="text-align: center;">QTY</th>
                            <th>UNIT PRICE</th>
                            <th>TOTAL</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsRows}
                    </tbody>
                </table>
            </div>
            
            <div class="totals-section">
                <table class="totals-table">
                    <tr>
                        <td>SUBTOTAL</td>
                        <td>₹${calculateTotal().toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td>PAYMENT METHOD</td>
                        <td>Cash/COD</td>
                    </tr>
                    <tr>
                        <td>GRAND TOTAL</td>
                        <td>₹${calculateTotal().toFixed(2)}</td>
                    </tr>
                </table>
            </div>
        </div>
        
        <div class="invoice-footer">
            <p><strong>Thank you for your business!</strong></p>
            <p>This is a local bill generated for in-store purchase.</p>
            <p>Generated by Kerala Sellers Mobile App</p>
        </div>
    </div>
</body>
</html>`;
  };

  // Generate and share/download PDF
  const handleGenerateBill = async () => {
    if (billItems.length === 0) {
      setError('Please add items to the bill.');
      return;
    }

    if (!validateCustomerInfo()) {
      return;
    }

    setIsProcessing(true);
    setError('');
    
    try {
      // Generate bill number
      const billNumber = `LB${Date.now()}`;
      
      const billData = {
        billNumber,
        customer,
        items: billItems,
        total: calculateTotal(),
        date: new Date().toISOString(),
      };

      console.log('🧾 Generating local bill:', billData);

      // Generate HTML
      const htmlContent = generateBillHTML(billData);

      // Generate PDF
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
      });

      console.log('✅ PDF generated at:', uri);

      // Show options to user
      Alert.alert(
        'Bill Generated Successfully! 🎉',
        `Local bill #${billNumber} has been created.`,
        [
          {
            text: 'Share Bill',
            onPress: () => shareBill(uri, billNumber),
          },
          {
            text: 'Save to Files',
            onPress: () => saveBill(uri, billNumber),
          },
          {
            text: 'Print',
            onPress: () => printBill(htmlContent),
          },
          {
            text: 'New Bill',
            style: 'cancel',
            onPress: clearBill,
          },
        ]
      );

      // Reset form
      clearBill();
      
    } catch (error: any) {
      console.error('❌ Bill generation error:', error);
      setError('Failed to generate bill. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Share bill via various apps
  const shareBill = async (uri: string, billNumber: string) => {
    try {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `Share Bill #${billNumber}`,
        });
      } else {
        // Fallback to basic share
        await Share.share({
          url: uri,
          title: `Bill #${billNumber}`,
          message: `Local bill #${billNumber} from ${storeInfo.name}`,
        });
      }
    } catch (error) {
      console.error('❌ Share error:', error);
      Alert.alert('Error', 'Failed to share bill');
    }
  };

  // Save bill to device storage
  const saveBill = async (uri: string, billNumber: string) => {
    try {
      const fileName = `Kerala_Sellers_Bill_${billNumber}.pdf`;
      const downloadsDir = FileSystem.documentDirectory + 'Downloads/';
      
      // Create downloads directory if it doesn't exist
      await FileSystem.makeDirectoryAsync(downloadsDir, { intermediates: true });
      
      const newUri = downloadsDir + fileName;
      await FileSystem.moveAsync({
        from: uri,
        to: newUri,
      });

      Alert.alert(
        'Bill Saved! 💾',
        `Bill saved as ${fileName} in your Downloads folder.`,
        [
          {
            text: 'Open',
            onPress: () => Linking.openURL(newUri),
          },
          { text: 'OK' },
        ]
      );
    } catch (error) {
      console.error('❌ Save error:', error);
      Alert.alert('Error', 'Failed to save bill to device');
    }
  };

  // Print bill
  const printBill = async (htmlContent: string) => {
    try {
      await Print.printAsync({
        html: htmlContent,
      });
    } catch (error) {
      console.error('❌ Print error:', error);
      Alert.alert('Error', 'Failed to print bill');
    }
  };

  // Render product item
  const renderProduct = ({ item }: { item: Product }) => (
    <TouchableOpacity 
      style={[
        styles.productItem,
        item.total_stock <= 0 && styles.outOfStock
      ]}
      onPress={() => addToBill(item)}
      disabled={item.total_stock <= 0}
      activeOpacity={0.7}
    >
      <View style={styles.productInfo}>
        <Text style={styles.productName}>
          {item.name}
          {item.model_name && (
            <Text style={styles.productModel}> ({item.model_name})</Text>
          )}
        </Text>
        <Text style={styles.productPrice}>₹{parseFloat(item.price).toFixed(2)}</Text>
        <Text style={styles.productStock}>
          Stock: {item.total_stock || 0}
          {item.online_stock !== undefined && (
            <Text style={styles.onlineStock}> | Online: {item.online_stock}</Text>
          )}
        </Text>
      </View>
      <View style={styles.addButton}>
        <Ionicons name="add" size={16} color="white" />
      </View>
    </TouchableOpacity>
  );

  // Render bill item
  const renderBillItem = ({ item }: { item: BillItem }) => (
    <View style={styles.billItem}>
      <View style={styles.billItemInfo}>
        <Text style={styles.billItemName}>{item.name}</Text>
        {item.model_name && (
          <Text style={styles.billItemModel}>{item.model_name}</Text>
        )}
      </View>
      
      <View style={styles.quantityContainer}>
        <TouchableOpacity 
          style={styles.quantityButton}
          onPress={() => updateQuantity(item.id, item.quantity - 1)}
          disabled={item.quantity <= 1}
        >
          <Ionicons name="remove" size={12} color="#666" />
        </TouchableOpacity>
        
        <Text style={styles.quantityText}>{item.quantity}</Text>
        
        <TouchableOpacity 
          style={styles.quantityButton}
          onPress={() => updateQuantity(item.id, item.quantity + 1)}
          disabled={item.quantity >= item.total_stock}
        >
          <Ionicons name="add" size={12} color="#666" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.billItemPricing}>
        <Text style={styles.unitPrice}>₹{parseFloat(item.price).toFixed(2)}</Text>
        <Text style={styles.itemTotal}>₹{(parseFloat(item.price) * item.quantity).toFixed(2)}</Text>
      </View>
      
      <TouchableOpacity 
        style={styles.removeButton}
        onPress={() => removeFromBill(item.id)}
      >
        <Ionicons name="close" size={16} color="#ef4444" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* ✅ REMOVED: Custom header (now handled by TopBar) */}
      
      {/* ✅ UPDATED: Header Info Section */}
      <View style={styles.headerInfo}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Local Billing</Text>
          <Text style={styles.headerSubtitle}>Create downloadable bills for walk-in customers</Text>
        </View>
        <View style={styles.headerIcon}>
          <Ionicons name="receipt" size={24} color="#3b82f6" />
        </View>
      </View>

      {/* Status Messages */}
      {error ? (
        <View style={styles.errorMessage}>
          <Ionicons name="alert-circle" size={16} color="#991b1b" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => setError('')}>
            <Ionicons name="close" size={16} color="#991b1b" />
          </TouchableOpacity>
        </View>
      ) : null}
      
      {success ? (
        <View style={styles.successMessage}>
          <Ionicons name="checkmark-circle" size={16} color="#065f46" />
          <Text style={styles.successText}>{success}</Text>
          <TouchableOpacity onPress={() => setSuccess('')}>
            <Ionicons name="close" size={16} color="#065f46" />
          </TouchableOpacity>
        </View>
      ) : null}

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Product Selection */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="cube" size={20} color="#1f2937" />
            <Text style={styles.sectionTitle}>Add Products</Text>
            <View style={styles.productCount}>
              <Text style={styles.productCountText}>{filteredProducts.length} products</Text>
            </View>
          </View>
          
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={18} color="#6b7280" style={styles.searchIcon} />
            <TextInput 
              style={styles.searchInput}
              placeholder="Search products by name or model..."
              value={searchTerm}
              onChangeText={setSearchTerm}
              placeholderTextColor="#9ca3af"
            />
            {searchTerm.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchTerm('')}
                style={styles.clearSearchButton}
              >
                <Ionicons name="close-circle" size={18} color="#6b7280" />
              </TouchableOpacity>
            )}
          </View>
          
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3b82f6" />
              <Text style={styles.loadingText}>Loading products...</Text>
            </View>
          ) : (
            <FlatList
              data={filteredProducts}
              renderItem={renderProduct}
              keyExtractor={(item) => item.id.toString()}
              style={styles.productList}
              scrollEnabled={false}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Ionicons name="cube-outline" size={48} color="#9ca3af" />
                  <Text style={styles.emptyText}>
                    {searchTerm ? 'No products found matching your search' : 'No products available'}
                  </Text>
                  {searchTerm && (
                    <TouchableOpacity onPress={() => setSearchTerm('')} style={styles.clearFilterButton}>
                      <Text style={styles.clearFilterText}>Clear Search</Text>
                    </TouchableOpacity>
                  )}
                </View>
              }
            />
          )}
        </View>

        {/* Current Bill */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="receipt" size={20} color="#1f2937" />
            <Text style={styles.sectionTitle}>Current Bill</Text>
            {billItems.length > 0 && (
              <TouchableOpacity style={styles.clearButton} onPress={clearBill}>
                <Ionicons name="trash" size={14} color="white" />
                <Text style={styles.clearButtonText}>Clear All</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {/* Customer Details */}
          <View style={styles.customerSection}>
            <Text style={styles.customerSectionTitle}>Customer Information (Optional)</Text>
            <View style={styles.customerInputs}>
              <View style={styles.inputContainer}>
                <Ionicons name="person" size={16} color="#6b7280" style={styles.inputIcon} />
                <TextInput
                  style={styles.customerInput}
                  placeholder="Customer Name"
                  value={customer.name}
                  onChangeText={(text) => setCustomer({...customer, name: text})}
                  placeholderTextColor="#9ca3af"
                />
              </View>
              
              <View style={styles.inputContainer}>
                <Ionicons name="call" size={16} color="#6b7280" style={styles.inputIcon} />
                <TextInput
                  style={styles.customerInput}
                  placeholder="Phone Number"
                  value={customer.phone}
                  onChangeText={(text) => setCustomer({...customer, phone: text.replace(/\D/g, '').slice(0, 10)})}
                  keyboardType="numeric"
                  maxLength={10}
                  placeholderTextColor="#9ca3af"
                />
              </View>
            </View>
          </View>
          
          {/* Bill Items */}
          {billItems.length > 0 ? (
            <>
              <FlatList
                data={billItems}
                renderItem={renderBillItem}
                keyExtractor={(item) => item.id.toString()}
                style={styles.billItemsList}
                scrollEnabled={false}
              />
              
              {/* Bill Summary */}
              <View style={styles.billSummary}>
                <View style={styles.summaryHeader}>
                  <Ionicons name="calculator" size={18} color="#059669" />
                  <Text style={styles.summaryTitle}>Bill Summary</Text>
                </View>
                
                <View style={styles.summaryContent}>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Items:</Text>
                    <Text style={styles.summaryValue}>{billItems.length}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Total Quantity:</Text>
                    <Text style={styles.summaryValue}>
                      {billItems.reduce((sum, item) => sum + item.quantity, 0)}
                    </Text>
                  </View>
                  <View style={styles.summaryDivider} />
                  <View style={styles.summaryRow}>
                    <Text style={styles.totalLabel}>Grand Total:</Text>
                    <Text style={styles.totalValue}>₹{calculateTotal().toFixed(2)}</Text>
                  </View>
                </View>
                
                <Text style={styles.billType}>📋 Local Bill (In-store purchase)</Text>
              </View>
              
              {/* Generate Bill Button */}
              <TouchableOpacity 
                style={[styles.generateButton, isProcessing && styles.disabledButton]}
                onPress={handleGenerateBill}
                disabled={isProcessing}
                activeOpacity={0.7}
              >
                {isProcessing ? (
                  <View style={styles.buttonContent}>
                    <ActivityIndicator size="small" color="white" />
                    <Text style={styles.buttonText}>Generating Bill...</Text>
                  </View>
                ) : (
                  <View style={styles.buttonContent}>
                    <Ionicons name="document-text" size={18} color="white" />
                    <Text style={styles.buttonText}>Generate & Download Bill</Text>
                  </View>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.emptyBill}>
              <Ionicons name="receipt-outline" size={48} color="#9ca3af" />
              <Text style={styles.emptyText}>No items in bill</Text>
              <Text style={styles.emptyHint}>Tap on products above to add them to the bill</Text>
            </View>
          )}
        </View>
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
  headerIcon: {
    padding: 8,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
  },
  
  // ✅ ENHANCED: Status messages with close buttons
  errorMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fef2f2',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ef4444',
  },
  errorText: {
    color: '#991b1b',
    fontSize: 14,
    flex: 1,
  },
  successMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#10b981',
  },
  successText: {
    color: '#065f46',
    fontSize: 14,
    flex: 1,
  },
  
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  // ✅ ENHANCED: Section headers
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 8,
    flex: 1,
  },
  productCount: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  productCountText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ef4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  clearButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  
  // ✅ ENHANCED: Search with clear button
  searchContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
    top: 12,
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
    top: 12,
    zIndex: 1,
  },
  
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  loadingText: {
    color: '#6b7280',
    fontSize: 14,
  },
  productList: {
    maxHeight: 300,
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 8,
  },
  outOfStock: {
    opacity: 0.5,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 2,
  },
  productModel: {
    fontSize: 12,
    color: '#6b7280',
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
    marginBottom: 2,
  },
  productStock: {
    fontSize: 12,
    color: '#6b7280',
  },
  onlineStock: {
    color: '#8b5cf6',
  },
  addButton: {
    width: 32,
    height: 32,
    backgroundColor: '#3b82f6',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // ✅ ENHANCED: Empty states
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  clearFilterButton: {
    backgroundColor: '#6b7280',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  clearFilterText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  
  // ✅ ENHANCED: Customer section
  customerSection: {
    marginBottom: 20,
  },
  customerSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  customerInputs: {
    gap: 12,
  },
  inputContainer: {
    position: 'relative',
  },
  inputIcon: {
    position: 'absolute',
    left: 12,
    top: 12,
    zIndex: 1,
  },
  customerInput: {
    backgroundColor: '#f8fafc',
    paddingLeft: 40,
    paddingRight: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    fontSize: 14,
    color: '#374151',
  },
  
  billItemsList: {
    marginBottom: 20,
  },
  billItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 8,
  },
  billItemInfo: {
    flex: 1,
  },
  billItemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  billItemModel: {
    fontSize: 12,
    color: '#6b7280',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  quantityButton: {
    width: 24,
    height: 24,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginHorizontal: 12,
    minWidth: 20,
    textAlign: 'center',
  },
  billItemPricing: {
    alignItems: 'flex-end',
    marginRight: 12,
  },
  unitPrice: {
    fontSize: 12,
    color: '#6b7280',
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
  },
  removeButton: {
    padding: 4,
  },
  emptyBill: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyHint: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  
  // ✅ ENHANCED: Bill summary
  billSummary: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
    overflow: 'hidden',
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  summaryContent: {
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#059669',
  },
  billType: {
    fontSize: 12,
    color: '#8b5cf6',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  
  generateButton: {
    backgroundColor: '#059669',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default BillingScreen;
