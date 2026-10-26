# BÁO CÁO KHAI BÁO SỬ DỤNG AI (AI USAGE REPORT)

**Dự án:** StayFlow – BTL-08, CSE122 – nguyên mẫu điều phối dịch vụ trong thời gian lưu trú  
**Người tổng hợp:** Lâm Hải Long – MSSV 2551170913 (SV1)  
**Repository nhóm:** [hinacchi-git/CSE122_67KTPM1_BTCK_Nhom4](https://github.com/hinacchi-git/CSE122_67KTPM1_BTCK_Nhom4)  
**Ngày hoàn thiện:** 27/10/2026  
**Phạm vi:** toàn bộ hệ thống StayFlow gồm 4 vai trò (Khách, Nhân viên, Quản lý, Quản trị viên), 15 màn hình nghiệp vụ và 5 trang dùng chung.

---

## 1. CÁC CÔNG CỤ AI ĐÃ SỬ DỤNG

| Công cụ | Mục đích sử dụng | Ghi chú |
|---|---|---|
| Qoder Desktop (AI agent) | Hỗ trợ kiến trúc thư mục, lõi JavaScript dùng chung, hàm AI mô phỏng ở frontend, rà soát mã, kiểm thử, viết tài liệu và đóng gói bài nộp | Dùng trong các phiên làm việc từ 25/10 đến 27/10/2026 |
| Antigravity | Hỗ trợ tạo file thiết kế Figma và tệp kiểm thử hệ thống | Theo khai báo của nhóm |

- Không có API key, token hay cấu hình nhà cung cấp AI trong mã nguồn.
- Các tính năng AI của sản phẩm là **mô phỏng bằng quy tắc** trong `js/ai.js`, không gọi dịch vụ AI bên ngoài.
- AI không thay thế phần thiết kế giao diện HTML/CSS và không quyết định nội dung nghiệp vụ của nhóm.

## 2. PHÂN ĐỊNH PHẦN AI SINH RA & PHẦN SINH VIÊN HOÀN THIỆN

### 2.1. Phần AI sinh ra hoặc hỗ trợ

- Khung kiến trúc thư mục 4 khu vai trò (`guest/`, `staff/`, `manager/`, `admin/`) và lõi dùng chung trong `js/`, `css/`.
- Module dữ liệu localStorage `js/data.js`: dữ liệu mẫu `users`, `staff`, `stays`, `requests`, `tasks`, `serviceTypes`, `feedback`; lớp `Store`; đồng bộ hồ sơ nhân viên `syncStaffProfile()`; đặt lại dữ liệu `Store.reset()`.
- Ba hàm AI mô phỏng trong `js/ai.js`:
  - AI-1 `classify()`: phân loại yêu cầu vào 4 bộ phận.
  - AI-2 `suggestPriority()`: gợi ý mức ưu tiên theo từ khóa cấp bách, khách VIP và SLA.
  - AI-3 `summarize()`: tóm tắt chủ đề phản hồi của khách.
- Logic đăng nhập, phiên làm việc và phân quyền phía client trong `js/auth.js`; các thành phần giao diện dùng chung trong `js/ui.js` (thanh điều hướng, footer, dialog, trạng thái rỗng/lỗi, trợ lý AI).
- Các phần tương tác JavaScript của màn hình: tạo yêu cầu, điều phối, nhận và hoàn thành nhiệm vụ, quản lý loại dịch vụ, quản lý tài khoản, báo cáo, tìm kiếm/lọc/sắp xếp và chặn URL sai quyền.
- Tài liệu `README.md`, `docs/screen-list.md`, `docs/roles-and-features.md`, `docs/test-cases.md` và quy trình đóng gói ZIP.

### 2.2. Phần sinh viên chỉnh sửa và hoàn thiện

- Thiết kế HTML/CSS cho toàn bộ 20 trang: bố cục, hệ màu, typography, khoảng cách, component, trạng thái hiển thị và responsive desktop/tablet/mobile.
- Xác định yêu cầu nghiệp vụ, phân vai và luồng chính: Khách tạo yêu cầu → Quản lý điều phối → Nhân viên xử lý → Khách theo dõi và đánh giá → Quản lý xem báo cáo.
- Tinh chỉnh trải nghiệm “AI thất bại / AI chưa chắc chắn”: thông báo “Không đủ dữ liệu”, “AI chưa chắc chắn” và các nút can thiệp thủ công (Chấp nhận, Sửa tay, Từ chối, Tạo lại).
- Kiểm tra giao diện trên trình duyệt, đối chiếu thiết kế sau khi AI tái cấu trúc mã, điều chỉnh nội dung và cách hiển thị.
- Quyết định giữ nguyên giao diện khi tái cấu trúc HTML/CSS sang cách viết của file mẫu.

## 3. LỖI AI GẶP PHẢI & CÁCH SINH VIÊN KIỂM CHỨNG

### Lỗi 1: Liên kết tài nguyên sai khi mở trực tiếp `index.html`

- **Hiện tượng:** mở bằng `file://` thì trang chủ thiếu CSS/JS, hiển thị không đầy đủ.
- **Cách khắc phục:** kiểm tra cấu trúc thư mục, chuyển các liên kết về đường dẫn tương đối đúng.
- **Kiểm chứng:** mở trực tiếp `index.html`, đối chiếu giao diện và Console.

### Lỗi 2: Tái cấu trúc CSS tạo token màu sai

- **Hiện tượng:** khi thay mã màu `#fff8eb` bằng biến, AI tạo token sai `var(--white)8eb`, làm nền một số khối bị sai màu.
- **Cách khắc phục:** đổi thành `var(--warn-light)` trong `staff/staff.css` và `manager/manager.css`, rà lại toàn bộ token.
- **Kiểm chứng:** so sánh computed-style 101 phần tử trước và sau khi tái cấu trúc: 0 khác biệt.

### Lỗi 3: Tài liệu mô tả sai luồng đăng nhập và phạm vi đặt lại dữ liệu

- **Hiện tượng:** tài liệu cũ ghi mọi tài khoản sau đăng nhập đều vào web Khách; mô tả `Store.reset()` không thống nhất với mã.
- **Cách khắc phục:** đọc `js/auth.js` và `js/data.js`, sửa README, `docs/screen-list.md`, `docs/roles-and-features.md` theo đúng `Auth.homeFor()`, luồng chặn `403.html` và phạm vi xóa khóa `stayflow:*`.
- **Kiểm chứng:** đăng nhập 4 tài khoản demo, kiểm tra trang đích; đọc lại mã `Store.reset()`.

### Lỗi 4: Tài liệu nói mọi danh sách có bộ lọc nhưng một màn hình chưa có

- **Hiện tượng:** README ghi “tìm kiếm/lọc ở mọi danh sách” nhưng trang Quản lý nhân sự chưa có bộ lọc.
- **Cách khắc phục:** bổ sung ô tìm kiếm, lọc vai trò, đếm kết quả và trạng thái rỗng có nút xóa bộ lọc cho `manager/user-management.html` và `.js`.
- **Kiểm chứng:** tìm `nhan` ra 1/4, lọc `staff` ra 1/4, lọc `manager` ra 1/4, tìm `zzzz` ra 0/4 kèm nút “Xóa bộ lọc”, bấm nút trở về 4/4.

### Lỗi 5: Báo cáo AI cũ mô tả sai phần việc

- **Hiện tượng:** báo cáo cũ ghi AI tạo khung HTML và bảng màu CSS, trong khi phần thiết kế do sinh viên thực hiện.
- **Cách khắc phục:** loại bỏ các nội dung đó khỏi phần AI sinh ra; ghi rõ phần thiết kế HTML/CSS và quyết định nghiệp vụ là phần sinh viên hoàn thiện.
- **Kiểm chứng:** đối chiếu lại với quá trình làm việc và mã nguồn hiện tại.

## 4. ĐIỀU SINH VIÊN HỌC ĐƯỢC

- **Kiến trúc ứng dụng web không máy chủ:** toàn bộ dữ liệu và xử lý nằm ở client; localStorage giữ dữ liệu qua các lần tải trang, có dữ liệu mẫu và nút đặt lại để phục vụ demo.
- **Thiết kế AI giải thích được (XAI):** AI-1, AI-2, AI-3 luôn trả lý do hoặc thông báo không đủ dữ liệu/không chắc chắn; người dùng giữ quyền quyết định cuối cùng (Chấp nhận, Sửa tay, Từ chối, Tạo lại).
- **Phân biệt “AI không chắc chắn” và “AI bị lỗi”:** giao diện có trạng thái riêng cho thiếu dữ liệu, không khớp từ khóa và lỗi hệ thống, mỗi trạng thái có cách thoát phù hợp.
- **Kiểm thử và kiểm chứng:** phải chạy thật trên trình duyệt, kiểm tra DOM, Console, bàn phím và responsive; không chỉ đọc mã. Refactor phải đi kèm kiểm thử hồi quy.
- **Làm việc nhóm và phân định trách nhiệm:** tách mã theo 4 khu vai trò, thống nhất lõi dùng chung, ghi rõ phần AI hỗ trợ và phần sinh viên tự làm.
- **Đóng gói và bàn giao:** kiểm tra cấu trúc thư mục, số tệp, liên kết tương đối và tài liệu trước khi nộp.

## 5. DANH MỤC MÔ PHỎNG VS API THẬT

| Thành phần | Cách hoạt động | Gọi API thật? |
|---|---|---|
| LocalStorage & Mock Data | Dữ liệu `users`, `staff`, `stays`, `requests`, `tasks`, `serviceTypes`, `feedback`, `aiSummaries` được gieo lần đầu và lưu trong trình duyệt với tiền tố `stayflow:`; có `Store.reset()` đưa về dữ liệu mặc định | **Không** |
| AI-1 Phân loại yêu cầu | Đối chiếu từ khóa với 4 bộ phận; chờ 900 ms; trả lý do hoặc thông báo thiếu dữ liệu/không chắc chắn | **Không** |
| AI-2 Gợi ý ưu tiên | Cộng điểm theo từ khóa cấp bách, khách VIP và thời gian còn lại của SLA; chờ 900 ms; có trạng thái `unsure` | **Không** |
| AI-3 Tóm tắt phản hồi | Đếm tần suất từ khóa theo 5 chủ đề; chờ 1.200 ms; cần ít nhất 3 phản hồi | **Không** |
| Trợ lý AI theo vai trò | So khớp ý định bằng từ khóa, đọc dữ liệu localStorage; chờ 700/600 ms | **Không** |
| Đăng nhập, phân quyền | Kiểm tra session phía trình duyệt, chặn URL sai quyền bằng `403.html` | **Không** |

- Toàn bộ trải nghiệm AI là mô phỏng bằng quy tắc; không có mô hình AI, không có độ trễ mạng thật và không có API key.
- Dự án không dùng MockAPI và không có lệnh `fetch(`; dữ liệu chỉ nằm trong một trình duyệt, không đồng bộ giữa thiết bị.
- Hệ quả: kết quả AI giải thích được nhưng không học từ dữ liệu; phân quyền chỉ ở client nên không đủ an toàn cho sản phẩm thật.

## Tài liệu tham chiếu

- [README dự án](../README.md)
- [Kiểm kê màn hình và trạng thái](screen-list.md)
- [Vai trò, quyền hạn và tính năng](roles-and-features.md)
- [Kịch bản kiểm thử toàn hệ thống](test-cases.md)
- [Mã AI mô phỏng](../js/ai.js)
- [Dữ liệu seed và Store](../js/data.js)
