# StayFlow – Điều phối dịch vụ trong thời gian lưu trú

Sản phẩm Web Frontend (nguyên mẫu) cho môn **CSE122 – Phát triển ứng dụng web cơ bản** (đề BTL-08).
Thuần HTML/CSS/JavaScript, dữ liệu giả lập bằng `localStorage` – không cần máy chủ.

## Chạy dự án

Mở trực tiếp `index.html` bằng trình duyệt, hoặc dùng Live Server (VS Code) với thư mục gốc là `stayflow/`.

> Dữ liệu demo tự gieo vào localStorage lần đầu chạy. Muốn đưa về trạng thái ban đầu: đăng nhập `admin` → Bảng điều khiển → **Đặt lại dữ liệu demo**.

## 4 tài khoản demo (mật khẩu chung: `123456`)

| Tên đăng nhập | Vai trò | Khu vực được kích hoạt |
|---|---|---|
| `khach` | Khách lưu trú – phòng 502 (VIP) | Web Khách |
| `nhanvien` | Nhân viên – Buồng phòng | Web Khách + Khu Nhân viên |
| `quanly` | Quản lý khách sạn | Web Khách + Khu Quản lý (điều phối, SLA, báo cáo, dịch vụ, nhân sự) |
| `admin` | Quản trị viên | Web Khách + Khu Quản trị (chỉ tài khoản + cập nhật hệ thống) |

Ai đăng nhập cũng vào **web Khách (user)** trước. Khu làm việc mở theo role được cấp.
Tài khoản đăng ký mới mặc định là Khách lưu trú; vai trò khác do Quản trị viên (mọi role) hoặc Quản lý (vị trí nhân viên) cấp.

## Cấu trúc

```
stayflow/
├── index.html, login.html, register.html, 403.html, 404.html   # trang chung
├── guest-dashboard.html / guest-service-request.html / guest-my-requests.html
├── staff-task-board.html / staff-task-detail.html / staff-shift-view.html
├── manager-dispatch-board.html / manager-sla-monitor.html / manager-service-report.html
│   manager-service-type-management.html / manager-user-management.html
├── admin-dashboard.html / admin-user-management.html / admin-system-updates.html
├── css/     style.css, responsive.css
├── js/      data.js (dữ liệu + localStorage), auth.js (phân quyền),
│            ui.js (nav/toast/dialog/trợ lý AI), ai.js (3 tính năng AI),
│            guest.js / staff.js / manager.js / admin.js (logic từng khu)
└── docs/    screen-list.md (bảng kiểm kê màn hình), roles-and-features.md (ma trận quyền)
```

## Tính năng chính

- **4 vai trò, 15 màn hình nghiệp vụ** – xem [docs/screen-list.md](docs/screen-list.md)
- **CRUD có ý nghĩa**: yêu cầu dịch vụ, nhiệm vụ, loại dịch vụ, tài khoản, bản cập nhật (xóa = hủy/vô hiệu hóa khi hợp lý)
- **Đồng bộ hồ sơ nhân viên tự động**: tạo / đổi vị trí / vô hiệu hóa tài khoản nhân viên (bởi Admin hoặc Quản lý) → hồ sơ `staff` cập nhật tức thì qua `syncStaffProfile()` trong `js/data.js`. Nhân viên mới xuất hiện ngay trong danh sách điều phối và vào được bảng nhiệm vụ; nhân viên bị vô hiệu hóa tự rút khỏi danh sách điều phối (hồ sơ chỉ chuyển `off`, không xóa, để nhiệm vụ cũ vẫn hiển thị đúng tên).
- **Tìm kiếm / lọc / kiểm tra hợp lệ** ở mọi danh sách và biểu mẫu
- **Trạng thái đầy đủ**: đang tải (skeleton), rỗng, thành công, lỗi, đang chờ, bị từ chối, hoàn thành, đã hủy, vô hiệu hóa
- **SLA thời gian thực** theo từng loại dịch vụ (xanh/vàng/đỏ)
- **4 trải nghiệm AI** (mô phỏng frontend, có giải thích + trạng thái thất bại):
  - Trợ lý AI theo vai trò (chat nổi trên mọi trang)
  - AI-1 Phân loại yêu cầu – AI-2 Gợi ý ưu tiên – AI-3 Tóm tắt phản hồi
- **Phân quyền chặt**: menu theo role + chặn trực tiếp URL (403); Admin không thấy dữ liệu vận hành
- **Responsive** desktop / tablet / mobile

## Lưu ý cho nhóm

- Cần cập nhật `docs/ai-usage-report.md` (khai báo sử dụng AI) theo yêu cầu mục 20 của đề.
- Mỗi màn hình = 1 video OBS (quy tắc `SV?-??-screen-name.mp4`) + 1 nhánh feature + PR như quy trình mục 15–17 của đề.
