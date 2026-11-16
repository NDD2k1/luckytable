/**
 * SQLite Database Module - Lucky Table Casino Portal
 * Lưu trữ bền vững dữ liệu bằng SQLite: Người dùng, số dư ví, lịch sử ván cược, cấu hình game & phòng chơi bạn bè
 */

import fs from 'fs';
import path from 'path';
import initSqlJs from 'sql.js';
import { appConfig } from '../config/appConfig.js';
import { defaultGameConfig } from '../config/gameConfig.js';
import { logger } from '../utils/logger.js';

const SQLITE_FILE = path.join(appConfig.dataDir, 'game_db.sqlite');
const LEGACY_JSON_FILE = path.join(appConfig.dataDir, 'game_db.json');

class Database {
  constructor() {
    this.SQL = null;
    this.db = null;
    this.saveTimeout = null;
    this.isInitialized = false;
  }

  /**
   * Helper chuyển undefined thành null hoặc giá trị mặc định để SQLite không bị lỗi bind
   */
  sanitizeParams(params) {
    return params.map(val => (val === undefined ? null : val));
  }

  /**
   * Khởi tạo kết nối SQLite và tạo các bảng cần thiết
   */
  async init() {
    if (this.isInitialized) return;

    try {
      if (!fs.existsSync(appConfig.dataDir)) {
        fs.mkdirSync(appConfig.dataDir, { recursive: true });
      }

      this.SQL = await initSqlJs();

      if (fs.existsSync(SQLITE_FILE)) {
        const fileBuffer = fs.readFileSync(SQLITE_FILE);
        this.db = new this.SQL.Database(fileBuffer);
        logger.info(`📂 Đã tải SQLite Database từ disk: ${SQLITE_FILE}`);
      } else {
        this.db = new this.SQL.Database();
        logger.info(`🆕 Khởi tạo SQLite Database mới: ${SQLITE_FILE}`);
      }

      this.createTables();
      this.migrateLegacyJsonIfNeeded();
      this.saveSync();
      this.isInitialized = true;
    } catch (err) {
      logger.error('Lỗi khi khởi tạo SQLite Database:', err);
      throw err;
    }
  }

  /**
   * Tạo các bảng SQLite: users, rounds, rooms, room_players, room_messages, config
   */
  createTables() {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        balance INTEGER DEFAULT 10000,
        vip_level INTEGER DEFAULT 1,
        avatar TEXT DEFAULT 'assets/avatar.png',
        stats TEXT DEFAULT '{}',
        transactions TEXT DEFAULT '[]',
        bet_history TEXT DEFAULT '[]',
        created_at TEXT,
        last_active TEXT
      );

      CREATE TABLE IF NOT EXISTS rounds (
        id TEXT PRIMARY KEY,
        game_type TEXT NOT NULL DEFAULT 'taixiu',
        dices TEXT,
        total INTEGER,
        result TEXT,
        created_at TEXT
      );

      CREATE TABLE IF NOT EXISTS rooms (
        room_code TEXT PRIMARY KEY,
        room_name TEXT NOT NULL,
        game_type TEXT NOT NULL,
        host_id TEXT NOT NULL,
        host_name TEXT NOT NULL,
        password TEXT DEFAULT '',
        max_players INTEGER DEFAULT 8,
        status TEXT DEFAULT 'open',
        created_at TEXT
      );

      CREATE TABLE IF NOT EXISTS room_players (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        room_code TEXT NOT NULL,
        user_id TEXT NOT NULL,
        username TEXT NOT NULL,
        avatar TEXT,
        balance INTEGER DEFAULT 0,
        is_host INTEGER DEFAULT 0,
        is_ready INTEGER DEFAULT 1,
        joined_at TEXT,
        UNIQUE(room_code, user_id)
      );

