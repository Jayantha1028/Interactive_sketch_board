import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

class SpeechService {
  private isSpeaking: boolean = false;
  private speechRate: number = 0.95; // Clear natural rate
  private speechPitch: number = 1.0; // 1.0 = Natural human voice without metallic distortion
  private voicesLoaded: boolean = false;
  private activeUtterance: any = null;

  constructor() {
    this.initVoices();
  }

  public initVoices(): void {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const load = () => {
        try {
          const voices = window.speechSynthesis.getVoices();
          if (voices && voices.length > 0) {
            this.voicesLoaded = true;
          }
        } catch (e) {
          // ignore
        }
      };

      load();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = load;
      }
    }
  }

  /**
   * Unlock & resume web speech synthesis on user interaction
   * Browsers (Chrome / Safari) require user activation to unpause speech synthesis.
   */
  public resumeAudioContext(): void {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
      } catch (e) {
        // ignore
      }
    }
  }

  /**
   * Pick best natural English voice from loaded voices
   */
  private getBestVoice(): SpeechSynthesisVoice | null {
    if (Platform.OS !== 'web' || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return null;
    }

    try {
      const voices = window.speechSynthesis.getVoices();
      if (!voices || voices.length === 0) return null;

      // Filter out metallic, robotic, or novelty voices
      const badKeywords = [
        'espeak', 'fred', 'junior', 'zarvox', 'albert', 'trinoids',
        'cellos', 'bad news', 'pipe organ', 'bells', 'boing',
        'deranged', 'hysterical', 'whisper', 'wobble', 'robot',
      ];

      // Preferred warm human voices
      const preferred = [
        'Google US English',
        'Samantha',
        'Ava',
        'Natural',
        'Neural',
        'Victoria',
        'Karen',
        'Moira',
        'Tessa',
        'Daniel',
        'Allison',
      ];

      for (const pref of preferred) {
        const found = voices.find(
          v => v.name.toLowerCase().includes(pref.toLowerCase()) && v.lang.startsWith('en')
        );
        if (found) return found;
      }

      // Any clean English voice
      const cleanEn = voices.find(v => {
        const n = v.name.toLowerCase();
        return v.lang.startsWith('en') && !badKeywords.some(b => n.includes(b));
      });

      return cleanEn || voices[0];
    } catch (e) {
      return null;
    }
  }

  /**
   * Speak a text string with 100% reliability across Web and Mobile
   */
  public async speak(text: string, onDone?: () => void): Promise<void> {
    try {
      this.isSpeaking = true;

      if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        // Resume synthesis if paused
        window.speechSynthesis.resume();

        // Cancel previous speech cleanly
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = this.speechRate;
        utterance.pitch = this.speechPitch;
        utterance.lang = 'en-US';

        const voice = this.getBestVoice();
        if (voice) {
          utterance.voice = voice;
        }

        // PREVENT CHROME GARBAGE COLLECTION BUG:
        // Chrome prematurely garbage-collects utterances if not assigned to window object!
        (window as any).__speechUtterance = utterance;
        this.activeUtterance = utterance;

        utterance.onend = () => {
          this.isSpeaking = false;
          (window as any).__speechUtterance = null;
          onDone?.();
        };

        utterance.onerror = (e) => {
          console.warn('SpeechSynthesis error:', e);
          this.isSpeaking = false;
          (window as any).__speechUtterance = null;
          onDone?.();
        };

        // Small timeout after cancel() prevents Chrome cancelling the new utterance
        setTimeout(() => {
          try {
            window.speechSynthesis.resume();
            window.speechSynthesis.speak(utterance);
          } catch (err) {
            console.warn('speak error:', err);
            this.isSpeaking = false;
            onDone?.();
          }
        }, 50);
      } else {
        // Native iOS / Android (Expo Speech)
        await Speech.stop();
        Speech.speak(text, {
          rate: this.speechRate,
          pitch: this.speechPitch,
          language: 'en-US',
          onDone: () => {
            this.isSpeaking = false;
            onDone?.();
          },
          onError: (e) => {
            console.warn('Expo Speech error:', e);
            this.isSpeaking = false;
            onDone?.();
          },
        });
      }
    } catch (err) {
      console.warn('SpeechService speak failed:', err);
      this.isSpeaking = false;
      onDone?.();
    }
  }

  /**
   * Speak the explanation of the recognized drawing
   */
  public async speakExplanation(
    item: { name: string; spelling: string; explanation: string; soundWord?: string },
    onDone?: () => void
  ): Promise<void> {
    const soundPart = item.soundWord ? ` ${item.soundWord}` : '';
    const fullText = `That's ${item.name}! ${item.spelling}. ${item.explanation}${soundPart}`;
    await this.speak(fullText, onDone);
  }

  /**
   * Speak celebration praise upon drawing/tracing success
   */
  public async speakPraise(characterName: string, stars: number = 3): Promise<void> {
    const praise = `Awesome job! You made ${characterName}! Superstar!`;
    await this.speak(praise);
  }

  /**
   * Speak gentle encouragement
   */
  public async speakEncouragement(characterName: string): Promise<void> {
    const encourage = `Good try! Keep going with ${characterName}!`;
    await this.speak(encourage);
  }

  /**
   * Speak phonics for a PhonicsItem
   */
  public async speakPhonics(item: { audioPhrase: string }, onDone?: () => void): Promise<void> {
    await this.speak(item.audioPhrase, onDone);
  }

  /**
   * Stop any current speech
   */
  public stop(): void {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      } else {
        Speech.stop();
      }
      this.isSpeaking = false;
    } catch (e) {
      // ignore
    }
  }

  public setRate(rate: number): void {
    this.speechRate = Math.max(0.7, Math.min(1.2, rate));
  }

  public setPitch(pitch: number): void {
    this.speechPitch = Math.max(0.95, Math.min(1.05, pitch));
  }
}

export const speechService = new SpeechService();
