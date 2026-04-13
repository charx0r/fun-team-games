import React from 'react';
import socket from '../socket.js';

export default function Lobby({ ctx }) {
  const { roomCode, playerId, isAdmin, players } = ctx;
  const canStart = players.length >= 4;

  function startGame() {
    socket.emit('start-game', { roomCode });
  }

  return (
    <div className="screen lobby">
      <div className="lobby-hero">
        <div className="lobby-label">Room code</div>
        <div className="room-code">{roomCode}</div>
        <div className="lobby-instruction">
          Share this code with your team — they can join from <code>/</code>
        </div>
      </div>

      <div className="lobby-players">
        <div className="section-title">
          Players <span className="badge">{players.length}</span>
        </div>
        <div className="player-grid">
          {players.map(p => (
            <div key={p.id} className={`player-chip ${p.id === playerId ? 'me' : ''}`}>
              <span className="dot" style={{ background: p.connected ? '#2ECDA7' : '#6B6560' }} />
              {p.name}
              {p.isAdmin && <span className="admin-tag">admin</span>}
              {p.id === playerId && <span className="you-tag">you</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="lobby-footer">
        {isAdmin ? (
          <button className="btn btn-primary btn-large" disabled={!canStart} onClick={startGame}>
            {canStart ? 'Start Game' : `Need ${4 - players.length} more player${players.length === 3 ? '' : 's'}…`}
          </button>
        ) : (
          <div className="waiting">Waiting for host to start…</div>
        )}
      </div>
    </div>
  );
}