      CREATE TABLE IF NOT EXISTS room_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        room_code TEXT NOT NULL,
        user_id TEXT NOT NULL,
        username TEXT NOT NULL,
        content TEXT NOT NULL,
        msg_type TEXT DEFAULT 'chat',
        created_at TEXT
      );

      CREATE TABLE IF NOT EXISTS config (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);

    // Khởi tạo config mặc định nếu chưa có
    const stmt = this.db.prepare('SELECT value FROM config WHERE key = ?');
    stmt.bind(['game_config']);
    if (!stmt.step()) {
      this.db.run('INSERT INTO config (key, value) VALUES (?, ?)', ['game_config', JSON.stringify(defaultGameConfig)]);
    }
    stmt.free();
  }

  /**
   * Tự động di chuyển dữ liệu từ file game_db.json cũ sang SQLite nếu có
   */
  migrateLegacyJsonIfNeeded() {
    try {
      if (!fs.existsSync(LEGACY_JSON_FILE)) return;

      const checkUsers = this.db.prepare('SELECT count(*) as count FROM users');
      checkUsers.step();
      const userCount = checkUsers.getAsObject().count;
      checkUsers.free();

      if (userCount > 0) return; // Đã có data trong SQLite

      logger.info('🔄 Đang di chuyển dữ liệu từ JSON sang SQLite...');
      const raw = fs.readFileSync(LEGACY_JSON_FILE, 'utf-8');
      const legacy = JSON.parse(raw);

      if (legacy.users) {
        const stmt = this.db.prepare(`
          INSERT OR REPLACE INTO users (id, username, balance, vip_level, avatar, stats, transactions, bet_history, created_at, last_active)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        for (const [uid, u] of Object.entries(legacy.users)) {
          stmt.run(this.sanitizeParams([
            uid,
            u.username || 'Player001',
            u.balance ?? 10000,
            u.vipLevel || 1,
            u.avatar || 'assets/avatar.png',
            JSON.stringify(u.stats || {}),
            JSON.stringify(u.transactions || []),
            JSON.stringify(u.betHistory || []),
            u.createdAt || new Date().toISOString(),
            u.lastActive || new Date().toISOString()
          ]));
        }
        stmt.free();
      }

      if (legacy.rounds && Array.isArray(legacy.rounds)) {
        const roundStmt = this.db.prepare(`
          INSERT OR REPLACE INTO rounds (id, game_type, dices, total, result, created_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `);
        for (const r of legacy.rounds) {
          roundStmt.run(this.sanitizeParams([
            r.id || r.roundId || `round_${Date.now()}`,
            r.gameType || 'taixiu',
            JSON.stringify(r.dices || r.dice || []),
            r.total ?? r.sum ?? 0,
            r.result || '',
            r.createdAt || r.timestamp || new Date().toISOString()
          ]));
        }
        roundStmt.free();
      }

      if (legacy.config) {
        this.db.run('INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)', ['game_config', JSON.stringify(legacy.config)]);
      }

      logger.info('✅ Hoàn tất chuyển đổi dữ liệu sang SQLite Database!');
    } catch (err) {
      logger.warn('Không thể tự động migrate JSON sang SQLite:', err.message);
    }
  }

  scheduleSave() {
    if (this.saveTimeout) clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => {
      this.saveSync();
    }, 150);
  }

  saveSync() {
    try {
      if (!this.db) return;
      const data = this.db.export();
      const buffer = Buffer.from(data);
      const tempPath = `${SQLITE_FILE}.tmp`;
      fs.writeFileSync(tempPath, buffer);
      fs.renameSync(tempPath, SQLITE_FILE);
    } catch (err) {
      logger.error('Lỗi khi lưu SQLite file ra đĩa:', err.message);
    }
  }

  // =========================================================================
  // USER API
  // =========================================================================
  getUser(userId) {
    if (!this.db) return null;
    const stmt = this.db.prepare('SELECT * FROM users WHERE id = ?');
    stmt.bind([userId]);
    let user = null;
    if (stmt.step()) {
      const row = stmt.getAsObject();
      user = {
        id: row.id,
        username: row.username,
        balance: row.balance,
        vipLevel: row.vip_level,
        avatar: row.avatar,
        stats: JSON.parse(row.stats || '{}'),
        transactions: JSON.parse(row.transactions || '[]'),
        betHistory: JSON.parse(row.bet_history || '[]'),
        createdAt: row.created_at,
        lastActive: row.last_active
      };
    }
    stmt.free();
    return user;
  }

  getOrCreateUser(userId, username = 'Player001') {
    let user = this.getUser(userId);
    if (!user) {
      const config = this.getConfig();
      const startingBalance = config?.currency?.startingBalance || 10000;
      const now = new Date().toISOString();
      const initialStats = {
        totalRounds: 0,
        wins: 0,
        losses: 0,
        currentWinStreak: 0,
        currentLossStreak: 0,
        totalBetAmount: 0,
        totalWonAmount: 0
      };

      const stmt = this.db.prepare(`
        INSERT INTO users (id, username, balance, vip_level, avatar, stats, transactions, bet_history, created_at, last_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(this.sanitizeParams([
        userId,
        username,
        startingBalance,
        1,
        'assets/avatar.png',
        JSON.stringify(initialStats),
        JSON.stringify([]),
        JSON.stringify([]),
        now,
        now
      ]));
      stmt.free();
      this.scheduleSave();
      logger.info(`Tạo người chơi mới trong SQLite: ${username} (${userId}) - Số dư: ${startingBalance}`);
      return this.getUser(userId);
    }

    // Cập nhật lastActive
    const now = new Date().toISOString();
    this.db.run('UPDATE users SET last_active = ? WHERE id = ?', [now, userId]);
    user.lastActive = now;
    return user;
  }

  updateUser(userId, updater) {
    const user = this.getUser(userId);
    if (!user) return null;

    updater(user);

    const now = new Date().toISOString();
    const stmt = this.db.prepare(`
      UPDATE users SET 
        username = ?, 
        balance = ?, 
        vip_level = ?, 
        avatar = ?, 
        stats = ?, 
        transactions = ?, 
        bet_history = ?, 
        last_active = ?
      WHERE id = ?
    `);

    stmt.run(this.sanitizeParams([
      user.username,
      user.balance,
      user.vipLevel || 1,
      user.avatar || 'assets/avatar.png',
      JSON.stringify(user.stats || {}),
      JSON.stringify(user.transactions || []),
      JSON.stringify(user.betHistory || []),
      now,
      userId
    ]));
    stmt.free();

    this.scheduleSave();
    return user;
  }

  // =========================================================================
  // ROUNDS HISTORY API
  // =========================================================================
  addRound(roundData) {
    if (!this.db) return roundData;
    const roundId = roundData.id || roundData.roundId || `round_${Date.now()}`;
    const dices = roundData.dices || roundData.dice || [];
    const total = roundData.total ?? roundData.sum ?? 0;
    const result = roundData.result || '';
    const createdAt = roundData.createdAt || roundData.timestamp || new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO rounds (id, game_type, dices, total, result, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(this.sanitizeParams([
      roundId,
      roundData.gameType || 'taixiu',
      JSON.stringify(dices),
      total,
      result,
      createdAt
    ]));
    stmt.free();

    // Giới hạn 100 ván gần nhất trong SQLite
    this.db.run(`
      DELETE FROM rounds WHERE id NOT IN (
        SELECT id FROM rounds ORDER BY created_at DESC LIMIT 100
      )
    `);

    this.scheduleSave();
    return roundData;
  }

  getRecentRounds(limit = 20) {
    if (!this.db) return [];
    const stmt = this.db.prepare('SELECT * FROM rounds ORDER BY created_at DESC LIMIT ?');
    stmt.bind([limit]);
    const list = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      list.push({
        id: row.id,
        roundId: row.id,
        gameType: row.game_type,
        dices: JSON.parse(row.dices || '[]'),
        dice: JSON.parse(row.dices || '[]'),
        total: row.total,
        sum: row.total,
        result: row.result,
        createdAt: row.created_at,
        timestamp: row.created_at
      });
    }
    stmt.free();
    return list;
  }

  // =========================================================================
  // CONFIG API
  // =========================================================================
  getConfig() {
    if (!this.db) return defaultGameConfig;
    const stmt = this.db.prepare('SELECT value FROM config WHERE key = ?');
    stmt.bind(['game_config']);
    let config = defaultGameConfig;
    if (stmt.step()) {
      try {
        config = JSON.parse(stmt.getAsObject().value);
      } catch (e) {
        config = defaultGameConfig;
      }
    }
    stmt.free();
    return config;
  }

  updateConfig(newConfig) {
    const current = this.getConfig();
    const updated = { ...current, ...newConfig };
    this.db.run('INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)', ['game_config', JSON.stringify(updated)]);
    this.scheduleSave();
    logger.info('Đã lưu cấu hình game & Pity Engine vào SQLite');
    return updated;
  }

  // =========================================================================
  // MULTIPLAYER ROOMS & CHƠI CHUNG VỚI BẠN BÈ API (SQLite)
  // =========================================================================

  /**
   * Tạo phòng chơi bạn bè mới
   */
  createRoom({ roomCode, roomName, gameType, hostId, hostName, password = '', maxPlayers = 8 }) {
    if (!this.db) return null;
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO rooms (room_code, room_name, game_type, host_id, host_name, password, max_players, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'open', ?)
    `);
    stmt.run(this.sanitizeParams([roomCode, roomName, gameType, hostId, hostName, password || '', maxPlayers, now]));
    stmt.free();

    // Thêm Host vào danh sách người chơi trong phòng
    const user = this.getUser(hostId);
    const hostAvatar = user?.avatar || 'assets/avatar.png';
    const hostBalance = user?.balance ?? 10000;

    const playerStmt = this.db.prepare(`
      INSERT OR REPLACE INTO room_players (room_code, user_id, username, avatar, balance, is_host, is_ready, joined_at)
      VALUES (?, ?, ?, ?, ?, 1, 1, ?)
    `);
    playerStmt.run(this.sanitizeParams([roomCode, hostId, hostName, hostAvatar, hostBalance, now]));
    playerStmt.free();

    // Thêm tin nhắn hệ thống tạo phòng
    this.addRoomMessage(roomCode, {
      userId: 'system',
      username: 'Hệ Thống',
      content: `🎉 Chủ phòng ${hostName} vừa tạo phòng ${roomName}!`,
      msgType: 'system'
    });

    this.scheduleSave();
    logger.info(`[ROOM] Đã tạo phòng mới: ${roomName} (${roomCode}) bởi ${hostName}`);
    return this.getRoom(roomCode);
  }

  /**
   * Lấy thông tin phòng chơi kèm danh sách người chơi và tin nhắn gần nhất
   */
  getRoom(roomCode) {
    if (!this.db) return null;

    const stmt = this.db.prepare('SELECT * FROM rooms WHERE room_code = ? AND status != ?');
    stmt.bind([roomCode, 'closed']);
    let room = null;
    if (stmt.step()) {
      room = stmt.getAsObject();
    }
    stmt.free();

    if (!room) return null;

    // Lấy danh sách thành viên trong phòng
    const pStmt = this.db.prepare('SELECT user_id, username, avatar, balance, is_host, is_ready, joined_at FROM room_players WHERE room_code = ?');
    pStmt.bind([roomCode]);
    const players = [];
    while (pStmt.step()) {
      players.push(pStmt.getAsObject());
    }
    pStmt.free();

    // Lấy 30 tin nhắn gần nhất
    const messages = this.getRoomMessages(roomCode, 30);

    return {
      roomCode: room.room_code,
      roomName: room.room_name,
      gameType: room.game_type,
      hostId: room.host_id,
      hostName: room.host_name,
      isPrivate: !!room.password,
      hasPassword: !!room.password,
      password: room.password,
      maxPlayers: room.max_players,
      status: room.status,
      createdAt: room.created_at,
      players,
      playerCount: players.length,
      messages
    };
  }

  /**
   * Lấy danh sách các phòng đang mở (Public Lobby)
   */
  listRooms(gameType = null) {
    if (!this.db) return [];

    let sql = `
      SELECT r.room_code, r.room_name, r.game_type, r.host_id, r.host_name, 
             r.password, r.max_players, r.status, r.created_at,
             COUNT(p.user_id) as player_count
      FROM rooms r
      LEFT JOIN room_players p ON r.room_code = p.room_code
      WHERE r.status = 'open'
    `;
    const params = [];
    if (gameType) {
      sql += ' AND r.game_type = ?';
      params.push(gameType);
    }
    sql += ' GROUP BY r.room_code ORDER BY r.created_at DESC LIMIT 50';

    const stmt = this.db.prepare(sql);
    if (params.length) stmt.bind(this.sanitizeParams(params));

    const list = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      list.push({
        roomCode: row.room_code,
        roomName: row.room_name,
        gameType: row.game_type,
        hostId: row.host_id,
        hostName: row.host_name,
        isPrivate: !!row.password,
        maxPlayers: row.max_players,
        playerCount: row.player_count,
        status: row.status,
        createdAt: row.created_at
      });
    }
    stmt.free();
    return list;
  }

  /**
   * Tham gia vào phòng chơi
   */
  joinRoom(roomCode, { userId, username, avatar = 'assets/avatar.png', balance = 10000, password = '' }) {
    if (!this.db) return { success: false, message: 'Database chưa sẵn sàng' };

    const room = this.getRoom(roomCode);
    if (!room) {
      return { success: false, message: 'Phòng không tồn tại hoặc đã đóng!' };
    }

    if (room.isPrivate && room.password !== password) {
      return { success: false, message: 'Mật khẩu phòng không chính xác!' };
    }

    if (room.players.length >= room.maxPlayers) {
      const exists = room.players.find(p => p.user_id === userId);
      if (!exists) {
        return { success: false, message: 'Phòng đã đầy người chơi!' };
      }
    }

    const now = new Date().toISOString();
    const user = this.getUser(userId);
    const userAvatar = user?.avatar || avatar;
    const userBalance = user?.balance ?? balance;

    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO room_players (room_code, user_id, username, avatar, balance, is_host, is_ready, joined_at)
      VALUES (?, ?, ?, ?, ?, 0, 1, ?)
    `);
    stmt.run(this.sanitizeParams([roomCode, userId, username, userAvatar, userBalance, now]));
    stmt.free();

    this.addRoomMessage(roomCode, {
      userId: 'system',
      username: 'Hệ Thống',
      content: `👋 Người chơi ${username} đã tham gia phòng!`,
      msgType: 'system'
    });

    this.scheduleSave();
    return { success: true, room: this.getRoom(roomCode) };
  }

  /**
   * Rời khỏi phòng
   */
  leaveRoom(roomCode, userId) {
    if (!this.db) return null;

    const room = this.getRoom(roomCode);
    if (!room) return null;

    const player = room.players.find(p => p.user_id === userId);
    const username = player?.username || 'Người chơi';

    this.db.run('DELETE FROM room_players WHERE room_code = ? AND user_id = ?', [roomCode, userId]);

    const remainingPlayersStmt = this.db.prepare('SELECT user_id, username FROM room_players WHERE room_code = ?');
    remainingPlayersStmt.bind([roomCode]);
    const remaining = [];
    while (remainingPlayersStmt.step()) {
      remaining.push(remainingPlayersStmt.getAsObject());
    }
    remainingPlayersStmt.free();

    if (remaining.length === 0) {
      this.db.run('UPDATE rooms SET status = ? WHERE room_code = ?', ['closed', roomCode]);
      logger.info(`[ROOM] Phòng ${roomCode} đã được đóng do hết người chơi.`);
    } else {
      if (room.hostId === userId) {
        const newHost = remaining[0];
        this.db.run('UPDATE rooms SET host_id = ?, host_name = ? WHERE room_code = ?', [newHost.user_id, newHost.username, roomCode]);
        this.db.run('UPDATE room_players SET is_host = 1 WHERE room_code = ? AND user_id = ?', [roomCode, newHost.user_id]);
        this.addRoomMessage(roomCode, {
          userId: 'system',
          username: 'Hệ Thống',
          content: `👑 ${newHost.username} đã trở thành chủ phòng mới!`,
          msgType: 'system'
        });
      }

      this.addRoomMessage(roomCode, {
        userId: 'system',
        username: 'Hệ Thống',
        content: `🚪 ${username} đã rời phòng.`,
        msgType: 'system'
      });
    }

    this.scheduleSave();
    return { remainingCount: remaining.length, newRoom: this.getRoom(roomCode) };
  }

  /**
   * Thêm tin nhắn chat phòng
   */
  addRoomMessage(roomCode, { userId, username, content, msgType = 'chat' }) {
    if (!this.db) return null;
    const now = new Date().toISOString();
    const stmt = this.db.prepare(`
      INSERT INTO room_messages (room_code, user_id, username, content, msg_type, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(this.sanitizeParams([roomCode, userId, username, content, msgType, now]));
    stmt.free();

    return {
      roomCode,
      userId,
      username,
      content,
      msgType,
      createdAt: now
    };
  }

  /**
   * Lấy lịch sử tin nhắn phòng
   */
  getRoomMessages(roomCode, limit = 50) {
    if (!this.db) return [];
    const stmt = this.db.prepare(`
      SELECT user_id as userId, username, content, msg_type as msgType, created_at as createdAt 
      FROM room_messages 
      WHERE room_code = ? 
      ORDER BY id DESC LIMIT ?
    `);
    stmt.bind([roomCode, limit]);
    const msgs = [];
    while (stmt.step()) {
      msgs.push(stmt.getAsObject());
    }
    stmt.free();
    return msgs.reverse();
  }

  /**
   * Cập nhật số dư người chơi trong phòng khi cược/thắng
   */
  updatePlayerRoomBalance(userId, newBalance) {
    if (!this.db) return;
    this.db.run('UPDATE room_players SET balance = ? WHERE user_id = ?', [newBalance, userId]);
  }
}

export const db = new Database();
