import { Router } from 'express';
import * as userController from '../controllers/user';

const router = Router();

router.post('/login', userController.loginFuncs);
router.post('/register', userController.registerFuncs);
router.get('/users', userController.indexUserFuncs);
router.get('/users/:id', userController.showUserFuncs);
router.post('/users', userController.createUserFuncs);
router.put('/users/:id', userController.updateUserFuncs);
router.delete('/users/:id', userController.destroyUserFuncs);

export default router;
