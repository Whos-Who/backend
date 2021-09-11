import { Server } from 'socket.io';

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
    socket.emit('Welcome!', socket.id);

    intializeGameroomListeners(socket, io);

    socket.on('disconnecting', (reason) => {
      console.log(socket.id, 'LEAVING');
    });

    socket.on('disconnect', (reason) => {
      console.log('OH NO SOMEONE LEFT!');
    });
  });
};
