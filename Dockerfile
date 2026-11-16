# ==============================================================================
# Dockerfile - Lucky Table Casino Portal & Multiplayer Realtime Server
# Nền tảng Node.js Alpine tối ưu nhẹ (~150MB), bảo mật và hiệu năng cao
# ==============================================================================

FROM node:20-alpine AS production

# Thiết lập thư mục làm việc
WORKDIR /app

# Khai báo biến môi trường chuẩn
ENV NODE_ENV=production \
    PORT=8080

# Cài đặt các gói phụ trợ cơ bản (nếu cần kiểm tra sức khỏe mạng)
RUN apk add --no-cache tzdata curl wget

# Thiết lập múi giờ Việt Nam (UTC+7)
ENV TZ=Asia/Ho_Chi_Minh

# Sao chép file mô tả thư viện để tận dụng Docker Cache layer
COPY package*.json ./

# Cài đặt thư viện production sạch (không kèm devDependencies)
RUN npm install --omit=dev && npm cache clean --force

# Sao chép toàn bộ mã nguồn backend, frontend và dữ liệu ban đầu
COPY server.js ./
COPY src/ ./src/
COPY public/ ./public/
COPY data/ ./data/

# Đảm bảo thư mục lưu trữ cơ sở dữ liệu SQLite tồn tại
RUN mkdir -p /app/data

# Khai báo volume để lưu trữ dữ liệu SQLite bền vững ra host
VOLUME ["/app/data"]

# Mở cổng kết nối HTTP & WebSocket
EXPOSE 8080

# Kiểm tra tình trạng sức khỏe định kỳ của Container
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/health || exit 1

# Khởi chạy máy chủ
CMD ["node", "server.js"]
