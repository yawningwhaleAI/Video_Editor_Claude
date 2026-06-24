---
name: reel-animator
description: Full HyperFrames reel production skill — takes a raw face-cam video and produces a polished Instagram reel with accurate captions, premium animations, and mixed audio. Synthesizes /srt (caption accuracy), /new-series (scene illustration design), and /reel-overlay (visual palette and layout principles). Invoke when building or upgrading any HyperFrames composition for an Instagram reel.
---

# /reel-animator — Full Reel Production Skill

Combines the best of `/srt`, `/new-series`, and `/reel-overlay` into a single HyperFrames-native workflow. Covers captions, scene animation, audio mixing, and design system.

---

## STEP 1 — Transcribe and generate SRT

Before writing a single caption span, generate accurate word-timed captions from the actual video audio.

```bash
# Extract audio from face cam
ffmpeg -i media/facecam.mp4 -vn -acodec pcm_s16le -ar 16000 -ac 1 /tmp/audio.wav

# Transcribe with Whisper (requires openai package + OPENAI_API_KEY)
# OR use /produce skill which runs Whisper per-chunk
```

Once you have an SRT file, run `/srt` on it to clean spelling and punctuation. The output `Updated_<filename>.srt` is the source of truth for all captions.

### SRT → HyperFrames Caption Format

Convert each SRT block into a `<div class="clip caption-clip">` element:

```
SRT block:
  1
  00:00:00,300 --> 00:00:05,000
  these three moves took me from zero to five k a month

Becomes:
  <div id="cap-1" class="clip caption-clip"
       data-start="0.3" data-duration="4.7" data-track-index="3">
    <div class="cap-pill">
      <span class="w">these</span> <span class="w">three</span> <span class="w">moves</span>
      <span class="w">took</span> <span class="w">me</span> <span class="w">from</span>
      <span class="w">zero</span> <span class="w">to</span>
      <span class="cap-rust w">$5K</span>
      <span class="w">a</span> <span class="w">month</span>
    </div>
  </div>
```

Rules:
- `data-start` = SRT start time in seconds (e.g. `00:00:05,200` → `5.2`)
- `data-duration` = end minus start
- Every word gets `class="w"` so GSAP stagger works
- Key nouns/numbers/dollars get an accent color class (`cap-rust`, `cap-gold`, `cap-teal`)
- Max 12 words per caption block — split long SRT blocks into two
- Track 3 is always captions; captions on the same track must not overlap

### GSAP word stagger (add to timeline for each caption)
```javascript
[["#cap-1", 0.3], ["#cap-2", 5.2], /* ... */].forEach(([id, t]) => {
  tl.from(`${id} .w`, {
    y: 24, opacity: 0,
    duration: 0.28,
    ease: "power3.out",
    stagger: 0.07,
  }, t);
});
```

---

## STEP 2 — Design System (from /reel-overlay palette rules)

Every reel uses a locked color palette. Never mix palettes mid-reel.

### Beige/Terracotta palette (default — matches Claude chat)
```css
--bg:       #F3EEE3;   /* page background */
--surface:  #FBF8F1;   /* scene card / illustration bg */
--surface-2:#EAE1D1;   /* subtle fill */
--ink:      #2A2520;   /* primary text */
--ink-soft: #6E6253;   /* secondary text / caption body */
--line:     #CDBEA3;   /* borders, dividers */
--rust:     #C2603F;   /* primary accent (method 01, keywords) */
--teal:     #3F6B63;   /* secondary accent (method 02) */
--gold:     #D9A441;   /* tertiary accent (method 03 / CTA) */
```

### Caption pill (light style — readable over both halves)
```css
.cap-pill {
  background: rgba(250, 246, 238, 0.95);
  border: 2px solid rgba(205, 190, 163, 0.75);
  color: #6E6253;                          /* ink-soft */
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 46px;
  font-weight: 800;
  padding: 22px 36px;
  border-radius: 26px;
  box-shadow: 0 12px 36px rgba(0,0,0,0.13);
}
.cap-pill .w { display: inline-block; }
.cap-rust  { color: #C2603F; }
.cap-gold  { color: #D9A441; }
.cap-teal  { color: #3F6B63; }
```

### Font stack (local woff2 only — no CDN in HyperFrames)
```css
@font-face {
  font-family: 'Bricolage Grotesque';
  src: url('fonts/BricolageGrotesque-Bold.woff2') format('woff2');
  font-weight: 700 800;
}
/* Use for .head (headlines) */

@font-face {
  font-family: 'Inter';
  src: url('fonts/Inter-Regular.woff2') format('woff2');
  font-weight: 400;
}
@font-face {
  font-family: 'Inter';
  src: url('fonts/Inter-Bold.woff2') format('woff2');
  font-weight: 600 900;
}
/* Use for .support, .kicker, captions */
```

