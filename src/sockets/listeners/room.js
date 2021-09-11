import { createRoom, joinRoom, leaveRoom, removeRoom } from '../handlers/room';

const intializeGameroomListeners = (socket, io) => {
  let { clientId, socketId } = socket;
  // clientId = 'Uncle Soo';
  // socketId = 'asirjhwoeirejh';

  // Create room when user clicks create room and makes user host
  socket.on('roomCreate', async (data) => {
    try {
      const { username } = data;

      const roomCode = socket.id;
      const gameState = createRoom(roomCode, clientId, username);

      // Tell client room is created and he can join room
      socket.emit('roomJoin', gameState);
      socket.join(gameState);
    } catch (err) {
      console.log('create room error occured', err);
      throw err;
    }
  });

  // Join room when user clicks join room
  socket.on('roomJoin', async (data) => {
    try {
      const { roomCode, username } = data;

      const gameState = joinRoom(roomCode, clientId, username);

      // Tell client room has been found and he can join room
      socket.emit('roomJoin', gameState);
      socket.join(gameState);
    } catch (err) {
      console.log('join room error occured', err);
      throw err;
    }
  });

  // Leave room when user clicks leave room
  socket.on('roomLeave', async (data) => {
    try {
      const { roomCode } = data;

      const [gameState, newHost] = await leaveRoom(roomCode, clientId);

      // Tell client he can leave the room
      socket.emit('roomLeave');
      socket.leave(roomCode);

      if (gameState.playerCount == 0) {
        const res = await removeRoom(gameState);
        // Debugging purpose
        if (res) console.log('Removed room');
        return;
      }

      // Broadcast to all users in room that user has left
      io.in(roomCode).emit('userLeftRoom', {
        clientId: clientId,
        gameState: gameState
      });

      if (newHost) {
        // Broadcast to all users in room that new host appointed
        io.in(roomCode).emit('newHost', newHost);
        console.log(newHost, 'has become host!');
      }
    } catch (err) {
      console.log('leave room occured', err);
      throw err;
    }
  });
};

export { intializeGameroomListeners };
