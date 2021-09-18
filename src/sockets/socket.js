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

  io.on('connection', (socket) => {
    // For FE to check if connected
    console.log(socket.id, 'JOINED');

    // Set up socket listeners for room events
    intializeRoomListeners(socket, io);
    intializeGameListeners(socket, io);

    socket.on('disconnect', (reason) => {
      const clientId = socket.handshake.query.clientId;
      console.log(socket.handshake.query.clientId, 'using', socket.id, 'left');

      disconnectPlayerFromGame(io, clientId);
    });
  });
};
