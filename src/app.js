/**
 * Express Application Setup
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import { appConfig } from './config/appConfig.js';
import apiRouter from './routes/api.js';

export function createApp() {
  const app = express();

  // Middlewares
  app.use(cors({ origin: appConfig.corsOrigin }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Phục vụ REST API
  app.use('/api', apiRouter);

  // Phục vụ Frontend tĩnh (HTML, CSS, JS, Assets) từ thư mục public/
  app.use(express.static(appConfig.publicDir));

  // Route trực tiếp vào bàn chơi Tài Xỉu
  app.get('/taixiu', (req, res) => {
    res.sendFile(path.join(appConfig.publicDir, 'taixiu.html'));
  });

  // Route trực tiếp vào bàn chơi Bầu Cua Tôm Cá 3D
  app.get('/baucua', (req, res) => {
    res.sendFile(path.join(appConfig.publicDir, 'baucua.html'));
  });

  // Route trực tiếp vào bàn chơi Ba Cây Hoàng Gia VIP
  app.get('/bacay', (req, res) => {
    res.sendFile(path.join(appConfig.publicDir, 'bacay.html'));
  });

  // SPA Fallback: Nếu không khớp route tĩnh/API thì trả về index.html (Lobby Trang Chủ)
  app.use((req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
      return next();
    }
    res.sendFile(path.join(appConfig.publicDir, 'index.html'));
  });

  return app;
}
