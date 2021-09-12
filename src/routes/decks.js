import { Router } from 'express';
import * as deckController from '../controllers/deck';

const router = Router();

router.get('/', deckController.indexDeckFuncs);
router.get('/:id', deckController.showDeckFuncs);
router.post('/', deckController.createDeckFuncs);
router.put('/:id', deckController.updateDeckFuncs);
router.delete('/:id', deckController.destroyDeckFuncs);

export default router;
