/**
 * Game & Room REST Controllers
 */

import { gameEngine } from '../services/gameEngine.js';
import { db } from '../database/db.js';
import { UserService } from '../services/userService.js';
import { roomService } from '../services/roomService.js';

export const GameController = {
  getStatus(req, res) {
    const userId = req.query.userId || 'Player001';
    const snapshot = gameEngine.getSnapshotForUser(userId);
    res.json({ success: true, data: snapshot });
  },

  getHistory(req, res) {
    const limit = parseInt(req.query.limit, 10) || 30;
    const history = db.getRecentRounds(limit);
    res.json({ success: true, count: history.length, data: history });
  },

  getUser(req, res) {
    const { userId } = req.params;
    const user = UserService.getUser(userId);
    res.json({ success: true, data: user });
  },

  faucet(req, res) {
    const { userId } = req.params;
    const amount = parseInt(req.body.amount, 10) || 5000;
    const newBalance = UserService.faucet(userId, amount);
    res.json({ success: true, newBalance });
  },

  syncBalance(req, res) {
    const { userId } = req.params;
    const { balance } = req.body;
    const newBalance = UserService.setBalance(userId, balance);
    res.json({ success: true, balance: newBalance });
  },

  deposit(req, res) {
    const { userId } = req.params;
    const { amount, method, note } = req.body;
    const result = UserService.deposit(userId, amount, method, note);
    res.json(result);
  },

  withdraw(req, res) {
    const { userId } = req.params;
    const { amount, bankName, accountNumber, accountHolder } = req.body;
    const result = UserService.withdraw(userId, amount, bankName, accountNumber, accountHolder);
    res.json(result);
  },

  updateProfile(req, res) {
    const { userId } = req.params;
    const { username, avatar } = req.body;
    const result = UserService.updateProfile(userId, { username, avatar });
    res.json(result);
  },

  getTransactions(req, res) {
    const { userId } = req.params;
    const transactions = UserService.getTransactions(userId);
    res.json({ success: true, count: transactions.length, data: transactions });
  },

  getNews(req, res) {
    const news = [
      {
        id: 1,
        title: '🔥 Nổ Hũ Tài Xỉu Hoàng Gia: Thưởng nạp +100% lần đầu!',
        date: '13/11/2026',
        tag: 'HOT',
        summary: 'Tặng ngay 100% giá trị xu ảo cho lần nạp đầu tiên qua Cổng Thanh Toán QR Code tự động.',
        content: 'Chương trình tri ân người chơi với tổng giải thưởng lên đến 10.000.000 xu may mắn...'
      },
      {
        id: 2,
        title: '👥 Tính năng mới: Chơi Cùng Bạn Bè & Phòng VIP Riêng Tư!',
        date: '13/11/2026',
        tag: 'MỚI',
        summary: 'Tạo phòng, gửi mã cho bạn bè vào chơi chung Tài Xỉu, Bầu Cua, Ba Cây. Chat & thấy cược của nhau trong thời gian thực.',
        content: 'Hệ thống phòng riêng tư dùng SQLite lưu trữ bền vững, đồng bộ tức thời.'
      },
      {
        id: 3,
        title: '🏆 Sự kiện Đua Top Tài Xỉu tuần nhận Vương Miện VIP Rồng Vàng',
        date: '12/11/2026',
        tag: 'SỰ KIỆN',
        summary: 'Bảng xếp hạng tuần sẽ trao giải cho Top 10 cao thủ có số ván thắng nhiều nhất.',
        content: 'Top 1 nhận 500.000 xu + Danh hiệu Thần Tài VIP 👑'
      }
    ];
    res.json({ success: true, data: news });
  }
};

export const RoomController = {
  list(req, res) {
    const { gameType } = req.query;
    const rooms = roomService.listRooms(gameType || null);
    res.json({ success: true, count: rooms.length, rooms });
  },

  get(req, res) {
    const { roomCode } = req.params;
    const room = roomService.getRoom(roomCode);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Phòng không tồn tại hoặc đã đóng' });
    }
    res.json({ success: true, room });
  },

  create(req, res) {
    const { hostId, hostName, roomName, gameType, password, maxPlayers } = req.body;
    if (!hostId || !hostName) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin chủ phòng' });
    }
    const room = roomService.createRoom({
      hostId,
      hostName,
      roomName,
      gameType,
      password,
      maxPlayers
    });
    res.json({ success: true, room });
  },

  join(req, res) {
    const { roomCode } = req.params;
    const { userId, username, password } = req.body;
    const result = roomService.joinRoom(roomCode, { userId, username, password });
    res.json(result);
  },

  getMessages(req, res) {
    const { roomCode } = req.params;
    const limit = parseInt(req.query.limit, 10) || 50;
    const messages = db.getRoomMessages(roomCode.toUpperCase(), limit);
    res.json({ success: true, count: messages.length, messages });
  }
};

export const ConfigController = {
  getConfig(req, res) {
    res.json({ success: true, config: db.getConfig() });
  },

  updateConfig(req, res) {
    const updated = db.updateConfig(req.body);
    res.json({ success: true, message: 'Đã cập nhật cấu hình thành công', config: updated });
  }
};
