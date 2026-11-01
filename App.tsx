import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  SafeAreaView,
  Platform,
  StatusBar as RNStatusBar,
  useWindowDimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Stroke, SlateContent } from './src/types';
import { speechService } from './src/services/speechService';
import { soundEffects } from './src/services/soundEffects';
import { geminiService } from './src/services/geminiService';
import { DOODLE_DICTIONARY } from './src/data/doodleDictionary';
import { Header } from './src/components/Header';
import { DrawingCanvas, DrawingCanvasRef } from './src/components/DrawingCanvas';
import { Toolbar } from './src/components/Toolbar';
import { SlateReadout } from './src/components/SlateReadout';
import { SettingsModal } from './src/components/SettingsModal';

export default function App() {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const canvasRef = useRef<DrawingCanvasRef>(null);

  // Slate drawing state (default to white chalk)
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentColor, setCurrentColor] = useState<string>('#FFFFFF');
  const [strokeWidth, setStrokeWidth] = useState<number>(18);

  // Reading & Slate state
  const [currentContent, setCurrentContent] = useState<SlateContent | null>(null);
  const [isReading, setIsReading] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [readingMode, setReadingMode] = useState<'direct' | 'phonics'>('direct');
  const [speechSpeed, setSpeechSpeed] = useState<'slow' | 'normal'>('normal');

  // Modals
  const [showSettings, setShowSettings] = useState<boolean>(false);

  // Undo last chalk stroke
  const handleUndo = () => {
    setStrokes((prev) => prev.slice(0, prev.length - 1));
  };

  // Wipe / clean the slate
  const handleWipe = () => {
    setStrokes([]);
    setCurrentContent(null);
    speechService.stop();
  };

  // Read out the content of the slate
  const handleReadContent = (content: SlateContent, mode = readingMode) => {
    setIsSpeaking(true);
    speechService.readSlateContent(content, mode, () => {
      setIsSpeaking(false);
    });
  };

  // Analyze & read the slate
  const handleReadSlate = async () => {
    speechService.resumeAudioContext();

    if (strokes.length === 0) {
      soundEffects.playPop();
      const emptyItem: SlateContent = {
        textToRead: 'Slate is clean',
        displayLabel: 'Empty Slate',
        emoji: '📝',
        category: 'empty',
      };
      setCurrentContent(emptyItem);
      handleReadContent(emptyItem);
      return;
    }

    setIsReading(true);

    try {
      const base64 = canvasRef.current?.getCanvasImageBase64();
      const dims = canvasRef.current?.getDimensions() || { width: windowWidth, height: 400 };

      // Recognize handwritten letter, number, or drawing
      const result = await geminiService.recognizeSlate(
        strokes,
        dims.width,
        dims.height,
        base64
      );

      setCurrentContent(result);
      soundEffects.playSuccess();

      // Read aloud directly without delay
      handleReadContent(result);
    } catch (err) {
      console.warn('Slate reading error:', err);
    } finally {
      setIsReading(false);
    }
  };

  // Quick Inspiration selection
  const handleSelectInspiration = (word: string) => {
    speechService.resumeAudioContext();
    const key = word.toLowerCase();
    const letterKey = `letter-${key}`;
    const numberKey = `number-${key}`;
    const item = DOODLE_DICTIONARY[letterKey] || DOODLE_DICTIONARY[numberKey] || DOODLE_DICTIONARY[key];

    if (item) {
      const content: SlateContent = {
        textToRead: item.category === 'Alphabet' ? word.toUpperCase() : item.name,
        phonicsSound: item.soundWord,
        displayLabel: item.name,
        emoji: item.emoji,
        category: item.category === 'Alphabet' ? 'letter' : 'drawing',
      };
      setCurrentContent(content);
      handleReadContent(content);
    }
  };

  // Toggle voice rate
  const handleToggleSpeed = () => {
    if (speechSpeed === 'slow') {
      setSpeechSpeed('normal');
      speechService.setRate(0.95);
    } else {
      setSpeechSpeed('slow');
      speechService.setRate(0.82);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />

      {/* TOP HEADER */}
      <Header
        onOpenSettings={() => setShowSettings(true)}
        onSelectInspiration={handleSelectInspiration}
      />

      <View style={styles.contentContainer}>
        {/* SLATE READOUT BADGE */}
        <SlateReadout
          content={currentContent}
          isReading={isReading}
          isSpeaking={isSpeaking}
          readingMode={readingMode}
          onToggleReadingMode={() => {
            const nextMode = readingMode === 'direct' ? 'phonics' : 'direct';
            setReadingMode(nextMode);
            if (currentContent) {
              handleReadContent(currentContent, nextMode);
            }
          }}
          onRepeatAudio={() => {
            if (currentContent) {
              handleReadContent(currentContent);
            }
          }}
        />

        {/* SLATE CHALKBOARD CANVAS */}
        <View style={styles.canvasWrapper}>
          <DrawingCanvas
            ref={canvasRef}
            currentColor={currentColor}
            strokeWidth={strokeWidth}
            strokes={strokes}
            onStrokesChange={setStrokes}
            theme="slate"
          />
        </View>

        {/* SLATE TOOLBAR */}
        <Toolbar
          currentColor={currentColor}
          onSelectColor={setCurrentColor}
          strokeWidth={strokeWidth}
          onSelectStrokeWidth={setStrokeWidth}
          onClear={handleWipe}
          onUndo={handleUndo}
          canUndo={strokes.length > 0}
          onReadSlate={handleReadSlate}
          isReading={isReading}
        />
      </View>

      {/* SETTINGS MODAL */}
      <SettingsModal
        visible={showSettings}
        onClose={() => setShowSettings(false)}
        speechSpeed={speechSpeed}
        onToggleSpeed={handleToggleSpeed}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#020617', // Deep chalkboard background
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    justifyContent: 'space-between',
    maxWidth: 900,
    width: '100%',
    alignSelf: 'center',
  },
  canvasWrapper: {
    flex: 1,
    minHeight: 280,
    maxHeight: 520,
    marginVertical: 4,
  },
});
