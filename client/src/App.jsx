import React, { useEffect, useRef, useState } from 'react';
import socket from './socket.js';
import Home from './pages/Home.jsx';
import Lobby from './pages/Lobby.jsx';
import Game from './pages/Game.jsx';
import RoundIntro from './pages/RoundIntro.jsx';
import Leaderboard from './pages/Leaderboard.jsx';
import FinalResults from './pages/FinalResults.jsx';
import TeamReveal from './pages/TeamReveal.jsx';

// Top-level app: owns socket event subscriptions and routes by phase.
export default function App() {
  const [view, setView] = useState('home'); // home | lobby | teams | roundIntro | game | reveal | leaderboard | final
  const [roomCode, setRoomCode] = useState('');
  const [playerId, setPlayerId] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [roundInfo, setRoundInfo] = useState(null);
  const [question, setQuestion] = useState(null);
  const [timer, setTimer] = useState(30);
  const [reveal, setReveal] = useState(null);
  const [leaderboard, setLeaderboard] = useState(null);
  const [finalData, setFinalData] = useState(null);
  const [teamScores, setTeamScores] = useState([]);
  const [error, setError] = useState('');
  // 'online' once we've connected at least once; 'reconnecting' while the
  // socket is dropped and retrying; 'offline' only before we ever connect.
  const [connStatus, setConnStatus] = useState(
    socket.connected ? 'online' : 'offline'
  );
  // Latest room+name, kept in a ref so the socket 'connect' handler (which is
  // registered once and closes over state) can always see current values.
  const sessionRef = useRef({ roomCode: '', playerName: '' });
  // True while we're explicitly trying to resume a previous session. Used to
  // route join-errors to "room gone, bounce home" instead of the normal
  // transient error banner.
  const reconnectingRef = useRef(false);

  useEffect(() => {
    function onRoomCreated({ roomCode, playerId, playerName }) {
      setRoomCode(roomCode);
      setPlayerId(playerId);
      sessionRef.current = { roomCode, playerName: playerName || '' };
      setIsAdmin(true);
      setView('lobby');
    }
    function onJoinConfirmed({ roomCode, playerId, playerName }) {
      setRoomCode(roomCode);
      setPlayerId(playerId);
      sessionRef.current = {
        roomCode,
        playerName: playerName || sessionRef.current.playerName,
      };
      // A reconnect resume also emits join-confirmed. Don't clobber the
      // current view back to 'lobby' — the phase-specific events that
      // follow (teams-assigned, question-start, …) will route us. If we
      // were still on 'home' it means this is a first-time join.
      if (reconnectingRef.current) {
        reconnectingRef.current = false;
        setConnStatus('online');
      } else {
        setView('lobby');
      }
    }
    function onJoinError({ message }) {
      // If this error came back in response to a reconnect attempt, the
      // room was likely torn down (last player left → room deleted). Bail
      // all the way back to home instead of silently flashing a banner.
      if (reconnectingRef.current) {
        reconnectingRef.current = false;
        sessionRef.current = { roomCode: '', playerName: '' };
        setConnStatus('online');
        setRoomCode('');
        setPlayerId(null);
        setIsAdmin(false);
        setPlayers([]);
        setTeams([]);
        setRoundInfo(null);
        setQuestion(null);
        setReveal(null);
        setLeaderboard(null);
        setFinalData(null);
        setView('home');
        setError(message || 'Lost connection to the room.');
        setTimeout(() => setError(''), 6000);
        return;
      }
      setError(message);
      setTimeout(() => setError(''), 4000);
    }
    function onPlayerJoined({ players }) {
      setPlayers(players);
      // Detect admin from list
      const me = players.find(p => p.id === playerId);
      if (me) setIsAdmin(!!me.isAdmin);
    }
    function onTeamsAssigned({ teams }) {
      setTeams(teams);
      setView('teams');
    }
    function onRoundIntro(payload) {
      setRoundInfo(payload);
      setView('roundIntro');
    }
    function onQuestionStart(payload) {
      setQuestion(payload);
      setReveal(null);
      setTimer(payload.duration);
      setView('game');
    }
    function onTimerTick({ remaining }) {
      setTimer(remaining);
    }
    function onQuestionReveal(payload) {
      setReveal(payload);
      setTeamScores(payload.teamScores || []);
      setView('reveal');
    }
    function onRoundLeaderboard(payload) {
      setLeaderboard(payload);
      setView('leaderboard');
    }
    function onFinalResults(payload) {
      setFinalData(payload);
      setView('final');
    }
    function onGameReset() {
      setTeams([]);
      setRoundInfo(null);
      setQuestion(null);
      setReveal(null);
      setLeaderboard(null);
      setFinalData(null);
      setView('lobby');
    }

    socket.on('room-created', onRoomCreated);
    socket.on('join-confirmed', onJoinConfirmed);
    socket.on('join-error', onJoinError);
    socket.on('player-joined', onPlayerJoined);
    socket.on('teams-assigned', onTeamsAssigned);
    socket.on('round-intro', onRoundIntro);
    socket.on('question-start', onQuestionStart);
    socket.on('timer-tick', onTimerTick);
    socket.on('question-reveal', onQuestionReveal);
    socket.on('round-leaderboard', onRoundLeaderboard);
    socket.on('final-results', onFinalResults);
    socket.on('game-reset', onGameReset);

    return () => {
      socket.off('room-created', onRoomCreated);
      socket.off('join-confirmed', onJoinConfirmed);
      socket.off('join-error', onJoinError);
      socket.off('player-joined', onPlayerJoined);
      socket.off('teams-assigned', onTeamsAssigned);
      socket.off('round-intro', onRoundIntro);
      socket.off('question-start', onQuestionStart);
      socket.off('timer-tick', onTimerTick);
      socket.off('question-reveal', onQuestionReveal);
      socket.off('round-leaderboard', onRoundLeaderboard);
      socket.off('final-results', onFinalResults);
      socket.off('game-reset', onGameReset);
    };
  }, [playerId]);

  // Connection lifecycle: if the socket drops, Socket.IO keeps trying to
  // reconnect the transport. Once it's back, if we had an active session
  // we re-emit join-room so the server can flip our existing player entry
  // back to connected (it already supports reconnect-by-name) and replay
  // the current phase snapshot. Without this the user would just sit on a
  // stale view and show as greyed-out to everyone else forever.
  useEffect(() => {
    function onConnect() {
      const { roomCode: rc, playerName: pn } = sessionRef.current;
      if (rc && pn) {
        reconnectingRef.current = true;
        setConnStatus('reconnecting');
        socket.emit('join-room', { roomCode: rc, playerName: pn });
      } else {
        setConnStatus('online');
      }
    }
    function onDisconnect() {
      // Only surface a reconnect state if we actually had a session going.
      // Someone sitting on the home screen doesn't need a red banner.
      if (sessionRef.current.roomCode) {
        setConnStatus('reconnecting');
      } else {
        setConnStatus('offline');
      }
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    // If the socket is already connected before this effect runs (common —
    // autoConnect is true), fire onConnect once so status is correct.
    if (socket.connected) setConnStatus('online');

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  const myTeam = teams.find(t => t.players.some(p => p.id === playerId)) || null;

  const ctx = {
    roomCode,
    playerId,
    isAdmin,
    players,
    teams,
    myTeam,
    roundInfo,
    question,
    timer,
    reveal,
    leaderboard,
    finalData,
    teamScores,
    error,
  };

  let page;
  switch (view) {
    case 'home':
      page = <Home error={error} />;
      break;
    case 'lobby':
      page = <Lobby ctx={ctx} />;
      break;
    case 'teams':
      page = <TeamReveal ctx={ctx} />;
      break;
    case 'roundIntro':
      page = <RoundIntro ctx={ctx} />;
      break;
    case 'game':
    case 'reveal':
      page = <Game ctx={ctx} phase={view} />;
      break;
    case 'leaderboard':
      page = <Leaderboard ctx={ctx} />;
      break;
    case 'final':
      page = <FinalResults ctx={ctx} />;
      break;
    default:
      page = <Home error={error} />;
  }

  return (
    <>
      {page}
      {connStatus === 'reconnecting' && (
        <div className="reconnect-banner" role="status" aria-live="polite">
          <span className="reconnect-dot" /> Reconnecting…
        </div>
      )}
    </>
  );
}
