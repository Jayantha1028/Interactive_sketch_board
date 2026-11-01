import React, { useState } from 'react';
import { View, StyleSheet, Modal, Text, TextInput, TouchableOpacity } from 'react-native';
import { geminiService } from '../services/geminiService';
import { soundEffects } from '../services/soundEffects';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  speechSpeed: 'slow' | 'normal';
  onToggleSpeed: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  visible,
  onClose,
  speechSpeed,
  onToggleSpeed,
}) => {
  const [apiKey, setApiKey] = useState<string>(geminiService.getApiKey());
  const [savedMessage, setSavedMessage] = useState<string>('');

  const handleSaveKey = () => {
    soundEffects.playPop();
    geminiService.setApiKey(apiKey);
    setSavedMessage('✓ API Key saved successfully!');
    setTimeout(() => setSavedMessage(''), 3000);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>⚙️ Notepad & Voice Settings</Text>

          {/* Voice Speed Setting */}
          <View style={styles.settingRow}>
            <View>
              <Text style={styles.settingLabel}>Audio Speech Speed</Text>
              <Text style={styles.settingDesc}>
                {speechSpeed === 'slow' ? '🐢 Slow (Ideal for young kids)' : '🐰 Normal speed'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.toggleButton}
              onPress={() => {
                soundEffects.playPop();
                onToggleSpeed();
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.toggleText}>
                {speechSpeed === 'slow' ? 'Switch to Normal' : 'Switch to Slow'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Gemini API Key for Open Recognition */}
          <View style={styles.apiKeySection}>
            <Text style={styles.settingLabel}>Gemini AI Vision Key (Optional)</Text>
            <Text style={styles.settingDesc}>
              Allows recognizing ANY sketch a child draws with open vocabulary AI. (Leaves blank to use built-in offline smart recognizer).
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Enter Google Gemini API Key"
              placeholderTextColor="#94A3B8"
              value={apiKey}
              onChangeText={setApiKey}
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry
            />

            {savedMessage !== '' && (
              <Text style={styles.savedNotice}>{savedMessage}</Text>
            )}

            <TouchableOpacity
              style={styles.saveKeyButton}
              onPress={handleSaveKey}
              activeOpacity={0.8}
            >
              <Text style={styles.saveKeyText}>Save Key</Text>
            </TouchableOpacity>
          </View>

          {/* Close button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => {
              soundEffects.playPop();
              onClose();
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.closeButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    gap: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
  },
  settingDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    maxWidth: 240,
  },
  toggleButton: {
    backgroundColor: '#EEF2FF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#4F46E5',
  },
  apiKeySection: {
    gap: 8,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 13,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
    marginTop: 4,
  },
  savedNotice: {
    color: '#059669',
    fontSize: 12,
    fontWeight: '700',
  },
  saveKeyButton: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  saveKeyText: {
    color: '#334155',
    fontWeight: '700',
    fontSize: 13,
  },
  closeButton: {
    backgroundColor: '#6366F1',
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
});
