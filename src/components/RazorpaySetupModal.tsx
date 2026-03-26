// src/components/RazorpaySetupModal.tsx
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Modal, TextInput,
  TouchableOpacity, ActivityIndicator, ScrollView,
  Alert, Platform, KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { api } from '../config/api';

interface RazorpaySetupModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editMode?: boolean;
}

// ── Validation ────────────────────────────────────────────────────────────────

const validateKeyId = (v: string) => {
  if (!v.trim()) return 'Key ID is required';
  if (!v.startsWith('rzp_test_') && !v.startsWith('rzp_live_'))
    return 'Key ID must start with rzp_test_ or rzp_live_';
  if (v.trim().length < 20) return 'Key ID looks too short';
  return '';
};

const validateSecret = (v: string) => {
  if (!v.trim()) return 'Key Secret is required';
  if (v.trim().length < 16) return 'Key Secret looks too short';
  return '';
};

const isLiveKey = (v: string) => v.startsWith('rzp_live_');

// ── Component ─────────────────────────────────────────────────────────────────

export default function RazorpaySetupModal({
  visible, onClose, onSuccess, editMode = false,
}: RazorpaySetupModalProps) {
  const [keyId, setKeyId]           = useState('');
  const [keySecret, setKeySecret]   = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [loading, setLoading]       = useState(false);
  const [fetchingKeys, setFetchingKeys] = useState(false);
  const [error, setError]           = useState('');
  const [keyIdError, setKeyIdError] = useState('');
  const [secretError, setSecretError] = useState('');

  // ── Effects ──────────────────────────────────────────────────────────────

  useEffect(() => {
    if (visible && editMode) {
      loadExistingKeys();
    }
    if (!visible) {
      // Reset on close
      setKeyId(''); setKeySecret(''); setError('');
      setKeyIdError(''); setSecretError('');
      setShowSecret(false); setLoading(false);
    }
  }, [visible, editMode]);

  const loadExistingKeys = async () => {
    setFetchingKeys(true);
    try {
      const status = await api.getGatewayStatus();
      if (status.razorpay?.account_id) {
        setKeyId(status.razorpay.account_id);
      }
    } catch (e) {
      console.error('Failed to load existing keys:', e);
    } finally {
      setFetchingKeys(false);
    }
  };

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleKeyIdChange = (v: string) => {
    setKeyId(v);
    if (keyIdError) setKeyIdError(validateKeyId(v));
    setError('');
  };

  const handleSecretChange = (v: string) => {
    setKeySecret(v);
    if (secretError) setSecretError(validateSecret(v));
    setError('');
  };

  const handleSubmit = async () => {
    const kidErr = validateKeyId(keyId);
    const secErr = validateSecret(keySecret);
    setKeyIdError(kidErr);
    setSecretError(secErr);
    if (kidErr || secErr) return;

    // Warn if switching to live keys
    if (isLiveKey(keyId)) {
      Alert.alert(
        '⚠️ Live Mode',
        'You are connecting live keys. Real money will be charged. Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Yes, Connect', style: 'destructive', onPress: submitKeys },
        ],
      );
    } else {
      submitKeys();
    }
  };

  const submitKeys = async () => {
    setLoading(true);
    setError('');
    try {
      await api.connectRazorpay({
        key_id: keyId.trim(),
        key_secret: keySecret.trim(),
      });

      Alert.alert(
        editMode ? 'Keys Updated!' : 'Connected!',
        editMode
          ? 'Your Razorpay keys have been updated successfully.'
          : 'Your store is now connected to Razorpay.',
        [{ text: 'Great!', onPress: () => { onSuccess(); onClose(); } }],
      );
    } catch (err: any) {
      const msg = err.response?.data?.error
               || err.response?.data?.message
               || err.message
               || 'Failed to connect. Please check your keys.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // ── Derived ───────────────────────────────────────────────────────────────

  const keyMode = isLiveKey(keyId) ? 'live' : keyId.startsWith('rzp_test_') ? 'test' : null;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={s.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={onClose} />

        <View style={s.sheet}>
          {/* Drag handle */}
          <View style={s.handle} />

          {/* Header */}
          <View style={s.header}>
            <View style={s.headerLeft}>
              <View style={s.headerIcon}>
                <Ionicons name="card-outline" size={20} color="#3b82f6" />
              </View>
              <View>
                <Text style={s.title}>
                  {editMode ? 'Update API Keys' : 'Connect Razorpay'}
                </Text>
                <Text style={s.subtitle}>
                  {editMode ? 'Replace your existing Razorpay keys' : 'Link your Razorpay account'}
                </Text>
              </View>
            </View>
            <TouchableOpacity style={s.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={18} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={s.scrollContent}
          >
            {/* Steps */}
            <View style={s.stepsCard}>
              <Text style={s.stepsTitle}>How to get your API keys</Text>
              {[
                { step: '1', text: 'Login to razorpay.com/dashboard' },
                { step: '2', text: 'Go to Settings → API Keys' },
                { step: '3', text: 'Click Generate Test/Live Keys' },
                { step: '4', text: 'Copy and paste both keys below' },
              ].map(item => (
                <View key={item.step} style={s.stepRow}>
                  <View style={s.stepNum}>
                    <Text style={s.stepNumText}>{item.step}</Text>
                  </View>
                  <Text style={s.stepText}>{item.text}</Text>
                </View>
              ))}
            </View>

            {/* Loading existing keys */}
            {fetchingKeys && (
              <View style={s.fetchingRow}>
                <ActivityIndicator size="small" color="#3b82f6" />
                <Text style={s.fetchingText}>Loading existing keys...</Text>
              </View>
            )}

            {/* Key ID field */}
            <View style={s.fieldWrap}>
              <View style={s.labelRow}>
                <Text style={s.label}>Razorpay Key ID</Text>
                <Text style={s.required}>Required</Text>
              </View>
              <View style={[
                s.inputWrap,
                keyIdError ? s.inputError : keyId && !keyIdError ? s.inputValid : null,
              ]}>
                <Ionicons name="key-outline" size={16} color="#9ca3af" style={s.inputIcon} />
                <TextInput
                  style={s.input}
                  value={keyId}
                  onChangeText={handleKeyIdChange}
                  onBlur={() => setKeyIdError(validateKeyId(keyId))}
                  placeholder="rzp_test_xxxx or rzp_live_xxxx"
                  placeholderTextColor="#d1d5db"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
                {/* Mode pill */}
                {keyMode && (
                  <View style={[s.modePill, keyMode === 'live' ? s.modeLive : s.modeTest]}>
                    <Text style={[s.modeText, keyMode === 'live' ? s.modeLiveText : s.modeTestText]}>
                      {keyMode === 'live' ? '🔴 LIVE' : '🟡 TEST'}
                    </Text>
                  </View>
                )}
              </View>
              {keyIdError ? (
                <View style={s.fieldErrorRow}>
                  <Ionicons name="alert-circle-outline" size={13} color="#dc2626" />
                  <Text style={s.fieldError}>{keyIdError}</Text>
                </View>
              ) : keyMode === 'live' ? (
                <View style={s.fieldWarnRow}>
                  <Ionicons name="warning-outline" size={13} color="#d97706" />
                  <Text style={s.fieldWarn}>Live key — real payments will be processed</Text>
                </View>
              ) : keyMode === 'test' ? (
                <View style={s.fieldOkRow}>
                  <Ionicons name="checkmark-circle-outline" size={13} color="#059669" />
                  <Text style={s.fieldOk}>Test key — safe for development</Text>
                </View>
              ) : null}
            </View>

            {/* Key Secret field */}
            <View style={s.fieldWrap}>
              <View style={s.labelRow}>
                <Text style={s.label}>Razorpay Key Secret</Text>
                <Text style={s.required}>Required</Text>
              </View>
              <View style={[
                s.inputWrap,
                secretError ? s.inputError : keySecret && !secretError ? s.inputValid : null,
              ]}>
                <Ionicons name="lock-closed-outline" size={16} color="#9ca3af" style={s.inputIcon} />
                <TextInput
                  style={s.input}
                  value={keySecret}
                  onChangeText={handleSecretChange}
                  onBlur={() => setSecretError(validateSecret(keySecret))}
                  placeholder="Your Razorpay secret key"
                  placeholderTextColor="#d1d5db"
                  secureTextEntry={!showSecret}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
                <TouchableOpacity
                  style={s.eyeBtn}
                  onPress={() => setShowSecret(v => !v)}
                >
                  <Ionicons
                    name={showSecret ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color="#9ca3af"
                  />
                </TouchableOpacity>
              </View>
              {secretError ? (
                <View style={s.fieldErrorRow}>
                  <Ionicons name="alert-circle-outline" size={13} color="#dc2626" />
                  <Text style={s.fieldError}>{secretError}</Text>
                </View>
              ) : null}
              <Text style={s.secretNote}>
                Never share this key. It is encrypted before saving.
              </Text>
            </View>

            {/* Global error */}
            {!!error && (
              <View style={s.errorBox}>
                <Ionicons name="alert-circle-outline" size={16} color="#dc2626" />
                <Text style={s.errorText}>{error}</Text>
              </View>
            )}

            {/* Submit */}
            <TouchableOpacity
              style={[s.submitBtn, loading && s.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <>
                  <ActivityIndicator size="small" color="white" />
                  <Text style={s.submitText}>
                    {editMode ? 'Updating...' : 'Connecting...'}
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons
                    name={editMode ? 'refresh-outline' : 'link-outline'}
                    size={18}
                    color="white"
                  />
                  <Text style={s.submitText}>
                    {editMode ? 'Update Keys' : 'Connect Razorpay'}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* Security note */}
            <View style={s.secureCard}>
              <View style={s.secureIcon}>
                <Ionicons name="shield-checkmark-outline" size={18} color="#059669" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.secureTitle}>Your keys are safe</Text>
                <Text style={s.secureDesc}>
                  Keys are AES-256 encrypted before storage and never exposed in the app.
                </Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const SHADOW = Platform.select({
  ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.08, shadowRadius: 12 },
  android: { elevation: 8 },
});

const s = StyleSheet.create({
  overlay:      { flex: 1, justifyContent: 'flex-end' },
  backdrop:     { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },

  sheet:        { backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '92%', ...SHADOW },
  handle:       { width: 40, height: 4, backgroundColor: '#e5e7eb', borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 4 },

  // Header
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  headerLeft:   { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerIcon:   { width: 40, height: 40, borderRadius: 20, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' },
  title:        { fontSize: 16, fontWeight: '800', color: '#111827' },
  subtitle:     { fontSize: 11, color: '#9ca3af', marginTop: 1 },
  closeBtn:     { width: 30, height: 30, borderRadius: 15, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' },

  scrollContent: { padding: 20, gap: 20 },

  // Steps
  stepsCard:    { backgroundColor: '#f0f9ff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#bae6fd', gap: 10 },
  stepsTitle:   { fontSize: 13, fontWeight: '800', color: '#0c4a6e', marginBottom: 4 },
  stepRow:      { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepNum:      { width: 24, height: 24, borderRadius: 12, backgroundColor: '#3b82f6', alignItems: 'center', justifyContent: 'center' },
  stepNumText:  { fontSize: 12, fontWeight: '800', color: 'white' },
  stepText:     { fontSize: 13, color: '#0369a1', flex: 1 },

  // Fetching
  fetchingRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#f9fafb', padding: 10, borderRadius: 8 },
  fetchingText: { fontSize: 13, color: '#6b7280' },

  // Fields
  fieldWrap:    { gap: 6 },
  labelRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label:        { fontSize: 13, fontWeight: '700', color: '#374151' },
  required:     { fontSize: 11, fontWeight: '600', color: '#3b82f6', backgroundColor: '#eff6ff', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },

  inputWrap:    { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb', borderRadius: 10, borderWidth: 1.5, borderColor: '#e5e7eb', paddingHorizontal: 12 },
  inputError:   { borderColor: '#fca5a5', backgroundColor: '#fff5f5' },
  inputValid:   { borderColor: '#86efac', backgroundColor: '#f0fdf4' },
  inputIcon:    { marginRight: 8 },
  input:        { flex: 1, fontSize: 14, color: '#111827', paddingVertical: 13, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  eyeBtn:       { padding: 8 },

  // Mode pill
  modePill:     { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginLeft: 4 },
  modeTest:     { backgroundColor: '#fef3c7' },
  modeLive:     { backgroundColor: '#fee2e2' },
  modeText:     { fontSize: 10, fontWeight: '800' },
  modeTestText: { color: '#92400e' },
  modeLiveText: { color: '#991b1b' },

  // Field hints
  fieldErrorRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  fieldError:    { fontSize: 12, color: '#dc2626', fontWeight: '500' },
  fieldWarnRow:  { flexDirection: 'row', alignItems: 'center', gap: 5 },
  fieldWarn:     { fontSize: 12, color: '#d97706', fontWeight: '500' },
  fieldOkRow:    { flexDirection: 'row', alignItems: 'center', gap: 5 },
  fieldOk:       { fontSize: 12, color: '#059669', fontWeight: '500' },
  secretNote:    { fontSize: 11, color: '#9ca3af', marginTop: 2 },

  // Global error
  errorBox:     { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fca5a5', padding: 14, borderRadius: 10 },
  errorText:    { flex: 1, fontSize: 13, color: '#dc2626', fontWeight: '600' },

  // Submit
  submitBtn:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#3b82f6', paddingVertical: 15, borderRadius: 12 },
  submitBtnDisabled: { backgroundColor: '#93c5fd' },
  submitText:        { fontSize: 15, fontWeight: '800', color: 'white' },

  // Security
  secureCard:   { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: '#f0fdf4', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#bbf7d0' },
  secureIcon:   { width: 34, height: 34, borderRadius: 17, backgroundColor: '#dcfce7', alignItems: 'center', justifyContent: 'center' },
  secureTitle:  { fontSize: 13, fontWeight: '800', color: '#065f46', marginBottom: 3 },
  secureDesc:   { fontSize: 12, color: '#059669', lineHeight: 18 },
});
