import React, { useEffect, useRef } from 'react';

/**
 * Starts at initialZoom, smoothly animates to scale 1 over `duration` seconds.
 * When revealed, snaps to 1 immediately.
 */
export default function ZoomReveal({ image, origin, initialZoom = 8, duration = 30, reveal }) {
  const innerRef = useRef(null);
  const rafRef = useRef(null);
  const startRef = useRef(null);

  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    if (reveal) {
      el.style.transform = 'scale(1)';
      return;
    }
    startRef.current = performance.now();
    function step(now) {
      const t = Math.min(1, (now - startRef.current) / (duration * 1000));
      const eased = t; // linear looks best for steady zoom out
      const scale = initialZoom + (1 - initialZoom) * eased;
      el.style.transform = `scale(${scale})`;
      if (t < 1) rafRef.current = requestAnimationFrame(step);
    }
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [image, initialZoom, duration, reveal]);

  return (
    <div className="zoom-reveal">
      <div
        ref={innerRef}
        className="zoom-inner"
        style={{
          backgroundImage: `url(${image})`,
          transformOrigin: `${origin.x} ${origin.y}`,
          transform: `scale(${initialZoom})`,
        }}
      />
    </div>
  );
}
