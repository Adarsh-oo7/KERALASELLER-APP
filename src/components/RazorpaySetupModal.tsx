// src/components/RazorpaySetupModal.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants/colors';
import { api } from '../config/api';

interface RazorpaySetupModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editMode?: boolean;
}

export default function RazorpaySetupModal({
  visible,
  onClose,
  onSuccess,
  editMode = false,
}: RazorpaySetupModalProps) {
  const [keyId, setKeyId] = useState('');
  const [keySecret, setKeySecret] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible && editMode) {
      fetchExistingKeys();
    } else if (!visible) {
      // Reset form when modal closes
      setKeyId('');
      setKeySecret('');
      setError('');
      setShowSecret(false);
    }
  }, [visible, editMode]);

  const fetchExistingKeys = async () => {
    try {
      // ✅ FIXED: Using API method
      const status = await api.getGatewayStatus();
      
      if (status.razorpay?.account_id) {
        setKeyId(status.razorpay.account_id);
      }
    } catch (error) {
      console.error('Error fetching existing keys:', error);
    }
  };

  const handleSubmit = async () => {
    if (!keyId.trim() || !keySecret.trim()) {
      setError('Please enter both Key ID and Key Secret');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // ✅ FIXED: Using API method
      await api.connectRazorpay({
        key_id: keyId.trim(),
        key_secret: keySecret.trim(),
      });

      Alert.alert(
        'Success!',
        editMode ? 'Razorpay keys updated successfully!' : 'Connected to Razorpay successfully!',
        [{ text: 'OK', onPress: () => {
          onSuccess();
          onClose();
        }}]
      );
    } catch (err: any) {
      console.error('Razorpay connection error:', err);
      
      // ✅ Better error handling
      const errorMessage = err.response?.data?.error 
        || err.response?.data?.message 
        || err.message 
        || 'Failed to connect to Razorpay';
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Ionicons name="card" size={24} color={COLORS.primary} />
                <Text style={styles.title}>
                  {editMode ? 'Edit Razorpay Keys' : 'Connect Razorpay'}
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Instructions */}
            <View style={styles.instructionsCard}>
              <Text style={styles.instructionsTitle}>📋 How to get your Razorpay API keys:</Text>
              <View style={styles.instructionsList}>
                <Text style={styles.instructionItem}>1. Login to Razorpay Dashboard</Text>
                <Text style={styles.instructionItem}>2. Go to Settings → API Keys</Text>
                <Text style={styles.instructionItem}>3. Generate Test/Live Keys</Text>
                <Text style={styles.instructionItem}>4. Copy & paste them below</Text>
              </View>
            </View>

            {/* Form */}
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Razorpay Key ID *</Text>
                <TextInput
                  style={styles.input}
                  value={keyId}
                  onChangeText={setKeyId}
                  placeholder="rzp_test_xxxxxxxxxx or rzp_live_xxxxxxxxxx"
                  placeholderTextColor={COLORS.textTertiary}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Razorpay Key Secret *</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    value={keySecret}
                    onChangeText={setKeySecret}
                    placeholder="Enter your secret key"
                    placeholderTextColor={COLORS.textTertiary}
                    secureTextEntry={!showSecret}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowSecret(!showSecret)}
                  >
                    <Ionicons
                      name={showSecret ? 'eye' : 'eye-off'}
                      size={20}
                      color={COLORS.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {error ? (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={16} color={COLORS.error} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={[styles.submitButton, loading && { opacity: 0.6 }]}
                onPress={handleSubmit}
                disabled={loading}
              >
                <LinearGradient
                  colors={loading ? ['#94a3b8', '#64748b'] : ['#3b82f6', '#1d4ed8']}
                  style={styles.submitGradient}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color={COLORS.surface} />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={20} color={COLORS.surface} />
                      <Text style={styles.submitText}>
                        {editMode ? 'Update Keys' : 'Connect Razorpay'}
                      </Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Warning */}
            <View style={styles.warningCard}>
              <Ionicons name="shield-checkmark" size={20} color={COLORS.warning} />
              <Text style={styles.warningText}>
                🔒 Your API keys are encrypted and stored securely. Never share them with anyone.
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  closeButton: {
    padding: 4,
  },
  instructionsCard: {
    backgroundColor: COLORS.primarySoft,
    margin: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  instructionsList: {
    gap: 8,
  },
  instructionItem: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  form: {
    paddingHorizontal: 20,
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  input: {
    backgroundColor: COLORS.primarySoft,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primarySoft,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  passwordInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  eyeButton: {
    padding: 12,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fef2f2',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.error,
    fontWeight: '500',
  },
  submitButton: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  submitText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.surface,
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#fef3c7',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.warning,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: '#92400e',
    lineHeight: 18,
  },
});
