import { Router } from 'express';
import * as resetController from '../controllers/reset';

const router = Router();

router.post('/', resetController.resetFunc);
router.delete('/:id', resetController.destroyRoomFunc);

export default router;
