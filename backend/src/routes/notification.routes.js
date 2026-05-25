// src/routes/notification.routes.js
import { Router } from 'express';
import auth from '../middlewares/auth.middleware.js';
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead } from '../controllers/notification.controller.js';

const router = Router();
router.use(auth);

router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.put('/read-all', markAllAsRead);
router.put('/:id/read', markAsRead);

export default router;
