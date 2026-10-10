# BÁO CÁO KHAI BÁO SỬ DỤNG AI TRONG DỰ ÁN (BTL-08)

> **Học phần:** PHÁT TRIỂN ỨNG DỤNG WEB CƠ BẢN – CSE122  
> **Dự án:** StayFlow – Điều phối dịch vụ trong thời gian lưu trú (Nhóm BTL-08)

---

## 1. Công Cụ AI Đã Sử Dụng

1. **Antigravity AI Agent & Google Gemini Models (Gemini 2.5 / 3.8 Flash):**
   - Hỗ trợ xây dựng kiến trúc thư mục, đề xuất bộ nhận diện thương hiệu Luxury Hospitality.
   - Hỗ trợ thiết kế logic mô phỏng 3 tính năng AI trên Frontend bằng JavaScript ES6+.
   - Soạn thảo khung tài liệu học phần và kịch bản demo trình chiếu.

---

## 2. Các Câu Lệnh (Prompt) Chính Đã Dùng

- *"Thiết kế hệ thống giao diện cho đề tài StayFlow BTL-08 với 4 vai trò (Khách, Nhân viên, Quản lý, Admin), bao gồm bảng kiểm kê màn hình vượt ngưỡng tối thiểu và mô phỏng 3 tính năng AI: Phân loại yêu cầu, Đánh giá ưu tiên khẩn cấp và Tóm tắt cảm xúc phản hồi."*
- *"Xây dựng mock engine LocalStorage cho phép đồng bộ thời gian thực giữa 4 vai trò mà không cần backend Node.js, có nút reset data phục vụ demo."*
- *"Tạo kịch bản trình chiếu khách hàng 6 bước trực quan theo hành trình khách VIP phòng 502."*

---

## 3. Phần Do AI Sinh Ra

- Cấu trúc khung xương HTML5 cho 19 trang giao diện.
- Bảng mã màu CSS hệ thống: Navy `#0f172a`, Emerald Teal `#0d9488`, Warm Gold `#d97706`.
- Mô-đun `stayflow-ai.js` với các thuật toán phân tích từ khóa tiếng Việt và tính toán điểm khẩn cấp.
- Mẫu dữ liệu ban đầu cho các thực thể: `rooms`, `services`, `staff`, `requests`, `tasks`, `feedback`.

---

## 4. Phần Sinh Viên Tự Chỉnh Sửa & Tối Ưu

- **Chuẩn hóa đường dẫn tương đối (Relative paths):** Xử lý hàm `getRootPath()` trong `stayflow-ui.js` để thanh Demo Bar hoạt động chính xác cả ở thư mục gốc (`index.html`) lẫn các thư mục con cấp 2 (`pages/guest/`, `pages/staff/`...).
- **Tối ưu hóa trải nghiệm Responsive:** Bổ sung CSS flex-wrap, media queries cho Kanban board và bảng điều phối để hiển thị hoàn hảo trên điện thoại thông minh của nhân viên buồng phòng.
- **Hiện thực hóa quy trình AI có kiểm soát:** Bổ sung trạng thái xử lý khi AI thất bại hoặc không chắc chắn (ví dụ: khi khách nhập từ quá ngắn như "Alo"), cung cấp nút cho phép người dùng tự chỉnh sửa phân loại bằng tay.
- **Tích hợp Live Storage Listener:** Bổ sung `window.addEventListener('stayflow_storage_updated')` để khi khách gửi yêu cầu thì bảng của quản lý tự động cập nhật ngay mà không cần ấn F5.

---

## 5. Lỗi AI Gặp Phải & Cách Sinh Viên Kiểm Chứng

- **Lỗi 1: Sai lệch đường dẫn thư mục cấp 2.**
  - *Hiện tượng:* Ban đầu các liên kết CSS và script trong thư mục `pages/guest/` bị lỗi 404 do dùng đường dẫn `./css/` thay vì `../../css/`.
  - *Khắc phục:* Sinh viên đã kiểm tra cấu trúc thư mục và chuẩn hóa toàn bộ đường dẫn về `../../css/` và `../../js/`.
- **Lỗi 2: Trạng thái AI bị cứng nhắc.**
  - *Hiện tượng:* AI phân loại ngay lập tức không có độ trễ, làm mất đi cảm giác "AI đang suy nghĩ" trong mắt khách hàng.
  - *Khắc phục:* Sinh viên đã bọc `setTimeout` từ 400ms – 700ms cùng spinner quay và thông báo giải thích lý do để tạo trải nghiệm AI thực tế.

---

## 6. Phân Định Tính Năng Mock vs API Thật

- **Mô phỏng (Mock):**
  - Cơ sở dữ liệu: Dùng `LocalStorage` giả lập máy chủ cơ sở dữ liệu thời gian thực.
  - AI Features: Sử dụng engine quy tắc phân tích từ khóa ngữ nghĩa tiếng Việt (Rule-based NLP & Weighted Scoring) chạy trực tiếp trên trình duyệt, không tốn chi phí gọi API đám mây nhưng vẫn bảo đảm 100% kịch bản demo và khả năng xử lý ngoại lệ.
- **Có thể mở rộng (Extensible):**
  - Kiến trúc `StayFlowAI` được thiết kế dạng Promise/Callback độc lập, có thể dễ dàng thay thế bằng cuộc gọi `fetch()` đến Gemini API thật hoặc OpenAI API khi đưa vào sản phẩm thương mại.

---

## 7. Điều Sinh Viên Học Được Qua Dự Án

1. Hiểu sâu sắc cách phân tích bài toán thực tế thành các vai trò, hành trình người dùng và bảng kiểm kê màn hình hoàn chỉnh.
2. Nắm vững kỹ thuật lập trình DOM, Event Handling và State Management bằng JavaScript thuần mà không phụ thuộc vào React/Vue.
3. Hiểu được nguyên tắc thiết kế trải nghiệm người dùng với AI (AI UX Patterns): Nhập -> Xử lý -> Kết quả -> Giải thích nguyên nhân -> Người dùng giữ quyền kiểm soát tối hậu.
