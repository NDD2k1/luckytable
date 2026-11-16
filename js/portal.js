/**
 * Portal & Game Lobby Controller - Lucky Table Casino Portal
 * Xử lý dữ liệu nạp/rút tiền, thông tin tài khoản, cấu hình và danh sách game & phòng chơi bạn bè
 */

const USER_ID = 'Player001';

class PortalController {
  constructor() {
    this.user = {
      id: USER_ID,
      username: 'Player001',
      balance: 10000,
      vipLevel: 1,
      avatar: 'assets/avatar.png'
    };
    this.newsList = [];
    this.activeDepositMethod = 'BANK_QR';
    this.rooms = [];

    this.dom = {};
  }

  init() {
    this.cacheElements();
    this.bindEvents();
    this.fetchUserData();
    this.fetchNews();
    this.fetchRooms();
    this.initMultiplayerEvents();

    // Tự động làm mới danh sách phòng mỗi 6s
    setInterval(() => this.fetchRooms(), 6000);
  }

  cacheElements() {
    this.dom = {
      headerBalance: document.getElementById('header-balance'),
      headerUsername: document.getElementById('header-username'),
      headerVip: document.getElementById('header-vip'),
      headerAvatar: document.getElementById('header-avatar'),

      // Action buttons
      btnOpenDeposit: document.getElementById('btn-open-deposit'),
      btnOpenWithdraw: document.getElementById('btn-open-withdraw'),
      btnOpenProfile: document.getElementById('btn-open-profile'),
      btnOpenSettings: document.getElementById('btn-open-settings'),

      // Modals
      modalDeposit: document.getElementById('modal-deposit'),
      modalWithdraw: document.getElementById('modal-withdraw'),
      modalProfile: document.getElementById('modal-profile'),
      modalSettings: document.getElementById('modal-settings'),
      modalNews: document.getElementById('modal-news'),
      modalCreateRoom: document.getElementById('modal-create-room'),

      // Multiplayer Room elements
      lobbyRoomsGrid: document.getElementById('lobby-rooms-grid'),
      quickRoomInput: document.getElementById('quick-room-code-input'),
      btnQuickJoin: document.getElementById('btn-quick-join-room'),
      btnOpenCreateRoom: document.getElementById('btn-open-create-room'),
      btnSubmitCreateRoom: document.getElementById('btn-submit-create-room'),
      createRoomName: document.getElementById('create-room-name'),
      createRoomGame: document.getElementById('create-room-game'),
      createRoomMax: document.getElementById('create-room-max'),
      createRoomPass: document.getElementById('create-room-pass'),

      // Deposit Form
      depositAmountInput: document.getElementById('deposit-amount-input'),
      depositMethodTabs: document.querySelectorAll('.method-tab-btn'),
      btnConfirmDeposit: document.getElementById('btn-confirm-deposit'),
      depositQuickChips: document.querySelectorAll('.deposit-chip'),

      // Withdraw Form
      withdrawAmountInput: document.getElementById('withdraw-amount-input'),
      withdrawBankSelect: document.getElementById('withdraw-bank-select'),
      withdrawAccNum: document.getElementById('withdraw-acc-num'),
      withdrawAccName: document.getElementById('withdraw-acc-name'),
      btnConfirmWithdraw: document.getElementById('btn-confirm-withdraw'),

      // Profile Form
      profileUsernameInput: document.getElementById('profile-username-input'),
      profileVipText: document.getElementById('profile-vip-text'),
      profileBalanceText: document.getElementById('profile-balance-text'),
      btnSaveProfile: document.getElementById('btn-save-profile'),
      txnHistoryTbody: document.getElementById('txn-history-tbody'),

      // Settings
      settingSound: document.getElementById('setting-sound'),
      settingPity: document.getElementById('setting-pity'),
      btnResetDemo: document.getElementById('btn-reset-demo'),

      // Category filters
      categoryTabs: document.querySelectorAll('.tab-filter-btn'),
      gameCards: document.querySelectorAll('.game-card-item'),

      // News Container
      newsContainer: document.getElementById('news-list-container'),

      // Toast
      toastPopup: document.getElementById('toast-popup')
    };
  }

