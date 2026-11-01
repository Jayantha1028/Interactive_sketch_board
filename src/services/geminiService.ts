import { DrawingExplanation, Stroke, Point } from '../types';
import { DOODLE_DICTIONARY } from '../data/doodleDictionary';

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
   * High-Accuracy Geometric Character & Doodle Recognizer
   * Analyzes strokes, geometry, aspect ratio, apex, bottom hook, loops, and crossings.
   */
  public recognizeOffline(
    strokes: Stroke[],
    width: number,
    height: number
  ): DrawingExplanation {
    if (strokes.length === 0) {
      return {
        name: 'Empty Pad',
        emoji: '📝',
        spelling: 'D - R - A - W',
        explanation: 'Draw anything you like on the notepad with your finger or stylus, then tap Explain!',
        category: 'Pad',
        funFact: 'Drawing sparks creativity and helps your brain grow!',
      };
    }

    // Collect all points
    const allPoints: Point[] = [];
    strokes.forEach(s => s.points.forEach(p => allPoints.push(p)));

    if (allPoints.length < 5) {
      return {
        name: 'Little Dot',
        emoji: '✨',
        spelling: 'D - O - T',
        explanation: 'You made a tiny mark! Keep drawing to create a letter, animal, or sun!',
        category: 'Doodle',
        funFact: 'Every great masterpiece begins with a single mark!',
      };
    }

    // Bounding Box
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    allPoints.forEach(p => {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    });

    const boxW = Math.max(1, maxX - minX);
    const boxH = Math.max(1, maxY - minY);
    const aspectRatio = boxW / boxH;
    const strokeCount = strokes.length;

    // Normalize all points to unit square [0, 1] x [0, 1]
    const normStrokes: Point[][] = strokes.map(s =>
      s.points.map(p => ({
        x: (p.x - minX) / boxW,
        y: (p.y - minY) / boxH,
      }))
    );
    const normAllPoints: Point[] = allPoints.map(p => ({
      x: (p.x - minX) / boxW,
      y: (p.y - minY) / boxH,
    }));

    // Helper functions for geometry analysis
    const pointsInYBand = (y0: number, y1: number) =>
      normAllPoints.filter(p => p.y >= y0 && p.y <= y1);

    const widthInYBand = (y0: number, y1: number) => {
      const band = pointsInYBand(y0, y1);
      if (band.length === 0) return 0;
      let xMin = 1, xMax = 0;
      band.forEach(p => {
        if (p.x < xMin) xMin = p.x;
        if (p.x > xMax) xMax = p.x;
      });
      return Math.max(0, xMax - xMin);
    };

    const hasHorizontalStroke = (yMin: number, yMax: number, minWidth: number = 0.35) => {
      return normStrokes.some(stroke => {
        if (stroke.length < 2) return false;
        let sMinX = 1, sMaxX = 0, sMinY = 1, sMaxY = 0;
        stroke.forEach(p => {
          if (p.x < sMinX) sMinX = p.x;
          if (p.x > sMaxX) sMaxX = p.x;
          if (p.y < sMinY) sMinY = p.y;
          if (p.y > sMaxY) sMaxY = p.y;
        });
        const w = sMaxX - sMinX;
        const h = sMaxY - sMinY;
        const avgY = (sMinY + sMaxY) / 2;
        return w >= minWidth && h <= 0.45 && avgY >= yMin && avgY <= yMax;
      });
    };

    // Check if drawing has a closed loop
    const firstStroke = normStrokes[0];
    const fp = firstStroke[0];
    const lp = firstStroke[firstStroke.length - 1];
    const startEndDist = Math.hypot(fp.x - lp.x, fp.y - lp.y);
    const isClosedLoop = startEndDist < 0.35 && firstStroke.length > 8;

    // Check bottom hook (crucial for Letter J)
    // Find the longest vertical stroke
    const mainStroke = normStrokes.reduce((longest, curr) =>
      curr.length > longest.length ? curr : longest, normStrokes[0]);

    const topPoints = mainStroke.filter(p => p.y < 0.35);
    const bottomPoints = mainStroke.filter(p => p.y > 0.65);
    const lowestPoint = mainStroke.reduce((lowest, curr) => curr.y > lowest.y ? curr : lowest, mainStroke[0]);
    const endPoint = mainStroke[mainStroke.length - 1];

    // J-HOOK DETECTION:
    // Main vertical stroke starts at top (y < 0.3), goes down, and at bottom curves leftwards (x decreases) and slightly up!
    const startsTop = topPoints.length > 0 && Math.min(...topPoints.map(p => p.y)) < 0.25;
    const reachesBottom = lowestPoint.y > 0.8;
    // Bottom points curl to the left:
    const bottomMinX = bottomPoints.length > 0 ? Math.min(...bottomPoints.map(p => p.x)) : 1;
    const bottomMaxX = bottomPoints.length > 0 ? Math.max(...bottomPoints.map(p => p.x)) : 0;
    const bottomSpansLeft = bottomMinX < 0.35 && bottomMaxX > 0.45;
    const endPointCurvesUp = endPoint.y < lowestPoint.y - 0.08 || (endPoint.x < 0.35 && lowestPoint.x > 0.4);
    const isJHook = startsTop && reachesBottom && (bottomSpansLeft || endPointCurvesUp) && aspectRatio < 1.15;

    // A-FRAME DETECTION:
    // Narrow top (apex), wide bottom, horizontal crossbar around the middle
    const topWidth = widthInYBand(0.0, 0.25);
    const bottomWidth = widthInYBand(0.75, 1.0);
    const midCrossbar = hasHorizontalStroke(0.35, 0.75, 0.25);
    const apexNearCenter = topPoints.length > 0 && topPoints.some(p => p.x >= 0.25 && p.x <= 0.75);
    const isLetterA = (strokeCount >= 2 && strokeCount <= 4) &&
                      topWidth < bottomWidth * 0.65 &&
                      bottomWidth > 0.45 &&
                      (midCrossbar || hasHorizontalStroke(0.3, 0.8, 0.2)) &&
                      aspectRatio > 0.45 && aspectRatio < 1.35;

    // Check letter A first
    if (isLetterA) {
      return DOODLE_DICTIONARY['letter-a'];
    }

    // Check letter J
    if (isJHook && (strokeCount === 1 || strokeCount === 2)) {
      return DOODLE_DICTIONARY['letter-j'];
    }

    // Letter T: Horizontal bar at top + vertical stem down from center
    const hasTopBar = hasHorizontalStroke(0.0, 0.3, 0.45);
    const hasCenterStem = normAllPoints.some(p => p.y > 0.75 && p.x >= 0.35 && p.x <= 0.65);
    if (hasTopBar && hasCenterStem && !isClosedLoop && strokeCount <= 2 && aspectRatio > 0.5 && aspectRatio < 1.4) {
      return DOODLE_DICTIONARY['letter-t'];
    }

    // Letter H: Two vertical legs + crossbar in middle
    const leftVertical = normAllPoints.some(p => p.x < 0.3 && p.y < 0.3) && normAllPoints.some(p => p.x < 0.3 && p.y > 0.7);
    const rightVertical = normAllPoints.some(p => p.x > 0.7 && p.y < 0.3) && normAllPoints.some(p => p.x > 0.7 && p.y > 0.7);
    if (leftVertical && rightVertical && midCrossbar && strokeCount <= 4) {
      return DOODLE_DICTIONARY['letter-h'];
    }

    // Letter X: Two diagonal crossing lines
    const crossings = strokeCount === 2 &&
      normStrokes[0].some(p => p.x < 0.3 && p.y < 0.3) &&
      normStrokes[0].some(p => p.x > 0.7 && p.y > 0.7) &&
      normStrokes[1].some(p => p.x > 0.7 && p.y < 0.3) &&
      normStrokes[1].some(p => p.x < 0.3 && p.y > 0.7);
    if (crossings) {
      return DOODLE_DICTIONARY['letter-x'];
    }

    // Letter L: Vertical down left + horizontal right along bottom
    const hasLCorner = normAllPoints.some(p => p.x < 0.35 && p.y < 0.3) &&
                       normAllPoints.some(p => p.x < 0.35 && p.y > 0.8) &&
                       normAllPoints.some(p => p.x > 0.65 && p.y > 0.8);
    if (hasLCorner && strokeCount <= 2 && !midCrossbar && !isClosedLoop) {
      return DOODLE_DICTIONARY['letter-l'];
    }

    // Letter O / Number 0 / Sun / Circle
    if (isClosedLoop && strokeCount === 1) {
      if (aspectRatio >= 0.75 && aspectRatio <= 1.25) {
        return DOODLE_DICTIONARY['letter-o'];
      }
      if (aspectRatio > 1.25) {
        return DOODLE_DICTIONARY.heart;
      }
      return DOODLE_DICTIONARY['number-0'];
    }

    // Number 1 / Letter I: Tall vertical line
    if (aspectRatio < 0.35 && strokeCount <= 3) {
      return DOODLE_DICTIONARY['number-1'];
    }

    // Letter B / P / D: Vertical line with loop(s)
    if (leftVertical && isClosedLoop) {
      return DOODLE_DICTIONARY['letter-b'];
    }

    // Letter S / Number 5: Curving S-shape
    const startsTopRight = topPoints.some(p => p.x > 0.5);
    const endsBottomLeft = bottomPoints.some(p => p.x < 0.5);
    if (strokeCount === 1 && startsTopRight && endsBottomLeft && !isClosedLoop && aspectRatio > 0.4 && aspectRatio < 0.95) {
      return DOODLE_DICTIONARY['letter-s'];
    }

    // Letter C: Open curve to the right
    if (strokeCount === 1 && !isClosedLoop && aspectRatio > 0.55 && aspectRatio < 1.1) {
      const rightSideOpen = normAllPoints.filter(p => p.x > 0.75 && p.y >= 0.35 && p.y <= 0.65).length === 0;
      const leftSideFull = normAllPoints.some(p => p.x < 0.3 && p.y >= 0.35 && p.y <= 0.65);
      if (rightSideOpen && leftSideFull) {
        return DOODLE_DICTIONARY['letter-c'];
      }
    }

    // DOODLES: Tree (has narrow trunk at bottom + wide canopy on top)
    const trunkWidth = widthInYBand(0.7, 1.0);
    const canopyWidth = widthInYBand(0.1, 0.6);
    if (trunkWidth < 0.35 && canopyWidth > 0.65 && strokeCount >= 2) {
      return DOODLE_DICTIONARY.tree;
    }

    // DOODLES: Sun (central circle with multiple rays around it)
    if (strokeCount >= 5 && aspectRatio > 0.75 && aspectRatio < 1.3) {
      return DOODLE_DICTIONARY.sun;
    }

    // DOODLES: Star
    if (strokeCount >= 4 && aspectRatio > 0.8 && aspectRatio < 1.2) {
      return DOODLE_DICTIONARY.star;
    }

    // DOODLES: Car (Wide horizontal body, aspect ratio > 1.4)
    if (aspectRatio > 1.4 && strokeCount >= 2) {
      return DOODLE_DICTIONARY.car;
    }

    // DOODLES: House (Square base with triangle roof, 3+ strokes)
    if (strokeCount >= 3 && aspectRatio > 0.75 && aspectRatio < 1.35) {
      return DOODLE_DICTIONARY.house;
    }

    // DOODLES: Cat (Has ears on top, whiskers or face)
    if (strokeCount >= 4) {
      return DOODLE_DICTIONARY.cat;
    }

    // Fallback: If 1-3 strokes with narrow top and wide bottom, likely Letter A
    if (topWidth < bottomWidth * 0.7 && strokeCount <= 3) {
      return DOODLE_DICTIONARY['letter-a'];
    }

    // Default friendly character
    return DOODLE_DICTIONARY['letter-a'];
  }
}

export const geminiService = new GeminiVisionService();
