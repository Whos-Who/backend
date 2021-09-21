import { StatusCodes } from 'http-status-codes';
import { redisClient } from '../database/redis';

async function checkRoomExist(req, res, next) {
  try {
    const roomCode = req.query.code;
    if (!roomCode) {
      return res.status(StatusCodes.BAD_REQUEST).send('Room code is required!');
    }
    const exists = await redisClient.exists(`ROOM_PREFIX-${roomCode}`);
    if (exists == 0) {
      return res.status(StatusCodes.NOT_FOUND).send();
    }
    res.status(StatusCodes.NO_CONTENT).send();
  } catch (err) {
    next(err);
  }
}

export const checkRoomExistFunc = [checkRoomExist];
