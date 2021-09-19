import { DEFAULT_EXPIRATION, redisClient } from '../../database/redis';
import { ROOM_PREFIX } from '../../const/redis';
import { LOBBY_PHASE } from '../../const/game';
import { canJoin } from '../../utils/sockets/room';
import { Mutex } from 'redis-semaphore';

// Create new game state
const intializeGameState = (roomCode, clientId, username) => {
  return {
    roomCode,
    host: clientId,
    phase: LOBBY_PHASE,
    currQuestion: '',
    currAnswerer: '',
    playerCount: 1,
    questionsLeft: 0,
    selectedPlayerId: '',
    selectedAnswer: '',
    players: {
      [clientId]: intializePlayerState(username)
    }
  };
};

// Create new player state
const intializePlayerState = (username) => {
  return {
    username,
    connected: true,
    score: 0,
    currAnswer: {
      value: '',
      isGuessed: false
    }
  };
};

const cleanGameState = (roomCode, clientId) => {
  return {
    roomCode,
    host: clientId,
    phase: LOBBY_PHASE,
    currQuestion: '',
    currAnswerer: '',
    playerCount: 0,
    questionsLeft: 0,
    selectedPlayerId: '',
    selectedAnswer: '',
    players: {}
  };
};

const cleanUpGameState = (gameState) => {
  const players = gameState.players;
  const hostId = gameState.host;
  const roomCode = gameState.roomCode;

  let cleanedGameState = cleanGameState(roomCode, hostId);

  console.log(players);
  Object.entries(players).forEach(([clientId, state]) => {
    cleanedGameState = addUserToRoom(
      clientId,
      state.username,
      cleanedGameState
    );
  });

  console.log('Cleaned Game State', cleanedGameState);

  return cleanedGameState;
};

// Stringify nested structures to put in Redis, this reduces request rate and prevents overloading Redis since we r on free version :(
const formatGameState = (gameState) => {
  return {
    ...gameState,
    players: JSON.stringify(gameState.players)
  };
};

const parseGameState = (gameState) => {
  const players = JSON.parse(gameState.players);

  return {
    ...gameState,
    playerCount: Number(gameState.playerCount),
    questionsLeft: Number(gameState.questionsLeft),
    players: players
  };
};

const getGameState = async (roomCode) => {
  const key = `${ROOM_PREFIX}-${roomCode}`;
  const gameState = await redisClient.hgetall(key);

  return gameState;
};

const getAndParseGameState = async (roomCode) => {
  try {
    const gameState = await getGameState(roomCode);

    if (!Object.keys(gameState).length)
      throw new Error(`Game with ${roomCode} does not exist!`);

    const parsedGameState = parseGameState(gameState);

    return parsedGameState;
  } catch (err) {
    throw err;
  }
};

const updateGameStateInServer = async (gamestate) => {
  const key = `${ROOM_PREFIX}-${gamestate.roomCode}`;

  await redisClient.hset(key, gamestate);
  redisClient.expire(key, DEFAULT_EXPIRATION);
};

const formatAndUpdateGameState = async (gameState) => {
  const formattedGameState = formatGameState(gameState);
  await updateGameStateInServer(formattedGameState);
};

const removeRoom = async (gamestate) => {
  const key = `${ROOM_PREFIX}-${gamestate.roomCode}`;

  console.log('REMOVE ROOM', key);
  await redisClient.del(key);
};

const roomExists = async (roomCode) => {
  const key = `${ROOM_PREFIX}-${roomCode}`;

  return await redisClient.exists(key);
};

const addUserToRoom = (clientId, username, gameState) => {
  const updatedGameState = {
    ...gameState,
    playerCount: gameState.playerCount + 1,
    players: {
      ...gameState['players'],
      [clientId]: intializePlayerState(username)
    }
  };

  console.log(
    `ADDED ${clientId} TO ROOM ${gameState.roomCode}`,
    updatedGameState
  );
  return updatedGameState;
};

const removeUserFromRoom = (clientId, gameState) => {
  delete gameState['players'][clientId];

  const updatedGameState = {
    ...gameState,
    playerCount: gameState.playerCount - 1
  };

  return updatedGameState;
};

const pickNewHost = (gameState) => {
  // Pick the 1st person json of remaining player as host
  let newHost = null;

  for (let [clientId, playerState] in Object.entries(gameState['players'])) {
    if (gameState != clientId && playerState.connected) {
      newHost = clientId;
    }
  }

  if (!newHost) throw new Error('No new Host!');

  return newHost;
};

const usernameExists = (players, username) => {
  const matches = Object.values(players).map(
    (player) => player.username === username
  );
  const result = matches.reduce((total, match) => total || match, false);

  return result;
};

const createRoom = async (roomCode, clientId, username) => {
  const gameState = intializeGameState(roomCode, clientId, username);
  await formatAndUpdateGameState(gameState);

  console.log('room created by', clientId, gameState);

  return gameState;
};

const joinRoom = async (roomCode, clientId, username) => {
  if (!roomCode) throw new Error('Empty room code!');

  const key = `${ROOM_PREFIX}-${roomCode}`;
  // Possible concurrency issue here when multiple people join at once
  const mutex = new Mutex(redisClient, key);
  await mutex.acquire();
  let gameState;
  let updatedGameState;

  try {
    gameState = await getAndParseGameState(roomCode);

    if (usernameExists(gameState.players, username))
      throw new Error(`Username ${username} already exists!`);

    if (!canJoin(gameState, clientId))
      throw new Error('Unable to join game! Game in progress!');

    updatedGameState = addUserToRoom(clientId, username, gameState);

    await formatAndUpdateGameState(updatedGameState);
  } catch (err) {
    throw err;
  } finally {
    await mutex.release();
  }

  console.log(clientId, 'has joined, new game state', updatedGameState);

  return updatedGameState;
};

const leaveRoom = async (roomCode, clientId) => {
  if (!roomCode) throw new Error('Empty room code!');

  const key = `${ROOM_PREFIX}-${roomCode}`;
  // Possible concurrency issue here when multiple people join at once
  const mutex = new Mutex(redisClient, key);
  await mutex.acquire();

  let gameState;
  let updatedGameState;
  let newHost;

  try {
    gameState = await getAndParseGameState(roomCode);
    updatedGameState = removeUserFromRoom(clientId, gameState);

    // If host is same as person who left, select new one
    if (
      updatedGameState['host'] === clientId &&
      updatedGameState.playerCount > 0
    ) {
      newHost = pickNewHost(updatedGameState);
      updatedGameState.host = newHost;
      console.log('NEW HOST', newHost);
    }

    await formatAndUpdateGameState(updatedGameState);
  } finally {
    await mutex.release();
  }

  console.log(clientId, 'has left, new game state', updatedGameState);

  return [updatedGameState, newHost];
};

export {
  intializeGameState,
  getGameState,
  cleanUpGameState,
  intializePlayerState,
  formatGameState,
  parseGameState,
  updateGameStateInServer,
  addUserToRoom,
  removeUserFromRoom,
  pickNewHost,
  createRoom,
  joinRoom,
  leaveRoom,
  removeRoom,
  getAndParseGameState,
  formatAndUpdateGameState,
  roomExists
};
