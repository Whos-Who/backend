import { Router } from 'express';
import * as roomController from '../controllers/room';

const router = Router();

router.head('/:roomCode', roomController.checkRoomExistFunc);

export default router;
