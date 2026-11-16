/**
 * Game Socket Controller - Xử lý kết nối Realtime Socket.io & Chơi chung bạn bè (Multiplayer)
 */

import { gameEngine } from '../services/gameEngine.js';
import { UserService } from '../services/userService.js';
import { roomService } from '../services/roomService.js';
import { db } from '../database/db.js';
import { logger } from '../utils/logger.js';

export function setupGameSocket(io) {
  io.on('connection', (socket) => {
    let currentUserId = socket.handshake.query.userId || `user_${socket.id.slice(0, 6)}`;
    let currentUsername = socket.handshake.query.username || 'Player001';
    let currentRoomCode = null;

    // Đưa socket vào phòng riêng của người chơi
    socket.join(`user_${currentUserId}`);
    logger.info(`🔌 Người chơi kết nối: ${currentUsername} (${currentUserId}) [Socket ID: ${socket.id}]`);

    // Gửi ngay trạng thái ván chơi & số dư hiện tại cho người chơi mới vào
    const snapshot = gameEngine.getSnapshotForUser(currentUserId);
    socket.emit('sync_state', snapshot);

    // =========================================================================
    // 1. CÁC THAO TÁC CƯỢC ĐƠN / PUBLIC GAME
    // =========================================================================
    socket.on('place_bet', (data, callback) => {
      const { door, amount } = data || {};
      const result = gameEngine.placeBet(currentUserId, currentUsername, door, Number(amount));

      // Nếu đang trong phòng bạn bè, phát sóng cược cho bạn bè cùng thấy
      if (result.success && currentRoomCode) {
        roomService.broadcastRoomBet(currentRoomCode, {
          userId: currentUserId,
          username: currentUsername,
          door,
          amount: Number(amount),
          gameType: 'taixiu'
        }, io);
      }

      if (typeof callback === 'function') {
        callback(result);
      } else {
        socket.emit('place_bet_response', result);
      }
    });

    socket.on('cancel_bet', (data, callback) => {
      const result = gameEngine.cancelBet(currentUserId);
      if (typeof callback === 'function') {
        callback(result);
      } else {
        socket.emit('cancel_bet_response', result);
      }
    });

    socket.on('trigger_roll', (data, callback) => {
      const result = gameEngine.triggerEarlyRoll(currentUserId);
      if (typeof callback === 'function') {
        callback(result);
      }
    });

    socket.on('faucet_coin', (data, callback) => {
      const amount = Number(data?.amount) || 5000;
      const newBalance = UserService.faucet(currentUserId, amount);

      if (currentRoomCode) {
        db.updatePlayerRoomBalance(currentUserId, newBalance);
        const updatedRoom = roomService.getRoom(currentRoomCode);
        io.to(`room_${currentRoomCode}`).emit('room_state_updated', updatedRoom);
      }

      const resp = { success: true, newBalance, added: amount };
      if (typeof callback === 'function') callback(resp);
      socket.emit('balance_updated', { balance: newBalance });
    });

    // =========================================================================
    // 2. CHƠI CHUNG VỚI BẠN BÈ (MULTIPLAYER ROOMS)
    // =========================================================================

    // A. Tạo phòng chơi mới
    socket.on('room_create', (data, callback) => {
      try {
        const { roomName, gameType, password, maxPlayers } = data || {};
        const room = roomService.createRoom({
          hostId: currentUserId,
          hostName: currentUsername,
          roomName,
          gameType: gameType || 'taixiu',
          password,
          maxPlayers
        });

        currentRoomCode = room.roomCode;
        socket.join(`room_${currentRoomCode}`);

        logger.info(`👥 ${currentUsername} tạo phòng bạn bè: ${currentRoomCode}`);
        if (typeof callback === 'function') {
          callback({ success: true, room });
        }
      } catch (err) {
        logger.error('Lỗi room_create:', err.message);
        if (typeof callback === 'function') {
          callback({ success: false, message: 'Không thể tạo phòng' });
        }
      }
    });

    // B. Tham gia phòng bạn bè bằng mã
    socket.on('room_join', (data, callback) => {
      try {
        const { roomCode, password } = data || {};
        const user = UserService.getUser(currentUserId, currentUsername);
        
        const res = roomService.joinRoom(roomCode, {
          userId: currentUserId,
          username: currentUsername,
          avatar: user.avatar,
          balance: user.balance,
          password: password || ''
        }, socket, io);

        if (res.success) {
          currentRoomCode = roomCode.toUpperCase();
        }

        if (typeof callback === 'function') {
          callback(res);
        }
      } catch (err) {
        logger.error('Lỗi room_join:', err.message);
        if (typeof callback === 'function') {
          callback({ success: false, message: 'Lỗi khi vào phòng' });
        }
      }
    });

    // C. Rời phòng
    socket.on('room_leave', (data, callback) => {
      const code = data?.roomCode || currentRoomCode;
      if (code) {
        roomService.leaveRoom(code, currentUserId, socket, io);
        currentRoomCode = null;
      }
      if (typeof callback === 'function') {
        callback({ success: true });
      }
    });

    // D. Lấy danh sách các phòng đang mở
    socket.on('room_list', (data, callback) => {
      const gameType = data?.gameType || null;
      const rooms = roomService.listRooms(gameType);
      if (typeof callback === 'function') {
        callback({ success: true, rooms });
      }
    });

    // E. Lấy chi tiết 1 phòng
    socket.on('room_get', (data, callback) => {
      const code = data?.roomCode || currentRoomCode;
      const room = roomService.getRoom(code);
      if (typeof callback === 'function') {
        callback({ success: !!room, room });
      }
    });

    // F. Chat trong phòng bạn bè
    socket.on('room_send_chat', (data, callback) => {
      const code = data?.roomCode || currentRoomCode;
      const content = data?.content;
      if (!code || !content) {
        if (typeof callback === 'function') callback({ success: false, message: 'Thiếu nội dung' });
        return;
      }

      const msg = roomService.sendRoomChat(code, {
        userId: currentUserId,
        username: currentUsername,
        content
      }, io);

      if (typeof callback === 'function') {
        callback({ success: true, message: msg });
      }
    });

    // G. Đồng bộ cược trong game Bầu Cua hoặc Ba Cây vào phòng bạn bè
    socket.on('room_sync_custom_bet', (data) => {
      const code = data?.roomCode || currentRoomCode;
      if (!code) return;

      roomService.broadcastRoomBet(code, {
        userId: currentUserId,
        username: currentUsername,
        door: data.door || 'Cược',
        amount: Number(data.amount) || 0,
        gameType: data.gameType || 'baucua'
      }, io);
    });

    // H. Đồng bộ khi thắng lớn trong game vào phòng bạn bè
    socket.on('room_sync_custom_win', (data) => {
      const code = data?.roomCode || currentRoomCode;
      if (!code) return;

      roomService.broadcastRoomWin(code, {
        userId: currentUserId,
        username: currentUsername,
        winAmount: Number(data.winAmount) || 0,
        door: data.door || 'Cửa Thắng'
      }, io);
    });

    // =========================================================================
    // 3. ADMIN & CONFIG
    // =========================================================================
    socket.on('admin_get_config', (callback) => {
      if (typeof callback === 'function') {
        callback({ success: true, config: db.getConfig() });
      }
    });

    socket.on('admin_update_config', (newConfig, callback) => {
      const updated = db.updateConfig(newConfig);
      if (typeof callback === 'function') {
        callback({ success: true, config: updated });
      }
      io.emit('config_updated', updated);
    });

    // =========================================================================
    // 4. NGẮT KẾT NỐI
    // =========================================================================
    socket.on('disconnect', () => {
      if (currentRoomCode) {
        roomService.leaveRoom(currentRoomCode, currentUserId, socket, io);
      }
      logger.info(`🔌 Người chơi ngắt kết nối: ${currentUsername} (${currentUserId})`);
    });
  });
}
