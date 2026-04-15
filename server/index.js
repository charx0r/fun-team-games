const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const { Server } = require('socket.io');
const { createGameEngine } = require('./gameEngine');
const { publicVisualData } = require('./questions');

const PORT = process.env.PORT || 3000;

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

const engine = createGameEngine(io);

// In production, serve the built client.
const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));
// Also serve SVG assets from client/src/assets (covers dev or if not bundled).
app.use('/assets', express.static(path.join(__dirname, '..', 'client', 'public', 'assets')));

app.get('/health', (_req, res) => res.json({ ok: true, rooms: engine.rooms.size }));

app.get('*', (_req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'), err => {
    if (err) res.status(200).send('Squint Games server running. Build the client with `npm run build`.');
  });
});

io.on('connection', socket => {
  socket.on('create-room', ({ playerName }) => {
    const name = String(playerName || '').trim().slice(0, 20);
    if (!name) return socket.emit('join-error', { message: 'Name is required.' });
    const { roomCode, playerId } = engine.createRoom(name, socket.id);
    socket.join(roomCode);
    socket.data.roomCode = roomCode;
    socket.data.playerId = playerId;
    socket.emit('room-created', { roomCode, playerId, playerName: name });
    const room = engine.getRoom(roomCode);
    io.to(roomCode).emit('player-joined', { players: engine.publicPlayers(room) });
  });

  socket.on('join-room', ({ roomCode, playerName }) => {
    const name = String(playerName || '').trim().slice(0, 20);
    if (!name) return socket.emit('join-error', { message: 'Name is required.' });
    const code = String(roomCode || '').toUpperCase().trim();
    const result = engine.joinRoom(code, name, socket.id);
    if (result.error) {
      return socket.emit('join-error', { message: result.error });
    }
    const { room, player } = result;
    socket.join(room.code);
    socket.data.roomCode = room.code;
    socket.data.playerId = player.id;
    socket.emit('join-confirmed', {
      playerId: player.id,
      roomCode: room.code,
      playerName: player.name,
    });
    io.to(room.code).emit('player-joined', { players: engine.publicPlayers(room) });

    // If reconnecting mid-game, send them the current phase snapshot.
    if (result.reconnected && room.phase !== 'LOBBY') {
      if (room.teams.length) {
        socket.emit('teams-assigned', { teams: engine.publicTeams(room) });
      }
      if (room.phase === 'QUESTION_ACTIVE' && room.currentQuestion) {
        const q = room.currentQuestion;
        socket.emit('question-start', {
          questionId: q.id,
          questionNumber: room.questionIndex + 1,
          roundNumber: room.roundIndex + 1,
          roundType: q.roundType,
          options: q.options,
          duration: 30,
          visualData: publicVisualData(q),
        });
        socket.emit('timer-tick', { remaining: room.timerRemaining });
      }
    }
  });

  socket.on('start-game', ({ roomCode }) => {
    const room = engine.getRoom(roomCode);
    if (!room) return;
    if (socket.data.playerId !== room.adminId) return;
    engine.startGame(room);
  });

  socket.on('submit-answer', ({ roomCode, questionId, answer }) => {
    const room = engine.getRoom(roomCode);
    if (!room) return;
    const playerId = socket.data.playerId;
    if (!playerId) return;
    const result = engine.submitAnswer(room, playerId, questionId, answer);
    if (result.ok) {
      socket.emit('answer-ack', { playerId });
    }
  });

  socket.on('play-again', ({ roomCode }) => {
    const room = engine.getRoom(roomCode);
    if (!room) return;
    if (socket.data.playerId !== room.adminId) return;
    engine.resetToLobby(room);
  });

  socket.on('disconnect', () => {
    engine.handleDisconnect(socket.id);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🌍 Squint Games server running on port ${PORT}`);
  console.log(`   Local:   http://localhost:${PORT}`);
  console.log(`   Network: find your LAN IP and share http://<your-ip>:${PORT}\n`);
});
