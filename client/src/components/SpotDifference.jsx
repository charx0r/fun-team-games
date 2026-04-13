import React, { useEffect, useState } from 'react';

// Shows the modified landmark. At 20s elapsed (10s remaining), pulses a hint glow.
export default function SpotDifference({ image, hintZone, timer, total = 30 }) {
  const elapsed = total - timer;
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    if (elapsed >= 20 && elapsed < 23) setShowHint(true);
    else setShowHint(false);
  }, [elapsed]);

  return (
    <div className="spot-diff">
      <img src={image} alt="landmark" className="spot-image" />
      {showHint && hintZone && (
        <div
          className="spot-hint"
          style={{
            left: hintZone.x,
            top: hintZone.y,
            width: hintZone.radius * 2,
            height: hintZone.radius * 2,
            marginLeft: -hintZone.radius,
            marginTop: -hintZone.radius,
          }}
        />
      )}
    </div>
  );
}
