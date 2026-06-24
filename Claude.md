# Claude — AI Brand Video Editor

## Who I Am Working With

**Creator**: Building a personal brand around AI for ambitious professionals and businesses.

**Mission**: Help ambitious professionals, founders, and everyday people use AI to create leverage, grow their careers, build businesses, and stay relevant in a rapidly changing world.

**Core belief**: People won't lose jobs to AI — but to people who know how to use AI efficiently.

**Positioning**: "The guy who helps professionals and businesses use AI to get real-world results."

**Goal**: 100k Instagram followers in 6–8 months → credibility → AI-based client services → financial freedom.

---

## Content Pillars

Every reel maps to one of these four pillars:

| Pillar | What it covers | Reel format |
|--------|---------------|-------------|
| **AI for Careers** | Using AI to grow faster, get promoted, stay relevant | Talking head + tool demo |
| **AI for Businesses** | AI tools for founders, operators, scaling | Split-screen before/after |
| **AI Startups** | New AI companies, opportunities, breakdowns | News + breakdown |
| **AI Automations** | Step-by-step workflows, tools, systems | Screen walkthrough |

Plus: **AI Tool Reviews** — how to use new tools effectively.

---

## Reel Structure (every reel follows this)

```
0:00–0:03   HOOK      — One sharp claim that challenges a belief
0:03–0:08   PROOF     — Why this is real and relevant right now
0:08–0:35   CONTENT   — 3 points max. Practical. Specific. No fluff.
0:35–0:42   CTA       — Comment X / Follow / Save this
```

**Hook rules**:
- Must challenge a belief or create curiosity in the first 1.5 seconds
- Never start with "In this video..." or "Today I'm going to..."
- Pattern interrupts: stat drop, contrarian statement, question, bold claim

**Content rules**:
- Max 3 points per reel
- Every point must be actionable, not theoretical
- Tone: ambitious peer who figured it out, not a lecturer
- Never overwhelming or overly technical

---

## Mandatory Design System

**Every project uses this palette. No exceptions.**
Source: `sample_reel_animation.html` (reference file — always check this first).

```css
:root {
  /* Backgrounds */
  --bg:        #F3EEE3;   /* warm beige — main scene background */
  --surface:   #FBF8F1;   /* lighter surface, card fills */
  --surface-2: #EAE1D1;   /* nested cards, video zone bg */

  /* Text */
  --ink:       #2A2520;   /* near-black — all headlines */
  --ink-soft:  #6E6253;   /* muted brown — supporting text */
  --line:      #CDBEA3;   /* pale tan — borders, scene frames, index nums */

  /* Accents */
  --accent:    #C2603F;   /* terracotta rust — primary CTA, kickers, emphasis */
  --accent-2:  #3F6B63;   /* dark teal — secondary accents */
  --accent-3:  #D9A441;   /* warm gold — highlights, stats, CTAs */

  /* Motion */
  --ease: cubic-bezier(.22, 1, .36, 1);
}
```

**Fonts**:
- Headlines: `'Bricolage Grotesque'` weight 700–800
- Body / captions / UI: `'Inter Tight'` or `'Inter'` weight 400–800
- woff2 files live in `fonts/` inside each project

**Caption pill** (sits over face cam — use dark bg for readability):
```css
.cap-pill {
  background: rgba(18, 14, 10, 0.88);
  color: #FFFFFF;
  font-family: 'Bricolage Grotesque', sans-serif;
  font-size: 56px;
  font-weight: 800;
  border-radius: 22px;
  padding: 24px 40px;
}
/* accent words on dark bg — brightened versions: */
.cap-rust  { color: #E8795A; }
.cap-gold  { color: #F0BC5E; }
.cap-teal  { color: #5AADA3; }
.cap-dim   { color: rgba(255,255,255,0.4); }
```

---

## Layout: Split-Screen Reel (standard format)

```
┌─────────────────────────┐  ← 1080px wide
│                         │
│   TOP HALF: ANIMATION   │  ← 0 to 957px (scenes, illustrations, text)
│      ZONE               │
│                         │
├─────────────────────────┤  ← Shimmer divider at y=957px (6px tall)
│                         │
│   BOTTOM HALF: FACE CAM │  ← 963px to 1920px (face cam video)
│                         │
│  ┌───────────────────┐  │
│  │  CAPTION PILL     │  │  ← z-index 200, top: 842px (straddles divider)
│  └───────────────────┘  │
└─────────────────────────┘
```

