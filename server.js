/**
 * Main Server Entrypoint - Tài Xỉu Lucky Table & Multiplayer Friend Rooms
 * Khởi chạy HTTP Server, SQLite Database & Realtime Socket.io Game Server
 */

import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { createApp } from './src/app.js';
import { appConfig } from './src/config/appConfig.js';
import { setupGameSocket } from './src/sockets/gameSocket.js';
import { gameEngine } from './src/services/gameEngine.js';
import { db } from './src/database/db.js';
import { logger } from './src/utils/logger.js';

// Khởi tạo SQLite Database trước khi nhận request
await db.init();

const app = createApp();
const server = http.createServer(app);

// Khởi tạo Socket.io Server
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Gắn handlers Realtime Socket
setupGameSocket(io);

// Khởi động Vòng lặp Game Loop trên Server
gameEngine.start(io);

// Lắng nghe cổng
server.listen(appConfig.port, () => {
  const config = db.getConfig();
  const pityStatus = config.pityEngine.enabled ? '🟢 ĐANG BẬT (Smart Pity Active)' : '🔴 ĐANG TẮT (Ngẫu nhiên 100%)';

  console.log('\n===============================================================');
  console.log('       🎲 TÀI XỈU — LUCKY TABLE CASINO REALTIME SERVER        ');
  console.log('       👥 MULTIPLAYER FRIEND ROOMS & SQLITE PERSISTENCE        ');
  console.log('===============================================================');
  logger.info(`🚀 Server đang chạy tại: http://localhost:${appConfig.port}`);
  logger.info(`🗄️ Database: SQLite3 (data/game_db.sqlite)`);
  logger.info(`📡 WebSocket Server: Đã kích hoạt Socket.io`);
  logger.info(`📂 Static Assets: ${appConfig.publicDir}`);
  logger.info(`🧠 Pity Engine: ${pityStatus}`);
  logger.info(`⏱ Chu kỳ ván: Cược ${config.timing.bettingDurationSec}s | Xóc ${config.timing.rollingDurationSec}s | Mở ${config.timing.resultDurationSec}s`);
  console.log('===============================================================\n');
});

// Xử lý dừng server nhẹ nhàng
function gracefulShutdown(signal) {
  logger.warn(`Nhận tín hiệu ${signal}. Đang đóng server...`);
  server.close(() => {
    db.saveSync();
    logger.info('Server đã đóng hoàn tất. SQLite database đã được lưu an toàn.');
    process.exit(0);
  });
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
