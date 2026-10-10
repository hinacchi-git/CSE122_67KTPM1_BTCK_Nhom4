# KẾ HOẠCH PHÂN CÔNG CÔNG VIỆC NHÓM 3 SINH VIÊN (TEAM ASSIGNMENT)

> **Học phần:** PHÁT TRIỂN ỨNG DỤNG WEB CƠ BẢN – CSE122  
> **Đề tài:** BTL-08 – StayFlow – Điều phối dịch vụ trong thời gian lưu trú khách sạn  
> **Quy mô dự án:** 19 màn hình hoàn chỉnh, 4 vai trò nghiệp vụ, 3 tính năng AI, LocalStorage Real-time Sync.  
> **Nhóm thực hiện:** Nhóm 08 (03 thành viên)

---

## 1. NGUYÊN TẮC PHÂN CÔNG BẮT BUỘC (QUY CHẾ HỌC PHẦN)

1. **Lát cắt dọc bắt buộc (Vertical Slicing):**
   - Tuyệt đối **không** chia việc theo kiểu "người chỉ viết HTML, người chỉ viết CSS, người chỉ làm slide/Figma".
   - Mỗi sinh viên **tự chịu trách nhiệm toàn bộ vòng đời** cho các màn hình mình phụ trách:
     ```text
     Figma / Mockup → HTML ngữ nghĩa → CSS hoàn chỉnh → JavaScript DOM/Form → Tích hợp LocalStorage → Responsive Mobile/Desktop → Nhánh Git riêng → Pull Request → Quay Video OBS có mặt sinh viên.
     ```
2. **Trách nhiệm chéo xuyên suốt (Cross-cutting Concerns):**
   - Ngoài các màn hình theo role, mỗi thành viên phải gánh vác 1 trọng trách hệ thống chung để đảm bảo tính nhất quán, tránh việc ghép 3 "website con" rời rạc.
3. **Đánh giá chéo (Peer Review):**
   - Mọi Pull Request (PR) phải có ít nhất 1 thành viên khác trong nhóm review, kiểm tra chất lượng trước khi merge vào nhánh `dev`.
4. **Minh chứng OBS độc lập:**
   - Mỗi màn hình = 1 video OBS (2–3 phút) có mặt sinh viên thực hiện, giải thích mã nguồn và chạy thử tương tác.

---

## 2. BẢNG PHÂN CHIA TRÁCH NHIỆM TỔNG QUAN

| Thành viên | Vai trò nghiệp vụ chính | Trách nhiệm hệ thống xuyên suốt | Số màn hình | Danh sách video OBS |
|---|---|---|:---:|---|
| **Sinh viên 1 (SV1)** | **Khách Lưu Trú (Guest)** + Quản lý phòng | **Design System & CSS Responsive Framework** (`style.css`, `components.css`, `responsive.css`) | **6** | `SV1-01` → `SV1-06` |
| **Sinh viên 2 (SV2)** | **Nhân Viên Vận Hành (Staff)** + Quản trị Dịch vụ & User | **Cơ Sở Dữ Liệu Mock & State Sync** (`stayflow-db.js`, Validation biểu mẫu, CRUD Engine) | **6** | `SV2-01` → `SV2-06` |
| **Sinh viên 3 (SV3)** *(Nhóm trưởng)* | **Quản Lý Khách Sạn (Manager)** + Cổng Hub & Admin Dashboard | **AI Intelligence Engine & Điều Phối UI** (`stayflow-ai.js`, `stayflow-ui.js`, Tích hợp & Phát hành) | **7** | `SV3-01` → `SV3-07` |

---

## 3. PHÂN CÔNG CHI TIẾT TỪNG SINH VIÊN

### 👤 SINH VIÊN 1 (SV1) – KỸ SƯ FRONTEND KHÁCH HÀNG & HỆ THỐNG GIAO DIỆN
- **Chuyên môn chính:** Trải nghiệm Khách lưu trú (Guest In-Stay Experience) & Quản lý buồng phòng.
- **Trách nhiệm chéo:** 
  - Xây dựng bộ quy chuẩn giao diện **Hospitality Luxury Design System** (bảng màu Navy `#0f172a`, Emerald Teal `#0d9488`, Warm Gold `#d97706`).
  - Thiết lập kiến trúc CSS toàn dự án (`css/style.css`, `css/components.css`, `css/responsive.css`).
  - Kiểm thử hiển thị tương thích đa thiết bị (Mobile 375px, Tablet 768px, Desktop 1440px).

