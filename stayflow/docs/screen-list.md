# Bảng kiểm kê màn hình – StayFlow (BTL-08)

> Mục 8 của đề bài là "danh sách nền tảng". Bảng dưới đây là bảng kiểm kê **đã điều chỉnh theo thiết kế 3 nhóm vai trò** mà nhóm thống nhất: mọi tài khoản đăng nhập đều vào web Khách (user); khu Nhân viên/Quản lý/Quản trị viên chỉ kích hoạt khi được cấp role. Admin bị giới hạn chỉ quản lý tài khoản – vai trò – cập nhật hệ thống.

## 1. Màn hình dùng chung

| Vai trò | Mục tiêu người dùng | Nhiệm vụ người dùng | Màn hình | Tệp | CRUD/Trạng thái | AI | Phụ trách |
|---|---|---|---|---|---|---|---|
| Chưa đăng nhập | Hiểu sản phẩm | Khám phá, chuyển đến đăng nhập | Trang chủ | `index.html` | R | – | |
| Chưa đăng nhập | Vào hệ thống | Đăng nhập bằng tài khoản được cấp | Đăng nhập | `login.html` | R + Lỗi sai thông tin | – | |
| Chưa đăng nhập | Có tài khoản | Tự tạo tài khoản khách | Đăng ký | `register.html` | C (user) | – | |
| Mọi vai trò | Biết mình không có quyền | Quay lại khu được phép | Không có quyền | `403.html` | Trạng thái lỗi | – | |
| Mọi vai trò | Xử lý sai đường dẫn | Quay về trang chủ | Không tìm thấy | `404.html` | Trạng thái lỗi | – | |

Đã xem xét nhưng **chưa triển khai trong MVP**: `forgot-password.html`, `profile.html`, `settings.html`, `notifications.html` (không thuộc luồng nghiệp vụ chính của BTL).

## 2. Khách lưu trú (mọi tài khoản đăng nhập đều dùng được)

| Mục tiêu | Nhiệm vụ | Màn hình | Tệp | CRUD/Trạng thái | AI | Phụ trách |
|---|---|---|---|---|---|---|
| Nắm thông tin lưu trú | Xem phòng, ngày, thống kê, yêu cầu gần đây | Bảng tin | `guest-dashboard.html` | R + Rỗng (không có lưu trú) | Gợi ý hoạt động theo giờ | |
| Tạo yêu cầu dịch vụ | Điền biểu mẫu, được AI phân loại | Tạo yêu cầu | `guest-service-request.html` | C (request) + Kiểm tra hợp lệ + Thành công/Lỗi | **AI-1 Phân loại yêu cầu** | |
| Theo dõi & hủy yêu cầu | Tìm, lọc, xem timeline, hủy | Yêu cầu của tôi | `guest-my-requests.html` | R/U (hủy = chuyển trạng thái) + Rỗng/Không kết quả | – | |

## 3. Nhân viên vận hành (role `staff`, 4 vị trí: Buồng phòng, Ăn uống, Bảo trì, Lễ tân)

| Mục tiêu | Nhiệm vụ | Màn hình | Tệp | CRUD/Trạng thái | AI | Phụ trách |
|---|---|---|---|---|---|---|
| Nắm việc cần làm | Xem 3 cột Cần nhận/Đang xử lý/Hoàn thành | Bảng nhiệm vụ | `staff-task-board.html` | U (bắt đầu/hoàn thành/từ chối) + Rỗng từng cột | Trợ lý nhắc việc gấp nhất | |
| Xử lý 1 nhiệm vụ | Xem chi tiết, cập nhật trạng thái, ghi chú | Chi tiết nhiệm vụ | `staff-task-detail.html` | U (task, note) + Lỗi "không tìm thấy" | – | |
| Nắm lịch làm việc | Xem ca, đề xuất đổi ca | Ca làm việc | `staff-shift-view.html` | C (swap request) + Trạng thái chờ duyệt/duyệt/từ chối | – | |

## 4. Quản lý khách sạn (role `manager`)

| Mục tiêu | Nhiệm vụ | Màn hình | Tệp | CRUD/Trạng thái | AI | Phụ trách |
|---|---|---|---|---|---|---|
| Điều phối yêu cầu | Gán nhân viên, duyệt đổi ca | Bảng điều phối | `manager-dispatch-board.html` | C (task) + U (request) + Tabs + Rỗng từng tab | **AI-2 Gợi ý ưu tiên** | |
| Giám sát SLA | Xem tiến độ SLA, lọc, đếm trễ | Theo dõi SLA | `manager-sla-monitor.html` | R + Trạng thái sắp trễ/trễ + Rỗng | – | |
| Đo lường chất lượng | Thống kê, biểu đồ, phản hồi | Báo cáo dịch vụ | `manager-service-report.html` | R | **AI-3 Tóm tắt phản hồi** | |
| Cấu hình dịch vụ | Thêm/sửa/vô hiệu hóa loại dịch vụ, SLA | Quản lý loại dịch vụ | `manager-service-type-management.html` | C/R/U/D (serviceType) | – | |
| Quản lý nhân sự | Tạo tài khoản NV, cấp/đổi vị trí | Quản lý nhân sự | `manager-user-management.html` | C (user) + U (vị trí, trạng thái) | – | |

