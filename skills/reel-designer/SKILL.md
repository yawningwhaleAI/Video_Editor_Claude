---
name: reel-designer
description: Scaffold a new Instagram reel in the creator's signature format — full-screen face cam + beige top-zone card animations + kinetic captions, with full-screen motion-graphic b-roll cutaways between sections. Also use to upgrade or restyle an existing reel toward this format. Invoke for "new reel", "scaffold a reel", "build a reel in my format", "reel-designer", "make it cinematic", "improve reel", or any request to start or elevate a reel composition.
---

# /reel-designer — Signature Reel Scaffold

Produces a HyperFrames composition in the creator's **locked standard format**. This is the default look for every reel unless the user explicitly asks otherwise.

> Full-screen face cam → beige card animations in the TOP zone + kinetic captions while speaking → full-screen motion-graphic b-roll cutaways between sections when needed. **One accent color per card. Never rainbow.**

Reference implementation: `projects/5k-methods-reel/index.html`. Design system source: `sample_reel_animation.html` (beige/terracotta — mandatory).

---

## The format, non-negotiable

| Layer | Rule |
|-------|------|
| **Face cam** | Full screen 1080×1920, `object-fit:cover`, track 1, continuous. NEVER 50/50 split. |
| **Cards** | Beige brand-surface, opaque, in the **TOP zone** (`top:120px`) so they never cover the face. Slam/zoom in while the person talks. |
| **Color** | **One accent per card** (rust / gold / teal). Ink text + muted brown elsewhere. |
| **Captions** | Word-stagger, dark pill, `bottom:250px`, track 3, over the face. |
| **B-roll** | Full-screen motion graphic cutaway (`z-index:30`) between sections — beige bg, drifting dot-grid, sweeping accent stripe, big kinetic rows. Zooms back to face after. |
| **Ambient** | Top+bottom scrims + subtle grain over the whole frame. Progress bar at the very bottom. |
| **Section beats** | Lower-third `01 / 02 / 03` label bars between content blocks. |

---

## STEP 0 — Footage prep (do this first, always)

Incoming raw footage is frequently **HEVC/H.265**, which Chrome (and therefore HyperFrames) cannot decode — it renders black with audio only. Always transcode to H.264:

```bash
ffmpeg -y -i "RAW.mp4" -c:v libx264 -pix_fmt yuv420p -crf 18 -preset medium \
  -movflags +faststart -c:a aac -b:a 192k media/facecam.mp4
```

Verify codec with `ffprobe -select_streams v:0 -show_entries stream=codec_name`. If it already says `h264`, a copy is fine, but a re-encode to `yuv420p + faststart` guarantees browser playback.

---

## STEP 1 — Captions (never hardcode)

Follow the caption pipeline in CLAUDE.md / `/srt`:
1. `ffmpeg -i media/facecam.mp4 -vn audio.wav`
2. Local Whisper → SRT (`uv run --with openai-whisper whisper audio.wav --model tiny --output_format srt`)
3. `/srt` clean → `Updated_<name>.srt`
4. Convert each block to `<div class="clip caption-clip">` with every word in `<span class="w">`. Accent words get `cap-rust` / `cap-gold` / `cap-teal`. Max 12 words/clip, merge blocks <1.5s.

Caption track assignment: track 3. If two caption clips would overlap on the timeline (float rounding), put the middle one on track 2.

---

## STEP 2 — Scaffold the file

Copy `fonts/`, `sfx/` from an existing project. Then build `index.html` from this skeleton.

### Head / CSS (copy verbatim, this is the format)

