/**
 * STAYFLOW UI INTERACTION HELPERS (stayflow-ui.js)
 * Tự động chèn thanh Demo Role Bar, Quản lý Toast, Modal, và đồng bộ điều hướng
 */

const StayFlowUI = (function() {

  // Xác định đường dẫn tương đối về thư mục gốc dự án (không phân biệt hoa thường)
  function getRootPath() {
    const path = window.location.pathname.replace(/\\/g, '/');
    const lower = path.toLowerCase();
    const idx = lower.indexOf('/pages/');
    if (idx !== -1) {
      const sub = path.substring(idx + 7);
      const depth = sub.split('/').length;
      return '../'.repeat(depth);
    }
    return './';
  }

  // Khởi tạo thanh Demo Role Switcher
  function initDemoBar(activeRole = '') {
    const root = getRootPath();
    const existing = document.querySelector('.demo-role-bar');
    if (existing) existing.remove();

    const bar = document.createElement('div');
    bar.className = 'demo-role-bar';
    bar.innerHTML = `
      <div class="demo-bar-left">
        <span class="demo-badge-tag">StayFlow Demo Matrix</span>
        <div class="demo-role-links">
          <a href="${root}index.html" class="demo-role-btn ${activeRole === 'hub' ? 'active' : ''}">
            <span>🏠</span> <strong>Cổng Hub & Kịch Bản</strong>
          </a>
          <a href="${root}pages/guest/guest-dashboard.html" class="demo-role-btn ${activeRole === 'guest' ? 'active' : ''}">
            <span>🛎️</span> Khách Phòng 502
          </a>
          <a href="${root}pages/manager/manager-dispatch-board.html" class="demo-role-btn ${activeRole === 'manager' ? 'active' : ''}">
            <span>👔</span> Quản Lý Điều Phối
          </a>
          <a href="${root}pages/staff/staff-task-board.html" class="demo-role-btn ${activeRole === 'staff' ? 'active' : ''}">
            <span>🧹</span> Nhân Viên Vận Hành
          </a>
          <a href="${root}pages/admin/admin-dashboard.html" class="demo-role-btn ${activeRole === 'admin' ? 'active' : ''}">
            <span>⚙️</span> Quản Trị Hệ Thống
          </a>
        </div>
      </div>
      <div class="demo-bar-right">
        <button class="demo-reset-btn" id="stayflowResetBtn" title="Khôi phục trạng thái ban đầu của dữ liệu demo">
          🔄 Đặt Lại Dữ Liệu
        </button>
      </div>
    `;

    document.body.insertBefore(bar, document.body.firstChild);

    // Xử lý nút Reset DB
    const resetBtn = document.getElementById('stayflowResetBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (confirm('Khôi phục toàn bộ dữ liệu mẫu ban đầu để bắt đầu lại kịch bản trình chiếu?')) {
          StayFlowDB.reset();
          StayFlowUI.toast('Đã khôi phục dữ liệu ban đầu thành công!', 'success');
          setTimeout(() => window.location.reload(), 600);
        }
      });
    }
  }

  // Toast Notification
  function toast(message, type = 'info') {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const t = document.createElement('div');
    t.className = `toast toast-${type}`;
    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '⚠️';
    if (type === 'warning') icon = '🔔';

    t.innerHTML = `<span>${icon}</span> <div>${message}</div>`;
    container.appendChild(t);

    setTimeout(() => {
      t.style.opacity = '0';
      t.style.transform = 'translateX(100%)';
      setTimeout(() => t.remove(), 300);
    }, 3500);
  }

  // Modal Dialogs
  function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('active');
    }
  }

  function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('active');
    }
  }

  // Gắn sự kiện đóng modal tự động cho các nút có data-close
  document.addEventListener('click', (e) => {
    if (e.target.matches('[data-close-modal]') || e.target.closest('[data-close-modal]')) {
      const modal = e.target.closest('.modal-overlay');
      if (modal) modal.classList.remove('active');
    }
    if (e.target.classList.contains('modal-overlay')) {
      e.target.classList.remove('active');
    }
  });

  return {
    initDemoBar,
    toast,
    openModal,
    closeModal,
    getRootPath
  };
})();

window.StayFlowUI = StayFlowUI;
