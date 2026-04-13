import React from 'react';

export default function TeamReveal({ ctx }) {
  const { teams, playerId } = ctx;
  return (
    <div className="screen team-reveal">
      <div className="reveal-title">Team Assignments</div>
      <div className="teams-grid" style={{ gridTemplateColumns: `repeat(${teams.length}, 1fr)` }}>
        {teams.map((team, i) => (
          <div
            key={team.id}
            className="team-column"
            style={{
              borderTop: `6px solid ${team.color}`,
              animationDelay: `${i * 0.15}s`,
            }}
          >
            <div className="team-name" style={{ color: team.color }}>
              {team.name}
            </div>
            <div className="team-members">
              {team.players.map((p, idx) => (
                <div
                  key={p.id}
                  className={`team-member ${p.id === playerId ? 'me' : ''}`}
                  style={{ animationDelay: `${i * 0.15 + idx * 0.08 + 0.3}s` }}
                >
                  {p.name}
                  {p.id === playerId && <span className="you-tag">you</span>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="reveal-sub">Game starting…</div>
    </div>
  );
}
