/**
 * Game Controller Module - Lucky Table Tài Xỉu
 * Chế độ Live Casino tự động theo đúng yêu cầu:
 * - 15 giây đếm ngược đặt cược (15s -> 0s)
 * - Tự động xóc đĩa với Bát Rồng Vàng
 * - TÍNH NĂNG NẶN BÁT CỰC HỒI HỘP: Tự tay dùng chuột/ngón tay rê kéo Bát để hé lộ dần từng chấm xúc xắc
 * - Chờ 5 giây hiển thị kết quả & trả thưởng (5s -> 0s)
 * - Tự động bắt đầu ván mới liên tục
 */

import { Storage } from './storage.js';
import { DiceManager, Sound } from './dice.js';

export const GameState = {
  BETTING: 'BETTING',
  ROLLING: 'ROLLING',
  SQUEEZING: 'SQUEEZING', // Trạng thái Nặn Bát
  RESULT: 'RESULT'
};

const BETTING_DURATION_SEC = 15; // 15 giây đếm ngược đặt cược
const RESULT_DISPLAY_SEC = 5;    // 5 giây chờ sau khi mở bát
const SQUEEZE_TIME_LIMIT_SEC = 12; // 12 giây tối đa để người chơi tự nặn, sau đó tự mở

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
    this.squeezeTimer = null;
    this.remainingSec = BETTING_DURATION_SEC;

    // Cài đặt Nặn Bát (Lưu cấu hình trong localStorage)
    const savedSqueeze = localStorage.getItem('taixiu_squeeze_mode');
    this.isSqueezeMode = savedSqueeze !== null ? savedSqueeze === 'true' : true;

    // Biến điều khiển thao tác kéo nặn
    this.isDragging = false;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.currentCupOffset = { x: 0, y: 0 };
    this.lastSoundDistance = 0;

    this.dom = {};
  }

  init() {
    this.cacheElements();
    this.bindEvents();
    this.bindSqueezeGestures();
    this.renderDiceElements();
        // Đồng bộ số dư và thông tin người chơi từ Wallet
    if (typeof window !== 'undefined' && window.Wallet) {
      this.balance = window.Wallet.getBalance();
      window.Wallet.syncWithServer().then(() => {
        this.balance = window.Wallet.getBalance();
        this.updateBalanceDisplays();
      });
      const user = window.Wallet.getUser();
      if (user && user.username) {
        const nameEl = document.querySelector('.player-name-row span');
        if (nameEl) nameEl.textContent = user.username;
      }
    }

    this.updateBalanceDisplays();
    this.renderBeadRoadAndStats();
    this.updateSoundDisplay();
    this.updateSqueezeDisplay();
    
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

      // Squeeze elements
      squeezeGuide: document.getElementById('squeeze-guide'),
      btnQuickOpen: document.getElementById('btn-quick-open'),
      btnToggleSqueeze: document.getElementById('btn-toggle-squeeze'),
      squeezeIcon: document.getElementById('squeeze-icon'),
      squeezeLabel: document.getElementById('squeeze-label'),
      settingSqueeze: document.getElementById('setting-squeeze'),

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

    // Mũi tên trượt chip
    this.dom.btnChipPrev.addEventListener('click', () => {
      let nextIndex = this.currentChipIndex - 1;
      if (nextIndex < 0) nextIndex = this.chipValues.length - 1;
      this.selectChipByIndex(nextIndex);
    });

    this.dom.btnChipNext.addEventListener('click', () => {
      let nextIndex = this.currentChipIndex + 1;
      if (nextIndex >= this.chipValues.length) nextIndex = 0;
      this.selectChipByIndex(nextIndex);
    });

    // Đặt cược vào cửa Xỉu
    this.dom.doorXiu.addEventListener('click', (e) => {
      if (this.state !== GameState.BETTING) return;
      this.placeBet('xiu', e);
    });

    // Đặt cược vào cửa Tài
    this.dom.doorTai.addEventListener('click', (e) => {
      if (this.state !== GameState.BETTING) return;
      this.placeBet('tai', e);
    });

    // Nút Hủy Cược
    this.dom.btnClearBet.addEventListener('click', () => {
      if (this.state !== GameState.BETTING) return;
      this.clearBet();
    });

    // Nút Xác Nhận Đặt Cược
    this.dom.btnConfirmBet.addEventListener('click', () => {
      if (this.state !== GameState.BETTING) return;
      if (this.currentBet.amount <= 0) {
        this.showToast('Vui lòng chọn cửa và đặt chip trước khi xác nhận!', 'warning');
        return;
      }
      this.showToast(`Đã xác nhận đặt cược ${this.formatNumber(this.currentBet.amount)} xu vào cửa ${this.currentBet.door === 'tai' ? 'Tài' : 'Xỉu'}!`);
      Sound.playChip();
    });

    // Nút Bật/Tắt chế độ Nặn Bát trên Top Header
    if (this.dom.btnToggleSqueeze) {
      this.dom.btnToggleSqueeze.addEventListener('click', () => {
        this.toggleSqueezeMode();
      });
    }

    // Toggle chế độ Nặn Bát trong Modal Settings
    if (this.dom.settingSqueeze) {
      this.dom.settingSqueeze.addEventListener('change', (e) => {
        this.setSqueezeMode(e.target.checked);
      });
    }

    // Nút "Mở Bát Ngay" (bỏ qua nặn)
    if (this.dom.btnQuickOpen) {
      this.dom.btnQuickOpen.addEventListener('click', () => {
        if (this.state === GameState.SQUEEZING) {
          this.endSqueezeAndReveal();
        }
      });
    }

    // Click vào Bát Rồng khi ở trạng thái chờ
    this.dom.dragonCup.addEventListener('click', () => {
      if (this.state === GameState.BETTING) {
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
      if (this.dom.settingSqueeze) {
        this.dom.settingSqueeze.checked = this.isSqueezeMode;
      }
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

  /**
   * ĐIỀU KHIỂN NẶN BÁT BẰNG CHUỘT / CẢM ỨNG (DRAG / TOUCH)
   */
  bindSqueezeGestures() {
    const cup = this.dom.dragonCup;

    const onStart = (clientX, clientY) => {
      if (this.state !== GameState.SQUEEZING) return;
      this.isDragging = true;
      this.dragStartX = clientX - this.currentCupOffset.x;
      this.dragStartY = clientY - this.currentCupOffset.y;
      cup.classList.add('squeezing-active');
    };

    const onMove = (clientX, clientY) => {
      if (!this.isDragging || this.state !== GameState.SQUEEZING) return;
      
      const newX = clientX - this.dragStartX;
      const newY = clientY - this.dragStartY;
      this.currentCupOffset = { x: newX, y: newY };

      // Giới hạn vùng kéo tự do trong đĩa và hé lộ
      cup.style.transform = `translate(${newX}px, ${newY}px) scale(1.02)`;

      const distance = Math.sqrt(newX * newX + newY * newY);

      // Phát âm thanh trượt bát nhẹ nhàng
      if (Math.abs(distance - this.lastSoundDistance) > 35) {
        Sound.playSlide();
        this.lastSoundDistance = distance;
      }

      // Ngưỡng kéo xa hơn 130px: Tự động mở bát hoàn toàn
      if (distance > 130) {
        this.isDragging = false;
        cup.classList.remove('squeezing-active');
        this.endSqueezeAndReveal();
      }
    };

    const onEnd = () => {
      if (!this.isDragging || this.state !== GameState.SQUEEZING) return;
      this.isDragging = false;
      cup.classList.remove('squeezing-active');
      
      const distance = Math.sqrt(this.currentCupOffset.x * this.currentCupOffset.x + this.currentCupOffset.y * this.currentCupOffset.y);
      if (distance > 115) {
        this.endSqueezeAndReveal();
      }
    };

    // Chuột Desktop
    cup.addEventListener('mousedown', (e) => {
      e.preventDefault();
      onStart(e.clientX, e.clientY);
    });
    window.addEventListener('mousemove', (e) => {
      onMove(e.clientX, e.clientY);
    });
    window.addEventListener('mouseup', () => {
      onEnd();
    });

    // Cảm ứng Mobile / Tablet
    cup.addEventListener('touchstart', (e) => {
      if (e.touches && e.touches[0]) {
        onStart(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (e.touches && e.touches[0]) {
        onMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    window.addEventListener('touchend', () => {
      onEnd();
    });
  }

  toggleSqueezeMode() {
    this.setSqueezeMode(!this.isSqueezeMode);
  }

  setSqueezeMode(enabled) {
    this.isSqueezeMode = enabled;
    localStorage.setItem('taixiu_squeeze_mode', enabled.toString());
    this.updateSqueezeDisplay();
    this.showToast(enabled ? '🖐️ Đã BẬT chế độ NẶN BÁT hồi hộp!' : '⚡ Đã TẮT nặn bát (Mở bát tự động siêu tốc)');
  }

  updateSqueezeDisplay() {
    if (this.dom.btnToggleSqueeze) {
      if (this.isSqueezeMode) {
        this.dom.btnToggleSqueeze.classList.add('active');
        this.dom.squeezeLabel.textContent = 'Nặn: BẬT';
      } else {
        this.dom.btnToggleSqueeze.classList.remove('active');
        this.dom.squeezeLabel.textContent = 'Nặn: TẮT';
      }
    }
    if (this.dom.settingSqueeze) {
      this.dom.settingSqueeze.checked = this.isSqueezeMode;
    }
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
    this.dom.chipButtons.forEach(b => b.classList.remove('active'));
    this.currentChipIndex = index;
    const selectedBtn = this.dom.chipButtons[index];
    if (selectedBtn) {
      selectedBtn.classList.add('active');
      this.selectedChip = explicitValue || parseInt(selectedBtn.dataset.value, 10);
      Sound.playChip();
    }
  }

  placeBet(door, event) {
    if (this.currentBet.door && this.currentBet.door !== door) {
      this.showToast('Chỉ được chọn cược một cửa trong cùng một ván chơi!', 'warning');
      return;
    }

    const availableMoney = this.balance - this.currentBet.amount;
    if (availableMoney < this.selectedChip) {
      this.showToast('Số dư xu của bạn không đủ để cược thêm!', 'warning');
      return;
    }

    this.currentBet.door = door;
    this.currentBet.amount += this.selectedChip;
    this.updateBetDisplay();
    Sound.playChip();

    if (event) {
      this.playChipThrowAnimation(event.clientX, event.clientY, door);
    }
  }

  clearBet() {
    this.currentBet = { door: null, amount: 0 };
    this.updateBetDisplay();
    this.dom.doorTai.classList.remove('selected');
    this.dom.doorXiu.classList.remove('selected');
    this.showToast('Đã thu hồi tiền cược!');
    Sound.playChip();
  }

  updateBetDisplay() {
    this.dom.betBadgeTai.textContent = this.currentBet.door === 'tai' ? `${this.formatNumber(this.currentBet.amount)} xu` : '0 xu';
    this.dom.betBadgeXiu.textContent = this.currentBet.door === 'xiu' ? `${this.formatNumber(this.currentBet.amount)} xu` : '0 xu';

    if (this.currentBet.door === 'tai') {
      this.dom.doorTai.classList.add('selected');
      this.dom.doorXiu.classList.remove('selected');
    } else if (this.currentBet.door === 'xiu') {
      this.dom.doorXiu.classList.add('selected');
      this.dom.doorTai.classList.remove('selected');
    } else {
      this.dom.doorTai.classList.remove('selected');
      this.dom.doorXiu.classList.remove('selected');
    }
  }

  playChipThrowAnimation(startX, startY, door) {
    const chipAnim = document.createElement('div');
    chipAnim.className = 'floating-chip-anim';
    chipAnim.textContent = '🪙';
    chipAnim.style.left = `${startX - 15}px`;
    chipAnim.style.top = `${startY - 15}px`;
    document.body.appendChild(chipAnim);

    const targetEl = door === 'tai' ? this.dom.doorTai : this.dom.doorXiu;
    const rect = targetEl.getBoundingClientRect();
    const destX = rect.left + rect.width / 2;
    const destY = rect.top + rect.height / 2;

    requestAnimationFrame(() => {
      chipAnim.style.transform = `translate(${destX - startX}px, ${destY - startY}px) scale(0.6)`;
      chipAnim.style.opacity = '0';
    });

    setTimeout(() => {
      chipAnim.remove();
      targetEl.classList.add('chip-placed-bump');
      setTimeout(() => targetEl.classList.remove('chip-placed-bump'), 300);
    }, 450);
  }

  renderDiceElements() {
    this.dom.diceContainer.innerHTML = '';
    for (let i = 0; i < 3; i++) {
      const dieEl = DiceManager.createDie3DElement(this.currentDice[i]);
      this.dom.diceContainer.appendChild(dieEl);
    }
  }

  updateStatusBanner(text, statusType = '') {
    this.dom.statusRibbon.textContent = text;
    if (statusType === 'win') {
      this.dom.statusRibbon.style.color = '#ffd700';
      this.dom.statusRibbon.style.borderColor = '#ffd700';
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
    clearInterval(this.squeezeTimer);

    // Mở khóa cửa cược
    this.dom.doorXiu.classList.remove('disabled');
    this.dom.doorTai.classList.remove('disabled');

    // Ẩn hướng dẫn và nút nặn nếu đang hiện
    if (this.dom.squeezeGuide) this.dom.squeezeGuide.style.display = 'none';
    if (this.dom.btnQuickOpen) this.dom.btnQuickOpen.style.display = 'none';

    // Bát đậy sẵn hoặc nâng nhẹ
    this.dom.dragonCup.classList.remove('lifted', 'squeezing-ready', 'squeezing-active');
    this.dom.dragonCup.classList.add('covered');
    this.dom.dragonCup.style.transform = '';
    this.currentCupOffset = { x: 0, y: 0 };

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

    let recentLossStreak = 0;
    for (const h of history) {
      if (h.betDoor) {
        if (!h.isWin) recentLossStreak++;
        else break;
      }
    }

    if (isAllIn) {
      const willWin = Math.random() < 0.5;
      const targetDoor = willWin ? this.currentBet.door : (this.currentBet.door === 'tai' ? 'xiu' : 'tai');
      this.currentDice = DiceManager.rollDiceWithTarget(targetDoor);
      this.pityReason = willWin ? '🔥 ALL-IN THẮNG LỚN: Cảm xúc bùng nổ!' : '💀 ALL-IN THUA: Kịch bản nghẹt thở!';
    } else if (hasBet && recentLossStreak >= 2) {
      const winRate = recentLossStreak >= 3 ? 0.85 : 0.75;
      const willWin = Math.random() < winRate;
      const targetDoor = willWin ? this.currentBet.door : (this.currentBet.door === 'tai' ? 'xiu' : 'tai');
      this.currentDice = DiceManager.rollDiceWithTarget(targetDoor);
      this.pityReason = willWin ? '🔥 Cứu dây đen: Lội ngược dòng thành công!' : null;
    } else {
      this.currentDice = DiceManager.rollThreeDice();
      this.pityReason = null;
    }

    this.pendingResult = DiceManager.evaluateResult(this.currentDice);

    // Đậy bát rồng vàng & RUNG LẮC CỰC MẠNH VŨ BÃO
    const cup = this.dom.dragonCup;
    cup.classList.remove('lifted', 'squeezing-ready', 'squeezing-active');
    cup.classList.add('covered', 'shaking');
    cup.style.transform = '';

    this.updateStatusBanner('🎲 Đang xóc đĩa...');
    Sound.playShake(1800);

    // Rung lắc đĩa
    this.dom.plateFelt.classList.add('shaking');

    // Xoay 3D xúc xắc ngầm
    const diceElements = this.dom.diceContainer.querySelectorAll('.die-cube');
    diceElements.forEach((dieEl, idx) => {
      DiceManager.setDieFace(dieEl, this.currentDice[idx], true);
    });

    // Sau 1.8 giây xóc xong
    setTimeout(() => {
      this.dom.plateFelt.classList.remove('shaking');
      cup.classList.remove('shaking');

      // NẾU BẬT CHẾ ĐỘ NẶN BÁT VÀ NGƯỜI CHƠI CÓ ĐẶT CƯỢC -> CHUYỂN VÀO TRẠNG THÁI NẶN BÁT
      if (this.isSqueezeMode) {
        this.startSqueezingPhase();
      } else {
        this.revealResult();
      }
    }, 1800);
  }

  /**
   * BẮT ĐẦU PHA NẶN BÁT HỒI HỘP
   */
  startSqueezingPhase() {
    this.state = GameState.SQUEEZING;
    this.currentCupOffset = { x: 0, y: 0 };

    const cup = this.dom.dragonCup;
    cup.classList.remove('shaking', 'lifted');
    cup.classList.add('covered', 'squeezing-ready');
    cup.style.transform = 'translate(0px, 0px)';

    // Hiện thanh gợi ý và nút mở nhanh
    if (this.dom.squeezeGuide) this.dom.squeezeGuide.style.display = 'flex';
    if (this.dom.btnQuickOpen) this.dom.btnQuickOpen.style.display = 'block';

    let squeezeCountdown = SQUEEZE_TIME_LIMIT_SEC;
    this.updateStatusBanner(`🖐️ MỜI BẠN NẶN BÁT (${squeezeCountdown}s) • Kéo Bát Rồng`, 'urgent');

    clearInterval(this.squeezeTimer);
    this.squeezeTimer = setInterval(() => {
      squeezeCountdown -= 1;
      if (squeezeCountdown > 0) {
        this.updateStatusBanner(`🖐️ MỜI BẠN NẶN BÁT (${squeezeCountdown}s) • Kéo Bát Rồng`, 'urgent');
      } else {
        clearInterval(this.squeezeTimer);
        // Hết giờ nặn -> Tự động mở bát
        this.endSqueezeAndReveal();
      }
    }, 1000);
  }

  /**
   * KẾT THÚC NẶN BÁT VÀ NÂNG BÁT
   */
  endSqueezeAndReveal() {
    clearInterval(this.squeezeTimer);
    if (this.state === GameState.RESULT) return;

    if (this.dom.squeezeGuide) this.dom.squeezeGuide.style.display = 'none';
    if (this.dom.btnQuickOpen) this.dom.btnQuickOpen.style.display = 'none';

    const cup = this.dom.dragonCup;
    cup.classList.remove('squeezing-ready', 'squeezing-active');
    
    // Nâng bát mượt mà lên trên
    cup.style.transition = 'transform 0.5s ease-out, opacity 0.5s ease-out';
    cup.style.transform = 'translateY(-160px) scale(0.9)';
    cup.style.opacity = '0.05';

    setTimeout(() => {
      this.revealResult();
    }, 300);
  }

  /**
   * MỞ BÁT VÀ HIỂN THỊ KẾT QUẢ, CHỜ 5 GIÂY ĐỂ BẮT ĐẦU VÁN MỚI
   */
  revealResult() {
    this.state = GameState.RESULT;
    clearInterval(this.squeezeTimer);

    if (this.dom.squeezeGuide) this.dom.squeezeGuide.style.display = 'none';
    if (this.dom.btnQuickOpen) this.dom.btnQuickOpen.style.display = 'none';

    const cup = this.dom.dragonCup;
    cup.classList.remove('shaking', 'covered', 'squeezing-ready', 'squeezing-active');
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
    this.dom.topBalance.textContent = formatted;
    this.dom.userBalance.textContent = formatted;
  }

  renderBeadRoadAndStats() {
    const history = Storage.getHistory();
    const stats = Storage.getStats();

    // Render 10 hạt gần đây nhất
    this.dom.beadRoadGrid.innerHTML = '';
    const last10 = history.slice(0, 10);
    for (let i = 0; i < 10; i++) {
      const circle = document.createElement('div');
      circle.className = 'bead-circle';
      if (i < last10.length) {
        const item = last10[i];
        circle.classList.add(item.result);
        circle.textContent = item.result === 'tai' ? 'T' : 'X';
        circle.title = `${item.result === 'tai' ? 'Tài' : 'Xỉu'} ${item.sum} điểm [${item.dice.join(',')}]`;
      } else {
        circle.style.opacity = '0.25';
        circle.style.background = 'rgba(255,255,255,0.05)';
        circle.textContent = '-';
      }
      this.dom.beadRoadGrid.appendChild(circle);
    }

    // Cập nhật thanh tỷ lệ % Tài/Xỉu
    const total = stats.taiCount + stats.xiuCount;
    let pctTai = 50;
    let pctXiu = 50;
    if (total > 0) {
      pctTai = Math.round((stats.taiCount / total) * 100);
      pctXiu = 100 - pctTai;
    }
    this.dom.statBarTai.style.width = `${pctTai}%`;
    this.dom.statBarXiu.style.width = `${pctXiu}%`;
    this.dom.statPctTai.textContent = `${pctTai}%`;
    this.dom.statPctXiu.textContent = `${pctXiu}%`;
  }

  renderDetailedHistoryTable() {
    const history = Storage.getHistory();
    this.dom.detailedHistoryTbody.innerHTML = '';
    if (history.length === 0) {
      this.dom.detailedHistoryTbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #888;">Chưa có ván cược nào được ghi lại.</td></tr>';
      return;
    }

    history.forEach(item => {
      const tr = document.createElement('tr');
      const isTai = item.result === 'tai';
      const resultBadge = `<span class="rule-pill-badge ${item.result}" style="font-size:0.75rem; padding: 2px 8px;">${isTai ? 'Tài' : 'Xỉu'}</span>`;
      let payoutText = '<span style="color:#888;">Chưa cược</span>';
      if (item.betDoor) {
        const doorName = item.betDoor === 'tai' ? 'Tài' : 'Xỉu';
        if (item.isWin) {
          payoutText = `<span style="color: #2ecc71; font-weight:700;">+${this.formatNumber(item.netChange)} (${doorName})</span>`;
        } else {
          payoutText = `<span style="color: #e74c3c; font-weight:700;">-${this.formatNumber(item.betAmount)} (${doorName})</span>`;
        }
      }

      tr.innerHTML = `
        <td>${item.timestamp}</td>
        <td>[${item.dice.join(', ')}]</td>
        <td><strong>${item.sum}</strong></td>
        <td>${resultBadge}</td>
        <td>${payoutText}</td>
      `;
      this.dom.detailedHistoryTbody.appendChild(tr);
    });
  }

  showToast(msg, type = 'info') {
    const toast = this.dom.toastPopup;
    if (!toast) return;
    toast.textContent = msg;
    toast.style.borderColor = type === 'win' ? '#2ecc71' : (type === 'warning' ? '#f39c12' : '#d4af37');
    toast.classList.add('show');
    clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      toast.classList.remove('show');
    }, 2800);
  }

  formatNumber(num) {
    return (num || 0).toLocaleString('vi-VN');
  }
}

// Khởi chạy khi DOM sẵn sàng
document.addEventListener('DOMContentLoaded', () => {
  window.taiXiuGame = new TaiXiuGame();
  window.taiXiuGame.init();
});