#### Danh mục màn hình phụ trách (6 màn hình):
1. **`pages/guest/guest-dashboard.html`** (Mã: `GUEST-01` | Video: `SV1-01-guest-dashboard.mp4`)
   - Bảng điều khiển buồng phòng Suite 502, số đêm lưu trú, dịch vụ 1-chạm, chỉ số phòng.
2. **`pages/guest/guest-service-request.html`** (Mã: `GUEST-02` | Video: `SV1-02-guest-service-request.mp4`)
   - Form gửi yêu cầu dịch vụ phòng, tích hợp tương tác với **AI-1 Request Classifier**.
3. **`pages/guest/guest-my-requests.html`** (Mã: `GUEST-03` | Video: `SV1-03-guest-my-requests.mp4`)
   - Danh sách yêu cầu với **Live Timeline** thời gian thực, bộ lọc trạng thái và chức năng hủy yêu cầu.
4. **`pages/guest/guest-service-catalog.html`** (Mã: `GUEST-04` | Video: `SV1-04-guest-service-catalog.mp4`)
   - Menu danh mục dịch vụ khách sạn có tìm kiếm, phân nhóm và tra cứu chuẩn thời gian SLA.
5. **`pages/guest/guest-feedback.html`** (Mã: `GUEST-05` | Video: `SV1-05-guest-feedback.mp4`)
   - Biểu mẫu chấm điểm 5 sao, chọn thẻ cảm xúc và gửi nhận xét chất lượng phục vụ.
6. **`pages/admin/admin-room-management.html`** (Mã: `ADM-04` | Video: `SV1-06-admin-room-management.mp4`)
   - Bảng quản lý phòng khách sạn, cập nhật trạng thái buồng (Trống sạch, Đang ở, Bảo trì) và phân hạng VIP.

---

### 👤 SINH VIÊN 2 (SV2) – KỸ SƯ FRONTEND VẬN HÀNH & CƠ SỞ DỮ LIỆU
- **Chuyên môn chính:** Trải nghiệm Nhân viên hiện trường (Staff Ops) & Quản trị danh mục/người dùng.
- **Trách nhiệm chéo:** 
  - Xây dựng lõi cơ sở dữ liệu `stayflow-db.js` lưu trữ và đồng bộ trạng thái qua LocalStorage.
  - Xây dựng cơ chế phát và lắng nghe sự kiện đồng bộ dữ liệu đa màn hình (`stayflow_storage_updated`).
  - Phụ trách kiểm tra hợp lệ dữ liệu (Form Validation) cho các biểu mẫu tạo/sửa.

#### Danh mục màn hình phụ trách (6 màn hình):
1. **`pages/staff/staff-task-board.html`** (Mã: `STAFF-01` | Video: `SV2-01-staff-task-board.mp4`)
   - Bảng việc Kanban 3 cột (Chờ tiếp nhận -> Đang thực hiện -> Đã hoàn tất) tối ưu cho di động.
2. **`pages/staff/staff-task-detail.html`** (Mã: `STAFF-02` | Video: `SV2-02-staff-task-detail.mp4`)
   - Chi tiết nhiệm vụ với quy trình kiểm tra SOP từng bước, giả lập chụp ảnh nghiệm thu và xác nhận hoàn tất.
3. **`pages/staff/staff-shift-view.html`** (Mã: `STAFF-03` | Video: `SV2-03-staff-shift-view.mp4`)
   - Thông tin ca trực, đồng nghiệp cùng ca, bảng KPI cá nhân và sổ ghi chép bàn giao ca.
4. **`pages/admin/admin-service-type-management.html`** (Mã: `ADM-02` | Video: `SV2-04-admin-service-type.mp4`)
   - Quản trị toàn diện CRUD loại dịch vụ, cấu hình số phút cam kết SLA chuẩn và phân bổ bộ phận.
5. **`pages/admin/admin-user-management.html`** (Mã: `ADM-03` | Video: `SV2-05-admin-user-management.mp4`)
   - Quản trị toàn diện CRUD tài khoản người dùng, phân quyền 4 role (Guest, Staff, Manager, Admin).
6. **`404.html`** (Mã: `COMMON-03` | Video: `SV2-06-error-404.mp4`)
   - Giao diện xử lý đường dẫn không hợp lệ, thông báo thân thiện và điều hướng phục hồi.

