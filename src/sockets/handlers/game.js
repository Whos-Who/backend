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

export {
  addQuestions,
  addGuessingOrder,
  getNextGuesser,
  getNextQuestion,
  removeQuestions,
  removeGuessingOrder
};
