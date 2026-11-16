/**
 * Room Service - Quản lý phòng chơi chung nhiều người (Multiplayer with Friends)
 * Hỗ trợ tạo phòng, vào bằng mã, chat phòng, đồng bộ cược bạn bè thời gian thực
 */

import { db } from '../database/db.js';
import { logger } from '../utils/logger.js';

class RoomService {
  /**
   * Tạo mã phòng ngắn ngẫu nhiên dễ nhớ (ví dụ: VIP789, LUCK88)
   */
  generateRoomCode() {
    const prefixes = ['VIP', 'LUCK', 'WIN', 'PRO', 'GOLD'];
    const p = prefixes[Math.floor(Math.random() * prefixes.length)];
    const num = Math.floor(100 + Math.random() * 900);
    return `${p}${num}`;
  }

  /**
   * Tạo phòng chơi mới
   */
  createRoom({ hostId, hostName, roomName, gameType = 'taixiu', password = '', maxPlayers = 8 }) {
    let roomCode = this.generateRoomCode();
    // Đảm bảo không trùng mã phòng đang mở
    let attempts = 0;
    while (db.getRoom(roomCode) && attempts < 10) {
      roomCode = this.generateRoomCode();
      attempts++;
    }

    const room = db.createRoom({
      roomCode,
      roomName: roomName || `Phòng ${roomCode} của ${hostName}`,
      gameType,
      hostId,
      hostName,
      password,
      maxPlayers: Number(maxPlayers) || 8
    });

    return room;
  }

  /**
   * Lấy thông tin phòng
   */
  getRoom(roomCode) {
    if (!roomCode) return null;
    return db.getRoom(roomCode.toUpperCase());
  }

  /**
   * Danh sách các phòng đang mở
   */
  listRooms(gameType = null) {
    return db.listRooms(gameType);
  }

  /**
   * Tham gia phòng
   */
  joinRoom(roomCode, { userId, username, avatar, balance, password }, socket = null, io = null) {
    const code = roomCode.toUpperCase();
    const result = db.joinRoom(code, { userId, username, avatar, balance, password });

    if (!result.success) {
      return result;
    }

    if (socket) {
      socket.join(`room_${code}`);
    }

    if (io) {
      // Gửi cập nhật danh sách người chơi mới nhất cho cả phòng
      const updatedRoom = db.getRoom(code);
      io.to(`room_${code}`).emit('room_state_updated', updatedRoom);
      io.to(`room_${code}`).emit('room_player_joined', {
        userId,
        username,
        message: `${username} vừa tham gia bàn chơi!`
      });
    }

    return result;
  }

  /**
   * Rời khỏi phòng
   */
  leaveRoom(roomCode, userId, socket = null, io = null) {
    const code = roomCode?.toUpperCase();
    if (!code) return;

    if (socket) {
      socket.leave(`room_${code}`);
    }

    const res = db.leaveRoom(code, userId);

    if (io) {
      const updatedRoom = db.getRoom(code);
      if (updatedRoom) {
        io.to(`room_${code}`).emit('room_state_updated', updatedRoom);
      }
      io.to(`room_${code}`).emit('room_player_left', {
        userId,
        message: `Một người chơi đã rời khỏi bàn.`
      });
    }

    return res;
  }

  /**
   * Gửi tin nhắn chat trong phòng
   */
  sendRoomChat(roomCode, { userId, username, content }, io) {
    const code = roomCode?.toUpperCase();
    if (!code || !content) return null;

    const trimmed = content.trim().slice(0, 200);
    const msg = db.addRoomMessage(code, {
      userId,
      username,
      content: trimmed,
      msgType: 'chat'
    });

    if (io && msg) {
      io.to(`room_${code}`).emit('room_new_message', msg);
    }

    return msg;
  }

  /**
   * Đồng bộ cược bạn bè trong phòng (để mọi người thấy bạn mình đang đặt cửa nào)
   */
  broadcastRoomBet(roomCode, { userId, username, door, amount, gameType }, io) {
    const code = roomCode?.toUpperCase();
    if (!code || !io) return;

    // Thêm tin nhắn hệ thống cược vào chat phòng
    const betMsg = db.addRoomMessage(code, {
      userId,
      username,
      content: `🔥 đã đặt cược ${Number(amount).toLocaleString('vi-VN')} xu vào cửa [${door.toUpperCase()}]!`,
      msgType: 'bet'
    });

    io.to(`room_${code}`).emit('room_player_bet', {
      userId,
      username,
      door,
      amount,
      gameType,
      message: betMsg
    });
  }

  /**
   * Phát thông báo kết quả thắng lớn cho cả phòng
   */
  broadcastRoomWin(roomCode, { userId, username, winAmount, door }, io) {
    const code = roomCode?.toUpperCase();
    if (!code || !io) return;

    const winMsg = db.addRoomMessage(code, {
      userId,
      username,
      content: `🎉 THẮNG LỚN +${Number(winAmount).toLocaleString('vi-VN')} xu tại cửa [${door.toUpperCase()}]!`,
      msgType: 'win'
    });

    io.to(`room_${code}`).emit('room_player_win', {
      userId,
      username,
      winAmount,
      door,
      message: winMsg
    });
  }
}

export const roomService = new RoomService();
