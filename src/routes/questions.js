import { Router } from 'express';
import * as questionController from '../controllers/question';
import auth from '../middleware/auth';

const router = Router();

router.get('/', auth, questionController.indexQuestionFuncs);
router.get('/:id', auth, questionController.showQuestionFuncs);
router.post('/', auth, questionController.createQuestionFuncs);
router.put('/:id', auth, questionController.updateQuestionFuncs);
router.delete('/:id', auth, questionController.destroyQuestionFuncs);

export default router;
