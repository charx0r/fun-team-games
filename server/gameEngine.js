const { ROUNDS, publicVisualData } = require('./questions');
const { assignTeams } = require('./teamAssigner');

// Configurable phase durations. Override via env vars to shorten the loop
// when iterating on a single round.
const envInt = (name, fallback) => {
  const v = parseInt(process.env[name], 10);
  return Number.isFinite(v) && v >= 0 ? v : fallback;
};
const QUESTION_DURATION = envInt('QUESTION_DURATION', 30);
const TEAM_ASSIGN_DURATION = envInt('TEAM_ASSIGN_DURATION', 5);
const ROUND_INTRO_DURATION = envInt('ROUND_INTRO_DURATION', 4);
const QUESTION_REVEAL_DURATION = envInt('QUESTION_REVEAL_DURATION', 5);
const ROUND_LEADERBOARD_DURATION = envInt('ROUND_LEADERBOARD_DURATION', 6);

// Dev aid: START_ROUND=3 skips to the 3rd round after team assignment.
// Preceding rounds are simply not played; final scores still work normally.
const START_ROUND_INDEX = Math.max(
  0,
  Math.min(ROUNDS.length - 1, envInt('START_ROUND', 1) - 1),
);
if (
  START_ROUND_INDEX !== 0 ||
  QUESTION_DURATION !== 30 ||
  TEAM_ASSIGN_DURATION !== 5 ||
  ROUND_INTRO_DURATION !== 4
) {
  console.warn(
    `[dev] phase overrides: START_ROUND=${START_ROUND_INDEX + 1} ` +
    `QUESTION_DURATION=${QUESTION_DURATION}s ` +
    `TEAM_ASSIGN=${TEAM_ASSIGN_DURATION}s ` +
    `ROUND_INTRO=${ROUND_INTRO_DURATION}s`,
  );
}

const PHASES = {
  LOBBY: 'LOBBY',
  TEAM_ASSIGNMENT: 'TEAM_ASSIGNMENT',
  ROUND_INTRO: 'ROUND_INTRO',
  QUESTION_ACTIVE: 'QUESTION_ACTIVE',
  QUESTION_REVEAL: 'QUESTION_REVEAL',
  ROUND_LEADERBOARD: 'ROUND_LEADERBOARD',
  FINAL_RESULTS: 'FINAL_RESULTS',
};

function makeRoomCode(existing) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code;
  do {
    code = '';
    for (let i = 0; i < 4; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
  } while (existing.has(code));
  return code;
}

function makePlayerId() {
  return 'p_' + Math.random().toString(36).slice(2, 10);
}

