import { redisClient } from '../../database/redis';
import { ROOM_PREFIX } from '../../const/room';
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
    players: {
      [clientId]: intializePlayerState(username)
    },
    scores: {
      [clientId]: 0
    },
    currAnswers: {
      [clientId]: ''
    }
  };
};

// Create new player state
const intializePlayerState = (username) => {
  return {
    username,
    connected: true
  };
};

// Stringify nested structures to put in Redis, this reduces request rate and prevents overloading Redis since we r on free version :(
const formatGameState = (gameState) => {
  return {
    ...gameState,
    scores: JSON.stringify(gameState.scores),
    players: JSON.stringify(gameState.players),
    currAnswers: JSON.stringify(gameState.currAnswers)
  };
};

const parseGameState = (gameState) => {
  const scores = JSON.parse(gameState.scores);
  const players = JSON.parse(gameState.players);
  const currAnswers = JSON.parse(gameState.currAnswers);

  return {
    ...gameState,
    scores: scores,
    players: players,
    currAnswers: currAnswers
  };
};

const getGameState = (roomCode) => {
  const key = `${ROOM_PREFIX}-${roomCode}`;
  console.log(key);
  const gameState = new Promise((resolve, reject) => {
    redisClient.HGETALL(key, (err, res) => {
      if (err) return reject(err);

      console.log(res);
      resolve(res);
    });
  });

  return gameState;
};

const updateGameStateInServer = async (gamestate) => {
  const key = `${ROOM_PREFIX}-${gamestate.roomCode}`;

  Promise.all(
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
    playerCount: Number(gameState.playerCount) + 1,
    players: {
      ...gameState['players'],
      [clientId]: intializePlayerState(username)
    },
    scores: {
      ...gameState['scores'],
      [clientId]: 0
    },
    currAnswers: {
      ...gameState['currAnswers'],
      [clientId]: ''
    }
  };

  console.log(updatedGameState);
  return updatedGameState;
};

const removeUserFromRoom = (clientId, gameState) => {
  delete gameState['players'][clientId];
  delete gameState['scores'][clientId];
  delete gameState['currAnswers'][clientId];

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
  console.log(clientId);
  const gameState = intializeGameState(roomCode, clientId, username);

  const formattedGameState = formatGameState(gameState);
  console.log(formattedGameState);
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
  // Uncomment to test
  // const updatedGameState = removeUserFromRoom('Uncle Soo', parsedGameState);
  let newHost;

  // If host is same as person who left, select new one
  if (
    updatedGameState['host'] == clientId &&
    updatedGameState.playerCount > 0
  ) {
    const newHost = pickNewHost(updatedGameState);
    console.log('NEW', newHost);
    updatedGameState['host'] = newHost;
  }

  const formattedGameState = formatGameState(updatedGameState);
  await updateGameStateInServer(formattedGameState);

  console.log(clientId, 'has left, new game state', updatedGameState);

  return [updatedGameState, newHost];
};

export {
  intializeGameState,
  getGameState,
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