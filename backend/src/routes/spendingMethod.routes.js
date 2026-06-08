// src/routes/spendingMethod.routes.js
import { Router } from 'express';
import auth from '../middlewares/auth.middleware.js';
import {
  listMethods, addMethod, removeMethod, applyTobudgets,
} from '../controllers/spendingMethod.controller.js';

const router = Router();
router.use(auth);

router.get('/',         listMethods);
router.post('/',        addMethod);
router.delete('/:id',   removeMethod);
router.post('/apply',   applyTobudgets);

export default router;