**Face cam CSS** (critical — height must be 957px, not 1920px):
```css
#facecam {
  position: absolute;
  top: 963px; left: 0;
  width: 1080px;
  height: 957px;          /* NOT 1920px */
  object-fit: cover;
  object-position: center 20%;
  z-index: 10;
}
```

**Face cam HTML** (both attributes required for audio):
```html
<video id="facecam" class="clip"
       data-start="0" data-duration="42.7" data-track-index="1"
       data-has-audio="true" data-volume="1.0"
       src="media/facecam.mp4">
</video>
```

---

## Audio Rules

- **Preview always mutes audio** — browser autoplay policy. This is by design.
- **Rendered MP4 has full audio** — run `npx hyperframes render` to hear it.
- Face cam needs **both** `data-has-audio="true"` AND `data-volume="1.0"`. Missing either = silent render.
- SFX (whoosh.wav) lives in `sfx/` — use on every scene transition, track 4.
- SFX timing: fire 0.35s before scene end for best sync.

---

## Caption Pipeline (Whisper → SRT → HyperFrames)

Never hardcode captions. Always use this pipeline:

```bash
# Step 1: Extract audio
ffmpeg -i media/facecam.mp4 -vn audio.wav

# Step 2: Transcribe locally (no API key needed)
uv run --with openai-whisper whisper audio.wav --model tiny --output_format srt --output_dir ./

# Step 3: Clean SRT (apply /srt rules)
# - Fix proper nouns, spelling, punctuation
# - Save to Updated_<name>.srt

# Step 4: Convert to HyperFrames word-span divs
# Each word gets <span class="w">word</span>
# Merge short blocks (<1.5s) with adjacent blocks
# Max 12 words per caption clip
```

**Caption clip pattern**:
```html
<div id="cap-N" class="clip caption-clip"
     data-start="0.0" data-duration="4.5" data-track-index="3">
  <div class="cap-pill">
    <span class="w">word</span> <span class="cap-rust w">accent</span>
  </div>
</div>
```

**GSAP stagger** (fires 0.3–0.5s after clip data-start):
```js
[["#cap-0", 0.3], ["#cap-1", 4.7], ...].forEach(([id, t]) => {
  tl.from(`${id} .w`, { y: 24, opacity: 0, duration: 0.28, ease: "power3.out", stagger: 0.07 }, t);
});
```

---

## Animation System

Reference `skills/animations/SKILL.md` for full code. Use these by name:

**Scene entries**:
- `Zoom Punch` — every headline: `scale: 1.45 → 1, ease: "back.out(2.5)"`
- `Slam Left` — skill cards, list items
- `3D Flip` — number badges, icon chips
- `Pop` — icons, checkmarks, emojis
- `Word Stagger` — every caption

**Scene transitions** (between scenes):
- `Zoom Push` — default: scene zooms forward + fades out
- `White Flash Cut` — high energy between sections
- `Scale-Down Tilt` — softer transition

**Mid-scene emphasis**:
- `Ken Burns` — every scene `.scene-inner`: `scale: 1 → 1.06, ease: "sine.inOut"`
- `Heartbeat` — CTAs, key stats
- `Underline Draw` — key terms

**Ambient**:
- `Shimmer Bar` — divider animation (always on)
- `Grain Noise` — `.top-scene::after` texture
- `Progress Bar` — bottom of screen, full reel duration

---

## HyperFrames Rules

```bash
# Always run from inside the project folder
cd projects/<project-name>

npx hyperframes lint      # run after every edit — fix ALL errors before previewing
npx hyperframes preview   # opens studio at localhost:3002 (or next available port)
npx hyperframes render    # export MP4
```

**GSAP requirements**:
```js
const tl = gsap.timeline({ paused: true });
// ... all tweens ...
window.__timelines = window.__timelines || {};
window.__timelines["composition-id"] = tl;
```

**Track assignment**:
| Track | Content |
|-------|---------|
| 0 | Scenes (visual, one at a time, no overlap) |
| 1 | Face cam video |
| 3 | Caption clips |
| 4 | Whoosh SFX |
| 5 | Slam/impact SFX |
| 6 | Tick SFX |

**Common lint errors and fixes**:
| Error | Fix |
|-------|-----|
| `overlapping_clips_same_track` | Reduce previous clip duration by 0.01s |
| `video_missing_muted` | Use `data-has-audio="true"` instead of `muted` |
| `font_family_without_font_face` | Replace CSS vars with literal font names |
| `media_missing_id` | Add `id` to every `<audio>` element |
| `gsap_exit_missing_hard_kill` | Add `tl.set("#el", { opacity: 0 })` after exit tween |

---

## Skills

