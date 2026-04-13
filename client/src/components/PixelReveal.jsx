import React, { useEffect, useRef, useState } from 'react';

/**
 * Canvas-based pixel reveal. Loads the source image, then each frame
 * downsamples it to a small resolution and scales the result up with
 * nearest-neighbour interpolation so pixels look chunky rather than blurry.
 *
 * Resolution is interpolated in log space so the reveal feels smooth:
 * at t=0 we're at startResolution (e.g. 6px), at t=duration we're at
 * endResolution (e.g. 500px, effectively full image).
 *
 * Uses a local performance.now() clock so animation is per-frame smooth
 * regardless of how often timer-tick fires from the server.
 */
export default function PixelReveal({
  image,
  startResolution = 6,
  endResolution = 500,
  duration = 30,
  reveal = false,
}) {
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const offscreenRef = useRef(null);
  const rafRef = useRef(null);
  const startTimeRef = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  // Load the source image once per image path. Stamps startTimeRef
  // synchronously in onload so the render loop (below) always sees a
  // fresh start time paired with the new image — without this the old
  // render loop can tick with a stale startTimeRef while React is still
  // in the middle of flushing setLoaded(false) from a prior question,
  // producing an "instant full reveal" on question change.
  useEffect(() => {
    setLoaded(false);
    setError(false);
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      imgRef.current = img;
      startTimeRef.current = performance.now();
      setLoaded(true);
    };
    img.onerror = () => setError(true);
    img.src = image;
    return () => {
      imgRef.current = null;
    };
  }, [image]);

  // Main render loop. `image` is in the dep list so the loop tears down
  // and re-establishes when moving to the next question, picking up the
  // fresh startTimeRef set in onload above.
  useEffect(() => {
    if (!loaded) return;
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!offscreenRef.current) offscreenRef.current = document.createElement('canvas');
    const off = offscreenRef.current;
    const offCtx = off.getContext('2d');

    function sizeCanvas() {
      // Match canvas backing-store to its CSS size for crisp rendering.
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.round(rect.width * dpr));
      const h = Math.max(1, Math.round(rect.height * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      return { w, h };
    }

    function drawAt(resolution) {
      const { w, h } = sizeCanvas();
      const imgAspect = img.naturalWidth / img.naturalHeight;
      const canvasAspect = w / h;

      // Contain fit — keep full image visible, centered.
      let drawW = w;
      let drawH = h;
      if (imgAspect > canvasAspect) {
        drawH = Math.round(w / imgAspect);
      } else {
        drawW = Math.round(h * imgAspect);
      }
      const offsetX = Math.round((w - drawW) / 2);
      const offsetY = Math.round((h - drawH) / 2);

      // How many sample cells along each axis, scaled by aspect ratio.
      // `resolution` is the long-edge cell count.
      const longEdge = Math.max(drawW, drawH);
      const sampleW = Math.max(1, Math.round((drawW / longEdge) * resolution));
      const sampleH = Math.max(1, Math.round((drawH / longEdge) * resolution));

      off.width = sampleW;
      off.height = sampleH;

      // Smooth downscale into the tiny offscreen canvas.
      offCtx.imageSmoothingEnabled = true;
      offCtx.imageSmoothingQuality = 'medium';
      offCtx.drawImage(img, 0, 0, sampleW, sampleH);

      // Chunky upscale onto the visible canvas.
      ctx.fillStyle = '#161616';
      ctx.fillRect(0, 0, w, h);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(off, 0, 0, sampleW, sampleH, offsetX, offsetY, drawW, drawH);
    }

    function currentResolution() {
      if (reveal) return endResolution;
      // Safety net: if onload somehow hasn't stamped the ref yet, start
      // the clock right now (elapsed = 0) rather than blow up to Infinity.
      if (startTimeRef.current == null) startTimeRef.current = performance.now();
      const elapsed = (performance.now() - startTimeRef.current) / 1000;
      const progress = Math.max(0, Math.min(1, elapsed / duration));
      // Log-space interpolation so each visible "step" feels even.
      const logStart = Math.log(startResolution);
      const logEnd = Math.log(endResolution);
      return Math.exp(logStart + (logEnd - logStart) * progress);
    }

    function frame() {
      drawAt(currentResolution());
      if (!reveal) rafRef.current = requestAnimationFrame(frame);
    }

    // Kick off — render once, then loop if not revealed.
    rafRef.current = requestAnimationFrame(frame);

    const onResize = () => drawAt(currentResolution());
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', onResize);
    };
  }, [loaded, reveal, duration, startResolution, endResolution, image]);

  if (error) {
    return (
      <div className="pixel-missing">
        <div>⚠️ Image not found</div>
        <div className="pixel-missing-hint">
          Add photos to <code>client/public/assets/celebrities/</code>
        </div>
      </div>
    );
  }

  return <canvas ref={canvasRef} className="pixel-canvas" />;
}
