import { Router } from 'express';
import { getMyProfile } from '../controllers/profileController';
import { verifyToken } from '../middlewares/authMiddleware';

const router = Router();

// Gắn verifyToken vào trước, qua được mới tới hàm getMyProfile
router.get('/me', verifyToken, getMyProfile);

export default router;