// StayFlow – Dữ liệu giả lập, lưu bằng localStorage
// Mọi thay đổi (tạo yêu cầu, điều phối, cấp role...) chỉ nằm trên máy người dùng.

function appUrl(path) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('#') || path.startsWith('javascript:')) return path;
  const p = window.location.pathname.replace(/\\/g, '/');
  const isSub = /\/(guest|staff|manager|admin)(\/|$)/i.test(p);
  const clean = path.replace(/^\.?\//, '');
  return (isSub ? '../' : '') + clean;
}

function nowMinus(min) { return Date.now() - min * 60000; }
function newId(prefix) { return prefix + '-' + Math.random().toString(36).slice(2, 9); }

const DEPARTMENTS = {
  housekeeping: { name: 'Buồng phòng', icon: '🧹' },
  roomservice:  { name: 'Dịch vụ ăn uống', icon: '🍽️' },
  maintenance:  { name: 'Bảo trì', icon: '🔧' },
  frontdesk:    { name: 'Lễ tân', icon: '🛎️' }
};

const STATUS = {
  pending:      { label: 'Chờ tiếp nhận', cls: 'badge-warn' },
  confirmed:    { label: 'Đã điều phối', cls: 'badge-info' },
  'in-progress':{ label: 'Đang xử lý', cls: 'badge-info' },
  completed:    { label: 'Hoàn thành', cls: 'badge-success' },
  cancelled:    { label: 'Đã hủy', cls: 'badge-muted' }
};

const PRIORITY = {
  low:    { label: 'Thấp',      cls: 'badge-muted' },
  medium: { label: 'Trung bình', cls: 'badge-info' },
  high:   { label: 'Cao',       cls: 'badge-warn' },
  urgent: { label: 'Khẩn cấp',  cls: 'badge-danger' }
};

