/**
 * Master Game Engine - Vòng lặp ván chơi Casino Realtime tập trung trên Server
 * 
 * Luồng ván chơi:
 * 1. BETTING (15s): Người chơi đặt cược Tài / Xỉu. Đồng hồ đếm ngược từng giây.
 * 2. ROLLING (3s): Khóa cược, tính toán xúc xắc qua EmotionEngine, rung lắc Bát Rồng Vàng.
 * 3. RESULT (5s): Mở bát, hiển thị xúc xắc 3D, trả thưởng xu và cập nhật BXH.
 * 4. Tự động chuyển sang ván mới.
 */

import { db } from '../database/db.js';
import { DiceService } from './diceService.js';
import { EmotionEngine } from './emotionEngine.js';
import { UserService } from './userService.js';
import { logger } from '../utils/logger.js';

export const GameState = {
  BETTING: 'BETTING',
  ROLLING: 'ROLLING',
  RESULT: 'RESULT'
};

class GameEngine {
  constructor() {
    this.io = null;
    this.state = GameState.BETTING;
    this.roundNumber = 1001;
    this.roundId = this.generateRoundId();
    this.remainingSec = 15;
    this.timerInterval = null;

    // Danh sách cược ván hiện tại: Map<userId, { userId, username, door, amount, timestamp }>
    this.activeBets = new Map();

    // Kết quả xúc xắc ván vừa qua
    this.lastResult = null;
  }

  generateRoundId() {
    const now = new Date();
    const dateStr = now.toISOString().slice(2, 10).replace(/-/g, '');
    return `#TX${dateStr}-${String(this.roundNumber).padStart(4, '0')}`;
  }

  /**
   * Khởi động Game Loop & gắn Socket.io
   */
  start(io) {
    this.io = io;
    logger.game('Khởi động Master Game Loop Tài Xỉu...');
    this.startBettingPhase();
  }

  /**
   * PHA 1: ĐẶT CƯỢC (15 GIÂY)
   */
  startBettingPhase() {
    this.state = GameState.BETTING;
    const config = db.getConfig();
    this.remainingSec = config.timing.bettingDurationSec || 15;
    this.roundNumber += 1;
    this.roundId = this.generateRoundId();
    this.activeBets.clear();

    logger.game(`BẮT ĐẦU VÁN MỚI: ${this.roundId} — Thời gian cược: ${this.remainingSec}s`);

    this.broadcastState('round_start', {
      roundId: this.roundId,
      state: this.state,
      remainingSec: this.remainingSec
    });

    if (this.timerInterval) clearInterval(this.timerInterval);

    this.timerInterval = setInterval(() => {
      this.remainingSec -= 1;

      // Phát sự kiện nhịp đếm mỗi giây
      this.broadcastState('timer_tick', {
        roundId: this.roundId,
        state: this.state,
        remainingSec: this.remainingSec,
        totals: this.calculateTotals()
      });

      if (this.remainingSec <= 0) {
        clearInterval(this.timerInterval);
        this.startRollingPhase();
      }
    }, 1000);
  }

  /**
   * PHA 2: XÓC XÚC XẮC & RUNG BÁT RỒNG (3 GIÂY)
   */
  startRollingPhase() {
    if (this.state !== GameState.BETTING) return;
    if (this.timerInterval) clearInterval(this.timerInterval);

    this.state = GameState.ROLLING;
    const config = db.getConfig();
    const activeBetsList = Array.from(this.activeBets.values());

    logger.game(`KHÓA CƯỢC VÁN ${this.roundId}. Tổng số người cược: ${activeBetsList.length}`);

    // BẬT NÃO BỘ ĐIỀU TIẾT CẢM XÚC (SMART PITY ENGINE)
    const { dice, pityAction, reason } = EmotionEngine.resolveRoundOutcome(activeBetsList);
    const { sum, result, label } = DiceService.evaluate(dice);

    this.lastResult = {
      roundId: this.roundId,
      dice,
      sum,
      result,
      label,
      pityAction,
      reason,
      timestamp: new Date().toISOString()
    };

    logger.game(`KẾT QUẢ XÚC XẮC [${dice.join('-')}] => Tổng: ${sum} => Cửa thắng: ${label} (${pityAction})`);

    // Phát sự kiện bắt đầu xóc đĩa & rung lắc Bát Rồng
    this.broadcastState('rolling_start', {
      roundId: this.roundId,
      state: this.state,
      durationMs: config.timing.rollingDurationSec * 1000
    });

    // Sau thời gian xóc xong thì mở bát hiển thị kết quả
    setTimeout(() => {
      this.startResultPhase();
    }, config.timing.rollingDurationSec * 1000);
  }