Download Bricolage Grotesque via PowerShell (one-time setup):
```powershell
$ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36"
$css = (Invoke-WebRequest -Uri "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&display=swap" -Headers @{"User-Agent"=$ua} -UseBasicParsing).Content
$url = [regex]::Match($css, "url\((https://fonts\.gstatic\.com/[^)]+\.woff2)\)").Groups[1].Value
Invoke-WebRequest -Uri $url -OutFile "projects/<reel>/fonts/BricolageGrotesque-Bold.woff2"
```

---

## STEP 3 — Scene Layout (from /new-series illustration rules)

Every scene in the top half follows this structure:

```
┌─────────────────────────────────┐  y=0
│  index-num (top-right)          │
│                                 │
│  kicker                         │  y≈120
│  headline (Bricolage Grotesque) │  y≈200
│  support text                   │  y≈400
│                                 │
│  SVG Illustration               │  y≈500
│                                 │
├─────────────────────────────────┤  y=842
│  CAPTION PILL (straddles seam)  │  y=842–960
├─────────────────────────────────┤  y=957 ← divider
│  FACE CAM                       │  y=963–1920
└─────────────────────────────────┘  y=1920
```

### Scene illustration types (pick one per scene)
| Scene type       | Illustration | SVG elements |
|-----------------|--------------|--------------|
| Growth / revenue | Bar chart    | `<rect>` bars + trend line `<path>` |
| Conversation     | Chat bubbles | `<path>` rounded bubbles |
| Giving value     | Gift box     | Stacked `<rect>` + `<path>` bow |
| Content / broadcast | Megaphone + cards | `<path>` horn + `<g>` cards |
| CTA / action     | Comment bubble | `<path>` + `<text>` |

### Scene CSS
```css
.top-scene {
  position: absolute; top: 0; left: 0;
  width: 1080px; height: 960px;
  background: var(--bg); overflow: hidden;
}
.scene-inner {
  position: relative; z-index: 3;
  width: 100%; height: 100%;
  display: flex; flex-direction: column;
  align-items: flex-start; justify-content: center;
  padding: 70px 78px 180px; gap: 16px;
}
.scene-frame {
  position: absolute; inset: 18px;
  border: 2px solid rgba(194,96,63,0.12);
  border-radius: 20px; pointer-events: none; z-index: 2;
}
```

---

## STEP 4 — Animation System (GSAP Premium Patterns)

### A. Zoom Punch — every headline enters from oversized
```javascript
// Scale 1.45 → 1: reads as "zooming into focus"
tl.from("#headline", { scale: 1.45, opacity: 0, duration: 0.48, ease: "back.out(2.5)" }, t);
```
Never use `scale: 0 → 1` for hero text — that reads as a pop, not a zoom.

### B. Ken Burns — continuous 6% scale on .scene-inner
```javascript
// Apply to every scene for hold duration
tl.to("#scene-X .scene-inner", {
  scale: 1.06, transformOrigin: "50% 50%",
  duration: holdDuration, ease: "sine.inOut"
}, sceneStart);
```
**Always target `.scene-inner`, not `.clip`** — `.top-scene` has `overflow: hidden` which clips the 6% expansion correctly. Targeting `.clip` causes layout overflow visible outside the top half.

### C. 3D Badge Flip — method numbers
```javascript
tl.from("#kicker .num", {
  rotationY: 90, transformPerspective: 800,
  opacity: 0, duration: 0.42, ease: "power3.out"
}, t + 0.1);
```

### D. The 4 Transition Library

| Name | When | GSAP |
|------|------|------|
| Cinematic Push | Hook exit (scene 1 → 2) | `{ scale: 1.18, opacity: 0, duration: 0.4, ease: "power2.in" }` |
| White Flash Cut | High-energy scene change | Flash overlay 0→0.85→0 + scene fade |
| Scale-Down Tilt | Mid-reel scene exit | `{ scale: 0.86, opacity: 0, rotation: -2, duration: 0.38 }` |
| Scale Burst | Pre-CTA scene exit | `{ scale: 1.2, opacity: 0, duration: 0.38, ease: "power2.in" }` |

Always add a hard-kill `tl.set()` after every exit tween — required to pass lint:
```javascript
tl.to("#scene-X", { scale: 1.2, opacity: 0, duration: 0.38 }, exitTime);
tl.set("#scene-X", { opacity: 0 }, exitTime + 0.38);  // hard kill
```

