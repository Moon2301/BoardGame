import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import prisma from '../../utils/prisma';

const GACHA_COST = 50; // Giá 1 lần quay: 50 Kim Cương

export const rollCharacter = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const profileId = req.user?.profileId;
    if (!profileId) {
      res.status(401).json({ error: 'Không xác định được người chơi.' });
      return;
    }

    // 1. Lấy thông tin người chơi hiện tại
    const profile = await prisma.userProfile.findUnique({
      where: { user_profile_id: profileId },
    });

    if (!profile || profile.diamonds < GACHA_COST) {
      res.status(400).json({ error: 'Không đủ Kim Cương để quay Gacha!' });
      return;
    }

    // 2. Thuật toán Random chọn Nhân vật (Có thể nâng cấp thêm tỉ lệ Rarity sau)
    const allCharacters = await prisma.character.findMany();
    if (allCharacters.length === 0) {
      res.status(500).json({ error: 'Hệ thống chưa có nhân vật nào!' });
      return;
    }
    const randomIndex = Math.floor(Math.random() * allCharacters.length);
    const rolledCharacter = allCharacters[randomIndex];

    // 3. XỬ LÝ TRANSACTION (Đảm bảo tính toàn vẹn dữ liệu)
    const result = await prisma.$transaction(async (tx) => {
      // 3.1 Trừ tiền người chơi
      const updatedProfile = await tx.userProfile.update({
        where: { user_profile_id: profileId },
        data: { diamonds: { decrement: GACHA_COST } },
      });

      // 3.2 Ghi Log giao dịch
      await tx.transaction.create({
        data: {
          user_profile_id: profileId,
          currency_type: 'DIAMOND',
          amount: -GACHA_COST,
          transaction_type: 'GACHA',
          description: `Quay Gacha Nhân vật: Nhận được ${rolledCharacter.name}`,
        },
      });

      // 3.3 Upsert Nhân vật vào rương (Đã có thì +1 Level, chưa có thì tạo mới)
      const userCharacter = await tx.userCharacter.upsert({
        where: {
          user_profile_id_character_id: {
            user_profile_id: profileId,
            character_id: rolledCharacter.character_id,
          },
        },
        update: {
          level: { increment: 1 }, // Nếu trùng nhân vật -> Cộng Level
        },
        create: {
          user_profile_id: profileId,
          character_id: rolledCharacter.character_id,
          level: 1, // Nếu chưa có -> Level 1
        },
      });

      return { updatedProfile, userCharacter };
    });

    // 4. Trả kết quả về cho Client
    res.json({
      message: 'Quay Gacha thành công!',
      rolled_character: rolledCharacter,
      current_diamonds: result.updatedProfile.diamonds,
      inventory_status: result.userCharacter, // Chứa thông tin Level mới nhất
    });

  } catch (error) {
    console.error('[Gacha Error]', error);
    res.status(500).json({ error: 'Lỗi hệ thống khi quay Gacha' });
  }
};