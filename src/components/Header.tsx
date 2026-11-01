import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView } from 'react-native';
import { soundEffects } from '../services/soundEffects';
import { speechService } from '../services/speechService';

interface HeaderProps {
  onOpenSettings: () => void;
  onSelectInspiration: (word: string) => void;
}

const INSPIRATION_IDEAS = [
  { label: 'Cat', emoji: '🐱' },
  { label: 'Sun', emoji: '☀️' },
  { label: 'Car', emoji: '🚗' },
  { label: 'Apple', emoji: '🍎' },
  { label: 'House', emoji: '🏠' },
  { label: 'Star', emoji: '⭐' },
  { label: 'Tree', emoji: '🌳' },
  { label: 'Fish', emoji: '🐟' },
  { label: 'Heart', emoji: '❤️' },
  { label: 'Boat', emoji: '⛵' },
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
          <Text style={styles.appEmoji}>📝</Text>
          <View>
            <Text style={styles.title}>DoodlePad</Text>
            <Text style={styles.subtitle}>Draw anything & hear the explanation</Text>
          </View>
        </View>

        <View style={styles.topRightActions}>
          <TouchableOpacity
            style={styles.testAudioButton}
            onPress={() => {
              speechService.resumeAudioContext();
              soundEffects.playSuccess();
              speechService.speak('Welcome to DoodlePad! Draw any letter, number, or picture!');
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

      {/* Inspiration scroll row: "Try drawing:" */}
      <View style={styles.inspirationRow}>
        <Text style={styles.inspirationLabel}>Try drawing:</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.ideasScroll}
        >
          {INSPIRATION_IDEAS.map((item) => (
            <TouchableOpacity
              key={item.label}
              style={styles.ideaChip}
              onPress={() => {
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
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
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
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
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
    backgroundColor: '#EEF2FF',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  testAudioIcon: {
    fontSize: 13,
  },
  testAudioText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#4F46E5',
  },
  settingsButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
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
    color: '#94A3B8',
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
    backgroundColor: '#F8FAFC',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  ideaEmoji: {
    fontSize: 13,
  },
  ideaText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
});
