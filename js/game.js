/**
 * Game Controller Module - Lucky Table Tài Xỉu
 * Chế độ Live Casino tự động theo đúng yêu cầu:
 * - 15 giây đếm ngược đặt cược (15s -> 0s)
 * - Tự động xóc đĩa và mở bát rồng vàng
 * - Chờ 5 giây hiển thị kết quả & trả thưởng (5s -> 0s)
 * - Tự động bắt đầu ván mới liên tục
 * - Có thể bấm nút XÓC để xóc ngay khi đã đặt cược
 * - Animation lắc lắc chip, nảy bounce và ném chip bay vào cửa cược
 */

import { Storage } from './storage.js';
import { DiceManager, Sound } from './dice.js';

export const GameState = {
  BETTING: 'BETTING',
  ROLLING: 'ROLLING',
  RESULT: 'RESULT'
};

const BETTING_DURATION_SEC = 15; // 15 giây đếm ngược đặt cược
const RESULT_DISPLAY_SEC = 5;    // 5 giây chờ sau khi mở bát

class TaiXiuGame {
  constructor() {
    this.state = GameState.BETTING;
    this.balance = Storage.getBalance();
    this.selectedChip = 500;
    this.currentBet = {
      door: null, // 'tai' | 'xiu' | null
      amount: 0
    };
    this.currentDice = [2, 3, 5];
    this.chipValues = [100, 500, 1000, 5000, 10000];
    this.currentChipIndex = 1; // 500

    // Timers
    this.countdownTimer = null;
    this.remainingSec = BETTING_DURATION_SEC;

    this.dom = {};
  }

  init() {
    this.cacheElements();
    this.bindEvents();
    this.renderDiceElements();
    this.updateBalanceDisplays();
    this.renderBeadRoadAndStats();
    this.updateSoundDisplay();
    
    // Bắt đầu vòng lặp tự động ngay khi vào game
    this.startBettingCountdown();
  }

  cacheElements() {
    this.dom = {
      topBalance: document.getElementById('top-balance'),
      userBalance: document.getElementById('user-balance'),
      btnQuickAddCoin: document.getElementById('btn-quick-add-coin'),

      // Doors
      doorTai: document.getElementById('door-tai'),
      doorXiu: document.getElementById('door-xiu'),
      betBadgeTai: document.getElementById('bet-badge-tai'),
      betBadgeXiu: document.getElementById('bet-badge-xiu'),

      // Arena & Plate
      plateFelt: document.getElementById('plate-felt'),
      diceContainer: document.getElementById('dice-container'),
      dragonCup: document.getElementById('dragon-cup'),
      statusRibbon: document.getElementById('status-ribbon'),
      btnRoll: document.getElementById('btn-roll'),

      // Chips Tray
      chipButtons: document.querySelectorAll('.chip-img-btn'),
      btnChipPrev: document.getElementById('chip-prev'),
      btnChipNext: document.getElementById('chip-next'),

      // Action Buttons
      btnClearBet: document.getElementById('btn-clear-bet'),
      btnConfirmBet: document.getElementById('btn-confirm-bet'),

      // History & Stats
      beadRoadGrid: document.getElementById('bead-road-grid'),
      statBarTai: document.getElementById('stat-bar-tai'),
      statBarXiu: document.getElementById('stat-bar-xiu'),
      statPctTai: document.getElementById('stat-pct-tai'),
      statPctXiu: document.getElementById('stat-pct-xiu'),

      // Modals
      btnOpenBxh: document.getElementById('btn-open-bxh'),
      modalBxh: document.getElementById('modal-bxh'),
      btnCloseBxh: document.getElementById('btn-close-bxh'),
      bxhUserBalance: document.getElementById('bxh-user-balance'),
      bxhUserWinrate: document.getElementById('bxh-user-winrate'),

      btnOpenHistory: document.getElementById('btn-open-history'),
      modalHistory: document.getElementById('modal-history'),
      btnCloseHistory: document.getElementById('btn-close-history'),
      detailedHistoryTbody: document.getElementById('detailed-history-tbody'),

      btnOpenSettings: document.getElementById('btn-open-settings'),
      modalSettings: document.getElementById('modal-settings'),
      btnCloseSettings: document.getElementById('btn-close-settings'),
      settingSound: document.getElementById('setting-sound'),
      btnResetDemo: document.getElementById('btn-reset-demo'),

      btnSoundToggle: document.getElementById('btn-sound-toggle'),
      soundIconDisplay: document.getElementById('sound-icon-display'),

      toastPopup: document.getElementById('toast-popup')
    };
  }

