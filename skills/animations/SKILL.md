# Animation Effects Reference

Complete library of named animation effects for HyperFrames + GSAP reel production.
Invoke this skill whenever building or upgrading animations.

---

## 1. ENTRY EFFECTS (how elements appear)

### Zoom Punch
Element starts oversized, snaps to normal. Best for headlines.
```js
tl.from("#el", { scale: 1.45, opacity: 0, duration: 0.55, ease: "back.out(2.5)" }, t)
```

### Slam Up
Slides in fast from below. Best for cards, pills, CTAs.
```js
tl.from("#el", { y: 80, opacity: 0, duration: 0.45, ease: "cubic-bezier(0.22,1,0.36,1)" }, t)
```

### Slam Left / Slam Right
Slides in from the side. Best for skill cards, list items.
```js
tl.from("#el", { x: -80, opacity: 0, duration: 0.45, ease: "cubic-bezier(0.22,1,0.36,1)" }, t)
// or x: 80 for right
```

### 3D Flip
Element flips in on Y axis. Best for badges, number chips, icons.
```js
tl.from("#el", { rotationY: 90, transformPerspective: 800, opacity: 0, duration: 0.42, ease: "power3.out" }, t)
```

### Pop
Scales from 0 with spring. Best for icons, emojis, checkmarks.
```js
tl.from("#el", { scale: 0, opacity: 0, transformOrigin: "center", duration: 0.4, ease: "back.out(3)" }, t)
```

### Drop In
Falls from above with gravity feel.
```js
tl.from("#el", { y: -60, opacity: 0, duration: 0.45, ease: "bounce.out" }, t)
```

### Fade Rise
Subtle fade + slight upward drift. Best for supporting text.
```js
tl.from("#el", { y: 22, opacity: 0, duration: 0.38, ease: "power2.out" }, t)
```

### Stretch In (Horizontal)
Scales from width 0. Best for dividers, underlines, progress bars.
```js
tl.from("#el", { scaleX: 0, transformOrigin: "left center", duration: 0.6, ease: "power3.out" }, t)
```

### Stretch In (Vertical)
Scales from height 0 at the bottom anchor. Best for bar charts.
```js
tl.from("#el", { scaleY: 0, transformOrigin: "bottom", opacity: 0, duration: 0.45, ease: "back.out(1.6)" }, t)
```

### Draw In (SVG paths)
Path draws itself. Best for trend lines, arrows, checkmarks.
```js
// SVG element needs: pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"
tl.to("#path", { strokeDashoffset: 0, duration: 0.7, ease: "power2.inOut" }, t)
```

### Typewriter
Text reveals character by character.
```js
// Wrap text in <span id="el">Your text here</span>
tl.from("#el", {
  text: { value: "", delimiter: "" },
  duration: 1.5,
  ease: "none"
}, t)
// Requires TextPlugin: gsap.registerPlugin(TextPlugin)
```

### Word Stagger (Kinetic)
Each word flies in one by one. Best for captions.
```js
// Each word needs class="w" and display:inline-block
tl.from("#cap .w", { y: 24, opacity: 0, duration: 0.28, ease: "power3.out", stagger: 0.07 }, t)
```

### Letter Stagger
Each letter animates independently. Best for short titles.
```js
tl.from("#el span", { y: 40, opacity: 0, rotationX: 90, duration: 0.4, stagger: 0.04, ease: "back.out(2)" }, t)
```

---

## 2. EXIT EFFECTS (how elements leave)

### Zoom Push (Cinematic Push)
Scene zooms forward and fades. Most cinematic exit.
```js
tl.to("#scene", { scale: 1.08, opacity: 0, duration: 0.38, ease: "power2.in" }, t)
tl.set("#scene", { opacity: 0 }, t + 0.4)
```

### Scale-Down Tilt
Shrinks and rotates slightly. Best for "dismissed" feeling.
```js
tl.to("#scene", { scale: 0.86, opacity: 0, rotation: -2, duration: 0.38, ease: "power2.in" }, t)
```

### Scale Burst
Explodes outward. High energy exit, best before CTA.
```js
tl.to("#scene", { scale: 1.25, opacity: 0, duration: 0.35, ease: "power2.in" }, t)
```

### Slide Exit Left / Right
Slides off screen.
```js
tl.to("#scene", { x: -1080, opacity: 0, duration: 0.4, ease: "power2.in" }, t)
```

### Vertical Drop
Drops down off screen. Dramatic.
```js
tl.to("#scene", { y: 200, opacity: 0, duration: 0.35, ease: "power2.in" }, t)
```

