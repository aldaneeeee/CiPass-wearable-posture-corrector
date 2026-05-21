import { useEffect, useRef, useState } from 'react';
import type { PostureStatus } from '../lib/types';

interface Props {
  /** raw flex value 0–1023 */
  value: number;
  goodMax: number;
  badMin: number;
  status: PostureStatus;
}

/**
 * Side-profile anatomical mannequin. The lower body (legs + hips) stays
 * planted; the upper body (torso, arms, head) pivots forward around the
 * lumbar spine as the flex sensor reading rises toward the slouching
 * threshold. Subtle gradient layers suggest pecs, deltoids, abs, glutes,
 * tricep and calves without making the figure cartoony.
 */
export default function PostureModel({ value, goodMax, badMin, status }: Props) {
  const min = Math.max(0, goodMax - 100);
  const max = badMin + 100;
  const target = clamp((value - min) / (max - min), 0, 1);
  const slouch = useSmoothed(target, 0.1);

  const isBad = status === 'slouching';
  const idle  = status === 'unknown';

  // Hinge sits at the lumbar spine. Figure faces LEFT so a forward slouch
  // is a counter-clockwise rotation (negative degrees in SVG).
  const HX = 122, HY = 280;
  const rot = -slouch * 22;

  const accent     = isBad ? '#dc2626' : idle ? '#94a3b8' : '#0284c7';
  const tintColor  = isBad ? '#fda4af' : idle ? '#cbd5e1' : '#7dd3fc';
  const shadowEdge = '#a0a8b0';

  return (
    <svg viewBox="0 0 240 600" className="w-full h-full" aria-label="Anatomical posture mannequin">
      <defs>
        <linearGradient id="body-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"  stopColor="#ffffff" />
          <stop offset="55%" stopColor="#f1f4f7" />
          <stop offset="100%" stopColor="#bcc4cb" />
        </linearGradient>
        <linearGradient id="head-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"  stopColor="#ffffff" />
          <stop offset="60%" stopColor="#eef2f6" />
          <stop offset="100%" stopColor="#b4bcc4" />
        </linearGradient>
        <radialGradient id="hl" cx="0.3" cy="0.4" r="0.6">
          <stop offset="0%"  stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="status-tint" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0%"  stopColor={tintColor} stopOpacity="0.55" />
          <stop offset="80%" stopColor={tintColor} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* ====== LOWER BODY (fixed) — hips, legs, feet ====== */}
      <g>
        {/* Pelvis + leg — one continuous silhouette */}
        <path
          d="
            M 95 285
            C 92 305 92 320 96 335
            C 100 360 102 388 102 410
            C 102 440 100 470 104 500
            C 105 520 108 535 108 545
            L 100 555
            L 100 562
            L 78 562
            L 78 555
            C 80 545 86 540 92 538
            L 110 538
            L 132 538
            L 152 538
            L 152 545
            L 152 562
            L 134 562
            L 134 555
            L 130 545
            C 132 530 134 510 134 495
            C 134 465 136 435 142 405
            C 148 370 154 345 158 320
            C 162 305 162 295 156 285
            Z
          "
          fill="url(#body-grad)"
        />

        {/* Glute curve highlight + shadow */}
        <ellipse cx="156" cy="310" rx="6" ry="14" fill="url(#hl)" opacity="0.65" />
        <path d="M 158 297 C 162 310 162 325 158 340"
              stroke={shadowEdge} strokeWidth="1" fill="none" opacity="0.45" />

        {/* Quad highlight */}
        <ellipse cx="116" cy="380" rx="14" ry="32" fill="url(#hl)" opacity="0.55" />

        {/* Knee */}
        <ellipse cx="120" cy="420" rx="20" ry="6" fill="#cdd3d9" opacity="0.35" />
        <path d="M 102 420 C 110 426 134 426 140 420"
              stroke={shadowEdge} strokeWidth="0.8" fill="none" opacity="0.5" />

        {/* Calf bulge */}
        <ellipse cx="142" cy="470" rx="10" ry="22" fill="url(#hl)" opacity="0.5" />
        <path d="M 145 446 C 152 470 150 495 142 515"
              stroke={shadowEdge} strokeWidth="1" fill="none" opacity="0.4" />

        {/* Shin definition */}
        <path d="M 108 445 C 105 470 106 495 110 515"
              stroke={shadowEdge} strokeWidth="0.6" fill="none" opacity="0.3" />

        {/* Ankle */}
        <path d="M 110 535 L 130 535" stroke={shadowEdge} strokeWidth="0.8" opacity="0.4" />
      </g>

      {/* ====== UPPER BODY (rotates) ====== */}
      <g transform={`rotate(${rot} ${HX} ${HY})`}>

        {/* Back arm (hangs at side, hidden behind torso) */}
        <path
          d="
            M 150 145
            C 158 165 162 190 162 215
            C 162 250 158 285 152 315
            C 148 335 144 350 140 360
            L 132 360
            C 134 348 138 332 142 315
            C 146 285 148 250 146 220
            C 144 195 140 170 138 150
            Z
          "
          fill="url(#body-grad)"
        />
        {/* Hand */}
        <ellipse cx="138" cy="370" rx="7" ry="11" fill="url(#body-grad)" />
        {/* Tricep shadow */}
        <path d="M 158 175 C 162 220 162 270 156 310"
              stroke={shadowEdge} strokeWidth="1.2" fill="none" opacity="0.45" />

        {/* TORSO — closed silhouette, waist to shoulders to neck */}
        <path
          d="
            M 92 280
            C 82 268 76 248 76 220
            C 76 192 80 168 88 152
            C 96 144 104 138 112 134
            L 138 134
            C 146 138 152 144 156 152
            C 162 168 164 192 164 220
            C 164 248 160 268 156 280
            Z
          "
          fill="url(#body-grad)"
        />

        {/* Status tint over torso (subtle red/blue wash) */}
        <path
          d="
            M 92 280
            C 82 268 76 248 76 220
            C 76 192 80 168 88 152
            C 96 144 104 138 112 134
            L 138 134
            C 146 138 152 144 156 152
            C 162 168 164 192 164 220
            C 164 248 160 268 156 280
            Z
          "
          fill="url(#status-tint)"
          pointerEvents="none"
        />

        {/* Pec (upper chest) — large soft highlight */}
        <ellipse cx="88" cy="170" rx="14" ry="22" fill="url(#hl)" opacity="0.85"
                 transform="rotate(-12 88 170)" />
        {/* Pec lower fold */}
        <path d="M 78 195 C 80 205 84 212 92 215"
              stroke={shadowEdge} strokeWidth="1.2" fill="none" opacity="0.6" />

        {/* Abs — central line + cuts */}
        <line x1="92" y1="200" x2="92" y2="270" stroke={shadowEdge} strokeWidth="0.9" opacity="0.55" />
        <path d="M 84 220 Q 92 222 100 220" stroke={shadowEdge} strokeWidth="0.7" fill="none" opacity="0.5" />
        <path d="M 84 238 Q 92 240 100 238" stroke={shadowEdge} strokeWidth="0.7" fill="none" opacity="0.5" />
        <path d="M 84 256 Q 92 258 100 256" stroke={shadowEdge} strokeWidth="0.7" fill="none" opacity="0.4" />
        {/* Oblique shadow */}
        <path d="M 80 235 C 76 250 78 270 86 278"
              stroke={shadowEdge} strokeWidth="0.8" fill="none" opacity="0.4" />

        {/* Deltoid (shoulder cap) */}
        <ellipse cx="148" cy="148" rx="11" ry="14" fill="url(#hl)" opacity="0.85" />
        <path d="M 140 138 C 152 138 158 142 158 152"
              stroke={shadowEdge} strokeWidth="0.8" fill="none" opacity="0.4" />

        {/* Front of shoulder / clavicle ridge */}
        <path d="M 100 138 C 108 142 116 144 124 144"
              stroke={shadowEdge} strokeWidth="0.6" fill="none" opacity="0.4" />

        {/* NECK */}
        <path
          d="
            M 100 134
            C 100 122 100 112 104 102
            L 132 102
            C 134 112 136 122 138 134
            Z
          "
          fill="url(#body-grad)"
        />
        <path d="M 105 115 C 110 118 116 119 122 119"
              stroke={shadowEdge} strokeWidth="0.6" fill="none" opacity="0.4" />

        {/* HEAD (bald, side profile facing left) */}
        <path
          d="
            M 104 102
            C 90 100 78 90 76 76
            C 75 65 80 56 86 52
            C 86 40 96 30 110 28
            C 124 28 134 36 138 46
            C 144 52 146 62 144 74
            C 142 86 138 96 132 102
            Z
          "
          fill="url(#head-grad)"
        />
        {/* Head highlight (top-front) */}
        <ellipse cx="105" cy="50" rx="14" ry="10" fill="url(#hl)" opacity="0.8" />

        {/* Brow ridge */}
        <path d="M 78 64 C 84 60 90 60 94 64"
              stroke={shadowEdge} strokeWidth="1" fill="none" opacity="0.5" />
        {/* Nose */}
        <path d="M 78 70 C 74 75 73 80 76 84 L 82 84"
              stroke={shadowEdge} strokeWidth="1.1" fill="none" opacity="0.7" />
        {/* Mouth */}
        <path d="M 84 90 Q 88 92 92 90"
              stroke={shadowEdge} strokeWidth="0.7" fill="none" opacity="0.5" />
        {/* Chin shadow */}
        <path d="M 96 100 Q 100 104 104 102"
              stroke={shadowEdge} strokeWidth="0.6" fill="none" opacity="0.4" />
        {/* Ear */}
        <ellipse cx="126" cy="76" rx="4" ry="7" fill="none" stroke={shadowEdge}
                 strokeWidth="0.9" opacity="0.5" />

        {/* Back contour shading — adds depth to the spine side */}
        <path d="M 158 152 C 165 175 167 220 162 270"
              stroke={shadowEdge} strokeWidth="1.4" fill="none" opacity="0.55" />

        {/* === FLEX SENSOR ON THE BACK === */}
        <g>
          {/* mounting tape */}
          <rect x="159" y="150" width="9" height="125" rx="4"
                fill="#f3f5f7" stroke="#cbd5e1" strokeWidth="0.6" />
          {/* sensor strip */}
          <rect x="161.5" y="155" width="4" height="115" rx="1.5"
                fill={accent} opacity="0.9" />
          {/* contact pads */}
          <circle cx="163.5" cy="155" r="3.2"  fill="#fbbf24" stroke={accent} strokeWidth="0.8" />
          <circle cx="163.5" cy="270" r="3.2"  fill="#fbbf24" stroke={accent} strokeWidth="0.8" />
          {/* mid LED */}
          <circle cx="163.5" cy="212" r="1.6" fill="#ffffff" opacity={isBad ? 1 : 0.9} />
        </g>
      </g>

      {/* === SPINE OVERLAY (visible curve through the back) === */}
      <Spine slouch={slouch} accent={accent} />

      {/* Hinge dot (lumbar pivot) — visual reference */}
      <circle cx={HX + 30} cy={HY} r="2.5" fill={accent} opacity="0.6" />
    </svg>
  );
}

