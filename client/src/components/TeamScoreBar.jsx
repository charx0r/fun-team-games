import React from 'react';

export default function TeamScoreBar({ teamScores, teams }) {
  const defs = teams && teams.length ? teams : [];
  // Merge colors from teams if scores payload lacks them.
  const merged = defs.map(t => {
    const s = teamScores.find(x => x.teamId === t.id);
    return {
      teamId: t.id,
      name: t.name,
      color: t.color,
      totalScore: s ? s.totalScore : 0,
    };
  });
  const max = Math.max(1, ...merged.map(t => t.totalScore));
  return (
    <div className="team-score-bar">
      {merged.map(t => (
        <div key={t.teamId} className="score-entry">
          <div className="score-entry-head">
            <span className="score-dot" style={{ background: t.color }} />
            <span className="score-name">{t.name}</span>
            <span className="score-total">{t.totalScore}</span>
          </div>
          <div className="score-track">
            <div
              className="score-fill"
              style={{
                width: `${(t.totalScore / max) * 100}%`,
                background: t.color,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