```html
<style>
  @font-face { font-family:'Bricolage Grotesque'; src:url('fonts/BricolageGrotesque-Bold.woff2') format('woff2'); font-weight:700 800; }
  @font-face { font-family:'Inter'; src:url('fonts/Inter-Regular.woff2') format('woff2'); font-weight:400; }
  @font-face { font-family:'Inter'; src:url('fonts/Inter-Bold.woff2') format('woff2'); font-weight:600 900; }
</style>
<style>
  :root{
    --bg:#F3EEE3; --surface:#FBF8F1; --surface-2:#EAE1D1;
    --ink:#2A2520; --ink-soft:#6E6253; --line:#CDBEA3;
    --rust:#C2603F; --teal:#3F6B63; --gold:#D9A441;
  }
  *{margin:0;padding:0;box-sizing:border-box;}
  body{width:1080px;height:1920px;overflow:hidden;background:#000;}

  /* full-screen face cam */
  #facecam{position:absolute;top:0;left:0;width:1080px;height:1920px;object-fit:cover;object-position:center 22%;z-index:1;}
  #scrim{position:absolute;inset:0;pointer-events:none;z-index:2;
    background:linear-gradient(180deg,rgba(8,6,4,.55),rgba(8,6,4,0) 24%),linear-gradient(0deg,rgba(8,6,4,.78),rgba(8,6,4,0) 30%);}
  #grain{position:absolute;inset:0;pointer-events:none;z-index:3;opacity:.05;
    background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");}

  /* graphic layer — one beat at a time, track 0 */
  .gfx{position:absolute;top:0;left:0;width:1080px;height:1920px;pointer-events:none;z-index:20;}

  /* BEIGE premium card */
  .card{position:absolute;background:rgba(251,248,241,.97);border:1.5px solid rgba(194,96,63,.22);
    border-radius:30px;box-shadow:0 30px 70px rgba(0,0,0,.45),inset 0 1px 0 rgba(255,255,255,.6);
    color:var(--ink);padding:40px 44px;}
  .card.teal-edge{border-color:rgba(63,107,99,.30);} .card.rust-edge{border-color:rgba(194,96,63,.32);}
  .card-label{font-family:'Inter',sans-serif;font-size:24px;font-weight:800;letter-spacing:.18em;
    text-transform:uppercase;color:var(--rust);display:flex;align-items:center;gap:12px;}
  .card-label.teal{color:var(--teal);} .card-label.rust{color:var(--rust);}
  .card-label .dot{width:12px;height:12px;border-radius:50%;background:currentColor;}
  .stat-big{font-family:'Bricolage Grotesque',sans-serif;font-weight:800;letter-spacing:-.02em;line-height:.9;color:var(--ink);}
  .sub{font-family:'Inter',sans-serif;font-weight:500;color:var(--ink-soft);line-height:1.35;}

  /* lower-third section label bar */
  .beat-bar{position:absolute;left:60px;bottom:520px;display:flex;align-items:center;gap:28px;}
  .beat-num{font-family:'Bricolage Grotesque',sans-serif;font-weight:800;font-size:120px;line-height:1;color:var(--rust);text-shadow:0 6px 30px rgba(0,0,0,.6);}
  .beat-num.teal{color:var(--teal);} .beat-num.gold{color:var(--gold);}
  .beat-txt{font-family:'Bricolage Grotesque',sans-serif;font-weight:800;font-size:78px;line-height:.98;color:#fff;letter-spacing:-.02em;text-shadow:0 6px 30px rgba(0,0,0,.6);max-width:12ch;}
  .beat-rule{width:6px;height:132px;border-radius:4px;background:linear-gradient(180deg,var(--gold),transparent);}

  /* captions */
  .caption-clip{position:absolute;left:0;bottom:250px;width:1080px;display:flex;justify-content:center;padding:0 70px;z-index:200;}
  .cap-pill{background:rgba(18,14,10,.9);border:1.5px solid rgba(255,255,255,.1);color:#fff;
    font-family:'Bricolage Grotesque',sans-serif;font-size:54px;font-weight:800;line-height:1.22;
    padding:22px 38px;border-radius:22px;text-align:center;max-width:960px;letter-spacing:-.02em;box-shadow:0 16px 48px rgba(0,0,0,.5);}
  .cap-pill .w{display:inline-block;}
  .cap-rust{color:#E8795A;} .cap-gold{color:#F0BC5E;} .cap-teal{color:#5AADA3;} .cap-dim{color:rgba(255,255,255,.4);}

  /* full-screen motion-graphic b-roll */
  #broll{position:absolute;inset:0;background:var(--bg);overflow:hidden;}
  @keyframes bv-drift{from{background-position:0 0;}to{background-position:64px 64px;}}
  .bv-grid{position:absolute;inset:-64px;background-image:radial-gradient(rgba(194,96,63,.16) 2px,transparent 2px);background-size:64px 64px;animation:bv-drift 6s linear infinite;}
  .bv-stripe{position:absolute;top:-10%;left:-30%;width:60%;height:120%;background:linear-gradient(115deg,transparent,rgba(217,164,65,.18),transparent);transform:skewX(-12deg);}
  .bv-inner{position:relative;width:100%;height:100%;padding:300px 90px 0;display:flex;flex-direction:column;gap:44px;}
  .bv-row{display:flex;align-items:center;gap:30px;}
  .bv-num{font-family:'Bricolage Grotesque',sans-serif;font-weight:800;font-size:84px;width:110px;flex:0 0 auto;}
  .bv-ico{width:92px;height:92px;border-radius:22px;display:flex;align-items:center;justify-content:center;flex:0 0 auto;box-shadow:0 14px 30px rgba(0,0,0,.18);}
  .bv-word{font-family:'Bricolage Grotesque',sans-serif;font-weight:800;font-size:76px;color:var(--ink);letter-spacing:-.02em;}

  #progress{position:absolute;bottom:0;left:0;height:8px;width:1080px;transform-origin:left center;
    background:linear-gradient(90deg,var(--rust),var(--gold),var(--teal));z-index:210;}
  #flash-overlay{position:absolute;inset:0;background:#FBF8F1;opacity:0;pointer-events:none;z-index:300;}
</style>
```

### Body skeleton

