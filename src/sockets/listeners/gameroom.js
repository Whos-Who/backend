import {
  intializeGameState,
  parseGameState,
  updateGameStateInServer
} from '../handlers/gameroom';

const intializeGameroomListeners = (socket, io) => {
  const clientId = 'DUMMY';
  const { socketId } = socket;

  socket.on('room.create', async (data) => {
    try {
      const { username } = data;

      const roomCode = socket.id;
      const gameState = intializeGameState(roomCode, clientId, username);
      console.log('room created by', clientId, gameState);

      const parsedGameState = parseGameState(gameState);
      await updateGameStateInServer(parsedGameState);

      socket.emit('room.join', gameState);
      socket.join(gameState);
    } catch (err) {
      console.log('room.create error occured', err);
    }
  });
};

export { intializeGameroomListeners };
