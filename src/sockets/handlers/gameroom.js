import { redisClient } from '../../database/redis';
import { ROOM_PREFIX } from '../../const/gameroom';
import { RedisClient } from 'redis';

const intializeGameState = (roomCode, clientId, username) => {
  return {
    roomCode,
    host: clientId,
    phase: 'LOBBY', // Replace with actual enums later
    currQuestion: '',
    currAnswerer: '',
    playerCount: 1,
    players: {
      clientId: intializePlayerState(username)
    },
    scores: {
      clientId: 0
    },
    currAnswers: {
      clientId: ''
    }
  };
};

const intializePlayerState = (username) => {
  return {
    username,
    connected: true
  };
};

const parseGameState = (gameState) => {
  return {
    ...gameState,
    scores: JSON.stringify(gameState.scores),
    players: JSON.stringify(gameState.players),
    currAnswers: JSON.stringify(gameState.currAnswers)
  };
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

  // await redisClient.HGETALL(key, (err, res) => {
  //   console.log('Get fields');
  //   console.log(res);
  // });
};

export {
  intializeGameState,
  intializePlayerState,
  parseGameState,
  updateGameStateInServer
};