```html
<div id="stage" data-composition-id="REEL-ID" data-start="0" data-width="1080" data-height="1920">
  <video id="facecam" class="clip" data-start="0" data-duration="DUR" data-track-index="1"
         data-has-audio="true" data-volume="1.0" src="media/facecam.mp4"></video>
  <div id="scrim"></div><div id="grain"></div><div id="flash-overlay"></div>

  <!-- TRACK 0: one graphic beat per content section. Cards live at top:120px. -->
  <!-- Card beat: -->
  <div id="g-X" class="gfx clip" data-start="T" data-duration="D" data-track-index="0">
    <div class="card" id="X-card" style="top:120px; right:55px; width:520px;">
      <div class="card-label" style="color:var(--gold);"><span class="dot"></span>Label</div>
      <div class="stat-big" style="font-size:120px; margin:18px 0 6px; color:var(--gold);">$5K</div>
      <div class="sub" style="font-size:30px;">supporting line</div>
    </div>
  </div>
  <!-- Section label bar: -->
  <div id="g-label" class="gfx clip" data-start="T" data-duration="D" data-track-index="0">
    <div class="beat-bar" id="bN"><div class="beat-num rust">01</div><div class="beat-rule"></div><div class="beat-txt">Headline</div></div>
  </div>
  <!-- Full-screen b-roll cutaway: -->
  <div id="g-broll" class="gfx clip" data-start="T" data-duration="D" data-track-index="0" style="z-index:30;">
    <div id="broll"><div class="bv-grid"></div><div class="bv-stripe"></div>
      <div class="bv-inner">
        <div class="bv-row"><span class="bv-num" style="color:var(--rust);">01</span><span class="bv-ico" style="background:var(--rust);">ICON</span><span class="bv-word">Point one</span></div>
        <!-- rows 02 gold, 03 teal -->
      </div></div>
  </div>

  <!-- TRACK 3: captions (word spans) -->
  <!-- TRACK 4/5/6: whoosh / slam+impact / tick SFX -->
  <div id="progress"></div>
</div>
```

### Card placement rules
- Default `top:120px`. Hug a side with `right:55px` or `left:55px`, or center with `left:50%; transform:translateX(-50%);`.
- Alternate left/right across consecutive beats so it feels dynamic.
- Card width 500–600px for side cards, up to 820px for centered CTA.
- If the person's head reaches high in frame, drop cards lower or shrink — confirm visually in preview.

### One-accent-per-card map (example)
Money/revenue → **gold** · problem/CTA/urgency → **rust** · results/leads/positive → **teal**.

---

## STEP 3 — GSAP timeline

```js
const SLAM = "back.out(1.7)";
const tl = gsap.timeline({ paused: true });
tl.fromTo("#progress", {scaleX:0}, {scaleX:1, duration:DUR, ease:"none"}, 0);

function countUp(sel,end,t,dur){const o={v:0};tl.to(o,{v:end,duration:dur,ease:"power2.out",
  onUpdate:()=>{const el=document.querySelector(sel);if(el)el.textContent=Math.round(o.v);}},t);}
function cardIn(sel,t,fromX){tl.from(sel,{x:fromX||0,y:fromX?0:60,scale:.85,opacity:0,duration:.5,ease:SLAM,overwrite:"auto"},t);}
function cardOut(sel,t){tl.to(sel,{scale:.9,opacity:0,duration:.3,ease:"power2.in"},t);tl.set(sel,{opacity:0},t+.32);}

// per card: cardIn(...) → optional countUp/emphasis → cardOut(...) just before next beat
// section label: from beat-num {scale:1.6,opacity:0,back.out(2.2)} → rule scaleY → txt slide
// b-roll: tl.from("#broll",{opacity:0,scale:1.12,duration:.4}) → rows stagger x:-70 → exit scale:.94 + tl.set opacity 0
// transition flashes: [t1,t2,...].forEach(t => flash-overlay 0→.55→0)
// captions: [["#cap-0",0.3],...].forEach(([id,t])=>tl.from(`${id} .w`,{y:24,opacity:0,duration:.28,ease:"power3.out",stagger:.07},t));

window.__timelines = window.__timelines || {};
window.__timelines["REEL-ID"] = tl;
```

Animation names to reach for (see `/animations`): Zoom Punch (headlines), Slam Left (cards/rows), 3D Flip (badges), Word Stagger (captions), Ken Burns (scenes), Heartbeat (CTAs), White Flash Cut (transitions).

---

## STEP 4 — Lint, preview, render

```bash
cd projects/<reel>
npx hyperframes lint      # fix ALL errors (warnings about file size/density are OK)
npx hyperframes preview   # studio at localhost:3002+
npx hyperframes render    # MP4 with full audio → save to a delivery folder
```

Common fixes: use literal font names (not `var(--font-*)`) to avoid `font_family_without_font_face`; add `overwrite:"auto"` for overlapping tweens; always pair an exit tween with `tl.set(sel,{opacity:0})`; nudge a clip duration by −0.01s to clear `overlapping_clips_same_track` float errors.

---

## Audio reminder
Preview always mutes (browser policy). Audio only exists in the rendered MP4. Face cam needs **both** `data-has-audio="true"` AND `data-volume="1.0"`. SFX: whoosh on transitions (track 4), slam/impact on label/CTA (track 5), tick on captions (track 6).
