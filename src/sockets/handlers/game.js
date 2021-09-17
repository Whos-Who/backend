import { SCOREBOARD_PHASE } from '../../const/game';
import {
  QUESTIONS_PREFIX,
  GUESSING_ORDER_PREFIX,
  ROOM_PREFIX
} from '../../const/redis';
import {
  QUESTION_PHASE,
  TURN_GUESS_PHASE,
  TURN_REVEAL_PHASE
} from '../../const/game';

import { redisClient } from '../../database/redis';
import { Mutex } from 'redis-semaphore';
import { shuffle } from '../../utils/utils';
import {
  getAndParseGameState,
  // parseGameState,
  cleanUpGameState,
  formatAndUpdateGameState
} from '../handlers/room';

import Question from '../../models/Question';

const addQuestions = async (roomCode, questions) => {
  const key = `${QUESTIONS_PREFIX}-${roomCode}`;

  // First elementin array is treated as the list key in Redis
  questions.unshift(key);

  // Create a key-value mapping of Redis arr[0] - rest of arr
  await redisClient.rpush(questions);
  redisClient.expire(key, DEFAULT_EXPIRATION);
};

const addGuessingOrder = async (roomCode, players) => {
  const key = `${GUESSING_ORDER_PREFIX}-${roomCode}`;

  // First element in array is treated as the list key in Redis
  players.unshift(key);

  // Create a key-value mapping of Redis arr[0] - rest of arr
  await redisClient.rpush(players);
  redisClient.expire(key, DEFAULT_EXPIRATION);
};

const getNextQuestion = async (roomCode) => {
  const key = `${QUESTIONS_PREFIX}-${roomCode}`;
  const nextQuestion = await redisClient.lpop(key);

  return nextQuestion;
};

const getNextGuesser = async (roomCode) => {
  const key = `${GUESSING_ORDER_PREFIX}-${roomCode}`;
  const nextGuesser = await redisClient.lpop(key);
  await redisClient.rpush(key, nextGuesser);

  return nextGuesser;
};

const removeQuestions = async (roomCode) => {
  const key = `${QUESTIONS_PREFIX}-${roomCode}`;

  await redisClient.del(key);
};

const removeGuessingOrder = async (roomCode) => {
  const key = `${GUESSING_ORDER_PREFIX}-${roomCode}`;

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

  const newPlayers = {
    ...players
  };

  const newPlayerState = {
    ...players[clientId],
    score: players[clientId]['score'] + score
  };

  newPlayers[clientId] = newPlayerState;

  return newPlayers;
};

const updateCorrectGuess = (clientId, players) => {
  const updatedPlayers = updatePlayerScore(clientId, players);

  console.log('UPDATED SCORE', updatedPlayers);

  updatedPlayers[clientId]['currAnswer']['isGuessed'] = true;

  console.log('UPDATE IS GUESS', updatedPlayers, clientId);
  return updatedPlayers;
};

