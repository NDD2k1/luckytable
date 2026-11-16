# 👑 LUCKY TABLE — CASINO & MULTIPLAYER REALTIME PORTAL

Cổng game giải trí trực tuyến thời gian thực chuẩn quốc tế với đồ họa 3D WebGL, hệ thống phòng chơi bạn bè (Multiplayer Friend Rooms), cơ sở dữ liệu SQLite3 bền vững và thuật toán cân bằng cảm xúc Smart Pity Engine.

---

## 🎮 Các Trò Chơi Nổi Bật

1. **🎲 Tài Xỉu 3D — Bát Rồng Vàng**:
   - Bát rồng vàng lắc vật lý 3D, xúc xắc lăn ngẫu nhiên chuẩn mật mã.
   - Chu kỳ ván tự động: 15s đặt cược -> 3s xóc -> 5s công bố kết quả.
   - Tích hợp Smart Pity Engine: Cân bằng All-in 50/50 & hỗ trợ người chơi khi gặp dây đen (thua liên tiếp).
   - Truy cập: `/taixiu`

2. **🦀 Bầu Cua 3D — Hoàng Gia**:
   - Bát đĩa sứ vẽ hoa văn Rồng Vàng cổ điển, hiệu ứng lắc 3D tự động sau 15s.
   - Thao tác kéo rê mở bát tương tác mượt mà và âm thanh gõ xúc xắc chân thực.
   - Truy cập: `/baucua`

3. **🃏 Ba Cây VIP — Đẳng Cấp Thần Bài**:
   - Bộ bài 36 lá chuẩn truyền thống (bỏ 10, J, Q, K).
   - Hiệu ứng chia bài bay vòng tròn từ nọc, tính năng nặn bài (card squeezing) hồi hộp.
   - Luật chơi nâng cao: 10 điểm ăn x3 cược & chọn làm Nhà Cái, 9 điểm ăn x2, 1-8 điểm ăn x1.
   - Truy cập: `/bacay`

4. **👥 Tính Năng Chơi Cùng Bạn Bè (Multiplayer Rooms)**:
   - Tạo phòng riêng (có mật khẩu hoặc công khai), tạo link mời 1-click `?room=CODE`.
   - Danh sách bạn bè cùng bàn, chat & biểu cảm nhanh, đồng bộ cược thời gian thực qua WebSocket.

---

## 🚀 Khởi Chạy Nhanh (Quick Start)

### Yêu cầu
- Node.js >= 18.x (khuyến nghị v20.x)
- npm >= 9.x

### Cách 1: Khởi Chạy Bằng Docker (Khuyến nghị - Siêu nhanh & Độc lập)
```bash
# Khởi động container nền (đã tích hợp sẵn SQLite persistence)
docker compose up -d

# Xem log hoạt động:
docker compose logs -f

# Dừng container:
docker compose down
```

### Cách 2: Khởi Chạy Trực Tiếp Bằng Node.js
```bash
# 1. Cài đặt dependencies
npm install

# 2. Chạy server phát triển (tự động reload khi sửa code)
npm run dev

# Hoặc chạy thông thường:
npm start
```

Mở trình duyệt truy cập: **`http://localhost:8080/`**

---

## 🗄️ Cơ Sở Dữ Liệu SQLite
Hệ thống sử dụng **SQLite3** thông qua file nhị phân bền vững tại:
- `data/game_db.sqlite`
- Tự động tạo và quản lý các bảng: `users`, `rounds`, `rooms`, `room_players`, `room_messages`, `config`.

---

## 📖 Hướng Dẫn Chi Tiết Dành Cho Lập Trình Viên

Mọi thông tin chi tiết về kiến trúc mã nguồn, cấu trúc thư mục, quy trình thêm game mới, tài liệu REST API và Socket.io events được trình bày đầy đủ tại:

👉 **[Đọc Hướng Dẫn Phát Triển Chi Tiết (DEVELOPMENT_GUIDE.md)](DEVELOPMENT_GUIDE.md)**

---

*Phát triển bởi đội ngũ Lucky Table Gaming.*
