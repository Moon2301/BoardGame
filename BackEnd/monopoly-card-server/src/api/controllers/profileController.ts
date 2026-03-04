import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import prisma from '../../utils/prisma';

export const getMyProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Lấy profileId từ Middleware truyền sang
    const profileId = req.user?.profileId;

    const profile = await prisma.userProfile.findUnique({
      where: { user_profile_id: profileId },
      include: {
        characters: {
          include: { character: true } // Lấy luôn tên và chỉ số nhân vật
        },
        cards: {
          include: { card: true }      // Lấy luôn thông tin lá bài
        },
        decks: true
      }
    });

    if (!profile) {
      res.status(404).json({ error: 'Không tìm thấy hồ sơ người chơi!' });
      return;
    }

    res.json(profile);
  } catch (error) {
    console.error('[Profile Error]', error);
    res.status(500).json({ error: 'Lỗi server khi lấy thông tin' });
  }
};