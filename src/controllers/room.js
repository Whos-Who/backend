import { StatusCodes } from 'http-status-codes';
import { redisClient } from '../database/redis';
import { ROOM_PREFIX } from '../const/redis';

async function retrieveRoom(req, res, next) {
  try {
    const roomCode = req.params.roomCode;
    const phase = await redisClient.hget(`${ROOM_PREFIX}-${roomCode}`, 'phase');

    if (!phase) return res.status(StatusCodes.NOT_FOUND).send();

    res.status(StatusCodes.OK).json({ phase: phase });
  } catch (err) {
    next(err);
  }
}

export const showRoomFunc = [retrieveRoom];
