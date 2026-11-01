import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SlateContent } from '../types';
import { soundEffects } from '../services/soundEffects';
import { speechService } from '../services/speechService';

interface SlateReadoutProps {
  content: SlateContent | null;
  isReading: boolean;
  isSpeaking: boolean;
  readingMode: 'direct' | 'phonics';
  onToggleReadingMode: () => void;
  onRepeatAudio: () => void;
}

export const SlateReadout: React.FC<SlateReadoutProps> = ({
  content,
  isReading,
  isSpeaking,
  readingMode,
  onToggleReadingMode,
  onRepeatAudio,
}) => {
  if (isReading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color="#38BDF8" />
          <Text style={styles.loadingText}>Reading your slate...</Text>
        </View>
      </View>
    );
  }

  if (!content) {
    return (
      <View style={styles.container}>
        <View style={styles.idleRow}>
          <Text style={styles.idleEmoji}>✍️</Text>
          <Text style={styles.idleText}>
            Write any letter, number, or word on your slate!
          </Text>
        </View>
        <TouchableOpacity
          style={styles.modePill}
          onPress={() => {
            speechService.resumeAudioContext();
            soundEffects.playPop();
            onToggleReadingMode();
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.modePillText}>
            {readingMode === 'direct' ? '🎯 Read: Direct' : '🔤 Read: Phonics'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Recognized Content Badge */}
      <View style={styles.contentBadge}>
        <Text style={styles.emoji}>{content.emoji}</Text>
        <Text style={styles.mainText}>{content.textToRead}</Text>
        {content.displayLabel !== content.textToRead && (
          <Text style={styles.subLabel}>({content.displayLabel})</Text>
        )}
      </View>

      {/* Audio Repeat & Mode Toggles */}
      <View style={styles.actionGroup}>
        {/* Audio Repeat Button */}
        <TouchableOpacity
          style={[styles.readButton, isSpeaking && styles.speakingPulse]}
          onPress={() => {
            speechService.resumeAudioContext();
            soundEffects.playPop();
            onRepeatAudio();
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.readButtonIcon}>{isSpeaking ? '🔊' : '🗣️'}</Text>
          <Text style={styles.readButtonText}>
            {isSpeaking ? 'Reading...' : 'Listen'}
          </Text>
        </TouchableOpacity>

        {/* Reading Mode Toggle */}
        <TouchableOpacity
          style={styles.modePill}
          onPress={() => {
            speechService.resumeAudioContext();
            soundEffects.playPop();
            onToggleReadingMode();
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.modePillText}>
            {readingMode === 'direct' ? '🎯 Direct' : '🔤 Phonics'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F172A',
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginVertical: 4,
    borderWidth: 2,
    borderColor: '#334155',
    minHeight: 56,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    justifyContent: 'center',
  },
  loadingText: {
    color: '#38BDF8',
    fontSize: 14,
    fontWeight: '800',
  },
  idleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  idleEmoji: {
    fontSize: 20,
  },
  idleText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '700',
  },
  contentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1E293B',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#475569',
  },
  emoji: {
    fontSize: 24,
  },
  mainText: {
    color: '#F8FAFC',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  subLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  actionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  readButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#10B981',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 14,
    elevation: 2,
  },
  speakingPulse: {
    backgroundColor: '#059669',
  },
  readButtonIcon: {
    fontSize: 15,
  },
  readButtonText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 13,
  },
  modePill: {
    backgroundColor: '#1E293B',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#475569',
  },
  modePillText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '800',
  },
});