// ---- Dữ liệu gốc, chỉ dùng để gieo vào localStorage lần đầu ----
function seedRequests() {
  const types = {
    sv1: 45, sv2: 30, sv3: 60, sv4: 15, sv5: 90, sv6: 120
  };
  const mk = (id, stayId, serviceTypeId, title, description, status, priority, minsAgo, extra) => {
    const createdAt = nowMinus(minsAgo);
    const req = {
      id, stayId, serviceTypeId, title, description, status, priority,
      createdAt,
      slaDueAt: createdAt + types[serviceTypeId] * 60000,
      assignedTo: null,
      completedAt: null,
      aiClassified: false,
      aiPriorityUsed: false,
      timeline: [{ at: createdAt, by: 'Khách', note: 'Tạo yêu cầu' }]
    };
    return Object.assign(req, extra || {});
  };
  return [
    mk('r1', 'st1', 'sv1', 'Dọn phòng buổi chiều',
      'Cho mình xin dọn phòng lúc 14h, thay khăn tắm và thêm 2 chai nước suối.',
      'in-progress', 'high', 55, {
        assignedTo: 's1',
        timeline: [
          { at: nowMinus(55), by: 'Khách', note: 'Tạo yêu cầu' },
          { at: nowMinus(48), by: 'Quản lý', note: 'Điều phối cho Trần Văn Bình (Buồng phòng)' },
          { at: nowMinus(40), by: 'Trần Văn Bình', note: 'Đã nhận việc, đang chuẩn bị dụng cụ' }
        ]
      }),
    mk('r2', 'st1', 'sv2', 'Gọi cơm sườn trứng',
      'Một phần cơm sườn trứng ốp la và một ly trà đá, giao sau 30 phút.',
      'pending', 'medium', 8),
    mk('r3', 'st2', 'sv3', 'Điều hòa không lạnh',
      'Điều hòa phòng 503 chạy nhưng không lạnh, phòng rất nóng. Mong thợ đến sớm.',
      'confirmed', 'urgent', 42, {
        assignedTo: 's3',
        timeline: [
          { at: nowMinus(42), by: 'Khách', note: 'Tạo yêu cầu' },
          { at: nowMinus(35), by: 'Quản lý', note: 'Điều phối cho Phạm Đức Long (Bảo trì)' }
        ]
      }),
    mk('r4', 'st1', 'sv4', 'Cần thêm thẻ mở cửa',
      'Mình làm mất thẻ mở phòng, cần xin thẻ mới tại lễ tân.',
      'completed', 'low', 60 * 30, {
        assignedTo: 's4',
        completedAt: nowMinus(60 * 29),
        timeline: [
          { at: nowMinus(60 * 30), by: 'Khách', note: 'Tạo yêu cầu' },
          { at: nowMinus(60 * 29.8), by: 'Quản lý', note: 'Điều phối cho Vũ Mai Anh (Lễ tân)' },
          { at: nowMinus(60 * 29), by: 'Vũ Mai Anh', note: 'Đã bàn giao thẻ mới' }
        ]
      }),
    mk('r5', 'st2', 'sv5', 'Giặt 2 áo sơ mi',
      'Giặt và ủi giúp 2 áo sơ mi trắng, cần trước 18h ngày mai.',
      'pending', 'low', 130),
    mk('r6', 'st2', 'sv6', 'Đặt massage buổi tối',
      'Đặt lịch massage toàn thân lúc 19h tối nay cho 1 người.',
      'pending', 'medium', 20),
    mk('r7', 'st1', 'sv2', 'Nước suối 2 chai',
      'Gửi lên 2 chai nước suối lạnh.', 'cancelled', 'low', 60 * 20, {
        timeline: [
          { at: nowMinus(60 * 20), by: 'Khách', note: 'Tạo yêu cầu' },
          { at: nowMinus(60 * 19.5), by: 'Khách', note: 'Khách hủy yêu cầu' }
        ]
      }),
    mk('r8', 'st1', 'sv2', 'Bữa sáng tại phòng',
      'Bữa sáng cho 2 người lúc 7h: phở bò và xôi gà.',
      'completed', 'medium', 60 * 26, {
        assignedTo: 's2',
        completedAt: nowMinus(60 * 25.5),
        timeline: [
          { at: nowMinus(60 * 26), by: 'Khách', note: 'Tạo yêu cầu' },
          { at: nowMinus(60 * 25.8), by: 'Quản lý', note: 'Điều phối cho Nguyễn Thị Hạnh (Ăn uống)' },
          { at: nowMinus(60 * 25.5), by: 'Nguyễn Thị Hạnh', note: 'Đã giao bữa sáng đầy đủ, còn nóng' }
        ]
      }),
    mk('r9', 'st2', 'sv3', 'Tivi không bật được',
      'Tivi phòng 503 không bật được, màn hình đen dù đã cắm điện.',
      'completed', 'urgent', 60 * 50, {
        assignedTo: 's3',
        completedAt: nowMinus(60 * 49),
        timeline: [
          { at: nowMinus(60 * 50), by: 'Khách', note: 'Tạo yêu cầu' },
          { at: nowMinus(60 * 49.8), by: 'Quản lý', note: 'Điều phối cho Phạm Đức Long (Bảo trì)' },
          { at: nowMinus(60 * 49), by: 'Phạm Đức Long', note: 'Đã thay board nguồn, tivi chạy lại bình thường' }
        ]
      }),
    mk('r10', 'st2', 'sv1', 'Lau sàn phòng',
      'Sàn phòng hơi bụi, nhờ lau giúp trước giờ ăn tối.',
      'completed', 'low', 60 * 8, {
        assignedTo: 's1',
        completedAt: nowMinus(60 * 7),
        timeline: [
          { at: nowMinus(60 * 8), by: 'Khách', note: 'Tạo yêu cầu' },
          { at: nowMinus(60 * 7.8), by: 'Quản lý', note: 'Điều phối cho Trần Văn Bình (Buồng phòng)' },
          { at: nowMinus(60 * 7), by: 'Trần Văn Bình', note: 'Đã lau xong sàn phòng' }
        ]
      })
  ];
}

