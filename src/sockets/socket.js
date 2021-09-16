import { Server } from 'socket.io';
import { intializeGameListeners } from './listeners/game';
import { intializeRoomListeners } from './listeners/room';
import { redisClient } from '../database/redis';

export const initializeWebSockets = (server) => {
  const io = new Server(server, {
    cors: {
      origin: '*',
      method: ['GET', 'POST']
    }
  });

  // For FE to understand how it works
  io.on('connection', (socket) => {
    console.log(socket.id, 'JOINED');
    io.send(socket.id).emit('WELCOME', {});

    // Set up socket listeners for room events
    intializeRoomListeners(socket, io);
    intializeGameListeners(socket, io);

    socket.on('disconnecting', (reason) => {
      console.log(socket.id, 'LEAVING');
    });

    socket.on('disconnect', (reason) => {
      console.log('OH NO SOMEONE LEFT!');
    });
  });
};
