# Kịch bản kiểm thử toàn bộ hệ thống – StayFlow (BTL-08)

> Tài liệu dùng để kiểm thử thủ công toàn bộ 20 màn hình và các luồng nghiệp vụ chính của StayFlow.
> Mỗi thành viên chạy lại checklist trên máy mình trước khi tạo PR; nhóm trưởng tổng hợp kết quả vào mục 17.
>
> - **Phiên bản:** 1.0
> - **Ngày lập:** 27-10-2026
> - **Người lập:** ____________________
> - **Môi trường chạy:** Chrome / Edge / Firefox phiên bản mới, màn hình tối thiểu 1024×768
> - **Cách chạy:** mở `index.html` trực tiếp, hoặc dùng Live Server với thư mục gốc `stayflow/`

## 1. Phạm vi kiểm thử

| Nhóm | Nội dung |
|---|---|
| Trang chung | `index.html`, `login.html`, `register.html`, `403.html`, `404.html` |
| Khách | `guest/dashboard.html`, `guest/service-request.html`, `guest/my-requests.html` |
| Nhân viên | `staff/task-board.html`, `staff/task-detail.html`, `staff/shift-view.html` |
| Quản lý | 6 trang trong `manager/` |
| Quản trị | 3 trang trong `admin/` |
| Lõi dùng chung | `js/data.js`, `js/auth.js`, `js/ui.js`, `js/ai.js`, `css/` |
| Ngoài phạm vi | Backend, thanh toán, email/SMS thật, API AI thật (dự án chỉ mô phỏng frontend) |

## 2. Tài khoản và dữ liệu kiểm thử

| Tài khoản | Mật khẩu | Vai trò | Trang đích sau đăng nhập |
|---|---|---|---|
| `khach` | `123456` | Khách lưu trú – phòng 502 (VIP) | `guest/dashboard.html` |
| `nhanvien` | `123456` | Nhân viên – Buồng phòng | `staff/task-board.html` |
| `quanly` | `123456` | Quản lý khách sạn | `manager/dispatch-board.html` |
| `admin` | `123456` | Quản trị viên | `admin/dashboard.html` |

- Dữ liệu tự gieo vào `localStorage` ở lần chạy đầu.
- Trước mỗi vòng kiểm thử: đăng nhập `admin` → Bảng điều khiển → **Đặt lại dữ liệu demo**.
- Các trường hợp cần dữ liệu đặc biệt (dưới 3 phản hồi, không có ca làm…) ghi rõ ở cột "Tiền điều kiện".

## 3. Quy ước

- **Mức ưu tiên:** P0 = luồng chính, P1 = luồng phụ, P2 = giao diện/trải nghiệm.
- **Kết quả:** `Đ` = Đạt, `K` = Không đạt, `NA` = Không áp dụng. Ghi `K` thì bắt buộc tạo dòng trong bảng lỗi (mục 16).
- Mỗi lần chạy ghi lại trình duyệt + độ phân giải + tài khoản đang dùng.

## 4. Smoke test (chạy trước, khoảng 10 phút)

| ID | Màn hình | Thao tác | Kết quả mong đợi | KQ |
|---|---|---|---|---|
| SM-01 | Trang chủ | Mở `index.html` | Trang hiển thị đầy đủ, không lỗi console, nút Đăng nhập/Đăng ký hoạt động | ☐ |
| SM-02 | Đăng nhập | Lần lượt đăng nhập 4 tài khoản demo | Mỗi tài khoản vào đúng trang đích ở mục 2, menu đúng role | ☐ |
| SM-03 | Tạo yêu cầu | `khach` gửi một yêu cầu hợp lệ | Có banner thành công, yêu cầu xuất hiện ở "Yêu cầu của tôi" | ☐ |
| SM-04 | Điều phối | `quanly` điều phối yêu cầu vừa tạo cho nhân viên | Yêu cầu chuyển "Đã điều phối", nhiệm vụ mới xuất hiện ở staff | ☐ |
| SM-05 | Bảng nhiệm vụ | `nhanvien` bắt đầu rồi hoàn thành nhiệm vụ | Nhiệm vụ sang "Hoàn thành", yêu cầu của khách cũng "Hoàn thành" | ☐ |
| SM-06 | Yêu cầu của tôi | `khach` mở lại danh sách | Thấy trạng thái Hoàn thành + timeline + thời điểm hoàn thành | ☐ |
| SM-07 | Báo cáo dịch vụ | `quanly` chạy AI-3 rồi bấm "Lưu nhận xét" | Kết quả xuất hiện trong "Nhận xét AI đã lưu", còn sau khi F5 | ☐ |
| SM-08 | Bảng điều khiển | `admin` bấm "Đặt lại dữ liệu demo" | Có hộp xác nhận; đồng ý thì dữ liệu về seed và quay về trang đăng nhập | ☐ |

## 5. Trang chung và khung trang

