import { Router } from 'express';
import * as deckController from '../controllers/deck';
import auth from '../middleware/auth';
import optionalAuth from '../middleware/optionalAuth';

const router = Router();

router.get('/', optionalAuth, deckController.indexDeckFuncs);
router.get('/:id', auth, deckController.showDeckFuncs);
router.post('/', auth, deckController.createDeckFuncs);
router.put('/:id', auth, deckController.updateDeckFuncs);
router.delete('/:id', auth, deckController.destroyDeckFuncs);

export default router;
