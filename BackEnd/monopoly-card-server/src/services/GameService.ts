import prisma from '../utils/prisma';

export const createGame = async (playerProfileIds: number[]) => {
  // 1. Lấy Map mặc định (Map ID 1 - Bồ nhớ thêm 1 map mẫu vào DB sau nhé)
  const mapId = 1; 

  // 2. Tạo trận đấu mới
  const newGame = await prisma.game.create({
    data: {
      map_id: mapId,
      created_by: playerProfileIds[0], // Lấy ông đầu tiên làm chủ phòng
      max_players: playerProfileIds.length,
      status: 'PLAYING',
      current_turn_index: 1,
      turn_state: 'WAIT_ROLL',
    }
  });

  // 3. Đưa người chơi vào trận (Chia Turn order random)
  // Trộn mảng người chơi để ngẫu nhiên ai đi trước
  const shuffledPlayers = playerProfileIds.sort(() => 0.5 - Math.random());

  const gamePlayersData = shuffledPlayers.map((profileId, index) => ({
    game_id: newGame.game_id,
    user_profile_id: profileId,
    character_id: 1, // Tạm fix cứng ID nhân vật 1 (Vua Lì Đòn)
    //deck_id: 1,      // Tạm fix cứng ID Deck 1
    turn_order: index + 1, // Người 1, Người 2...
    balance: 1500,   // Cấp vốn đầu game (VD: 1500)
    position: 0,     // Bắt đầu ở ô GO
  }));

  // Tạo hàng loạt người chơi
  await prisma.gamePlayer.createMany({
    data: gamePlayersData
  });

  return newGame;
};