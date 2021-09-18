import {
  formatAndUpdateGameState,
  getAndParseGameState
} from '../handlers/room';
import { getPlayerActivity, updatePlayerActivity } from '../../utils/utils';

const getLatestPlayerActivity = async (io) => {
  io.use(async (socket, next) => {
    const { clientId } = socket.handshake.query;

    try {
      const playerActivity = await getPlayerActivity(clientId);
      console.log('Last seen player game', playerActivity);

      if (!Object.keys(playerActivity).length) {
        console.log('Nothing found on the player');
        next(); // No logged player activity
        // return;
      }
      // Player reconencts, new socket connection
      if (playerActivity.socketId != socket.id) {
        const roomCode = playerActivity.roomCode;
        const gameState = await getAndParseGameState(roomCode);

        await updatePlayerActivity(clientId, socket.id, roomCode);

        const updatedGameState = setPlayerOnline(gameState, clientId);

        await formatAndUpdateGameState(updatedGameState);
        // console.log(gameState['players'][clientId]['connected']);

        console.log('RECONNECTING to game room', roomCode);

        // socket.emit('player-reconnect', gameState);
        io.in(roomCode).emit('player-reconnect', {
          clientId,
          updatedGameState
        });

        socket.join(roomCode);

        // console.log('ROOMS STATUS', socket.rooms);
        // console.log('SOCKET TO ROOMS MAPPING', io.sockets.adapter.sids);

        socket.emit('player-reconnect', updatedGameState);
      }
      next();
    } catch (err) {
      next(err);
    }
  });
};

const setPlayerOnline = (gameState, clientId) => {
  const updatedGameState = {
    ...gameState
  };

  updatedGameState['players'][clientId]['connected'] = true;

  return updatedGameState;
};

const setPlayerOffline = (gameState, clientId) => {
  const updatedGameState = {
    ...gameState
  };

  updatedGameState['players'][clientId]['connected'] = false;

  return updatedGameState;
};

const disconnectPlayerFromGame = async (io, clientId) => {
  const playerActivity = await getPlayerActivity(clientId);
  const roomCode = playerActivity.roomCode;

  // User was not part of a game
  if (!Object.keys(playerActivity).length) return;

  const gameState = await getAndParseGameState(roomCode);
  const updatedGameState = setPlayerOffline(gameState, clientId);

  await formatAndUpdateGameState(updatedGameState);

  console.log(clientId, 'disconnected from', roomCode);

  io.in(roomCode).emit('player-disconnect', {
    clientId,
    updatedGameState
  });
};

export { getLatestPlayerActivity, disconnectPlayerFromGame };
