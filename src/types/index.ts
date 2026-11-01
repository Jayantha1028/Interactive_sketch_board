export interface Point {
  x: number;
  y: number;
}

export interface Stroke {
  id: string;
  points: Point[];
  color: string;
  width: number;
}

export interface DrawingExplanation {
  name: string;
  emoji: string;
  spelling: string;
  explanation: string;
  soundWord?: string;
  category: string;
  confidence?: number;
  funFact?: string;
}

export type LearningCategory = 'uppercase' | 'lowercase' | 'numbers' | 'doodles';

export interface PhonicsItem {
  id: string;
  character: string;
  name: string;
  category: LearningCategory;
  phonicSound: string;
  phonicSpelling: string;
  exampleWord: string;
  emoji: string;
  audioPhrase: string;
  funFact: string;
  accentColor: string;
  tracePath: string;
  traceKeypoints: Point[];
}

export interface RecognitionResult {
  matchedId: string;
  character: string;
  confidence: number;
  stars: number;
  feedbackMessage: string;
  isCorrect: boolean;
}
