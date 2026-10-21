// StayFlow – Xác thực & phân quyền (mô phỏng phía frontend)
// Quy tắc: ai đăng nhập cũng vào web khách (user); các khu nhân viên/quản lý/admin
// chỉ mở khi tài khoản được cấp role tương ứng.

const Auth = {
  SESSION_KEY: 'stayflow:session',

  current() {
    try {
      const id = JSON.parse(localStorage.getItem(this.SESSION_KEY));
      if (!id) return null;
      return Store.get('users').find(u => u.id === id && u.status === 'active') || null;
    } catch (e) {
      return null;
    }
  },

  login(username, password) {
    const uname = String(username || '').trim().toLowerCase();
    const u = Store.get('users').find(x => x.username === uname);
    if (!u || u.password !== password) {
      return { ok: false, message: 'Sai tên đăng nhập hoặc mật khẩu.' };
    }
    if (u.status !== 'active') {
      return { ok: false, message: 'Tài khoản đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.' };
    }
    this.startSession(u);
    return { ok: true, user: u };
  },

  startSession(u) { localStorage.setItem(this.SESSION_KEY, JSON.stringify(u.id)); },

  logout() {
    localStorage.removeItem(this.SESSION_KEY);
    location.href = 'login.html';
  },

  // Trả về user nếu hợp lệ; ngược lại tự chuyển trang: chưa đăng nhập -> login, sai role -> 403
  require(roles) {
    const u = this.current();
    if (!u) { location.href = 'login.html'; return null; }
    if (roles !== 'any' && !roles.includes(u.role)) { location.href = '403.html'; return null; }
    return u;
  },

  roleLabel(u) {
    if (!u) return '';
    if (u.role === 'staff') {
      const d = DEPARTMENTS[u.position];
      return 'Nhân viên · ' + (d ? d.name : 'Chưa gán vị trí');
    }
    return { guest: 'Khách lưu trú', manager: 'Quản lý', admin: 'Quản trị viên' }[u.role] || u.role;
  },

  // Trang chính của từng vai trò (dùng cho nút "Khu vực làm việc")
  homeFor(u) {
    const map = {
      guest: 'guest-dashboard.html',
      staff: 'staff-task-board.html',
      manager: 'manager-dispatch-board.html',
      admin: 'admin-dashboard.html'
    };
    return map[u.role] || 'guest-dashboard.html';
  },

  // Hồ sơ nhân viên gắn với tài khoản (bảng staff)
  staffProfile(u) {
    if (!u) return null;
    return Store.get('staff').find(s => s.userId === u.id) || null;
  }
};
