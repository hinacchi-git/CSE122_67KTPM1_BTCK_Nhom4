// StayFlow – Quản trị: Bảng điều khiển
(function () {
  if (!window.AdminApp || document.body.dataset.page !== 'admin-dashboard') return;
  function initDashboard() {
    const statsEl = document.getElementById('stats');
    const recentEl = document.getElementById('recent');

    function render() {
      try {
        const users = Store.get('users');
        const logs = Store.get('systemLogs').slice().sort((a, b) => b.at - a.at);
        const count = r => users.filter(u => u.role === r).length;
        const flags = Store.get('flags');

        statsEl.innerHTML = `
          <div class="card stat-card"><div class="stat-value">${users.length}</div><div class="stat-label">Tổng tài khoản</div></div>
          <div class="card stat-card"><div class="stat-value">${count('staff')}</div><div class="stat-label">Nhân viên</div></div>
          <div class="card stat-card"><div class="stat-value">${count('manager')}</div><div class="stat-label">Quản lý</div></div>
          <div class="card stat-card"><div class="stat-value" style="color:var(--danger)">${users.filter(u => u.status === 'disabled').length}</div><div class="stat-label">Bị vô hiệu hóa</div></div>`;

        recentEl.innerHTML = `
          <p class="card-sub" style="margin-bottom:10px">Phiên bản hệ thống: <b>v${flags.version}</b> · Chế độ bảo trì: <b>${flags.maintenance ? 'ĐANG BẬT' : 'Tắt'}</b></p>
          ${logs.filter(l => ['grant', 'account'].includes(l.type)).slice(0, 6).map(l => `
            <p class="card-sub" style="border-bottom:1px solid var(--border); padding-bottom:8px; margin-bottom:8px">
              ${l.type === 'grant' ? '🔑' : '👤'} ${UI.esc(l.action)}<br><small>${UI.esc(l.actor)} · ${UI.timeAgo(l.at)}</small>
            </p>`).join('')}`;
      } catch (err) {
        UI.error(statsEl, { onRetry: render });
      }
    }

    document.getElementById('resetBtn').addEventListener('click', async () => {
      const ok = await UI.confirm('Đặt lại toàn bộ dữ liệu demo về trạng thái ban đầu? Mọi thay đổi (yêu cầu, nhiệm vụ, tài khoản mới...) sẽ mất.', { title: 'Đặt lại dữ liệu demo', okLabel: 'Đặt lại' });
      if (!ok) return;
      Store.reset();
      location.href = appUrl('login.html');
    });

    render();
  }

  initDashboard();
})();
