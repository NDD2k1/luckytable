/**
 * User Service - Quản lý tài khoản, số dư xu & thống kê cược người chơi
 */

import { db } from '../database/db.js';
import { logger } from '../utils/logger.js';

export const UserService = {
  /**
   * Lấy hoặc tạo thông tin người chơi
   */
  getUser(userId, username = 'Player001') {
    const user = db.getOrCreateUser(userId, username);
    if (!user.transactions) user.transactions = [];
    if (!user.vipLevel) user.vipLevel = 1;
    if (!user.avatar) user.avatar = 'assets/avatar.png';
    return user;
  },

  /**
   * Trừ tiền cược của người chơi
   */
  deductBet(userId, amount) {
    const user = this.getUser(userId);
    if (!user) return { success: false, message: 'Không tìm thấy người chơi' };

    if (user.balance < amount) {
      return { success: false, message: 'Số dư không đủ để đặt cược' };
    }

    db.updateUser(userId, (u) => {
      u.balance -= amount;
      u.stats.totalBetAmount += amount;
    });

    return { success: true, balance: user.balance };
  },

  /**
   * Hoàn tiền cược khi hủy hoặc hủy ván
   */
  refundBet(userId, amount) {
    const user = this.getUser(userId);
    if (!user) return null;

    db.updateUser(userId, (u) => {
      u.balance += amount;
      u.stats.totalBetAmount = Math.max(0, u.stats.totalBetAmount - amount);
    });

    return user.balance;
  },

  /**
   * Cộng tiền thắng cược và cập nhật chuỗi thắng/thua
   */
  settleRoundForUser(userId, roundId, betDoor, betAmount, isWin, payoutAmount) {
    const user = this.getUser(userId);
    if (!user) return null;

    db.updateUser(userId, (u) => {
      u.stats.totalRounds += 1;

      if (isWin) {
        u.balance += payoutAmount;
        u.stats.wins += 1;
        u.stats.currentWinStreak += 1;
        u.stats.currentLossStreak = 0; // Cắt đứt dây đen
        u.stats.totalWonAmount += payoutAmount;
      } else {
        u.stats.losses += 1;
        u.stats.currentLossStreak += 1; // Tăng dây đen
        u.stats.currentWinStreak = 0;
      }

      // Lưu vào lịch sử cược cá nhân của user
      if (!u.betHistory) u.betHistory = [];
      u.betHistory.unshift({
        roundId,
        betDoor,
        betAmount,
        isWin,
        payoutAmount,
        balanceAfter: u.balance,
        timestamp: new Date().toISOString()
      });

      if (u.betHistory.length > 50) {
        u.betHistory.length = 50;
      }
    });

    return {
      userId,
      newBalance: user.balance,
      isWin,
      payoutAmount,
      winStreak: user.stats.currentWinStreak,
      lossStreak: user.stats.currentLossStreak
    };
  },

  /**
   * Nạp nhanh xu demo (+)
   */
  faucet(userId, amount = 5000) {
    const user = this.getUser(userId);
    if (!user) return null;

    db.updateUser(userId, (u) => {
      u.balance += amount;
      if (!u.transactions) u.transactions = [];
      u.transactions.unshift({
        id: `TXN${Date.now()}`,
        type: 'FAUCET',
        title: 'Nạp nhanh may mắn (+)',
        amount,
        status: 'SUCCESS',
        timestamp: new Date().toISOString()
      });
    });

    logger.info(`Nạp nhanh +${amount} xu cho người chơi ${user.username} (${userId}) - Số dư mới: ${user.balance}`);
    return user.balance;
  },

  /**
   * Đồng bộ số dư trực tiếp giữa các game
   */
  setBalance(userId, balance) {
    const user = this.getUser(userId);
    if (!user) return null;
    const valid = Math.max(0, parseInt(balance, 10));
    db.updateUser(userId, (u) => {
      u.balance = valid;
    });
    return valid;
  },

  /**
   * Nạp tiền (Deposit)
   */
  deposit(userId, amount, method = 'BANK_QR', note = '') {
    const user = this.getUser(userId);
    if (!user) return { success: false, message: 'Người chơi không tồn tại' };

    const depositAmount = Math.max(1000, parseInt(amount, 10));

    db.updateUser(userId, (u) => {
      u.balance += depositAmount;
      if (!u.transactions) u.transactions = [];
      u.transactions.unshift({
        id: `DEP${Date.now()}`,
        type: 'DEPOSIT',
        title: `Nạp tiền qua ${method}`,
        amount: depositAmount,
        method,
        note,
        status: 'SUCCESS',
        timestamp: new Date().toISOString()
      });

      // Tăng điểm VIP khi nạp
      if (u.balance > 100000) u.vipLevel = 3;
      else if (u.balance > 50000) u.vipLevel = 2;
    });

    logger.info(`[DEPOSIT] Người chơi ${user.username} nạp thành công +${depositAmount} xu qua ${method}.`);
    return { success: true, balance: user.balance, added: depositAmount };
  },

  /**
   * Rút tiền (Withdraw)
   */
  withdraw(userId, amount, bankName = 'MB Bank', accountNumber = '99999999', accountHolder = 'NGUYEN VAN A') {
    const user = this.getUser(userId);
    if (!user) return { success: false, message: 'Người chơi không tồn tại' };

    const withdrawAmount = parseInt(amount, 10);
    if (isNaN(withdrawAmount) || withdrawAmount < 10000) {
      return { success: false, message: 'Số xu rút tối thiểu là 10.000 xu!' };
    }

    if (user.balance < withdrawAmount) {
      return { success: false, message: 'Số dư hiện tại không đủ để rút số xu này!' };
    }

    db.updateUser(userId, (u) => {
      u.balance -= withdrawAmount;
      if (!u.transactions) u.transactions = [];
      u.transactions.unshift({
        id: `WTH${Date.now()}`,
        type: 'WITHDRAW',
        title: `Rút tiền về ${bankName}`,
        amount: withdrawAmount,
        bankName,
        accountNumber,
        accountHolder,
        status: 'SUCCESS',
        timestamp: new Date().toISOString()
      });
    });

    logger.info(`[WITHDRAW] Người chơi ${user.username} rút thành công ${withdrawAmount} xu về ${bankName} (${accountNumber}).`);
    return { success: true, balance: user.balance, deducted: withdrawAmount };
  },

  /**
   * Cập nhật thông tin tài khoản (Profile)
   */
  updateProfile(userId, { username, avatar }) {
    const user = this.getUser(userId);
    if (!user) return { success: false, message: 'Người chơi không tồn tại' };

    db.updateUser(userId, (u) => {
      if (username && username.trim().length >= 3) {
        u.username = username.trim();
      }
      if (avatar) {
        u.avatar = avatar;
      }
    });

    return { success: true, user };
  },

  /**
   * Lấy lịch sử giao dịch
   */
  getTransactions(userId) {
    const user = this.getUser(userId);
    if (!user || !user.transactions) return [];
    return user.transactions;
  }
};
