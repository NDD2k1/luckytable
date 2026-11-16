/**
 * Storage Module - Lucky Table Tài Xỉu
 * Quản lý lưu trữ trạng thái người chơi, lịch sử và thống kê vào localStorage
 */

const STORAGE_KEYS = {
  BALANCE: 'tai_xiu_balance',
  HISTORY: 'tai_xiu_history',
  STATS: 'tai_xiu_stats',
  SOUND: 'tai_xiu_sound_enabled'
};

const DEFAULT_BALANCE = 10000;
const MAX_HISTORY_ITEMS = 50;

// Safe localStorage accessor
function getStorage() {
  if (typeof localStorage !== 'undefined') {
    return localStorage;
  }
  // Memory fallback for non-browser/test environments
  if (!globalThis._mockStorage) {
    globalThis._mockStorage = new Map();
  }
  return {
    getItem: (key) => globalThis._mockStorage.get(key) ?? null,
    setItem: (key, val) => globalThis._mockStorage.set(key, String(val)),
    removeItem: (key) => globalThis._mockStorage.delete(key),
    clear: () => globalThis._mockStorage.clear()
  };
}

export const Storage = {
  /**
   * Lấy số dư hiện tại của người chơi
   * @returns {number}
   */
  getBalance() {
    const store = getStorage();
    const raw = store.getItem(STORAGE_KEYS.BALANCE);
    if (raw === null || isNaN(Number(raw))) {
      this.setBalance(DEFAULT_BALANCE);
      return DEFAULT_BALANCE;
    }
    return Math.max(0, parseInt(raw, 10));
  },

  /**
   * Cập nhật số dư
   * @param {number} amount 
   */
  setBalance(amount) {
    const store = getStorage();
    const validAmount = Math.max(0, Math.floor(amount));
    store.setItem(STORAGE_KEYS.BALANCE, validAmount.toString());
    return validAmount;
  },

  /**
   * Lấy danh sách lịch sử các lượt chơi
   * @returns {Array}
   */
  getHistory() {
    try {
      const store = getStorage();
      const raw = store.getItem(STORAGE_KEYS.HISTORY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error('Lỗi khi đọc lịch sử từ storage:', e);
      return [];
    }
  },

  /**
   * Thêm một kết quả vào lịch sử
   * @param {Object} record 
   */
  addHistory(record) {
    const store = getStorage();
    const history = this.getHistory();
    history.unshift(record);
    if (history.length > MAX_HISTORY_ITEMS) {
      history.length = MAX_HISTORY_ITEMS;
    }
    store.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
    return history;
  },

  /**
   * Lấy thống kê tổng quan
   * @returns {Object}
   */
  getStats() {
    try {
      const store = getStorage();
      const raw = store.getItem(STORAGE_KEYS.STATS);
      if (!raw) {
        return {
          totalRounds: 0,
          taiCount: 0,
          xiuCount: 0,
          wins: 0,
          losses: 0
        };
      }
      return JSON.parse(raw);
    } catch (e) {
      return {
        totalRounds: 0,
        taiCount: 0,
        xiuCount: 0,
        wins: 0,
        losses: 0
      };
    }
  },

  /**
   * Cập nhật số liệu thống kê sau mỗi ván
   * @param {Object} record
   */
  updateStats(record) {
    const store = getStorage();
    const stats = this.getStats();
    stats.totalRounds += 1;
    if (record.result === 'tai') {
      stats.taiCount += 1;
    } else if (record.result === 'xiu') {
      stats.xiuCount += 1;
    }

    if (record.betDoor) {
      if (record.isWin) {
        stats.wins += 1;
      } else {
        stats.losses += 1;
      }
    }

    store.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
    return stats;
  },

  /**
   * Trạng thái âm thanh
   */
  isSoundEnabled() {
    const store = getStorage();
    const val = store.getItem(STORAGE_KEYS.SOUND);
    return val === null ? true : val === 'true';
  },

  setSoundEnabled(enabled) {
    const store = getStorage();
    store.setItem(STORAGE_KEYS.SOUND, enabled ? 'true' : 'false');
  },

  /**
   * Reset toàn bộ dữ liệu demo về mặc định
   */
  resetAll() {
    const store = getStorage();
    store.setItem(STORAGE_KEYS.BALANCE, DEFAULT_BALANCE.toString());
    store.setItem(STORAGE_KEYS.HISTORY, JSON.stringify([]));
    store.setItem(STORAGE_KEYS.STATS, JSON.stringify({
      totalRounds: 0,
      taiCount: 0,
      xiuCount: 0,
      wins: 0,
      losses: 0
    }));
    return {
      balance: DEFAULT_BALANCE,
      history: [],
      stats: { totalRounds: 0, taiCount: 0, xiuCount: 0, wins: 0, losses: 0 }
    };
  }
};
