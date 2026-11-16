/**
 * Vercel Serverless Function - Lucky Table REST API Handler
 * Cung cấp API nạp/rút tiền, thông tin người chơi, danh sách phòng và tin tức
 */

import express from 'express';
import cors from 'cors';

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Bộ nhớ đệm tạm thời cho môi trường Serverless Vercel
const users = {
  Player001: {
    id: 'Player001',
    username: 'Player001',
    balance: 50000,
    vipLevel: 2,
    avatar: 'assets/avatar.png',
    transactions: [
      {
        id: 'TXN1001',
        type: 'DEPOSIT',
        title: 'Nạp tiền qua MoMo',
        amount: 50000,
        status: 'SUCCESS',
        timestamp: new Date().toISOString()
      }
    ]
  }
};

const rooms = [
  {
    roomCode: 'PRO935',
    roomName: 'Hội Bạn Thân VIP',
    gameType: 'taixiu',
    hostId: 'user_demo1',
    hostName: 'Đại Gia Nam',
    isPrivate: false,
    maxPlayers: 8,
    playerCount: 1,
    status: 'open',
    createdAt: new Date().toISOString()
  },
  {
    roomCode: 'GOLD959',
    roomName: 'Sới Ba Cây Hoàng Gia',
    gameType: 'bacay',
    hostId: 'user_bacay1',
    hostName: 'Thần Bài VIP',
    isPrivate: false,
    maxPlayers: 8,
    playerCount: 1,
    status: 'open',
    createdAt: new Date().toISOString()
  },
  {
    roomCode: 'LUCK523',
    roomName: 'Hội Lắc Bầu Cua Đại Lộc',
    gameType: 'baucua',
    hostId: 'user_baucua1',
    hostName: 'Vua Bầu Cua',
    isPrivate: false,
    maxPlayers: 10,
    playerCount: 1,
    status: 'open',
    createdAt: new Date().toISOString()
  }
];

const news = [
  {
    id: 1,
    title: '🔥 Nổ Hũ Tài Xỉu Hoàng Gia: Thưởng nạp +100% lần đầu!',
    date: '16/11/2026',
    tag: 'HOT',
    summary: 'Tặng ngay 100% giá trị xu ảo cho lần nạp đầu tiên qua Cổng Thanh Toán QR Code tự động.'
  },
  {
    id: 2,
    title: '👥 Tính năng mới: Chơi Cùng Bạn Bè & Phòng VIP Riêng Tư!',
    date: '16/11/2026',
    tag: 'MỚI',
    summary: 'Tạo phòng, gửi mã cho bạn bè vào chơi chung Tài Xỉu, Bầu Cua, Ba Cây.'
  },
  {
    id: 3,
    title: '🏆 Sự kiện Đua Top Tài Xỉu tuần nhận Vương Miện VIP Rồng Vàng',
    date: '15/11/2026',
    tag: 'SỰ KIỆN',
    summary: 'Bảng xếp hạng tuần sẽ trao giải cho Top 10 cao thủ có số ván thắng nhiều nhất.'
  }
];

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    platform: 'Vercel Serverless',
    game: 'Tài Xỉu — Lucky Table Portal',
    timestamp: new Date().toISOString()
  });
});

// Game News
app.get('/api/news', (req, res) => {
  res.json({ success: true, data: news });
});

// User Profile & Balance
app.get('/api/user/:userId', (req, res) => {
  const { userId } = req.params;
  if (!users[userId]) {
    users[userId] = {
      id: userId,
      username: userId,
      balance: 50000,
      vipLevel: 1,
      avatar: 'assets/avatar.png',
      transactions: []
    };
  }
  res.json({ success: true, data: users[userId] });
});

app.post('/api/user/:userId/deposit', (req, res) => {
  const { userId } = req.params;
  const amount = parseInt(req.body.amount, 10) || 10000;
  if (!users[userId]) users[userId] = { id: userId, username: userId, balance: 50000, vipLevel: 1, avatar: 'assets/avatar.png', transactions: [] };
  users[userId].balance += amount;
  users[userId].transactions.unshift({
    id: 'DEP' + Date.now(),
    type: 'DEPOSIT',
    title: 'Nạp tiền qua Cổng Thanh Toán',
    amount,
    status: 'SUCCESS',
    timestamp: new Date().toISOString()
  });
  res.json({ success: true, balance: users[userId].balance, added: amount });
});

app.post('/api/user/:userId/withdraw', (req, res) => {
  const { userId } = req.params;
  const amount = parseInt(req.body.amount, 10) || 10000;
  if (!users[userId]) users[userId] = { id: userId, username: userId, balance: 50000, vipLevel: 1, avatar: 'assets/avatar.png', transactions: [] };
  users[userId].balance = Math.max(0, users[userId].balance - amount);
  users[userId].transactions.unshift({
    id: 'WTH' + Date.now(),
    type: 'WITHDRAW',
    title: `Rút tiền về ${req.body.bankName || 'Ngân hàng'}`,
    amount,
    status: 'SUCCESS',
    timestamp: new Date().toISOString()
  });
  res.json({ success: true, balance: users[userId].balance, deducted: amount });
});

app.post('/api/user/:userId/sync-balance', (req, res) => {
  const { userId } = req.params;
  const balance = parseInt(req.body.balance, 10);
  if (!users[userId]) users[userId] = { id: userId, username: userId, balance: 50000, vipLevel: 1, avatar: 'assets/avatar.png', transactions: [] };
  if (!isNaN(balance)) users[userId].balance = balance;
  res.json({ success: true, balance: users[userId].balance });
});

app.post('/api/user/:userId/profile', (req, res) => {
  const { userId } = req.params;
  const { username } = req.body;
  if (!users[userId]) users[userId] = { id: userId, username: userId, balance: 50000, vipLevel: 1, avatar: 'assets/avatar.png', transactions: [] };
  if (username) users[userId].username = username;
  res.json({ success: true, user: users[userId] });
});

app.get('/api/user/:userId/transactions', (req, res) => {
  const { userId } = req.params;
  const user = users[userId] || { transactions: [] };
  res.json({ success: true, count: user.transactions.length, data: user.transactions });
});

// Rooms API
app.get('/api/rooms', (req, res) => {
  const { gameType } = req.query;
  const filtered = gameType ? rooms.filter(r => r.gameType === gameType) : rooms;
  res.json({ success: true, count: filtered.length, rooms: filtered });
});

app.get('/api/rooms/:roomCode', (req, res) => {
  const { roomCode } = req.params;
  const r = rooms.find(item => item.roomCode === roomCode.toUpperCase());
  if (r) {
    res.json({ success: true, room: r });
  } else {
    res.status(404).json({ success: false, message: 'Phòng không tồn tại' });
  }
});

app.post('/api/rooms/create', (req, res) => {
  const { hostId, hostName, roomName, gameType, maxPlayers, password } = req.body;
  const roomCode = 'VIP' + Math.floor(100 + Math.random() * 900);
  const newRoom = {
    roomCode,
    roomName: roomName || `Phòng ${roomCode}`,
    gameType: gameType || 'taixiu',
    hostId: hostId || 'u1',
    hostName: hostName || 'Chủ Phòng',
    isPrivate: !!password,
    maxPlayers: Number(maxPlayers) || 8,
    playerCount: 1,
    status: 'open',
    createdAt: new Date().toISOString()
  };
  rooms.unshift(newRoom);
  res.json({ success: true, room: newRoom });
});

export default app;
