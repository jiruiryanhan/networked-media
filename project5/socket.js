// console.log('Socket.IO io:', typeof io);

const socket = io();
window.serverData = 0;

// socket.on('connect', () => {
//   console.log('Connected to Socket.IO server');
// });

// socket.on('connect_error', (error) => {
//   console.log('Socket.IO connection error:', error.message);
// });

// socket.on('update-variable', (value) => {
//   console.log('Received serverVariable:', value);
//   window.serverData = value;
// });

// socket.on('unlock-repeatable', (data) => {
//   console.log('Unlocking repeatable collectible:', data);
//   socket.emit('update-repeatable', data);
// });

// socket.on('collectibles-updated', (data) => {
//   console.log('Collectibles updated for', data.username, ':', data.collectibles);
// });

// socket.on('disconnect', () => {
//   console.log('Disconnected from Socket.IO server');
// });