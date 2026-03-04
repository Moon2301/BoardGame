import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'bi_mat_quoc_gia_co_ty_phu';

// Mở rộng interface Request của Express để nhét thêm cục thông tin user vào
export interface AuthRequest extends Request {
  user?: {
    accountId: number;
    profileId: number;
  };
}

export const verifyToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
  // Lấy token từ header "Authorization: Bearer <token>"
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Chưa có token xác thực!' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { accountId: number; profileId: number };
    
    req.user = decoded;
    
    next();
  } catch (error) {
    res.status(403).json({ error: 'Token đã hết hạn hoặc không hợp lệ!' });
  }
};