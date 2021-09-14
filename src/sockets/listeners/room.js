import { createRoom, joinRoom, leaveRoom, removeRoom } from '../handlers/room';

const intializeRoomListeners = (socket, io) => {
  // Retrieves from socket query parameters
  const { clientId } = socket.handshake.query;
  const socketId = socket.id;

  // Create room when user clicks create room and makes user host
  socket.on('room-create', async (data) => {
    try {
      const { username } = data;

      if (!username) throw new Error('Missing field for room-create!');

      const roomCode = 123; //socket.id;
      const gameState = await createRoom(roomCode, clientId, username);

      // Tell client room is created and he can join room
      socket.emit('room-join', gameState);
      socket.join(roomCode);
    } catch (err) {
      socket.emit('error-room-create', err);
      console.log('create room error occured', err);
      throw err;
    }
  });

  // Join room when user clicks join room
  socket.on('room-join', async (data) => {
    try {
      const { roomCode, username } = data;

      if (!username || !roomCode)
        throw new Error('Missing field for room-join!');

      const gameState = await joinRoom(roomCode, clientId, username);

      //Broadcast to room user is joining
      io.in(roomCode).emit('user-join', {
        clientId: clientId,
        gameState: gameState
      });
      socket.join(roomCode);
      // Tell client room has been found and he can join room
      socket.emit('room-join', gameState);
    } catch (err) {
      socket.emit('error-room-join', err);
      console.log('join room error occured', err);
      throw err;
    }
  });

  // Leave room when user clicks leave room
  socket.on('room-leave', async (data) => {
    try {
      const { roomCode } = data;

      if (!roomCode) throw new Error('Missing field for room-leave!');

      const [gameState, newHost] = await leaveRoom(roomCode, clientId);

      // Tell client he can leave the room
      socket.emit('room-leave');
      socket.leave(roomCode);

      if (gameState.playerCount === 0) {
        const res = await removeRoom(gameState);
        // Debugging purpose
        if (res) console.log('Removed room');
        return;
      }

      // Broadcast to all users in room that user has left
      io.in(roomCode).emit('user-leave', {
        clientId: clientId,
        gameState: gameState
      });

      if (newHost) {
        // Broadcast to all users in room that new host appointed
        io.in(roomCode).emit('new-host', newHost);
        console.log(newHost, 'has become host!');
      }
    } catch (err) {
      socket.emit('error-room-leave', err);
      console.log('leave room occured', err);
      throw err;
    }
  });
};

export { intializeRoomListeners };
