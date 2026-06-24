/**
 * Reel Animator v2 — Split-screen 50/50
 * Top half: animated beige overlay (Claude theme)
 * Bottom half: face cam video
 * Middle boundary: captions
 */

const { createCanvas } = require('@napi-rs/canvas');
const { spawnSync }    = require('child_process');
const fs   = require('fs');
const path = require('path');
const os   = require('os');

// ── Config ────────────────────────────────────────────────────────────────────
const VIDEO_PATH  = 'C:\\Users\\Aryan\\Downloads\\R2 - 3 METHODS 5K SCRIPTS.mov';
const OUTPUT_PATH = path.join(__dirname, 'output', 'R2_animated_v2.mp4');
const FPS         = 24;
const DURATION    = 42.7;
const TOTAL       = Math.ceil(FPS * DURATION);
const CW          = 1080;
const CH          = 960;

// ── Theme ─────────────────────────────────────────────────────────────────────
const T = {
  bg:        '#EDE8DC',
  card:      '#F7F3ED',
  text:      '#2D2924',
  textMid:   '#6B6456',
  textLight: '#A09280',
  accent:    '#C17D52',
  accentRgb: '193,125,82',
  line:      'rgba(45,41,36,0.10)',
  ctaBg:     '#2D2924',
  ctaText:   '#F7F3ED',
};

// ── Beat plan ─────────────────────────────────────────────────────────────────
const BEATS = [
  { s: 0,    e: 5,    type: 'hook',    main: '0 → 5K/month',   sub: 'as a video editor'          },
  { s: 5,    e: 14,   type: 'section', num: '01', main: 'Cold DMs',     sub: 'Start a convo, never pitch first' },
  { s: 14,   e: 19,   type: 'cta',    main: 'Comment 5K',     sub: "I'll DM you my exact scripts" },
  { s: 19,   e: 28,   type: 'section', num: '02', main: 'Send Value',   sub: 'Free edit · hook · script'       },
  { s: 28,   e: 37,   type: 'section', num: '03', main: 'Post Content', sub: 'Build brand + inbound leads'     },
  { s: 37,   e: 42.7, type: 'cta',    main: 'Comment 5K',     sub: 'Close your next deal'        },
];

// ── Captions ──────────────────────────────────────────────────────────────────
const CAPTIONS = [
  { s: 0,    e: 4.5,  text: 'These 3 methods helped me charge 5K/month',       hi: '5K/month'   },
  { s: 4.5,  e: 8.5,  text: "Cold DMs — start a convo, don't pitch yet",       hi: 'Cold DMs'   },
  { s: 8.5,  e: 13.5, text: 'Pitch too early = stuck in requests forever',      hi: 'Pitch too early' },
  { s: 13.5, e: 18.5, text: "Comment 5K → I'll send my exact scripts",          hi: '5K'         },
  { s: 18.5, e: 23.5, text: 'Send value — free edit, hook or script',           hi: 'free edit'  },
  { s: 23.5, e: 27.5, text: 'Give something they can apply in their niche',     hi: null         },
  { s: 27.5, e: 31.5, text: 'Post content — build your brand',                  hi: 'Post content' },
  { s: 31.5, e: 36.5, text: 'Every post = brand + inbound leads',               hi: 'inbound leads' },
  { s: 36.5, e: 42.7, text: 'Drop 5K in comments → close your next deal',       hi: '5K'         },
];

// ── Floating dot field (seeded, static positions) ─────────────────────────────
const DOTS = Array.from({ length: 18 }, (_, i) => ({
  x:  ((i * 137.5) % 1) * (CW - 80) + 40,
  y:  ((i * 97.3)  % 1) * (CH - 80) + 40,
  r:  2 + (i % 3) * 1.2,
  sp: 0.18 + (i % 5) * 0.07,
  ph: (i * 0.8) % (Math.PI * 2),
}));

// ── Easing / math helpers ─────────────────────────────────────────────────────
const clamp  = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const lerp   = (a, b, t)   => a + (b - a) * clamp(t, 0, 1);
const easeOut3 = t => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
const easeOut5 = t => 1 - Math.pow(1 - clamp(t, 0, 1), 5);

// Spring overshoot: p=0→1 progress, tension controls bounce amount
function spring(p, tension = 0.3) {
  const c = clamp(p, 0, 1);
  return c + tension * Math.sin(c * Math.PI) * Math.sin(c * Math.PI * 2.2) * (1 - c);
}

