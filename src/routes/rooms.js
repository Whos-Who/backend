import { Router } from 'express';
import * as roomController from '../controllers/room';

const router = Router();

router.head('/', roomController.checkRoomExistFunc);

export default router;