## 5. Quản trị viên (role `admin` – KHÔNG truy cập dữ liệu vận hành)

| Mục tiêu | Nhiệm vụ | Màn hình | Tệp | CRUD/Trạng thái | AI | Phụ trách |
|---|---|---|---|---|---|---|
| Nắm trạng thái hệ thống | Xem số tài khoản, log phân quyền | Bảng điều khiển | `admin-dashboard.html` | R + Đặt lại demo | Trợ lý giải thích phạm vi quyền | |
| Quản lý tài khoản | Tạo, cấp/đổi role, vô hiệu hóa | Quản lý tài khoản | `admin-user-management.html` | C/R/U (role)/D (vô hiệu hóa) + Tìm/lọc | – | |
| Cập nhật hệ thống | Đăng bản tin, sửa/xóa, bật bảo trì | Cập nhật hệ thống | `admin-system-updates.html` | C/R/U/D (systemLog) + Trạng thái bảo trì | – | |

## 6. So sánh với danh sách nền tảng của đề (mục 8)

| Tệp theo đề | Trạng thái trong dự án | Lý do điều chỉnh |
|---|---|---|
| `guest-*.html` (3 trang) | Giữ nguyên | – |
| `staff-task-board/detail/shift-view` (3 trang) | Giữ nguyên | – |
| `manager-dispatch-board/sla-monitor/service-report` (3 trang) | Giữ nguyên | – |
| `admin-service-type-management.html` | **Chuyển thành** `manager-service-type-management.html` | Admin bị giới hạn không xem dữ liệu nghiệp vụ; loại dịch vụ là dữ liệu khách sạn |
| `admin-dashboard/user-management` (2 trang) | Giữ nguyên | – |
| *(mới)* `manager-user-management.html` | Thêm | Quản lý được cấp/thêm role vị trí cho nhân viên như yêu cầu của nhóm |
| *(mới)* `admin-system-updates.html` | Thêm | "Update hệ thống" là một trong hai quyền của Admin |

## 7. Bao phủ trạng thái

| Trang | Bình thường | Đang tải | Rỗng | Thành công | Lỗi | Vô hiệu hóa | Đang chờ | Bị từ chối | Hoàn thành | Đã hủy |
|---|---|---|---|---|---|---|---|---|---|---|
| login | ✔ | – | – | – | ✔ (sai mật khẩu) | ✔ (tài khoản bị khóa) | – | – | – | – |
| guest-dashboard | ✔ | ✔ (skeleton) | ✔ (không lưu trú) | – | ✔ (retry) | – | – | – | – | – |
| guest-service-request | ✔ | ✔ (AI xử lý) | – | ✔ (banner) | ✔ (AI thất bại + validate) | – | – | – | – | – |
| guest-my-requests | ✔ | ✔ | ✔ (chưa có / không kết quả) | – | ✔ | – | ✔ (chờ tiếp nhận) | – | ✔ | ✔ |
| staff-task-board | ✔ | ✔ | ✔ (cột rỗng) | – | ✔ | – | ✔ (cần nhận) | ✔ (từ chối) | ✔ | – |
| staff-task-detail | ✔ | – | – | ✔ | ✔ (không tìm thấy) | – | ✔ | ✔ | ✔ | – |
| staff-shift-view | ✔ | ✔ | ✔ (không có ca) | – | ✔ | – | ✔ (đổi ca chờ duyệt) | ✔ | – | – |
| manager-dispatch-board | ✔ | ✔ | ✔ (mỗi tab) | ✔ (toast) | ✔ | – | ✔ | ✔ (từ chối đổi ca) | ✔ | – |
| manager-sla-monitor | ✔ | ✔ | ✔ | – | ✔ | – | ✔ | – | – | – |
| manager-service-report | ✔ | – | – | – | ✔ (AI thiếu dữ liệu) | – | – | – | – | – |
| manager-service-type-management | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ (dịch vụ) | – | – | – | – |
| manager/admin-user-management | ✔ | ✔ | ✔ (không kết quả lọc) | ✔ | ✔ | ✔ (tài khoản) | – | – | – | – |
| admin-system-updates | ✔ | ✔ | ✔ (chưa có bản tin) | ✔ | ✔ | – | – | – | – | – |
