import { DrawingExplanation, Stroke, Point, SlateContent } from '../types';
import { DOODLE_DICTIONARY } from '../data/doodleDictionary';
import { PointCloudRecognizer } from './pointCloudRecognizer';

class GeminiVisionService {
  private apiKey: string = '';

  constructor() {
    if (typeof process !== 'undefined' && process.env && process.env.EXPO_PUBLIC_GEMINI_API_KEY) {
      this.apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    } else if (typeof window !== 'undefined' && window.localStorage) {
      const stored = window.localStorage.getItem('gemini_api_key');
      if (stored) this.apiKey = stored;
    }
  }

  public setApiKey(key: string): void {
    this.apiKey = key.trim();
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('gemini_api_key', this.apiKey);
    }
  }

  public getApiKey(): string {
    return this.apiKey;
  }

  public hasApiKey(): boolean {
    return this.apiKey.length > 10;
  }

  /**
   * Recognize what was drawn using Gemini Vision AI
   */
  public async recognizeDrawingWithAI(base64Png: string): Promise<DrawingExplanation | null> {
    if (!this.hasApiKey()) {
      return null;
    }

    try {
      const cleanBase64 = base64Png.replace(/^data:image\/[a-z]+;base64,/, '');

      const prompt = `You are a warm, enthusiastic early-childhood teacher talking directly to a young kid who just drew this picture on their sketch pad.
Look at the child's sketch and identify what it represents. It could be an English letter (A-Z), a number (0-9), an animal, a vehicle, food, a house, a tree, nature, or a doodle.
Respond ONLY with a valid JSON object matching this schema, with no markdown code blocks:
{
  "name": "Object or Character Name (e.g. Letter A, Letter J, Cat, Sun, Apple, House, Car, Number 5)",
  "emoji": "Single cute emoji representing it",
  "spelling": "Hyphenated letter spelling (e.g. A - P - P - L - E or C - A - T)",
  "explanation": "A cheerful 1-2 sentence kid-friendly explanation describing what it is and what it does.",
  "soundWord": "A fun sound word (e.g. Ah ah Apple!, Juh juh Juice!, Meow meow!, Vroom vroom!)",
  "category": "Category name (Alphabet, Number, Animal, Vehicle, Nature, Food)",
  "funFact": "One fascinating kid-friendly fact about it"
}`;

      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.apiKey}`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  inline_data: {
                    mime_type: 'image/png',
                    data: cleanBase64,
                  },
                },
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: 'application/json',
          },
        }),
      });

      if (!response.ok) {
        console.warn('Gemini API error status:', response.status);
        return null;
      }

      const json = await response.json();
      const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) return null;

      const parsed = JSON.parse(rawText) as DrawingExplanation;
      return parsed;
    } catch (err) {
      console.warn('Gemini vision analysis failed, falling back to smart recognizer:', err);
      return null;
    }
  }

  /**
   * Slate Mode: Recognizes handwritten letters, numbers, or drawings
   * and extracts the exact content to be read aloud (e.g. "A", "J", "Cat", "7")
   */
  public async recognizeSlate(
    strokes: Stroke[],
    width: number,
    height: number,
    base64Png?: string | null
  ): Promise<SlateContent> {
    if (strokes.length === 0) {
      return {
        textToRead: 'Slate is clean',
        displayLabel: 'Empty Slate',
        emoji: '📝',
        category: 'empty',
      };
    }

    // 1. Try Gemini Vision if API key is present and image is available
    if (this.hasApiKey() && base64Png) {
      try {
        const cleanBase64 = base64Png.replace(/^data:image\/[a-z]+;base64,/, '');
        const prompt = `You are a reading engine for a child's digital slate.
Look at the handwriting or sketch on this slate. Identify the exact letter (e.g. 'A', 'J', 'b'), number (e.g. '1', '7'), word (e.g. 'CAT', 'DOG'), or simple sketch (e.g. 'Cat', 'Sun', 'Star') written on the slate.
Respond ONLY with a valid JSON object with NO markdown formatting:
{
  "textToRead": "The exact word or letter to read aloud (e.g. 'A', 'J', 'Cat', 'Hello', '7', 'Star')",
  "phonicsSound": "Short phonics sound if a letter (e.g. 'A says ah', 'J says juh') or empty string",
  "displayLabel": "Short title to show on slate (e.g. 'Letter A', 'Letter J', 'Cat', 'Number 7')",
  "emoji": "Single cute emoji (e.g. '🅰️', '🧃', '🐱')",
  "category": "letter"
}`;

        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.apiKey}`;
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { inline_data: { mime_type: 'image/png', data: cleanBase64 } },
                  { text: prompt },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.1,
              responseMimeType: 'application/json',
            },
          }),
        });

        if (res.ok) {
          const json = await res.json();
          const raw = json.candidates?.[0]?.content?.parts?.[0]?.text;
          if (raw) {
            const parsed = JSON.parse(raw) as SlateContent;
            return parsed;
          }
        }
      } catch (e) {
        console.warn('Gemini slate read error, falling back to offline recognizer:', e);
      }
    }

    // 2. High-Accuracy $P Point-Cloud Matcher (Stroke-order & count invariant)
    const match = PointCloudRecognizer.recognize(strokes);

    return {
      textToRead: match.textToRead,
      phonicsSound: match.phonicsSound,
      displayLabel: match.displayLabel,
      emoji: match.emoji,
      category: match.category,
      score: match.score,
      alternatives: match.alternatives,
    };
  }

  /**
   * High-Accuracy Geometric Character & Doodle Recognizer
   * Powered by $P Point-Cloud Matcher
   */
  public recognizeOffline(
    strokes: Stroke[],
    width: number,
    height: number
  ): DrawingExplanation {
    if (strokes.length === 0) {
      return {
        name: 'Empty Slate',
        emoji: '📝',
        spelling: 'D - R - A - W',
        explanation: 'Draw or write anything on your slate with your finger or stylus!',
        category: 'Pad',
        funFact: 'Drawing and writing builds fine motor skills and creativity!',
      };
    }

    const match = PointCloudRecognizer.recognize(strokes);
    if (match.id === 'dot') {
      return {
        name: 'Little Dot',
        emoji: '✨',
        spelling: 'D - O - T',
        explanation: 'You made a tiny mark! Write a letter like A or J!',
        category: 'Doodle',
        funFact: 'Every great letter begins with a single touch!',
      };
    }

    // Look up dictionary entry
    const key =
      match.category === 'letter'
        ? `letter-${match.textToRead.toLowerCase()}`
        : match.category === 'number'
        ? `number-${match.textToRead}`
        : match.id.toLowerCase();

    const dictItem = DOODLE_DICTIONARY[key];
    if (dictItem) {
      return dictItem;
    }

    return {
      name: match.displayLabel,
      emoji: match.emoji,
      spelling: match.textToRead,
      explanation: `${match.displayLabel}. ${match.phonicsSound}`,
      soundWord: match.phonicsSound,
      category: match.category,
    };
  }
}

export const geminiService = new GeminiVisionService();
