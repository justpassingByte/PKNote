# VPS Production Cheatsheet

Tài liệu này tổng hợp các câu lệnh (commands) và cấu hình bắt buộc khi Deploy ứng dụng lên Server (VPS Linux).

---

## 1. Cập Nhật & Build Lại Hệ Thống (Mỗi Lần Đẩy Code)

Khi code mới được sửa ở Local (Dev) và Push lên Github, chạy bộ lệnh sau trên Thư mục gốc của VPS:

```bash
# B1. Lấy code mới nhất trên nhánh main
git pull origin main

# B2. Khởi động và Build lại TẤT CẢ các Container (Node + Frontend + MySQL)
docker-compose up -d --build

# B3. Nếu OCR Service đang chạy riêng ở thư mục khác:
cd backend/ocr-service
docker-compose up -d --build
```

---

## 2. Quản Lý Cơ Sở Dữ Liệu (Prisma)

Sau khi thêm bảng hoặc trường mới (ví dụ trường `language`), bạn bắt buộc phải đồng bộ tới DB thực tế:

```bash
# Push thay đổi cấu trúc DB vào MySQL nhưng BẢO TOÀN DỮ LIỆU CŨ:
docker exec -it notes_backend npx prisma db push

# Generate lại Prisma Client phòng khi code Node không đọc được Model mới:
docker exec -it notes_backend npx prisma generate
```

---

## 3. Xem Log Máy Chủ (Debug Trực Tiếp)

Để biết vì sao 1 Request đang lỗi `500` hoặc tải quá lâu:

```bash
# Xem log Backend Node.js
docker logs notes_backend -f

# Xem luồng nhận diện bằng AI của Python
docker logs ocr_api -f

# Xem 100 dòng log gần nhất rồi thoát
docker logs notes_backend --tail 100
```

---

## 4. Bảo Trì & Reset Lỗi Lặt Vặt

Sẽ có lúc Container bị treo bộ nhớ, đây là lệnh bạn cần:

```bash
# Khởi động lại riêng rẽ 1 thằng cứng đầu:
docker restart notes_backend

# Dọn Rác Máy Chủ (Chạy hàng tháng khi nén Docker nhiều lần gây đầy ổ cứng)
docker system prune -f
docker image prune -a -f
```

---

## 5. Cấu Hình Tên Miền (Domain) & Cloudflare Ảo Hoá

**Cloudflare có miễn phí không?** 
👉 **Có, 100% MIỄN PHÍ** cho gói cơ bản. Nó cung cấp Chứng chỉ bảo mật SSL (HTTPS ổ khóa xanh), chống DDoS và ẩn IP thực của VPS cực kỳ xịn. Hầu như mọi VPS trên thế giới đều dùng gói Free này.

### Các Bước Cấu Hình Tên Miền qua Cloudflare:

1. **Đăng ký Cloudflare:**
   - Đăng nhập [Cloudflare.com](https://dash.cloudflare.com/), chọn **Add Site** và nhập tên miền của bạn (ví dụ `ponotes.com`).
   - Chọn gói **Free ($0)** phía dưới cùng.
   - Cloudflare sẽ cấp cho bạn 2 cái **Nameservers** (ví dụ: `alan.ns.cloudflare.com`). Quay lại trang bạn mua tên miền (Hostinger, Godaddy, Tenten...) dán 2 cái này vào phần "Quản lý Nameserver".

2. **Trỏ IP về VPS (Phần DNS trên Cloudflare):**
   - Vào mục **DNS** trên bảng điều khiển Cloudflare.
   - Thêm bản ghi số 1 (Để chạy Frontend NextJS):
     - **Type**: `A`
     - **Name**: `@` (hoặc tên miền chính)
     - **IPv4 address**: `161.248.146.117` (IP VPS của bạn)
     - **Proxy status**: Bật Đám mây màu Cam ☁️ (Bắt buộc để có HTTPS Ổ khóa xanh).
   - Thêm bản ghi số 2 (Để chạy API Backend):
     - **Type**: `A`
     - **Name**: `api` (Tương đương `api.ponotes.com`)
     - **IPv4 address**: `161.248.146.117`
     - **Proxy status**: Bật màu Cam ☁️.

3. **Bật chế độ HTTPS (Bảo mật SSL):**
   - Vào thẻ **SSL/TLS** (hình cái khiên gạch chéo) bên thanh menu Cloudflare.
   - Cài đặt chế độ mã hóa sang **Flexible**. *(Với chế độ này, Cloudflare ép người dùng phải xài HTTPS bảo mật, nhưng đoạn nối tắt từ Cloudflare về VPS của bạn vẫn giữ HTTP nội bộ cho nhẹ cấu hình Docker)*.

4. **Sử dụng NGINX trên VPS (Chuyển cửa vào Docker):**
   - Vì tên miền sẽ trỏ thẳng vào IP VPS ở cổng mạng chuẩn (Port 80/443), bạn cần cài 1 phần mềm Gác Cổng (Reverse Proxy) tên là **Nginx** trên VPS để điều phối:
     - Khách vào `ponotes.com` 👉 Nginx vứt vào Docker Frontend Port `3000`.
     - Khách vào `api.ponotes.com` 👉 Nginx vứt vào Docker Backend Port `5000`.
