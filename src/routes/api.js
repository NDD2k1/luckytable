/**
 * REST API Routes - Lucky Table Casino Portal
 */

import { Router } from 'express';
import { GameController, RoomController, ConfigController } from '../controllers/gameController.js';

const router = Router();

// Health check & Server Status
router.get('/health', (req, res) => {
  res.json({
    status: 'online',
    game: 'Tài Xỉu — Lucky Table Portal',
    database: 'SQLite3 (sql.js / game_db.sqlite)',
    timestamp: new Date().toISOString()
  });
});

// Game state & history
router.get('/game/status', GameController.getStatus);
router.get('/game/history', GameController.getHistory);

// User profile & transactions
router.get('/user/:userId', GameController.getUser);
router.post('/user/:userId/faucet', GameController.faucet);
router.post('/user/:userId/sync-balance', GameController.syncBalance);
router.post('/user/:userId/deposit', GameController.deposit);
router.post('/user/:userId/withdraw', GameController.withdraw);
router.post('/user/:userId/profile', GameController.updateProfile);
router.get('/user/:userId/transactions', GameController.getTransactions);

// Multiplayer Friend Rooms (Chơi chung bạn bè)
router.get('/rooms', RoomController.list);
router.get('/rooms/:roomCode', RoomController.get);
router.post('/rooms/create', RoomController.create);
router.post('/rooms/:roomCode/join', RoomController.join);
router.get('/rooms/:roomCode/messages', RoomController.getMessages);

// News & Announcements
router.get('/news', GameController.getNews);

// Admin Pity & Game Config
router.get('/admin/config', ConfigController.getConfig);
router.post('/admin/config', ConfigController.updateConfig);

export default router;
