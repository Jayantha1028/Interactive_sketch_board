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
  onExplain: () => void;
  isAnalyzing: boolean;
}

const PALETTE = [
  { name: 'Dark', hex: '#1E293B', icon: '⚫' },
  { name: 'Red', hex: '#EF4444', icon: '🔴' },
  { name: 'Blue', hex: '#3B82F6', icon: '🔵' },
  { name: 'Green', hex: '#10B981', icon: '🟢' },
  { name: 'Orange', hex: '#F97316', icon: '🟠' },
  { name: 'Purple', hex: '#8B5CF6', icon: '🟣' },
  { name: 'Yellow', hex: '#EAB308', icon: '🟡' },
  { name: 'Eraser', hex: '#FFFFFF', icon: '🧽' },
];

export const Toolbar: React.FC<ToolbarProps> = ({
  currentColor,
  onSelectColor,
  strokeWidth,
  onSelectStrokeWidth,
  onClear,
  onUndo,
  canUndo,
  onExplain,
  isAnalyzing,
}) => {
  return (
    <View style={styles.container}>
      {/* MAIN ACTION BAR: Explain Drawing, Undo, Clear */}
      <View style={styles.actionRow}>
        {/* BIG EXPLAIN DRAWING BUTTON */}
        <TouchableOpacity
          style={[styles.bigActionButton, isAnalyzing && styles.buttonDisabled]}
          onPress={() => {
            speechService.resumeAudioContext();
            soundEffects.playSuccess();
            onExplain();
          }}
          disabled={isAnalyzing}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonEmoji}>🪄</Text>
          <Text style={styles.actionButtonText}>
            {isAnalyzing ? 'Analyzing...' : 'Explain My Drawing'}
          </Text>
        </TouchableOpacity>

        {/* UNDO BUTTON */}
        <TouchableOpacity
          style={[styles.iconButton, !canUndo && styles.buttonDisabled]}
          onPress={() => {
            if (canUndo) {
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

        {/* CLEAR NOTEPAD BUTTON */}
        <TouchableOpacity
          style={[styles.iconButton, styles.clearButton]}
          onPress={() => {
            soundEffects.playWhoosh();
            onClear();
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.smallEmoji}>🗑️</Text>
          <Text style={styles.iconButtonLabel}>Clear</Text>
        </TouchableOpacity>
      </View>

      {/* TOOLS ROW: Colors & Thickness */}
      <View style={styles.toolRow}>
        {/* Color Palette */}
        <View style={styles.paletteContainer}>
          {PALETTE.map((item) => {
            const isSelected = currentColor === item.hex;
            const isEraser = item.hex === '#FFFFFF';
            return (
              <TouchableOpacity
                key={item.name}
                style={[
                  styles.colorSwatch,
                  { backgroundColor: item.hex },
                  isSelected && styles.selectedSwatch,
                  isEraser && styles.eraserSwatch,
                ]}
                onPress={() => {
                  soundEffects.playPop();
                  onSelectColor(item.hex);
                }}
                activeOpacity={0.8}
              >
                {isSelected && <Text style={styles.swatchCheck}>✓</Text>}
                {isEraser && !isSelected && <Text style={styles.eraserIcon}>🧽</Text>}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Brush Sizes */}
        <View style={styles.sizeContainer}>
          {[8, 16, 26].map((size) => {
            const isSelected = strokeWidth === size;
            return (
              <TouchableOpacity
                key={`size-${size}`}
                style={[styles.sizeButton, isSelected && styles.sizeButtonSelected]}
                onPress={() => {
                  soundEffects.playPop();
                  onSelectStrokeWidth(size);
                }}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.sizeDot,
                    {
                      width: size * 0.7,
                      height: size * 0.7,
                      borderRadius: (size * 0.7) / 2,
                      backgroundColor: currentColor === '#FFFFFF' ? '#94A3B8' : currentColor,
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
    backgroundColor: '#F8FAFC',
    borderRadius: 22,
    padding: 12,
    marginVertical: 6,
    borderWidth: 2,
    borderColor: '#E2E8F0',
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
    backgroundColor: '#6366F1',
    gap: 8,
    elevation: 3,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
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
    fontSize: 15,
    letterSpacing: 0.2,
  },
  iconButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    minWidth: 58,
  },
  clearButton: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FECACA',
  },
  smallEmoji: {
    fontSize: 18,
  },
  iconButtonLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
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
  colorSwatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  selectedSwatch: {
    borderWidth: 3,
    borderColor: '#0F172A',
    transform: [{ scale: 1.15 }],
  },
  eraserSwatch: {
    borderWidth: 2,
    borderColor: '#CBD5E1',
  },
  swatchCheck: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 15,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  eraserIcon: {
    fontSize: 15,
  },
  sizeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 3,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    backgroundColor: '#EEF2FF',
  },
  sizeDot: {
    minWidth: 4,
    minHeight: 4,
  },
});