### `/produce` — Rough Cut Engine
Removes retakes, false starts from raw face cam. Keeps last take of each topic.
**Skill**: `skills/produce/SKILL.md` | **Engine**: `engine/roughcut.py`
**Requires**: Python 3.10+, `uv`, ffmpeg, `OPENAI_API_KEY` (or local Whisper fallback)

### `/srt` — Caption Cleaner
Fixes spelling, punctuation, proper nouns in SRT files. Never rewrites phrasing.
**Skill**: `skills/srt/SKILL.md`

### `/reel-animator` — Full Reel Production
Complete HyperFrames reel from transcript to rendered MP4. Covers all 9 steps.
**Skill**: `skills/reel-animator/SKILL.md`

### `/animations` — Animation Effects Library
All named GSAP effects with code snippets. Reference when building any composition.
**Skill**: `skills/animations/SKILL.md`

### `/hyperframes` — HTML-to-Video Engine
HyperFrames composition authoring guide, lint rules, render pipeline.
**Skill**: `skills/hyperframes/SKILL.md`

### `/igcaption` — Instagram Caption Generator
3 caption variants, 300–500 chars, real human voice, no hashtags ever.
**Skill**: `skills/igcaption/SKILL.md`

### `/ytdescription` — YouTube Description Generator
Locked block-order description format.
**Skill**: `skills/ytdescription/SKILL.md`

### `/reel-overlay` — 4K Alpha Overlay Generator
ProRes 4444 overlay for Descript/Premiere workflow.
**Skill**: `skills/reel-overlay/SKILL.md`

### `/new-series` — Content Series Builder
Scaffolds carousel, reel, or YouTube series with Canvas 2D.
**Skill**: `skills/new-series/SKILL.md`

---

## Full Production Workflow

```
1. PLAN
   - Choose content pillar
   - Write hook (5 variants, pick best)
   - Write 3-point script, max 45 seconds

2. RECORD
   - Face cam, retakes OK
   - Speak clearly, pause between points

3. ROUGH CUT
   - /produce → automated rough cut
   - Review output

4. CAPTIONS
   - ffmpeg extract audio
   - Local Whisper → SRT
   - /srt → clean SRT
   - Convert to word-span HyperFrames divs

5. COMPOSITION
   - New project in projects/
   - Apply design system (beige/terracotta palette)
   - Build scenes per pillar template
   - Add captions, SFX, animations
   - npx hyperframes lint → fix errors
   - npx hyperframes preview → review

6. RENDER
   - npx hyperframes render → MP4

7. FINAL EDIT (CapCut / Descript)
   - Color grade
   - Add background music (duck under voice)
   - Final trim

8. PACKAGE
   - /igcaption → Instagram caption
   - Thumbnail from first 3 frames

9. POST
```

---

## Projects

```
projects/
├── 5k-methods-reel/          ← "3 methods to $5K/month as a video editor"
│   ├── index.html            ← HyperFrames composition (42.7s, beige/terracotta)
│   ├── fonts/                ← Bricolage Grotesque + Inter woff2
│   ├── media/facecam.mp4     ← Raw face cam
│   └── sfx/whoosh.wav        ← Transition SFX
└── claude-skills-reel/       ← "Claude skills" 15s pure animation (dark theme — legacy)
    ├── index.html
    ├── fonts/
    └── sfx/whoosh.wav
```

---

## File Structure

```
Video Editing/
├── Claude.md                      ← This file (always keep updated)
├── sample_reel_animation.html     ← Design system reference (READ BEFORE NEW PROJECT)
├── engine/
│   ├── roughcut.py
│   └── pyproject.toml
├── hyperframes/                   ← HyperFrames repo
│   ├── packages/
│   ├── registry/
│   └── examples/
├── projects/                      ← All reel compositions live here
└── skills/
    ├── produce/SKILL.md
    ├── srt/SKILL.md
    ├── reel-animator/SKILL.md
    ├── animations/SKILL.md        ← Named GSAP effects library
    ├── hyperframes/SKILL.md
    ├── igcaption/SKILL.md
    ├── ytdescription/SKILL.md
    ├── reel-overlay/SKILL.md
    └── new-series/SKILL.md
```

---

## Quick Commands

```bash
# New reel project
cd "projects" && mkdir my-reel && cd my-reel
# Copy fonts + sfx from existing project, create hyperframes.json

# Extract audio for Whisper
ffmpeg -i media/facecam.mp4 -vn audio.wav

# Local Whisper transcription
uv run --with openai-whisper whisper audio.wav --model tiny --output_format srt

# Lint + preview
npx hyperframes lint
npx hyperframes preview

# Render
npx hyperframes render
```
