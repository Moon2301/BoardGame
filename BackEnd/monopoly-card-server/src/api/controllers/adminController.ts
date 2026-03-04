import { Request, Response } from 'express';
import prisma from '../../utils/prisma';

export const seedCharacters = async (req: Request, res: Response): Promise<void> => {
  try {
    const count = await prisma.character.count();
    if (count > 0) {
      res.json({ message: 'Database đã có sẵn nhân vật, không cần thêm mới.' });
      return;
    }

    await prisma.character.createMany({
      data: [
        { name: 'Arthur - Vua Lì Đòn', rarity: 'NORMAL', base_stats: { hp: 100, atk: 10 } },
        { name: 'Thief - Siêu Trộm', rarity: 'RARE', base_stats: { hp: 80, atk: 15 } },
        { name: 'Mage - Pháp Sư Vô Cực', rarity: 'EPIC', base_stats: { hp: 70, atk: 25 } },
        { name: 'Dragon - Thần Long', rarity: 'LEGENDARY', base_stats: { hp: 200, atk: 50 } },
      ],
    });

    res.status(201).json({ message: 'Đã thêm 4 nhân vật mẫu vào hệ thống!' });
  } catch (error) {
    console.error('[Admin Error]', error);
    res.status(500).json({ error: 'Lỗi khi seed data nhân vật' });
  }
};