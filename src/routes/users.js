import { Router } from 'express';
import * as userController from '../controllers/user';
import auth from '../middleware/auth';

const router = Router();

router.post('/login', userController.loginFuncs);
router.post('/register', userController.registerFuncs);
router.get('/users', auth, userController.indexUserFuncs);
router.get('/users/:id', auth, userController.showUserFuncs);
router.post('/users', auth, userController.createUserFuncs);
router.put('/users/:id', auth, userController.updateUserFuncs);
router.delete('/users/:id', auth, userController.destroyUserFuncs);

export default router;
