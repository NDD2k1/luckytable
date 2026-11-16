/**
 * Dice Service - Xử lý sinh xúc xắc ngẫu nhiên mật mã & đánh giá kết quả
 */

import crypto from 'crypto';

export const DiceService = {
  /**
   * Sinh ngẫu nhiên 1 viên xúc xắc từ 1 đến 6 bằng Crypto CSPRNG
   */
  rollSingleDie() {
    return crypto.randomInt(1, 7);
  },

  /**
   * Sinh ngẫu nhiên 3 viên xúc xắc hoàn toàn tự nhiên
   * @returns {[number, number, number]}
   */
  rollNatural() {
    return [
      this.rollSingleDie(),
      this.rollSingleDie(),
      this.rollSingleDie()
    ];
  },

  /**
   * Đánh giá kết quả Tài Xỉu
   * - Xỉu: 3 đến 9
   * - Tài: 10 đến 18
   * @param {Array<number>} dice 
   * @returns {{ sum: number, result: 'tai' | 'xiu', label: string }}
   */
  evaluate(dice) {
    const sum = dice[0] + dice[1] + dice[2];
    const isTai = sum >= 10 && sum <= 18;
    return {
      sum,
      result: isTai ? 'tai' : 'xiu',
      label: isTai ? 'TÀI' : 'XỈU'
    };
  },

  /**
   * Sinh 3 viên xúc xắc tự nhiên có kết quả trùng với cửa mong muốn (dành cho Pity Engine)
   * Sử dụng thuật toán lọc tự nhiên (Rejection Sampling) để đảm bảo phân bố xúc xắc
   * xuất hiện hoàn toàn giống tự nhiên, không bị dị tật hay lộ liễu.
   * @param {'tai' | 'xiu'} targetDoor 
   * @returns {[number, number, number]}
   */
  rollTarget(targetDoor) {
    for (let attempts = 0; attempts < 50; attempts++) {
      const dice = this.rollNatural();
      const evalRes = this.evaluate(dice);
      if (evalRes.result === targetDoor) {
        return dice;
      }
    }
    // Fallback nếu xác suất hiếm
    if (targetDoor === 'tai') {
      return [4, 5, 3]; // Tổng 12 -> Tài
    } else {
      return [2, 3, 2]; // Tổng 7 -> Xỉu
    }
  }
};
