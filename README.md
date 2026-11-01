# 📝 DoodlePad — Kids Sketch & Speak Notepad

An interactive sketching notepad built with **React Native** and **Expo**. Users and children can draw **anything they wish** (animals, objects, vehicles, nature, characters, letters, or doodles). The pad identifies the sketch and **speaks an audio explanation of the word**, spelling, and fun facts in a warm, child-friendly human voice.

---

## 🌟 How It Works

1. **Draw Anything**: Open sketch pad with finger or stylus support. Choose from rich color palette, eraser, brush sizes, and undo.
2. **Tap "Explain My Drawing" (🪄)**:
   - The sketch is analyzed using **Gemini Vision AI** (for open-vocabulary recognition) or the **built-in smart sketch dictionary** when offline.
3. **Listen to the Audio Explanation**:
   - The pad announces the word: *"That's a Cat!"*
   - Speaks the phonics / spelling: *"C - A - T"*
   - Speaks the child-friendly explanation: *"A cat is a curious furry pet with whiskers that purrs when happy! Meow!"*
   - Displays fun facts and cheerful emojis on the explanation card.

---

## 🔊 Audio Engine Features

- **Warm Human Voice**: Anchored to natural human vocal pitch (`1.0`) to avoid robotic, metallic phase distortion.
- **Organic Acoustic Sound Effects**: Wooden marimba chimes, kalimba sparkles, and soft liquid taps with low-pass filtering.
- **Adjustable Speed**: Turtle 🐢 (slow, crisp phonics) or Rabbit 🐰 (normal conversation speed).

---

## 🚀 Running the App

```bash
# Start dev server
npm start

# Run in Web browser (iPad / Tablet / Desktop)
npm run web

# Run on iOS Simulator / Device
npm run ios

# Run on Android Emulator / Device
npm run android
```

---

## ⚙️ AI Vision (Optional)

By default, DoodlePad includes an offline sketch dictionary for common drawings (Cat, Dog, Sun, Star, Tree, House, Car, Apple, Heart, Fish, Moon, etc.).

To enable recognition of **ANY** sketch, enter your Google Gemini API key in the in-app **Settings (⚙️)** or set the environment variable:
```bash
EXPO_PUBLIC_GEMINI_API_KEY="your-gemini-api-key"
```
