import React, { useEffect } from 'react';
import { View, StyleSheet, Modal, Text, TouchableOpacity } from 'react-native';
import { PhonicsItem, RecognitionResult } from '../types';
import { soundEffects } from '../services/soundEffects';
import { speechService } from '../services/speechService';

interface RewardModalProps {
  visible: boolean;
  result: RecognitionResult | null;
  item: PhonicsItem;
  onClose: () => void;
  onNext: () => void;
  onRetry: () => void;
}

export const RewardModal: React.FC<RewardModalProps> = ({
  visible,
  result,
  item,
  onClose,
  onNext,
  onRetry,
}) => {
  useEffect(() => {
    if (visible && result) {
      if (result.isCorrect) {
        soundEffects.playSuccess();
        setTimeout(() => {
          speechService.speakPraise(item.name, result.stars);
        }, 300);
      } else {
        speechService.speakEncouragement(item.name);
      }
    }
  }, [visible, result]);

  if (!result) return null;

  const starsArray = [1, 2, 3];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {/* Header Badge */}
          <View style={[styles.headerBadge, { backgroundColor: item.accentColor }]}>
            <Text style={styles.headerBadgeText}>
              {result.isCorrect ? '🎉 Great Job! 🎉' : '💪 Keep Practicing!'}
            </Text>
          </View>

          {/* Stars display */}
          <View style={styles.starsRow}>
            {starsArray.map((starIndex) => (
              <Text
                key={`star-${starIndex}`}
                style={[
                  styles.starIcon,
                  starIndex <= result.stars ? styles.starEarned : styles.starUnearned,
                ]}
              >
                ⭐
              </Text>
            ))}
          </View>

          {/* Character & Emoji Showcase */}
          <View style={styles.showcase}>
            <Text style={[styles.characterDisplay, { color: item.accentColor }]}>
              {item.character}
            </Text>
            <Text style={styles.emojiDisplay}>{item.emoji}</Text>
          </View>

          {/* Phonics Description */}
          <Text style={styles.wordTitle}>
            {item.exampleWord}
          </Text>
          <Text style={styles.phonicsDetail}>
            {item.name} says "{item.phonicSpelling}" as in {item.exampleWord}!
          </Text>

          {/* Fun Fact Pill */}
          <View style={styles.funFactBox}>
            <Text style={styles.funFactText}>💡 {item.funFact}</Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.modalButton, styles.replayAudioButton]}
              onPress={() => {
                soundEffects.playPop();
                speechService.speakPhonics(item);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonIcon}>🗣️</Text>
              <Text style={styles.replayButtonText}>Hear Again</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.retryButton]}
              onPress={() => {
                soundEffects.playPop();
                onRetry();
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonIcon}>✏️</Text>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.nextButton]}
              onPress={() => {
                soundEffects.playSparkle();
                onNext();
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonIcon}>➡️</Text>
              <Text style={styles.nextButtonText}>Next</Text>
            </TouchableOpacity>
          </View>
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
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    padding: 24,
    alignItems: 'center',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
  },
  headerBadge: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginBottom: 12,
  },
  headerBadgeText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 18,
    letterSpacing: 0.5,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 4,
  },
  starIcon: {
    fontSize: 36,
  },
  starEarned: {
    transform: [{ scale: 1.1 }],
  },
  starUnearned: {
    opacity: 0.25,
  },
  showcase: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginVertical: 12,
  },
  characterDisplay: {
    fontSize: 72,
    fontWeight: '900',
    fontFamily: 'System',
  },
  emojiDisplay: {
    fontSize: 64,
  },
  wordTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
  },
  phonicsDetail: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 12,
  },
  funFactBox: {
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    padding: 12,
    marginTop: 14,
    marginBottom: 20,
    width: '100%',
  },
  funFactText: {
    fontSize: 13,
    color: '#334155',
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 18,
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
  },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 18,
    gap: 6,
  },
  replayAudioButton: {
    backgroundColor: '#F1F5F9',
  },
  replayButtonText: {
    color: '#334155',
    fontWeight: '800',
    fontSize: 13,
  },
  retryButton: {
    backgroundColor: '#FEF3C7',
  },
  retryButtonText: {
    color: '#92400E',
    fontWeight: '800',
    fontSize: 13,
  },
  nextButton: {
    backgroundColor: '#10B981',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 14,
  },
  buttonIcon: {
    fontSize: 16,
  },
});
