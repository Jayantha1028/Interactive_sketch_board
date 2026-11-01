import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView } from 'react-native';
import { soundEffects } from '../services/soundEffects';
import { speechService } from '../services/speechService';

interface HeaderProps {
  onOpenSettings: () => void;
  onSelectInspiration: (word: string) => void;
}

const SLATE_IDEAS = [
  { label: 'A', emoji: '🅰️' },
  { label: 'J', emoji: '🧃' },
  { label: 'B', emoji: '🅱️' },
  { label: '5', emoji: '5️⃣' },
  { label: 'Cat', emoji: '🐱' },
  { label: 'Sun', emoji: '☀️' },
  { label: 'Star', emoji: '⭐' },
  { label: 'Car', emoji: '🚗' },
  { label: 'Dog', emoji: '🐶' },
  { label: 'Tree', emoji: '🌳' },
];

export const Header: React.FC<HeaderProps> = ({
  onOpenSettings,
  onSelectInspiration,
}) => {
  return (
    <View style={styles.container}>
      {/* Top row: Title and Settings */}
      <View style={styles.topRow}>
        <View style={styles.titleGroup}>
          <Text style={styles.appEmoji}>🖍️</Text>
          <View>
            <Text style={styles.title}>Magic Slate</Text>
            <Text style={styles.subtitle}>Write on the slate to hear it read aloud</Text>
          </View>
        </View>

        <View style={styles.topRightActions}>
          <TouchableOpacity
            style={styles.testAudioButton}
            onPress={() => {
              speechService.resumeAudioContext();
              soundEffects.playSuccess();
              speechService.speak('Welcome to your Magic Slate! Write any letter, number, or word to hear it!');
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.testAudioIcon}>🔊</Text>
            <Text style={styles.testAudioText}>Test Voice</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => {
              speechService.resumeAudioContext();
              soundEffects.playPop();
              onOpenSettings();
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick Try row */}
      <View style={styles.inspirationRow}>
        <Text style={styles.inspirationLabel}>Try writing:</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.ideasScroll}
        >
          {SLATE_IDEAS.map((item) => (
            <TouchableOpacity
              key={item.label}
              style={styles.ideaChip}
              onPress={() => {
                speechService.resumeAudioContext();
                soundEffects.playPop();
                onSelectInspiration(item.label);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.ideaEmoji}>{item.emoji}</Text>
              <Text style={styles.ideaText}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  appEmoji: {
    fontSize: 26,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#F8FAFC',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  testAudioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1E293B',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  testAudioIcon: {
    fontSize: 13,
  },
  testAudioText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#38BDF8',
  },
  settingsButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  settingsIcon: {
    fontSize: 17,
  },
  inspirationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
  },
  inspirationLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  ideasScroll: {
    gap: 6,
  },
  ideaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1E293B',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  ideaEmoji: {
    fontSize: 13,
  },
  ideaText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#E2E8F0',
  },
});
