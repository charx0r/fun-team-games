import React, { useState } from 'react';
import socket from '../socket.js';

export default function Home({ error }) {
  const [mode, setMode] = useState(null); // 'create' | 'join'
  const [name, setName] = useState('');
  const [code, setCode] = useState('');

  function createRoom(e) {
    e.preventDefault();
    if (!name.trim()) return;
    socket.emit('create-room', { playerName: name.trim() });
  }
  function joinRoom(e) {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;
    socket.emit('join-room', { playerName: name.trim(), roomCode: code.trim().toUpperCase() });
  }

  return (
    <div className="screen home">
      <div className="home-card">
        <h1 className="home-title">
          <span className="globe">🌍</span> GeoQuest
        </h1>
        <p className="home-tag">Multiplayer geography puzzle game for team meetings</p>

        {!mode && (
          <div className="home-buttons">
            <button className="btn btn-primary" onClick={() => setMode('create')}>
              Create Room
            </button>
            <button className="btn btn-ghost" onClick={() => setMode('join')}>
              Join Room
            </button>
          </div>
        )}

        {mode === 'create' && (
          <form className="home-form" onSubmit={createRoom}>
            <label>Your name</label>
            <input
              autoFocus
              maxLength={20}
              placeholder="e.g. Ada"
              value={name}
              onChange={e => setName(e.target.value)}
            />
            <div className="home-buttons">
              <button className="btn btn-primary" type="submit" disabled={!name.trim()}>
                Create &amp; become Admin
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setMode(null)}>
                Back
              </button>
            </div>
          </form>
        )}

        {mode === 'join' && (
          <form className="home-form" onSubmit={joinRoom}>
            <label>Your name</label>
            <input
              autoFocus
              maxLength={20}
              placeholder="e.g. Ada"
              value={name}
              onChange={e => setName(e.target.value)}
            />
            <label>Room code</label>
            <input
              maxLength={4}
              placeholder="GQ7X"
              style={{ textTransform: 'uppercase', letterSpacing: '0.25em', textAlign: 'center' }}
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
            />
            <div className="home-buttons">
              <button className="btn btn-primary" type="submit" disabled={!name.trim() || code.length < 4}>
                Join
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setMode(null)}>
                Back
              </button>
            </div>
          </form>
        )}

        {error && <div className="error-banner">{error}</div>}
        <div className="home-footnote">Best with 4–16 players on the same WiFi</div>
      </div>
    </div>
  );
}