### Implode
Collapses into center. Best for data/number reveals.
```js
tl.to("#el", { scale: 0, opacity: 0, transformOrigin: "center", duration: 0.3, ease: "power2.in" }, t)
```

---

## 3. TRANSITION EFFECTS (between scenes)

### White Flash Cut
A flash of white wipes between scenes. Sharp, editorial feel.
```html
<div id="flash" style="position:absolute;inset:0;background:#fff;opacity:0;pointer-events:none;z-index:300;"></div>
```
```js
tl.to("#flash", { opacity: 0.9, duration: 0.12, ease: "power1.in" }, t)
tl.to("#flash", { opacity: 0, duration: 0.2, ease: "power2.out" }, t + 0.12)
tl.set("#flash", { opacity: 0 }, t + 0.35)
```

### Cross Dissolve
Simple opacity overlap between two scenes.
```js
tl.to("#scene-a", { opacity: 0, duration: 0.4 }, t)
tl.from("#scene-b", { opacity: 0, duration: 0.4 }, t)
```

### Zoom Cross (default in our reels)
Outgoing scene zooms + fades, incoming scene fades in clean.
```js
tl.to("#scene-a", { scale: 1.08, opacity: 0, duration: 0.35, ease: "power2.in" }, t)
tl.from("#scene-b", { opacity: 0, duration: 0.2 }, t + 0.3)
```

### Slide Wipe
Incoming scene slides over the outgoing scene.
```js
tl.fromTo("#scene-b", { x: 1080 }, { x: 0, duration: 0.45, ease: "cubic-bezier(0.22,1,0.36,1)" }, t)
```

### Vertical Slice
Outgoing exits upward, incoming enters from below.
```js
tl.to("#scene-a",   { y: -100, opacity: 0, duration: 0.38, ease: "power2.in" }, t)
tl.from("#scene-b", { y: 100, opacity: 0, duration: 0.38, ease: "cubic-bezier(0.22,1,0.36,1)" }, t + 0.2)
```

---

## 4. EMPHASIS EFFECTS (draw attention mid-scene)

### Heartbeat
Element pulses once or twice. Best for CTAs, key numbers.
```js
tl.to("#el", { scale: 1.08, transformOrigin: "center", duration: 0.25, yoyo: true, repeat: 1 }, t)
```

### Wiggle
Left-right shake. Best for error states or "pay attention" moments.
```js
tl.to("#el", { x: 8, duration: 0.08, yoyo: true, repeat: 7, ease: "none" }, t)
```

### Glow Pulse
Opacity cycles on a shadow/glow element. Best for highlights.
```js
tl.to("#el", { boxShadow: "0 0 40px rgba(91,142,255,0.8)", duration: 0.4, yoyo: true, repeat: 3 }, t)
```

### Color Flash
Text or bg color flashes to accent color.
```js
tl.to("#el", { color: "#5B8EFF", duration: 0.15, yoyo: true, repeat: 1 }, t)
```

### Ken Burns
Slow camera zoom on a scene background. Always on .scene-inner.
```js
tl.to("#scene .scene-inner", { scale: 1.06, transformOrigin: "50% 50%", duration: holdDuration, ease: "sine.inOut" }, t)
```

### Breathe
Subtle scale oscillation. Makes static scenes feel alive.
```js
tl.to("#el", { scale: 1.02, transformOrigin: "center", duration: 1.2, yoyo: true, repeat: -1, ease: "sine.inOut" }, t)
```

### Underline Draw
An underline draws under text left to right.
```html
<span style="position:relative;">
  word
  <span id="uline" style="position:absolute;bottom:-4px;left:0;width:100%;height:3px;background:#5B8EFF;transform:scaleX(0);transform-origin:left;"></span>
</span>
```
```js
tl.to("#uline", { scaleX: 1, duration: 0.4, ease: "power2.out" }, t)
```

### Counter Roll
Number counts up from 0 to target. Best for stats.
```js
// Requires gsap core (no plugin needed for simple approach)
let obj = { val: 0 }
tl.to(obj, { val: 5000, duration: 1.5, ease: "power2.out",
  onUpdate: () => { document.querySelector("#num").textContent = Math.round(obj.val).toLocaleString() }
}, t)
```

---

## 5. BACKGROUND / AMBIENT EFFECTS

### Shimmer Bar (Divider)
A gradient band sweeps across a horizontal bar infinitely.
```css
@keyframes hf-shimmer {
  0%   { background-position: -1080px 0; }
  100% { background-position: 2160px 0; }
}
#divider {
  background: linear-gradient(90deg, #3F6B63 0%, #D9A441 40%, #fff 50%, #D9A441 60%, #C2603F 100%);
  background-size: 3240px 6px;
  animation: hf-shimmer 3s linear infinite;
}
```

