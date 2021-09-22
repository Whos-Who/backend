import { StatusCodes } from 'http-status-codes';
import { redisClient } from '../database/redis';
import { ROOM_PREFIX } from '../const/redis';

async function retrieveRoom(req, res, next) {
  try {
    const roomCode = req.params.roomCode;
    const exists = await redisClient.exists(`${ROOM_PREFIX}-${roomCode}`);
    if (exists == 0) {
      return res.status(StatusCodes.NOT_FOUND).send();
    }
    const phase = await redisClient.hget(`${ROOM_PREFIX}-${roomCode}`, 'phase');
    res.status(StatusCodes.OK).json({ phase: phase });
  } catch (err) {
    next(err);
  }
}

export const showRoomFunc = [retrieveRoom];