const switchToScoreboardPhase = (gameState) => {
  return {
    ...gameState,
    phase: SCOREBOARD_PHASE,
    currQuestion: '',
    currAnswerer: '',
    selectedPlayerId: '',
    selectedAnswer: '',
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

const checkResult = (gameState, clientId, answer) => {
  return gameState['players'][clientId]['currAnswer']['value'] === answer;
};

const getQuestions = async (deckId) => {
  const questionsJson = await Question.findAll({
    where: {
      deckId
    },
    attributes: ['question'],
    raw: true
  });

  let questions = questionsJson.map((element) => element['question']);
  questions = shuffle(questions);

  return questions;
};

const getPlayers = (gameState) => {
  let players = Object.keys(gameState['players']);
  players = shuffle(players);

  return players;
};

const updateStateToQuestionPhase = (gameState, nextQuestion, numQuestions) => {
  return {
    ...gameState,
    phase: QUESTION_PHASE,
    currQuestion: nextQuestion,
    questionsLeft: numQuestions - 1
  };
};

const startGame = async (roomCode, deckId) => {
  if (!roomCode || !deckId) throw new Error('Missing fields for game start');

  const questions = await getQuestions(deckId);
  const numQuestions = questions.length;

  const gameState = await Promise.all([
    getAndParseGameState(roomCode),
    addQuestions(roomCode, questions)
  ]).then((res) => res[0]);

  const players = getPlayers(gameState);

  const nextQuestion = await Promise.all([
    getNextQuestion(roomCode),
    addGuessingOrder(roomCode, players)
  ]).then((res) => res[0]);

  const updatedGameState = updateStateToQuestionPhase(
    gameState,
    nextQuestion,
    numQuestions
  );

  console.log('START GAME', '- UPDATED GAME STATE', updatedGameState);

  await formatAndUpdateGameState(updatedGameState);

  return updatedGameState;
};

const switchToQuestionsPhase = async (roomCode) => {
  const [nextQuestion, gameState] = await Promise.all([
    getNextQuestion(roomCode),
    getAndParseGameState(roomCode)
  ]).then((res) => {
    return res;
  });

  const players = getPlayers(gameState);

  const updatedGameState = updateStateToQuestionPhase(
    gameState,
    nextQuestion,
    gameState.questionsLeft
  );

  await Promise.all([
    formatAndUpdateGameState(updatedGameState),
    addGuessingOrder(roomCode, players)
  ]);

  console.log('NEXT QUESTION', '- UPDATED GAME STATE', updatedGameState);

  return updatedGameState;
};

const endGame = async (roomCode) => {
  // Remove exisiting question and getting order states in Redis
  const gameState = await Promise.all([
    getAndParseGameState(roomCode),
    removeQuestions(roomCode),
    removeGuessingOrder(roomCode)
  ]).then((res) => {
    return res[0];
  });

  // Send clean game state, since they are brought back to lobby where they can play again
  const cleanGameState = cleanUpGameState(gameState);

  await formatAndUpdateGameState(cleanGameState);

  console.log('END GAME', '- UPDATED (CLEAN) GAME STATE', cleanGameState);

  return cleanGameState;
};

const updateStateWithCorrectGuess = (
  gameState,
  selectedPlayerId,
  selectedAnswer
) => {
  return {
    ...gameState,
    phase: TURN_REVEAL_PHASE,
    selectedPlayerId,
    selectedAnswer,
    players: updateCorrectGuess(gameState.currAnswerer, gameState.players)
  };
};

const updateStateWithWrongGuess = (
  gameState,
  selectedPlayerId,
  selectedAnswer
) => {
  return {
    ...gameState,
    phase: TURN_REVEAL_PHASE,
    selectedPlayerId,
    selectedAnswer
  };
};

const switchToTurnRevealPhase = async (
  roomCode,
  selectedPlayerId,
  selectedAnswer
) => {
  const gameState = await getAndParseGameState(roomCode);

  const result = checkResult(gameState, selectedPlayerId, selectedAnswer);

  console.log('CHECK RESULT', result);

  const updatedGameState = result
    ? updateStateWithCorrectGuess(gameState, selectedPlayerId, selectedAnswer)
    : updateStateWithWrongGuess(gameState, selectedPlayerId, selectedAnswer);

  await formatAndUpdateGameState(updatedGameState);

  console.log('MATCH SUBMISSION', '- UPDATED  GAME STATE', updatedGameState);
  return updatedGameState;
};

const endTurnGuessingPhase = async (roomCode, gameState, socket, io) => {
  try {
    const updatedGameState = switchToScoreboardPhase(gameState);

    await formatAndUpdateGameState(updatedGameState);
    // Prepare gameState for next question

    console.log('SCOREBOARD', '- UPDATED  GAME STATE', updatedGameState);
    io.to(roomCode).emit('game-phase-scoreboard', updatedState);

    return updatedGameState;
  } catch (err) {
    socket.emit('error-game-scoreboard', err);
    console.log('game score board error occured', err);
    throw err;
  }
};

const switchToTurnGuessPhase = async (roomCode, socket, io) => {
  const gameState = await getAndParseGameState(roomCode);

  // If no more turns left, should bring to scoreboard
  if (getRemainingAnswers(gameState.players) <= 1)
    return await endTurnGuessingPhase(roomCode, gameState, socket, io);

  const nextGuesser = await getNextGuesser(roomCode);

  // Stay on turnGuessPhase, with nextGuesser
  const updatedGameState = {
    ...gameState,
    phase: TURN_GUESS_PHASE,
    currAnswerer: nextGuesser
  };

  await formatAndUpdateGameState(updatedGameState);

  console.log('NEXT TURN', 'UPDATED  GAME STATE', updatedGameState);

  return updatedGameState;
};

const addPlayerAnswer = async (roomCode, playerId, answer) => {
  const key = `${ROOM_PREFIX}-${roomCode}`;

  // Possible race condition here when multiple concurrent submissions?
  //Need to test if this works
  const mutex = new Mutex(redisClient, key);
  await mutex.acquire();
  let gameState;
  let updatedGameState;

  try {
    gameState = await getAndParseGameState(roomCode);

    updatedGameState = {
      ...gameState
    };

    updatedGameState['players'][playerId]['currAnswer']['value'] = answer;

    await formatAndUpdateGameState(updatedGameState);
  } finally {
    await mutex.release();
  }

  console.log('SUBMIT ANSWER', '- UPDATED GAME STATE', gameState);
  console.log(
    'NEW ANSWER',
    updatedGameState['players'][playerId]['currAnswer']
  );
  console.log('UPDATED ANSWERS');
  Object.keys(updatedGameState['players']).forEach((clientId) => {
    const ans = updatedGameState['players'][clientId]['currAnswer']['value'];
    console.log('ClientID:', clientId, 'ANSWER', ans);
  });

  return updatedGameState;
};

export {
  addQuestions,
  addGuessingOrder,
  getNextGuesser,
  getNextQuestion,
  removeQuestions,
  removeGuessingOrder,
  updateCorrectGuess,
  switchToScoreboardPhase,
  getRemainingAnswers,
  checkResult,
  startGame,
  endGame,
  switchToQuestionsPhase,
  switchToTurnRevealPhase,
  switchToTurnGuessPhase,
  addPlayerAnswer
};
