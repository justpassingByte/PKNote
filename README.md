# 🎭 VillainVault

> **Elite AI Poker Analysis & Opponent Database**
> "Két sắt và Bộ não AI đắc lực cho tay chơi Poker chuyên nghiệp."

VillainVault là hệ sinh thái công nghệ toàn diện dành cho Player Poker chuyên nghiệp. Nó không chỉ là một ứng dụng ghi chép (Notes) mà là sự kết hợp cực đoan giữa **Machine Learning (AI)**, **Lý thuyết trò chơi (GTO)**, và **Kiến trúc bảo mật Stealth (Anti-Detect)**. Mục tiêu duy nhất: Tối đa hóa Win-rate và khai thác triệt để đối thủ trên bàn.

---

## 🚀 Tính Năng Cốt Lõi (Core Features)

### 1. 🛡 GTO Oracle - Cố Vấn Tối Ưu Hóa Game Theory (RLHF Engine)
Chấm dứt việc phải đọc những ma trận solver nhàm chán. Hỏi bất kỳ tình huống poker nào bằng ngôn ngữ tự nhiên, hệ thống sẽ trả về chiến thuật tối ưu ngay lập tức.
- **NLP To Solver Parameters:** Tự động phiên dịch ngôn ngữ của con người (ví dụ: *"Board As 7d 2c, tôi bắt cbet 33% ở Turn"*) thành truy vấn cơ sở dữ liệu chuyên sâu.
- **Hệ Sinh Thái Dữ Liệu Khổng Lồ:** Đang lưu trữ và tham chiếu dựa trên hàng trăm ngàn node dữ liệu GTO đã được Solve từ TexasSolver (chủ yếu tập trung ở SRP).
- **Phân Tích Cặn Kẽ (Matrix Breakdown):** Vẽ biểu đồ tỷ lệ theo Range (C-bet %, Check %, Mật độ Size bé/Size to). Hệ thống cũng phân tích cụ thể chi tiết đến từng loại bài (Top Pair, Set, Air, Flush Draw).
- **Hệ Thống Học Tăng Cường (RLHF Feedback Loop):** Ghi nhận trực tiếp dữ liệu huấn luyện qua cảm ứng (Thumbs Up / Thumbs Down & Lý do chê bai) từ user để liên tục cải tiến `VillainVault-Poker-LLM`. Mọi query raw JSON đều được auto-log vào DB!

### 2. 🕵️ Stealth Multi-Table HUD (RobinHUD Desktop)
Phần mềm đi kèm dành cho hệ điều hành Windows dùng để quét bàn trực tiếp mà chống lại triệt để các rủi ro bị khóa nick.
- **OCR Đỉnh Cao (Mắt Thần):** Phiên bản OCR nội bộ tích hợp C++ `Paddle.Runtime` bắt chuẩn xác Player Name bất kể nền tảng (cập nhật mới nhất 30 ký tự cho Name).
- **100% Anti-Cheat Compliant:** Hoàn toàn chạy bề nổi (Overlay System) mà không can thiệp, không tiêm mã độc (No DLL Injection) vào memory của Poker Client. Khả năng ghim (Attach) vào bất kỳ Slot cửa sổ nào trên Desktop nhanh chóng.

### 3. 🧠 Smart Hand Analyzer
Gửi một bức ảnh, hoặc vứt Hand History thô vào, để siêu AI mổ xẻ tâm lý học đối thủ.
- Tự động tách Hand thành từng Street (Preflop, Flop, Turn, River).
- Phát hiện trực tiếp Lỗ hổng (Leaks) của đối thủ. Trình bày dưới dạng "Những gì họ làm sai so với GTO" và đưa ra cẩm nang "Cách khai thác (Exploit) họ lần tới".

### 4. 📂 Opponent Profiling (Hồ sơ Đối Thủ)
Theo thời gian thực, toàn bộ Hand mà bạn thu thập qua RobinHUD sẽ được gửi tập trung về Server để gộp thành Hồ Sơ.
- **Tự Định Danh Phân Lớp:** Từ VPIP/PFR, AI quy chuẩn Villain về các Archetype điển hình như: Fish (Cá), Nit (Siêu chặt), Maniac (Điên cuồng), hay Reg (Người chơi cứng).

### 5. 🌐 Hệ Thống Giao Diện Web App Hạng Thương Gia
Được xây dựng trên nền tảng Next.js mạnh mẽ:
- **Ngôn Ngữ Thiết Kế Cyber-Security / Hacker:** Sử dụng dải màu Dark Mode (Đen viền xanh/vàng/đỏ Neon), Glassmorphism, đổ bóng âm (Inner Shadow), và các animation nhấp nháy tạo xúc cảm "đang điều hành trung tâm trạm không gian".
- **i18n Translation:** Dịch thuật động hai chiều Tiếng Anh ↔ Tiếng Việt ở tất cả mọi góc của UI.

