import { Point, Stroke, SlateContent } from '../types';

export interface RecognizedMatch {
  id: string;
  textToRead: string;
  phonicsSound: string;
  displayLabel: string;
  emoji: string;
  category: 'letter' | 'number' | 'word' | 'drawing';
  score: number; // 0.0 to 1.0 (higher is better)
  alternatives: Array<{
    textToRead: string;
    displayLabel: string;
    emoji: string;
    phonicsSound: string;
  }>;
}

interface Template {
  id: string;
  textToRead: string;
  phonicsSound: string;
  displayLabel: string;
  emoji: string;
  category: 'letter' | 'number' | 'drawing';
  targetAspectRatio: number; // width / height
  points: Point[]; // 32 normalized points
}

const NUM_POINTS = 32;

/**
 * Resample an array of points into N equidistant points along the total path length
 */
function resamplePoints(points: Point[], n: number): Point[] {
  if (points.length === 0) return [];
  if (points.length === 1) {
    return Array(n).fill({ x: points[0].x, y: points[0].y });
  }

  // Calculate total path length
  let totalLen = 0;
  for (let i = 1; i < points.length; i++) {
    totalLen += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
  }

  if (totalLen === 0) {
    return Array(n).fill({ x: points[0].x, y: points[0].y });
  }

  const interval = totalLen / (n - 1);
  const resampled: Point[] = [{ x: points[0].x, y: points[0].y }];
  let D = 0;

  for (let i = 1; i < points.length; i++) {
    const p1 = points[i - 1];
    const p2 = points[i];
    const d = Math.hypot(p2.x - p1.x, p2.y - p1.y);

    if (D + d >= interval) {
      const qx = p1.x + ((interval - D) / d) * (p2.x - p1.x);
      const qy = p1.y + ((interval - D) / d) * (p2.y - p1.y);
      const q = { x: qx, y: qy };
      resampled.push(q);
      points.splice(i, 0, q);
      D = 0;
    } else {
      D += d;
    }
    if (resampled.length === n) break;
  }

  while (resampled.length < n) {
    resampled.push({ x: points[points.length - 1].x, y: points[points.length - 1].y });
  }

  return resampled;
}

/**
 * Scale and center points to [0, 1] x [0, 1] while preserving aspect ratio
 */
function normalizePointCloud(points: Point[]): { points: Point[]; aspectRatio: number } {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }

  const w = Math.max(1, maxX - minX);
  const h = Math.max(1, maxY - minY);
  const aspect = w / h;
  const maxDim = Math.max(w, h);

  const offsetX = (maxDim - w) / 2;
  const offsetY = (maxDim - h) / 2;

  const normalized = points.map(p => ({
    x: (p.x - minX + offsetX) / maxDim,
    y: (p.y - minY + offsetY) / maxDim,
  }));

  return { points: normalized, aspectRatio: aspect };
}

/**
 * Generate equidistant points along path segments
 */
function generateTemplatePoints(segments: Point[][], n: number): Point[] {
  const allRaw: Point[] = [];
  for (const seg of segments) {
    for (const pt of seg) {
      allRaw.push(pt);
    }
  }
  const resampled = resamplePoints(allRaw, n);
  const { points } = normalizePointCloud(resampled);
  return points;
}

/**
 * Symmetrical Point-Cloud Distance ($P Recognizer algorithm)
 */
function pointCloudDistance(pts1: Point[], pts2: Point[]): number {
  let sum1 = 0;
  for (const p1 of pts1) {
    let minD = Infinity;
    for (const p2 of pts2) {
      const d = Math.hypot(p1.x - p2.x, p1.y - p2.y);
      if (d < minD) minD = d;
    }
    sum1 += minD;
  }

  let sum2 = 0;
  for (const p2 of pts2) {
    let minD = Infinity;
    for (const p1 of pts1) {
      const d = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      if (d < minD) minD = d;
    }
    sum2 += minD;
  }

  return (sum1 / pts1.length + sum2 / pts2.length) / 2;
}

