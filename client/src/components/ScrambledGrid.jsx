import React, { useMemo } from 'react';

// Seeded pseudo-random (mulberry32).
function seededShuffle(arr, seed) {
  let t = seed >>> 0;
  function rand() {
    t += 0x6D2B79F5;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  }
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Renders image as a 4x4 grid of tiles shuffled via seed.
 * At hintLevel 0: all tiles scrambled.
 * At hintLevel 1: first 4 tiles snap to correct position.
 * At hintLevel 2: first 8 tiles snap to correct position.
 * At hintLevel 'reveal': all tiles in correct position.
 */
export default function ScrambledGrid({ image, seed, hintLevel }) {
  const size = 4;
  const positions = useMemo(() => {
    const correct = Array.from({ length: size * size }, (_, i) => i);
    const scrambled = seededShuffle(correct, seed);
    return { correct, scrambled };
  }, [seed]);

  // Build a mapping: tile (which slice of the image) -> displayed cell (grid position).
  // Simplest: each grid cell displays tile `scrambled[cellIndex]`.
  // At hint levels, progressively replace scrambled[i] with correct[i] for i < threshold.
  const threshold =
    hintLevel === 'reveal' ? size * size : hintLevel === 2 ? 8 : hintLevel === 1 ? 4 : 0;

  const cellImages = positions.scrambled.map((tileIdx, cellIdx) =>
    cellIdx < threshold ? cellIdx : tileIdx
  );

  return (
    <div className="scrambled-grid">
      {cellImages.map((tileIdx, cellIdx) => {
        const row = Math.floor(tileIdx / size);
        const col = tileIdx % size;
        return (
          <div
            key={cellIdx}
            className="tile"
            style={{
              backgroundImage: `url(${image})`,
              backgroundSize: `${size * 100}% ${size * 100}%`,
              backgroundPosition: `${(col / (size - 1)) * 100}% ${(row / (size - 1)) * 100}%`,
              transition: 'background-position 0.6s ease',
            }}
          />
        );
      })}
    </div>
  );
}
