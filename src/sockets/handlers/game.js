import {
  QUESTIONS_PREFIX,
  GUESSING_ORDER_PREFIX,
  ROOM_PREFIX
} from '../../const/redis';
import {
  QUESTION_PHASE,
  TURN_GUESS_PHASE,
  TURN_REVEAL_PHASE,
  SCOREBOARD_PHASE
} from '../../const/game';
import { DEFAULT_EXPIRATION } from '../../database/redis';

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

const guessingOrderExists = async (roomCode) => {
  console.log('Guessing order already exists');

  const key = `${GUESSING_ORDER_PREFIX}-${roomCode}`;
  return await redisClient.exists(key);
};

const deleteGuessingOrder = async (roomCode) => {
  const key = `${GUESSING_ORDER_PREFIX}-${roomCode}`;
  await redisClient.del(key);
};

const addGuessingOrder = async (roomCode, players) => {
  const key = `${GUESSING_ORDER_PREFIX}-${roomCode}`;

  if (await guessingOrderExists(roomCode)) await deleteGuessingOrder(roomCode);

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
  const score = getRemainingAnswers(players);

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

const updateCorrectGuess = (guesserId, answerClientId, players) => {
  const updatedPlayers = updatePlayerScore(guesserId, players);

  console.log('UPDATED SCORE', updatedPlayers);

  updatedPlayers[answerClientId]['currAnswer']['isGuessed'] = true;

  console.log('UPDATE IS GUESS', updatedPlayers, answerClientId);
  return updatedPlayers;
};

const switchToScoreboardPhase = (gameState) => {
  return {
    ...gameState,
    phase: SCOREBOARD_PHASE,
    currQuestion: gameState.question,
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
  //if (!deckId) throw new Error("No Deck Id")

  // Foe FE to develop first without deckId
  if (!deckId) {
    const questions = [
      'Question 1',
      'Question 2',
      'Question 3',
      'Question 4',
      'Question 5',
      'Question 6',
      'Question 7',
      'Question 8'
    ];
    return questions;
  }
  const questionsJson = await Question.findAll({
    where: {
      deckId: deckId
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
  if (!roomCode) throw new Error('Missing fields for game start');

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
    players: updateCorrectGuess(
      gameState.currAnswerer,
      selectedPlayerId,
      gameState.players
    )
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

const playerAnswerIsGuessed = (clientId, gameState) => {
  return gameState['players'][clientId]['currAnswer']['isGuessed'];
};

const getPlayerAnswer = (clientId, gameState) => {
  return gameState['players'][clientId]['currAnswer']['value'];
};

const forceTurnRevealPhase = (nextGuesser, roomCode, io) => {
  return async () => {
    const gameState = await getAndParseGameState(roomCode);

    if (
      gameState.phase === TURN_GUESS_PHASE &&
      gameState.currAnswerer === nextGuesser
    ) {
      const unansweredGameState = {
        ...gameState,
        phase: TURN_REVEAL_PHASE,
        selectedPlayerId: '',
        selectedAnswer: ''
      };

      await formatAndUpdateGameState(unansweredGameState);
      console.log('TIMES UP! Forcing a switch');
      io.to(roomCode).emit('game-next-phase', unansweredGameState);
    }
    console.log('Timer completed');
  };
};

const isConnected = (gameState, clientId) => {
  return gameState['players'][clientId][connected];
};

const endTurnRevealPhase = async (roomCode) => {
  console.log('ENDING TURN REVEAL');
  const gameState = await getAndParseGameState(roomCode);
  const numRemainingAns = getRemainingAnswers(gameState.players);

  let nextGuesser = await getNextGuesser(roomCode);

  while (!isConnected(gameState, nextGuesser)) {
    nextGuesser = await getNextGuesser(roomCode);
  }

  let updatedGameState;

  if (numRemainingAns == 1 && !playerAnswerIsGuessed(nextGuesser, gameState)) {
    // Edge case where only answer left belongs to currGuesser , award 1 point and remain in turn reveal
    const selectedAnswer = getPlayerAnswer(nextGuesser, gameState);
    gameState.currAnswerer = nextGuesser;
    updatedGameState = updateStateWithCorrectGuess(
      gameState,
      nextGuesser,
      selectedAnswer
    );
    console.log(
      'LAST ANSWER BELONGS TO GUESSER',
      '- UPDATED  GAME STATE',
      updatedGameState
    );
  } else if (numRemainingAns <= 0) {
    // If no more turns left, should bring to scoreboard
    updatedGameState = switchToScoreboardPhase(gameState);
    console.log(
      'NO MORE QUESTIONS, BRINGING TO SCOREBOARD',
      '- UPDATED  GAME STATE',
      updatedGameState
    );
  } else {
    // Stay on turnGuessPhase, with nextGuesser
    updatedGameState = {
      ...gameState,
      phase: TURN_GUESS_PHASE,
      currAnswerer: nextGuesser
    };
    console.log('NEXT TURN', 'UPDATED  GAME STATE', updatedGameState);
  }

  // Start async timer
  await formatAndUpdateGameState(updatedGameState);

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
  endTurnRevealPhase,
  addPlayerAnswer,
  forceTurnRevealPhase
};