// -------------------------------------------------------------
// CANONICAL TEMPLATES FOR LETTERS, DIGITS, AND DOODLES
// -------------------------------------------------------------
const RAW_TEMPLATES: Array<{
  id: string;
  textToRead: string;
  phonicsSound: string;
  displayLabel: string;
  emoji: string;
  category: 'letter' | 'number' | 'drawing';
  targetAspectRatio: number;
  segments: Point[][];
}> = [
  // LETTER A (Standard uppercase A: 2 diagonals + crossbar)
  {
    id: 'A',
    textToRead: 'A',
    phonicsSound: 'A says ah as in Apple',
    displayLabel: 'Letter A',
    emoji: '🅰️',
    category: 'letter',
    targetAspectRatio: 0.8,
    segments: [
      [{ x: 50, y: 10 }, { x: 15, y: 90 }], // left diagonal
      [{ x: 50, y: 10 }, { x: 85, y: 90 }], // right diagonal
      [{ x: 28, y: 55 }, { x: 72, y: 55 }], // crossbar
    ],
  },
  // LETTER A (Variant 2: drawn in single continuous stroke)
  {
    id: 'A_v2',
    textToRead: 'A',
    phonicsSound: 'A says ah as in Apple',
    displayLabel: 'Letter A',
    emoji: '🅰️',
    category: 'letter',
    targetAspectRatio: 0.8,
    segments: [
      [{ x: 15, y: 90 }, { x: 50, y: 10 }, { x: 85, y: 90 }, { x: 60, y: 55 }, { x: 30, y: 55 }],
    ],
  },
  // LETTER B (Vertical stem + 2 rounded bumps)
  {
    id: 'B',
    textToRead: 'B',
    phonicsSound: 'B says buh as in Ball',
    displayLabel: 'Letter B',
    emoji: '🅱️',
    category: 'letter',
    targetAspectRatio: 0.75,
    segments: [
      [{ x: 20, y: 10 }, { x: 20, y: 90 }], // vertical
      [{ x: 20, y: 10 }, { x: 65, y: 10 }, { x: 75, y: 30 }, { x: 65, y: 50 }, { x: 20, y: 50 }], // top loop
      [{ x: 20, y: 50 }, { x: 70, y: 50 }, { x: 80, y: 70 }, { x: 70, y: 90 }, { x: 20, y: 90 }], // bottom loop
    ],
  },
  // LETTER C (Open curve to the right)
  {
    id: 'C',
    textToRead: 'C',
    phonicsSound: 'C says kuh as in Cat',
    displayLabel: 'Letter C',
    emoji: '🐱',
    category: 'letter',
    targetAspectRatio: 0.8,
    segments: [
      [{ x: 80, y: 25 }, { x: 50, y: 10 }, { x: 20, y: 35 }, { x: 20, y: 65 }, { x: 50, y: 90 }, { x: 80, y: 75 }],
    ],
  },
  // LETTER D (Vertical stem + 1 large curved loop)
  {
    id: 'D',
    textToRead: 'D',
    phonicsSound: 'D says duh as in Dog',
    displayLabel: 'Letter D',
    emoji: '🐶',
    category: 'letter',
    targetAspectRatio: 0.8,
    segments: [
      [{ x: 20, y: 10 }, { x: 20, y: 90 }],
      [{ x: 20, y: 10 }, { x: 65, y: 10 }, { x: 85, y: 50 }, { x: 65, y: 90 }, { x: 20, y: 90 }],
    ],
  },
  // LETTER E (Vertical stem + 3 horizontal bars)
  {
    id: 'E',
    textToRead: 'E',
    phonicsSound: 'E says eh as in Elephant',
    displayLabel: 'Letter E',
    emoji: '🐘',
    category: 'letter',
    targetAspectRatio: 0.7,
    segments: [
      [{ x: 25, y: 10 }, { x: 25, y: 90 }],
      [{ x: 25, y: 10 }, { x: 80, y: 10 }],
      [{ x: 25, y: 50 }, { x: 70, y: 50 }],
      [{ x: 25, y: 90 }, { x: 80, y: 90 }],
    ],
  },
  // LETTER F (Vertical stem + 2 horizontal bars)
  {
    id: 'F',
    textToRead: 'F',
    phonicsSound: 'F says fuh as in Fish',
    displayLabel: 'Letter F',
    emoji: '🐟',
    category: 'letter',
    targetAspectRatio: 0.7,
    segments: [
      [{ x: 25, y: 10 }, { x: 25, y: 90 }],
      [{ x: 25, y: 10 }, { x: 80, y: 10 }],
      [{ x: 25, y: 50 }, { x: 70, y: 50 }],
    ],
  },
  // LETTER G (C curve + inner hook)
  {
    id: 'G',
    textToRead: 'G',
    phonicsSound: 'G says guh as in Grapes',
    displayLabel: 'Letter G',
    emoji: '🦒',
    category: 'letter',
    targetAspectRatio: 0.85,
    segments: [
      [{ x: 80, y: 25 }, { x: 50, y: 10 }, { x: 20, y: 40 }, { x: 20, y: 70 }, { x: 50, y: 90 }, { x: 80, y: 90 }, { x: 80, y: 55 }, { x: 55, y: 55 }],
    ],
  },
  // LETTER H (2 vertical legs + horizontal crossbar)
  {
    id: 'H',
    textToRead: 'H',
    phonicsSound: 'H says huh as in Hat',
    displayLabel: 'Letter H',
    emoji: '🎩',
    category: 'letter',
    targetAspectRatio: 0.8,
    segments: [
      [{ x: 20, y: 10 }, { x: 20, y: 90 }],
      [{ x: 80, y: 10 }, { x: 80, y: 90 }],
      [{ x: 20, y: 50 }, { x: 80, y: 50 }],
    ],
  },
  // LETTER I (Vertical stem with top and bottom serifs)
  {
    id: 'I',
    textToRead: 'I',
    phonicsSound: 'I says ih as in Igloo',
    displayLabel: 'Letter I',
    emoji: '🧊',
    category: 'letter',
    targetAspectRatio: 0.4,
    segments: [
      [{ x: 50, y: 10 }, { x: 50, y: 90 }],
      [{ x: 25, y: 10 }, { x: 75, y: 10 }],
      [{ x: 25, y: 90 }, { x: 75, y: 90 }],
    ],
  },
  // LETTER J (With top crossbar + bottom left hook)
  {
    id: 'J',
    textToRead: 'J',
    phonicsSound: 'J says juh as in Juice',
    displayLabel: 'Letter J',
    emoji: '🧃',
    category: 'letter',
    targetAspectRatio: 0.65,
    segments: [
      [{ x: 25, y: 12 }, { x: 85, y: 12 }], // top bar
      [{ x: 65, y: 12 }, { x: 65, y: 75 }, { x: 55, y: 90 }, { x: 30, y: 90 }, { x: 20, y: 75 }], // hook
    ],
  },
  // LETTER J (Variant 2: simple J hook without top bar)
  {
    id: 'J_v2',
    textToRead: 'J',
    phonicsSound: 'J says juh as in Juice',
    displayLabel: 'Letter J',
    emoji: '🧃',
    category: 'letter',
    targetAspectRatio: 0.55,
    segments: [
      [{ x: 65, y: 10 }, { x: 65, y: 75 }, { x: 50, y: 90 }, { x: 25, y: 90 }, { x: 15, y: 75 }],
    ],
  },
  // LETTER K (Vertical stem + 2 diagonal branches)
  {
    id: 'K',
    textToRead: 'K',
    phonicsSound: 'K says kuh as in Kite',
    displayLabel: 'Letter K',
    emoji: '🪁',
    category: 'letter',
    targetAspectRatio: 0.8,
    segments: [
      [{ x: 25, y: 10 }, { x: 25, y: 90 }],
      [{ x: 80, y: 15 }, { x: 25, y: 52 }],
      [{ x: 25, y: 52 }, { x: 80, y: 90 }],
    ],
  },
  // LETTER L (Vertical down + horizontal bottom)
  {
    id: 'L',
    textToRead: 'L',
    phonicsSound: 'L says luh as in Lion',
    displayLabel: 'Letter L',
    emoji: '🦁',
    category: 'letter',
    targetAspectRatio: 0.7,
    segments: [
      [{ x: 25, y: 10 }, { x: 25, y: 90 }, { x: 80, y: 90 }],
    ],
  },
  // LETTER M (4 strokes / 2 peaks)
  {
    id: 'M',
    textToRead: 'M',
    phonicsSound: 'M says mmm as in Monkey',
    displayLabel: 'Letter M',
    emoji: '🐒',
    category: 'letter',
    targetAspectRatio: 1.0,
    segments: [
      [{ x: 15, y: 90 }, { x: 15, y: 10 }, { x: 50, y: 65 }, { x: 85, y: 10 }, { x: 85, y: 90 }],
    ],
  },
  // LETTER N (2 verticals + 1 diagonal)
  {
    id: 'N',
    textToRead: 'N',
    phonicsSound: 'N says nnn as in Nest',
    displayLabel: 'Letter N',
    emoji: '🪺',
    category: 'letter',
    targetAspectRatio: 0.85,
    segments: [
      [{ x: 20, y: 90 }, { x: 20, y: 10 }, { x: 80, y: 90 }, { x: 80, y: 10 }],
    ],
  },
  // LETTER O (Complete circular loop)
  {
    id: 'O',
    textToRead: 'O',
    phonicsSound: 'O says ah as in Octopus',
    displayLabel: 'Letter O',
    emoji: '🐙',
    category: 'letter',
    targetAspectRatio: 0.9,
    segments: [
      [{ x: 50, y: 10 }, { x: 85, y: 35 }, { x: 85, y: 65 }, { x: 50, y: 90 }, { x: 15, y: 65 }, { x: 15, y: 35 }, { x: 50, y: 10 }],
    ],
  },
  // LETTER P (Vertical stem + top loop)
  {
    id: 'P',
    textToRead: 'P',
    phonicsSound: 'P says puh as in Penguin',
    displayLabel: 'Letter P',
    emoji: '🐧',
    category: 'letter',
    targetAspectRatio: 0.7,
    segments: [
      [{ x: 25, y: 10 }, { x: 25, y: 90 }],
      [{ x: 25, y: 10 }, { x: 70, y: 10 }, { x: 85, y: 30 }, { x: 70, y: 50 }, { x: 25, y: 50 }],
    ],
  },
  // LETTER Q (O loop + bottom right diagonal slash)
  {
    id: 'Q',
    textToRead: 'Q',
    phonicsSound: 'Q says kwuh as in Queen',
    displayLabel: 'Letter Q',
    emoji: '👑',
    category: 'letter',
    targetAspectRatio: 0.95,
    segments: [
      [{ x: 50, y: 10 }, { x: 85, y: 35 }, { x: 85, y: 65 }, { x: 50, y: 90 }, { x: 15, y: 65 }, { x: 15, y: 35 }, { x: 50, y: 10 }],
      [{ x: 60, y: 65 }, { x: 90, y: 95 }],
    ],
  },
  // LETTER R (Vertical stem + top loop + bottom diagonal leg)
  {
    id: 'R',
    textToRead: 'R',
    phonicsSound: 'R says rrr as in Rainbow',
    displayLabel: 'Letter R',
    emoji: '🌈',
    category: 'letter',
    targetAspectRatio: 0.75,
    segments: [
      [{ x: 25, y: 10 }, { x: 25, y: 90 }],
      [{ x: 25, y: 10 }, { x: 70, y: 10 }, { x: 85, y: 30 }, { x: 70, y: 50 }, { x: 25, y: 50 }],
      [{ x: 55, y: 50 }, { x: 85, y: 90 }],
    ],
  },
  // LETTER S (Top curve left-to-right, middle diagonal, bottom curve right-to-left)
  {
    id: 'S',
    textToRead: 'S',
    phonicsSound: 'S says sss as in Sun',
    displayLabel: 'Letter S',
    emoji: '☀️',
    category: 'letter',
    targetAspectRatio: 0.7,
    segments: [
      [{ x: 80, y: 25 }, { x: 50, y: 10 }, { x: 20, y: 25 }, { x: 30, y: 45 }, { x: 70, y: 55 }, { x: 80, y: 75 }, { x: 50, y: 90 }, { x: 20, y: 75 }],
    ],
  },
  // LETTER T (Horizontal top bar + center vertical stem)
  {
    id: 'T',
    textToRead: 'T',
    phonicsSound: 'T says tuh as in Tiger',
    displayLabel: 'Letter T',
    emoji: '🐯',
    category: 'letter',
    targetAspectRatio: 0.9,
    segments: [
      [{ x: 10, y: 15 }, { x: 90, y: 15 }], // top bar
      [{ x: 50, y: 15 }, { x: 50, y: 90 }], // stem
    ],
  },
  // LETTER U (Down, smooth bottom curve, up)
  {
    id: 'U',
    textToRead: 'U',
    phonicsSound: 'U says uh as in Umbrella',
    displayLabel: 'Letter U',
    emoji: '☂️',
    category: 'letter',
    targetAspectRatio: 0.8,
    segments: [
      [{ x: 20, y: 10 }, { x: 20, y: 70 }, { x: 50, y: 90 }, { x: 80, y: 70 }, { x: 80, y: 10 }],
    ],
  },
  // LETTER V (2 diagonals meeting at bottom point)
  {
    id: 'V',
    textToRead: 'V',
    phonicsSound: 'V says vvv as in Violin',
    displayLabel: 'Letter V',
    emoji: '🎻',
    category: 'letter',
    targetAspectRatio: 0.8,
    segments: [
      [{ x: 15, y: 10 }, { x: 50, y: 90 }, { x: 85, y: 10 }],
    ],
  },
  // LETTER W (Double V)
  {
    id: 'W',
    textToRead: 'W',
    phonicsSound: 'W says wuh as in Watermelon',
    displayLabel: 'Letter W',
    emoji: '🍉',
    category: 'letter',
    targetAspectRatio: 1.1,
    segments: [
      [{ x: 10, y: 10 }, { x: 30, y: 90 }, { x: 50, y: 35 }, { x: 70, y: 90 }, { x: 90, y: 10 }],
    ],
  },
  // LETTER X (2 crossing diagonals)
  {
    id: 'X',
    textToRead: 'X',
    phonicsSound: 'X says ks as in Xylophone',
    displayLabel: 'Letter X',
    emoji: '🎵',
    category: 'letter',
    targetAspectRatio: 0.85,
    segments: [
      [{ x: 15, y: 15 }, { x: 85, y: 85 }],
      [{ x: 85, y: 15 }, { x: 15, y: 85 }],
    ],
  },
  // LETTER Y (Upper V merging into vertical stem)
  {
    id: 'Y',
    textToRead: 'Y',
    phonicsSound: 'Y says yuh as in Yo-yo',
    displayLabel: 'Letter Y',
    emoji: '🪀',
    category: 'letter',
    targetAspectRatio: 0.8,
    segments: [
      [{ x: 15, y: 10 }, { x: 50, y: 50 }, { x: 85, y: 10 }],
      [{ x: 50, y: 50 }, { x: 50, y: 90 }],
    ],
  },
  // LETTER Z (Top bar, diagonal down-left, bottom bar)
  {
    id: 'Z',
    textToRead: 'Z',
    phonicsSound: 'Z says zzz as in Zebra',
    displayLabel: 'Letter Z',
    emoji: '🦓',
    category: 'letter',
    targetAspectRatio: 0.8,
    segments: [
      [{ x: 15, y: 15 }, { x: 85, y: 15 }, { x: 15, y: 85 }, { x: 85, y: 85 }],
    ],
  },

  // DIGITS (0-9)
  {
    id: '0',
    textToRead: '0',
    phonicsSound: 'Zero means none at all',
    displayLabel: 'Number 0',
    emoji: '0️⃣',
    category: 'number',
    targetAspectRatio: 0.7,
    segments: [
      [{ x: 50, y: 10 }, { x: 80, y: 30 }, { x: 80, y: 70 }, { x: 50, y: 90 }, { x: 20, y: 70 }, { x: 20, y: 30 }, { x: 50, y: 10 }],
    ],
  },
  {
    id: '1',
    textToRead: '1',
    phonicsSound: 'One shiny sun in the sky',
    displayLabel: 'Number 1',
    emoji: '1️⃣',
    category: 'number',
    targetAspectRatio: 0.35,
    segments: [
      [{ x: 30, y: 25 }, { x: 50, y: 10 }, { x: 50, y: 90 }],
      [{ x: 20, y: 90 }, { x: 80, y: 90 }],
    ],
  },
  {
    id: '2',
    textToRead: '2',
    phonicsSound: 'Two happy eyes to see',
    displayLabel: 'Number 2',
    emoji: '2️⃣',
    category: 'number',
    targetAspectRatio: 0.75,
    segments: [
      [{ x: 20, y: 30 }, { x: 50, y: 10 }, { x: 80, y: 30 }, { x: 20, y: 90 }, { x: 80, y: 90 }],
    ],
  },
  {
    id: '3',
    textToRead: '3',
    phonicsSound: 'Three sparkling stars',
    displayLabel: 'Number 3',
    emoji: '3️⃣',
    category: 'number',
    targetAspectRatio: 0.7,
    segments: [
      [{ x: 20, y: 15 }, { x: 75, y: 15 }, { x: 45, y: 48 }, { x: 75, y: 65 }, { x: 50, y: 90 }, { x: 20, y: 80 }],
    ],
  },
  {
    id: '4',
    textToRead: '4',
    phonicsSound: 'Four fast wheels on a car',
    displayLabel: 'Number 4',
    emoji: '4️⃣',
    category: 'number',
    targetAspectRatio: 0.75,
    segments: [
      [{ x: 70, y: 10 }, { x: 20, y: 60 }, { x: 85, y: 60 }],
      [{ x: 70, y: 10 }, { x: 70, y: 90 }],
    ],
  },
  {
    id: '5',
    textToRead: '5',
    phonicsSound: 'Five fingers on each hand',
    displayLabel: 'Number 5',
    emoji: '5️⃣',
    category: 'number',
    targetAspectRatio: 0.75,
    segments: [
      [{ x: 75, y: 15 }, { x: 25, y: 15 }, { x: 20, y: 48 }, { x: 75, y: 52 }, { x: 75, y: 85 }, { x: 20, y: 85 }],
    ],
  },
  {
    id: '6',
    textToRead: '6',
    phonicsSound: 'Six busy legs on a bee',
    displayLabel: 'Number 6',
    emoji: '6️⃣',
    category: 'number',
    targetAspectRatio: 0.75,
    segments: [
      [{ x: 75, y: 20 }, { x: 40, y: 15 }, { x: 20, y: 55 }, { x: 20, y: 85 }, { x: 75, y: 85 }, { x: 75, y: 55 }, { x: 20, y: 55 }],
    ],
  },
  {
    id: '7',
    textToRead: '7',
    phonicsSound: 'Seven colors in a rainbow',
    displayLabel: 'Number 7',
    emoji: '7️⃣',
    category: 'number',
    targetAspectRatio: 0.75,
    segments: [
      [{ x: 15, y: 15 }, { x: 85, y: 15 }, { x: 40, y: 90 }],
    ],
  },
  {
    id: '8',
    textToRead: '8',
    phonicsSound: 'Eight tentacles on an octopus',
    displayLabel: 'Number 8',
    emoji: '8️⃣',
    category: 'number',
    targetAspectRatio: 0.7,
    segments: [
      [{ x: 50, y: 10 }, { x: 80, y: 25 }, { x: 50, y: 50 }, { x: 20, y: 70 }, { x: 50, y: 90 }, { x: 80, y: 70 }, { x: 50, y: 50 }, { x: 20, y: 25 }, { x: 50, y: 10 }],
    ],
  },
  {
    id: '9',
    textToRead: '9',
    phonicsSound: 'Nine colorful balloons in the sky',
    displayLabel: 'Number 9',
    emoji: '9️⃣',
    category: 'number',
    targetAspectRatio: 0.75,
    segments: [
      [{ x: 80, y: 50 }, { x: 25, y: 50 }, { x: 25, y: 15 }, { x: 80, y: 15 }, { x: 80, y: 85 }, { x: 45, y: 90 }],
    ],
  },

  // COMMON DOODLES
  {
    id: 'star',
    textToRead: 'Star',
    phonicsSound: 'Twinkle twinkle little star',
    displayLabel: 'Star',
    emoji: '⭐',
    category: 'drawing',
    targetAspectRatio: 1.0,
    segments: [
      [{ x: 50, y: 10 }, { x: 62, y: 38 }, { x: 92, y: 38 }, { x: 68, y: 58 }, { x: 76, y: 90 }, { x: 50, y: 72 }, { x: 24, y: 90 }, { x: 32, y: 58 }, { x: 8, y: 38 }, { x: 38, y: 38 }, { x: 50, y: 10 }],
    ],
  },
  {
    id: 'heart',
    textToRead: 'Heart',
    phonicsSound: 'A heart of love and friendship',
    displayLabel: 'Heart',
    emoji: '❤️',
    category: 'drawing',
    targetAspectRatio: 1.1,
    segments: [
      [{ x: 50, y: 30 }, { x: 30, y: 10 }, { x: 10, y: 30 }, { x: 50, y: 90 }, { x: 90, y: 30 }, { x: 70, y: 10 }, { x: 50, y: 30 }],
    ],
  },
  {
    id: 'sun',
    textToRead: 'Sun',
    phonicsSound: 'The warm and shining sun',
    displayLabel: 'Sun',
    emoji: '☀️',
    category: 'drawing',
    targetAspectRatio: 1.0,
    segments: [
      [{ x: 50, y: 25 }, { x: 75, y: 50 }, { x: 50, y: 75 }, { x: 25, y: 50 }, { x: 50, y: 25 }],
      [{ x: 50, y: 5 }, { x: 50, y: 20 }],
      [{ x: 50, y: 80 }, { x: 50, y: 95 }],
      [{ x: 5, y: 50 }, { x: 20, y: 50 }],
      [{ x: 80, y: 50 }, { x: 95, y: 50 }],
    ],
  },
  {
    id: 'tree',
    textToRead: 'Tree',
    phonicsSound: 'A tall green leafy tree',
    displayLabel: 'Tree',
    emoji: '🌳',
    category: 'drawing',
    targetAspectRatio: 0.85,
    segments: [
      [{ x: 40, y: 65 }, { x: 40, y: 95 }, { x: 60, y: 95 }, { x: 60, y: 65 }], // trunk
      [{ x: 50, y: 10 }, { x: 85, y: 40 }, { x: 70, y: 65 }, { x: 30, y: 65 }, { x: 15, y: 40 }, { x: 50, y: 10 }], // foliage
    ],
  },
  {
    id: 'cat',
    textToRead: 'Cat',
    phonicsSound: 'A furry cat that says meow',
    displayLabel: 'Cat',
    emoji: '🐱',
    category: 'drawing',
    targetAspectRatio: 1.0,
    segments: [
      [{ x: 20, y: 40 }, { x: 80, y: 40 }, { x: 80, y: 85 }, { x: 20, y: 85 }, { x: 20, y: 40 }], // head
      [{ x: 25, y: 40 }, { x: 20, y: 15 }, { x: 45, y: 35 }], // left ear
      [{ x: 75, y: 40 }, { x: 80, y: 15 }, { x: 55, y: 35 }], // right ear
    ],
  },
  {
    id: 'car',
    textToRead: 'Car',
    phonicsSound: 'A car with four wheels that goes vroom',
    displayLabel: 'Car',
    emoji: '🚗',
    category: 'drawing',
    targetAspectRatio: 1.8,
    segments: [
      [{ x: 10, y: 60 }, { x: 90, y: 60 }, { x: 85, y: 40 }, { x: 65, y: 25 }, { x: 35, y: 25 }, { x: 20, y: 40 }, { x: 10, y: 60 }],
      [{ x: 25, y: 65 }, { x: 35, y: 65 }, { x: 35, y: 75 }, { x: 25, y: 75 }, { x: 25, y: 65 }], // wheel 1
      [{ x: 65, y: 65 }, { x: 75, y: 65 }, { x: 75, y: 75 }, { x: 65, y: 75 }, { x: 65, y: 65 }], // wheel 2
    ],
  },
  {
    id: 'house',
    textToRead: 'House',
    phonicsSound: 'A cozy house with walls and a roof',
    displayLabel: 'House',
    emoji: '🏠',
    category: 'drawing',
    targetAspectRatio: 0.9,
    segments: [
      [{ x: 20, y: 50 }, { x: 80, y: 50 }, { x: 80, y: 90 }, { x: 20, y: 90 }, { x: 20, y: 50 }], // box
      [{ x: 15, y: 50 }, { x: 50, y: 15 }, { x: 85, y: 50 }], // roof
    ],
  },
];