function createGameEngine(io) {
  /** @type {Map<string, Room>} */
  const rooms = new Map();

  function createRoom(playerName, socketId) {
    const roomCode = makeRoomCode(rooms);
    const adminId = makePlayerId();
    const player = {
      id: adminId,
      name: playerName,
      socketId,
      teamId: null,
      connected: true,
      score: 0,
    };
    const room = {
      code: roomCode,
      phase: PHASES.LOBBY,
      adminId,
      players: new Map([[adminId, player]]),
      teams: [],
      roundIndex: 0,
      questionIndex: 0,
      currentQuestion: null,
      answers: new Map(), // questionId -> Map<playerId, { answer, timestamp, pointsEarned, correct }>
      timerRemaining: 0,
      timerInterval: null,
      phaseTimeout: null,
      createdAt: Date.now(),
    };
    rooms.set(roomCode, room);
    return { roomCode, playerId: adminId, player };
  }

  function joinRoom(roomCode, playerName, socketId) {
    const code = (roomCode || '').toUpperCase();
    const room = rooms.get(code);
    if (!room) {
      return { error: 'Room not found' };
    }

    // Check for reconnect by name
    const existing = [...room.players.values()].find(
      p => p.name.toLowerCase() === playerName.toLowerCase()
    );
    if (existing) {
      if (existing.connected) {
        return { error: 'That name is already taken in this room.' };
      }
      // Reconnect
      existing.connected = true;
      existing.socketId = socketId;
      return { room, player: existing, reconnected: true };
    }

    if (room.phase !== PHASES.LOBBY) {
      return { error: 'Game in progress — wait for the next round!' };
    }

    const id = makePlayerId();
    const player = {
      id,
      name: playerName,
      socketId,
      teamId: null,
      connected: true,
      score: 0,
    };
    room.players.set(id, player);
    return { room, player };
  }

  function getRoom(code) {
    return rooms.get((code || '').toUpperCase());
  }

  function publicPlayers(room) {
    return [...room.players.values()].map(p => ({
      id: p.id,
      name: p.name,
      teamId: p.teamId,
      connected: p.connected,
      isAdmin: p.id === room.adminId,
    }));
  }

  function publicTeams(room) {
    return room.teams.map(t => ({
      id: t.id,
      name: t.name,
      color: t.color,
      players: t.players.map(p => {
        const pl = room.players.get(p.id);
        return { id: p.id, name: p.name, teamId: t.id, connected: pl?.connected ?? false };
      }),
    }));
  }

  function teamScores(room) {
    return room.teams.map(t => {
      const total = t.players.reduce((sum, tp) => {
        const pl = room.players.get(tp.id);
        return sum + (pl?.score || 0);
      }, 0);
      return {
        teamId: t.id,
        teamName: t.name,
        color: t.color,
        totalScore: total,
      };
    });
  }

  function broadcast(room, event, payload) {
    io.to(room.code).emit(event, payload);
  }

  function clearTimers(room) {
    if (room.timerInterval) clearInterval(room.timerInterval);
    if (room.phaseTimeout) clearTimeout(room.phaseTimeout);
    room.timerInterval = null;
    room.phaseTimeout = null;
  }

  function startGame(room) {
    if (room.phase !== PHASES.LOBBY) return;
    if (room.players.size < 4) return;
    startTeamAssignment(room);
  }

  function startTeamAssignment(room) {
    room.phase = PHASES.TEAM_ASSIGNMENT;
    const playerList = [...room.players.values()];
    room.teams = assignTeams(playerList);
    // Reset scores
    for (const p of room.players.values()) p.score = 0;
    room.roundIndex = START_ROUND_INDEX;
    room.questionIndex = 0;
    broadcast(room, 'teams-assigned', { teams: publicTeams(room) });
    broadcast(room, 'player-joined', { players: publicPlayers(room) });

    clearTimers(room);
    room.phaseTimeout = setTimeout(() => {
      startRoundIntro(room);
    }, TEAM_ASSIGN_DURATION * 1000);
  }

  function startRoundIntro(room) {
    const round = ROUNDS[room.roundIndex];
    if (!round) {
      return startFinalResults(room);
    }
    room.phase = PHASES.ROUND_INTRO;
    room.questionIndex = 0;
    broadcast(room, 'round-intro', {
      roundNumber: round.number,
      roundName: round.name,
      roundType: round.type,
      description: round.description,
    });
    clearTimers(room);
    room.phaseTimeout = setTimeout(() => {
      startQuestion(room);
    }, ROUND_INTRO_DURATION * 1000);
  }

  function startQuestion(room) {
    const round = ROUNDS[room.roundIndex];
    const q = round.questions[room.questionIndex];
    // Per-round duration override (e.g. round 3 is tighter). Falls back
    // to the global QUESTION_DURATION (itself env-overridable).
    const effectiveDuration = Math.max(1, Math.min(round.duration ?? QUESTION_DURATION, QUESTION_DURATION));
    room.phase = PHASES.QUESTION_ACTIVE;
    room.currentQuestion = q;
    room.currentQuestionDuration = effectiveDuration;
    room.questionStartTs = Date.now();
    room.answers.set(q.id, new Map());
    room.timerRemaining = effectiveDuration;

    broadcast(room, 'question-start', {
      questionId: q.id,
      questionNumber: room.questionIndex + 1,
      totalQuestions: round.questions.length,
      roundNumber: round.number,
      roundName: round.name,
      roundType: q.roundType,
      options: q.options,
      duration: effectiveDuration,
      visualData: publicVisualData(q),
    });
    broadcast(room, 'timer-tick', { remaining: room.timerRemaining });

    clearTimers(room);
    room.timerInterval = setInterval(() => {
      room.timerRemaining -= 1;
      broadcast(room, 'timer-tick', { remaining: Math.max(0, room.timerRemaining) });
      if (room.timerRemaining <= 0) {
        clearInterval(room.timerInterval);
        room.timerInterval = null;
        revealQuestion(room);
      }
    }, 1000);
  }

  function revealQuestion(room) {
    const q = room.currentQuestion;
    if (!q) return;
    room.phase = PHASES.QUESTION_REVEAL;
    const answers = room.answers.get(q.id) || new Map();
    const playerResults = {};
    const questionDuration = room.currentQuestionDuration || QUESTION_DURATION;
    // Score: correct=100 + speed bonus up to 50, scaled by this question's
    // actual duration so shorter rounds still hand out the full bonus.
    for (const [pid, entry] of answers) {
      const correct = entry.answer === q.correctAnswer;
      let pts = 0;
      if (correct) {
        const timeRemaining = entry.timeRemaining ?? 0;
        pts = 100 + Math.round(50 * (timeRemaining / questionDuration));
      }
      entry.correct = correct;
      entry.pointsEarned = pts;
      const pl = room.players.get(pid);
      if (pl) pl.score += pts;
      playerResults[pid] = { correct, pointsEarned: pts, answer: entry.answer };
    }
    // Players who didn't answer
    for (const p of room.players.values()) {
      if (!playerResults[p.id]) {
        playerResults[p.id] = { correct: false, pointsEarned: 0, answer: null };
      }
    }

    broadcast(room, 'question-reveal', {
      correctAnswer: q.correctAnswer,
      teamScores: teamScores(room),
      playerResults,
    });

    clearTimers(room);
    const round = ROUNDS[room.roundIndex];
    room.phaseTimeout = setTimeout(() => {
      room.questionIndex += 1;
      if (room.questionIndex >= round.questions.length) {
        startRoundLeaderboard(room);
      } else {
        startQuestion(room);
      }
    }, QUESTION_REVEAL_DURATION * 1000);
  }

  function startRoundLeaderboard(room) {
    room.phase = PHASES.ROUND_LEADERBOARD;
    const round = ROUNDS[room.roundIndex];
    // Compute round score: sum this round's points for each team.
    const roundScoresByTeam = new Map();
    for (const t of room.teams) roundScoresByTeam.set(t.id, 0);
    for (const q of round.questions) {
      const answers = room.answers.get(q.id);
      if (!answers) continue;
      for (const [pid, entry] of answers) {
        const pl = room.players.get(pid);
        if (!pl || !pl.teamId) continue;
        roundScoresByTeam.set(
          pl.teamId,
          (roundScoresByTeam.get(pl.teamId) || 0) + (entry.pointsEarned || 0)
        );
      }
    }
    const standings = teamScores(room)
      .map(ts => ({
        teamId: ts.teamId,
        name: ts.teamName,
        color: ts.color,
        totalScore: ts.totalScore,
        roundScore: roundScoresByTeam.get(ts.teamId) || 0,
      }))
      .sort((a, b) => b.totalScore - a.totalScore)
      .map((t, i) => ({ ...t, rank: i + 1 }));

    // Round winner = highest roundScore
    const roundWinner = [...standings].sort((a, b) => b.roundScore - a.roundScore)[0];

    broadcast(room, 'round-leaderboard', {
      teams: standings,
      roundNumber: round.number,
      roundName: round.name,
      roundWinner: roundWinner ? roundWinner.name : '',
    });

    clearTimers(room);
    room.phaseTimeout = setTimeout(() => {
      room.roundIndex += 1;
      if (room.roundIndex >= ROUNDS.length) {
        startFinalResults(room);
      } else {
        startRoundIntro(room);
      }
    }, ROUND_LEADERBOARD_DURATION * 1000);
  }

  function startFinalResults(room) {
    room.phase = PHASES.FINAL_RESULTS;
    const standings = teamScores(room)
      .map(ts => ({
        teamId: ts.teamId,
        name: ts.teamName,
        color: ts.color,
        totalScore: ts.totalScore,
        roundScore: 0,
      }))
      .sort((a, b) => b.totalScore - a.totalScore)
      .map((t, i) => ({ ...t, rank: i + 1 }));

    // MVP
    let mvp = null;
    for (const p of room.players.values()) {
      if (!mvp || p.score > mvp.score) mvp = p;
    }
    const mvpTeam = mvp ? room.teams.find(t => t.id === mvp.teamId) : null;
    broadcast(room, 'final-results', {
      teams: standings,
      mvp: mvp
        ? {
            playerName: mvp.name,
            teamName: mvpTeam ? mvpTeam.name : 'Unknown',
            totalPoints: mvp.score,
          }
        : null,
    });
    clearTimers(room);
  }

  function resetToLobby(room) {
    clearTimers(room);
    room.phase = PHASES.LOBBY;
    room.teams = [];
    room.roundIndex = 0;
    room.questionIndex = 0;
    room.currentQuestion = null;
    room.answers = new Map();
    for (const p of room.players.values()) {
      p.teamId = null;
      p.score = 0;
    }
    broadcast(room, 'game-reset', {});
    broadcast(room, 'player-joined', { players: publicPlayers(room) });
  }

  function submitAnswer(room, playerId, questionId, answer) {
    if (room.phase !== PHASES.QUESTION_ACTIVE) return { error: 'Too late' };
    const q = room.currentQuestion;
    if (!q || q.id !== questionId) return { error: 'Stale question' };
    const answers = room.answers.get(q.id);
    if (!answers) return { error: 'Not accepting' };
    if (answers.has(playerId)) return { error: 'Already answered' };
    if (!['A', 'B', 'C', 'D'].includes(answer)) return { error: 'Bad answer' };
    answers.set(playerId, {
      answer,
      timestamp: Date.now(),
      timeRemaining: room.timerRemaining,
    });
    return { ok: true };
  }

  function handleDisconnect(socketId) {
    // Find the player and mark disconnected. Promote admin if needed.
    for (const room of rooms.values()) {
      for (const p of room.players.values()) {
        if (p.socketId === socketId) {
          p.connected = false;
          // Admin left? Promote another connected player.
          if (p.id === room.adminId) {
            const next = [...room.players.values()].find(
              x => x.connected && x.id !== p.id
            );
            if (next) room.adminId = next.id;
          }
          // If no one connected, destroy room.
          const anyConnected = [...room.players.values()].some(x => x.connected);
          if (!anyConnected) {
            clearTimers(room);
            rooms.delete(room.code);
          } else {
            broadcast(room, 'player-joined', { players: publicPlayers(room) });
          }
          return { room, player: p };
        }
      }
    }
    return null;
  }

  return {
    rooms,
    PHASES,
    createRoom,
    joinRoom,
    getRoom,
    startGame,
    submitAnswer,
    resetToLobby,
    handleDisconnect,
    publicPlayers,
    publicTeams,
    teamScores,
  };
}

module.exports = { createGameEngine, PHASES };
