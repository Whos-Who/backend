import { StatusCodes } from 'http-status-codes';
import { redisClient } from '../database/redis';
import {
  ROOM_PREFIX,
  QUESTIONS_PREFIX,
  GUESSING_ORDER_PREFIX
} from '../const/redis';

async function destroyRoom(req, res, next) {
  try {
    const roomKey = `${ROOM_PREFIX}-${req.params.id}`;
    const questionsKey = `${QUESTIONS_PREFIX}-${req.params.id}`;
    const guessingOrderKey = `${GUESSING_ORDER_PREFIX}-${req.params.id}`;

    await Promise.all([
      redisClient.del(roomKey),
      redisClient.del(questionsKey),
      redisClient.del(guessingOrderKey)
    ]);
    res.status(StatusCodes.OK).end();
  } catch (err) {
    next(err);
  }
}

async function resetRedis(req, res, next) {
  try {
    await redisClient.flushall();

    res.status(StatusCodes.OK).end();
  } catch (err) {
    next(err);
  }
}

export const destroyRoomFunc = [destroyRoom];
export const resetFunc = [resetRedis];
