import { redisClient } from '../../database/redis';
import { ROOM_PREFIX } from '../../const/redis';
import { LOBBY_PHASE } from '../../const/game';
import { canJoin } from '../../utils/sockets/room';

// Create new game state
const intializeGameState = (roomCode, clientId, username) => {
  return {
    roomCode,
    host: clientId,
    phase: LOBBY_PHASE,
    currQuestion: '',
    currAnswerer: '',
    playerCount: 1,
    questionCount: 0,
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
  const playerCount = Number(gameState.playerCount);

  return {
    ...gameState,
    playerCount: Number(gameState.playerCount),
    questionCount: Number(gameState.questionCount),
    players: players
  };
};

const getGameState = async (roomCode) => {
  const key = `${ROOM_PREFIX}-${roomCode}`;

  const gameState = await new Promise((resolve, reject) => {
    redisClient.HGETALL(key, (err, res) => {
      if (err) return reject(err);

      resolve(res);
    });
  });

  console.log('HEREE', gameState);
  return gameState;
};

const updateGameStateInServer = async (gamestate) => {
  const key = `${ROOM_PREFIX}-${gamestate.roomCode}`;

  await Promise.all(
    Object.entries(gamestate).map((entry) => {
      const field = entry[0];
      const val = entry[1];

      redisClient.HSET(key, field, val);
    })
  );
};

const removeRoom = async (gamestate) => {
  const key = `${ROOM_PREFIX}-${gamestate.roomCode}`;

  console.log(key);
  return await redisClient.DEL(key);
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

  console.log(updatedGameState);
  return updatedGameState;
};

const removeUserFromRoom = (clientId, gameState) => {
  delete gameState['players'][clientId];

  const updatedGameState = {
    ...gameState,
    playerCount: Number(gameState.playerCount) - 1
  };

  return updatedGameState;
};

const pickNewHost = (gameState) => {
  // Pick the 1st person json of remaining player as host
  const newHost = Object.keys(gameState['players'])[0];
  gameState.host = newHost;

  return newHost;
};

const createRoom = async (roomCode, clientId, username) => {
  const gameState = intializeGameState(roomCode, clientId, username);

  const formattedGameState = formatGameState(gameState);
  await updateGameStateInServer(formattedGameState);

  console.log('room created by', clientId, gameState);

  return gameState;
};

const joinRoom = async (roomCode, clientId, username) => {
  if (!roomCode) throw new Error('Empty room code!');

  const gameState = await getGameState(roomCode);

  if (!gameState) throw new Error('Game does not exist!');

  const parsedGameState = parseGameState(gameState);

  if (!canJoin(parsedGameState, clientId))
    throw new Error('Unable to join game! Game in progress!');

  const updatedGameState = addUserToRoom(
    // For testing purposes
    // 'Noobmaster69',
    // '3216 god',
    clientId,
    username,
    parsedGameState
  );

  const formattedGameState = formatGameState(updatedGameState);
  await updateGameStateInServer(formattedGameState);

  console.log(clientId, 'has joined, new game state', updatedGameState);

  return updatedGameState;
};

const leaveRoom = async (roomCode, clientId) => {
  if (!roomCode) throw new Error('Empty room code!');

  const gameState = await getGameState(roomCode);

  if (!gameState) throw new Error('Game does not exist!');
  const parsedGameState = parseGameState(gameState);
  const updatedGameState = removeUserFromRoom(clientId, parsedGameState);

  let newHost;

  // If host is same as person who left, select new one
  if (
    updatedGameState['host'] == clientId &&
    updatedGameState.playerCount > 0
  ) {
    const newHost = pickNewHost(updatedGameState);
    updatedGameState['host'] = newHost;
    console.log('NEW HOST', newHost);
  }

  const formattedGameState = formatGameState(updatedGameState);
  await updateGameStateInServer(formattedGameState);

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
  removeRoom
};