| ID | Màn hình | Thao tác | Kết quả mong đợi | KQ |
|---|---|---|---|---|
| C-01 | Tất cả | Đăng nhập từng role, quan sát thanh điều hướng | Menu chỉ chứa trang của role đó; khách thấy 3 mục, nhân viên 2, quản lý 6, admin 3 | ☐ |
| C-02 | Tất cả | Mở từng trang trong menu | Link của trang hiện tại có trạng thái `active` | ☐ |
| C-03 | Tất cả | Bấm logo StayFlow | Quay về trang chính của role (khách → Bảng tin, nhân viên → Bảng nhiệm vụ…) | ☐ |
| C-04 | Tất cả | Cuộn xuống cuối trang | Có đúng **một** footer, gồm tên dự án, môn học/nhóm và 3 link Trang chủ/Đăng nhập/Đăng ký | ☐ |
| C-05 | Tất cả | Kiểm tra cấu trúc DOM | Có `<header>`, `<nav>`, `<main>`, ít nhất một `<section>`, `<footer>`; không lồng `<main>` trong `<main>` | ☐ |
| C-06 | 403 | Đăng nhập `nhanvien`, mở URL `manager/dispatch-board.html` | Chuyển tới `403.html`, có nút quay về khu được phép | ☐ |
| C-07 | 404 | Mở một URL không tồn tại, ví dụ `guest/khong-ton-tai.html` | Hiển thị trang 404, có link về trang chủ | ☐ |
| C-08 | Bảo trì | `admin` bật bảo trì, mở vài trang bất kỳ rồi tắt | Banner bảo trì xuất hiện trên mọi trang khi bật, biến mất khi tắt | ☐ |
| C-09 | Trợ lý AI | Bấm nút ✨ ở góc phải | Mở panel chat, có gợi ý đúng phạm vi role; admin không thấy dữ liệu vận hành | ☐ |
| C-10 | Hộp thoại | Mở một dialog, lần lượt bấm Esc, bấm nền mờ, bấm Hủy | Dialog đóng, không lưu thay đổi | ☐ |
| C-11 | Mobile | Thu hẹp còn 375px, bấm nút ☰ | Menu mở/đóng được, không che mất nút đăng xuất | ☐ |
| C-12 | Tất cả | Đi qua toàn bộ link nội bộ ở 4 role | Không có link chết, không có lỗi JavaScript trong Console | ☐ |

## 6. Xác thực và phân quyền

| ID | Màn hình | Thao tác | Kết quả mong đợi | KQ |
|---|---|---|---|---|
| A-01 | Đăng nhập | Bỏ trống tên hoặc mật khẩu rồi bấm Đăng nhập | Hiện lỗi tại đúng ô, không gửi form | ☐ |
| A-02 | Đăng nhập | Nhập sai mật khẩu | Hiện "Sai tên đăng nhập hoặc mật khẩu", không tạo phiên | ☐ |
| A-03 | Đăng nhập | Đăng nhập đúng 4 tài khoản | Mỗi tài khoản vào đúng trang đích, tên/vai trò hiển thị trên topbar | ☐ |
| A-04 | Đăng nhập | Vô hiệu hóa một tài khoản rồi thử đăng nhập | Bị từ chối với thông báo tài khoản đã bị vô hiệu hóa | ☐ |
| A-05 | Topbar | Bấm Đăng xuất | Xóa phiên, quay về `login.html`; bấm Back không vào lại được khu bảo vệ | ☐ |
| A-06 | URL trực tiếp | Mở trang role khi chưa đăng nhập | Chuyển về `login.html` | ☐ |
| A-07 | URL trực tiếp | `nhanvien` mở trang quản lý | Chuyển tới `403.html` | ☐ |
| A-08 | URL trực tiếp | `quanly` mở trang admin | Chuyển tới `403.html` | ☐ |
| A-09 | URL trực tiếp | `khach` mở trang nhân viên/quản lý/admin | Chuyển tới `403.html` | ☐ |
| A-10 | URL trực tiếp | `nhanvien` mở trang khách | Chuyển về trang chính của nhân viên, không vào được khu khách | ☐ |
| A-11 | Đăng ký | Bỏ trống họ tên, mật khẩu ngắn, nhập lại sai | Hiện đủ lỗi tại từng ô, không tạo tài khoản | ☐ |
| A-12 | Đăng ký | Nhập họ tên 1 ký tự | Báo lỗi tối thiểu 2 ký tự | ☐ |
| A-13 | Đăng ký | Dùng tên đăng nhập đã tồn tại | Báo "Tên đăng nhập đã tồn tại" | ☐ |
| A-14 | Đăng ký | Nhập tên đăng nhập có khoảng trắng | Báo tên đăng nhập không chứa khoảng trắng | ☐ |
| A-15 | Đăng ký | Đăng ký hợp lệ | Tạo tài khoản role Khách, tự đăng nhập, vào Bảng tin; tài khoản mới thấy trong danh sách admin | ☐ |

## 7. Khu Khách lưu trú

