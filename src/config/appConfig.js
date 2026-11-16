/**
 * Application Global Configuration
 */
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const appConfig = {
  port: process.env.PORT || 8080,
  env: process.env.NODE_ENV || 'development',
  corsOrigin: '*',
  publicDir: path.join(__dirname, '../../public'),
  dataDir: path.join(__dirname, '../../data')
};
