import React, { useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { View, StyleSheet, PanResponder, GestureResponderEvent, LayoutChangeEvent, Platform } from 'react-native';
import Svg, { Path, Defs, Pattern, Rect, Line, Circle } from 'react-native-svg';
import { Stroke, Point } from '../types';
import { speechService } from '../services/speechService';

export interface DrawingCanvasRef {
  getCanvasImageBase64: () => string | null;
  getDimensions: () => { width: number; height: number };
}

interface DrawingCanvasProps {
  currentColor: string;
  strokeWidth: number;
  strokes: Stroke[];
  onStrokesChange: (strokes: Stroke[]) => void;
  onStrokeEnd?: () => void;
}

export const DrawingCanvas = forwardRef<DrawingCanvasRef, DrawingCanvasProps>(({
  currentColor,
  strokeWidth,
  strokes,
  onStrokesChange,
  onStrokeEnd,
}, ref) => {
  const [currentStroke, setCurrentStroke] = useState<Point[] | null>(null);
  const [canvasDimensions, setCanvasDimensions] = useState<{ width: number; height: number }>({
    width: 360,
    height: 400,
  });

  const strokesRef = useRef<Stroke[]>(strokes);
  strokesRef.current = strokes;

  const currentStrokeRef = useRef<Point[] | null>(null);
  currentStrokeRef.current = currentStroke;

  const dimensionsRef = useRef(canvasDimensions);
  dimensionsRef.current = canvasDimensions;

  // Convert strokes into base64 PNG data URL (Web Canvas)
  useImperativeHandle(ref, () => ({
    getDimensions: () => dimensionsRef.current,
    getCanvasImageBase64: () => {
      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        try {
          const { width, height } = dimensionsRef.current;
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return null;

          // Crisp white background
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);

          // Render each stroke with smooth lines
          strokesRef.current.forEach((stroke) => {
            if (stroke.points.length === 0) return;
            ctx.strokeStyle = stroke.color;
            ctx.lineWidth = stroke.width;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            ctx.beginPath();
            if (stroke.points.length === 1) {
              ctx.arc(stroke.points[0].x, stroke.points[0].y, stroke.width / 2, 0, Math.PI * 2);
              ctx.fillStyle = stroke.color;
              ctx.fill();
            } else {
              ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
              for (let i = 1; i < stroke.points.length - 1; i++) {
                const xc = (stroke.points[i].x + stroke.points[i + 1].x) / 2;
                const yc = (stroke.points[i].y + stroke.points[i + 1].y) / 2;
                ctx.quadraticCurveTo(stroke.points[i].x, stroke.points[i].y, xc, yc);
              }
              ctx.lineTo(
                stroke.points[stroke.points.length - 1].x,
                stroke.points[stroke.points.length - 1].y
              );
              ctx.stroke();
            }
          });

          return canvas.toDataURL('image/png');
        } catch (err) {
          console.warn('Canvas rasterization error:', err);
          return null;
        }
      }
      return null;
    },
  }));

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width > 0 && height > 0) {
      setCanvasDimensions({ width, height });
    }
  };

  const getCanvasPoint = (e: GestureResponderEvent): Point => {
    const { locationX, locationY } = e.nativeEvent;
    return { x: locationX, y: locationY };
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => {
        speechService.resumeAudioContext();
        return true;
      },
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        speechService.resumeAudioContext();
        const pt = getCanvasPoint(e);
        setCurrentStroke([pt]);
      },
      onPanResponderMove: (e) => {
        const pt = getCanvasPoint(e);
        setCurrentStroke(prev => (prev ? [...prev, pt] : [pt]));
      },
      onPanResponderRelease: () => {
        if (currentStrokeRef.current && currentStrokeRef.current.length > 0) {
          const finishedStroke: Stroke = {
            id: Date.now().toString() + Math.random().toString(36).substring(2, 6),
            points: currentStrokeRef.current,
            color: currentColor,
            width: strokeWidth,
          };
          const updated = [...strokesRef.current, finishedStroke];
          onStrokesChange(updated);
          setCurrentStroke(null);
          onStrokeEnd?.();
        }
      },
    })
  ).current;

  // Convert array of Points into smooth SVG Path string
  const pointsToSvgPath = (points: Point[]): string => {
    if (points.length === 0) return '';
    if (points.length === 1) {
      return `M ${points[0].x} ${points[0].y} L ${points[0].x + 0.1} ${points[0].y + 0.1}`;
    }

    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length - 1; i++) {
      const xc = (points[i].x + points[i + 1].x) / 2;
      const yc = (points[i].y + points[i + 1].y) / 2;
      d += ` Q ${points[i].x} ${points[i].y}, ${xc} ${yc}`;
    }
    d += ` L ${points[points.length - 1].x} ${points[points.length - 1].y}`;
    return d;
  };

  return (
    <View
      style={styles.container}
      onLayout={handleLayout}
      {...panResponder.panHandlers}
    >
      <Svg
        width={canvasDimensions.width}
        height={canvasDimensions.height}
        style={StyleSheet.absoluteFill}
      >
        <Defs>
          {/* Faint notebook dot grid */}
          <Pattern
            id="dotGrid"
            width={24}
            height={24}
            patternUnits="userSpaceOnUse"
          >
            <Circle cx={12} cy={12} r={1.2} fill="#E2E8F0" />
          </Pattern>
        </Defs>

        {/* Paper Background with subtle dot grid */}
        <Rect
          width={canvasDimensions.width}
          height={canvasDimensions.height}
          fill="url(#dotGrid)"
        />

        {/* COMPLETED DRAWN STROKES */}
        {strokes.map((stroke) => (
          <Path
            key={stroke.id}
            d={pointsToSvgPath(stroke.points)}
            stroke={stroke.color}
            strokeWidth={stroke.width}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        ))}

        {/* ACTIVE STROKE UNDER FINGER/PEN */}
        {currentStroke && currentStroke.length > 0 && (
          <Path
            d={pointsToSvgPath(currentStroke)}
            stroke={currentColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        )}
      </Svg>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
});
