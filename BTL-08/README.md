# STAYFLOW – NỀN TẢNG ĐIỀU PHỐI DỊCH VỤ TRONG THỜI GIAN LƯU TRÚ (BTL-08)

> **Học phần:** PHÁT TRIỂN ỨNG DỤNG WEB CƠ BẢN – CSE122  
> **Nhóm thực hiện:** Nhóm 08 (3 sinh viên)  
> **Công nghệ:** HTML5, CSS3 (Modern Responsive Flexbox/Grid), JavaScript ES6+, LocalStorage Engine.  
> **Phạm vi giao diện:** 19 màn hình hoàn chỉnh bao phủ toàn bộ 4 vai trò và cổng điều phối trung tâm.

---

## 🚀 HƯỚNG DẪN CHẠY DỰ ÁN TRÊN TRÌNH DUYỆT

Dự án được xây dựng hoàn toàn bằng **HTML/CSS/JS thuần**, không yêu cầu cài đặt `Node.js`, máy chủ phức tạp hay thư viện ngoài:

1. **Cách 1 (Nhanh nhất):** Nhấp đúp chuột trực tiếp vào tệp `index.html` trong thư mục gốc dự án để mở bằng bất kỳ trình duyệt nào (Google Chrome, Microsoft Edge, Firefox, Safari).
2. **Cách 2 (Khuyến nghị cho nhà phát triển):** Mở thư mục `D:\Phat_trien_web\BTL-08` trong VS Code và khởi chạy với tiện ích **Live Server** (cổng mặc định `http://127.0.0.1:5500/index.html`).

---

## 🎬 KỊCH BẢN TRÌNH CHIẾU KHÁCH HÀNG (DEMO MATRIX)

Trên mọi trang của hệ thống luôn có thanh **StayFlow Demo Matrix (Demo Bar)** ghim nổi ở đỉnh trang, cho phép bạn chuyển đổi vai trò ngay tức thì trong 1 cú nhấp chuột:

- **Bước 1 (Hub):** Mở `index.html` để giới thiệu tổng quan hệ thống và bấm nút **"Reset Dữ Liệu Demo"**.
- **Bước 2 (Khách hàng):** Bấm **[🛎️ Khách Phòng 502]** -> Tạo yêu cầu sự cố điều hòa rò rỉ nước -> **AI-1 Request Classifier** tự động phân loại sang bộ phận Kỹ thuật và gán SLA 20 phút.
- **Bước 3 (Theo dõi):** Xem màn hình `guest-my-requests.html` thấy trạng thái **"Đang chờ tiếp nhận"** trên Live Timeline.
- **Bước 4 (Quản lý):** Bấm **[👔 Quản Lý Điều Phối]** -> Thấy yêu cầu mới nảy lên -> **AI-2 Priority Assistant** đánh giá nguy cơ hư hại tài sản và đề xuất gán cho nhân viên kỹ thuật Hoàng -> Bấm xác nhận phân công.
- **Bước 5 (Nhân viên):** Bấm **[🧹 Nhân Viên Vận Hành]** -> Thấy task trên Kanban -> Mở chi tiết, tích checklist SOP, giả lập chụp ảnh hoàn tất -> Bấm xác nhận hoàn thành.
- **Bước 6 (Khách nghiệm thu):** Bấm quay lại **[🛎️ Khách Phòng 502]** -> Màn hình đã cập nhật "Đã hoàn thành" -> Mở form đánh giá, chấm 5 sao kèm lời khen.
- **Bước 7 (Báo cáo AI & Quản trị):** Mở `manager-service-report.html` để thấy **AI-3 Feedback Summarizer** đã tổng hợp đánh giá vào báo cáo cảm xúc; mở `admin-service-type-management.html` để trình diễn CRUD cấu hình SLA.

*(Xem chi tiết kịch bản và lời thoại tại: [`docs/client-presentation-roadmap.md`](docs/client-presentation-roadmap.md))*

---

## 📁 CẤU TRÚC THƯ MỤC DỰ ÁN

