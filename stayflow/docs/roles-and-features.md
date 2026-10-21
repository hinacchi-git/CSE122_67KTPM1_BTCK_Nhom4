# Vai trò, quyền hạn & tính năng – StayFlow

## 1. Mô hình 3 nhóm vai trò

Tất cả tài khoản đăng nhập đều vào **web Khách (user)** trước. Các khu khác chỉ "kích hoạt" khi tài khoản được cấp role tương ứng (bởi Quản trị viên; riêng vị trí nhân viên do Quản lý cấp).

```
Đăng nhập ──▶ Web Khách (user) ──▶ Khu Nhân viên (role staff)
                      │──────────▶ Khu Quản lý   (role manager)
                      └──────────▶ Khu Quản trị  (role admin)
```

| Role | Vị trí / ghi chú | Quyền chính | Không được |
|---|---|---|---|
| `guest` – Khách lưu trú | Tài khoản mặc định khi đăng ký | Tạo/yêu cầu/hủy yêu cầu dịch vụ, xem tiến độ, timeline, SLA | Vào khu nhân viên trở lên |
| `staff` – Nhân viên | 4 vị trí: `housekeeping` Buồng phòng, `roomservice` Ăn uống, `maintenance` Bảo trì, `frontdesk` Lễ tân | Xem nhiệm vụ được điều phối, bắt đầu/hoàn thành/từ chối, ghi chú, xem ca, đề xuất đổi ca | Xem nhiệm vụ của người khác, điều phối, quản lý tài khoản |
| `manager` – Quản lý | Quản lý khách sạn | Điều phối (gán nhân viên), theo dõi SLA, báo cáo, quản lý loại dịch vụ, **tạo tài khoản nhân viên + cấp/đổi vị trí + vô hiệu hóa tài khoản Khách/Nhân viên**, duyệt đổi ca | Cấp vai trò Quản lý / Quản trị viên; sửa tài khoản Admin/Quản lý |
| `admin` – Quản trị viên | Cấp quyền tối cao về tài khoản | Tạo tài khoản mọi vai trò, cấp/đổi role, vô hiệu hóa, đăng bản tin, bật bảo trì, xem nhật ký phân quyền | **Mọi dữ liệu vận hành**: yêu cầu, nhiệm vụ, lưu trú, phản hồi, SLA, loại dịch vụ |

Quy tắc chặn truy cập được thực hiện tại 2 lớp:

1. **Điều hướng**: menu chỉ hiển thị link khu vực tương ứng role.
2. **Bảo vệ trang** (`Auth.require`): mở trực tiếp URL sai role → chuyển `403.html`; chưa đăng nhập → `login.html`. Tài khoản bị vô hiệu hóa không đăng nhập được và phiên hiện tại bị coi là đã hết.

## 2. Tài khoản demo (4 tài khoản – mật khẩu chung: `123456`)

| Tên đăng nhập | Vai trò | Dùng để truy cập |
|---|---|---|
| `khach` | Khách lưu trú – phòng 502 (VIP) | 3 trang khu Khách |
| `nhanvien` | Nhân viên – Buồng phòng | 3 trang khu Khách + 3 trang khu Nhân viên |
| `quanly` | Quản lý | 3 trang khu Khách + 5 trang khu Quản lý |
| `admin` | Quản trị viên | 3 trang khu Khách (trống dữ liệu lưu trú) + 3 trang khu Quản trị |

## 3. Thực thể dữ liệu & CRUD

