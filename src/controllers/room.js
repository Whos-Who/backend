import { StatusCodes } from 'http-status-codes';
import { redisClient } from '../database/redis';
import { ROOM_PREFIX } from '../const/redis';

async function checkRoomExist(req, res, next) {
  try {
    const roomCode = req.params.roomCode;
    const exists = await redisClient.exists(`${ROOM_PREFIX}-${roomCode}`);
    if (exists == 0) {
      return res.status(StatusCodes.NOT_FOUND).send();
    }
    res.status(StatusCodes.NO_CONTENT).send();
  } catch (err) {
    next(err);
  }
}

export const checkRoomExistFunc = [checkRoomExist];
