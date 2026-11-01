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
import { Stroke, DrawingExplanation } from './src/types';
import { speechService } from './src/services/speechService';
import { soundEffects } from './src/services/soundEffects';
import { geminiService } from './src/services/geminiService';
import { DOODLE_DICTIONARY } from './src/data/doodleDictionary';
import { Header } from './src/components/Header';
import { DrawingCanvas, DrawingCanvasRef } from './src/components/DrawingCanvas';
import { Toolbar } from './src/components/Toolbar';
import { ExplanationCard } from './src/components/ExplanationCard';
import { SettingsModal } from './src/components/SettingsModal';

export default function App() {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const canvasRef = useRef<DrawingCanvasRef>(null);

  // Drawing state
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentColor, setCurrentColor] = useState<string>('#1E293B');
  const [strokeWidth, setStrokeWidth] = useState<number>(16);

  // Recognition & Audio Explanation state
  const [currentExplanation, setCurrentExplanation] = useState<DrawingExplanation | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [speechSpeed, setSpeechSpeed] = useState<'slow' | 'normal'>('normal');

  // Modals
  const [showSettings, setShowSettings] = useState<boolean>(false);

  // Undo last stroke
  const handleUndo = () => {
    setStrokes((prev) => prev.slice(0, prev.length - 1));
  };

  // Clear notepad
  const handleClear = () => {
    setStrokes([]);
    setCurrentExplanation(null);
    speechService.stop();
  };

  // Speak the recognized explanation
  const handleSpeakCurrent = (explanation: DrawingExplanation) => {
    setIsSpeaking(true);
    speechService.speakExplanation(explanation, () => {
      setIsSpeaking(false);
    });
  };

  // Analyze sketch & produce audio explanation
  const handleExplain = async () => {
    // Synchronously resume Web Audio and SpeechSynthesis inside the user touch event
    speechService.resumeAudioContext();

    if (strokes.length === 0) {
      soundEffects.playPop();
      const emptyItem: DrawingExplanation = {
        name: 'Empty Pad',
        emoji: '📝',
        spelling: 'D - R - A - W',
        explanation: 'Your sketch pad is empty! Use your finger to draw anything you like, like a letter A, letter J, or a cat!',
        category: 'Pad',
      };
      setCurrentExplanation(emptyItem);
      handleSpeakCurrent(emptyItem);
      return;
    }

    setIsAnalyzing(true);

    try {
      let result: DrawingExplanation | null = null;

      // 1. If Gemini API key is configured and rasterization is available, try AI Vision
      if (geminiService.hasApiKey() && canvasRef.current) {
        const base64 = canvasRef.current.getCanvasImageBase64();
        if (base64) {
          result = await geminiService.recognizeDrawingWithAI(base64);
        }
      }

      // 2. If no AI result, use smart on-device recognition engine
      if (!result) {
        const dims = canvasRef.current?.getDimensions() || { width: windowWidth, height: 400 };
        result = geminiService.recognizeOffline(strokes, dims.width, dims.height);
      }

      setCurrentExplanation(result);
      soundEffects.playSuccess();

      // Speak explanation immediately
      handleSpeakCurrent(result);
    } catch (err) {
      console.warn('Recognition error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Quick Inspiration selection
  const handleSelectInspiration = (word: string) => {
    const key = word.toLowerCase();
    const item = DOODLE_DICTIONARY[key];
    if (item) {
      setCurrentExplanation(item);
      speechService.speak(`Can you draw a ${item.name}? ${item.explanation}`);
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
      <StatusBar style="dark" />

      {/* TOP HEADER */}
      <Header
        onOpenSettings={() => setShowSettings(true)}
        onSelectInspiration={handleSelectInspiration}
      />

      <View style={styles.contentContainer}>
        {/* SKETCH NOTEPAD CANVAS */}
        <View style={styles.canvasWrapper}>
          <DrawingCanvas
            ref={canvasRef}
            currentColor={currentColor}
            strokeWidth={strokeWidth}
            strokes={strokes}
            onStrokesChange={setStrokes}
          />
        </View>

        {/* AUDIO EXPLANATION CARD */}
        <ExplanationCard
          explanation={currentExplanation}
          isAnalyzing={isAnalyzing}
          isSpeaking={isSpeaking}
          onSpeak={() => {
            if (currentExplanation) {
              handleSpeakCurrent(currentExplanation);
            }
          }}
          onClear={handleClear}
        />

        {/* BOTTOM DRAWING TOOLBAR */}
        <Toolbar
          currentColor={currentColor}
          onSelectColor={setCurrentColor}
          strokeWidth={strokeWidth}
          onSelectStrokeWidth={setStrokeWidth}
          onClear={handleClear}
          onUndo={handleUndo}
          canUndo={strokes.length > 0}
          onExplain={handleExplain}
          isAnalyzing={isAnalyzing}
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
    backgroundColor: '#F8FAFC',
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