/* ----------------------------------------------------------------------- */
/*  Spine — drawn as a faint dashed Bezier with little vertebrae markers   */
/* ----------------------------------------------------------------------- */

function Spine({ slouch, accent }: { slouch: number; accent: string }) {
  // Sacrum at fixed position; cervical top moves forward & down with slouch.
  const sacrum = { x: 152, y: 290 };
  const lumbar = { x: 148 + slouch * 4, y: 240 };
  const thorac = { x: 154 + slouch * 18, y: 180 };
  const cervic = { x: 138 + slouch * 30, y: 110 + slouch * 16 };

  const d =
    `M ${sacrum.x} ${sacrum.y}
     C ${lumbar.x} ${lumbar.y}, ${thorac.x} ${thorac.y}, ${cervic.x} ${cervic.y}`;

  // sample vertebrae positions
  const verts = Array.from({ length: 18 }, (_, i) => {
    const t = (i + 0.5) / 18;
    return bezier(t, sacrum, lumbar, thorac, cervic);
  });

  return (
    <g pointerEvents="none">
      <path d={d} stroke={accent} strokeWidth="1.4" fill="none"
            strokeDasharray="3 3" opacity="0.5" />
      {verts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="1.6"
                fill={accent} opacity="0.7" />
      ))}
    </g>
  );
}

type Pt = { x: number; y: number };
function bezier(t: number, p0: Pt, p1: Pt, p2: Pt, p3: Pt) {
  const u = 1 - t;
  return {
    x: u*u*u*p0.x + 3*u*u*t*p1.x + 3*u*t*t*p2.x + t*t*t*p3.x,
    y: u*u*u*p0.y + 3*u*u*t*p1.y + 3*u*t*t*p2.y + t*t*t*p3.y,
  };
}

/* ----------------------------------------------------------------------- */
/*  Utilities                                                              */
/* ----------------------------------------------------------------------- */

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function useSmoothed(target: number, k = 0.12) {
  const [v, setV] = useState(target);
  const ref = useRef(target);
  useEffect(() => { ref.current = target; }, [target]);
  useEffect(() => {
    let id: number;
    const tick = () => {
      setV(prev => {
        const next = prev + (ref.current - prev) * k;
        return Math.abs(ref.current - next) < 0.0005 ? ref.current : next;
      });
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [k]);
  return v;
}
