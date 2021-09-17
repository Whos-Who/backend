import { customAlphabet } from 'nanoid';
import { redisClient } from '../database/redis';
import { ROOM_CODE_LENGTH, ROOM_CODE_SYMBOLS } from '../const/game';
import { PLAYER_ACTIVITY_PREFIX } from '../const/redis';
import { PLAYER_ACTIVITY_EXPIRATION } from '../database/redis';
import { getGameState } from '../sockets/handlers/room';

// Shuffles and array 'randomly', based on the knuth algorithm
// Modifies the actual array

const shuffle = (arr) => {
  let currIdx = arr.length;
  let randomIdx;

  while (currIdx != 0) {
    randomIdx = Math.floor(Math.random() * currIdx);
    currIdx--;

    const temp = arr[currIdx];
    arr[currIdx] = arr[randomIdx];
    arr[randomIdx] = temp;
  }
  return arr;
};

const nanoId = customAlphabet(ROOM_CODE_SYMBOLS, ROOM_CODE_LENGTH);

const updatePlayerActivity = async (clientId, socketId, roomCode) => {
  const key = `${PLAYER_ACTIVITY_PREFIX}-${clientId}`;
  const body = {
    socketId: socketId,
    roomCode: roomCode
  };
  await redisClient.hmset(key, body);
  redisClient.expire(key, PLAYER_ACTIVITY_EXPIRATION);
};

const removePlayerActivity = async (clientId) => {
  const key = `${PLAYER_ACTIVITY_PREFIX}-${clientId}`;
  await redisClient.del(key);
};

const getPlayerActiviy = async (clientId) => {
  const key = `${PLAYER_ACTIVITY_PREFIX}-${clientId}`;
  return await redisClient.hgetall(key);
};

const getLatestPlayerActivity = async (io) => {
  io.use(async (socket, next) => {
    const { clientId } = socket.handshake.query;

    try {
      const playerActivity = await getPlayerActiviy(clientId);
      console.log('Last seen player game', playerActivity);

      if (!Object.keys(playerActivity).length) {
        console.log('Nothing found on the player');
        next(); // No logged player activity
        return;
      }

      // Player reconencts, new socket connection
      if (playerActivity.socketId != socket.id) {
        const gameState = await getGameState(playerActivity.roomCode);
        console.log(playerActivity.roomCode);
        await updatePlayerActivity(clientId, socketId, gameState.roomCode);
        console.log('RECONNECTING to game room', playerActivity.roomCode);
        socket.join(roomCode);
        socket.emit('player-reconnect', gameState);
      }
      next();
    } catch (err) {
      next(err);
    }
  });
};

export {
  shuffle,
  nanoId,
  updatePlayerActivity,
  removePlayerActivity,
  getLatestPlayerActivity
};
