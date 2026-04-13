import React from 'react';

const ICONS = {
  scrambled: '🧩',
  zoom: '🔍',
  jigsaw: '🗺️',
  whatsWrong: '🕵️',
};

export default function RoundIntro({ ctx }) {
  const { roundInfo } = ctx;
  if (!roundInfo) return null;
  return (
    <div className="screen round-intro">
      <div className="ri-card">
        <div className="ri-round">Round {roundInfo.roundNumber}</div>
        <div className="ri-icon">{ICONS[roundInfo.roundType] || '🌍'}</div>
        <div className="ri-name">{roundInfo.roundName}</div>
        <div className="ri-desc">{roundInfo.description}</div>
      </div>
    </div>
  );
}
