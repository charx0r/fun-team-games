import React, { useEffect } from 'react';
import { sounds } from '../sounds.js';

export default function Leaderboard({ ctx }) {
  const { leaderboard, myTeam } = ctx;
  useEffect(() => {
    sounds.roundDone();
  }, []);
  if (!leaderboard) return null;
  const max = Math.max(1, ...leaderboard.teams.map(t => t.totalScore));
  return (
    <div className="screen leaderboard">
      <div className="lb-title">
        Round {leaderboard.roundNumber} Complete
      </div>
      <div className="lb-sub">
        Round winner: <strong>{leaderboard.roundWinner} 🎉</strong>
      </div>
      <div className="lb-bars">
        {leaderboard.teams.map(t => {
          const isMine = myTeam && myTeam.id === t.teamId;
          return (
            <div key={t.teamId} className={`lb-row ${isMine ? 'mine' : ''}`}>
              <div className="lb-rank">#{t.rank}</div>
              <div className="lb-name" style={{ color: t.color }}>{t.name}</div>
              <div className="lb-track">
                <div
                  className="lb-fill"
                  style={{
                    width: `${(t.totalScore / max) * 100}%`,
                    background: t.color,
                  }}
                />
              </div>
              <div className="lb-score">
                {t.totalScore}
                <span className="lb-round-delta">+{t.roundScore}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