| ID | Màn hình | Thao tác | Kết quả mong đợi | KQ |
|---|---|---|---|---|
| G-01 | Bảng tin | `khach` đăng nhập | Hiển thị lời chào, thông tin phòng/ngày lưu trú, thống kê yêu cầu và yêu cầu gần đây | ☐ |
| G-02 | Bảng tin | Đăng ký tài khoản mới (chưa có phiếu lưu trú) | Trạng thái rỗng "chưa có phiếu lưu trú" kèm nút về trang chủ, không lỗi JS | ☐ |
| G-03 | Tạo yêu cầu | Nhập mô tả "Cho mình xin thêm 2 khăn tắm và 1 chai nước suối" rồi bấm Phân loại bằng AI | Hiện trạng thái đang xử lý, sau đó đề xuất đúng bộ phận Buồng phòng/Ăn uống kèm lý do và độ tin cậy | ☐ |
| G-04 | Tạo yêu cầu | Nhập mô tả ngắn dưới 10 ký tự rồi bấm Phân loại | Báo "Không đủ dữ liệu", có nút Thử lại và Chọn thủ công | ☐ |
| G-05 | Tạo yêu cầu | Nhập mô tả dài nhưng không chứa từ khóa dịch vụ | Báo "AI chưa chắc chắn", vẫn chọn loại dịch vụ thủ công được | ☐ |
| G-06 | Tạo yêu cầu | Bấm Chấp nhận đề xuất AI | Ô loại dịch vụ được chọn tự động, có banner xác nhận đã áp dụng AI | ☐ |
| G-07 | Tạo yêu cầu | Bấm Chọn thủ công sau khi AI trả kết quả | Panel AI đóng, focus chuyển về ô chọn loại dịch vụ | ☐ |
| G-08 | Tạo yêu cầu | Bỏ trống loại/tiêu đề ngắn/mô tả ngắn rồi gửi | Hiện lỗi tại cả 3 ô, không tạo yêu cầu | ☐ |
| G-09 | Tạo yêu cầu | Gửi yêu cầu hợp lệ | Banner thành công ghi rõ bộ phận và SLA; yêu cầu mới xuất hiện ở "Yêu cầu của tôi" | ☐ |
| G-10 | Yêu cầu của tôi | Mở chi tiết một yêu cầu đang chờ/đã điều phối | Danh sách hiển thị ưu tiên/trạng thái/SLA, mở "Xem tiến độ xử lý" thấy timeline | ☐ |
| G-11 | Yêu cầu của tôi | Bấm Hủy yêu cầu đang chờ, xác nhận | Trạng thái chuyển "Đã hủy", timeline thêm dòng "Khách hủy yêu cầu", nút hủy biến mất | ☐ |
| G-12 | Yêu cầu của tôi | Thử hủy yêu cầu đang xử lý/hoàn thành | Không hiển thị nút Hủy | ☐ |
| G-13 | Yêu cầu của tôi | Quan sát thứ tự mặc định | Mới nhất trước, dòng đếm "Đang hiển thị X/Y yêu cầu" đúng | ☐ |
| G-14 | Yêu cầu của tôi | Tìm theo tiêu đề/mô tả | Danh sách lọc đúng, không phân biệt hoa thường | ☐ |
| G-15 | Yêu cầu của tôi | Lọc theo trạng thái, sau đó theo ưu tiên | Danh sách và số đếm cập nhật đúng; kết hợp cả hai bộ lọc vẫn đúng | ☐ |
| G-16 | Yêu cầu của tôi | Đổi sắp xếp sang "Cũ nhất trước" | Thứ tự đảo ngược đúng | ☐ |
| G-17 | Yêu cầu của tôi | Nhập từ khóa không tồn tại | Hiện trạng thái rỗng "Không tìm thấy yêu cầu phù hợp" + nút "Xóa bộ lọc" hoạt động | ☐ |

## 8. Khu Nhân viên

