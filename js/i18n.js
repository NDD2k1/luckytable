/**
 * Internationalization (i18n) Module - Lucky Table
 * Multi-language support (English & Vietnamese)
 * Codebase standard: logic and comments in English; strings managed via translation dictionary.
 */

const I18N_STORAGE_KEY = 'lucky_casino_lang';

const translations = {
  vi: {
    // Brand & Header
    'brand.title': 'Lucky Table',
    'brand.slogan': 'Cổng Game Quốc Tế',
    'nav.home': '🏠 Trang Chủ',
    'nav.folk': '🎲 Dân Gian',
    'nav.slots': '🎰 Nổ Hũ Slots',
    'nav.cards': '🃏 Game Bài',
    'nav.friends': '👥 Chơi Bạn Bè',
    'nav.all_games': '🎮 Tất Cả Game',
    'nav.login': '🔑 Đăng Nhập',
    'nav.register': '✨ Đăng Ký',
    'nav.deposit': '+ Nạp Tiền',
    'nav.withdraw': '💳 Rút Tiền',
    'nav.vip': 'VIP',

    // Dropdown Items
    'game.taixiu.title': '🎲 Tài Xỉu Bát Rồng 3D',
    'game.xocdia.title': '🥢 Xóc Đĩa Tứ Linh 3D',
    'game.baucua.title': '🦀 Bầu Cua Tôm Cá 3D',
    'game.slots.west': '🎰 Nổ Hũ Tây Du Ký',
    'game.slots.fish': '🐟 Bắn Cá Thần Tài 3D',
    'game.cards.bacay': '🃏 Ba Cây Hoàng Gia VIP',
    'tag.hot': 'HOT',
    'tag.new': 'MỚI',
    'tag.jackpot': 'HŨ KHỦNG',

    // Hero Section
    'hero.badge': 'SẢNH CASINO THƯỢNG LƯU',
    'hero.title': 'SÂN CHƠI HOÀNG GIA CHÂU Á',
    'hero.desc': 'Trải nghiệm đỉnh cao Tài Xỉu Bát Rồng, Xóc Đĩa Tứ Linh với tính năng Tự Tay Nặn Bát 3D chân thực, sòng phẳng và minh bạch.',
    'hero.btn_play_taixiu': '🎲 Chơi Tài Xỉu 3D',
    'hero.btn_play_xocdia': '🥢 Chơi Xóc Đĩa 3D',

    // Categories
    'category.all': 'Tất Cả',
    'category.folk': '🎲 Dân Gian',
    'category.slots': '🎰 Nổ Hũ Slots',
    'category.cards': '🃏 Game Bài',

    // Game Cards
    'card.status.live': '🟢 ĐANG MỞ',
    'card.status.soon': 'Sắp Khởi Chạy',
    'card.btn_play': 'CHƠI NGAY ➔',
    'card.players': 'người chơi',

    // Modals
    'modal.login.title': '🔑 Đăng Nhập Tài Khoản',
    'modal.login.username_placeholder': 'Nhập tên tài khoản...',
    'modal.login.password_placeholder': 'Nhập mật khẩu...',
    'modal.login.btn_submit': 'Đăng Nhập Ngay',
    'modal.login.switch_text': 'Chưa có tài khoản? Đăng ký nhận 50.000 xu',

    'modal.register.title': '✨ Đăng Ký Tân Thủ (+50.000 Xu)',
    'modal.register.username_placeholder': 'Tên tài khoản (tối thiểu 3 ký tự)...',
    'modal.register.password_placeholder': 'Mật khẩu...',
    'modal.register.confirm_placeholder': 'Xác nhận lại mật khẩu...',
    'modal.register.btn_submit': 'Đăng Ký & Nhận 50.000 Xu',
    'modal.register.switch_text': 'Đã có tài khoản? Đăng nhập',

    'modal.profile.title': '👤 Hồ Sơ Người Chơi',
    'modal.profile.balance_label': 'Số dư:',
    'modal.profile.display_name': 'Tên hiển thị:',
    'modal.profile.btn_rename': 'Lưu Đổi Tên',
    'modal.profile.btn_logout': '🚪 Đăng Xuất',
    'modal.profile.txn_history': '📋 Lịch Sử Giao Dịch Gần Đây',

    'modal.deposit.title': '🪙 Nạp Xu Tài Khoản',
    'modal.withdraw.title': '💳 Rút Xu Về Ngân Hàng',

    // Game Common Actions
    'game.squeeze.on': 'Nặn: BẬT',
    'game.squeeze.off': 'Nặn: TẮT',
    'game.squeeze.guide': '🖐️ Kéo giữ Bát Sứ để nặn hé lộ kết quả!',
    'game.squeeze.quick_open': '⚡ Mở Bát Ngay',
    'game.balance': 'Số Dư:',
    'game.clear_bet': '⤺ Hủy Cược',
    'game.confirm_bet': '✔ Đặt Cược',

    // Xoc Dia Doors
    'door.chan': 'CHẴN',
    'door.le': 'LẺ',
    'door.4do': '4 ĐỎ',
    'door.4trang': '4 TRẮNG',
    'door.3do': '3 ĐỎ 1 TRẮNG',
    'door.3trang': '3 TRẮNG 1 ĐỎ',

    // Tai Xiu Doors
    'door.tai': 'TÀI',
    'door.xiu': 'XỈU',

    // Notifications
    'toast.welcome_back': 'Chào mừng {username} quay trở lại!',
    'toast.register_success': 'Đăng ký thành công! Nhận ngay +50.000 xu tân thủ!',
    'toast.logout_success': 'Đã đăng xuất tài khoản!',
    'toast.login_failed': 'Sai tên đăng nhập hoặc mật khẩu!',
    'toast.fill_required': 'Vui lòng điền đủ thông tin!',
    'toast.password_mismatch': 'Mật khẩu xác nhận không khớp!'
  },
  en: {
    // Brand & Header
    'brand.title': 'Lucky Table',
    'brand.slogan': 'International Casino Portal',
    'nav.home': '🏠 Home',
    'nav.folk': '🎲 Traditional',
    'nav.slots': '🎰 Slots & Jackpots',
    'nav.cards': '🃏 Card Games',
    'nav.friends': '👥 Play with Friends',
    'nav.all_games': '🎮 All Games',
    'nav.login': '🔑 Sign In',
    'nav.register': '✨ Sign Up',
    'nav.deposit': '+ Deposit',
    'nav.withdraw': '💳 Withdraw',
    'nav.vip': 'VIP',

    // Dropdown Items
    'game.taixiu.title': '🎲 Dragon Sic Bo 3D',
    'game.xocdia.title': '🥢 Royal Xoc Dia 3D',
    'game.baucua.title': '🦀 Fish Prawn Crab 3D',
    'game.slots.west': '🎰 Journey to the West Slots',
    'game.slots.fish': '🐟 God of Wealth Fishing 3D',
    'game.cards.bacay': '🃏 Royal 3 Cards VIP',
    'tag.hot': 'HOT',
    'tag.new': 'NEW',
    'tag.jackpot': 'JACKPOT',

    // Hero Section
    'hero.badge': 'ELITE CASINO LOUNGE',
    'hero.title': 'ASIAN ROYAL GAMING ARENA',
    'hero.desc': 'Experience high-stakes Dragon Sic Bo and Royal Xoc Dia featuring interactive 360° 3D Cup Squeezing with guaranteed fairness.',
    'hero.btn_play_taixiu': '🎲 Play Sic Bo 3D',
    'hero.btn_play_xocdia': '🥢 Play Xoc Dia 3D',

    // Categories
    'category.all': 'All',
    'category.folk': '🎲 Traditional',
    'category.slots': '🎰 Slots',
    'category.cards': '🃏 Card Games',

    // Game Cards
    'card.status.live': '🟢 LIVE NOW',
    'card.status.soon': 'Coming Soon',
    'card.btn_play': 'PLAY NOW ➔',
    'card.players': 'players',

    // Modals
    'modal.login.title': '🔑 Account Login',
    'modal.login.username_placeholder': 'Enter username...',
    'modal.login.password_placeholder': 'Enter password...',
    'modal.login.btn_submit': 'Log In Now',
    'modal.login.switch_text': 'Don\'t have an account? Sign up for 50,000 coins',

    'modal.register.title': '✨ Welcome Registration (+50,000 Coins)',
    'modal.register.username_placeholder': 'Username (minimum 3 characters)...',
    'modal.register.password_placeholder': 'Password...',
    'modal.register.confirm_placeholder': 'Confirm password...',
    'modal.register.btn_submit': 'Register & Claim 50,000 Coins',
    'modal.register.switch_text': 'Already have an account? Log In',

    'modal.profile.title': '👤 Player Profile',
    'modal.profile.balance_label': 'Balance:',
    'modal.profile.display_name': 'Display Name:',
    'modal.profile.btn_rename': 'Save Name',
    'modal.profile.btn_logout': '🚪 Log Out',
    'modal.profile.txn_history': '📋 Recent Transaction History',

    'modal.deposit.title': '🪙 Deposit Coins',
    'modal.withdraw.title': '💳 Withdraw to Bank',

    // Game Common Actions
    'game.squeeze.on': 'Squeeze: ON',
    'game.squeeze.off': 'Squeeze: OFF',
    'game.squeeze.guide': '🖐️ Drag and hold cup to squeeze and reveal result!',
    'game.squeeze.quick_open': '⚡ Reveal Now',
    'game.balance': 'Balance:',
    'game.clear_bet': '⤺ Clear Bet',
    'game.confirm_bet': '✔ Place Bet',

    // Xoc Dia Doors
    'door.chan': 'EVEN',
    'door.le': 'ODD',
    'door.4do': '4 RED',
    'door.4trang': '4 WHITE',
    'door.3do': '3 RED 1 WHITE',
    'door.3trang': '3 WHITE 1 RED',

    // Tai Xiu Doors
    'door.tai': 'BIG',
    'door.xiu': 'SMALL',

    // Notifications
    'toast.welcome_back': 'Welcome back, {username}!',
    'toast.register_success': 'Registration successful! +50,000 welcome coins added!',
    'toast.logout_success': 'Successfully logged out!',
    'toast.login_failed': 'Invalid username or password!',
    'toast.fill_required': 'Please complete all fields!',
    'toast.password_mismatch': 'Passwords do not match!'
  }
};

