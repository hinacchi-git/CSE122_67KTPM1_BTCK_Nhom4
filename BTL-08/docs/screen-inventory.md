# BẢNG KIỂM KÊ MÀN HÌNH ĐẦY ĐỦ – DỰ ÁN STAYFLOW (BTL-08)

> **Học phần:** PHÁT TRIỂN ỨNG DỤNG WEB CƠ BẢN – CSE122  
> **Đề tài:** BTL-08 – StayFlow – Điều phối dịch vụ trong thời gian lưu trú  
> **Nguyên tắc:** Độ đầy đủ của nghiệp vụ > Số lượng giao diện tối thiểu. Hệ thống bao phủ 19 màn hình hoàn chỉnh cho 4 vai trò và cổng dùng chung.

---

## 1. Bảng Kiểm Kê Màn Hình Chính Thức

| Vai trò | Mục tiêu người dùng | Nhiệm vụ người dùng | Tên màn hình | Tệp HTML | CRUD / Trạng thái | Tính năng AI | Người phụ trách |
|---|---|---|---|---|---|---|---|
| **Cổng Hub** | Định hướng & Giới thiệu | Xem tổng quan, nắm lộ trình demo 6 bước | StayFlow Hub & Roadmap | `index.html` | R / Bình thường | Tổng quan | SV3 (Nhóm trưởng) |
| **Cổng Hub** | Xác thực & Chọn vai trò | Đăng nhập mô phỏng 1-chạm theo 4 vai trò | Login Portal | `login.html` | R / Thành công, Lỗi | Phân quyền | SV1 |
| **Dùng chung** | Xử lý ngoại lệ | Xử lý đường dẫn không hợp lệ | Error 404 | `404.html` | R / Lỗi | - | SV2 |
| **Khách lưu trú** | Nắm bắt tiện ích phòng | Xem thông tin phòng 502, số đêm, dịch vụ nhanh | Guest Dashboard | `pages/guest/guest-dashboard.html` | R / Bình thường, Đang tải | - | SV1 |
| **Khách lưu trú** | Tạo yêu cầu dịch vụ | Nhập mô tả nhu cầu, xem AI phân loại và gợi ý SLA | Service Request | `pages/guest/guest-service-request.html` | C/R / Bình thường, Đang xử lý, Chấp nhận/Sửa | **AI-1: Request Classifier** (Phân loại tự động) | SV1 |
| **Khách lưu trú** | Theo dõi tiến độ | Xem Live Timeline, đồng hồ đếm ngược, hủy yêu cầu | My Requests | `pages/guest/guest-my-requests.html` | R/U/D (Hủy) / Chờ, Đang xử lý, Hoàn thành, Đã hủy | - | SV1 |
| **Khách lưu trú** | Tra cứu dịch vụ | Tìm kiếm bảng giá, mô tả và cam kết thời gian | Service Catalog | `pages/guest/guest-service-catalog.html` | R / Lọc danh mục, Tìm kiếm | - | SV1 |
| **Khách lưu trú** | Phản ánh chất lượng | Chấm điểm sao, chọn tiêu chí, gửi nhận xét | Guest Feedback | `pages/guest/guest-feedback.html` | C/R / Thành công | Dữ liệu đầu vào cho AI-3 | SV1 |
| **Nhân viên** | Tiếp nhận nhiệm vụ | Xem bảng Kanban 3 cột, nhận việc 1-chạm | Task Board | `pages/staff/staff-task-board.html` | R/U / Chờ, Đang làm, Hoàn thành | - | SV2 |
| **Nhân viên** | Hoàn tất công việc | Tích checklist SOP, chụp ảnh minh chứng, xác nhận | Task Detail | `pages/staff/staff-task-detail.html` | R/U / Checklist tương tác, Chụp ảnh giả lập | - | SV2 |
| **Nhân viên** | Quản lý ca trực | Xem giờ ca trực, KPI hoàn thành, bàn giao ca | Shift View & KPI | `pages/staff/staff-shift-view.html` | R/C / Bàn giao ca | - | SV2 |
| **Quản lý** | Điều phối vận hành | Xem yêu cầu live, AI đánh giá rủi ro và gán việc | Dispatch Board | `pages/manager/manager-dispatch-board.html` | C/R/U / Ma trận phân bổ, Live Sync | **AI-2: Priority Assistant** (Gợi ý ưu tiên & nhân sự) | SV3 |
| **Quản lý** | Giám sát chất lượng | Giám sát thanh tiến trình SLA, cảnh báo trễ hạn | SLA Monitor | `pages/manager/manager-sla-monitor.html` | R / An toàn, Cảnh báo, Quá hạn | Cảnh báo tự động | SV3 |
| **Quản lý** | Báo cáo điều hành | Đọc nhận định AI, xem phân tích cảm xúc khách | Service Report | `pages/manager/manager-service-report.html` | R / Biểu đồ tỷ lệ, Danh sách đánh giá | **AI-3: Feedback Summarizer** (Tóm tắt & Sắc thái) | SV3 |
| **Quản lý** | Cân bằng tải nhân sự | Theo dõi số task đang gán của từng nhân viên | Staff Performance | `pages/manager/manager-staff-performance.html` | R / Phân tích tải | - | SV3 |
| **Quản trị viên** | Giám sát toàn cục | Xem chỉ số phòng, dịch vụ, người dùng, audit log | Admin Dashboard | `pages/admin/admin-dashboard.html` | R / Số liệu thống kê | - | SV3 |
| **Quản trị viên** | Quản trị danh mục | Thêm/sửa/xóa loại dịch vụ, điều chỉnh SLA phút | Service Management | `pages/admin/admin-service-type-management.html` | C/R/U/D / Modal Form, Validation | Đồng bộ danh mục cho Khách | SV2 |
| **Quản trị viên** | Quản lý người dùng | Thêm tài khoản nhân viên, phân quyền 4 role | User Management | `pages/admin/admin-user-management.html` | C/R/D / Modal Form | - | SV2 |
| **Quản trị viên** | Quản lý phòng nghỉ | Cập nhật buồng phòng (Trống, Đang ở, Bảo trì) | Room Management | `pages/admin/admin-room-management.html` | C/R/U / Đổi trạng thái phòng | - | SV1 |

---

## 2. Bao Phủ Trạng Thái Theo Quy Định Học Phần

Mọi màn hình và chức năng đều được thiết kế bao phủ đầy đủ các trạng thái nghiệp vụ:
- **Bình thường (Normal):** Giao diện chuẩn với dữ liệu mock phong phú.
- **Đang tải (Loading):** Trạng thái spinner quay khi AI phân tích ngôn ngữ tự nhiên hoặc tải danh sách.
- **Rỗng (Empty State):** Khi danh sách không có yêu cầu nào, hiển thị icon thân thiện và nút điều hướng tạo mới.
- **Thành công (Success):** Toast notification xanh lá cây xuất hiện sau mỗi thao tác tạo/sửa/gán task.
- **Lỗi / Cảnh báo (Error / Warning):** Cảnh báo màu đỏ khi sự cố khẩn cấp (rò rỉ nước), cảnh báo màu vàng khi sắp quá hạn SLA (< 3 phút).
- **Trải nghiệm khi AI thất bại (AI Fallback):** Khi khách nhập nội dung quá ngắn hoặc không rõ ràng, AI đưa ra thông báo chưa chắc chắn kèm nút cho phép người dùng tự chọn bằng tay.
