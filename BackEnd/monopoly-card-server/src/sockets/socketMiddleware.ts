import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'bi_mat_quoc_gia_co_ty_phu';

export const socketAuthMiddleware = (socket: Socket, next: (err?: Error) => void) => {
  // Nâng cấp: Lấy token từ cục Auth hoặc lấy từ Query Params (dùng cho Postman)
  const token = socket.handshake.auth?.token || socket.handshake.query?.token;

  if (!token) {
    return next(new Error('Từ chối kết nối: Thiếu Token!'));
  }

  try {
    const decoded = jwt.verify(token as string, JWT_SECRET) as { accountId: number; profileId: number };
    socket.data.user = decoded;
    next();
  } catch (error) {
    return next(new Error('Từ chối kết nối: Token xịt!'));
  }
};