```text
D:\Phat_trien_web\BTL-08\
├── index.html                               # Cổng Hub trình chiếu & Kịch bản 6 bước
├── login.html                               # Đăng nhập mô phỏng 4 role
├── 404.html                                 # Trang lỗi thân thiện
├── README.md                                # Hướng dẫn chạy và tổng quan dự án
│
├── css/
│   ├── style.css                            # Biến hệ thống, bảng màu Luxury Hospitality
│   ├── components.css                       # Nút, Thẻ, Kanban, Modal, Toast, AI Card, Demo Bar
│   └── responsive.css                       # Tương thích Mobile, Tablet, Desktop
│
├── js/
│   ├── stayflow-db.js                       # Mock Database LocalStorage thời gian thực
│   ├── stayflow-ai.js                       # Logic mô phỏng 3 tính năng AI (NLP, Priority, Summarizer)
│   └── stayflow-ui.js                       # Tiện ích UI (Demo Bar, Toast, Modal)
│
├── pages/
│   ├── guest/                               # VAI TRÒ: KHÁCH LƯU TRÚ
│   │   ├── guest-dashboard.html             # Tổng quan buồng phòng 502 VIP
│   │   ├── guest-service-request.html       # Tạo yêu cầu có tích hợp AI-1 Classifier
│   │   ├── guest-my-requests.html           # Live Timeline theo dõi tiến độ thời gian thực
│   │   ├── guest-service-catalog.html       # Menu dịch vụ & tra cứu chuẩn SLA
│   │   └── guest-feedback.html              # Đánh giá 5 sao & phản hồi chất lượng
│   │
│   ├── manager/                             # VAI TRÒ: QUẢN LÝ KHÁCH SẠN
│   │   ├── manager-dispatch-board.html      # Bảng điều phối Live Matrix tích hợp AI-2 Priority
│   │   ├── manager-sla-monitor.html         # Giám sát SLA thời gian thực & cảnh báo vi phạm
│   │   ├── manager-service-report.html      # Báo cáo chất lượng tích hợp AI-3 Summarizer
│   │   └── manager-staff-performance.html   # Theo dõi tải công việc & hiệu suất nhân sự
│   │
│   ├── staff/                               # VAI TRÒ: NHÂN VIÊN VẬN HÀNH
│   │   ├── staff-task-board.html            # Kanban bảng việc di động (Chờ -> Làm -> Xong)
│   │   ├── staff-task-detail.html           # Checklist quy trình SOP & ảnh minh chứng
│   │   └── staff-shift-view.html            # Thông tin ca trực, đồng nghiệp, KPI cá nhân
│   │
│   └── admin/                               # VAI TRÒ: QUẢN TRỊ VIÊN
│       ├── admin-dashboard.html             # Chỉ số toàn hệ thống & audit log
│       ├── admin-service-type-management.html # CRUD loại dịch vụ & cấu hình SLA
│       ├── admin-user-management.html       # CRUD tài khoản người dùng & phân quyền
│       └── admin-room-management.html       # CRUD buồng phòng & phân hạng VIP
│
└── docs/
    ├── screen-inventory.md                  # Bảng kiểm kê 19 màn hình chuẩn học phần
    ├── client-presentation-roadmap.md       # Lộ trình & kịch bản trình chiếu khách hàng chi tiết
    ├── project-proposal.md                  # Thuyết minh đề tài BTL-08
    └── ai-usage-report.md                   # Báo cáo khai báo sử dụng AI theo biểu mẫu
```

---

## 📹 QUY ĐỊNH MINH CHỨNG OBS CHO TỪNG SINH VIÊN

Theo quy chế học phần CSE122: **Mỗi giao diện thực tế = 1 video OBS có mặt sinh viên**:
- **SV1 (Khách lưu trú + Quản lý phòng):** `SV1-01` đến `SV1-06`
- **SV2 (Nhân viên vận hành + Quản trị dịch vụ/người dùng):** `SV2-01` đến `SV2-06`
- **SV3 (Quản lý khách sạn + Cổng Hub & AI Engine):** `SV3-01` đến `SV3-07`

Mỗi video dài 2–3 phút thể hiện: Bật camera có mặt sinh viên, mở tệp mã nguồn HTML/CSS/JS tương ứng, thực hiện một thao tác chỉnh sửa trực tiếp và chạy thử tương tác trên trình duyệt.
