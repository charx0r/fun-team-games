import { io } from 'socket.io-client';

// In dev Vite proxies /socket.io to localhost:3000.
// In production the client is served from the same origin.
const socket = io({ autoConnect: true });

export default socket;
