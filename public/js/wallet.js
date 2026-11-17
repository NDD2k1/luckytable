/**
 * Universal Casino Wallet & Account Session Manager - Lucky Table
 * Synchronizes user balance, profile, and transactions across all casino games
 * (Portal, Tai Xiu, Xoc Dia, Bau Cua, Ba Cay) and the server backend.
 */

const WALLET_KEYS = {
  BALANCE: 'lucky_casino_balance',
  LEGACY_TAIXIU: 'tai_xiu_balance',
  USER: 'lucky_casino_user'
};

const Wallet = {
  /**
   * Get current authenticated or guest user profile
   */
  getUser() {
    try {
      const raw = localStorage.getItem(WALLET_KEYS.USER);
      if (raw) {
        const u = JSON.parse(raw);
        if (u && typeof u === 'object') return u;
      }
    } catch (e) {}
    return {
      id: 'Player001',
      username: 'Player001',
      balance: 50000,
      vipLevel: 1,
      avatar: 'assets/avatar.png',
      isLoggedIn: false
    };
  },

  /**
   * Get current synchronized coin balance
   */
  getBalance() {
    try {
      const raw = localStorage.getItem(WALLET_KEYS.BALANCE);
      if (raw !== null && !isNaN(Number(raw))) {
        return Math.max(0, parseInt(raw, 10));
      }
      const legacy = localStorage.getItem(WALLET_KEYS.LEGACY_TAIXIU);
      if (legacy !== null && !isNaN(Number(legacy))) {
        return Math.max(0, parseInt(legacy, 10));
      }
      const user = this.getUser();
      if (user && typeof user.balance === 'number') {
        return Math.max(0, user.balance);
      }
    } catch (e) {}
    return 50000;
  },

  /**
   * Set and synchronize coin balance across all storage keys, session, and server
   */
  setBalance(amount, syncServer = true) {
    const validAmount = Math.max(0, Math.floor(amount));
    try {
      localStorage.setItem(WALLET_KEYS.BALANCE, validAmount.toString());
      localStorage.setItem(WALLET_KEYS.LEGACY_TAIXIU, validAmount.toString());

      const user = this.getUser();
      user.balance = validAmount;
      localStorage.setItem(WALLET_KEYS.USER, JSON.stringify(user));

      // Broadcast event to current and other tabs
      window.dispatchEvent(new CustomEvent('balanceChanged', { detail: { balance: validAmount } }));

      // Synchronize to backend server
      if (syncServer && user && user.id) {
        fetch(`/api/user/${user.id}/sync-balance`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ balance: validAmount })
        }).catch(() => {});
      }
    } catch (e) {
      console.warn('Wallet setBalance storage error:', e);
    }
    return validAmount;
  },

  /**
   * Add coins to balance
   */
  addBalance(amount, syncServer = true) {
    const current = this.getBalance();
    return this.setBalance(current + amount, syncServer);
  },

  /**
   * Deduct coins from balance
   */
  deductBalance(amount, syncServer = true) {
    const current = this.getBalance();
    if (current < amount) return false;
    return this.setBalance(current - amount, syncServer);
  },

  /**
   * Format coin amounts into human-friendly words (e.g., 10k, 100k, 1 triệu, 100 triệu, 1 tỷ)
   * Supports both Vietnamese and English locales.
   */
  formatWords(amount, withUnit = true) {
    const num = Number(amount) || 0;
    const isEn = (typeof window !== 'undefined' && window.i18n && window.i18n.currentLang === 'en') ||
                 (typeof localStorage !== 'undefined' && localStorage.getItem('lucky_casino_lang') === 'en');
    const unit = withUnit ? (isEn ? ' coins' : ' xu') : '';

    if (Math.abs(num) < 1000) {
      return num.toLocaleString(isEn ? 'en-US' : 'vi-VN') + unit;
    }

    const sign = num < 0 ? '-' : '';
    const abs = Math.abs(num);

    const formatDec = (val, maxDec = 2) => {
      let str = val.toFixed(maxDec);
      str = str.replace(/\.?0+$/, ''); // Strip unnecessary trailing zeroes (.00 -> '', .50 -> .5)
      return str;
    };

    if (abs >= 999500000000) {
      return sign + formatDec(abs / 1e12) + (isEn ? 'T' : ' nghìn tỷ') + (withUnit && !isEn ? ' xu' : unit);
    }
    if (abs >= 999500000) {
      return sign + formatDec(abs / 1e9) + (isEn ? 'B' : ' tỷ') + (withUnit && !isEn ? ' xu' : unit);
    }
    if (abs >= 999500) {
      return sign + formatDec(abs / 1e6) + (isEn ? 'M' : ' triệu') + (withUnit && !isEn ? ' xu' : unit);
    }
    if (abs >= 1000) {
      return sign + formatDec(abs / 1e3) + 'k' + (withUnit && !isEn ? ' xu' : unit);
    }

    return sign + abs.toLocaleString(isEn ? 'en-US' : 'vi-VN') + unit;
  },

  /**
   * Sync wallet with server
   */
  async syncWithServer() {
    const user = this.getUser();
    const currentBalance = this.getBalance();
    const userId = user && user.id ? user.id : 'Player001';

    try {
      const res = await fetch(`/api/user/${userId}`);
      const data = await res.json();
      if (data && data.success && data.data) {
        const serverBalance = data.data.balance;
        // If server balance differs from local balance
        if (serverBalance !== currentBalance) {
          // Push current balance to server to preserve game results
          await fetch(`/api/user/${userId}/sync-balance`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ balance: currentBalance })
          });
        }
      }
    } catch (e) {}
    return currentBalance;
  }
};

if (typeof window !== 'undefined') {
  window.Wallet = Wallet;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Wallet };
}
