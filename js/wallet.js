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