| ID | Màn hình | Thao tác | Kết quả mong đợi | KQ |
|---|---|---|---|---|
| S-01 | Bảng nhiệm vụ | `nhanvien` đăng nhập | Có 3 cột Cần nhận / Đang xử lý / Hoàn thành, số lượng đúng với nhiệm vụ của mình | ☐ |
| S-02 | Bảng nhiệm vụ | Tìm theo tiêu đề/mô tả, lọc ưu tiên | Danh sách và dòng đếm cập nhật đúng | ☐ |
| S-03 | Bảng nhiệm vụ | Lọc ra kết quả rỗng | Hiện empty state + nút "Xóa bộ lọc" khôi phục danh sách | ☐ |
| S-04 | Bảng nhiệm vụ | Bấm "Bắt đầu" ở nhiệm vụ Cần nhận | Nhiệm vụ sang Đang xử lý; yêu cầu tương ứng của khách cũng sang Đang xử lý; timeline ghi nhân viên bắt đầu | ☐ |
| S-05 | Bảng nhiệm vụ | Bấm "Hoàn thành" | Nhiệm vụ sang Hoàn thành, yêu cầu khách sang Hoàn thành và có `completedAt`; hiện toast | ☐ |
| S-06 | Bảng nhiệm vụ | Bấm "Từ chối" và xác nhận | Nhiệm vụ bị từ chối, yêu cầu quay lại hàng chờ điều phối, bỏ gán nhân viên | ☐ |
| S-07 | Chi tiết nhiệm vụ | Mở từ nút Chi tiết | Hiển thị thông tin yêu cầu, khách/phòng, SLA, timeline và nút hành động đúng trạng thái | ☐ |
| S-08 | Chi tiết nhiệm vụ | Nhập ghi chú rồi Lưu, sau đó F5 | Ghi chú còn nguyên trong hồ sơ nhiệm vụ | ☐ |
| S-09 | Chi tiết nhiệm vụ | Mở URL với `id` không tồn tại | Hiện trạng thái lỗi/không tìm thấy kèm đường quay lại, không vỡ trang | ☐ |
| S-10 | Ca làm việc | Mở trang | Có 3 tab Lịch ca / Báo cáo đã gửi / Yêu cầu đổi ca, số đếm đúng | ☐ |
| S-11 | Ca làm việc | Gửi báo cáo ca khi bỏ trống tóm tắt | Hiện lỗi bắt buộc, không gửi | ☐ |
| S-12 | Ca làm việc | Gửi báo cáo ca hợp lệ | Báo cáo xuất hiện ở tab "Báo cáo ca đã gửi" và ở trang quản lý ca | ☐ |
| S-13 | Ca làm việc | Gửi đề xuất đổi ca khi bỏ trống lý do | Hiện lỗi, không gửi | ☐ |
| S-14 | Ca làm việc | Gửi đề xuất đổi ca hợp lệ | Đề xuất ở trạng thái chờ duyệt; quản lý thấy trong tab Đề xuất đổi ca | ☐ |
| S-15 | Ca làm việc | Xem chi tiết báo cáo đã gửi | Dialog hiển thị đủ tóm tắt, sự cố, bàn giao, trạng thái ca | ☐ |

## 9. Khu Quản lý