---

### 👤 SINH VIÊN 3 (SV3 - NHÓM TRƯỞNG) – ĐIỀU PHỐI QUẢN LÝ & TRÍ TUỆ NHÂN TẠO
- **Chuyên môn chính:** Trải nghiệm Quản lý khách sạn (Duty Manager) & Cổng điều phối trung tâm.
- **Trách nhiệm chéo:** 
  - Xây dựng và tinh chỉnh mô-đun AI Frontend `stayflow-ai.js` (3 tính năng AI: Classifier, Priority, Summarizer).
  - Xây dựng thanh điều hướng ghim nổi `stayflow-ui.js` (StayFlow Demo Matrix Bar, Toast, Modal).
  - Phụ trách tích hợp toàn hệ thống, quản lý nhánh Git/GitHub, kiểm thử kịch bản demo và điều phối tiến độ.

#### Danh mục màn hình phụ trách (7 màn hình):
1. **`index.html`** (Mã: `COMMON-01` | Video: `SV3-01-hub-presentation.mp4`)
   - Cổng StayFlow Hub, sơ đồ kịch bản trình chiếu 6 bước và bảng điều khiển phóng nhanh 4 role.
2. **`login.html`** (Mã: `COMMON-02` | Video: `SV3-02-login-portal.mp4`)
   - Cổng đăng nhập đa vai trò với tính năng đăng nhập nhanh 1-chạm theo từng role cho buổi demo.
3. **`pages/manager/manager-dispatch-board.html`** (Mã: `MGR-01` | Video: `SV3-03-manager-dispatch-board.mp4`)
   - Bảng điều phối Live Matrix, tích hợp **AI-2 Priority Assistant** đánh giá nguy cơ và đề xuất gán nhân sự.
4. **`pages/manager/manager-sla-monitor.html`** (Mã: `MGR-02` | Video: `SV3-04-manager-sla-monitor.mp4`)
   - Bảng giám sát SLA thời gian thực với thanh tiến trình và cảnh báo màu sắc (An toàn / Cảnh báo / Quá hạn).
5. **`pages/manager/manager-service-report.html`** (Mã: `MGR-03` | Video: `SV3-05-manager-service-report.mp4`)
   - Báo cáo chất lượng tích hợp **AI-3 Feedback Summarizer** phân tích cảm xúc và trích xuất điểm nghẽn.
6. **`pages/manager/manager-staff-performance.html`** (Mã: `MGR-04` | Video: `SV3-06-manager-staff-performance.mp4`)
   - Bảng theo dõi tải công việc và hiệu suất ca trực của toàn bộ nhân viên buồng phòng/kỹ thuật.
7. **`pages/admin/admin-dashboard.html`** (Mã: `ADM-01` | Video: `SV3-07-admin-dashboard.mp4`)
   - Dashboard quản trị toàn cục, chỉ số buồng phòng, người dùng, dịch vụ kích hoạt và audit log.

---

## 4. MA TRẬN CÔNG VIỆC CHI TIẾT (TRELLO / JIRA TASK MATRIX)

