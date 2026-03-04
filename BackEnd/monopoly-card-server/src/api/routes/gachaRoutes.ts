import { Router } from 'express';
import { rollCharacter } from '../controllers/gachaController';
import { seedCharacters } from '../controllers/adminController';
import { verifyToken } from '../middlewares/authMiddleware';

const router = Router();

// Route cho Dev/Admin để tạo nhân vật mẫu (không cần token cho nhanh)
router.post('/seed', seedCharacters);

// Route quay Gacha (Bắt buộc phải có Token)
router.post('/roll-character', verifyToken, rollCharacter);

export default router;