### Dot Grid / Dot Pulse
Static dot grid that pulses opacity.
```css
.dot-grid {
  background-image: radial-gradient(circle, rgba(91,142,255,0.18) 1.5px, transparent 1.5px);
  background-size: 48px 48px;
}
```

### Grain Noise
Film grain texture overlay.
```css
.grain::after {
  content: "";
  position: absolute; inset: 0;
  background-image: url("data:image/svg+xml,...feTurbulence...");
  opacity: 0.05; mix-blend-mode: overlay;
  animation: grain-shift 0.5s steps(1) infinite;
}
@keyframes grain-shift {
  0%,100% { transform: translate(0,0); }
  25% { transform: translate(-3%,-4%); }
  50% { transform: translate(3%,2%); }
  75% { transform: translate(-2%,4%); }
}
```

### Glow Orb
Soft blurred color blob in background.
```html
<div style="position:absolute;width:600px;height:600px;
  background:rgba(91,142,255,0.1);border-radius:50%;
  filter:blur(120px);top:10%;left:50%;transform:translateX(-50%);
  pointer-events:none;"></div>
```

### Progress Bar
Thin bar that fills left-to-right over the video duration.
```html
<div id="pb" style="position:absolute;bottom:0;left:0;height:5px;background:#5B8EFF;transform:scaleX(0);transform-origin:left;z-index:100;width:100%;"></div>
```
```js
tl.to("#pb", { scaleX: 1, transformOrigin: "left center", duration: TOTAL_DURATION, ease: "none" }, 0)
```

---

## 6. STAGGER PATTERNS

| Name | Code | Best for |
|------|------|----------|
| **Cascade Down** | `stagger: 0.1, from: "start"` | List items top to bottom |
| **Cascade Up** | `stagger: 0.1, from: "end"` | Items bottom to top |
| **Center Out** | `stagger: { each: 0.08, from: "center" }` | Grid items |
| **Random** | `stagger: { each: 0.1, from: "random" }` | Particle-like feels |
| **Word Stagger** | `stagger: 0.07` on `.w` spans | Captions, kinetic text |
| **Letter Stagger** | `stagger: 0.03` on `span` per letter | Short punchy words |

---

## 7. QUICK REFERENCE — EASES

| Feel | Ease |
|------|------|
| Cinematic snap | `cubic-bezier(0.22, 1, 0.36, 1)` |
| Spring bounce | `back.out(2.5)` |
| Heavy impact | `back.out(1.4)` |
| Smooth float | `sine.inOut` |
| Sharp enter | `power3.out` |
| Hard stop | `power2.in` (exits only) |
| Gravity drop | `bounce.out` |
| Linear (counters, bars) | `none` |

---

## 8. COMPOUND SEQUENCES (full beat recipes)

### Premium Headline Beat
```js
tl.from("#label",   { y: -16, opacity: 0, duration: 0.36 }, t)
tl.from("#head",    { scale: 1.42, opacity: 0, duration: 0.52, ease: "back.out(2.5)" }, t + 0.1)
tl.from("#support", { y: 20, opacity: 0, duration: 0.36 }, t + 0.62)
tl.to("#head",      { scale: 1.015, duration: 0.9, yoyo: true, repeat: 1, ease: "sine.inOut" }, t + 1.2)
```

### Card List Reveal
```js
cards.forEach((id, i) => {
  tl.from(id, { x: -70, opacity: 0, duration: 0.45, ease: SNAP }, t + i * 0.55)
  tl.to(id,   { scale: 1.02, transformOrigin: "center", duration: 0.18, yoyo: true, repeat: 1 }, t + i * 0.55 + 0.05)
})
```

### Stat Reveal
```js
tl.from("#stat-num",   { scale: 1.6, opacity: 0, duration: 0.5, ease: "back.out(3)" }, t)
tl.from("#stat-label", { y: 16, opacity: 0, duration: 0.35 }, t + 0.4)
tl.to("#stat-num",     { scale: 1.06, duration: 0.25, yoyo: true, repeat: 1 }, t + 0.9)
```

### CTA Slam
```js
tl.from("#cta", { scale: 0.3, opacity: 0, duration: 0.5, ease: "back.out(1.8)" }, t)
tl.to("#cta",   { scale: 1.06, transformOrigin: "center", duration: 0.28, yoyo: true, repeat: 4, ease: "power1.inOut" }, t + 0.55)
```
