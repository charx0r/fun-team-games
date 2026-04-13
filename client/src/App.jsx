import React, { useEffect, useState } from 'react';
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

  useEffect(() => {
    function onRoomCreated({ roomCode, playerId }) {
      setRoomCode(roomCode);
      setPlayerId(playerId);
      setIsAdmin(true);
      setView('lobby');
    }
    function onJoinConfirmed({ roomCode, playerId }) {
      setRoomCode(roomCode);
      setPlayerId(playerId);
      setView('lobby');
    }
    function onJoinError({ message }) {
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

  switch (view) {
    case 'home':
      return <Home error={error} />;
    case 'lobby':
      return <Lobby ctx={ctx} />;
    case 'teams':
      return <TeamReveal ctx={ctx} />;
    case 'roundIntro':
      return <RoundIntro ctx={ctx} />;
    case 'game':
    case 'reveal':
      return <Game ctx={ctx} phase={view} />;
    case 'leaderboard':
      return <Leaderboard ctx={ctx} />;
    case 'final':
      return <FinalResults ctx={ctx} />;
    default:
      return <Home error={error} />;
  }
}
