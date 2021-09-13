import { SCOREBOARD_PHASE } from '../../const/game';
import { QUESTIONS_PREFIX, GUESSING_ORDER } from '../../const/redis';
import { redisClient } from '../../database/redis';

const addQuestions = async (roomCode, questions) => {
  const key = `${QUESTIONS_PREFIX}-${roomCode}`;

  // First elementin array is treated as the list key in Redis
  questions.unshift(key);

  // Create a key-value mapping of Redis arr[0] - rest of arr
  await redisClient.rpush(questions);
};

const addGuessingOrder = async (roomCode, players) => {
  const key = `${GUESSING_ORDER}-${roomCode}`;

  // First element in array is treated as the list key in Redis
  players.unshift(key);

  // Create a key-value mapping of Redis arr[0] - rest of arr
  await redisClient.rpush(players);
};

const getNextQuestion = async (roomCode) => {
  const key = `${QUESTIONS_PREFIX}-${roomCode}`;
  const nextQuestion = await redisClient.lpop(key);

  return nextQuestion;
};

const getNextGuesser = async (roomCode) => {
  const key = `${GUESSING_ORDER}-${roomCode}`;
  const nextGuesser = await redisClient.lpop(key);
  await redisClient.rpush(key, nextGuesser);

  return nextGuesser;
};

const removeQuestions = async (roomCode) => {
  const key = `${QUESTIONS_PREFIX}-${roomCode}`;

  await redisClient.del(key);
};

const removeGuessingOrder = async (roomCode) => {
  const key = `${GUESSING_ORDER}-${roomCode}`;

  await redisClient.del(key);
};

const getRemainingAnswers = (players) => {
  const numAnswerUnguessed = Object.values(players).reduce((total, player) => {
    return total + (player.currAnswer.isGuessed ? 0 : 1);
  }, 0);
  return numAnswerUnguessed;
};

const updatePlayerScore = (clientId, players) => {
  const score = getRemainingAnswers(players) - 1;

  const newPlayerState = {
    ...players[clientId],
    score: players[clientId]['score'] + score
  };

  const newPlayers = {
    ...players,
    [clientId]: newPlayerState
  };

  return newPlayers;
};

const updateCorrectGuess = (clientId, players, answerClientId) => {
  const updatedPlayers = updatePlayerScore(clientId, players);

  console.log('UPDATED SCORE', updatedPlayers, answerClientId);

  updatedPlayers[answerClientId]['currAnswer']['isGuessed'] = true;

  console.log('UPDATE ISGUESS', updatedPlayers, answerClientId);
  return updatedPlayers;
};

const prepareForNextQuestion = (gameState) => {
  return {
    ...gameState,
    phase: SCOREBOARD_PHASE,
    currQuestion: '',
    currAnswerer: '',
    selectedPlayerId: '',
    selectedAnswerClientId: '',
    players: clearPlayersAnswersState(gameState.players)
  };
};

const clearPlayersAnswersState = (players) => {
  let updatedPlayers = {};

  Object.keys(players).forEach((clientId) => {
    const state = players[clientId];

    const newState = {
      ...state,
      currAnswer: {
        value: '',
        isGuessed: false
      }
    };
    updatedPlayers[clientId] = newState;
  });

  return updatedPlayers;
};

export {
  addQuestions,
  addGuessingOrder,
  getNextGuesser,
  getNextQuestion,
  removeQuestions,
  removeGuessingOrder,
  updateCorrectGuess,
  prepareForNextQuestion,
  getRemainingAnswers
};
