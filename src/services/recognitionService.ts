import { Stroke, Point, PhonicsItem, RecognitionResult } from '../types';
import { PHONICS_DATA } from '../data/phonicsData';

class RecognitionService {
  /**
   * Evaluate how well the user traced the current target character.
   * canvasWidth and canvasHeight are the dimensions of the drawing canvas.
   */
  public evaluateTracing(
    strokes: Stroke[],
    target: PhonicsItem,
    canvasWidth: number,
    canvasHeight: number
  ): RecognitionResult {
    if (strokes.length === 0 || canvasWidth <= 0 || canvasHeight <= 0) {
      return {
        matchedId: target.id,
        character: target.character,
        confidence: 0,
        stars: 0,
        feedbackMessage: 'Tap the pad and trace the lines!',
        isCorrect: false,
      };
    }

    // Flatten all points and normalize them to 300x300 coordinates
    const scaleX = 300 / canvasWidth;
    const scaleY = 300 / canvasHeight;

    const normalizedUserPoints: Point[] = [];
    strokes.forEach(stroke => {
      stroke.points.forEach(pt => {
        normalizedUserPoints.push({
          x: pt.x * scaleX,
          y: pt.y * scaleY,
        });
      });
    });

    if (normalizedUserPoints.length < 5) {
      return {
        matchedId: target.id,
        character: target.character,
        confidence: 0.1,
        stars: 0,
        feedbackMessage: 'Keep drawing! Trace all the lines!',
        isCorrect: false,
      };
    }

    const keypoints = target.traceKeypoints;
    const hitRadius = 45; // Generous tolerance for young children's motor skills
    let hits = 0;

    keypoints.forEach((kp: Point) => {
      const isHit = normalizedUserPoints.some(up => {
        const dx = up.x - kp.x;
        const dy = up.y - kp.y;
        return Math.sqrt(dx * dx + dy * dy) <= hitRadius;
      });
      if (isHit) {
        hits++;
      }
    });

    const keypointRatio = keypoints.length > 0 ? hits / keypoints.length : 0.8;

    // Check user bounding box coverage
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    normalizedUserPoints.forEach(p => {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    });

    const userWidth = maxX - minX;
    const userHeight = maxY - minY;

    // A valid drawing should span at least 25% of the canvas in width or height
    const hasAdequateScale = userWidth > 60 || userHeight > 60;
    const confidence = Math.min(1.0, keypointRatio * (hasAdequateScale ? 1.0 : 0.6));

    let stars = 1;
    let feedback = `Nice try! Keep practicing ${target.name}!`;
    let isCorrect = false;

    if (confidence >= 0.75) {
      stars = 3;
      feedback = `Superstar! You drew ${target.name} perfectly!`;
      isCorrect = true;
    } else if (confidence >= 0.5) {
      stars = 2;
      feedback = `Great job! You traced ${target.name}!`;
      isCorrect = true;
    } else if (confidence >= 0.3) {
      stars = 1;
      feedback = `Good effort! Let's trace ${target.name} again!`;
      isCorrect = true;
    }

    return {
      matchedId: target.id,
      character: target.character,
      confidence,
      stars,
      feedbackMessage: feedback,
      isCorrect,
    };
  }

  /**
   * Freeform doodle / character classifier
   * Compares the child's drawn strokes against all characters in the database
   */
  public recognizeFreeform(
    strokes: Stroke[],
    canvasWidth: number,
    canvasHeight: number
  ): RecognitionResult {
    if (strokes.length === 0) {
      return {
        matchedId: '',
        character: '',
        confidence: 0,
        stars: 0,
        feedbackMessage: 'Draw something on the canvas!',
        isCorrect: false,
      };
    }

    let bestMatch: PhonicsItem = PHONICS_DATA[0];
    let highestScore = -1;

    for (const item of PHONICS_DATA) {
      const evalResult = this.evaluateTracing(strokes, item, canvasWidth, canvasHeight);
      if (evalResult.confidence > highestScore) {
        highestScore = evalResult.confidence;
        bestMatch = item;
      }
    }

    const confidence = Math.max(0.4, highestScore);
    const stars = confidence > 0.7 ? 3 : confidence > 0.5 ? 2 : 1;

    return {
      matchedId: bestMatch.id,
      character: bestMatch.character,
      confidence,
      stars,
      feedbackMessage: `Looks like ${bestMatch.name}! ${bestMatch.character} is for ${bestMatch.exampleWord}!`,
      isCorrect: true,
    };
  }
}

export const recognitionService = new RecognitionService();