### 6. 💼 Admin Central - Tổng Hành Dinh Backend
Khu vực dành riêng cho người điều hành hệ thống (Superuser) với hàng rào quyền tối thượng.
- **Server Health Pulse:** Widget báo cáo Real-time trạng thái chạy ngầm (Node-Cron).
- **Auto-Sync Vault:** Tự động tạo bản Dump Database đầy đủ mỗi Chủ Nhật (02:00 AM) và đẩy file Backup thẳng vào Email cá nhân.
- **Disaster Recovery UI:** Khu vực tối mật cho phép cưỡng chế Rollback cơ sở dữ liệu (`psql` upload `.sql / .gz`) bằng một click, thiết kế UI báo động (Red-Warning Themed).

---

## 💻 Tech Stack Hiện Tại

- **Web Frontend:** `Next.js 14` (App Router), `Tailwind CSS v4`, `Lucide Icons`.
- **Backend API:** `Node.js`, `Express.ts`, phân tầng kiến trúc BaseController chuyên nghiệp.
- **Database & State:** `PostgreSQL` (Core DB), `Prisma` (ORM), File-based Settings Sync `settings.json`.
- **Desktop Application:** `C# .NET WPF`, `PaddleOCR`.
- **AI Integration:** `Groq API` (Llama 3 Models / Mixtral for NLP), `LangChain` Context Prompting.
- **Pipeline GTO:** Python orchestration scripts (`batch_solve.py`) kết nối với Engine C++ `TexasSolver`.

## 🛠 Roadmap Tương Lai
1. Bổ sung các Spot Data GTO liên quan tới **3-Bet Pot**.
2. Triển khai phân tích dữ liệu lịch sử GTOQueryLog để Fine-tune LLM cho tốc độ phản hồi tính bằng ms thay vì chờ API ngoài.
3. Ra mắt chức năng **Trending Spot Widgets** cho phép cộng đồng xem được các "Tình huống Poker khó nhất trong ngày".

---

*"Dữ liệu và kỷ luật sẽ luôn đánh bại rủi ro."* 
**Welcome to the VillainVault.**
# PoNotes - Local Docker Deployment

This guide explains how to build and run the PoNotes application (both backend and frontend) locally using Docker Desktop.

## Prerequisites

0.  \*\*Git 1.  **Docker Desktop:** Node.js:\*\* Ensure you have Git installed to clone the repo, and Node.js for local development if needed.\n1.  \*\*Docker Desktop:\*\* Ensure you have Docker Desktop installed and running on your machine.
2.  **Environment Variables:** Create a `.env` file in the root directory. You can copy the provided `.env.example` file:
    ```bash
    git clone https://github.com/your-username/PoNotes.git\n    cd PoNotes\n    cp .env.example .env
    ```
    *Note: The `.env.example` is configured to work out-of-the-box for local Docker deployments. Fill in any external API keys (Groq, Resend, NowPayments, etc.) if you need those features.*

## Building and Running the Application

To build the images and start all services, open a terminal in the root directory (where the `docker-compose.yml` file is located) and run:

```bash
docker-compose up --build -d
```

This command will:
1.  Build the backend Node.js API image.
2.  Build the frontend Next.js standalone image.
3.  Build the Python OCR API and Worker images.
4.  Start all services including Postgres, Redis, and an Nginx reverse proxy.
5.  Run them in detached mode (`-d`), so they run in the background.

## Accessing the Application

Once the containers are up and running, you can access the application through the Nginx reverse proxy, which binds to port 80:

*   **Frontend UI:** [http://localhost](http://localhost)
*   **Backend API:** [http://localhost/api](http://localhost/api) (e.g., [http://localhost/health](http://localhost/health))

## Managing the Services

*   **View Logs:**
    To see the logs for all services:
    ```bash
    docker-compose logs -f
    ```
    To see logs for a specific service (e.g., the backend):
    ```bash
    docker-compose logs -f backend
    ```

*   **Stop the Services:**
    To stop the running containers without removing them:
    ```bash
    docker-compose stop
    ```

*   **Tear Down the Environment:**
    To stop and remove all containers, networks, and volumes created by `docker-compose up`:
    ```bash
    docker-compose down
    ```
    *Warning: This will not remove the named volumes (like the database volume `pgdata`) by default. To remove volumes as well, add the `-v` flag: `docker-compose down -v`.*

## Database Migrations

The backend container is configured to automatically run Prisma migrations on startup (`npx prisma migrate deploy` via `backend/start.sh`). If you need to manually interact with the database, you can execute commands inside the backend container:

```bash
docker exec -it notes_backend sh
# Inside the container:
npx prisma studio
```
