import { io } from 'socket.io-client';

// In dev Vite proxies /socket.io to localhost:3000.
// In production the client is served from the same origin.
// Keep trying forever on drops — WiFi blips on phones/laptops can last a
// while, and the server is tolerant of a player rejoining by name.
const socket = io({
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 500,
  reconnectionDelayMax: 5000,
  timeout: 10000,
});

export default socket;