| ID | Màn hình | Thao tác | Kết quả mong đợi | KQ |
|---|---|---|---|---|
| M-01 | Điều phối | Mở trang | Thống kê/tab Chờ điều phối – Đang xử lý – Hoàn thành – Đổi ca có số đếm đúng | ☐ |
| M-02 | Điều phối | Chuyển tab, lọc theo bộ phận | Danh sách đúng tab + đúng bộ phận, số đếm cập nhật | ☐ |
| M-03 | Điều phối | Lọc theo mức ưu tiên | Chỉ còn yêu cầu đúng mức; kết hợp bộ phận vẫn đúng | ☐ |
| M-04 | Điều phối | Lọc rỗng | Empty state + nút xóa bộ lọc khôi phục cả bộ phận và ưu tiên | ☐ |
| M-05 | Điều phối | Bấm "AI gợi ý ưu tiên" với yêu cầu có từ "gấp"/khách VIP/SLA gần | AI đề xuất mức cao/khẩn cấp kèm lý do; Chấp nhận lưu mức + cờ dùng AI + timeline | ☐ |
| M-06 | Điều phối | Bấm AI gợi ý với yêu cầu không có dấu hiệu ưu tiên | Hiện badge "AI chưa chắc chắn", đề xuất Trung bình kèm cảnh báo | ☐ |
| M-07 | Điều phối | Bấm "Tự chỉnh", chọn mức khác rồi Lưu | Mức ưu tiên cập nhật, cờ `aiPriorityUsed` là false | ☐ |
| M-08 | Điều phối | Mở dialog điều phối rồi Esc/Hủy | Không tạo nhiệm vụ, không đổi trạng thái yêu cầu | ☐ |
| M-09 | Điều phối | Điều phối cho một nhân viên | Yêu cầu sang Đã điều phối, tạo nhiệm vụ mới, nhân viên thấy ngay; log được ghi | ☐ |
| M-10 | Điều phối | Duyệt một đề xuất đổi ca | Đề xuất sang Đã duyệt, số chờ duyệt giảm, nhân viên thấy trạng thái mới | ☐ |
| M-11 | Điều phối | Từ chối một đề xuất đổi ca | Đề xuất sang Bị từ chối, ca làm không đổi | ☐ |
| M-12 | Xếp ca | Mở trang | 4 thẻ thống kê + 3 tab Lịch phân ca / Đề xuất đổi ca / Báo cáo ca làm đúng số liệu | ☐ |
| M-13 | Xếp ca | Bấm "Xếp ca mới" rồi bỏ trống trường bắt buộc | Hiện lỗi tại trường, không tạo ca | ☐ |
| M-14 | Xếp ca | Tạo ca hợp lệ | Ca mới hiện trong bảng đúng nhân viên/ngày/giờ; nhân viên thấy trong Ca làm việc | ☐ |
| M-15 | Xếp ca | Sửa một ca rồi lưu | Thông tin ca cập nhật, không tạo bản trùng | ☐ |
| M-16 | Xếp ca | Xóa ca và xác nhận | Ca biến mất, thống kê cập nhật; hủy xác nhận thì ca giữ nguyên | ☐ |
| M-17 | Xếp ca | Lọc theo bộ phận/ngày | Danh sách đúng điều kiện; lọc rỗng có empty state | ☐ |
| M-18 | Xếp ca | Mở tab Báo cáo ca làm | Thấy báo cáo nhân viên đã gửi, bấm xem được chi tiết | ☐ |
| M-19 | Theo dõi SLA | Mở trang | 3 thẻ Đang xử lý / Sắp trễ / Đã trễ đúng; bảng sắp theo hạn SLA | ☐ |
| M-20 | Theo dõi SLA | Lọc bộ phận/trạng thái, chọn tổ hợp rỗng | Bảng lọc đúng, thanh SLA đổi màu theo mức, tổ hợp rỗng có empty state | ☐ |
| M-21 | Báo cáo | Mở trang | 4 thẻ thống kê, biểu đồ theo loại dịch vụ, danh sách phản hồi đúng dữ liệu | ☐ |
| M-22 | Báo cáo | Bấm "Tóm tắt phản hồi" | Có trạng thái đang xử lý; kết quả gồm 3 chủ đề, số lần, ví dụ, điểm TB, giải thích | ☐ |
| M-23 | Báo cáo | Chạy AI-3 khi có dưới 3 phản hồi | Báo "Không đủ dữ liệu để tóm tắt", có nút Thử lại/Bỏ qua | ☐ |
| M-24 | Báo cáo | Chạy AI-3 với phản hồi không chứa từ khóa chủ đề | Báo "AI chưa chắc chắn", không hiện kết quả sai | ☐ |
| M-25 | Báo cáo | Bấm "Lưu nhận xét" | Kết quả vào mục "Nhận xét AI đã lưu", ghi người lưu/thời gian; F5 vẫn còn | ☐ |
| M-26 | Loại dịch vụ | Thêm loại mới với SLA ngoài 5–240 | Báo lỗi SLA, không lưu | ☐ |
| M-27 | Loại dịch vụ | Thêm/sửa loại hợp lệ | Danh sách cập nhật; loại mới xuất hiện trong biểu mẫu tạo yêu cầu của khách | ☐ |
| M-28 | Loại dịch vụ | Vô hiệu hóa rồi kích hoạt lại | Trạng thái đổi đúng; loại bị vô hiệu hóa không còn trong ô chọn của khách | ☐ |
| M-29 | Nhân sự | Bấm "Tạo tài khoản nhân viên", bỏ trống/trùng tên/mật khẩu ngắn | Hiện lỗi tại từng trường, không tạo tài khoản | ☐ |
| M-30 | Nhân sự | Tạo nhân viên hợp lệ | Tài khoản mới xuất hiện trong danh sách, hồ sơ `staff` được tạo, nhân viên đăng nhập được | ☐ |
| M-31 | Nhân sự | Đổi vị trí một nhân viên | Bộ phận cập nhật trong bảng và trong danh sách điều phối | ☐ |
| M-32 | Nhân sự | Vô hiệu hóa nhân viên | Nhân viên bị rút khỏi danh sách điều phối, không đăng nhập được; nhiệm vụ cũ vẫn hiện đúng tên | ☐ |
| M-33 | Nhân sự | Tìm theo tài khoản/họ tên, lọc vai trò | Danh sách và dòng đếm "Đang hiển thị X/Y tài khoản" đúng; từ khóa không khớp có empty state + nút xóa bộ lọc | ☐ |

## 10. Khu Quản trị

