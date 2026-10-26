// StayFlow – Khu Quản trị: xác thực, khung trang và nhãn vai trò dùng chung
// Nguyên tắc: Admin KHÔNG truy cập dữ liệu vận hành (yêu cầu, nhiệm vụ, lưu trú, phản hồi).
(function () {
  const page = document.body.dataset.page || '';
  if (!page.startsWith('admin-')) return;
  const user = Auth.require(['admin']);
  if (!user) return;
  UI.init(page);

  const roleText = { guest: 'Khách lưu trú', staff: 'Nhân viên', manager: 'Quản lý', admin: 'Quản trị viên' };

  window.AdminApp = { user, roleText };
})();
