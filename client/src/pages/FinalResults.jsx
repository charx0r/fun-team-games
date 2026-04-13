import React from 'react';
import socket from '../socket.js';
import Podium from '../components/Podium.jsx';
import Confetti from '../components/Confetti.jsx';

export default function FinalResults({ ctx }) {
  const { finalData, isAdmin, roomCode } = ctx;
  if (!finalData) return null;
  const playAgain = () => socket.emit('play-again', { roomCode });
  return (
    <div className="screen final-results">
      <Confetti />
      <div className="final-title">🏆 Game Over!</div>
      <Podium teams={finalData.teams} />
      {finalData.mvp && (
        <div className="mvp-card">
          <div className="mvp-label">MVP</div>
          <div className="mvp-name">{finalData.mvp.playerName}</div>
          <div className="mvp-team">from {finalData.mvp.teamName}</div>
          <div className="mvp-points">{finalData.mvp.totalPoints} points</div>
        </div>
      )}
      <div className="final-table">
        <div className="final-table-title">All teams</div>
        {finalData.teams.map(t => (
          <div key={t.teamId} className="final-row">
            <span className="final-rank">#{t.rank}</span>
            <span className="final-name" style={{ color: t.color }}>{t.name}</span>
            <span className="final-score">{t.totalScore}</span>
          </div>
        ))}
      </div>
      {isAdmin && (
        <button className="btn btn-primary btn-large" onClick={playAgain} style={{ marginTop: 20 }}>
          Play Again
        </button>
      )}
    </div>
  );
}
