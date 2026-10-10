/**
 * STAYFLOW CENTRAL DATABASE & LOCALSTORAGE ENGINE (stayflow-db.js)
 * Quản lý trạng thái và đồng bộ dữ liệu thời gian thực giữa 4 vai trò
 */

const StayFlowDB = (function() {
  const DB_KEYS = {
    ROOMS: 'stayflow_rooms',
    SERVICES: 'stayflow_services',
    STAFF: 'stayflow_staff',
    REQUESTS: 'stayflow_requests',
    TASKS: 'stayflow_tasks',
    FEEDBACK: 'stayflow_feedback',
    USERS: 'stayflow_users',
    CURRENT_USER: 'stayflow_current_user'
  };

  // Dữ liệu mẫu chuẩn Hospitality 5-sao
  const DEFAULT_DATA = {
    rooms: [
      { id: 'R-501', number: '501', type: 'Deluxe Ocean View', floor: 5, status: 'Occupied', guestName: 'Phạm Minh Tuấn', vip: false },
      { id: 'R-502', number: '502', type: 'Executive Suite', floor: 5, status: 'Occupied', guestName: 'Nguyễn Văn An', vip: true, checkIn: '2026-09-24', checkOut: '2026-09-28' },
      { id: 'R-503', number: '503', type: 'Deluxe City View', floor: 5, status: 'Vacant Clean', guestName: null, vip: false },
      { id: 'R-601', number: '601', type: 'Premier Suite', floor: 6, status: 'Occupied', guestName: 'Trần Thị Mai', vip: false },
      { id: 'R-602', number: '602', type: 'Deluxe Garden View', floor: 6, status: 'Maintenance', guestName: null, vip: false },
      { id: 'R-701', number: '701', type: 'Presidential Penthouse', floor: 7, status: 'Occupied', guestName: 'Đặng Nhật Minh', vip: true }
    ],

    services: [
      { id: 'SVC-01', code: 'HK-CLEAN', name: 'Dọn dẹp phòng đầy đủ', category: 'Housekeeping', department: 'Buồng phòng', slaMinutes: 30, price: 0, desc: 'Thay ga giường, hút bụi, lau sàn, dọn vệ sinh phòng tắm.' },
      { id: 'SVC-02', code: 'HK-AMENITY', name: 'Bổ sung đồ dùng tiện ích', category: 'Housekeeping', department: 'Buồng phòng', slaMinutes: 15, price: 0, desc: 'Khăn tắm lớn, nước khoáng, dép đi trong phòng, trà & cà phê.' },
      { id: 'SVC-03', code: 'MT-REPAIR', name: 'Sửa chữa kỹ thuật & Điều hòa', category: 'Maintenance', department: 'Kỹ thuật', slaMinutes: 20, price: 0, desc: 'Khắc phục sự cố điều hòa, vòi sen, đèn, điện nước và khóa cửa.' },
      { id: 'SVC-04', code: 'FB-ROOM', name: 'Ẩm thực tại phòng (Room Service)', category: 'F&B', department: 'Ẩm thực & Bếp', slaMinutes: 25, price: 150000, desc: 'Phục vụ đồ ăn nóng, nước ép tươi và trái cây tận phòng theo menu.' },
      { id: 'SVC-05', code: 'LD-EXPRESS', name: 'Giặt là cao cấp lấy nhanh', category: 'Laundry', department: 'Giặt là', slaMinutes: 90, price: 120000, desc: 'Giặt ủi, là phẳng và giao trả quần áo treo móc sang trọng.' },
      { id: 'SVC-06', code: 'CS-LUGGAGE', name: 'Hỗ trợ hành lý & Đưa đón', category: 'Concierge', department: 'Tiền sảnh', slaMinutes: 15, price: 0, desc: 'Chuyển hành lý lên/xuống phòng, đặt xe đưa đón sân bay.' }
    ],

    staff: [
      { id: 'STF-01', name: 'Nguyễn Văn Hoàng', role: 'Staff', department: 'Kỹ thuật', phone: '0901 234 567', shift: 'Ca sáng (07:00 - 15:30)', activeTasks: 1, avatar: 'NVH' },
      { id: 'STF-02', name: 'Lê Thị Lan', role: 'Staff', department: 'Buồng phòng', phone: '0902 345 678', shift: 'Ca sáng (07:00 - 15:30)', activeTasks: 1, avatar: 'LTL' },
      { id: 'STF-03', name: 'Phạm Quốc Tuấn', role: 'Staff', department: 'Ẩm thực & Bếp', phone: '0903 456 789', shift: 'Ca sáng (07:00 - 15:30)', activeTasks: 0, avatar: 'PQT' },
      { id: 'STF-04', name: 'Đỗ Minh Trí', role: 'Staff', department: 'Kỹ thuật', phone: '0904 567 890', shift: 'Ca chiều (14:30 - 22:30)', activeTasks: 0, avatar: 'DMT' }
    ],

    requests: [
      {
        id: 'REQ-1001',
        roomNumber: '601',
        guestName: 'Trần Thị Mai',
        serviceId: 'SVC-02',
        serviceName: 'Bổ sung đồ dùng tiện ích',
        category: 'Housekeeping',
        department: 'Buồng phòng',
        description: 'Cho xin thêm 2 chai nước suối và 1 bộ áo choàng tắm.',
        priority: 'MEDIUM',
        status: 'completed',
        createdAt: '2026-09-25 06:15',
        slaMinutes: 15,
        assignedStaffId: 'STF-02',
        assignedStaffName: 'Lê Thị Lan',
        completedAt: '2026-09-25 06:27',
        aiClassified: true,
        aiRationale: 'Nhận diện yêu cầu đồ dùng tiện ích (nước suối, áo choàng). Mức ưu tiên tiêu chuẩn.'
      },
      {
        id: 'REQ-1002',
        roomNumber: '501',
        guestName: 'Phạm Minh Tuấn',
        serviceId: 'SVC-04',
        serviceName: 'Ẩm thực tại phòng (Room Service)',
        category: 'F&B',
        department: 'Ẩm thực & Bếp',
        description: '01 Phở bò tái lăn và 01 Cà phê đen đá ít đường.',
        priority: 'MEDIUM',
        status: 'in-progress',
        createdAt: '2026-09-25 06:45',
        slaMinutes: 25,
        assignedStaffId: 'STF-03',
        assignedStaffName: 'Phạm Quốc Tuấn',
        completedAt: null,
        aiClassified: true,
        aiRationale: 'Thực đơn ăn sáng phòng. SLA chuẩn 25 phút.'
      }
    ],

    tasks: [
      {
        id: 'TSK-2001',
        requestId: 'REQ-1001',
        staffId: 'STF-02',
        staffName: 'Lê Thị Lan',
        title: 'Bổ sung nước suối & áo choàng phòng 601',
        roomNumber: '601',
        status: 'completed',
        priority: 'MEDIUM',
        slaMinutes: 15,
        assignedAt: '2026-09-25 06:16',
        startedAt: '2026-09-25 06:18',
        completedAt: '2026-09-25 06:27',
        checklist: [
          { text: 'Chuẩn bị 2 chai nước khoáng cao cấp', done: true },
          { text: 'Chuẩn bị 1 áo choàng tắm đóng gói', done: true },
          { text: 'Gõ cửa xưng danh và giao tận tay khách', done: true }
        ],
        notes: 'Khách vui vẻ nhận đồ lúc 6h27.'
      },
      {
        id: 'TSK-2002',
        requestId: 'REQ-1002',
        staffId: 'STF-03',
        staffName: 'Phạm Quốc Tuấn',
        title: 'Chế biến & Giao phở bò + cà phê phòng 501',
        roomNumber: '501',
        status: 'in-progress',
        priority: 'MEDIUM',
        slaMinutes: 25,
        assignedAt: '2026-09-25 06:46',
        startedAt: '2026-09-25 06:50',
        completedAt: null,
        checklist: [
          { text: 'Bếp hoàn tất món phở bò tái lăn', done: true },
          { text: 'Pha chế cà phê đen đá', done: true },
          { text: 'Đậy nắp giữ nhiệt và xe đẩy lên phòng', done: false }
        ],
        notes: 'Đang đẩy xe giao lên tầng 5.'
      }
    ],

    feedback: [
      {
        id: 'FB-01',
        requestId: 'REQ-1001',
        roomNumber: '601',
        guestName: 'Trần Thị Mai',
        rating: 5,
        sentiment: 'POSITIVE',
        comment: 'Nhân viên Lan mang nước và áo choàng lên rất nhanh, chỉ 10 phút là có. Rất chu đáo!',
        tags: ['Tốc độ nhanh', 'Nhân viên thân thiện'],
        createdAt: '2026-09-25 06:30'
      },
      {
        id: 'FB-02',
        requestId: 'REQ-0995',
        roomNumber: '701',
        guestName: 'Đặng Nhật Minh',
        rating: 4,
        sentiment: 'POSITIVE',
        comment: 'Dịch vụ dọn phòng buổi tối rất sạch sẽ, hoa tươi mới cắm thơm ngát.',
        tags: ['Chất lượng phòng tốt'],
        createdAt: '2026-09-24 21:00'
      },
      {
        id: 'FB-03',
        requestId: 'REQ-0992',
        roomNumber: '503',
        guestName: 'Khách vãng lai',
        rating: 3,
        sentiment: 'NEUTRAL',
        comment: 'Nước nóng bật hơi lâu khoảng 3 phút mới ấm lên. Mong khách sạn bảo dưỡng sớm.',
        tags: ['Kỹ thuật nước nóng'],
        createdAt: '2026-09-24 18:20'
      }
    ],

    users: [
      { id: 'USR-01', username: 'guest502', name: 'Nguyễn Văn An (Phòng 502)', role: 'Guest', room: '502', vip: true },
      { id: 'USR-02', username: 'staff_hoang', name: 'Nguyễn Văn Hoàng', role: 'Staff', department: 'Kỹ thuật' },
      { id: 'USR-03', username: 'staff_lan', name: 'Lê Thị Lan', role: 'Staff', department: 'Buồng phòng' },
      { id: 'USR-04', username: 'manager_duty', name: 'Vũ Quốc Bảo', role: 'Manager', title: 'Quản lý ca trực (Duty Manager)' },
      { id: 'USR-05', username: 'admin', name: 'Ban Quản Trị Hệ Thống', role: 'Admin', title: 'System Administrator' }
    ]
  };

  // Khởi tạo DB nếu chưa có
  function initDB(force = false) {
    if (force || !localStorage.getItem(DB_KEYS.ROOMS)) {
      localStorage.setItem(DB_KEYS.ROOMS, JSON.stringify(DEFAULT_DATA.rooms));
      localStorage.setItem(DB_KEYS.SERVICES, JSON.stringify(DEFAULT_DATA.services));
      localStorage.setItem(DB_KEYS.STAFF, JSON.stringify(DEFAULT_DATA.staff));
      localStorage.setItem(DB_KEYS.REQUESTS, JSON.stringify(DEFAULT_DATA.requests));
      localStorage.setItem(DB_KEYS.TASKS, JSON.stringify(DEFAULT_DATA.tasks));
      localStorage.setItem(DB_KEYS.FEEDBACK, JSON.stringify(DEFAULT_DATA.feedback));
      localStorage.setItem(DB_KEYS.USERS, JSON.stringify(DEFAULT_DATA.users));
      localStorage.setItem(DB_KEYS.CURRENT_USER, JSON.stringify(DEFAULT_DATA.users[0])); // Mặc định là khách 502
      console.log('StayFlow DB Initialized successfully!');
    }
  }

  // Tự động init
  initDB(false);

  // Getter & Setter trợ giúp
  function get(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error reading localStorage for key: ' + key, e);
      return [];
    }
  }

  function set(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
      window.dispatchEvent(new Event('stayflow_storage_updated'));
    } catch (e) {
      console.error('Error writing localStorage for key: ' + key, e);
    }
  }

  return {
    init: initDB,
    reset: function() {
      initDB(true);
    },

    // Current User / Role Session
    getCurrentUser: function() {
      try {
        const u = localStorage.getItem(DB_KEYS.CURRENT_USER);
        return u ? JSON.parse(u) : DEFAULT_DATA.users[0];
      } catch (e) {
        return DEFAULT_DATA.users[0];
      }
    },
    setCurrentUser: function(userObj) {
      set(DB_KEYS.CURRENT_USER, userObj);
    },

    // Requests
    getRequests: function() { return get(DB_KEYS.REQUESTS); },
    getRequestById: function(id) {
      return get(DB_KEYS.REQUESTS).find(r => r.id === id);
    },
    addRequest: function(req) {
      const all = get(DB_KEYS.REQUESTS);
      const newId = 'REQ-' + (1000 + all.length + 1);
      const now = new Date();
      const timeStr = now.toISOString().slice(0, 10) + ' ' + now.toTimeString().slice(0, 5);

      const newReq = {
        id: newId,
        createdAt: timeStr,
        status: 'pending',
        ...req
      };
      all.unshift(newReq);
      set(DB_KEYS.REQUESTS, all);
      return newReq;
    },
    updateRequestStatus: function(id, status, extra = {}) {
      const all = get(DB_KEYS.REQUESTS);
      const idx = all.findIndex(r => r.id === id);
      if (idx !== -1) {
        all[idx].status = status;
        Object.assign(all[idx], extra);
        set(DB_KEYS.REQUESTS, all);
        return all[idx];
      }
      return null;
    },
    deleteRequest: function(id) {
      const all = get(DB_KEYS.REQUESTS).filter(r => r.id !== id);
      set(DB_KEYS.REQUESTS, all);
    },

    // Tasks
    getTasks: function() { return get(DB_KEYS.TASKS); },
    getTaskById: function(id) {
      return get(DB_KEYS.TASKS).find(t => t.id === id);
    },
    addTask: function(task) {
      const all = get(DB_KEYS.TASKS);
      const newId = 'TSK-' + (2000 + all.length + 1);
      const now = new Date();
      const timeStr = now.toISOString().slice(0, 10) + ' ' + now.toTimeString().slice(0, 5);

      const newTask = {
        id: newId,
        assignedAt: timeStr,
        status: 'pending',
        checklist: [
          { text: 'Kiểm tra thông tin phòng & vật tư cần thiết', done: false },
          { text: 'Thực hiện dịch vụ theo quy chuẩn khách sạn', done: false },
          { text: 'Xác nhận sự hài lòng của khách & bàn giao', done: false }
        ],
        ...task
      };
      all.unshift(newTask);
      set(DB_KEYS.TASKS, all);

      // Đồng thời cập nhật trạng thái của Request tương ứng
      if (task.requestId) {
        StayFlowDB.updateRequestStatus(task.requestId, 'in-progress', {
          assignedStaffId: task.staffId,
          assignedStaffName: task.staffName
        });
      }

      return newTask;
    },
    updateTaskStatus: function(id, status, extra = {}) {
      const all = get(DB_KEYS.TASKS);
      const idx = all.findIndex(t => t.id === id);
      if (idx !== -1) {
        all[idx].status = status;
        Object.assign(all[idx], extra);
        set(DB_KEYS.TASKS, all);

        // Nếu task hoàn thành -> cập nhật Request hoàn thành
        if (status === 'completed' && all[idx].requestId) {
          StayFlowDB.updateRequestStatus(all[idx].requestId, 'completed', {
            completedAt: all[idx].completedAt || new Date().toISOString().slice(0, 10) + ' ' + new Date().toTimeString().slice(0, 5)
          });
        }
        return all[idx];
      }
      return null;
    },

    // Services (CRUD Admin)
    getServices: function() { return get(DB_KEYS.SERVICES); },
    addService: function(svc) {
      const all = get(DB_KEYS.SERVICES);
      const newId = 'SVC-0' + (all.length + 1);
      const newSvc = { id: newId, ...svc };
      all.push(newSvc);
      set(DB_KEYS.SERVICES, all);
      return newSvc;
    },
    updateService: function(id, updated) {
      const all = get(DB_KEYS.SERVICES);
      const idx = all.findIndex(s => s.id === id);
      if (idx !== -1) {
        all[idx] = { ...all[idx], ...updated };
        set(DB_KEYS.SERVICES, all);
        return all[idx];
      }
      return null;
    },
    deleteService: function(id) {
      const all = get(DB_KEYS.SERVICES).filter(s => s.id !== id);
      set(DB_KEYS.SERVICES, all);
    },

    // Rooms & Stays (CRUD Admin)
    getRooms: function() { return get(DB_KEYS.ROOMS); },
    addRoom: function(room) {
      const all = get(DB_KEYS.ROOMS);
      const newRoom = { id: 'R-' + room.number, ...room };
      all.push(newRoom);
      set(DB_KEYS.ROOMS, all);
      return newRoom;
    },
    updateRoom: function(id, updated) {
      const all = get(DB_KEYS.ROOMS);
      const idx = all.findIndex(r => r.id === id);
      if (idx !== -1) {
        all[idx] = { ...all[idx], ...updated };
        set(DB_KEYS.ROOMS, all);
        return all[idx];
      }
      return null;
    },
    deleteRoom: function(id) {
      const all = get(DB_KEYS.ROOMS).filter(r => r.id !== id);
      set(DB_KEYS.ROOMS, all);
    },

    // Staff & Users (CRUD Admin)
    getStaff: function() { return get(DB_KEYS.STAFF); },
    getUsers: function() { return get(DB_KEYS.USERS); },
    addUser: function(user) {
      const all = get(DB_KEYS.USERS);
      const newId = 'USR-0' + (all.length + 1);
      const newUser = { id: newId, ...user };
      all.push(newUser);
      set(DB_KEYS.USERS, all);
      return newUser;
    },
    deleteUser: function(id) {
      const all = get(DB_KEYS.USERS).filter(u => u.id !== id);
      set(DB_KEYS.USERS, all);
    },

    // Feedback
    getFeedback: function() { return get(DB_KEYS.FEEDBACK); },
    addFeedback: function(fb) {
      const all = get(DB_KEYS.FEEDBACK);
      const newId = 'FB-0' + (all.length + 1);
      const now = new Date();
      const timeStr = now.toISOString().slice(0, 10) + ' ' + now.toTimeString().slice(0, 5);
      const newFb = { id: newId, createdAt: timeStr, ...fb };
      all.unshift(newFb);
      set(DB_KEYS.FEEDBACK, all);
      return newFb;
    }
  };
})();

// Expose to window for global access
window.StayFlowDB = StayFlowDB;
