import { Router } from 'express';
import * as roomController from '../controllers/room';

const router = Router();

router.get('/:roomCode', roomController.retrieveRoomStatusFunc);

export default router;
