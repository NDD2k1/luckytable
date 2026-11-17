/**
 * Lucky Table - Vercel Serverless & Express Entrypoint
 * Phục vụ Giao diện người dùng Cổng Game & REST API Serverless
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(process.cwd(), 'public');

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Phục vụ static files từ thư mục public
app.use(express.static(publicDir));

// Bộ nhớ đệm tạm thời cho môi trường Serverless Vercel
const users = {
  admin: {
    id: 'admin',
    username: 'admin',
    password: 'admin123',
    role: 'admin',
    balance: 999999999,
    vipLevel: 10,
    avatar: 'assets/avatar.png',
    transactions: [
      {
        id: 'SYS1001',
        type: 'DEPOSIT',
        title: 'Hệ thống Quản Trị Viên',
        amount: 999999999,
        status: 'SUCCESS',
        timestamp: new Date().toISOString()
      }
    ]
  },
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

// Tạo router chung cho API
const router = express.Router();

// Health Check
router.get(['/', '/health'], (req, res) => {
  res.json({
    status: 'online',
    platform: 'Vercel Serverless Express',
    game: 'Lucky Table Casino Portal',
    timestamp: new Date().toISOString()
  });
});


// ĐĂNG KÝ TÀI KHOẢN MỚI
router.post('/auth/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Vui lòng nhập tên tài khoản và mật khẩu' });
  }
  const cleanUser = username.trim();
  if (cleanUser.length < 3) {
    return res.status(400).json({ success: false, message: 'Tên tài khoản phải từ 3 ký tự trở lên' });
  }
  if (users[cleanUser]) {
    return res.status(400).json({ success: false, message: 'Tên tài khoản này đã được sử dụng' });
  }

  // Khởi tạo tài khoản mới tặng ngay 50.000 xu khởi nghiệp
  users[cleanUser] = {
    id: cleanUser,
    username: cleanUser,
    password: password,
    balance: 50000,
    vipLevel: 1,
    avatar: 'assets/avatar.png',
    transactions: [
      {
        id: 'BONUS' + Date.now(),
        type: 'DEPOSIT',
        title: 'Quà tặng tân thủ đăng ký',
        amount: 50000,
        status: 'SUCCESS',
        timestamp: new Date().toISOString()
      }
    ]
  };

  const userSafe = { ...users[cleanUser] };
  delete userSafe.password;
  res.json({ success: true, message: 'Đăng ký tài khoản thành công! Tặng ngay +50.000 xu', user: userSafe });
});

// ĐĂNG NHẬP TÀI KHOẢN
router.post('/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ tài khoản và mật khẩu' });
  }
  const cleanUser = username.trim();
  const existing = users[cleanUser];

  if (!existing || (existing.password && existing.password !== password)) {
    return res.status(401).json({ success: false, message: 'Sai tên đăng nhập hoặc mật khẩu!' });
  }

  const userSafe = { ...existing };
  delete userSafe.password;
  res.json({ success: true, message: 'Đăng nhập thành công!', user: userSafe });
});

// =========================================================================
// ADMIN DASHBOARD APIS
// =========================================================================

// Get dashboard statistical metrics
router.get('/admin/stats', (req, res) => {
  const userList = Object.values(users);
  const totalBalance = userList.reduce((acc, u) => acc + (u.balance || 0), 0);
  const totalTransactions = userList.reduce((acc, u) => acc + (u.transactions ? u.transactions.length : 0), 0);
  res.json({
    success: true,
    data: {
      totalUsers: userList.length,
      totalBalance,
      totalTransactions,
      activeGames: 4,
      totalGames: 6
    }
  });
});

// Get all aggregated transactions for audit & history modal
router.get('/admin/transactions', (req, res) => {
  const allTxns = [];
  for (const user of Object.values(users)) {
    if (user.transactions && Array.isArray(user.transactions)) {
      for (const t of user.transactions) {
        allTxns.push({
          ...t,
          username: user.username
        });
      }
    }
  }
  allTxns.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
  res.json({ success: true, count: allTxns.length, data: allTxns });
});

// Get user accounts list
router.get('/admin/users', (req, res) => {
  const userList = Object.values(users).map(u => {
    const safe = { ...u };
    delete safe.password;
    return safe;
  });
  res.json({ success: true, count: userList.length, data: userList });
});

// Adjust user coin balance (compensation or deduction)
router.post('/admin/adjust-balance', (req, res) => {
  const { username, amount, type, reason } = req.body;
  if (!username) {
    return res.status(400).json({ success: false, message: 'Vui lòng cung cấp tên người dùng!' });
  }
  const cleanAmount = parseInt(amount, 10);
  if (isNaN(cleanAmount) || cleanAmount <= 0) {
    return res.status(400).json({ success: false, message: 'Số xu điều chỉnh phải là số dương hợp lệ!' });
  }

  const cleanUser = username.trim();
  if (!users[cleanUser]) {
    users[cleanUser] = {
      id: cleanUser,
      username: cleanUser,
      balance: 50000,
      vipLevel: 1,
      role: cleanUser.toLowerCase() === 'admin' ? 'admin' : 'player',
      avatar: 'assets/avatar.png',
      transactions: []
    };
  }

  const isAdd = type !== 'DEDUCT';
  if (isAdd) {
    users[cleanUser].balance += cleanAmount;
  } else {
    users[cleanUser].balance = Math.max(0, users[cleanUser].balance - cleanAmount);
  }

  const txnId = 'ADJ' + Date.now();
  const txnRecord = {
    id: txnId,
    type: isAdd ? 'DEPOSIT' : 'WITHDRAW',
    title: reason || (isAdd ? 'Cộng xu hỗ trợ kỹ thuật (Admin)' : 'Khấu trừ xu kỹ thuật (Admin)'),
    amount: cleanAmount,
    status: 'SUCCESS',
    timestamp: new Date().toISOString()
  };

  if (!users[cleanUser].transactions) users[cleanUser].transactions = [];
  users[cleanUser].transactions.unshift(txnRecord);

  res.json({
    success: true,
    message: `Đã ${isAdd ? 'cộng' : 'khấu trừ'} thành công ${cleanAmount.toLocaleString('vi-VN')} xu cho tài khoản ${cleanUser}!`,
    user: {
      id: users[cleanUser].id,
      username: users[cleanUser].username,
      balance: users[cleanUser].balance,
      vipLevel: users[cleanUser].vipLevel
    },
    transaction: txnRecord
  });
});

// Game News
router.get('/news', (req, res) => {
  res.json({ success: true, data: news });
});

// User Profile & Balance
router.get('/user/:userId', (req, res) => {
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

router.post('/user/:userId/deposit', (req, res) => {
  const { userId } = req.params;
  const amount = parseInt(req.body.amount, 10) || 10000;
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

router.post('/user/:userId/withdraw', (req, res) => {
  const { userId } = req.params;
  const amount = parseInt(req.body.amount, 10) || 10000;
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

router.post('/user/:userId/sync-balance', (req, res) => {
  const { userId } = req.params;
  const balance = parseInt(req.body.balance, 10);
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
  if (!isNaN(balance)) users[userId].balance = balance;
  res.json({ success: true, balance: users[userId].balance });
});

router.post('/user/:userId/profile', (req, res) => {
  const { userId } = req.params;
  const { username } = req.body;
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
  if (username) users[userId].username = username;
  res.json({ success: true, user: users[userId] });
});

router.get('/user/:userId/transactions', (req, res) => {
  const { userId } = req.params;
  const user = users[userId] || { transactions: [] };
  res.json({ success: true, count: user.transactions.length, data: user.transactions });
});

// Rooms API
router.get('/rooms', (req, res) => {
  const { gameType } = req.query;
  const filtered = gameType ? rooms.filter(r => r.gameType === gameType) : rooms;
  res.json({ success: true, count: filtered.length, rooms: filtered });
});

router.get('/rooms/:roomCode', (req, res) => {
  const { roomCode } = req.params;
  const r = rooms.find(item => item.roomCode === roomCode.toUpperCase());
  if (r) {
    res.json({ success: true, room: r });
  } else {
    res.status(404).json({ success: false, message: 'Phòng không tồn tại' });
  }
});

router.post('/rooms/create', (req, res) => {
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

// Gắn router vào cả /api và /
app.use('/api', router);

// Route HTML phục vụ trực tiếp các trang game
app.get('/', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.get(['/dashboard', '/dashboard.html'], (req, res) => {
  res.sendFile(path.join(publicDir, 'dashboard.html'));
});

app.get(['/taixiu', '/taixiu.html'], (req, res) => {
  res.sendFile(path.join(publicDir, 'taixiu.html'));
});

app.get(['/xocdia', '/xocdia.html'], (req, res) => {
  res.sendFile(path.join(publicDir, 'xocdia.html'));
});

app.get(['/baucua', '/baucua.html'], (req, res) => {
  res.sendFile(path.join(publicDir, 'baucua.html'));
});

app.get(['/bacay', '/bacay.html'], (req, res) => {
  res.sendFile(path.join(publicDir, 'bacay.html'));
});

// Fallback 404 handler cho các API không tồn tại
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint ${req.method} ${req.url} không tìm thấy`
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Express Error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

// Export default app cho Vercel Node Runtime
export default app;
