import React from 'react';

export default function Timer({ remaining, total = 30 }) {
  const color =
    remaining <= 10 ? '#EF4444' : remaining <= 15 ? '#EAB308' : '#10B981';
  const pct = Math.max(0, Math.min(1, remaining / total));
  const circumference = 2 * Math.PI * 20;
  const dash = circumference * pct;
  return (
    <div className="timer" style={{ color }}>
      <svg width="52" height="52" viewBox="0 0 50 50">
        <circle cx="25" cy="25" r="20" fill="none" stroke="#334155" strokeWidth="4" />
        <circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          transform="rotate(-90 25 25)"
          style={{ transition: 'stroke-dasharray 1s linear, stroke 0.3s' }}
        />
      </svg>
      <span className="timer-text">{String(Math.max(0, remaining)).padStart(2, '0')}</span>
    </div>
  );
}
