// src/routes/ai.routes.js
import { Router } from 'express';
import { body } from 'express-validator';
import auth from '../middlewares/auth.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import {
  getConversations, createConversation, getMessages,
  sendMessage, analyzefinances, deleteConversation,
  quickAnalysis, getSuggestions,
} from '../controllers/ai.controller.js';

const router = Router();
router.use(auth);

router.get('/conversations',                getConversations);
router.post('/conversations',               createConversation);
router.get('/conversations/:id/messages',   getMessages);
router.delete('/conversations/:id',         deleteConversation);
router.post('/analyze',                     analyzefinances);

router.post('/conversations/:id/messages', [
  body('content').trim().notEmpty().withMessage('Nội dung tin nhắn không được để trống'),
], validate, sendMessage);

router.post('/quick-analysis', quickAnalysis);
router.get('/suggestions',     getSuggestions);

export default router;