const SEED = {
  // 4 tài khoản demo: khach / nhanvien / quanly / admin (mật khẩu 123456)
  users: [
    { id: 'u1', username: 'khach',    password: '123456', fullName: 'Nguyễn Hoàng An',       role: 'guest',   position: null,          status: 'active', createdAt: nowMinus(60 * 24 * 30) },
    { id: 'u2', username: 'nhanvien', password: '123456', fullName: 'Trần Văn Bình',         role: 'staff',   position: 'housekeeping', status: 'active', createdAt: nowMinus(60 * 24 * 22) },
    { id: 'u3', username: 'quanly',   password: '123456', fullName: 'Lê Thu Cường',          role: 'manager', position: null,          status: 'active', createdAt: nowMinus(60 * 24 * 25) },
    { id: 'u4', username: 'admin',    password: '123456', fullName: 'Quản trị viên StayFlow', role: 'admin',   position: null,          status: 'active', createdAt: nowMinus(60 * 24 * 40) }
  ],

  serviceTypes: [
    { id: 'sv1', name: 'Dọn phòng',              department: 'housekeeping', slaMinutes: 45,  active: true, icon: '🧹' },
    { id: 'sv2', name: 'Gọi đồ ăn / đồ uống',    department: 'roomservice',  slaMinutes: 30,  active: true, icon: '🍽️' },
    { id: 'sv3', name: 'Sửa chữa thiết bị',      department: 'maintenance',  slaMinutes: 60,  active: true, icon: '🔧' },
    { id: 'sv4', name: 'Hỗ trợ lễ tân',          department: 'frontdesk',    slaMinutes: 15,  active: true, icon: '🛎️' },
    { id: 'sv5', name: 'Giặt ủi',                department: 'housekeeping', slaMinutes: 90,  active: true, icon: '👔' },
    { id: 'sv6', name: 'Spa & Massage',          department: 'roomservice',  slaMinutes: 120, active: true, icon: '💆' }
  ],

  stays: [
    { id: 'st1', userId: 'u1',   guestName: 'Nguyễn Hoàng An',  room: '502', checkIn: nowMinus(60 * 24 * 2), checkOut: Date.now() + 60 * 24 * 3, vip: true,  phone: '0901 234 567' },
    { id: 'st2', userId: null,   guestName: 'Phạm Minh Ngọc',   room: '503', checkIn: nowMinus(60 * 24),     checkOut: Date.now() + 60 * 24 * 4, vip: false, phone: '0912 345 678' }
  ],

  requests: seedRequests(),

  tasks: [
    { id: 't1',  requestId: 'r1',  staffId: 's1', status: 'in-progress', createdAt: nowMinus(48),        notes: [{ at: nowMinus(40), text: 'Đã lấy khăn tắm và nước suối' }] },
    { id: 't3',  requestId: 'r3',  staffId: 's3', status: 'assigned',    createdAt: nowMinus(35),        notes: [] },
    { id: 't4',  requestId: 'r4',  staffId: 's4', status: 'done',        createdAt: nowMinus(60 * 29.8), notes: [] },
    { id: 't8',  requestId: 'r8',  staffId: 's2', status: 'done',        createdAt: nowMinus(60 * 25.8), notes: [] },
    { id: 't9',  requestId: 'r9',  staffId: 's3', status: 'done',        createdAt: nowMinus(60 * 49.8), notes: [] },
    { id: 't10', requestId: 'r10', staffId: 's1', status: 'done',        createdAt: nowMinus(60 * 7.8),  notes: [] }
  ],

  staff: [
    { id: 's1', userId: 'u2',  name: 'Trần Văn Bình',  position: 'housekeeping', phone: '0903 111 222', status: 'active' },
    { id: 's2', userId: null,  name: 'Nguyễn Thị Hạnh', position: 'roomservice',  phone: '0903 333 444', status: 'active' },
    { id: 's3', userId: null,  name: 'Phạm Đức Long',  position: 'maintenance',  phone: '0903 555 666', status: 'active' },
    { id: 's4', userId: null,  name: 'Vũ Mai Anh',     position: 'frontdesk',    phone: '0903 777 888', status: 'active' },
    { id: 's5', userId: null,  name: 'Đỗ Quang Huy',   position: 'maintenance',  phone: '0903 999 000', status: 'off' }
  ],

  shifts: [
    { id: 'sh1', staffId: 's1', dayOffset: 0, start: '06:00', end: '14:00', type: 'morning'   },
    { id: 'sh2', staffId: 's1', dayOffset: 1, start: '14:00', end: '22:00', type: 'afternoon' },
    { id: 'sh3', staffId: 's1', dayOffset: 2, start: '22:00', end: '06:00', type: 'night'     },
    { id: 'sh4', staffId: 's3', dayOffset: 0, start: '08:00', end: '16:00', type: 'morning'   },
    { id: 'sh5', staffId: 's2', dayOffset: 0, start: '06:00', end: '14:00', type: 'morning'   },
    { id: 'sh6', staffId: 's4', dayOffset: 1, start: '08:00', end: '16:00', type: 'morning'   }
  ],

  swapRequests: [
    { id: 'sw1', staffId: 's1', shiftId: 'sh2', reason: 'Có việc gia đình buổi chiều mai', status: 'pending', createdAt: nowMinus(300) }
  ],

  shiftReports: [
    {
      id: 'sr1',
      shiftId: 'sh1',
      staffId: 's1',
      shiftDate: nowMinus(60 * 24),
      shiftType: 'morning',
      hours: '06:00–14:00',
      summary: 'Hoàn thành tốt việc dọn 8 phòng khu tầng 5. Đã bổ sung đầy đủ nước suối và khăn tắm.',
      issues: 'Phòng 503 điều hòa hơi yếu, đã báo bên kỹ thuật kiểm tra lúc 10h.',
      handover: 'Bàn giao chìa khóa tầng 5 và 2 chai dung dịch lau kính cho ca chiều.',
      status: 'good',
      createdAt: nowMinus(60 * 18)
    }
  ],

  feedback: [
    { id: 'f1', stayId: 'st1', requestId: 'r8',  guestName: 'Nguyễn Hoàng An', rating: 5, comment: 'Bữa sáng giao đúng giờ, đồ ăn còn nóng và rất ngon. Nhân viên thân thiện.', createdAt: nowMinus(60 * 25) },
    { id: 'f2', stayId: 'st2', requestId: 'r9',  guestName: 'Phạm Minh Ngọc',  rating: 3, comment: 'Thợ sửa tivi đến hơi chậm, chờ khá lâu nhưng sửa nhanh và ổn.',              createdAt: nowMinus(60 * 48) },
    { id: 'f3', stayId: 'st2', requestId: 'r10', guestName: 'Phạm Minh Ngọc',  rating: 4, comment: 'Phòng được lau sạch sẽ, thơm tho. Thái độ nhân viên rất lịch sự.',          createdAt: nowMinus(60 * 6)  },
    { id: 'f4', stayId: 'st1', requestId: null,  guestName: 'Nguyễn Hoàng An', rating: 5, comment: 'Dịch vụ spa thư giãn, nhân viên nhiệt tình. Khách sạn sạch sẽ.',            createdAt: nowMinus(60 * 24) },
    { id: 'f5', stayId: 'st2', requestId: null,  guestName: 'Phạm Minh Ngọc',  rating: 2, comment: 'Gọi đồ ăn chờ gần một tiếng, đồ ăn giao đến đã nguội.',                   createdAt: nowMinus(60 * 10) }
  ],

  systemLogs: [
    { id: 'l1', at: nowMinus(60 * 24 * 40), actor: 'Hệ thống',       action: 'Triển khai StayFlow phiên bản 1.0.0', type: 'update',      title: 'Triển khai StayFlow 1.0.0',      content: 'Ra mắt hệ thống điều phối dịch vụ trong thời gian lưu trú cho khách sạn.' },
    { id: 'l2', at: nowMinus(60 * 24 * 25), actor: 'Quản trị viên',  action: 'Cấp vai trò Quản lý cho tài khoản quanly', type: 'grant',   title: null, content: null },
    { id: 'l3', at: nowMinus(60 * 24 * 22), actor: 'Quản trị viên',  action: 'Cấp vai trò Nhân viên (Buồng phòng) cho tài khoản nhanvien', type: 'grant', title: null, content: null },
    { id: 'l4', at: nowMinus(60 * 24 * 5),  actor: 'Quản trị viên',  action: 'Cập nhật hệ thống lên phiên bản 1.1.0', type: 'update',    title: 'Cập nhật 1.1.0',                 content: 'Bổ sung theo dõi SLA theo thời gian thực và trợ lý AI theo vai trò.' },
    { id: 'l5', at: nowMinus(60 * 24 * 2),  actor: 'Quản trị viên',  action: 'Bản tin: Hướng dẫn sử dụng trợ lý AI StayFlow', type: 'announcement', title: 'Hướng dẫn sử dụng trợ lý AI', content: 'Trợ lý AI đã được bật trên mọi trang. Nhấn biểu tượng ✨ ở góc phải để được hỗ trợ theo vai trò của bạn.' }
  ],

  flags: { maintenance: false, version: '1.1.0' }
};

