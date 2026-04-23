# Screenity — Fork by Sivasooryagiri

This is a fork of [Screenity](https://github.com/alyssaxuu/screenity) by Alyssa X, licensed under GPLv3.
All additions in this fork are also released under GPLv3.

---

## What we're building

A fully open-source version of Screenity with all Pro features built in — no subscriptions, no server, everything runs locally in your browser.

---

## Features added so far

### Zoom Keyframes Editor
> Added on top of the original Screenity editor

**What it does:**
- Place zoom keyframes at any point on the video timeline
- Drag markers to reposition them
- Select a keyframe to control:
  - Zoom level (1× – 4×)
  - Origin X / Origin Y (where the zoom focuses)
- Smooth 60fps zoom during playback via `requestAnimationFrame` — no jitter
- Ease-in-out interpolation between keyframes for cinematic transitions
- Blue gradient fill segments between keyframes visualize zoom intensity
- Delete keyframes with the Delete key or the Delete button
- "Clear all" to reset

**How to use:**
1. Open the editor (record something, then open the sandbox editor)
2. Click the **🔎 Zoom** tab in the bottom panel
3. Click anywhere on the dark timeline track to drop a keyframe
4. Use the sliders to set the zoom level and focus point
5. Add more keyframes for zoom in/out sequences
6. Play the video — zoom applies live and smoothly

**Files changed:**
- `src/pages/Sandbox/components/editor/ZoomTimeline.jsx` *(new)*
- `src/pages/Sandbox/styles/edit/_ZoomTimeline.module.scss` *(new)*
- `src/pages/Sandbox/components/editor/VideoPlayer.jsx`
- `src/pages/Sandbox/context/ContentState.jsx`
- `src/pages/Sandbox/layout/editor/TrimUI.js`
- `src/pages/Sandbox/styles/edit/_TrimUI.module.scss`

---

## Planned features

- [ ] Local captions (Whisper WASM — no server, runs in browser)
- [ ] Multi-scene recording
- [ ] Zoom keyframe export (bake zoom into final video via WebCodecs)
- [ ] Enhanced trim/cut UI
- [ ] YouTube-ready export presets

---

## How to run locally

```bash
git clone https://github.com/sivasooryagiri/screenity.git
cd screenity
npm install
npm run build
```

Then in Chrome:
1. Go to `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked** → select the `build/` folder

After code changes, run `npm run build` and click the refresh icon on the extension card.

---

## License

GPLv3 — see [LICENSE](./LICENSE)

Original work © Alyssa X  
Fork additions © Sivasooryagiri