| ID | Màn hình | Thao tác | Kết quả mong đợi | KQ |
|---|---|---|---|---|
| D-01 | Bảng điều khiển | Mở trang | Thẻ tổng tài khoản/nhân viên/quản lý/bị vô hiệu hóa đúng; hiện phiên bản + trạng thái bảo trì + log gần đây | ☐ |
| D-02 | Bảng điều khiển | Bấm "Đặt lại dữ liệu demo" rồi Hủy | Không có gì thay đổi | ☐ |
| D-03 | Bảng điều khiển | Bấm đặt lại rồi xác nhận | Toàn bộ dữ liệu về seed, phiên đăng xuất, quay về trang đăng nhập | ☐ |
| D-04 | Tài khoản | Mở trang | Danh sách tài khoản đầy đủ, tài khoản admin hiện "Bạn" và bị khóa chỉnh sửa | ☐ |
| D-05 | Tài khoản | Tìm theo tên đăng nhập/họ tên | Lọc đúng, số đếm đúng | ☐ |
| D-06 | Tài khoản | Lọc theo vai trò | Chỉ hiện đúng vai trò, số đếm đúng | ☐ |
| D-07 | Tài khoản | Sắp xếp mới/cũ/tên A→Z | Thứ tự đúng cả 3 kiểu | ☐ |
| D-08 | Tài khoản | Nhập điều kiện không có kết quả | Empty state + nút "Xóa bộ lọc" reset cả từ khóa, vai trò, sắp xếp | ☐ |
| D-09 | Tài khoản | Tạo tài khoản thiếu trường/trùng tên/mật khẩu ngắn | Hiện lỗi tại trường, không tạo | ☐ |
| D-10 | Tài khoản | Tạo tài khoản hợp lệ với role bất kỳ | Tài khoản xuất hiện trong danh sách, đăng nhập được đúng role | ☐ |
| D-11 | Tài khoản | Sửa role của một tài khoản | Role cập nhật, menu/trang đích tương ứng thay đổi sau khi đăng nhập lại | ☐ |
| D-12 | Tài khoản | Vô hiệu hóa một tài khoản đang đăng nhập ở tab khác | Tài khoản bị chặn ở lần tải trang kế tiếp, không truy cập được khu bảo vệ | ☐ |
| D-13 | Cập nhật hệ thống | Gửi bản tin với tiêu đề/nội dung quá ngắn | Hiện lỗi tại ô, không đăng | ☐ |
| D-14 | Cập nhật hệ thống | Đăng bản tin/bản cập nhật hợp lệ | Bản ghi xuất hiện đầu danh sách, đúng loại và người đăng | ☐ |
| D-15 | Cập nhật hệ thống | Sửa rồi xóa một bản ghi | Nội dung cập nhật đúng; xóa có xác nhận và bản ghi biến mất | ☐ |
| D-16 | Cập nhật hệ thống | Bật rồi tắt bảo trì | Nút đổi trạng thái, banner bảo trì xuất hiện/biến mất trên các trang khác | ☐ |
| D-17 | Cập nhật hệ thống | Xóa hết bản tin/bản cập nhật | Hiện empty state hướng dẫn đăng bản đầu tiên | ☐ |

## 11. Trải nghiệm AI

| ID | Màn hình | Thao tác | Kết quả mong đợi | KQ |
|---|---|---|---|---|
| AI-01 | Trợ lý AI | `khach` mở trợ lý, hỏi "yêu cầu của tôi" | Trả lời dựa trên dữ liệu thật của khách, có link mở đúng trang | ☐ |
| AI-02 | Trợ lý AI | `nhanvien` mở trợ lý | Gợi ý công việc/nhiệm vụ gấp nhất, không lộ dữ liệu quản trị | ☐ |
| AI-03 | Trợ lý AI | `quanly` mở trợ lý | Gợi ý điều phối/SLA/báo cáo, số liệu khớp dữ liệu hiện tại | ☐ |
| AI-04 | Trợ lý AI | `admin` hỏi về yêu cầu vận hành | Trả lời từ chối phạm vi, chỉ hướng dẫn quản lý tài khoản/cập nhật hệ thống | ☐ |
| AI-05 | AI-1 | Quan sát luồng thành công | Đủ 5 bước: nhập → đang xử lý → kết quả → giải thích → người dùng chấp nhận/từ chối/chọn tay | ☐ |
| AI-06 | AI-1 | Mô tả dưới 10 ký tự và mô tả không từ khóa | Hai thông báo khác nhau: "Không đủ dữ liệu" và "AI chưa chắc chắn"; đều có Thử lại/Chọn thủ công | ☐ |
| AI-07 | AI-2 | Quan sát luồng gợi ý ưu tiên | Có badge mức, lý do, 3 lựa chọn Chấp nhận/Tự chỉnh/Từ chối | ☐ |
| AI-08 | AI-2 | Chạy với yêu cầu không có dấu hiệu ưu tiên | Badge "AI chưa chắc chắn" hiển thị rõ, không tự áp dụng | ☐ |
| AI-09 | AI-3 | Quan sát luồng tóm tắt | Có trạng thái đang xử lý, kết quả chủ đề + ví dụ + điểm TB, có Tạo lại/Đóng | ☐ |
| AI-10 | AI-3 | Chạy khi thiếu dữ liệu hoặc phản hồi không có chủ đề | Hiện đúng thông báo thất bại tương ứng, có Thử lại/Bỏ qua | ☐ |
| AI-11 | Tất cả AI | Ngắt mạng/hard reload rồi chạy lại | AI mô phỏng vẫn hoạt động vì chạy phía client, không gọi API ngoài | ☐ |
| AI-12 | Tất cả AI | Bấm Từ chối/Bỏ qua/Đóng ở từng panel | Không thay đổi dữ liệu, panel đóng, focus không bị kẹt | ☐ |

## 12. Dữ liệu và lưu trữ

