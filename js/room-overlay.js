/**
 * RoomOverlay - Realtime Multiplayer Friend Rooms Client Component
 * Lucky Table Casino Portal
 */

(function () {
  // Chỉ khởi tạo 1 lần
  if (window.RoomOverlay) return;

  class RoomOverlayManager {
    constructor() {
      this.socket = null;
      this.currentRoom = null;
      this.currentRoomCode = null;
      this.currentUser = null;
      this.isOpen = false;
      this.init();
    }

    async init() {
      // 1. Lấy thông tin user hiện tại từ localStorage hoặc tạo mới
      this.loadCurrentUser();

      // 2. Kiểm tra xem URL có query ?room=CODE không
      const params = new URLSearchParams(window.location.search);
      const roomParam = params.get('room');
      if (roomParam) {
        this.currentRoomCode = roomParam.toUpperCase();
      }

      // 3. Kết nối Socket.io nếu trang chưa có sẵn
      this.initSocket();

      // 4. Nếu có roomCode trên URL, tự động vào phòng
      if (this.currentRoomCode) {
        setTimeout(() => this.joinCurrentRoom(), 600);
      }

      // 5. Render Floating UI Widget
      this.renderWidget();
    }

    loadCurrentUser() {
      const stored = localStorage.getItem('lucky_casino_user');
      if (stored) {
        try {
          this.currentUser = JSON.parse(stored);
        } catch (e) {
          this.currentUser = null;
        }
      }

      if (!this.currentUser) {
        const uid = 'user_' + Math.random().toString(36).substring(2, 9);
        this.currentUser = {
          id: uid,
          username: 'ĐạiGia_' + uid.slice(-4),
          balance: 50000,
          avatar: 'assets/avatar.png'
        };
        localStorage.setItem('lucky_casino_user', JSON.stringify(this.currentUser));
      }
    }

    initSocket() {
      if (window.gameSocket) {
        this.socket = window.gameSocket;
        this.bindSocketEvents();
      } else if (typeof io !== 'undefined') {
        this.socket = io({
          query: {
            userId: this.currentUser.id,
            username: this.currentUser.username
          }
        });
        window.gameSocket = this.socket;
        this.bindSocketEvents();
      }
    }

    bindSocketEvents() {
      if (!this.socket) return;

      this.socket.on('room_state_updated', (room) => {
        if (room && room.roomCode === this.currentRoomCode) {
          this.currentRoom = room;
          this.updateWidgetUI();
        }
      });

      this.socket.on('room_new_message', (msg) => {
        if (this.currentRoom && this.currentRoom.roomCode === msg.roomCode) {
          this.appendChatMessage(msg);
        }
      });

      this.socket.on('room_player_bet', (data) => {
        this.showFriendBetToast(data);
      });

      this.socket.on('room_player_joined', (data) => {
        this.showToast(`👋 ${data.username} vừa vào phòng!`);
      });

      this.socket.on('room_player_left', (data) => {
        this.showToast(`🚪 Một bạn chơi đã rời phòng.`);
      });
    }

    async joinCurrentRoom() {
      if (!this.socket || !this.currentRoomCode) return;

      this.socket.emit('room_join', {
        roomCode: this.currentRoomCode,
        password: ''
      }, (res) => {
        if (res && res.success) {
          this.currentRoom = res.room;
          this.updateWidgetUI();
          this.showToast(`🎉 Đã tham gia phòng #${this.currentRoomCode}!`);
        } else {
          this.showToast(res?.message || 'Không thể tham gia phòng');
        }
      });
    }

    renderWidget() {
      // Đảm bảo CSS đã được nạp
      if (!document.getElementById('room-overlay-css')) {
        const link = document.createElement('link');
        link.id = 'room-overlay-css';
        link.rel = 'stylesheet';
        link.href = '/css/room-overlay.css';
        document.head.appendChild(link);
      }

      // Khối nút Floating
      const container = document.createElement('div');
      container.id = 'room-floating-container';
      container.className = 'room-floating-bar';
      container.innerHTML = `
        <div class="room-toggle-pill" id="btn-toggle-room-drawer">
          <span class="room-live-dot"></span>
          <span id="room-pill-label">👥 Chơi Với Bạn Bè</span>
        </div>

        <div class="room-overlay-drawer" id="room-overlay-drawer" style="display: none;">
          <div class="room-drawer-header">
            <div class="room-header-title">
              <span>👥</span>
              <span id="drawer-room-title">Phòng Bạn Bè</span>
            </div>
            <div class="room-header-actions">
              <button class="btn-room-tool" id="btn-copy-room-link" title="Sao chép link mời">📋 Copy Link</button>
              <button class="btn-room-tool" id="btn-leave-room" title="Rời phòng">🚪 Thoát</button>
              <button class="btn-room-tool" id="btn-close-drawer">✕</button>
            </div>
          </div>

          <div class="room-drawer-body">
            <!-- Friend Roster -->
            <div class="friend-roster-box">
              <div class="friend-roster-title">
                <span>Bạn Bè Trong Bàn (<span id="drawer-player-count">0</span>)</span>
              </div>
              <div class="friend-list" id="drawer-friend-list">
                <div style="color: #888; font-size: 0.8rem; text-align: center; padding: 6px;">Đang tải danh sách...</div>
              </div>
            </div>

            <!-- Chat & Bet Logs -->
            <div class="room-chat-box" id="drawer-chat-box">
              <div class="chat-msg-row">
                <span class="chat-msg-author system">[Hệ Thống]:</span>
                <span class="chat-msg-text">Chào mừng bạn vào phòng chơi cùng bạn bè!</span>
              </div>
            </div>

            <!-- Quick Emotes -->
            <div class="room-quick-emotes">
              <button class="btn-emote-fast" data-emote="🎉">🎉</button>
              <button class="btn-emote-fast" data-emote="🔥">🔥</button>
              <button class="btn-emote-fast" data-emote="💰">💰</button>
              <button class="btn-emote-fast" data-emote="🍻">🍻</button>
              <button class="btn-emote-fast" data-emote="👏">👏</button>
              <button class="btn-emote-fast" data-emote="🚀">🚀</button>
            </div>

            <!-- Chat Input -->
            <div class="room-chat-input-bar">
              <input type="text" class="room-chat-input" id="drawer-chat-input" placeholder="Nhắn tin với bạn bè..." maxlength="150">
              <button class="btn-send-chat" id="btn-send-room-chat">Gửi</button>
            </div>
          </div>
        </div>

        <!-- Toast thông báo cược của bạn bè -->
        <div class="friend-bet-banner-toast" id="friend-bet-toast"></div>
      `;

      document.body.appendChild(container);
      this.attachWidgetListeners();
    }

    attachWidgetListeners() {
      const toggleBtn = document.getElementById('btn-toggle-room-drawer');
      const drawer = document.getElementById('room-overlay-drawer');
      const closeBtn = document.getElementById('btn-close-drawer');
      const copyBtn = document.getElementById('btn-copy-room-link');
      const leaveBtn = document.getElementById('btn-leave-room');
      const sendBtn = document.getElementById('btn-send-room-chat');
      const input = document.getElementById('drawer-chat-input');

      toggleBtn.addEventListener('click', () => {
        if (!this.currentRoom) {
          // Chưa vào phòng nào, mở modal danh sách phòng hoặc chuyển về Trang Chủ
          if (window.location.pathname !== '/' && !window.location.pathname.endsWith('index.html')) {
            window.location.href = '/#friends-section';
          } else {
            const section = document.getElementById('friends-section');
            if (section) section.scrollIntoView({ behavior: 'smooth' });
          }
          return;
        }

        this.isOpen = !this.isOpen;
        drawer.style.display = this.isOpen ? 'flex' : 'none';
      });

      closeBtn.addEventListener('click', () => {
        this.isOpen = false;
        drawer.style.display = 'none';
      });

      copyBtn.addEventListener('click', () => {
        if (!this.currentRoomCode) return;
        const url = `${window.location.origin}${window.location.pathname}?room=${this.currentRoomCode}`;
        navigator.clipboard.writeText(url).then(() => {
          this.showToast(`📋 Đã chép link phòng: ${this.currentRoomCode}`);
        }).catch(() => {
          prompt('Sao chép mã phòng:', this.currentRoomCode);
        });
      });

      leaveBtn.addEventListener('click', () => {
        if (!confirm('Bạn có chắc muốn rời phòng chơi này?')) return;
        if (this.socket && this.currentRoomCode) {
          this.socket.emit('room_leave', { roomCode: this.currentRoomCode });
        }
        this.currentRoom = null;
        this.currentRoomCode = null;
        drawer.style.display = 'none';
        this.isOpen = false;
        // Xóa query param trên url
        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
        document.getElementById('room-pill-label').textContent = '👥 Chơi Với Bạn Bè';
        this.showToast('Đã rời phòng chơi.');
      });

      // Gửi chat
      const handleSend = () => {
        const text = input.value.trim();
        if (!text || !this.currentRoomCode || !this.socket) return;
        this.socket.emit('room_send_chat', {
          roomCode: this.currentRoomCode,
          content: text
        });
        input.value = '';
      };

      sendBtn.addEventListener('click', handleSend);
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSend();
      });

      // Quick Emotes
      document.querySelectorAll('.btn-emote-fast').forEach(btn => {
        btn.addEventListener('click', () => {
          const emote = btn.getAttribute('data-emote');
          if (!emote || !this.currentRoomCode || !this.socket) return;
          this.socket.emit('room_send_chat', {
            roomCode: this.currentRoomCode,
            content: emote
          });
        });
      });
    }

    updateWidgetUI() {
      if (!this.currentRoom) return;

      const pillLabel = document.getElementById('room-pill-label');
      const drawerTitle = document.getElementById('drawer-room-title');
      const playerCount = document.getElementById('drawer-player-count');
      const friendList = document.getElementById('drawer-friend-list');
      const drawer = document.getElementById('room-overlay-drawer');

      if (pillLabel) {
        pillLabel.textContent = `Phòng: #${this.currentRoom.roomCode} (${this.currentRoom.playerCount || 1})`;
      }
      if (drawerTitle) {
        drawerTitle.textContent = `#${this.currentRoom.roomCode} - ${this.currentRoom.roomName || 'Bàn Chơi'}`;
      }
      if (playerCount) {
        playerCount.textContent = (this.currentRoom.players ? this.currentRoom.players.length : 1);
      }

      // Render danh sách bạn bè
      if (friendList && this.currentRoom.players) {
        friendList.innerHTML = this.currentRoom.players.map(p => `
          <div class="friend-item-row">
            <div class="friend-item-name">
              <span>${p.is_host ? '👑' : '👤'}</span>
              <span>${p.username}</span>
            </div>
            <div class="friend-item-balance">🪙 ${(p.balance || 0).toLocaleString('vi-VN')}</div>
          </div>
        `).join('');
      }

      // Load tin nhắn cũ nếu có
      if (this.currentRoom.messages && this.currentRoom.messages.length) {
        const chatBox = document.getElementById('drawer-chat-box');
        if (chatBox) {
          chatBox.innerHTML = this.currentRoom.messages.map(m => this.createMessageHtml(m)).join('');
          chatBox.scrollTop = chatBox.scrollHeight;
        }
      }
    }

    appendChatMessage(msg) {
      const chatBox = document.getElementById('drawer-chat-box');
      if (!chatBox) return;

      const div = document.createElement('div');
      div.className = `chat-msg-row ${msg.msgType || ''}`;
      div.innerHTML = this.createMessageHtml(msg);
      chatBox.appendChild(div);
      chatBox.scrollTop = chatBox.scrollHeight;
    }

    createMessageHtml(m) {
      if (m.msgType === 'system') {
        return `<span class="chat-msg-author system">[Hệ Thống]:</span> <span class="chat-msg-text">${m.content}</span>`;
      }
      if (m.msgType === 'bet') {
        return `<span class="chat-msg-author">🔥 ${m.username}:</span> <span class="chat-msg-text">${m.content}</span>`;
      }
      if (m.msgType === 'win') {
        return `<span class="chat-msg-author">🎉 ${m.username}:</span> <span class="chat-msg-text">${m.content}</span>`;
      }
      return `<span class="chat-msg-author">${m.username}:</span> <span class="chat-msg-text">${m.content}</span>`;
    }

    showFriendBetToast(data) {
      const toast = document.getElementById('friend-bet-toast');
      if (!toast) return;

      toast.innerHTML = `
        <span style="font-size: 1.2rem;">🎲</span>
        <span>Bạn <strong>${data.username}</strong> vừa cược <strong>${Number(data.amount).toLocaleString('vi-VN')} xu</strong> vào <strong>${(data.door || '').toUpperCase()}</strong>!</span>
      `;
      toast.classList.add('show');
      setTimeout(() => {
        toast.classList.remove('show');
      }, 3500);

      // Thêm vào chat box
      this.appendChatMessage({
        roomCode: this.currentRoomCode,
        username: data.username,
        content: `đặt cược ${Number(data.amount).toLocaleString('vi-VN')} xu vào [${(data.door || '').toUpperCase()}]`,
        msgType: 'bet'
      });
    }

    showToast(message) {
      const toast = document.getElementById('friend-bet-toast');
      if (!toast) return;

      toast.innerHTML = `<span>💬 ${message}</span>`;
      toast.classList.add('show');
      setTimeout(() => {
        toast.classList.remove('show');
      }, 3000);
    }

    /**
     * Đồng bộ đặt cược từ các game khác (Bầu Cua, Ba Cây)
     */
    syncCustomBet(door, amount, gameType = 'baucua') {
      if (!this.socket || !this.currentRoomCode) return;
      this.socket.emit('room_sync_custom_bet', {
        roomCode: this.currentRoomCode,
        door,
        amount,
        gameType
      });
    }
  }

  // Khởi tạo đối tượng toàn cục
  window.RoomOverlay = new RoomOverlayManager();
})();