### E. SVG Illustration Animations
```javascript
// Bar chart: scaleY from bottom
tl.from("#bar-1", { scaleY: 0, transformOrigin: "bottom", opacity: 0, duration: 0.45, ease: "back.out(1.6)" }, t + 0.55);

// Chat bubbles: slide from opposing sides
tl.from("#bubble-in",  { x: -70, opacity: 0, duration: 0.48, ease: SLAM }, t + 0.6);
tl.from("#bubble-out", { x: 70,  opacity: 0, duration: 0.48, ease: SLAM }, t + 0.95);

// Gift box: reveal bottom-to-top
tl.from("#box-base", { scaleY: 0, transformOrigin: "bottom", opacity: 0, duration: 0.4, ease: "back.out(1.5)" }, t + 0.55);
tl.from("#bow-l, #bow-r", { scale: 0, transformOrigin: "150px 96px", opacity: 0, duration: 0.38, ease: "back.out(2.5)", stagger: 0.15 }, t + 0.9);

// Megaphone: slide in + cards pop
tl.from("#horn", { x: -60, opacity: 0, duration: 0.5, ease: SLAM }, t + 0.55);
tl.from("#card-1, #card-2, #card-3", { scale: 0, opacity: 0, transformOrigin: "center", duration: 0.4, ease: "back.out(2)", stagger: 0.18 }, t + 0.9);
```

### F. Heartbeat Pulse — hold attention mid-scene
```javascript
// Fires once during the scene hold, makes a key element breathe
tl.to("#key-element", { scale: 1.06, transformOrigin: "50% 50%", duration: 0.3, yoyo: true, repeat: 1 }, midSceneTime);
```

---

## STEP 5 — Audio Setup

### Video audio (face cam)
The face cam MUST have BOTH attributes for audio to be mixed into the render:
```html
<video id="facecam" class="clip"
       data-start="0" data-duration="42.7" data-track-index="1"
       data-has-audio="true" data-volume="1.0"
       src="media/facecam.mp4">
</video>
```
- `data-has-audio="true"` — tells HyperFrames the video has an audio track (suppresses `video_missing_muted` lint error)
- `data-volume="1.0"` — tells the audio mixer what level to use (required for actual mixing)
- **In browser preview**: audio is muted by browser autoplay policy — this is expected. Audio only plays in the rendered MP4.

### SFX audio (transitions, impacts, ticks)
```html
<!-- Use separate tracks so same-track clips don't overlap -->
<!-- Track 4: whoosh at scene transitions -->
<audio id="sfx-w1" class="clip" data-start="4.65" data-duration="1.2"
       data-track-index="4" data-volume="0.6" src="sfx/whoosh.wav"></audio>

<!-- Track 5: slam on headline entries -->
<audio id="sfx-s1" class="clip" data-start="5.3" data-duration="0.4"
       data-track-index="5" data-volume="0.35" src="sfx/slam.mp3"></audio>

<!-- Track 6: tick on caption entries -->
<audio id="sfx-t1" class="clip" data-start="5.2" data-duration="0.12"
       data-track-index="6" data-volume="0.25" src="sfx/tick.mp3"></audio>
```

### SFX timing rules (from /reel-overlay)
| SFX type | When to fire | Volume |
|----------|-------------|--------|
| Whoosh   | 0.35s before scene end | 0.55–0.65 |
| Slam/impact | 0.1s after headline tween starts | 0.30–0.45 |
| Tick     | Same time as caption entry | 0.20–0.28 |

Generate synthetic SFX placeholders with ffmpeg (use until real files are sourced):
```bash
# Whoosh: swept sine 100Hz→2000Hz
ffmpeg -f lavfi -i "aevalsrc=sin(2*PI*(100+1900*t/0.7)*t)*exp(-t*3):s=44100:d=0.7" -c:a libmp3lame -q:a 4 sfx/whoosh.mp3

# Slam: bass thud
ffmpeg -f lavfi -i "aevalsrc=sin(2*PI*60*t)*exp(-t*8):s=44100:d=0.4" -c:a libmp3lame -q:a 4 sfx/slam.mp3
```
For real SFX, use `mixkit-arrow-whoosh-1491.wav` (already in project) for transitions.

---

## STEP 6 — Divider and Grain

### Shimmer divider (terracotta/gold palette)
```css
@keyframes hf-shimmer {
  0%   { background-position: -1080px 0; }
  100% { background-position: 2160px 0; }
}
#divider {
  position: absolute; top: 957px; left: 0;
  width: 1080px; height: 6px;
  background: linear-gradient(90deg,
    #3F6B63 0%, #D9A441 30%,
    rgba(255,255,255,0.9) 50%,
    #D9A441 70%, #C2603F 100%);
  background-size: 3240px 6px;
  animation: hf-shimmer 3s linear infinite;
  box-shadow: 0 0 14px rgba(217,164,65,0.5), 0 0 4px rgba(194,96,63,0.35);
  z-index: 50;
}
```

