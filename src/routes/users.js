import { Router } from 'express';
import * as userController from '../controllers/user';

const router = Router();

router.get('/', userController.indexUserFuncs);
router.get('/:id', userController.showUserFuncs);
router.post('/', userController.createUserFuncs);
router.put('/:id', userController.updateUserFuncs);
router.delete('/:id', userController.destroyUserFuncs);

export default router;