// Pre-compiled normalized template point clouds
const TEMPLATES: Template[] = RAW_TEMPLATES.map(t => ({
  id: t.id,
  textToRead: t.textToRead,
  phonicsSound: t.phonicsSound,
  displayLabel: t.displayLabel,
  emoji: t.emoji,
  category: t.category,
  targetAspectRatio: t.targetAspectRatio,
  points: generateTemplatePoints(t.segments, NUM_POINTS),
}));

export class PointCloudRecognizer {
  /**
   * Classify user drawn strokes using the $P point cloud algorithm
   */
  public static recognize(strokes: Stroke[]): RecognizedMatch {
    if (strokes.length === 0) {
      return {
        id: 'empty',
        textToRead: 'Slate is clean',
        phonicsSound: '',
        displayLabel: 'Empty Slate',
        emoji: '📝',
        category: 'drawing',
        score: 0,
        alternatives: [],
      };
    }

    // Combine all points from all strokes
    const rawPoints: Point[] = [];
    for (const s of strokes) {
      for (const p of s.points) {
        rawPoints.push(p);
      }
    }

    if (rawPoints.length < 4) {
      return {
        id: 'dot',
        textToRead: 'Dot',
        phonicsSound: 'A tiny dot',
        displayLabel: 'Dot',
        emoji: '✨',
        category: 'drawing',
        score: 0.1,
        alternatives: [],
      };
    }

    // Resample user points to NUM_POINTS
    const userResampled = resamplePoints(rawPoints, NUM_POINTS);
    // Normalize user point cloud
    const { points: userNormPoints, aspectRatio: userAspect } = normalizePointCloud(userResampled);

    // Rank all templates by distance
    const ranked: Array<{ template: Template; distance: number }> = [];

    for (const t of TEMPLATES) {
      const dist = pointCloudDistance(userNormPoints, t.points);

      // Aspect ratio penalty factor (penalize if aspect ratio is drastically different)
      const aspectDiff = Math.abs(Math.log(userAspect / t.targetAspectRatio));
      const penalty = 1.0 + Math.min(1.2, aspectDiff * 0.45);
      const totalScore = dist * penalty;

      ranked.push({ template: t, distance: totalScore });
    }

    ranked.sort((a, b) => a.distance - b.distance);
    const bestTemplate = ranked[0].template;
    const minDistance = ranked[0].distance;

    // Collect top distinct alternative matches
    const seen = new Set<string>([bestTemplate.textToRead]);
    const alternatives: Array<{ textToRead: string; displayLabel: string; emoji: string; phonicsSound: string }> = [];

    for (let i = 1; i < ranked.length; i++) {
      const alt = ranked[i].template;
      if (!seen.has(alt.textToRead)) {
        seen.add(alt.textToRead);
        alternatives.push({
          textToRead: alt.textToRead,
          displayLabel: alt.displayLabel,
          emoji: alt.emoji,
          phonicsSound: alt.phonicsSound,
        });
      }
      if (alternatives.length >= 3) break;
    }

    // Convert distance to 0..1 confidence score
    const confidence = Math.max(0.1, Math.min(1.0, 1.0 - minDistance * 1.8));

    return {
      id: bestTemplate.id,
      textToRead: bestTemplate.textToRead,
      phonicsSound: bestTemplate.phonicsSound,
      displayLabel: bestTemplate.displayLabel,
      emoji: bestTemplate.emoji,
      category: bestTemplate.category,
      score: confidence,
      alternatives,
    };
  }
}
