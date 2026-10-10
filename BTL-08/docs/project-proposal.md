# THUYẾT MINH ĐỀ TÀI BÀI TẬP LỚN: STAYFLOW (BTL-08)

> **Học phần:** PHÁT TRIỂN ỨNG DỤNG WEB CƠ BẢN – CSE122  
> **Nhóm thực hiện:** Nhóm 08 (3 sinh viên)  
> **Tên sản phẩm:** StayFlow – Điều phối dịch vụ trong thời gian lưu trú khách sạn

---

## 1. Tính Cấp Thiết & Bối Cảnh

Trong ngành kinh doanh khách sạn và resort cao cấp, sự hài lòng của khách hàng trong thời gian lưu trú (In-stay Experience) quyết định trực tiếp đến điểm số đánh giá trên các nền tảng OTA (TripAdvisor, Booking.com, Agoda) và tỷ lệ quay lại của khách hàng.

Hiện nay, phần lớn khách sạn vẫn sử dụng phương thức liên lạc truyền thống:
- Khách gọi số 0 trên máy bàn để kết nối lễ tân.
- Nhân viên lễ tân ghi chép ra sổ tay hoặc giấy note rồi gọi bộ đàm cho tổ buồng phòng / kỹ thuật.
- Khi vào giờ cao điểm (sáng trả phòng, trưa nhận phòng), đường dây máy bàn liên tục bận; phiếu yêu cầu dễ bị bỏ quên hoặc thất lạc.
- Khách hàng không có cách nào biết được yêu cầu của mình đang được xử lý hay chưa, dẫn đến sự sốt ruột và bức xúc.
- Cấp quản lý không có dữ liệu để đo lường chính xác thời gian hoàn thành công việc (SLA) và năng suất thực tế của từng nhân viên.

**StayFlow** ra đời như một giải pháp số hóa toàn diện khép kín trên nền tảng Web, kết nối thông suốt giữa Khách lưu trú, Bộ phận điều phối, Nhân viên hiện trường và Ban quản lý.

---

## 2. Mục Tiêu Dự Án

1. **Về mặt nghiệp vụ:** Xây dựng hệ thống điều phối dịch vụ có luồng tương tác thực tế giữa 4 vai trò (Khách, Nhân viên, Quản lý, Quản trị viên), giải quyết triệt để 4 vấn đề thất lạc - thiếu tiến độ - khó ưu tiên - thiếu insight.
2. **Về mặt công nghệ:** Vận dụng thuần thục các kỹ thuật Frontend nền tảng (HTML5 ngữ nghĩa, CSS3 Flexbox/Grid responsive hiện đại, JavaScript ES6+ xử lý DOM và LocalStorage).
3. **Về mặt đổi mới sáng tạo:** Tích hợp 3 tính năng AI mô phỏng đúng chuẩn trải nghiệm người dùng hiện đại: Phân loại yêu cầu ngôn ngữ tự nhiên, Đề xuất mức ưu tiên khẩn cấp và Tóm tắt sắc thái ý kiến khách hàng.

---

## 3. Kiến Trúc Vai Trò & Phân Công Nhiệm Vụ

| Sinh viên | Vai trò phụ trách chính | Trách nhiệm xuyên suốt |
|---|---|---|
| **SV1** | **Khách lưu trú (Guest)** | Hệ thống thiết kế UI/UX, bảng màu Luxury Hospitality, Responsive Mobile. |
| **SV2** | **Nhân viên vận hành (Staff) + CRUD Admin** | Cơ sở dữ liệu LocalStorage (`stayflow-db.js`), logic tương tác DOM, checklist SOP. |
| **SV3 (Nhóm trưởng)** | **Quản lý khách sạn (Manager) + Tích hợp Hub** | Thuật toán AI (`stayflow-ai.js`), Điều hướng thanh Demo Bar, tài liệu báo cáo & OBS. |

---

## 4. Danh Mục Thực Thể Dữ Liệu (Data Schema)

1. `rooms`: Quản lý danh sách phòng, tầng, hạng phòng, tình trạng lưu trú và phân hạng VIP.
2. `services`: Danh mục các gói dịch vụ (Dọn phòng, Kỹ thuật, Room Service, Giặt là, Tiền sảnh), bảng giá và chuẩn thời gian SLA theo phút.
3. `requests`: Các yêu cầu phát sinh từ khách lưu trú kèm trạng thái (`pending`, `in-progress`, `completed`, `cancelled`), mốc thời gian và giải thích của AI.
4. `tasks`: Nhiệm vụ phân bổ trực tiếp cho từng nhân viên kèm checklist công việc từng bước và ảnh minh chứng hoàn tất.
5. `feedback`: Đánh giá 5 sao, tiêu chí ấn tượng và nhận xét bằng chữ của khách sau khi dịch vụ được hoàn thành.
6. `staff / users`: Tài khoản người dùng và thông tin phân ca trực.