| ID | Màn hình | Thao tác | Kết quả mong đợi | KQ |
|---|---|---|---|---|
| DB-01 | Lần chạy đầu | Xóa toàn bộ localStorage của origin rồi mở lại | Dữ liệu seed tự tạo, đủ 4 tài khoản demo và dữ liệu mẫu | ☐ |
| DB-02 | Tất cả | Tạo/sửa dữ liệu rồi F5 | Thay đổi còn nguyên sau khi tải lại | ☐ |
| DB-03 | Liên vai trò | Khách tạo yêu cầu → quản lý điều phối → nhân viên hoàn thành → khách xem | Trạng thái đồng bộ đúng ở cả 3 khu, không cần tải lại thủ công | ☐ |
| DB-04 | Đặt lại | Gọi đặt lại dữ liệu demo | Mọi key `stayflow:*` bị xóa (kể cả phiên, nhận xét AI đã lưu, log), sau đó seed lại | ☐ |
| DB-05 | Phiên | Đăng nhập rồi F5 ở trang bảo vệ | Vẫn giữ đăng nhập đúng tài khoản | ☐ |
| DB-06 | Phiên | Xóa key `stayflow:session` bằng DevTools rồi F5 | Bị đưa về trang đăng nhập, không lỗi | ☐ |
| DB-07 | Tài khoản | Vô hiệu hóa tài khoản đang có phiên | Lần tải trang sau bị coi như không hợp lệ, không vào được khu bảo vệ | ☐ |
| DB-08 | Log | Thực hiện tạo/đổi role/điều phối/xóa | Log tương ứng xuất hiện ở bảng điều khiển admin, đúng người thực hiện | ☐ |

## 13. Khả năng tiếp cận (Accessibility)

| ID | Màn hình | Thao tác | Kết quả mong đợi | KQ |
|---|---|---|---|---|
| U-01 | Tất cả | Chỉ dùng Tab để đi qua trang | Mọi link/nút/ô nhập đều nhận focus, thứ tự hợp lý | ☐ |
| U-02 | Tất cả | Tab tới link/nút/ô nhập | Có viền focus rõ ràng (`:focus-visible`), không bị mất khi dùng chuột | ☐ |
| U-03 | Form | Kiểm tra nhãn | Mọi ô nhập có `<label>` hoặc `aria-label`; thông báo lỗi nằm cạnh ô | ☐ |
| U-04 | Dialog | Mở dialog rồi bấm Tab/Shift+Tab | Focus quẩn trong dialog, không nhảy ra nền | ☐ |
| U-05 | Dialog | Mở dialog rồi Esc | Dialog đóng, không lưu, focus trả về nút đã mở | ☐ |
| U-06 | Confirm | Mở hộp xác nhận rồi Esc | Trả về "Hủy", focus trả về nút đã mở | ☐ |
| U-07 | Danh sách | Đổi bộ lọc/sắp xếp | Dòng đếm kết quả có `aria-live` và cập nhật nội dung | ☐ |
| U-08 | Bàn phím | Hoàn thành đăng nhập + tạo yêu cầu chỉ bằng bàn phím | Toàn bộ luồng làm được, không cần chuột | ☐ |
| U-09 | Empty state | Mở trạng thái rỗng có CTA | CTA là button/link thật, Tab tới được và bấm được | ☐ |
| U-10 | Cấu trúc | Kiểm tra heading | Mỗi trang có đúng một `h1`, heading phụ theo thứ tự hợp lý | ☐ |

## 14. Responsive

| ID | Kích thước | Thao tác | Kết quả mong đợi | KQ |
|---|---|---|---|---|
| R-01 | 1280px | Mở 4 trang đại diện 4 role | Bố cục desktop, menu ngang đầy đủ, không tràn ngang | ☐ |
| R-02 | 1024px | Mở lại 4 trang | Nội dung co vừa, không cắt nút, không tràn ngang | ☐ |
| R-03 | 768px | Mở lại 4 trang | Menu thu gọn, lưới chuyển 1–2 cột hợp lý, không tràn ngang | ☐ |
| R-04 | 375px | Mở lại 4 trang | Bố cục 1 cột, chữ và nút đọc/bấm được, không tràn ngang | ☐ |
| R-05 | 320px | Mở trang có bảng và form | Không tràn ngang toàn trang; bảng cuộn trong khung riêng | ☐ |
| R-06 | ≤768px | Bấm nút ☰ trên topbar | Menu mở/đóng, các link bấm được, không che nút đăng xuất | ☐ |
| R-07 | 375px | Mở trang có bảng (SLA, nhân sự, ca làm) | Bảng cuộn ngang trong khung, không phá layout | ☐ |
| R-08 | 375px | Mở dialog điều phối/xếp ca | Dialog vừa màn hình, các trường và nút bấm được | ☐ |
| R-09 | Desktop | Zoom trình duyệt 200% | Không mất nội dung, không chồng chữ, vẫn thao tác được | ☐ |

## 15. Kiểm thử đầu-cuối (End-to-End)

