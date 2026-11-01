import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { soundEffects } from '../services/soundEffects';
import { speechService } from '../services/speechService';

interface ToolbarProps {
  currentColor: string;
  onSelectColor: (color: string) => void;
  strokeWidth: number;
  onSelectStrokeWidth: (width: number) => void;
  onClear: () => void;
  onUndo: () => void;
  canUndo: boolean;
  onReadSlate: () => void;
  isReading: boolean;
}

const CHALK_PALETTE = [
  { name: 'White', hex: '#FFFFFF', icon: '⚪' },
  { name: 'Yellow', hex: '#FDE047', icon: '🟡' },
  { name: 'Cyan', hex: '#38BDF8', icon: '🔵' },
  { name: 'Pink', hex: '#F472B6', icon: '🌸' },
  { name: 'Mint', hex: '#4ADE80', icon: '🟢' },
  { name: 'Orange', hex: '#FB923C', icon: '🟠' },
  { name: 'Sponge', hex: '#1E293B', icon: '🧽' },
];

export const Toolbar: React.FC<ToolbarProps> = ({
  currentColor,
  onSelectColor,
  strokeWidth,
  onSelectStrokeWidth,
  onClear,
  onUndo,
  canUndo,
  onReadSlate,
  isReading,
}) => {
  return (
    <View style={styles.container}>
      {/* MAIN ACTION BAR: Read Slate, Undo, Wipe Slate */}
      <View style={styles.actionRow}>
        {/* BIG READ SLATE BUTTON */}
        <TouchableOpacity
          style={[styles.bigActionButton, isReading && styles.buttonDisabled]}
          onPress={() => {
            speechService.resumeAudioContext();
            soundEffects.playSuccess();
            onReadSlate();
          }}
          disabled={isReading}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonEmoji}>🔊</Text>
          <Text style={styles.actionButtonText}>
            {isReading ? 'Reading Slate...' : 'Read Slate'}
          </Text>
        </TouchableOpacity>

        {/* UNDO BUTTON */}
        <TouchableOpacity
          style={[styles.iconButton, !canUndo && styles.buttonDisabled]}
          onPress={() => {
            if (canUndo) {
              speechService.resumeAudioContext();
              soundEffects.playPop();
              onUndo();
            }
          }}
          disabled={!canUndo}
          activeOpacity={0.8}
        >
          <Text style={styles.smallEmoji}>↩️</Text>
          <Text style={styles.iconButtonLabel}>Undo</Text>
        </TouchableOpacity>

        {/* WIPE SLATE BUTTON */}
        <TouchableOpacity
          style={[styles.iconButton, styles.wipeButton]}
          onPress={() => {
            speechService.resumeAudioContext();
            soundEffects.playWhoosh();
            onClear();
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.smallEmoji}>🧹</Text>
          <Text style={styles.iconButtonLabel}>Wipe</Text>
        </TouchableOpacity>
      </View>

      {/* CHALK TOOLS: Colors & Thickness */}
      <View style={styles.toolRow}>
        {/* Chalk Palette */}
        <View style={styles.paletteContainer}>
          {CHALK_PALETTE.map((item) => {
            const isSelected = currentColor === item.hex;
            const isSponge = item.name === 'Sponge';
            return (
              <TouchableOpacity
                key={item.name}
                style={[
                  styles.chalkSwatch,
                  { backgroundColor: item.hex },
                  isSelected && styles.selectedSwatch,
                  isSponge && styles.spongeSwatch,
                ]}
                onPress={() => {
                  speechService.resumeAudioContext();
                  soundEffects.playPop();
                  onSelectColor(item.hex);
                }}
                activeOpacity={0.8}
              >
                {isSelected && !isSponge && <Text style={styles.swatchCheck}>✓</Text>}
                {isSponge && <Text style={styles.spongeIcon}>🧽</Text>}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Chalk Sizes */}
        <View style={styles.sizeContainer}>
          {[10, 18, 28].map((size) => {
            const isSelected = strokeWidth === size;
            return (
              <TouchableOpacity
                key={`size-${size}`}
                style={[styles.sizeButton, isSelected && styles.sizeButtonSelected]}
                onPress={() => {
                  speechService.resumeAudioContext();
                  soundEffects.playPop();
                  onSelectStrokeWidth(size);
                }}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.sizeDot,
                    {
                      width: size * 0.6,
                      height: size * 0.6,
                      borderRadius: (size * 0.6) / 2,
                      backgroundColor: currentColor === '#1E293B' ? '#94A3B8' : currentColor,
                    },
                  ]}
                />
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0F172A',
    borderRadius: 22,
    padding: 12,
    marginVertical: 4,
    borderWidth: 2,
    borderColor: '#334155',
    gap: 10,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bigActionButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: '#10B981',
    gap: 8,
    elevation: 4,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonEmoji: {
    fontSize: 20,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: 0.3,
  },
  iconButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#1E293B',
    borderWidth: 1.5,
    borderColor: '#334155',
    minWidth: 58,
  },
  wipeButton: {
    backgroundColor: '#334155',
    borderColor: '#475569',
  },
  smallEmoji: {
    fontSize: 18,
  },
  iconButtonLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    marginTop: 2,
  },
  toolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  paletteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  chalkSwatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedSwatch: {
    borderColor: '#38BDF8',
    borderWidth: 3,
    transform: [{ scale: 1.15 }],
  },
  spongeSwatch: {
    borderWidth: 2,
    borderColor: '#64748B',
  },
  swatchCheck: {
    color: '#0F172A',
    fontWeight: '900',
    fontSize: 16,
  },
  spongeIcon: {
    fontSize: 16,
  },
  sizeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    padding: 3,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 3,
  },
  sizeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sizeButtonSelected: {
    backgroundColor: '#334155',
  },
  sizeDot: {
    minWidth: 4,
    minHeight: 4,
  },
});
