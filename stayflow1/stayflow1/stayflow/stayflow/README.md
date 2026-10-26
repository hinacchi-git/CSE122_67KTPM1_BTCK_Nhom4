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
| `nhanvien` | Nhân viên – Buồng phòng | Khu Nhân viên |
| `quanly` | Quản lý khách sạn | Khu Quản lý (điều phối, SLA, báo cáo, dịch vụ, nhân sự) |
| `admin` | Quản trị viên | Khu Quản trị (chỉ tài khoản + cập nhật hệ thống) |

Sau khi đăng nhập, mỗi tài khoản được đưa về khu làm việc đúng role: Khách → Bảng tin, Nhân viên → Bảng nhiệm vụ, Quản lý → Điều phối, Quản trị viên → Bảng điều khiển. Truy cập URL không thuộc quyền sẽ bị chặn bằng `403.html` (riêng khu Khách chuyển tài khoản khác về khu của họ).
Tài khoản đăng ký mới mặc định là Khách lưu trú; vai trò khác do Quản trị viên (mọi role) hoặc Quản lý (vị trí nhân viên) cấp.

## Cấu trúc theo vai trò

```
stayflow/
├── index.html, login.html, register.html, 403.html, 404.html   # trang chung
├── css/     style.css, responsive.css
├── js/      data.js, auth.js, ui.js, ai.js            # lõi dùng chung
├── guest/    common.js
│             dashboard.html + dashboard.js
│             service-request.html + service-request.js
│             my-requests.html + my-requests.js
├── staff/    common.js
│             task-board.html + task-board.js
│             task-detail.html + task-detail.js
│             shift-view.html + shift-view.js
├── manager/  common.js
│             dispatch-board.html + dispatch-board.js
│             shift-management.html + shift-management.js
│             sla-monitor.html + sla-monitor.js
│             service-report.html + service-report.js
│             service-type-management.html + service-type-management.js
│             user-management.html + user-management.js
├── admin/    common.js
│             dashboard.html + dashboard.js
│             user-management.html + user-management.js
│             system-updates.html + system-updates.js
├── docs/     screen-list.md (bảng kiểm kê màn hình), roles-and-features.md (ma trận quyền),
│             test-cases.md (kịch bản kiểm thử toàn hệ thống)
└── _archive/ legacy-flat-pages/   # bản phẳng cũ, chỉ để đối chiếu – không dùng
              legacy-role-js/      # mã role gộp cũ, đã thay bằng file theo màn hình
```

Mỗi folder vai trò là một cụm trang liên kết với nhau bằng thanh điều hướng dùng chung.
Mỗi trang nạp `common.js` của role (xác thực, khung trang, helper dùng chung) rồi nạp file JS trùng tên với màn hình.
Các trang vai trò chỉ dùng chung `css/` và 4 file lõi trong `js/`; mã nghiệp vụ của role nằm ngay trong folder của role đó.

## Gợi ý chia việc cho nhóm 3 người

| Thành viên | Phụ trách | Tệp / thư mục chính |
|---|---|---|
| SV 1 | Web Khách + trang chung | `guest/`, `index.html`, `login.html`, `register.html`, `403.html`, `404.html` |
| SV 2 | Khu Nhân viên | `staff/` |
| SV 3 | Khu Quản lý + Quản trị | `manager/`, `admin/` |

Phần lõi dùng chung (`css/`, `js/data.js`, `js/auth.js`, `js/ui.js`, `js/ai.js`) do cả nhóm thống nhất trước khi ghép bài.

## Tính năng chính

- **4 vai trò, 15 màn hình nghiệp vụ chia theo 4 folder** – xem [docs/screen-list.md](docs/screen-list.md)
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
- **Kịch bản kiểm thử toàn hệ thống** ~130 case (smoke, từng trang, phân quyền, AI, dữ liệu, accessibility, responsive, E2E) – xem [docs/test-cases.md](docs/test-cases.md)

## Lưu ý cho nhóm

- Cần cập nhật `docs/ai-usage-report.md` (khai báo sử dụng AI) theo yêu cầu mục 20 của đề.
- Mỗi màn hình = 1 video OBS (quy tắc `SV?-??-screen-name.mp4`) + 1 nhánh feature + PR như quy trình mục 15–17 của đề.
