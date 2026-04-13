import React from 'react';

export default function TeamBadge({ team }) {
  if (!team) return <div className="team-badge">—</div>;
  return (
    <div className="team-badge" style={{ background: team.color }}>
      <span className="team-badge-dot" />
      <span className="team-badge-name">{team.name}</span>
    </div>
  );
}