| Mã Task | Tên công việc & Màn hình | Tệp triển khai | Người thực hiện | Nhánh Git | PR Reviewer | Hạn hoàn thành | Minh chứng OBS |
|:---:|---|---|:---:|---|:---:|:---:|---|
| **TASK-01** | Thiết lập Design System & Layout chung | `style.css`, `components.css` | **SV1** | `feature/design-system` | SV3 | Tuần 1 | `SV1-00-design-system.mp4` |
| **TASK-02** | Khởi tạo LocalStorage Database Engine | `stayflow-db.js` | **SV2** | `feature/mock-database` | SV3 | Tuần 1 | `SV2-00-mock-database.mp4` |
| **TASK-03** | Khởi tạo AI Simulation Modules | `stayflow-ai.js` | **SV3** | `feature/ai-engine` | SV2 | Tuần 1 | `SV3-00-ai-engine.mp4` |
| **TASK-04** | Thanh Demo Switcher Bar & UI Helper | `stayflow-ui.js` | **SV3** | `feature/demo-switcher` | SV1 | Tuần 1 | `SV3-00-ui-helpers.mp4` |
| **TASK-05** | Guest Dashboard (Tổng quan buồng phòng) | `guest-dashboard.html` | **SV1** | `feature/guest-dashboard` | SV2 | Tuần 2 | `SV1-01-guest-dashboard.mp4` |
| **TASK-06** | Guest Service Request (Tích hợp AI-1) | `guest-service-request.html` | **SV1** | `feature/guest-request-ai` | SV3 | Tuần 2 | `SV1-02-guest-service-request.mp4` |
| **TASK-07** | Guest My Requests (Live Timeline) | `guest-my-requests.html` | **SV1** | `feature/guest-my-requests` | SV3 | Tuần 2 | `SV1-03-guest-my-requests.mp4` |
| **TASK-08** | Guest Service Catalog (Menu dịch vụ) | `guest-service-catalog.html` | **SV1** | `feature/guest-catalog` | SV2 | Tuần 2 | `SV1-04-guest-service-catalog.mp4` |
| **TASK-09** | Guest Feedback (Đánh giá 5 sao) | `guest-feedback.html` | **SV1** | `feature/guest-feedback` | SV3 | Tuần 2 | `SV1-05-guest-feedback.mp4` |
| **TASK-10** | Staff Task Board (Kanban 3 cột) | `staff-task-board.html` | **SV2** | `feature/staff-task-board` | SV1 | Tuần 2 | `SV2-01-staff-task-board.mp4` |
| **TASK-11** | Staff Task Detail (Checklist SOP & Ảnh) | `staff-task-detail.html` | **SV2** | `feature/staff-task-detail` | SV3 | Tuần 2 | `SV2-02-staff-task-detail.mp4` |
| **TASK-12** | Staff Shift View (Ca trực & KPI) | `staff-shift-view.html` | **SV2** | `feature/staff-shift-view` | SV1 | Tuần 2 | `SV2-03-staff-shift-view.mp4` |
| **TASK-13** | Manager Dispatch Board (Tích hợp AI-2) | `manager-dispatch-board.html` | **SV3** | `feature/manager-dispatch-ai` | SV2 | Tuần 3 | `SV3-03-manager-dispatch-board.mp4` |
| **TASK-14** | Manager SLA Monitor (Đồng hồ đếm ngược) | `manager-sla-monitor.html` | **SV3** | `feature/manager-sla-monitor` | SV1 | Tuần 3 | `SV3-04-manager-sla-monitor.mp4` |
| **TASK-15** | Manager Service Report (Tích hợp AI-3) | `manager-service-report.html` | **SV3** | `feature/manager-report-ai` | SV2 | Tuần 3 | `SV3-05-manager-service-report.mp4` |
| **TASK-16** | Manager Staff Performance (Tải nhân sự) | `manager-staff-performance.html` | **SV3** | `feature/manager-performance` | SV2 | Tuần 3 | `SV3-06-manager-staff-performance.mp4` |
| **TASK-17** | Admin Dashboard (Chỉ số hệ thống) | `admin-dashboard.html` | **SV3** | `feature/admin-dashboard` | SV1 | Tuần 3 | `SV3-07-admin-dashboard.mp4` |
| **TASK-18** | Admin Service Management (CRUD & SLA) | `admin-service-type-management.html` | **SV2** | `feature/admin-services` | SV3 | Tuần 3 | `SV2-04-admin-service-type.mp4` |
| **TASK-19** | Admin User Management (CRUD Tài khoản) | `admin-user-management.html` | **SV2** | `feature/admin-users` | SV3 | Tuần 3 | `SV2-05-admin-user-management.mp4` |
| **TASK-20** | Admin Room Management (CRUD Buồng phòng) | `admin-room-management.html` | **SV1** | `feature/admin-rooms` | SV2 | Tuần 3 | `SV1-06-admin-room-management.mp4` |
| **TASK-21** | StayFlow Hub & Presentation Center | `index.html` | **SV3** | `feature/hub-presentation` | SV1 | Tuần 4 | `SV3-01-hub-presentation.mp4` |
| **TASK-22** | Login Portal & 404 Error Handler | `login.html`, `404.html` | **SV3 / SV2** | `feature/auth-common` | SV1 | Tuần 4 | `SV3-02-login-portal.mp4` |
| **TASK-23** | Kiểm thử End-to-End & Tích hợp | Toàn bộ dự án | **Cả 3 SV** | `fix/integration-tests` | Cả nhóm | Tuần 4 | Video Demo Tổng Thể |

