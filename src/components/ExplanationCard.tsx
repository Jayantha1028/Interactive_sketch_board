import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { DrawingExplanation } from '../types';
import { soundEffects } from '../services/soundEffects';
import { speechService } from '../services/speechService';

interface ExplanationCardProps {
  explanation: DrawingExplanation | null;
  isAnalyzing: boolean;
  isSpeaking: boolean;
  onSpeak: () => void;
  onClear: () => void;
}

export const ExplanationCard: React.FC<ExplanationCardProps> = ({
  explanation,
  isAnalyzing,
  isSpeaking,
  onSpeak,
  onClear,
}) => {
  if (isAnalyzing) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingTitle}>Looking at your sketch...</Text>
        <Text style={styles.loadingSubtitle}>Identifying the drawing & getting audio ready! 🎨</Text>
      </View>
    );
  }

  if (!explanation) {
    return (
      <View style={[styles.container, styles.emptyContainer]}>
        <Text style={styles.emptyEmoji}>✏️</Text>
        <View style={styles.emptyTextContainer}>
          <Text style={styles.emptyTitle}>Draw anything on your notepad!</Text>
          <Text style={styles.emptySubtitle}>
            Sketch an animal, tree, car, face, or character, then tap <Text style={styles.boldText}>"Explain My Drawing"</Text>!
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Title & Emoji Header */}
      <View style={styles.headerRow}>
        <View style={styles.titleWithEmoji}>
          <Text style={styles.emoji}>{explanation.emoji}</Text>
          <View>
            <View style={styles.nameCategoryRow}>
              <Text style={styles.nameText}>{explanation.name}</Text>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{explanation.category}</Text>
              </View>
            </View>
            <Text style={styles.spellingText}>Phonics: {explanation.spelling}</Text>
          </View>
        </View>

        {/* Speak Again Button */}
        <TouchableOpacity
          style={[styles.speakButton, isSpeaking && styles.speakingActive]}
          onPress={() => {
            speechService.resumeAudioContext();
            soundEffects.playPop();
            onSpeak();
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.speakButtonIcon}>{isSpeaking ? '🔊' : '🗣️'}</Text>
          <Text style={styles.speakButtonText}>{isSpeaking ? 'Speaking...' : 'Listen'}</Text>
        </TouchableOpacity>
      </View>

      {/* Explanation Text */}
      <Text style={styles.explanationBody}>{explanation.explanation}</Text>

      {/* Sound Word & Fun Fact */}
      <View style={styles.footerRow}>
        {explanation.soundWord && (
          <View style={styles.soundBadge}>
            <Text style={styles.soundBadgeText}>🎵 "{explanation.soundWord}"</Text>
          </View>
        )}
        {explanation.funFact && (
          <Text style={styles.funFactText} numberOfLines={2}>
            💡 {explanation.funFact}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    marginVertical: 6,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  loadingTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#334155',
    marginTop: 6,
  },
  loadingSubtitle: {
    fontSize: 13,
    color: '#64748B',
  },
  emptyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F8FAFC',
    borderStyle: 'dashed',
    paddingVertical: 12,
  },
  emptyEmoji: {
    fontSize: 32,
  },
  emptyTextContainer: {
    flex: 1,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 16,
  },
  boldText: {
    color: '#4F46E5',
    fontWeight: '800',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  titleWithEmoji: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  emoji: {
    fontSize: 38,
  },
  nameCategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nameText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
  },
  categoryBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4338CA',
  },
  spellingText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6366F1',
    marginTop: 1,
  },
  speakButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#10B981',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 16,
    elevation: 2,
  },
  speakingActive: {
    backgroundColor: '#059669',
  },
  speakButtonIcon: {
    fontSize: 16,
  },
  speakButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  explanationBody: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    lineHeight: 20,
    marginVertical: 4,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  soundBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  soundBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#92400E',
  },
  funFactText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
});
