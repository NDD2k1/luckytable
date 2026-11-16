/**
 * Smart Emotion & Pity Engine (Thuật toán điều tiết cảm xúc & cân bằng tài chính)
 * 
 * Mục tiêu:
 * 1. Khi người chơi ALL-IN hết tiền: Trả về xác suất 50% Thắng / 50% Thua ngẫu nhiên tuyệt đối,
 *    tạo cảm giác hồi hộp, nghẹt thở, thót tim chân thực.
 * 2. Khi người chơi THUA NHIỀU (Dây đen liên tiếp hoặc sắp cháy túi):
 *    Tăng cơ hội thắng lên 70% - 85% để người chơi "cắt dây đen", tạo cảm giác lội ngược dòng hưng phấn.
 * 3. Khi người chơi THẮNG ĐẬM LIÊN TIẾP:
 *    Cân bằng nhẹ lại tỷ lệ thắng về 40% để giữ độ thử thách cho game.
 * 4. Nếu người chơi KHÔNG CƯỢC:
 *    Chạy xúc xắc ngẫu nhiên 100%.
 */

import crypto from 'crypto';
import { db } from '../database/db.js';
import { DiceService } from './diceService.js';
import { logger } from '../utils/logger.js';

export const EmotionEngine = {
  /**
   * Quyết định kết quả xúc xắc dựa trên cược của người chơi & thuật toán cân bằng cảm xúc
   * @param {Array<Object>} activeBets Danh sách cược trong ván [{ userId, door, amount }]
   * @returns {{ dice: number[], pityAction: string, reason: string }}
   */
  resolveRoundOutcome(activeBets = []) {
    const config = db.getConfig().pityEngine;

    // Nếu không có ai cược hoặc tính năng Pity bị tắt -> Xúc xắc ngẫu nhiên 100%
    if (!config.enabled || activeBets.length === 0) {
      const dice = DiceService.rollNatural();
      return {
        dice,
        pityAction: 'NATURAL_RANDOM',
        reason: activeBets.length === 0 ? 'Không có cược nào trong ván' : 'Pity Engine đang tắt'
      };
    }

    // Lấy người chơi chính (ở mô hình 1 người chơi hoặc người cược lớn nhất)
    const primaryBet = activeBets.reduce((prev, cur) => (cur.amount > prev.amount ? cur : prev), activeBets[0]);
    const user = db.getUser(primaryBet.userId);

    if (!user) {
      const dice = DiceService.rollNatural();
      return { dice, pityAction: 'NATURAL_RANDOM', reason: 'Không tìm thấy thông tin người chơi' };
    }

    const { door: playerDoor, amount: betAmount } = primaryBet;
    const balanceBeforeBet = user.balance + betAmount;
    const oppositeDoor = playerDoor === 'tai' ? 'xiu' : 'tai';

    // -------------------------------------------------------------
    // KỊCH BẢN 1: ALL-IN (Cược toàn bộ hoặc >= 90% số dư)
    // -------------------------------------------------------------
    const isAllIn = betAmount >= (balanceBeforeBet * config.allIn.balancePercentageThreshold);
    if (config.allIn.enabled && isAllIn) {
      // 50% thắng / 50% thua
      const willWin = crypto.randomInt(0, 100) < (config.allIn.winRate * 100);
      const targetDoor = willWin ? playerDoor : oppositeDoor;
      const dice = DiceService.rollTarget(targetDoor);

      logger.pity(`[ALL-IN DETECTED] Người chơi ${user.username} cược ${betAmount}/${balanceBeforeBet} xu. Kết quả: ${willWin ? 'CHO THẮNG (50%)' : 'CHO THUA (50%)'}`);

      return {
        dice,
        pityAction: willWin ? 'ALL_IN_WIN' : 'ALL_IN_LOSE',
        reason: `Cược ALL-IN (${betAmount} xu) -> Áp dụng kịch bản 50/50 nghẹt thở: ${willWin ? 'THẮNG' : 'THUA'}`
      };
    }

    // -------------------------------------------------------------
    // KỊCH BẢN 2: CỨU DÂY ĐEN / BẢO VỆ CHÁY TÚI (Loss Protection)
    // -------------------------------------------------------------
    const lossStreak = user.stats.currentLossStreak;
    const isLowBalance = user.balance < config.lossProtection.lowBalanceThreshold;

    if (config.lossProtection.enabled && (lossStreak >= config.lossProtection.streakTier1 || isLowBalance)) {
      let boostRate = config.lossProtection.winRateTier1; // Mặc định 70%

      if (lossStreak >= config.lossProtection.streakTier2) {
        boostRate = config.lossProtection.winRateTier2; // Thua 3 ván trở lên -> 85%
      } else if (isLowBalance) {
        boostRate = config.lossProtection.lowBalanceWinRate; // Sắp cháy túi -> 75%
      }

      const rollPercent = crypto.randomInt(0, 100);
      const willWin = rollPercent < (boostRate * 100);
      const targetDoor = willWin ? playerDoor : oppositeDoor;
      const dice = DiceService.rollTarget(targetDoor);

      logger.pity(`[LOSS STREAK RESCUE] Người chơi ${user.username} (Thua liên tiếp: ${lossStreak}, Số dư: ${user.balance} xu). Tỷ lệ thắng ưu tiên: ${(boostRate * 100).toFixed(0)}% -> Kết quả: ${willWin ? 'LỘI NGƯỢC DÒNG (THẮNG)' : 'THUA'}`);

      return {
        dice,
        pityAction: willWin ? 'LOSS_STREAK_BOOST_WIN' : 'LOSS_STREAK_BOOST_LOSE',
        reason: `Cứu dây đen (Thua ${lossStreak} ván) -> Ưu tiên ${(boostRate * 100).toFixed(0)}% thắng`
      };
    }

    // -------------------------------------------------------------
    // KỊCH BẢN 3: CÂN BẰNG TÀI CHÍNH KHI ĐANG THẮNG ĐẬM (Win Cooling)
    // -------------------------------------------------------------
    const winStreak = user.stats.currentWinStreak;
    if (config.winCooling.enabled && winStreak >= config.winCooling.streakThreshold) {
      const rollPercent = crypto.randomInt(0, 100);
      const willWin = rollPercent < (config.winCooling.winRate * 100); // 40% thắng
      const targetDoor = willWin ? playerDoor : oppositeDoor;
      const dice = DiceService.rollTarget(targetDoor);

      logger.pity(`[WIN COOLING] Người chơi ${user.username} (Thắng liên tiếp: ${winStreak} ván). Điều tiết tỷ lệ về ${(config.winCooling.winRate * 100).toFixed(0)}% -> Kết quả: ${willWin ? 'VẪN THẮNG' : 'HẠ NHIỆT (THUA)'}`);

      return {
        dice,
        pityAction: willWin ? 'WIN_COOLING_SURVIVE' : 'WIN_COOLING_COOLED',
        reason: `Cân bằng ngân quỹ (Thắng liên tiếp ${winStreak} ván) -> Điều tiết về ${(config.winCooling.winRate * 100).toFixed(0)}%`
      };
    }

    // -------------------------------------------------------------
    // KỊCH BẢN 4: VÁN CHƠI TỰ NHIÊN BÌNH THƯỜNG
    // -------------------------------------------------------------
    const dice = DiceService.rollNatural();
    return {
      dice,
      pityAction: 'NATURAL_ROUND',
      reason: 'Trạng thái chơi bình thường, xúc xắc sinh ngẫu nhiên tự nhiên'
    };
  }
};