// ---- Lớp lưu trữ: đọc localStorage, tự gieo dữ liệu gốc nếu chưa có ----
const Store = {
  get(key) {
    try {
      const raw = localStorage.getItem('stayflow:' + key);
      if (raw !== null) return JSON.parse(raw);
    } catch (e) { /* dữ liệu hỏng -> gieo lại */ }
    const seedVal = SEED[key] !== undefined ? SEED[key] : [];
    const val = JSON.parse(JSON.stringify(seedVal));
    this.set(key, val);
    return val;
  },
  set(key, val) { localStorage.setItem('stayflow:' + key, JSON.stringify(val)); },
  reset() {
    Object.keys(localStorage)
      .filter(k => k.indexOf('stayflow:') === 0)
      .forEach(k => localStorage.removeItem(k));
  }
};

function findUser(id)     { return Store.get('users').find(u => u.id === id); }
function serviceTypeById(id) { return Store.get('serviceTypes').find(s => s.id === id); }
function staffById(id)    { return Store.get('staff').find(s => s.id === id); }
function stayById(id)     { return Store.get('stays').find(s => s.id === id); }

// Đồng bộ hồ sơ nhân viên (bảng staff) sau khi tạo/sửa/xóa tài khoản.
// Bảng điều phối của Quản lý chỉ đọc bảng staff, nên thiếu bước này
// nhân viên mới tạo sẽ không bao giờ xuất hiện để nhận nhiệm vụ.
function syncStaffProfile(u) {
  const staff = Store.get('staff');
  const i = staff.findIndex(s => s.userId === u.id);
  if (u.role === 'staff') {
    const status = u.status === 'active' ? 'active' : 'off';
    if (i >= 0) {
      staff[i].name = u.fullName;
      staff[i].position = u.position;
      staff[i].status = status;
    } else {
      staff.push({ id: newId('s'), userId: u.id, name: u.fullName, position: u.position, phone: '', status: status });
    }
    Store.set('staff', staff);
  } else if (i >= 0) {
    // Không xóa hồ sơ để nhiệm vụ cũ vẫn hiển thị đúng tên, chỉ ngừng nhận việc mới
    staff[i].status = 'off';
    Store.set('staff', staff);
  }
}

function addLog(action, type, extra) {
  const logs = Store.get('systemLogs');
  logs.push(Object.assign({ id: newId('l'), at: Date.now(), action, type, title: null, content: null }, extra || {}));
  Store.set('systemLogs', logs);
}