  bindEvents() {
    // Chọn mệnh giá Chip
    this.dom.chipButtons.forEach((btn, index) => {
      btn.addEventListener('click', () => {
        const val = parseInt(btn.dataset.value, 10);
        this.selectChipByIndex(index, val);
      });
    });

    // Mũi tên lùi/tiến chip
    this.dom.btnChipPrev.addEventListener('click', () => {
      const newIdx = Math.max(0, this.currentChipIndex - 1);
      this.selectChipByIndex(newIdx);
    });

    this.dom.btnChipNext.addEventListener('click', () => {
      const newIdx = Math.min(this.chipValues.length - 1, this.currentChipIndex + 1);
      this.selectChipByIndex(newIdx);
    });

    // Đặt cược vào cửa Tài / Xỉu
    this.dom.doorXiu.addEventListener('click', () => this.placeBetOnDoor('xiu'));
    this.dom.doorTai.addEventListener('click', () => this.placeBetOnDoor('tai'));

    // Thao tác nút Hủy cược & Đặt cược
    this.dom.btnClearBet.addEventListener('click', () => this.clearBet());
    this.dom.btnConfirmBet.addEventListener('click', () => {
      if (this.currentBet.amount > 0 && this.currentBet.door) {
        Sound.playChip();
        this.showToast(`Đã xác nhận đặt cược ${this.formatNumber(this.currentBet.amount)} xu vào cửa ${this.currentBet.door === 'tai' ? 'Tài' : 'Xỉu'}!`);
      } else {
        this.showToast('Vui lòng chọn cửa cược trước!', 'warning');
      }
    });

    // Nút XÓC: Nếu có thì gán sự kiện xóc sớm
    if (this.dom.btnRoll) {
      this.dom.btnRoll.addEventListener('click', () => {
        if (this.state !== GameState.BETTING) return;

        if (this.currentBet.amount <= 0 || !this.currentBet.door) {
          this.showToast('👉 Hãy chọn cửa Xỉu hoặc Tài trước khi Xóc!', 'warning');
          this.dom.doorXiu.classList.add('winner-glow');
          this.dom.doorTai.classList.add('winner-glow');
          setTimeout(() => {
            this.dom.doorXiu.classList.remove('winner-glow');
            this.dom.doorTai.classList.remove('winner-glow');
          }, 800);
          return;
        }

        clearInterval(this.countdownTimer);
        this.startRoll();
      });
    }

    // Bấm Bát Rồng để mở sớm nếu muốn hoặc rung nảy vui mắt
    this.dom.dragonCup.addEventListener('click', () => {
      if (this.state === GameState.ROLLING) {
        this.dom.plateFelt.classList.remove('shaking');
        this.dom.dragonCup.classList.remove('shaking');
        this.revealResult();
      } else if (this.state === GameState.BETTING) {
        Sound.playChip();
        this.dom.dragonCup.classList.add('quick-wiggle');
        setTimeout(() => this.dom.dragonCup.classList.remove('quick-wiggle'), 450);
      }
    });

    // Nút nạp nhanh 5.000 xu demo (+)
    this.dom.btnQuickAddCoin.addEventListener('click', () => {
      this.balance += 5000;
      Storage.setBalance(this.balance);
      this.updateBalanceDisplays();
      Sound.playWin();
      this.showToast('🎉 Nhận thêm +5.000 xu may mắn thành công!');
    });

    // Bật/tắt âm thanh
    this.dom.btnSoundToggle.addEventListener('click', () => {
      const current = Storage.isSoundEnabled();
      Storage.setSoundEnabled(!current);
      this.updateSoundDisplay();
      this.showToast(Storage.isSoundEnabled() ? 'Đã bật âm thanh' : 'Đã tắt âm thanh');
    });

    // Modal BXH
    this.dom.btnOpenBxh.addEventListener('click', () => this.openModal(this.dom.modalBxh));
    this.dom.btnCloseBxh.addEventListener('click', () => this.closeModal(this.dom.modalBxh));

    // Modal Lịch sử
    this.dom.btnOpenHistory.addEventListener('click', () => {
      this.renderDetailedHistoryTable();
      this.openModal(this.dom.modalHistory);
    });
    this.dom.btnCloseHistory.addEventListener('click', () => this.closeModal(this.dom.modalHistory));

    // Modal Cài đặt
    this.dom.btnOpenSettings.addEventListener('click', () => {
      this.dom.settingSound.checked = Storage.isSoundEnabled();
      this.openModal(this.dom.modalSettings);
    });
    this.dom.btnCloseSettings.addEventListener('click', () => this.closeModal(this.dom.modalSettings));

    this.dom.settingSound.addEventListener('change', (e) => {
      Storage.setSoundEnabled(e.target.checked);
      this.updateSoundDisplay();
    });

    this.dom.btnResetDemo.addEventListener('click', () => {
      if (confirm('Khôi phục toàn bộ số dư 10.000 xu và xóa dữ liệu lịch sử?')) {
        Storage.resetAll();
        this.balance = Storage.getBalance();
        this.clearBet();
        this.updateBalanceDisplays();
        this.renderBeadRoadAndStats();
        this.closeModal(this.dom.modalSettings);
        this.showToast('Đã khôi phục dữ liệu ban đầu 10.000 xu!');
      }
    });

    // Đóng modal khi bấm ra ngoài
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          overlay.classList.remove('active');
        }
      });
    });
  }

  openModal(modalEl) {
    if (modalEl) modalEl.classList.add('active');
  }

  closeModal(modalEl) {
    if (modalEl) modalEl.classList.remove('active');
  }

  updateSoundDisplay() {
    const enabled = Storage.isSoundEnabled();
    this.dom.soundIconDisplay.textContent = enabled ? '🔊' : '🔇';
  }

  selectChipByIndex(index, explicitValue = null) {
    this.currentChipIndex = index;
    this.selectedChip = explicitValue || this.chipValues[index];
    Sound.playChip();

    this.dom.chipButtons.forEach((b, idx) => {
      const isActive = idx === index;
      b.classList.toggle('active', isActive);
      if (isActive) {
        // Kích hoạt hiệu ứng nảy bật / lắc lắc khi vừa chọn chip
        b.classList.remove('pop-anim');
        void b.offsetWidth; // Force reflow
        b.classList.add('pop-anim');
      }
    });
  }

  createFlyingChip(door) {
    const activeChipBtn = document.querySelector('.chip-img-btn.active');
    const targetDoor = door === 'tai' ? this.dom.doorTai : this.dom.doorXiu;
    if (!activeChipBtn || !targetDoor) return;

    const startRect = activeChipBtn.getBoundingClientRect();
    const endRect = targetDoor.getBoundingClientRect();

    const imgEl = activeChipBtn.querySelector('img');
    if (!imgEl) return;

    const flyingChip = document.createElement('img');
    flyingChip.src = imgEl.src;
    flyingChip.className = 'flying-chip-anim';
    flyingChip.style.left = `${startRect.left + startRect.width / 2 - 26}px`;
    flyingChip.style.top = `${startRect.top + startRect.height / 2 - 26}px`;

    document.body.appendChild(flyingChip);

    const targetX = endRect.left + endRect.width / 2 - 26;
    const targetY = endRect.top + endRect.height / 2 - 26;

    requestAnimationFrame(() => {
      flyingChip.style.transform = `translate(${targetX - (startRect.left + startRect.width / 2 - 26)}px, ${targetY - (startRect.top + startRect.height / 2 - 26)}px) scale(0.65) rotate(360deg)`;
      flyingChip.style.opacity = '0.9';
    });

    setTimeout(() => {
      flyingChip.remove();
      // Kích hoạt hiệu ứng nảy bật cho cửa cược khi nhận chip
      targetDoor.classList.remove('door-bounce');
      void targetDoor.offsetWidth;
      targetDoor.classList.add('door-bounce');
    }, 420);
  }

  renderDiceElements() {
    this.dom.diceContainer.innerHTML = '';
    for (let i = 0; i < 3; i++) {
      const dieEl = DiceManager.createDieElement(i);
      this.dom.diceContainer.appendChild(dieEl);
      DiceManager.setDieFace(dieEl, this.currentDice[i] || (i + 1), false);
    }
  }

  placeBetOnDoor(door) {
    if (this.state !== GameState.BETTING) {
      this.showToast('Đang trong lượt xóc, vui lòng chờ ván mới!', 'warning');
      return;
    }

    if (this.currentBet.door && this.currentBet.door !== door && this.currentBet.amount > 0) {
      this.showToast('Trong một ván chỉ đặt một cửa (Tài hoặc Xỉu)! Đã đổi cửa.');
      this.currentBet.door = door;
    } else {
      this.currentBet.door = door;
    }

    const nextBet = this.currentBet.amount + this.selectedChip;
    if (nextBet > this.balance) {
      this.showToast('Số dư của bạn không đủ để đặt mức cược này!', 'warning');
      return;
    }

    this.currentBet.amount = nextBet;
    Sound.playChip();
    
    // Tạo hiệu ứng chip bay lắc ném vào cửa cược
    this.createFlyingChip(door);

    this.updateBetDisplay();
  }

  clearBet() {
    if (this.state !== GameState.BETTING) return;
    this.currentBet = { door: null, amount: 0 };
    Sound.playChip();
    this.updateBetDisplay();
    this.showToast('Đã hủy cược');
  }

  updateBetDisplay() {
    this.dom.doorXiu.classList.remove('selected');
    this.dom.doorTai.classList.remove('selected');
    this.dom.betBadgeXiu.textContent = '0 xu';
    this.dom.betBadgeTai.textContent = '0 xu';

    if (this.currentBet.door === 'xiu' && this.currentBet.amount > 0) {
      this.dom.doorXiu.classList.add('selected');
      this.dom.betBadgeXiu.textContent = `${this.formatNumber(this.currentBet.amount)} xu`;
    } else if (this.currentBet.door === 'tai' && this.currentBet.amount > 0) {
      this.dom.doorTai.classList.add('selected');
      this.dom.betBadgeTai.textContent = `${this.formatNumber(this.currentBet.amount)} xu`;
    }
  }

  updateStatusBanner(text, statusType = '') {
    this.dom.statusRibbon.textContent = text;
    this.dom.statusRibbon.className = 'status-ribbon-banner';
    if (statusType === 'win') {
      this.dom.statusRibbon.classList.add('highlight-win');
    } else if (statusType === 'lose') {
      this.dom.statusRibbon.classList.add('highlight-lose');
    } else if (statusType === 'urgent') {
      this.dom.statusRibbon.style.color = '#ff4d4d';
      this.dom.statusRibbon.style.borderColor = '#ff4d4d';
    } else {
      this.dom.statusRibbon.style.color = '';
      this.dom.statusRibbon.style.borderColor = '';
    }
  }

  /**
   * BẮT ĐẦU ĐẾM NGƯỢC 15 GIÂY ĐẶT CƯỢC
   */
  startBettingCountdown() {
    this.state = GameState.BETTING;
    this.remainingSec = BETTING_DURATION_SEC;
    clearInterval(this.countdownTimer);

    // Mở khóa cửa cược
    this.dom.doorXiu.classList.remove('disabled');
    this.dom.doorTai.classList.remove('disabled');

    // Bát đậy sẵn hoặc nâng nhẹ
    this.dom.dragonCup.classList.remove('lifted');
    this.dom.dragonCup.classList.add('covered');

    this.updateStatusBanner(`⏱ Đang đặt cược: ${this.remainingSec}s`);

    this.countdownTimer = setInterval(() => {
      this.remainingSec -= 1;

      if (this.remainingSec <= 5 && this.remainingSec > 0) {
        Sound.playTick();
        this.updateStatusBanner(`⏱ Sắp hết giờ: ${this.remainingSec}s`, 'urgent');
      } else if (this.remainingSec > 5) {
        this.updateStatusBanner(`⏱ Đang đặt cược: ${this.remainingSec}s`);
      }

      if (this.remainingSec <= 0) {
        clearInterval(this.countdownTimer);
        this.startRoll();
      }
    }, 1000);
  }

  /**
   * BẮT ĐẦU XÓC
   */
  startRoll() {
    clearInterval(this.countdownTimer);
    this.state = GameState.ROLLING;

    // Khóa cược
    this.dom.doorXiu.classList.add('disabled');
    this.dom.doorTai.classList.add('disabled');

    // Nếu người chơi có cược, trừ số dư
    if (this.currentBet.amount > 0 && this.currentBet.door) {
      this.balance -= this.currentBet.amount;
      Storage.setBalance(this.balance);
      this.updateBalanceDisplays();
    }

    // THUẬT TOÁN ĐIỀU TIẾT CẢM XÚC & TÀI CHÍNH (SMART PITY ENGINE)
    const hasBet = this.currentBet.amount > 0 && this.currentBet.door;
    const history = Storage.getHistory();
    const balanceBefore = this.balance + this.currentBet.amount;
    const isAllIn = hasBet && (this.currentBet.amount >= balanceBefore * 0.9);

    // Đếm chuỗi thua liên tiếp
    let recentLossStreak = 0;
    for (const h of history) {
      if (h.betDoor) {
        if (!h.isWin) recentLossStreak++;
        else break;
      }
    }

    if (isAllIn) {
      // 1. ALL-IN: 50% thắng / 50% thua ngẫu nhiên tuyệt đối tạo cảm xúc nghẹt thở
      const willWin = Math.random() < 0.5;
      const targetDoor = willWin ? this.currentBet.door : (this.currentBet.door === 'tai' ? 'xiu' : 'tai');
      this.currentDice = DiceManager.rollDiceWithTarget(targetDoor);
      this.pityReason = willWin ? '🎲 ALL-IN: Chiến thắng ngoạn mục!' : '🎲 ALL-IN: Đáng tiếc!';
    } else if (hasBet && (recentLossStreak >= 2 || this.balance < 2000)) {
      // 2. DÂY ĐEN: Thua >= 2 ván hoặc sắp cháy túi -> Nâng tỷ lệ thắng lên 75% - 85%
      const winRate = recentLossStreak >= 3 ? 0.85 : 0.75;
      const willWin = Math.random() < winRate;
      const targetDoor = willWin ? this.currentBet.door : (this.currentBet.door === 'tai' ? 'xiu' : 'tai');
      this.currentDice = DiceManager.rollDiceWithTarget(targetDoor);
      this.pityReason = willWin ? '🔥 Cứu dây đen: Lội ngược dòng thành công!' : null;
    } else {
      // 3. NGẪU NHIÊN 100%
      this.currentDice = DiceManager.rollThreeDice();
      this.pityReason = null;
    }

    this.pendingResult = DiceManager.evaluateResult(this.currentDice);

    // Đậy bát rồng vàng & RUNG LẮC CỰC MẠNH VŨ BÃO
    const cup = this.dom.dragonCup;
    cup.classList.remove('lifted');
    cup.classList.add('covered', 'shaking');

    this.updateStatusBanner('🎲 Đang xóc đĩa...');
    Sound.playShake(1800);

    // Rung lắc đĩa
    this.dom.plateFelt.classList.add('shaking');

    // Xoay 3D xúc xắc ngầm
    const diceElements = this.dom.diceContainer.querySelectorAll('.die-cube');
    diceElements.forEach((dieEl, idx) => {
      DiceManager.setDieFace(dieEl, this.currentDice[idx], true);
    });

    // Sau 1.8 giây xóc xong thì tự động mở bát
    setTimeout(() => {
      this.dom.plateFelt.classList.remove('shaking');
      cup.classList.remove('shaking');
      this.revealResult();
    }, 1800);
  }

  /**
   * MỞ BÁT VÀ HIỂN THỊ KẾT QUẢ, CHỜ 5 GIÂY ĐỂ BẮT ĐẦU VÁN MỚI
   */
  revealResult() {
    this.state = GameState.RESULT;
    const cup = this.dom.dragonCup;
    cup.classList.remove('shaking', 'covered');
    this.dom.plateFelt.classList.remove('shaking');
    cup.classList.add('lifted'); // Nâng bát lên để thấy xúc xắc

    Sound.playOpenCup();

    const { sum, result, label } = this.pendingResult;
    const hasBet = this.currentBet.amount > 0 && this.currentBet.door;
    const isWin = hasBet && this.currentBet.door === result;
    const betDoor = this.currentBet.door;
    const betAmount = this.currentBet.amount;

    let netChange = 0;
    if (hasBet) {
      if (isWin) {
        const winPayout = betAmount * 2;
        netChange = betAmount;
        this.balance += winPayout;
        Storage.setBalance(this.balance);
        Sound.playWin();
        this.showToast(`🎉 Chúc mừng! Cửa ${label} (${sum} điểm) • Bạn THẮNG +${this.formatNumber(netChange)} xu!`, 'win');
      } else {
        netChange = -betAmount;
        Sound.playLose();
        this.showToast(`😢 Rất tiếc! Cửa ${label} (${sum} điểm) • Bạn THUA ${this.formatNumber(betAmount)} xu`, 'warning');
      }
      this.updateBalanceDisplays();
    } else {
      // Người chơi không cược (chế độ xem mô phỏng)
      this.showToast(`Kết quả: ${label} (${sum} điểm - [${this.currentDice.join(', ')}])`);
    }

    // Highlight cửa thắng
    const winningDoorEl = result === 'tai' ? this.dom.doorTai : this.dom.doorXiu;
    winningDoorEl.classList.add('winner-glow');

    // Lưu vào lịch sử & thống kê
    const record = {
      id: Date.now(),
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      dice: [...this.currentDice],
      sum,
      result,
      betDoor,
      betAmount,
      isWin,
      netChange,
      balanceAfter: this.balance
    };

    Storage.addHistory(record);
    Storage.updateStats(record);
    this.renderBeadRoadAndStats();

    // ĐẾM NGƯỢC 5 GIÂY CHỜ VÁN MỚI
    let resultWaitSec = RESULT_DISPLAY_SEC;
    const resultLabel = `${label} ${sum} (${this.currentDice.join('-')})`;
    const statusType = hasBet ? (isWin ? 'win' : 'lose') : '';

    this.updateStatusBanner(`${resultLabel} • Ván mới sau: ${resultWaitSec}s`, statusType);

    clearInterval(this.countdownTimer);
    this.countdownTimer = setInterval(() => {
      resultWaitSec -= 1;
      if (resultWaitSec > 0) {
        this.updateStatusBanner(`${resultLabel} • Ván mới sau: ${resultWaitSec}s`, statusType);
      } else {
        clearInterval(this.countdownTimer);
        winningDoorEl.classList.remove('winner-glow');
        this.prepareNewRound();
      }
    }, 1000);
  }

  prepareNewRound() {
    this.currentBet = { door: null, amount: 0 };
    this.updateBetDisplay();
    // Bắt đầu lại chu kỳ 15 giây đếm ngược
    this.startBettingCountdown();
  }

  updateBalanceDisplays() {
    const formatted = this.formatNumber(this.balance);
    if (this.dom.topBalance) this.dom.topBalance.textContent = formatted;
    if (this.dom.userBalance) this.dom.userBalance.textContent = formatted;
    if (this.dom.bxhUserBalance) this.dom.bxhUserBalance.textContent = `${formatted} xu`;
  }

  renderBeadRoadAndStats() {
    const history = Storage.getHistory();
    const stats = Storage.getStats();

    // 1. Render 2x5 Bead Grid (10 ván gần nhất)
    let recent10 = history.slice(0, 10).reverse();

    if (recent10.length === 0) {
      const demoPatterns = ['tai', 'xiu', 'tai', 'xiu', 'tai', 'xiu', 'xiu', 'tai', 'tai', 'xiu'];
      recent10 = demoPatterns.map((res) => ({ result: res, sum: res === 'tai' ? 11 : 8 }));
    }

    const dotsHtml = recent10.map(item => {
      const isTai = item.result === 'tai';
      return `<div class="bead-circle ${isTai ? 'tai' : 'xiu'}">${isTai ? 'Tài' : 'Xỉu'}</div>`;
    }).join('');

    this.dom.beadRoadGrid.innerHTML = dotsHtml;

    // 2. Thống kê tỷ lệ
    const total = stats.totalRounds;
    let taiPct = 52;
    let xiuPct = 48;
    if (total > 0) {
      taiPct = Math.round((stats.taiCount / total) * 100);
      xiuPct = 100 - taiPct;
    }

    this.dom.statBarTai.style.width = `${taiPct}%`;
    this.dom.statBarXiu.style.width = `${xiuPct}%`;
    this.dom.statPctTai.textContent = `${taiPct}%`;
    this.dom.statPctXiu.textContent = `${xiuPct}%`;

    // Cập nhật tỷ lệ thắng cá nhân trên BXH
    if (this.dom.bxhUserWinrate) {
      const winPct = total > 0 && stats.wins > 0 ? Math.round((stats.wins / (stats.wins + stats.losses || 1)) * 100) : 55;
      this.dom.bxhUserWinrate.textContent = `${winPct}%`;
    }
  }

  renderDetailedHistoryTable() {
    const history = Storage.getHistory();
    if (history.length === 0) {
      this.dom.detailedHistoryTbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 20px; color: #aaa;">Chưa có ván đấu nào</td></tr>`;
      return;
    }

    const html = history.slice(0, 20).map(item => {
      const isTai = item.result === 'tai';
      const outcomeText = item.betDoor 
        ? `<span style="color: ${item.isWin ? '#2ecc71' : '#ff7675'}; font-weight: 700;">${item.betDoor === 'tai' ? 'Tài' : 'Xỉu'} (${this.formatNumber(item.betAmount)}) -> ${item.isWin ? '+' : ''}${this.formatNumber(item.netChange)}</span>`
        : '<span style="color:#888;">(Không cược)</span>';

      return `
        <tr>
          <td>${item.timestamp}</td>
          <td>${item.dice.join(' - ')}</td>
          <td><strong>${item.sum}</strong></td>
          <td><span style="color: ${isTai ? '#ff5252' : '#42a5f5'}; font-weight: 900;">${isTai ? 'TÀI' : 'XỈU'}</span></td>
          <td>${outcomeText}</td>
        </tr>
      `;
    }).join('');

    this.dom.detailedHistoryTbody.innerHTML = html;
  }

  showToast(message, type = 'info') {
    const toast = this.dom.toastPopup;
    if (!toast) return;
    toast.textContent = message;
    toast.className = `toast-popup show ${type}`;
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      toast.className = 'toast-popup';
    }, 2800);
  }

  formatNumber(num) {
    return (num || 0).toLocaleString('vi-VN');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.game = new TaiXiuGame();
  window.game.init();
});
