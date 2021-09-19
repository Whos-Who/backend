import { Server } from 'socket.io';
import { intializeGameListeners } from './listeners/game';
import { intializeRoomListeners } from './listeners/room';
import {
  disconnectPlayerFromGame,
  getLatestPlayerActivity
} from './middleware/playerActivity';

export const initializeWebSockets = (server) => {
  const io = new Server(server, {
    cors: {
      origin: '*',
      method: ['GET', 'POST']
    }
  });
  // Middleware to check if player in game already
  getLatestPlayerActivity(io);

  try {
    io.on('connection', (socket) => {
      // For FE to check if connected
      const clientId = socket.handshake.query.clientId;
      console.log(clientId, 'using', socket.id, 'JOINED');

      // Set up socket listeners for room events
      intializeRoomListeners(socket, io);
      intializeGameListeners(socket, io);

      socket.on('disconnect', (reason) => {
        const clientId = socket.handshake.query.clientId;
        console.log(clientId, 'using', socket.id, 'left');

        disconnectPlayerFromGame(io, clientId);
      });
    });
  } catch (err) {
    console.log('Error occured', err);
    socket.emit('error', err);
  }
};