### Film grain (baked SVG, no external dependency)
```html
<div id="grain-overlay" style="position:absolute;top:0;left:0;width:1080px;height:960px;pointer-events:none;z-index:45;">
  <div class="grain-texture"></div>
</div>
```
```css
@keyframes hf-grain-noise {
  0%,100%{ transform:translate(0,0) }
  10%    { transform:translate(-5%,-5%) }
  30%    { transform:translate(5%,-10%) }
  50%    { transform:translate(-10%,5%) }
  70%    { transform:translate(0,10%) }
  90%    { transform:translate(10%,5%) }
}
#grain-overlay .grain-texture {
  position:absolute; top:-50%; left:-50%;
  width:200%; height:200%;
  background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  opacity:0.07; mix-blend-mode:overlay;
  animation:hf-grain-noise 0.5s steps(1) infinite;
}
```

---

## STEP 7 — Flash Overlay (white cut)

```html
<div id="flash-overlay" style="position:absolute;top:0;left:0;width:1080px;height:960px;background:#FBF8F1;opacity:0;pointer-events:none;z-index:300;"></div>
```

```javascript
// White Flash Cut pattern — use at high-energy scene changes
const flashExit = (exitTime) => {
  tl.to("#flash-overlay", { opacity: 0.85, duration: 0.15, ease: "power1.in" }, exitTime);
  tl.to("#scene-X",       { opacity: 0,    duration: 0.15, ease: "power1.in" }, exitTime);
  tl.to("#flash-overlay", { opacity: 0,    duration: 0.22, ease: "power2.out" }, exitTime + 0.15);
  tl.set("#flash-overlay", { opacity: 0 }, exitTime + 0.38);  // hard kill
  tl.set("#scene-X",       { opacity: 0 }, exitTime + 0.38);  // hard kill
};
```

---

## STEP 8 — HyperFrames Registration

The last thing in every `<script>` block — required or render fails:

```javascript
window.__timelines = window.__timelines || {};
window.__timelines["<composition-id>"] = tl;
```

The `<composition-id>` must match the `data-composition-id` attribute on `#stage`.

---

## STEP 9 — Lint + Render

```bash
# From inside the project folder
npx hyperframes lint          # Must show 0 errors before render

npx hyperframes preview       # Browser preview at http://localhost:3002
                              # NOTE: audio is muted in preview (browser policy)
                              #       test audio by rendering

npx hyperframes render        # Export MP4 to renders/<name>_<date>.mp4
```

---

## Common Lint Errors and Fixes

| Error | Fix |
|-------|-----|
| `missing_timeline_registry` | Add `window.__timelines["id"] = tl;` — must be object, not array |
| `gsap_timeline_not_registered` | Same as above |
| `video_missing_muted` | Add `data-has-audio="true"` (for audible video) or `muted playsinline` (for silent video) |
| `gsap_exit_missing_hard_kill` | Add `tl.set("#scene-X", { opacity: 0 }, exitTime + duration)` after every exit tween |
| `google_fonts_import` | Download woff2 locally; use `@font-face` with `url('fonts/...')` |
| `font_family_without_font_face` | Use literal font name in `font-family:`, not CSS var (`var(--font-x)`) |
| `overlapping_tweens` | Use `fromTo()` instead of separate `from()` + `to()` on same element at same time |

---

## The Premium Reel Formula

Per-beat sequence for each scene:

```
1. Scene enters          → from({ x/y/scale, opacity: 0 })         0.0s
2. Ken Burns starts      → to(.scene-inner, { scale: 1.06 })        0.0s (runs full hold)
3. Index num             → from({ opacity: 0, x: 20 })              +0.1s
4. Kicker label          → from({ opacity: 0, x: -24 })             +0.05s
5. Kicker badge 3D flip  → from({ rotationY: 90, perspect: 800 })   +0.15s
6. Headline ZOOM PUNCH   → from({ scale: 1.45, opacity: 0 })        +0.3s
7. Support text          → from({ opacity: 0, y: 22 })              +0.7s
8. Illustration stagger  → from({ scale/x/y, opacity: 0, stagger }) +0.55s
9. Caption words         → from({ y: 24, opacity: 0, stagger: 0.07 }) same time as caption data-start
10. Mid-scene pulse      → to(keyElement, { scale: 1.06, yoyo: true, repeat: 1 }) @ 60% hold
11. Scene exits          → one of the 4 transition patterns          end - 0.35s
12. Hard kill            → set({ opacity: 0 })                       at exit end
```
