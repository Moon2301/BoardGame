import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../../utils/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'bi_mat_quoc_gia_co_ty_phu';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, user_name, phone_number } = req.body;

    // 1. Kiểm tra email đã tồn tại chưa
    const existingUser = await prisma.account.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ error: 'Email này đã được sử dụng!' });
      return;
    }

    // 2. Mã hóa mật khẩu
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // 3. Tạo Account và UserProfile cùng lúc (Dùng Nested Write của Prisma siêu tiện)
    const newAccount = await prisma.account.create({
      data: {
        email,
        password_hash,
        user_profile: {
          create: {
            user_name,
            phone_number,
            gold: 1000,     // Tặng 1000 vàng khởi nghiệp
            diamonds: 50,   // Tặng 50 kim cương gacha
          },
        },
      },
      include: {
        user_profile: true, // Trả về luôn thông tin profile vừa tạo
      },
    });

    res.status(201).json({ 
        message: 'Tạo tài khoản thành công!',
        profile: newAccount.user_profile 
    });
  } catch (error) {
    console.error('[Auth Error]', error);
    res.status(500).json({ error: 'Lỗi server khi đăng ký' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // 1. Tìm tài khoản theo email
    const account = await prisma.account.findUnique({
      where: { email },
      include: { user_profile: true },
    });

    if (!account) {
      res.status(401).json({ error: 'Sai email hoặc mật khẩu!' });
      return;
    }

    // 2. Kiểm tra mật khẩu
    const isPasswordValid = await bcrypt.compare(password, account.password_hash);
    if (!isPasswordValid) {
      res.status(401).json({ error: 'Sai email hoặc mật khẩu!' });
      return;
    }

    // 3. Tạo chuỗi Token (JWT) để user mang theo khi gọi các API khác
    const token = jwt.sign(
      { 
        accountId: account.account_id, 
        profileId: account.user_profile?.user_profile_id 
      },
      JWT_SECRET,
      { expiresIn: '7d' } // Token sống được 7 ngày
    );

    res.json({
      message: 'Đăng nhập thành công!',
      token,
      profile: account.user_profile,
    });
  } catch (error) {
    console.error('[Auth Error]', error);
    res.status(500).json({ error: 'Lỗi server khi đăng nhập' });
  }
};