// Stagger: returns 0→1 for element i given global p (0→1) and stagger window
function stagger(p, i, count, window = 0.45) {
  const step = window / count;
  return easeOut3(clamp((p - i * step) / (1 - window + step), 0, 1));
}

// ── rrect / shadow ────────────────────────────────────────────────────────────
function rrect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
function shadow(ctx, blur, oy, color) {
  ctx.shadowBlur = blur; ctx.shadowOffsetY = oy; ctx.shadowColor = color;
}
function noShadow(ctx) {
  ctx.shadowBlur = 0; ctx.shadowOffsetY = 0; ctx.shadowColor = 'transparent';
}

// ── Beat lookup (with transition overlap) ─────────────────────────────────────
const TRANS = 0.28; // seconds of crossover

function getActiveBeat(t) {
  // Return current + optional outgoing beat for transitions
  let cur = null, out = null;
  for (let i = 0; i < BEATS.length; i++) {
    const b = BEATS[i];
    if (t >= b.s && t < b.e) { cur = { beat: b, p: (t - b.s) / (b.e - b.s) }; break; }
  }
  // Check if previous beat is still in its exit window
  for (let i = 0; i < BEATS.length; i++) {
    const b = BEATS[i];
    const exitEnd = b.e + TRANS;
    if (t >= b.e && t < exitEnd && cur !== null && BEATS[i + 1] === cur.beat) {
      out = { beat: b, p: 1 + (t - b.e) / TRANS }; // p > 1 = exiting
      break;
    }
  }
  return { cur, out };
}

const getCaption = t => CAPTIONS.find(c => t >= c.s && t < c.e) || null;
const getPrevCaption = t => CAPTIONS.find(c => t >= c.s - 0.35 && t < c.s) || null;

