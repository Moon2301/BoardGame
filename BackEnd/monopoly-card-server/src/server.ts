import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

import { socketAuthMiddleware } from './sockets/socketMiddleware';
import { createGame } from './services/GameService';

// Import các routes
import authRoutes from './api/routes/authRoutes';
import profileRoutes from './api/routes/profileRoutes';
import gachaRoutes from './api/routes/gachaRoutes';




dotenv.config();

const app = express();
const server = http.createServer(app);

// Cấu hình Socket.IO cho phép Client kết nối
const io = new Server(server, {
  cors: {
    origin: '*', // Sau này đổi thành domain của Frontend
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// ----------------------------------------------------
// 1. HTTP ROUTES (Dành cho Meta-game ngoài sảnh)
// ----------------------------------------------------
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server Cờ Tỷ Phú đang chạy ngon lành!' });
});

// ----------------------------------------------------
// 2. SOCKET.IO (Dành cho In-game)
// ----------------------------------------------------
// Gắn màng lọc bảo vệ Socket
io.use(socketAuthMiddleware);

// Hàng đợi tìm trận lưu trên RAM (Tạm thời dùng mảng)
let matchmakingQueue: { socketId: string; profileId: number }[] = [];
const PLAYERS_PER_MATCH = 2; // Setup 2 người để bồ dễ test

io.on('connection', (socket) => {
  const profileId = socket.data.user.profileId;
  console.log(`[Socket] 🟢 User ${profileId} (Socket: ${socket.id}) đã kết nối.`);

  // Sự kiện: Bấm nút "Tìm Trận"
  socket.on('FIND_MATCH', async () => {
    // Chống spam: Nếu đang trong hàng đợi rồi thì bỏ qua
    if (matchmakingQueue.find(p => p.profileId === profileId)) return;

    matchmakingQueue.push({ socketId: socket.id, profileId });
    console.log(`[Queue] User ${profileId} đang tìm trận. (Hàng đợi: ${matchmakingQueue.length}/${PLAYERS_PER_MATCH})`);

    // Gửi thông báo cho client là đang xoay xoay tìm trận
    socket.emit('MATCH_SEARCHING', { message: 'Đang tìm đối thủ...' });

    // Kiểm tra xem đủ người chưa
    if (matchmakingQueue.length >= PLAYERS_PER_MATCH) {
      // Cắt lấy 2 ông đầu tiên trong hàng đợi
      const matchedPlayers = matchmakingQueue.splice(0, PLAYERS_PER_MATCH);
      const playerProfileIds = matchedPlayers.map(p => p.profileId);

      console.log(`[Matchmaking] Ghép thành công! Đang tạo phòng cho:`, playerProfileIds);

      try {
        // Gọi DB tạo phòng chơi
        const game = await createGame(playerProfileIds);
        const roomName = `GAME_${game.game_id}`;

        // Quăng cả 2 ông vào chung 1 Room Socket
        matchedPlayers.forEach(p => {
          const playerSocket = io.sockets.sockets.get(p.socketId);
          if (playerSocket) {
            playerSocket.join(roomName);
            // Báo cho client biết đã vào game
            playerSocket.emit('MATCH_FOUND', { 
              gameId: game.game_id, 
              message: 'Vào trận thôi!!!' 
            });
          }
        });

        console.log(`[Game] Đã tạo phòng ${roomName} thành công!`);

      } catch (error) {
        console.error('[Matchmaking Error]', error);
      }
    }
  });

  // Xử lý khi user đột ngột ngắt kết nối (tắt tab)
  socket.on('disconnect', () => {
    console.log(`[Socket] 🔴 User ${profileId} ngắt kết nối.`);
    // Rút tên khỏi hàng đợi nếu đang tìm trận
    matchmakingQueue = matchmakingQueue.filter(p => p.socketId !== socket.id);
  });
});

// ----------------------------------------------------
// KHỞI ĐỘNG SERVER
// ----------------------------------------------------
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server đang chạy trên port ${PORT}`);
});
// ----------------------------------------------------
// 1. HTTP ROUTES (Dành cho Meta-game ngoài sảnh)
// ----------------------------------------------------
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server chạy bình thường' });
});

// KÍCH HOẠT API AUTH
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/gacha', gachaRoutes);