---

## 5. LỘ TRÌNH THỰC HIỆN 4 TUẦN (WEEKLY ROADMAP)

```text
TUẦN 1: KHỞI TẠO NỀN TẢNG (FOUNDATION & CORE ENGINE)
├── Họp nhóm chốt đề tài, nộp bảng kiểm kê màn hình (screen-inventory.md)
├── SV1: Thiết kế Wireframe/Figma, tạo style.css, components.css, responsive.css
├── SV2: Xây dựng cơ sở dữ liệu stayflow-db.js (LocalStorage, seed data 5 sao)
└── SV3: Xây dựng thuật toán AI stayflow-ai.js & thanh điều phối stayflow-ui.js

TUẦN 2: PHÁT TRIỂN LUỒNG KHÁCH HÀNG & NHÂN VIÊN (GUEST & STAFF FLOWS)
├── SV1: Hoàn thiện 5 màn hình Khách lưu trú (Dashboard, Request AI, My Requests, Catalog, Feedback)
├── SV2: Hoàn thiện 3 màn hình Nhân viên (Task Board Kanban, Task Detail SOP, Shift View)
├── SV3: Đánh giá chéo các PR, kiểm tra tính tương thích giữa Request của Khách và Task của Staff
└── Cuối tuần: Hợp nhất nhánh feature vào dev, kiểm tra luồng tạo request -> nhận việc

TUẦN 3: PHÁT TRIỂN LUỒNG QUẢN LÝ & QUẢN TRỊ VIÊN (MANAGER & ADMIN FLOWS)
├── SV3: Hoàn thiện 4 màn hình Quản lý (Dispatch AI-2, SLA Monitor, Report AI-3, Staff Performance)
├── SV2: Hoàn thiện 2 màn hình Quản trị (Admin Services CRUD, Admin Users CRUD)
├── SV1: Hoàn thiện màn hình Admin Room Management & rà soát toàn bộ Responsive
└── Cuối tuần: Hợp nhất các màn hình Quản lý & Admin vào dev, kiểm tra SLA và Báo cáo AI

TUẦN 4: TÍCH HỢP TOÀN DIỆN, QUAY VIDEO OBS & DIỄN TẬP BẢO VỆ
├── SV3: Hoàn thiện index.html (Hub 6 bước) và login.html; merge dev vào main
├── Cả 3 SV: Quay 19 video OBS cá nhân theo quy định (mỗi màn hình 1 video có mặt sinh viên)
├── Cả 3 SV: Hoàn thiện hồ sơ báo cáo (ai-usage-report.md, project-proposal.md, README.md)
└── Diễn tập thuyết trình kịch bản demo 6 bước theo client-presentation-roadmap.md
```

---

## 6. TIÊU CHUẨN HOÀN THÀNH (DEFINITION OF DONE - DOD)

Một công việc/màn hình chỉ được chuyển sang cột **HOÀN THÀNH (DONE)** trên bảng Trello khi đạt đủ 8 tiêu chí:

1. [x] **HTML ngữ nghĩa:** Sử dụng đúng thẻ `<header>`, `<main>`, `<nav>`, `<section>`, `<article>`, `<footer>`.
2. [x] **CSS hoàn chỉnh & Responsive:** Bố cục đẹp mắt theo chuẩn Luxury Hospitality, hiển thị chuẩn trên cả Mobile và PC.
3. [x] **Tương tác DOM bằng JavaScript:** Có tìm kiếm, lọc, modal, toast, đóng/mở timeline hoặc kéo thả kanban.
4. [x] **Kiểm tra hợp lệ (Form Validation):** Có kiểm tra dữ liệu đầu vào cho mọi form tạo hoặc chỉnh sửa.
5. [x] **Dữ liệu thời gian thực (LocalStorage):** Thao tác lưu trữ và cập nhật vào `StayFlowDB`, đồng bộ được với các màn hình khác.
6. [x] **Bao phủ trạng thái:** Có đủ trạng thái bình thường, đang tải (khi AI phân tích), rỗng (empty state) và thành công.
7. [x] **Yêu cầu hợp nhất (PR) đã duyệt:** Được ít nhất 1 thành viên khác review và merge vào nhánh `dev`.
8. [x] **Video OBS:** Đã quay xong video có mặt sinh viên thực hiện, mở code và chạy thử trực tiếp.