| Thực thể | Tệp nguồn | C | R | U | D/Lưu trữ | Ghi chú |
|---|---|---|---|---|---|---|
| `users` | `js/data.js` | ✔ (đăng ký, Quản lý, Admin) | ✔ | ✔ (role, vị trí, mật khẩu) | ✔ (vô hiệu hóa) | Nhật ký vào `systemLogs` |
| `serviceTypes` | `js/data.js` | ✔ (Quản lý) | ✔ | ✔ | ✔ (vô hiệu hóa) | Kèm SLA theo dịch vụ |
| `stays` | `js/data.js` | – | ✔ | – | – | Dữ liệu giả lập |
| `requests` | `js/data.js` | ✔ (Khách) | ✔ | ✔ (trạng thái, ưu tiên, hủy) | ✔ (hủy) | Timeline đầy đủ, cờ `aiClassified`, `aiPriorityUsed` |
| `tasks` | `js/data.js` | ✔ (Quản lý điều phối) | ✔ | ✔ (trạng thái, ghi chú) | – | Từ chối → yêu cầu quay lại hàng chờ |
| `feedback` | `js/data.js` | – | ✔ | – | – | Dữ liệu cho AI-3 |
| `staff`, `shifts` | `js/data.js` | ✔ (tự động khi tạo tài khoản NV) | ✔ | ✔ (đồng bộ theo tài khoản) | – (chuyển `off`) | Hồ sơ nhân viên + lịch ca |
| `swapRequests` | `js/data.js` | ✔ (Nhân viên) | ✔ | ✔ (Quản lý duyệt/từ chối) | – | Luồng phê duyệt |
| `systemLogs` | `js/data.js` | ✔ (bản tin/cập nhật) | ✔ | ✔ | ✔ | Log phân quyền dùng chung |

> **Đồng bộ hồ sơ nhân viên (`syncStaffProfile`):** bảng điều phối của Quản lý và bảng nhiệm vụ của Nhân viên đọc từ bảng `staff`, riêng bảng `users`. Vì vậy mọi thao tác tạo / sửa role & vị trí / đổi trạng thái tài khoản (ở cả khu Quản lý lẫn khu Quản trị) đều gọi `syncStaffProfile(u)` trong `js/data.js` để:
> - tài khoản Nhân viên mới → tự tạo hồ sơ `staff` tương ứng (tên, vị trí, trạng thái), sẵn sàng nhận điều phối;
> - đổi vị trí / đổi tên → cập nhật hồ sơ;
> - vô hiệu hóa hoặc đổi sang role khác → hồ sơ chuyển `off` (không xóa, nhiệm vụ cũ vẫn hiển thị đúng tên) và tự rút khỏi danh sách điều phối.

## 4. Trải nghiệm AI (đủ luồng: Nhập → Đang xử lý → Kết quả → Giải thích → Kiểm soát → Lưu)

| Tính năng | Vị trí | Kết quả tác động | Trạng thái thất bại |
|---|---|---|---|
| **Trợ lý AI theo vai trò** (chat nổi, mọi trang) | nút ✨ góc phải | Gợi ý thao tác, dẫn link đúng trang, tổng hợp dữ liệu thật của user | "Không đủ dữ liệu để đưa ra đề xuất" + Thử lại / Xem gợi ý; với Admin: nhắc rõ không được xem dữ liệu vận hành |
| **AI-1 Phân loại yêu cầu** | `guest-service-request.html` | Chấp nhận → tự điền loại dịch vụ, gắn cờ `aiClassified` | Mô tả < 10 ký tự → "Không đủ dữ liệu"; không khớp từ khóa → "AI chưa chắc chắn" (chọn tay) |
| **AI-2 Gợi ý ưu tiên** | `manager-dispatch-board.html` | Chấp nhận/Tự chỉnh → ghi `priority` + cờ `aiPriorityUsed` + timeline | Không dấu hiệu → "AI chưa chắc chắn", đề xuất kèm cảnh báo |
| **AI-3 Tóm tắt phản hồi** | `manager-service-report.html` | Chủ đề nổi bật + số lần nhắc + ví dụ + điểm TB | < 3 phản hồi → "Không đủ dữ liệu" (thử lại / bỏ qua) |

Mọi tính năng AI đều là **mô phỏng quy tắc phía frontend** (không gọi API bên ngoài), có trạng thái "đang xử lý" rõ ràng và người dùng luôn có lựa chọn Chấp nhận / Sửa tay / Từ chối / Tạo lại.

## 5. Luồng nghiệp vụ chính (mô phỏng được từ đầu đến cuối)

```
Khách tạo yêu cầu (AI phân loại) → Quản lý gợi ý ưu tiên (AI) → Quản lý điều phối nhân viên
→ Nhân viên nhận/bắt đầu/hoàn thành (ghi chú) → Khách xem timeline + SLA → Khách/Quản lý đánh giá
→ Quản lý xem báo cáo + AI tóm tắt phản hồi
Ngang: Nhân viên đề xuất đổi ca → Quản lý duyệt/từ chối
Ngang: Admin/Quản lý cấp role → tài khoản mới vào đúng khu vực (hồ sơ nhân viên tự đồng bộ, nhận điều phối được ngay)
```