  /**
   * PHA 3: MỞ BÁT & TRẢ THƯỞNG (5 GIÂY)
   */
  startResultPhase() {
    this.state = GameState.RESULT;
    const config = db.getConfig();
    const { dice, sum, result, label, pityAction, reason } = this.lastResult;
    const activeBetsList = Array.from(this.activeBets.values());

    const settlementList = [];

    // Trả thưởng cho từng người chơi
    activeBetsList.forEach((bet) => {
      const isWin = bet.door === result;
      const payoutAmount = isWin ? Math.floor(bet.amount * (1 + config.currency.payoutRatio)) : 0;

      const userSettlement = UserService.settleRoundForUser(
        bet.userId,
        this.roundId,
        bet.door,
        bet.amount,
        isWin,
        payoutAmount
      );

      settlementList.push({
        userId: bet.userId,
        username: bet.username,
        door: bet.door,
        amount: bet.amount,
        isWin,
        payoutAmount,
        newBalance: userSettlement ? userSettlement.newBalance : 0
      });

      // Gửi riêng thông báo kết quả và số dư mới cho từng socket của người cược
      if (this.io) {
        this.io.to(`user_${bet.userId}`).emit('bet_settled', {
          roundId: this.roundId,
          isWin,
          door: bet.door,
          amount: bet.amount,
          payoutAmount,
          newBalance: userSettlement ? userSettlement.newBalance : 0
        });
      }
    });

    // Lưu vào lịch sử ván chơi toàn cục
    const roundRecord = {
      roundId: this.roundId,
      dice,
      sum,
      result,
      label,
      totalBets: activeBetsList.length,
      totals: this.calculateTotals(),
      timestamp: new Date().toISOString()
    };
    db.addRound(roundRecord);

    logger.game(`MỞ BÁT VÁN ${this.roundId}: ${label} (${sum} điểm) — Đã trả thưởng cho ${settlementList.filter(s => s.isWin).length} người thắng.`);

    // Phát sự kiện mở bát công khai cho toàn thể phòng chơi
    this.broadcastState('round_result', {
      roundId: this.roundId,
      state: this.state,
      dice,
      sum,
      result,
      label,
      settlements: settlementList,
      recentHistory: db.getRecentRounds(16),
      waitNextSec: config.timing.resultDurationSec,
      pityAction,
      reason
    });

    // Chờ 5 giây hiển thị kết quả rồi tự động sang ván mới
    setTimeout(() => {
      this.startBettingPhase();
    }, config.timing.resultDurationSec * 1000);
  }

  /**
   * XỬ LÝ ĐẶT CƯỢC TỪ CLIENT
   */
  placeBet(userId, username, door, amount) {
    if (this.state !== GameState.BETTING) {
      return { success: false, message: 'Ván chơi đang xóc hoặc mở bát, vui lòng đợi ván sau!' };
    }

    if (amount <= 0 || (door !== 'tai' && door !== 'xiu')) {
      return { success: false, message: 'Cửa cược hoặc số xu không hợp lệ!' };
    }

    // Trừ tiền cược an toàn trên server
    const deductResult = UserService.deductBet(userId, amount);
    if (!deductResult.success) {
      return deductResult;
    }

    // Cộng dồn cược nếu người chơi đã cược trước đó trong ván
    const existingBet = this.activeBets.get(userId);
    if (existingBet) {
      if (existingBet.door !== door) {
        // Trả lại tiền vừa trừ vì không được cược 2 cửa cùng lúc
        UserService.refundBet(userId, amount);
        return { success: false, message: `Bạn đã cược cửa ${existingBet.door.toUpperCase()}, không thể cược thêm cửa đối diện!` };
      }
      existingBet.amount += amount;
      existingBet.timestamp = new Date().toISOString();
    } else {
      this.activeBets.set(userId, {
        userId,
        username,
        door,
        amount,
        timestamp: new Date().toISOString()
      });
    }

    const currentBet = this.activeBets.get(userId);

    // Bắn cập nhật tổng cược toàn phòng
    this.broadcastState('bet_updated', {
      roundId: this.roundId,
      totals: this.calculateTotals()
    });

    return {
      success: true,
      currentBet,
      newBalance: deductResult.balance
    };
  }

  /**
   * HỦY CƯỢC CỦA NGƯỜI CHƠI TRONG THỜI GIAN ĐẶT CƯỢC
   */
  cancelBet(userId) {
    if (this.state !== GameState.BETTING) {
      return { success: false, message: 'Đã hết thời gian đặt cược, không thể hủy!' };
    }

    const existingBet = this.activeBets.get(userId);
    if (!existingBet) {
      return { success: false, message: 'Bạn chưa đặt cược ván này!' };
    }

    const newBalance = UserService.refundBet(userId, existingBet.amount);
    this.activeBets.delete(userId);

    this.broadcastState('bet_updated', {
      roundId: this.roundId,
      totals: this.calculateTotals()
    });

    return {
      success: true,
      refundAmount: existingBet.amount,
      newBalance
    };
  }

  /**
   * BẤM XÓC SỚM (Người chơi chủ động bấm nút XÓC khi đã đặt cược)
   */
  triggerEarlyRoll(userId) {
    if (this.state !== GameState.BETTING) {
      return { success: false, message: 'Ván chơi đang diễn ra!' };
    }

    const bet = this.activeBets.get(userId);
    if (!bet || bet.amount <= 0) {
      return { success: false, message: 'Bạn cần đặt cược vào Tài hoặc Xỉu trước khi xóc!' };
    }

    logger.game(`Người chơi ${bet.username} nhấn nút XÓC SỚM!`);
    this.startRollingPhase();
    return { success: true };
  }

  calculateTotals() {
    let totalTai = 0;
    let totalXiu = 0;
    let countTai = 0;
    let countXiu = 0;

    for (const bet of this.activeBets.values()) {
      if (bet.door === 'tai') {
        totalTai += bet.amount;
        countTai += 1;
      } else if (bet.door === 'xiu') {
        totalXiu += bet.amount;
        countXiu += 1;
      }
    }

    return { totalTai, totalXiu, countTai, countXiu, totalBets: this.activeBets.size };
  }

  broadcastState(event, data) {
    if (this.io) {
      this.io.emit(event, data);
    }
  }

  getSnapshotForUser(userId) {
    const user = db.getOrCreateUser(userId);
    return {
      roundId: this.roundId,
      state: this.state,
      remainingSec: this.remainingSec,
      totals: this.calculateTotals(),
      userBet: this.activeBets.get(userId) || null,
      balance: user.balance,
      stats: user.stats,
      recentHistory: db.getRecentRounds(16)
    };
  }
}

export const gameEngine = new GameEngine();
