/**
 * Game Configuration & Smart Pity Engine Settings
 */

export const defaultGameConfig = {
  // Thời gian các pha trong 1 vòng chơi (giây)
  timing: {
    bettingDurationSec: 15, // Thời gian cho phép đặt cược
    rollingDurationSec: 3,  // Thời gian xóc xúc xắc và rung lắc bát
    resultDurationSec: 5    // Thời gian mở bát hiển thị kết quả và trả thưởng
  },

  // Quy tắc xu ảo người chơi
  currency: {
    startingBalance: 10000,
    quickAddAmount: 5000,
    chips: [100, 500, 1000, 5000, 10000],
    payoutRatio: 1.0 // 1:1 theo spec
  },

  // THUẬT TOÁN ĐIỀU TIẾT CẢM XÚC & TÀI CHÍNH (SMART PITY ENGINE)
  pityEngine: {
    // Bật/tắt toàn bộ thuật toán điều tiết (nếu tắt: ngẫu nhiên 100%)
    enabled: true,

    // 1. Kịch bản ALL-IN: Khi cược >= 90% số dư hiện có
    // Đưa về tỷ lệ 50% thắng / 50% thua tạo cảm xúc nghẹt thở
    allIn: {
      enabled: true,
      balancePercentageThreshold: 0.90, // Cược từ 90% số dư trở lên coi là All-in
      winRate: 0.50 // 50% thắng / 50% thua
    },

    // 2. Kịch bản CỨU DÂY ĐEN (Loss Streak Protection):
    // Người chơi thua nhiều sẽ tăng cơ hội thắng để lội ngược dòng
    lossProtection: {
      enabled: true,
      streakTier1: 2, // Thua 2 ván liên tiếp
      winRateTier1: 0.70, // Nâng tỷ lệ thắng lên 70%

      streakTier2: 3, // Thua 3 ván liên tiếp trở lên
      winRateTier2: 0.85, // Nâng tỷ lệ thắng lên 85%

      lowBalanceThreshold: 2000, // Số dư < 2000 xu (nguy cơ cháy túi)
      lowBalanceWinRate: 0.75 // Hỗ trợ 75% thắng
    },

    // 3. Kịch bản CÂN BẰNG NGÂN QUỸ (Win Streak Cooling):
    // Người chơi đang thắng đậm liên tiếp thì giảm nhẹ tỷ lệ để giữ tính thử thách
    winCooling: {
      enabled: true,
      streakThreshold: 3, // Thắng 3 ván liên tiếp
      winRate: 0.40 // Giảm tỷ lệ thắng về 40% trong 1 ván
    }
  }
};
