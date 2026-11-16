/**
 * Vercel Serverless Function Entrypoint
 * Bridges Express REST APIs and SQLite Database on Vercel
 */

import { createApp } from '../src/app.js';
import { db } from '../src/database/db.js';

let appInstance = null;

export default async function handler(req, res) {
  if (!appInstance) {
    try {
      await db.init();
    } catch (err) {
      console.error('Vercel SQLite Init Error:', err);
    }
    appInstance = createApp();
  }
  return appInstance(req, res);
}
