import React, { useEffect, useMemo, useRef, useState } from 'react';

function seededRand(seed) {
  let t = seed >>> 0;
  return function () {
    t += 0x6D2B79F5;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

// Drifts pieces from scattered random positions toward their correct positions.
// At t=0: 100% scattered. At t=30s (pre-reveal): ~70% assembled. At reveal: 100%.
export default function JigsawPuzzle({ pieces, viewBox, seed, duration = 30, reveal }) {
  const rafRef = useRef();
  const startRef = useRef();
  const [progress, setProgress] = useState(0);

  const starts = useMemo(() => {
    const rand = seededRand(seed);
    // Derive VB dimensions
    const [, , vbW, vbH] = (viewBox || '0 0 300 300').split(' ').map(Number);
    return pieces.map(() => {
      const dx = (rand() - 0.5) * vbW * 1.2;
      const dy = (rand() - 0.5) * vbH * 1.2;
      const rot = (rand() - 0.5) * 160;
      return { dx, dy, rot };
    });
  }, [pieces, seed, viewBox]);

  useEffect(() => {
    if (reveal) {
      setProgress(1);
      return;
    }
    startRef.current = performance.now();
    function step(now) {
      const t = Math.min(1, (now - startRef.current) / (duration * 1000));
      // Ease-in: pieces accelerate in the last 10s. Use cubic ease-in.
      const eased = t * t;
      // Cap at 0.7 while game active; full on reveal.
      setProgress(Math.min(0.7, eased * 0.7));
      if (t < 1) rafRef.current = requestAnimationFrame(step);
    }
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [seed, duration, reveal]);

  const p = reveal ? 1 : progress;

  return (
    <div className="jigsaw">
      <svg viewBox={viewBox} preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: '100%' }}>
        {pieces.map((piece, i) => {
          const s = starts[i];
          const dx = s.dx * (1 - p);
          const dy = s.dy * (1 - p);
          const rot = s.rot * (1 - p);
          return (
            <g
              key={piece.id || i}
              style={{
                transform: `translate(${dx}px, ${dy}px) rotate(${rot}deg)`,
                transformOrigin: `${piece.correctX}px ${piece.correctY}px`,
                transition: reveal ? 'transform 0.5s ease-out' : 'none',
              }}
            >
              <path
                d={piece.pathData}
                fill="#60A5FA"
                stroke="#1E40AF"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