| ID | Kịch bản | Các bước | Kết quả mong đợi | KQ |
|---|---|---|---|---|
| E-01 | Luồng chuẩn | Khách tạo yêu cầu → Quản lý dùng AI-2 rồi điều phối → Nhân viên bắt đầu/hoàn thành → Khách xem → Quản lý chạy AI-3 | Trạng thái, timeline, SLA, báo cáo và nhận xét AI đồng bộ đúng ở mọi bước | ☐ |
| E-02 | Nhân viên từ chối | Quản lý điều phối → Nhân viên từ chối → Quản lý điều phối lại cho người khác | Yêu cầu quay lại hàng chờ, điều phối lại thành công, không tạo nhiệm vụ trùng | ☐ |
| E-03 | Khách hủy | Khách tạo yêu cầu rồi hủy trước khi nhân viên bắt đầu | Quản lý không còn thấy yêu cầu trong hàng chờ; nhân viên không nhận được nhiệm vụ | ☐ |
| E-04 | Đổi ca | Nhân viên gửi đề xuất → Quản lý duyệt → Nhân viên xem lại | Trạng thái đề xuất và thông báo đúng; số chờ duyệt giảm | ☐ |
| E-05 | Vô hiệu hóa dịch vụ | Quản lý vô hiệu hóa một loại dịch vụ → Khách mở form tạo yêu cầu | Loại dịch vụ không còn trong ô chọn; yêu cầu cũ vẫn hiển thị đúng tên | ☐ |
| E-06 | Bảo trì | Admin bật bảo trì → đi qua các trang → tắt bảo trì | Banner xuất hiện/biến mất nhất quán, không ảnh hưởng chức năng khác | ☐ |

## 16. Mẫu ghi nhận lỗi

| Mã lỗi | Test case | Môi trường | Bước tái hiện | Kết quả thực tế | Kỳ vọng | Mức độ | Trạng thái |
|---|---|---|---|---|---|---|---|
| BUG-01 | | | | | | P0/P1/P2 | Mới/Đang sửa/Đã sửa/Đóng |
| BUG-02 | | | | | | | |

**Ảnh/video minh chứng:** lưu trong thư mục `evidence/` hoặc dán link video OBS tương ứng.

## 17. Kết quả chạy thử gần nhất

**Ngày chạy:** 27-10-2026 · **Trình duyệt:** Chromium (Qoder Desktop, viewport 905×785) · **Dữ liệu:** seed + vài thay đổi trong lúc kiểm thử

| Hạng mục | Cách kiểm tra | Kết quả |
|---|---|---|
| 4 vai trò, 15 trang nghiệp vụ + 5 trang chung | Mở từng trang, kiểm tra DOM + Console | Đạt: có `main`, footer đúng 1, `h1`, không lỗi console |
| Tìm/lọc/sắp xếp/đếm kết quả | Nhập từ khóa, đổi bộ lọc, kiểm tra số đếm | Đạt ở khách, nhân viên, điều phối, tài khoản |
| Tìm/lọc/đếm ở Quản lý nhân sự | Tìm `nhan` → 1/4, lọc `staff` → 1/4, lọc `manager` → 1/4 (không có nút sửa), tìm `zzzz` → 0/4 + empty, bấm "Xóa bộ lọc" → 4/4 | Đạt, không lỗi console, iframe 375px không tràn ngang |
| Empty state + CTA xóa bộ lọc | Lọc ra rỗng rồi bấm CTA | Đạt, CTA là button, khôi phục danh sách |
| AI-1/AI-2/AI-3 | Chạy luồng thành công + không chắc chắn + thiếu dữ liệu | Đạt, đúng thông báo và có điều khiển |
| AI-3 lưu nhận xét | Lưu rồi tải lại trang | Đạt, dữ liệu còn trong `aiSummaries` và hiển thị ở mục đã lưu |
| Dialog bằng bàn phím | Esc, Tab/Shift+Tab, kiểm tra focus | Đạt: đóng bằng Esc, focus quẩn trong dialog, trả focus về nút mở |
| `:focus-visible` | Tab qua link/ô lọc | Đạt: viền 3px màu coral/mint hiển thị |
| Responsive | iframe 375 / 768 / 1024px cho các trang role | Đạt: không tràn ngang, menu thu gọn ≤768px |
| Refactor CSS variables | So sánh computed-style 101 phần tử trước/sau | Đạt: 0 khác biệt |
| Đặt lại dữ liệu | Gọi đặt lại từ admin | Đạt: xóa toàn bộ key `stayflow:*` rồi seed lại |

**Hạn chế của lần chạy trên:**
- Chưa kiểm thử trên thiết bị thật; responsive được kiểm tra bằng iframe với chiều rộng 375/768/1024px.
- Chưa kiểm thử zoom 200% và trình duyệt Firefox/Safari thật.
- Các trường hợp cần dữ liệu đặc biệt (dưới 3 phản hồi, không có ca làm, không có nhân viên cùng bộ phận) chưa chạy hết trong một phiên liên tục.

## 18. Việc cần làm sau kiểm thử

- [ ] Chạy lại toàn bộ checklist trên Chrome, Edge, Firefox.
- [ ] Chụp ảnh hoặc quay video OBS cho từng màn hình theo quy ước `SV?-??-screen-name.mp4`.
- [ ] Ghi kết quả vào cột **KQ** và cập nhật bảng lỗi.
- [ ] Chỉ tạo PR khi tất cả test case P0 đạt.
- [ ] Cập nhật `docs/ai-usage-report.md` và link video vào `README.md`.