class I18nManager {
  constructor() {
    this.currentLang = localStorage.getItem(I18N_STORAGE_KEY) || 'vi';
  }

  getLang() {
    return this.currentLang;
  }

  setLang(lang) {
    if (lang !== 'vi' && lang !== 'en') lang = 'vi';
    this.currentLang = lang;
    localStorage.setItem(I18N_STORAGE_KEY, lang);
    this.applyToDOM();

    // Notify other components
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
  }

  toggle() {
    const nextLang = this.currentLang === 'vi' ? 'en' : 'vi';
    this.setLang(nextLang);
    return nextLang;
  }

  t(key, params = {}) {
    const dict = translations[this.currentLang] || translations.vi;
    let str = dict[key] || translations.vi[key] || key;

    for (const [k, v] of Object.entries(params)) {
      str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
    }
    return str;
  }

  applyToDOM() {
    // 1. Text elements with data-i18n
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (key) {
        el.textContent = this.t(key);
      }
    });

    // 2. Placeholder elements with data-i18n-placeholder
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (key) {
        el.setAttribute('placeholder', this.t(key));
      }
    });

    // 3. Update language switcher labels
    document.querySelectorAll('.lang-switcher-text').forEach(el => {
      el.textContent = this.currentLang.toUpperCase();
    });
    document.querySelectorAll('.lang-switcher-flag').forEach(el => {
      el.textContent = this.currentLang === 'vi' ? '🇻🇳' : '🇬🇧';
    });

    // Update html lang attribute
    document.documentElement.setAttribute('lang', this.currentLang);
  }

  init() {
    this.applyToDOM();

    // Bind all language switcher toggle buttons
    document.querySelectorAll('.btn-lang-toggle').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.toggle();
      });
    });
  }
}

// Global instance
const i18n = new I18nManager();
if (typeof window !== 'undefined') {
  window.i18n = i18n;
  document.addEventListener('DOMContentLoaded', () => i18n.init());
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { i18n, translations };
}
