import { customAlphabet } from 'nanoid';
import { redisClient } from '../database/redis';
import { ROOM_CODE_LENGTH, ROOM_CODE_SYMBOLS } from '../const/game';
import { PLAYER_ACTIVITY_PREFIX } from '../const/redis';
import { PLAYER_ACTIVITY_EXPIRATION } from '../database/redis';

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
  await redisClient.hset(key, body);
  redisClient.expire(key, PLAYER_ACTIVITY_EXPIRATION);
};

const removePlayerActivity = async (clientId) => {
  const key = `${PLAYER_ACTIVITY_PREFIX}-${clientId}`;
  await redisClient.del(key);
};

const getPlayerActivity = async (clientId) => {
  const key = `${PLAYER_ACTIVITY_PREFIX}-${clientId}`;
  return await redisClient.hgetall(key);
};

export {
  shuffle,
  nanoId,
  removePlayerActivity,
  getPlayerActivity,
  updatePlayerActivity
};
