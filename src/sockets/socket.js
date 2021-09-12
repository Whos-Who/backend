import { Server } from 'socket.io';
import { intializeRoomListeners } from './listeners/room';

export const initializeWebSockets = (server) => {
  const io = new Server(server, {
    cors: {
      origin: '*',
      method: ['GET', 'POST']
    }
  });

  // For FE to understand how it works
  io.on('connection', (socket) => {
    // console.log(socket.id, 'JOINED');
    io.send(socket.id).emit('WELCOME', {});

    // Set up socket listeners for room events
    intializeRoomListeners(socket, io);

    // TO DO:, set up socket listener for gmaeplay events

    socket.on('disconnecting', (reason) => {
      console.log(socket.id, 'LEAVING');
    });

    socket.on('disconnect', (reason) => {
      console.log('OH NO SOMEONE LEFT!');
    });
  });
};