  bindEvents() {
    // Mở modals
    if (this.dom.btnOpenDeposit) {
      this.dom.btnOpenDeposit.addEventListener('click', () => this.openModal(this.dom.modalDeposit));
    }
    if (this.dom.btnOpenWithdraw) {
      this.dom.btnOpenWithdraw.addEventListener('click', () => this.openModal(this.dom.modalWithdraw));
    }
    if (this.dom.btnOpenProfile) {
      this.dom.btnOpenProfile.addEventListener('click', () => {
        this.openModal(this.dom.modalProfile);
        this.fetchTransactions();
      });
    }
    if (this.dom.btnOpenSettings) {
      this.dom.btnOpenSettings.addEventListener('click', () => this.openModal(this.dom.modalSettings));
    }

    // Đóng modals qua nút X hoặc click ra ngoài nền
    document.querySelectorAll('.modal-close-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modal = e.target.closest('.portal-modal-overlay');
        this.closeModal(modal);
      });
    });

    document.querySelectorAll('.portal-modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) this.closeModal(overlay);
      });
    });

    // Chọn phương thức nạp
    this.dom.depositMethodTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        this.dom.depositMethodTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.activeDepositMethod = tab.getAttribute('data-method');
      });
    });

    // Chọn số tiền nạp nhanh
    this.dom.depositQuickChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const val = chip.getAttribute('data-val');
        if (this.dom.depositAmountInput) {
          this.dom.depositAmountInput.value = parseInt(val, 10).toLocaleString('vi-VN');
          this.dom.depositAmountInput.setAttribute('data-raw', val);
        }
      });
    });

    // Xác nhận nạp tiền
    if (this.dom.btnConfirmDeposit) {
      this.dom.btnConfirmDeposit.addEventListener('click', () => this.handleDeposit());
    }

    // Xác nhận rút tiền
    if (this.dom.btnConfirmWithdraw) {
      this.dom.btnConfirmWithdraw.addEventListener('click', () => this.handleWithdraw());
    }

    // Lưu Profile
    if (this.dom.btnSaveProfile) {
      this.dom.btnSaveProfile.addEventListener('click', () => this.handleSaveProfile());
    }

    // Reset Demo Balance
    if (this.dom.btnResetDemo) {
      this.dom.btnResetDemo.addEventListener('click', () => {
        this.updateBalanceOnServer(10000);
        this.showToast('Đã đặt lại 10.000 xu cho tài khoản!', 'success');
      });
    }

    // Lọc danh mục trò chơi
    this.dom.categoryTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        this.dom.categoryTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const cat = tab.getAttribute('data-category');
        this.filterGames(cat);
      });
    });
  }

  // =========================================================================
  // MULTIPLAYER FRIEND ROOMS EVENTS & RENDERING
  // =========================================================================
  initMultiplayerEvents() {
    if (this.dom.btnOpenCreateRoom) {
      this.dom.btnOpenCreateRoom.addEventListener('click', () => {
        if (this.dom.createRoomName) {
          this.dom.createRoomName.value = `Phòng VIP của ${this.user.username}`;
        }
        this.openModal(this.dom.modalCreateRoom);
      });
    }

    // Tạo phòng mới
    if (this.dom.btnSubmitCreateRoom) {
      this.dom.btnSubmitCreateRoom.addEventListener('click', () => this.handleCreateRoom());
    }

    // Vào bàn bằng mã phòng
    if (this.dom.btnQuickJoin) {
      this.dom.btnQuickJoin.addEventListener('click', () => this.handleQuickJoin());
    }
    if (this.dom.quickRoomInput) {
      this.dom.quickRoomInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.handleQuickJoin();
      });
    }
  }

  async fetchRooms() {
    try {
      const res = await fetch('/api/rooms');
      const data = await res.json();
      if (data.success) {
        this.rooms = data.rooms || [];
        this.renderRoomsGrid();
      }
    } catch (err) {
      console.warn('Lỗi khi tải danh sách phòng:', err);
    }
  }

  renderRoomsGrid() {
    const grid = this.dom.lobbyRoomsGrid;
    if (!grid) return;

    if (!this.rooms || this.rooms.length === 0) {
      grid.innerHTML = `
        <div class="no-rooms-notice">
          <div style="font-size: 2rem; margin-bottom: 8px;">🎲</div>
          <div>Hiện chưa có phòng bạn bè nào đang mở.</div>
          <div style="font-size: 0.82rem; color: #ffd700; margin-top: 6px;">Hãy là người đầu tiên bấm <strong>"➕ Tạo Phòng Mới"</strong> và gửi mã cho bạn bè!</div>
        </div>
      `;
      return;
    }

    grid.innerHTML = this.rooms.map(r => {
      let gameUrl = '/taixiu';
      let gameLabel = '🎲 Tài Xỉu 3D';
      let badgeClass = 'taixiu';

      if (r.gameType === 'baucua') {
        gameUrl = '/baucua';
        gameLabel = '🦀 Bầu Cua 3D';
        badgeClass = 'baucua';
      } else if (r.gameType === 'bacay') {
        gameUrl = '/bacay';
        gameLabel = '🃏 Ba Cây VIP';
        badgeClass = 'bacay';
      }

      const joinUrl = `${gameUrl}?room=${r.roomCode}`;

      return `
        <div class="room-card-box">
          <div class="room-card-header">
            <div>
              <span class="room-game-badge ${badgeClass}">${gameLabel}</span>
              <h4 class="room-title-name" title="${r.roomName}">${r.roomName}</h4>
            </div>
            <span class="room-code-tag">#${r.roomCode}</span>
          </div>

          <div class="room-host-line">
            <span>👑 Chủ phòng:</span>
            <strong>${r.hostName}</strong>
            ${r.isPrivate ? '<span title="Phòng có mật khẩu">🔒</span>' : ''}
          </div>

          <div class="room-card-meta">
            <span class="room-player-count">👥 ${r.playerCount || 1}/${r.maxPlayers} người chơi</span>
            <span style="color: #ffd700; font-size: 0.75rem;">🟢 Đang chờ cược</span>
          </div>

          <a href="${joinUrl}" class="btn-enter-room">👉 VÀO BÀN CHƠI NGAY</a>
        </div>
      `;
    }).join('');
  }

  async handleCreateRoom() {
    const name = this.dom.createRoomName ? this.dom.createRoomName.value.trim() : '';
    const gameType = this.dom.createRoomGame ? this.dom.createRoomGame.value : 'taixiu';
    const maxPlayers = this.dom.createRoomMax ? parseInt(this.dom.createRoomMax.value, 10) : 8;
    const password = this.dom.createRoomPass ? this.dom.createRoomPass.value.trim() : '';

    if (!name) {
      this.showToast('Vui lòng nhập tên phòng!', 'error');
      return;
    }

    try {
      const res = await fetch('/api/rooms/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hostId: this.user.id,
          hostName: this.user.username,
          roomName: name,
          gameType,
          maxPlayers,
          password
        })
      });
      const data = await res.json();
      if (data.success && data.room) {
        this.closeModal(this.dom.modalCreateRoom);
        this.showToast(`🎉 Tạo phòng #${data.room.roomCode} thành công! Đang chuyển vào bàn...`, 'success');

        let targetGame = '/taixiu';
        if (gameType === 'baucua') targetGame = '/baucua';
        else if (gameType === 'bacay') targetGame = '/bacay';

        setTimeout(() => {
          window.location.href = `${targetGame}?room=${data.room.roomCode}`;
        }, 800);
      } else {
        this.showToast(data.message || 'Không thể tạo phòng', 'error');
      }
    } catch (err) {
      this.showToast('Lỗi kết nối tới máy chủ', 'error');
    }
  }

  async handleQuickJoin() {
    const code = this.dom.quickRoomInput ? this.dom.quickRoomInput.value.trim().toUpperCase() : '';
    if (!code) {
      this.showToast('Vui lòng nhập mã phòng!', 'error');
      return;
    }

    try {
      const res = await fetch(`/api/rooms/${code}`);
      const data = await res.json();
      if (data.success && data.room) {
        let targetGame = '/taixiu';
        if (data.room.gameType === 'baucua') targetGame = '/baucua';
        else if (data.room.gameType === 'bacay') targetGame = '/bacay';

        this.showToast(`Đã tìm thấy phòng #${code}! Đang vào bàn...`, 'success');
        setTimeout(() => {
          window.location.href = `${targetGame}?room=${code}`;
        }, 500);
      } else {
        this.showToast('Mã phòng không tồn tại hoặc đã đóng!', 'error');
      }
    } catch (err) {
      this.showToast('Lỗi khi tìm phòng', 'error');
    }
  }

  // =========================================================================
  // USER DATA & API
  // =========================================================================
  fetchUserData() {
    fetch(`/api/user/${USER_ID}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          this.user = data.data;
          this.updateUserUI();
          localStorage.setItem('lucky_casino_user', JSON.stringify(this.user));
        }
      })
      .catch(() => {
        this.updateUserUI();
      });
  }

  updateUserUI() {
    const formattedBalance = Number(this.user.balance).toLocaleString('vi-VN');
    if (this.dom.headerBalance) this.dom.headerBalance.textContent = formattedBalance;
    if (this.dom.headerUsername) this.dom.headerUsername.textContent = this.user.username;
    if (this.dom.headerVip) this.dom.headerVip.textContent = `VIP ${this.user.vipLevel || 1}`;

    if (this.dom.profileUsernameInput) this.dom.profileUsernameInput.value = this.user.username;
    if (this.dom.profileBalanceText) this.dom.profileBalanceText.textContent = `${formattedBalance} xu`;
    if (this.dom.profileVipText) this.dom.profileVipText.textContent = `VIP ${this.user.vipLevel || 1}`;
  }

  handleDeposit() {
    let raw = this.dom.depositAmountInput.getAttribute('data-raw');
    if (!raw) {
      raw = this.dom.depositAmountInput.value.replace(/[^0-9]/g, '');
    }
    const amount = parseInt(raw, 10);
    if (isNaN(amount) || amount < 1000) {
      this.showToast('Vui lòng chọn hoặc nhập số xu hợp lệ (tối thiểu 1.000 xu)', 'error');
      return;
    }

    fetch(`/api/user/${this.user.id}/deposit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount,
        method: this.activeDepositMethod,
        note: `Nạp tiền từ Portal`
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          this.user.balance = data.balance;
          this.updateUserUI();
          this.closeModal(this.dom.modalDeposit);
          this.showToast(`🎉 Nạp thành công +${amount.toLocaleString('vi-VN')} xu!`, 'success');
        } else {
          this.showToast(data.message || 'Lỗi khi nạp tiền', 'error');
        }
      })
      .catch(() => {
        this.user.balance += amount;
        this.updateUserUI();
        this.closeModal(this.dom.modalDeposit);
        this.showToast(`🎉 Nạp demo thành công +${amount.toLocaleString('vi-VN')} xu!`, 'success');
      });
  }

  handleWithdraw() {
    const raw = this.dom.withdrawAmountInput.value.replace(/[^0-9]/g, '');
    const amount = parseInt(raw, 10);
    const bankName = this.dom.withdrawBankSelect.value;
    const accNum = this.dom.withdrawAccNum.value.trim();
    const accName = this.dom.withdrawAccName.value.trim();

    if (isNaN(amount) || amount < 10000) {
      this.showToast('Số xu rút tối thiểu là 10.000 xu!', 'error');
      return;
    }

    if (amount > this.user.balance) {
      this.showToast('Số dư trong ví không đủ để rút!', 'error');
      return;
    }

    if (!accNum || !accName) {
      this.showToast('Vui lòng nhập đầy đủ Số tài khoản và Tên chủ tài khoản!', 'error');
      return;
    }

    fetch(`/api/user/${this.user.id}/withdraw`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount,
        bankName,
        accountNumber: accNum,
        accountHolder: accName
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          this.user.balance = data.balance;
          this.updateUserUI();
          this.closeModal(this.dom.modalWithdraw);
          this.showToast(`✅ Đã gửi lệnh rút ${amount.toLocaleString('vi-VN')} xu về ${bankName}!`, 'success');
        } else {
          this.showToast(data.message || 'Lỗi khi rút tiền', 'error');
        }
      })
      .catch(() => {
        this.user.balance -= amount;
        this.updateUserUI();
        this.closeModal(this.dom.modalWithdraw);
        this.showToast(`✅ Đã gửi lệnh rút demo ${amount.toLocaleString('vi-VN')} xu về ${bankName}!`, 'success');
      });
  }

  handleSaveProfile() {
    const newName = this.dom.profileUsernameInput.value.trim();
    if (!newName || newName.length < 3) {
      this.showToast('Tên hiển thị phải có ít nhất 3 ký tự!', 'error');
      return;
    }

    fetch(`/api/user/${this.user.id}/profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: newName })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          this.user.username = newName;
          this.updateUserUI();
          this.closeModal(this.dom.modalProfile);
          this.showToast('Cập nhật thông tin thành công!', 'success');
        }
      })
      .catch(() => {
        this.user.username = newName;
        this.updateUserUI();
        this.closeModal(this.dom.modalProfile);
        this.showToast('Cập nhật thông tin thành công!', 'success');
      });
  }

  fetchTransactions() {
    if (!this.dom.txnHistoryTbody) return;

    fetch(`/api/user/${this.user.id}/transactions`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data && data.data.length > 0) {
          this.dom.txnHistoryTbody.innerHTML = data.data.slice(0, 10).map(t => `
            <tr>
              <td>${t.type === 'DEPOSIT' ? '🟢 Nạp Tiền' : '🔴 Rút Tiền'}</td>
              <td style="color: ${t.type === 'DEPOSIT' ? '#2ecc71' : '#e74c3c'}; font-weight: bold;">
                ${t.type === 'DEPOSIT' ? '+' : '-'}${Number(t.amount).toLocaleString('vi-VN')} xu
              </td>
              <td>${t.title || t.method || 'Giao dịch'}</td>
              <td><span style="color: #2ecc71;">Thành công</span></td>
            </tr>
          `).join('');
        } else {
          this.dom.txnHistoryTbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #888;">Chưa có giao dịch nào</td></tr>`;
        }
      })
      .catch(() => {});
  }

  updateBalanceOnServer(bal) {
    this.user.balance = bal;
    this.updateUserUI();
    fetch(`/api/user/${this.user.id}/sync-balance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ balance: bal })
    }).catch(() => {});
  }

  filterGames(category) {
    this.dom.gameCards.forEach(card => {
      if (category === 'all') {
        card.style.display = 'flex';
      } else {
        const cardCat = card.getAttribute('data-category');
        if (cardCat === category) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      }
    });
  }

  fetchNews() {
    fetch('/api/news')
      .then(res => res.json())
      .then(data => {
        if (data.success && this.dom.newsContainer) {
          this.renderNews(data.data);
        }
      })
      .catch(() => {});
  }

  renderNews(newsItems) {
    this.dom.newsContainer.innerHTML = '';
    newsItems.forEach(n => {
      const box = document.createElement('div');
      box.className = 'news-card-box';
      box.innerHTML = `
        <div class="news-meta-row">
          <span class="news-tag">${n.tag}</span>
          <span class="news-date">📅 ${n.date}</span>
        </div>
        <h4 class="news-title">${n.title}</h4>
        <p class="news-snippet">${n.summary}</p>
      `;
      this.dom.newsContainer.appendChild(box);
    });
  }

  openModal(modal) {
    if (modal) modal.classList.add('active');
  }

  closeModal(modal) {
    if (modal) modal.classList.remove('active');
  }

  showToast(message, type = 'info') {
    if (!this.dom.toastPopup) return;
    this.dom.toastPopup.textContent = message;
    this.dom.toastPopup.className = `toast-popup show ${type}`;

    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.dom.toastPopup.classList.remove('show');
    }, 2800);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const portal = new PortalController();
  portal.init();
  window.__PORTAL__ = portal;
});