// ── Draw: animated background ─────────────────────────────────────────────────
function drawBg(ctx, t) {
  ctx.fillStyle = T.bg;
  ctx.fillRect(0, 0, CW, CH);

  // Animated floating dots
  ctx.save();
  DOTS.forEach(d => {
    const dy = Math.sin(t * d.sp + d.ph) * 14;
    const dx = Math.cos(t * d.sp * 0.7 + d.ph) * 8;
    const alpha = 0.10 + Math.sin(t * d.sp * 1.3 + d.ph) * 0.04;
    ctx.beginPath();
    ctx.arc(d.x + dx, d.y + dy, d.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(193,125,82,${alpha})`;
    ctx.fill();
  });
  ctx.restore();

  // Subtle horizontal rule
  ctx.strokeStyle = 'rgba(196,185,163,0.28)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(60, CH / 2); ctx.lineTo(CW - 60, CH / 2); ctx.stroke();

  // Top progress bar (animated accent)
  const prog = t / DURATION;
  ctx.fillStyle = T.accent;
  ctx.fillRect(0, 0, CW * prog, 4);
  // Track
  ctx.fillStyle = 'rgba(193,125,82,0.18)';
  ctx.fillRect(CW * prog, 0, CW * (1 - prog), 4);
}

// ── Card enter/exit transform helpers ────────────────────────────────────────
function applyEnter(ctx, p, pivotX, pivotY) {
  // p: 0→1 enter, apply spring + slide from right
  const sp  = spring(clamp(p, 0, 1), 0.22);
  const tx  = lerp(80, 0, sp);
  const alpha = easeOut3(clamp(p * 2.5, 0, 1));
  ctx.globalAlpha = alpha;
  ctx.translate(pivotX + tx, pivotY);
  ctx.translate(-pivotX, -pivotY);
}

function applyExit(ctx, p, pivotX, pivotY) {
  // p: 1→2 exit (p-1 = 0→1), slide left + fade
  const ep    = clamp(p - 1, 0, 1);
  const tx    = lerp(0, -90, easeOut5(ep));
  const alpha = lerp(1, 0, easeOut3(ep));
  ctx.globalAlpha = alpha;
  ctx.translate(pivotX + tx, pivotY);
  ctx.translate(-pivotX, -pivotY);
}

// ── Draw: hook card ───────────────────────────────────────────────────────────
function drawHook(ctx, beat, p) {
  const W = 720, H = 280;
  const cx = (CW - W) / 2, cy = 285;
  const pivX = CW / 2, pivY = cy + H / 2;

  ctx.save();
  if (p <= 1) applyEnter(ctx, p, pivX, pivY);
  else        applyExit(ctx,  p, pivX, pivY);

  // Card
  shadow(ctx, 48, 18, 'rgba(45,41,36,0.13)');
  ctx.fillStyle = T.card;
  rrect(ctx, cx, cy, W, H, 28); ctx.fill();
  noShadow(ctx);
  ctx.strokeStyle = T.line; ctx.lineWidth = 1.5;
  rrect(ctx, cx, cy, W, H, 28); ctx.stroke();

  // Accent top strip on card
  ctx.save();
  ctx.clip(); // clip to card shape
  rrect(ctx, cx, cy, W, H, 28); ctx.clip();
  ctx.fillStyle = T.accent;
  ctx.fillRect(cx, cy, W, 5);
  ctx.restore();

  // Staggered text elements
  const s0 = stagger(clamp(p, 0, 1), 0, 3);
  const s1 = stagger(clamp(p, 0, 1), 1, 3);
  const s2 = stagger(clamp(p, 0, 1), 2, 3);

  // Tag
  ctx.save();
  ctx.globalAlpha *= s0;
  ctx.translate(0, lerp(12, 0, easeOut3(s0)));
  ctx.fillStyle = T.accent;
  ctx.font = '700 12px Arial';
  ctx.letterSpacing = '2px';
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText('VIDEO EDITOR STORY', CW / 2, cy + 30);
  ctx.letterSpacing = '0px';

  // Divider (animated width)
  const divW = lerp(0, W - 80, easeOut3(s0));
  ctx.strokeStyle = T.line; ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(CW / 2 - divW / 2, cy + 58);
  ctx.lineTo(CW / 2 + divW / 2, cy + 58);
  ctx.stroke();
  ctx.restore();

  // Main text
  ctx.save();
  ctx.globalAlpha *= s1;
  ctx.translate(0, lerp(18, 0, easeOut3(s1)));
  ctx.fillStyle = T.text;
  ctx.font = 'bold 68px Arial';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(beat.main, CW / 2, cy + H / 2 + 10);
  ctx.restore();

  // Sub text
  ctx.save();
  ctx.globalAlpha *= s2;
  ctx.translate(0, lerp(12, 0, easeOut3(s2)));
  ctx.fillStyle = T.textMid;
  ctx.font = '400 21px Arial';
  ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
  ctx.fillText(beat.sub, CW / 2, cy + H - 28);
  ctx.restore();

  ctx.restore();
}

// ── Draw: section card ────────────────────────────────────────────────────────
function drawSection(ctx, beat, p) {
  const W = 750, H = 305;
  const cx = (CW - W) / 2, cy = 262;
  const pivX = CW / 2, pivY = cy + H / 2;

  ctx.save();
  if (p <= 1) applyEnter(ctx, p, pivX, pivY);
  else        applyExit(ctx,  p, pivX, pivY);

  // Card
  shadow(ctx, 40, 14, 'rgba(45,41,36,0.14)');
  ctx.fillStyle = T.card;
  rrect(ctx, cx, cy, W, H, 24); ctx.fill();
  noShadow(ctx);
  ctx.strokeStyle = T.line; ctx.lineWidth = 1.5;
  rrect(ctx, cx, cy, W, H, 24); ctx.stroke();

  // Stagger progress
  const ep = clamp(p, 0, 1);
  const s0 = stagger(ep, 0, 4, 0.5);
  const s1 = stagger(ep, 1, 4, 0.5);
  const s2 = stagger(ep, 2, 4, 0.5);
  const s3 = stagger(ep, 3, 4, 0.5);

  // Animated left accent bar (grows from top)
  const barH = lerp(0, H - 72, easeOut3(s0));
  ctx.save();
  ctx.globalAlpha *= s0;
  ctx.fillStyle = T.accent;
  rrect(ctx, cx, cy + 36, 7, barH, 4); ctx.fill();
  ctx.restore();

  // Ghost number (fades in)
  ctx.save();
  ctx.globalAlpha *= s1 * 0.07;
  ctx.fillStyle = T.text;
  ctx.font = 'bold 220px Arial';
  ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  ctx.fillText(beat.num, cx + W - 10, cy + H / 2);
  ctx.restore();

  // Method label (slides up)
  ctx.save();
  ctx.globalAlpha *= s1;
  ctx.translate(0, lerp(10, 0, easeOut3(s1)));
  ctx.fillStyle = T.accent;
  ctx.font = '700 12px Arial';
  ctx.letterSpacing = '2px';
  ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillText(`METHOD ${beat.num}`, cx + 32, cy + 30);
  ctx.letterSpacing = '0px';
  ctx.restore();

  // Main text (slides up with spring)
  ctx.save();
  ctx.globalAlpha *= s2;
  ctx.translate(0, lerp(22, 0, spring(s2, 0.18)));
  ctx.fillStyle = T.text;
  ctx.font = 'bold 58px Arial';
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText(beat.main, cx + 32, cy + H / 2);
  ctx.restore();

  // Sub text (slides up)
  ctx.save();
  ctx.globalAlpha *= s3;
  ctx.translate(0, lerp(14, 0, easeOut3(s3)));
  ctx.fillStyle = T.textMid;
  ctx.font = '400 20px Arial';
  ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
  ctx.fillText(beat.sub, cx + 32, cy + H - 28);
  ctx.restore();

  ctx.restore();
}

// ── Draw: CTA ─────────────────────────────────────────────────────────────────
function drawCTA(ctx, beat, p, t) {
  const ep = clamp(p, 0, 1);
  const pW = 560, pH = 102;
  const px = (CW - pW) / 2, py = 362;
  const pivX = CW / 2, pivY = py + pH / 2;

  ctx.save();
  if (p <= 1) applyEnter(ctx, p, pivX, pivY);
  else        applyExit(ctx,  p, pivX, pivY);

  // Ripple rings (expand outward, only after card has entered)
  const rippleStart = 0.5;
  if (ep > rippleStart) {
    const rings = 2;
    for (let r = 0; r < rings; r++) {
      const rp = ((t * 0.55 + r / rings) % 1);
      const ringAlpha = (1 - rp) * 0.22 * easeOut3((ep - rippleStart) / 0.3);
      const rW = pW / 2 + rp * 110;
      const rH = pH / 2 + rp * 50;
      ctx.save();
      ctx.globalAlpha = ringAlpha;
      ctx.strokeStyle = T.accent;
      ctx.lineWidth = 2;
      const rx = CW / 2 - rW, ry = pivY - rH;
      rrect(ctx, rx, ry, rW * 2, rH * 2, pH / 2 + rp * 50);
      ctx.stroke();
      ctx.restore();
    }
  }

  // Pill
  shadow(ctx, 36, 12, 'rgba(45,41,36,0.26)');
  ctx.fillStyle = T.ctaBg;
  rrect(ctx, px, py, pW, pH, 51); ctx.fill();
  noShadow(ctx);

  // Animated arrow bounce
  const arrowBounce = Math.sin(t * Math.PI * 2.2) * 4 * clamp((ep - 0.4) / 0.3, 0, 1);

  ctx.fillStyle = T.ctaText;
  ctx.font = 'bold 36px Arial';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(`↓  ${beat.main}  ↓`, CW / 2, pivY + arrowBounce);

  // Sub text staggered
  const s1 = stagger(ep, 1, 2);
  ctx.save();
  ctx.globalAlpha *= s1 * 0.75;
  ctx.translate(0, lerp(10, 0, easeOut3(s1)));
  ctx.fillStyle = T.textMid;
  ctx.font = '400 18px Arial';
  ctx.textBaseline = 'top';
  ctx.fillText(beat.sub, CW / 2, py + pH + 18);
  ctx.restore();

  ctx.restore();
}

// ── Draw: caption strip ───────────────────────────────────────────────────────
function drawCaption(ctx, t) {
  const cap  = getCaption(t);
  const prev = getPrevCaption(t);

  // Animate slide-up when caption changes
  function renderCap(caption, alpha, offsetY) {
    if (!caption) return;

    ctx.save();
    const pH = 62, py = CH - pH - 18;
    ctx.font = '600 22px Arial';
    const fullW = ctx.measureText(caption.text).width + 64;
    const pW = Math.min(fullW, CW - 60);
    const px = (CW - pW) / 2;

    ctx.globalAlpha = alpha;
    ctx.translate(0, offsetY);

    shadow(ctx, 18, 6, 'rgba(0,0,0,0.20)');
    ctx.fillStyle = T.ctaBg;
    rrect(ctx, px, py, pW, pH, 31); ctx.fill();
    noShadow(ctx);

    // If caption has a highlighted word, split and render
    if (caption.hi) {
      const full = caption.text;
      const hiIdx = full.indexOf(caption.hi);
      if (hiIdx >= 0) {
        const before = full.slice(0, hiIdx);
        const hi     = full.slice(hiIdx, hiIdx + caption.hi.length);
        const after  = full.slice(hiIdx + caption.hi.length);

        ctx.textBaseline = 'middle';
        const midY = py + pH / 2;

        // Measure pieces
        ctx.font = '600 22px Arial';
        const bW  = ctx.measureText(before).width;
        const hiW = ctx.measureText(hi).width;
        const aW  = ctx.measureText(after).width;
        const total = bW + hiW + aW;
        let x = CW / 2 - total / 2;

        ctx.textAlign = 'left';
        ctx.fillStyle = T.ctaText;
        ctx.fillText(before, x, midY); x += bW;

        // Highlighted word in accent color
        ctx.fillStyle = T.accent;
        ctx.fillText(hi, x, midY); x += hiW;

        ctx.fillStyle = T.ctaText;
        ctx.fillText(after, x, midY);
      } else {
        ctx.fillStyle = T.ctaText;
        ctx.font = '600 22px Arial';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(caption.text, CW / 2, py + pH / 2);
      }
    } else {
      ctx.fillStyle = T.ctaText;
      ctx.font = '600 22px Arial';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(caption.text, CW / 2, py + pH / 2);
    }

    ctx.restore();
  }

  if (cap) {
    const age = t - cap.s;
    const SLIDE_DUR = 0.22;
    const inP = clamp(age / SLIDE_DUR, 0, 1);
    const offsetY = lerp(20, 0, easeOut3(inP));
    renderCap(cap, easeOut3(inP), offsetY);

    // Previous fading out
    if (prev && age < SLIDE_DUR) {
      const outP = clamp(age / SLIDE_DUR, 0, 1);
      renderCap(prev, lerp(1, 0, easeOut3(outP)), lerp(0, -16, easeOut3(outP)));
    }
  }
}

// ── Per-frame render ──────────────────────────────────────────────────────────
function renderFrame(t) {
  const canvas = createCanvas(CW, CH);
  const ctx    = canvas.getContext('2d');

  drawBg(ctx, t);

  const { cur, out } = getActiveBeat(t);

  // Draw outgoing beat (exit animation) first (behind)
  if (out) {
    const { beat, p } = out;
    if (beat.type === 'hook')    drawHook(ctx, beat, p);
    if (beat.type === 'section') drawSection(ctx, beat, p);
    if (beat.type === 'cta')     drawCTA(ctx, beat, p, t);
  }

  // Draw current beat (enter animation) on top
  if (cur) {
    const { beat, p } = cur;
    if (beat.type === 'hook')    drawHook(ctx, beat, p);
    if (beat.type === 'section') drawSection(ctx, beat, p);
    if (beat.type === 'cta')     drawCTA(ctx, beat, p, t);
  }

  drawCaption(ctx, t);

  return canvas.toBuffer('image/png');
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  const tmpDir = path.join(os.tmpdir(), `reel-${Date.now()}`);
  fs.mkdirSync(tmpDir, { recursive: true });

  console.log(`\nRendering ${TOTAL} frames  (${DURATION}s @ ${FPS}fps)...`);
  const t0 = Date.now();

  for (let i = 0; i < TOTAL; i++) {
    const buf = renderFrame(i / FPS);
    fs.writeFileSync(path.join(tmpDir, `f${String(i).padStart(5, '0')}.png`), buf);
    if (i % 48 === 0 || i === TOTAL - 1)
      process.stdout.write(`\r  ${Math.round(i / TOTAL * 100)}%  [${i}/${TOTAL}]`);
  }

  console.log(`\n  Done in ${((Date.now() - t0) / 1000).toFixed(1)}s\n`);
  console.log('Compositing with ffmpeg...\n');

  const fcamFilter    = `[1:v]scale=${CW}:${CH}:force_original_aspect_ratio=increase,crop=${CW}:${CH},setsar=1[fcam]`;
  const filterComplex = `[0:v]scale=${CW}:${CH},setsar=1[anim];${fcamFilter};[anim][fcam]vstack=inputs=2[out]`;

  const r = spawnSync('ffmpeg', [
    '-y',
    '-r',    String(FPS),
    '-i',    path.join(tmpDir, 'f%05d.png'),
    '-i',    VIDEO_PATH,
    '-filter_complex', filterComplex,
    '-map',  '[out]',
    '-map',  '1:a',
    '-c:v',  'libx264', '-crf', '18', '-preset', 'fast', '-pix_fmt', 'yuv420p',
    '-c:a',  'aac', '-b:a', '192k',
    '-shortest',
    OUTPUT_PATH,
  ], { stdio: 'inherit' });

  if (r.status !== 0) throw new Error('ffmpeg composite failed');

  fs.rmSync(tmpDir, { recursive: true });
  console.log(`\nOutput: ${OUTPUT_PATH}`);
}

main().catch(err => { console.error('\nError:', err.message); process.exit(1); });
