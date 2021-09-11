import { Router } from 'express';
import * as questionController from '../controllers/question';

const router = Router();

router.get('/', questionController.indexQuestionFuncs);
router.get('/:id', questionController.showQuestionFuncs);
router.post('/', questionController.createQuestionFuncs);
router.put('/:id', questionController.updateQuestionFuncs);
router.delete('/:id', questionController.destroyQuestionFuncs);

export default router;
