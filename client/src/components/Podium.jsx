import React from 'react';

// Renders podium with top 3 teams. Layout: 2nd left, 1st center (tall), 3rd right.
export default function Podium({ teams }) {
  const top3 = teams.slice(0, 3);
  const order = [top3[1], top3[0], top3[2]].filter(Boolean);
  const heights = { 1: 200, 2: 140, 3: 100 };
  return (
    <div className="podium">
      {order.map((t, i) => (
        <div
          key={t.teamId}
          className={`podium-block rank-${t.rank}`}
          style={{
            height: heights[t.rank] || 80,
            background: t.color,
            animationDelay: `${i * 0.25}s`,
          }}
        >
          <div className="podium-rank">#{t.rank}</div>
          <div className="podium-name">{t.name}</div>
          <div className="podium-score">{t.totalScore}</div>
        </div>
      ))}
    </div>
  );
}
