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
    'nav.admin_dashboard': '⚡ Quản Trị Viên',

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

    // Game Cards Descriptions
    'game.taixiu.desc': 'Cổng Tài Xỉu Bát Rồng 3D phong cách Á Đông, tính năng Tự Tay Nặn Bát 360° kịch tính, hoàn trả cược sòng phẳng.',
    'game.xocdia.desc': 'Xóc Đĩa 4 quân vị Đỏ Trắng, Bát Sứ truyền thống tự tay nặn mở bát, đa dạng cửa cược Chẵn Lẻ Tứ Tử.',
    'game.baucua.desc': 'Lắc Bầu Cua Tôm Cá 3D xúc xắc chạm khắc tinh xảo, hiệu ứng âm thanh tiếng lắc chân thực.',
    'game.slots.desc': 'Vòng quay may mắn 5 cuộn 25 dòng cược, săn hũ Jackpot nổ tung hàng triệu xu.',
    'game.bacay.desc': 'Bàn bài nỉ xanh sang trọng, chia 3 lá bay 3D, tính năng NẶN BÀI cực phê, cược Gà nhân 3 tiền thưởng!',
    'game.fish.desc': 'Săn rồng vàng đại dương, súng laser đạn nổ, thu hoạch ngọc báu ngập màn hình.',

    // Game Cards
    'card.status.live': '🟢 ĐANG MỞ',
    'card.status.soon': 'Sắp Khởi Chạy',
    'card.btn_play': 'CHƠI NGAY ➔',
    'card.players': 'người chơi',

    // Home News & Footer
    'home.news.title': 'Tin Tức & Sự Kiện Hệ Thống',
    'home.footer.desc': '© 2026 LUCKY TABLE CASINO ENTERTAINMENT. Game mô phỏng giải trí sử dụng xu ảo. Không hỗ trợ nạp/rút tiền thật.',
    'home.footer.sub': 'Hệ thống phát triển bằng Node.js Express & Realtime Socket.io.',

    // Modals Auth & Profile
    'modal.login.title': '🔑 Đăng Nhập Tài Khoản',
    'modal.login.sub': 'Đăng nhập để lưu số dư xu và đồng bộ bàn chơi',
    'modal.login.user_label': 'Tên tài khoản:',
    'modal.login.pass_label': 'Mật khẩu:',
    'modal.login.username_placeholder': 'Nhập tên tài khoản...',
    'modal.login.password_placeholder': 'Nhập mật khẩu...',
    'modal.login.btn_submit': '🚀 ĐĂNG NHẬP NGAY',
    'modal.login.switch_text': 'Chưa có tài khoản? Đăng ký ngay (+50K xu)',

    'modal.register.title': '✨ Đăng Ký Tân Thủ (+50.000 Xu)',
    'modal.register.sub': 'Tặng ngay 50.000 xu may mắn vào tài khoản!',
    'modal.register.user_label': 'Tên tài khoản:',
    'modal.register.pass_label': 'Mật khẩu:',
    'modal.register.confirm_label': 'Xác nhận mật khẩu:',
    'modal.register.username_placeholder': 'Từ 3 ký tự (VD: DaiGia88)...',
    'modal.register.password_placeholder': 'Nhập mật khẩu...',
    'modal.register.confirm_placeholder': 'Nhập lại mật khẩu...',
    'modal.register.btn_submit': '🎁 TẠO TÀI KHOẢN & NHẬN 50K XU',
    'modal.register.switch_text': 'Đã có tài khoản? Đăng nhập tại đây',

    'modal.profile.title': '👤 Hồ Sơ Người Chơi',
    'modal.profile.balance_label': 'Số dư:',
    'modal.profile.display_name': 'Tên hiển thị:',
    'modal.profile.btn_rename': 'Lưu Đổi Tên',
    'modal.profile.btn_logout': '🚪 Đăng Xuất',
    'modal.profile.txn_history': '📋 Lịch Sử Giao Dịch Gần Đây',

    'modal.deposit.title': '🪙 Nạp Xu May Mắn',
    'modal.deposit.tab_qr': '🏦 Ngân Hàng QR',
    'modal.deposit.tab_momo': '📱 Ví MoMo',
    'modal.deposit.tab_card': '💳 Thẻ Cào',
    'modal.deposit.amount_label': 'Nhập số xu muốn nạp:',
    'modal.deposit.btn_submit': '✓ XÁC NHẬN NẠP XU NGAY',

    'modal.withdraw.title': '💳 Rút Xu Về Tài Khoản',
    'modal.withdraw.bank_label': 'Chọn Ngân hàng nhận:',
    'modal.withdraw.acc_num_label': 'Số tài khoản ngân hàng:',
    'modal.withdraw.acc_name_label': 'Tên chủ tài khoản (viết hoa không dấu):',
    'modal.withdraw.amount_label': 'Số xu muốn rút (Tối thiểu 10.000 xu):',
    'modal.withdraw.btn_submit': '✓ GỬI YÊU CẦU RÚT XU',

    // Admin Dashboard
    'admin.guard.title': 'Xác Thực Quản Trị Viên',
    'admin.guard.desc': 'Vui lòng đăng nhập với tài khoản Admin để truy cập trung tâm điều hành.',
    'admin.guard.user_label': 'Tài khoản Admin:',
    'admin.guard.pass_label': 'Mật khẩu:',
    'admin.guard.pass_placeholder': 'Nhập mật khẩu admin...',
    'admin.guard.btn_unlock': '🔓 Mở Khóa Bảng Điều Khiển',
    'admin.guard.hint': 'Gợi ý:',
    'admin.guard.back_lobby': '🏠 Về Sảnh',

    'admin.nav.back_lobby': '🏠 Về Sảnh',
    'admin.nav.title': 'Trung Tâm Quản Trị',
    'admin.nav.subtitle': 'Hệ Thống Casino Lucky Table • Live Admin',
    'admin.nav.badge': 'Admin: {username}',
    'admin.nav.logout': '🚪 Đăng Xuất',

    'admin.stat.users': 'Tổng Người Dùng',
    'admin.stat.coins': 'Xu Trong Lưu Thông',
    'admin.stat.games': 'Trò Chơi Hoạt Động',
    'admin.stat.txns': 'Lịch Sử Giao Dịch',
    'admin.stat.view': 'Xem ➔',

    'admin.form.title': 'Điều Chỉnh & Bù Xu Người Dùng (Hỗ Trợ Chuyển Khoản)',
    'admin.form.instant_badge': 'Cập Nhật Tức Thì',
    'admin.form.user_label': 'Tài khoản người chơi:',
    'admin.form.user_placeholder': 'Nhập username (vd: Player001, PlayerTest2k1)...',
    'admin.form.action_label': 'Loại thao tác:',
    'admin.form.action_add': '🟢 Cộng Xu (Nạp bù sự cố / Quà tặng VIP)',
    'admin.form.action_deduct': '🔴 Khấu Trừ Xu (Thu hồi sự cố)',
    'admin.form.amount_label': 'Số xu điều chỉnh:',
    'admin.form.amount_placeholder': 'Nhập số xu (vd: 50000, 1000000)...',
    'admin.form.quick_select': 'Chọn nhanh:',
    'admin.form.reason_label': 'Lý do điều chỉnh (sẽ lưu vào lịch sử giao dịch):',
    'admin.form.reason_placeholder': 'Nhập lý do bù xu...',
    'admin.form.btn_submit': '⚡ Thực Hiện Điều Chỉnh Xu',

    'admin.chip.1m': '+1 triệu',
    'admin.chip.10m': '+10 triệu',
    'admin.chip.100m': '+100 triệu',
    'admin.chip.1b': '+1 tỷ',

    'admin.table.title': 'Danh Sách Người Chơi & Số Dư Trực Tiếp',
    'admin.table.count_badge': '{count} Tài khoản',
    'admin.table.search_placeholder': '🔍 Tìm theo username...',
    'admin.table.th_player': 'Người Chơi',
    'admin.table.th_role': 'Vai Trò',
    'admin.table.th_vip': 'Cấp VIP',
    'admin.table.th_balance': 'Số Dư Hiện Tại',
    'admin.table.th_recent_txn': 'Giao Dịch Gần Nhất',
    'admin.table.th_action': 'Thao Tác',
    'admin.table.btn_compensate': '+ Bù Xu',
    'admin.table.no_users': 'Không tìm thấy người chơi nào',
    'admin.table.no_txns': 'Chưa có GD',

    'admin.audit.title': 'Nhật Ký Điều Chỉnh & Bù Xu Gần Đây',
    'admin.audit.th_time': 'Thời Gian',
    'admin.audit.th_recipient': 'Người Nhận',
    'admin.audit.th_action': 'Loại Thao Tác',
    'admin.audit.th_amount': 'Số Xu',
    'admin.audit.th_reason': 'Lý Do / Ghi Chú',
    'admin.audit.th_status': 'Trạng Thái',
    'admin.audit.empty': 'Chưa có giao dịch điều chỉnh nào trong phiên.',
    'admin.audit.action_add': 'CỘNG XU',
    'admin.audit.action_deduct': 'KHẤU TRỪ',
    'admin.audit.status_success': 'Thành công',

    'admin.modal.users.title': '👥 Chi Tiết Danh Sách Người Dùng',
    'admin.modal.users.total': 'Tổng: {count} người',
    'admin.modal.users.admins': '1 Quản Trị Viên',
    'admin.modal.users.players': '{count} Người Chơi',
    'admin.modal.users.th_account': 'Tài Khoản',
    'admin.modal.users.th_role': 'Vai Trò',
    'admin.modal.users.th_vip': 'Cấp VIP',
    'admin.modal.users.th_balance': 'Số Dư Xu',
    'admin.modal.users.th_action': 'Hành Động',

    'admin.modal.coins.title': '🪙 Thống Kê Phân Phối Tiền Tệ (Xu)',
    'admin.modal.coins.reserve': 'Xu Quỹ Dự Trữ / Admin',
    'admin.modal.coins.players': 'Xu Người Chơi Thực Tế',
    'admin.modal.coins.richest_title': '🏆 Bảng Xếp Hạng Đại Gia Giàu Nhất',
    'admin.modal.coins.btn_adjust': '+ Bù xu cho người chơi ➔',
    'admin.modal.coins.no_data': 'Chưa có dữ liệu người chơi',

    'admin.modal.games.title': '🎮 Chi Tiết & Quản Lý Trạng Thái Trò Chơi',
    'admin.modal.games.hint': '💡 Bấm nút trạng thái để bật/tắt trò chơi tức thì',
    'admin.modal.games.playing': '👥 Đang chơi: {count} người',
    'admin.modal.games.active_badge': '🟢 HOẠT ĐỘNG',
    'admin.modal.games.maintenance_badge': '🔴 BẢO TRÌ',

    'admin.modal.txns.title': '📋 Toàn Bộ Lịch Sử Giao Dịch & Biến Động Số Dư',
    'admin.modal.txns.all': 'Tất Cả',
    'admin.modal.txns.deposit': '🟢 Nạp / Bù Xu',
    'admin.modal.txns.withdraw': '🔴 Rút / Khấu Trừ',
    'admin.modal.txns.th_time': 'Thời Gian',
    'admin.modal.txns.th_user': 'Người Chơi',
    'admin.modal.txns.th_type': 'Loại',
    'admin.modal.txns.th_amount': 'Số Tiền',
    'admin.modal.txns.th_desc': 'Nội Dung',
    'admin.modal.txns.th_status': 'Trạng Thái',
    'admin.modal.txns.empty': 'Chưa có giao dịch nào khớp với bộ lọc',
    'admin.modal.txns.badge_deposit': '🟢 NẠP / BÙ',
    'admin.modal.txns.badge_withdraw': '🔴 RÚT TIỀN',
    'admin.modal.txns.status_success': 'Thành công',
    'admin.modal.close': 'Đóng',

    // Game Common Actions & Controls
    'game.back_lobby': '🏠 Sảnh',
    'game.squeeze.on': 'Nặn: BẬT',
    'game.squeeze.off': 'Nặn: TẮT',
    'game.squeeze.guide': '🖐️ Kéo giữ Bát Sứ để nặn hé lộ kết quả!',
    'game.squeeze.quick_open': '⚡ Mở Bát Ngay',
    'game.balance': 'Số Dư:',
    'game.clear_bet': '⤺ Hủy Cược',
    'game.confirm_bet': '✔ Đặt Cược',
    'game.history': 'Lịch Sử Cầu',
    'game.waiting': 'Đang chờ phiên mới...',
    'game.betting': 'Đang mở cược...',
    'game.revealing': 'Đang mở bát...',

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
    'nav.admin_dashboard': '⚡ Admin Center',

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

    // Game Cards Descriptions
    'game.taixiu.desc': 'Asian Royal Dragon Sic Bo featuring interactive 360° 3D Cup Squeezing with guaranteed fairness.',
    'game.xocdia.desc': 'Traditional 4-coin red/white Xoc Dia with interactive porcelain bowl squeezing and multi-door betting.',
    'game.baucua.desc': 'Fish Prawn Crab 3D with authentic porcelain plate shaking and vivid dice physics.',
    'game.slots.desc': 'Lucky 5-reel 25-line slots, hunt massive progressive jackpots and bonus multipliers.',
    'game.bacay.desc': 'Luxury green felt 3 Cards table, 3D card distribution, card squeeze mechanics and pot multipliers!',
    'game.fish.desc': 'Deep-sea gold dragon hunting with explosive laser cannons and treasure rewards.',

    // Game Cards
    'card.status.live': '🟢 LIVE NOW',
    'card.status.soon': 'Coming Soon',
    'card.btn_play': 'PLAY NOW ➔',
    'card.players': 'players',

    // Home News & Footer
    'home.news.title': 'System News & Events',
    'home.footer.desc': '© 2026 LUCKY TABLE CASINO ENTERTAINMENT. Entertainment simulation game using virtual coins. Real-money gambling is not supported.',
    'home.footer.sub': 'Engineered with Node.js Express & Realtime Socket.io.',

    // Modals Auth & Profile
    'modal.login.title': '🔑 Account Login',
    'modal.login.sub': 'Sign in to save coin balances and sync tables',
    'modal.login.user_label': 'Username:',
    'modal.login.pass_label': 'Password:',
    'modal.login.username_placeholder': 'Enter username...',
    'modal.login.password_placeholder': 'Enter password...',
    'modal.login.btn_submit': '🚀 LOG IN NOW',
    'modal.login.switch_text': 'Don\'t have an account? Sign up (+50K coins)',

    'modal.register.title': '✨ Welcome Registration (+50,000 Coins)',
    'modal.register.sub': 'Get 50,000 complimentary coins credited instantly!',
    'modal.register.user_label': 'Username:',
    'modal.register.pass_label': 'Password:',
    'modal.register.confirm_label': 'Confirm Password:',
    'modal.register.username_placeholder': 'Min 3 chars (e.g. LuckyPlayer88)...',
    'modal.register.password_placeholder': 'Enter password...',
    'modal.register.confirm_placeholder': 'Re-enter password...',
    'modal.register.btn_submit': '🎁 CREATE ACCOUNT & GET 50K COINS',
    'modal.register.switch_text': 'Already have an account? Log In here',

    'modal.profile.title': '👤 Player Profile',
    'modal.profile.balance_label': 'Balance:',
    'modal.profile.display_name': 'Display Name:',
    'modal.profile.btn_rename': 'Save Name',
    'modal.profile.btn_logout': '🚪 Log Out',
    'modal.profile.txn_history': '📋 Recent Transaction History',

    'modal.deposit.title': '🪙 Deposit Coins',
    'modal.deposit.tab_qr': '🏦 Bank QR',
    'modal.deposit.tab_momo': '📱 MoMo Wallet',
    'modal.deposit.tab_card': '💳 Scratch Card',
    'modal.deposit.amount_label': 'Enter coin amount to deposit:',
    'modal.deposit.btn_submit': '✓ CONFIRM DEPOSIT NOW',

    'modal.withdraw.title': '💳 Withdraw to Bank Account',
    'modal.withdraw.bank_label': 'Select Receiving Bank:',
    'modal.withdraw.acc_num_label': 'Bank Account Number:',
    'modal.withdraw.acc_name_label': 'Account Holder Name (UPPERCASE):',
    'modal.withdraw.amount_label': 'Withdraw Amount (Min 10,000 coins):',
    'modal.withdraw.btn_submit': '✓ SUBMIT WITHDRAWAL REQUEST',

    // Admin Dashboard
    'admin.guard.title': 'Administrator Authentication',
    'admin.guard.desc': 'Please sign in with an Admin account to access the control center.',
    'admin.guard.user_label': 'Admin Username:',
    'admin.guard.pass_label': 'Password:',
    'admin.guard.pass_placeholder': 'Enter admin password...',
    'admin.guard.btn_unlock': '🔓 Unlock Admin Dashboard',
    'admin.guard.hint': 'Hint:',
    'admin.guard.back_lobby': '🏠 Back to Lobby',

    'admin.nav.back_lobby': '🏠 Lobby',
    'admin.nav.title': 'Admin Control Center',
    'admin.nav.subtitle': 'Lucky Table Casino Management • Live Admin',
    'admin.nav.badge': 'Admin: {username}',
    'admin.nav.logout': '🚪 Log Out',

    'admin.stat.users': 'Total Users',
    'admin.stat.coins': 'Circulating Coins',
    'admin.stat.games': 'Active Games',
    'admin.stat.txns': 'Transaction Logs',
    'admin.stat.view': 'View ➔',

    'admin.form.title': 'Adjust & Compensate User Coins (Bank Transfer Support)',
    'admin.form.instant_badge': 'Instant Update',
    'admin.form.user_label': 'Target Player Account:',
    'admin.form.user_placeholder': 'Enter username (e.g. Player001, PlayerTest2k1)...',
    'admin.form.action_label': 'Action Type:',
    'admin.form.action_add': '🟢 Add Coins (Issue Compensation / VIP Gift)',
    'admin.form.action_deduct': '🔴 Deduct Coins (System Reversal)',
    'admin.form.amount_label': 'Coin Adjustment Amount:',
    'admin.form.amount_placeholder': 'Enter coin amount (e.g. 50000, 1000000)...',
    'admin.form.quick_select': 'Quick Select:',
    'admin.form.reason_label': 'Adjustment Reason (recorded in audit logs):',
    'admin.form.reason_placeholder': 'Enter compensation reason...',
    'admin.form.btn_submit': '⚡ Execute Coin Adjustment',

    'admin.chip.1m': '+1M',
    'admin.chip.10m': '+10M',
    'admin.chip.100m': '+100M',
    'admin.chip.1b': '+1B',

    'admin.table.title': 'Live Player Accounts & Balances',
    'admin.table.count_badge': '{count} Accounts',
    'admin.table.search_placeholder': '🔍 Search by username...',
    'admin.table.th_player': 'Player',
    'admin.table.th_role': 'Role',
    'admin.table.th_vip': 'VIP Tier',
    'admin.table.th_balance': 'Current Balance',
    'admin.table.th_recent_txn': 'Latest Transaction',
    'admin.table.th_action': 'Action',
    'admin.table.btn_compensate': '+ Add Coins',
    'admin.table.no_users': 'No matching player accounts found',
    'admin.table.no_txns': 'No transactions',

    'admin.audit.title': 'Recent Coin Adjustment & Audit Logs',
    'admin.audit.th_time': 'Timestamp',
    'admin.audit.th_recipient': 'Recipient',
    'admin.audit.th_action': 'Action Type',
    'admin.audit.th_amount': 'Coin Amount',
    'admin.audit.th_reason': 'Reason / Note',
    'admin.audit.th_status': 'Status',
    'admin.audit.empty': 'No coin adjustments recorded in this session.',
    'admin.audit.action_add': 'ADD COINS',
    'admin.audit.action_deduct': 'DEDUCT',
    'admin.audit.status_success': 'Success',

    'admin.modal.users.title': '👥 Full Player Account Directory',
    'admin.modal.users.total': 'Total: {count} users',
    'admin.modal.users.admins': '1 Administrator',
    'admin.modal.users.players': '{count} Players',
    'admin.modal.users.th_account': 'Account',
    'admin.modal.users.th_role': 'Role',
    'admin.modal.users.th_vip': 'VIP Tier',
    'admin.modal.users.th_balance': 'Coin Balance',
    'admin.modal.users.th_action': 'Action',

    'admin.modal.coins.title': '🪙 Coin Circulation & Distribution',
    'admin.modal.coins.reserve': 'Admin / Reserve Coins',
    'admin.modal.coins.players': 'Actual Player Coins',
    'admin.modal.coins.richest_title': '🏆 Richest Player Leaderboard',
    'admin.modal.coins.btn_adjust': '+ Compensate Coins ➔',
    'admin.modal.coins.no_data': 'No player data available',

    'admin.modal.games.title': '🎮 Game Operations & Status Control',
    'admin.modal.games.hint': '💡 Click status toggle to activate/deactivate games instantly',
    'admin.modal.games.playing': '👥 Playing: {count} players',
    'admin.modal.games.active_badge': '🟢 ACTIVE',
    'admin.modal.games.maintenance_badge': '🔴 MAINTENANCE',

    'admin.modal.txns.title': '📋 Comprehensive Transaction Logs & Balance Fluctuations',
    'admin.modal.txns.all': 'All',
    'admin.modal.txns.deposit': '🟢 Deposit / Add',
    'admin.modal.txns.withdraw': '🔴 Withdraw / Deduct',
    'admin.modal.txns.th_time': 'Time',
    'admin.modal.txns.th_user': 'Player',
    'admin.modal.txns.th_type': 'Type',
    'admin.modal.txns.th_amount': 'Amount',
    'admin.modal.txns.th_desc': 'Description',
    'admin.modal.txns.th_status': 'Status',
    'admin.modal.txns.empty': 'No transactions match current filter',
    'admin.modal.txns.badge_deposit': '🟢 DEPOSIT',
    'admin.modal.txns.badge_withdraw': '🔴 WITHDRAW',
    'admin.modal.txns.status_success': 'Success',
    'admin.modal.close': 'Close',

    // Game Common Actions & Controls
    'game.back_lobby': '🏠 Lobby',
    'game.squeeze.on': 'Squeeze: ON',
    'game.squeeze.off': 'Squeeze: OFF',
    'game.squeeze.guide': '🖐️ Drag and hold cup to squeeze and reveal result!',
    'game.squeeze.quick_open': '⚡ Reveal Now',
    'game.balance': 'Balance:',
    'game.clear_bet': '⤺ Clear Bet',
    'game.confirm_bet': '✔ Place Bet',
    'game.history': 'Roadmap History',
    'game.waiting': 'Waiting for next round...',
    'game.betting': 'Betting Open...',
    'game.revealing': 'Revealing results...',

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
    let str = dict[key] || (translations.vi ? translations.vi[key] : key) || key;

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

    // 2. HTML elements with data-i18n-html
    document.querySelectorAll('[data-i18n-html]').forEach(el => {
      const key = el.getAttribute('data-i18n-html');
      if (key) {
        el.innerHTML = this.t(key);
      }
    });

    // 3. Placeholder elements with data-i18n-placeholder
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (key) {
        el.setAttribute('placeholder', this.t(key));
      }
    });

    // 4. Title elements with data-i18n-title
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      if (key) {
        el.setAttribute('title', this.t(key));
      }
    });

    // 5. Update language switcher labels
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
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => i18n.init());
  } else {
    i18n.init();
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { i18n, translations };
}
