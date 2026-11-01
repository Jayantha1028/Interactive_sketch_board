import React from 'react';
import { View, StyleSheet, Modal, Text, TouchableOpacity, ScrollView } from 'react-native';
import { soundEffects } from '../services/soundEffects';

interface HelpModalProps {
  visible: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ visible, onClose }) => {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>🎨 How to Use DoodlePhonics</Text>

          <ScrollView style={styles.content}>
            <View style={styles.step}>
              <Text style={styles.stepIcon}>1️⃣</Text>
              <View style={styles.stepTextContainer}>
                <Text style={styles.stepTitle}>Pick a Letter or Number</Text>
                <Text style={styles.stepDescription}>
                  Scroll across the top carousel and select any letter from A to Z or numbers 0 to 9.
                </Text>
              </View>
            </View>

            <View style={styles.step}>
              <Text style={styles.stepIcon}>2️⃣</Text>
              <View style={styles.stepTextContainer}>
                <Text style={styles.stepTitle}>Listen to the Phonics Sound</Text>
                <Text style={styles.stepDescription}>
                  Tap <Text style={styles.bold}>"Hear Phonics"</Text> to listen to the letter's phonetic pronunciation and example words (e.g., "A says /æ/ as in Apple!").
                </Text>
              </View>
            </View>

            <View style={styles.step}>
              <Text style={styles.stepIcon}>3️⃣</Text>
              <View style={styles.stepTextContainer}>
                <Text style={styles.stepTitle}>Trace or Sketch</Text>
                <Text style={styles.stepDescription}>
                  Use your finger or stylus to trace along the dotted guide path, starting at the bright green circle! Pick colors or use the eraser.
                </Text>
              </View>
            </View>

            <View style={styles.step}>
              <Text style={styles.stepIcon}>4️⃣</Text>
              <View style={styles.stepTextContainer}>
                <Text style={styles.stepTitle}>Check Your Drawing</Text>
                <Text style={styles.stepDescription}>
                  Tap <Text style={styles.bold}>"Check Drawing"</Text> to see your star rating, hear celebratory praise, and learn a fun fact!
                </Text>
              </View>
            </View>
          </ScrollView>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => {
              soundEffects.playPop();
              onClose();
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.closeButtonText}>Got it! Let's Draw! 🚀</Text>
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
    borderRadius: 28,
    padding: 24,
    maxHeight: '85%',
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 16,
  },
  content: {
    marginVertical: 8,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  stepIcon: {
    fontSize: 24,
    marginTop: 2,
  },
  stepTextContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 2,
  },
  stepDescription: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
  bold: {
    fontWeight: '700',
    color: '#10B981',
  },
  closeButton: {
    backgroundColor: '#6366F1',
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
});
