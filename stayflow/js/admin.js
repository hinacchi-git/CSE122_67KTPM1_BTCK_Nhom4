// StayFlow – Khu Quản trị viên: dashboard, quản lý tài khoản & phân quyền, cập nhật hệ thống
// Nguyên tắc: Admin KHÔNG truy cập dữ liệu vận hành (yêu cầu, nhiệm vụ, lưu trú, phản hồi).
(function () {
  const page = document.body.dataset.page || '';
  if (!page.startsWith('admin-')) return;
  const user = Auth.require(['admin']);
  if (!user) return;
  UI.init(page);

  const roleText = { guest: 'Khách lưu trú', staff: 'Nhân viên', manager: 'Quản lý', admin: 'Quản trị viên' };

  // ---------- Bảng điều khiển ----------
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
      location.href = 'login.html';
    });

    render();
  }

  // ---------- Quản lý tài khoản & phân quyền ----------
  function initUsers() {
    const app = document.getElementById('app');
    const qSearch = document.getElementById('qSearch');
    const roleFilter = document.getElementById('roleFilter');

    function dialogFields(existing) {
      return [
        { name: 'fullName', label: 'Họ và tên', type: 'text', required: true, value: existing ? existing.fullName : '' },
        { name: 'username', label: 'Tên đăng nhập', type: 'text', required: true, value: existing ? existing.username : '',
          validate: (v) => /\s/.test(v) ? 'Không chứa khoảng trắng' : (Store.get('users').some(u => u.username === v.toLowerCase() && (!existing || u.id !== existing.id)) ? 'Tên đăng nhập đã tồn tại' : '') },
        { name: 'role', label: 'Vai trò', type: 'select', value: existing ? existing.role : 'guest',
          options: [
            { value: 'guest', label: 'Khách lưu trú' },
            { value: 'staff', label: 'Nhân viên' },
            { value: 'manager', label: 'Quản lý khách sạn' },
            { value: 'admin', label: 'Quản trị viên' }
          ] },
        { name: 'position', label: 'Vị trí (bắt buộc nếu là Nhân viên)', type: 'select', value: existing && existing.position ? existing.position : 'housekeeping',
          options: Object.keys(DEPARTMENTS).map(k => ({ value: k, label: DEPARTMENTS[k].icon + ' ' + DEPARTMENTS[k].name })) },
        { name: 'password', label: existing ? 'Mật khẩu mới (để trống nếu giữ nguyên)' : 'Mật khẩu (tối thiểu 6 ký tự)', type: 'password', required: !existing,
          validate: v => v === '' || v.length >= 6 ? '' : 'Cần tối thiểu 6 ký tự' },
        { name: 'confirm', label: 'Nhập lại mật khẩu', type: 'password',
          validate: (v, all) => all.password !== '' && v !== all.password ? 'Mật khẩu chưa khớp' : '' }
      ];
    }

    async function openCreate() {
      const values = await UI.dialog({
        title: 'Tạo tài khoản mới',
        description: 'Admin được cấp mọi vai trò: Khách, Nhân viên, Quản lý, Quản trị viên.',
        submitLabel: 'Tạo tài khoản',
        fields: dialogFields(null)
      });
      if (!values) return;
      if (values.role === 'staff' && !values.position) { UI.toast('Cần chọn vị trí cho Nhân viên', 'error'); return; }
      const users = Store.get('users');
      const u = {
        id: newId('u'), username: values.username.toLowerCase(), password: values.password,
        fullName: values.fullName, role: values.role,
        position: values.role === 'staff' ? values.position : null,
        status: 'active', createdAt: Date.now()
      };
      users.push(u);
      Store.set('users', users);
      syncStaffProfile(u);
      addLog('Quản trị viên tạo tài khoản ' + u.username + ' với vai trò ' + roleText[u.role] + (u.position ? ' (' + DEPARTMENTS[u.position].name + ')' : ''), 'grant');
      UI.toast('Đã tạo tài khoản ' + u.username);
      render();
    }

    async function openEdit(u0) {
      const values = await UI.dialog({
        title: 'Sửa tài khoản: ' + u0.username,
        description: 'Đổi vai trò/vị trí sẽ được ghi vào nhật ký phân quyền.',
        submitLabel: 'Lưu thay đổi',
        fields: dialogFields(u0)
      });
      if (!values) return;
      const users = Store.get('users');
      const u = users.find(x => x.id === u0.id);
      const roleChanged = u.role !== values.role || (values.role === 'staff' && u.position !== values.position);
      u.fullName = values.fullName;
      u.role = values.role;
      u.position = values.role === 'staff' ? values.position : null;
      if (values.password) u.password = values.password;
      Store.set('users', users);
      syncStaffProfile(u);
      addLog('Quản trị viên ' + (roleChanged ? 'cấp lại vai trò' : 'cập nhật') + ' cho ' + u.username + ': ' + roleText[u.role] + (u.position ? ' (' + DEPARTMENTS[u.position].name + ')' : ''), roleChanged ? 'grant' : 'account');
      UI.toast('Đã cập nhật tài khoản ' + u.username);
      render();
    }

    async function toggleStatus(u0) {
      const disabling = u0.status === 'active';
      if (u0.id === user.id) { UI.toast('Không thể vô hiệu hóa chính tài khoản của bạn!', 'error'); return; }
      const ok = await UI.confirm((disabling ? 'Vô hiệu hóa' : 'Kích hoạt lại') + ' tài khoản "' + u0.username + '"?', { danger: disabling, okLabel: 'Xác nhận' });
      if (!ok) return;
      const users = Store.get('users');
      const u = users.find(x => x.id === u0.id);
      u.status = disabling ? 'disabled' : 'active';
      Store.set('users', users);
      syncStaffProfile(u);
      addLog('Quản trị viên ' + (disabling ? 'vô hiệu hóa' : 'kích hoạt') + ' tài khoản ' + u.username, 'account');
      UI.toast('Đã cập nhật trạng thái tài khoản');
      render();
    }

    function render() {
      UI.skeleton(app, 5, 'row');
      setTimeout(() => {
        try {
          const q = qSearch.value.trim().toLowerCase();
          const rf = roleFilter.value;
          let users = Store.get('users');
          if (q) users = users.filter(u => (u.username + ' ' + u.fullName).toLowerCase().includes(q));
          if (rf) users = users.filter(u => u.role === rf);
          if (!users.length) { UI.empty(app, { icon: '🔍', title: 'Không tìm thấy tài khoản', message: 'Thử đổi từ khóa hoặc bộ lọc vai trò.' }); return; }

          app.innerHTML = `
            <div class="table-wrap">
              <table>
                <thead><tr><th>Tài khoản</th><th>Họ và tên</th><th>Vai trò</th><th>Trạng thái</th><th>Tạo lúc</th><th>Thao tác</th></tr></thead>
                <tbody>
                  ${users.map(u => `
                    <tr class="${u.status === 'active' ? '' : 'row-disabled'}">
                      <td><b>${UI.esc(u.username)}</b>${u.id === user.id ? ' <span class="badge badge-info">Bạn</span>' : ''}</td>
                      <td>${UI.esc(u.fullName)}</td>
                      <td>${u.role === 'staff' ? UI.deptBadge(u.position) : '<span class="badge badge-outline">' + roleText[u.role] + '</span>'}</td>
                      <td>${u.status === 'active' ? '<span class="badge badge-success">Hoạt động</span>' : '<span class="badge badge-danger">Bị vô hiệu</span>'}</td>
                      <td>${UI.fmtDateTime(u.createdAt)}</td>
                      <td>
                        <button class="btn btn-sm btn-outline" data-edit="${u.id}">Sửa / Đổi role</button>
                        <button class="btn btn-sm ${u.status === 'active' ? 'btn-danger' : 'btn-primary'}" data-toggle="${u.id}">${u.status === 'active' ? 'Vô hiệu hóa' : 'Kích hoạt'}</button>
                      </td>
                    </tr>`).join('')}
                </tbody>
              </table>
            </div>`;
          app.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => openEdit(Store.get('users').find(u => u.id === b.dataset.edit))));
          app.querySelectorAll('[data-toggle]').forEach(b => b.addEventListener('click', () => toggleStatus(Store.get('users').find(u => u.id === b.dataset.toggle))));
        } catch (err) {
          UI.error(app, { onRetry: render });
        }
      }, 350);
    }

    document.getElementById('addBtn').addEventListener('click', openCreate);
    qSearch.addEventListener('input', render);
    roleFilter.addEventListener('change', render);
    render();
  }

  // ---------- Cập nhật hệ thống ----------
  function initUpdates() {
    const listEl = document.getElementById('list');
    const maintBtn = document.getElementById('maintBtn');

    function renderMaint() {
      const flags = Store.get('flags');
      maintBtn.classList.toggle('on', flags.maintenance);
      maintBtn.textContent = flags.maintenance ? 'Bảo trì: ĐANG BẬT' : 'Bảo trì: Tắt';
    }

    maintBtn.addEventListener('click', async () => {
      const flags = Store.get('flags');
      const turningOn = !flags.maintenance;
      const ok = await UI.confirm(turningOn ? 'Bật chế độ bảo trì? Một banner cảnh báo sẽ hiện trên mọi trang.' : 'Tắt chế độ bảo trì?', { danger: false, okLabel: 'Xác nhận' });
      if (!ok) return;
      flags.maintenance = turningOn;
      Store.set('flags', flags);
      addLog('Quản trị viên ' + (turningOn ? 'bật' : 'tắt') + ' chế độ bảo trì hệ thống', 'update');
      UI.toast(turningOn ? 'Đã bật chế độ bảo trì' : 'Đã tắt chế độ bảo trì');
      renderMaint();
      render();
    });

    document.getElementById('updForm').addEventListener('submit', e => {
      e.preventDefault();
      const title = document.getElementById('uTitle').value.trim();
      const content = document.getElementById('uContent').value.trim();
      const type = document.getElementById('uType').value;
      let valid = true;
      document.getElementById('eTitle').textContent = title.length >= 5 ? '' : 'Tiêu đề cần tối thiểu 5 ký tự';
      document.getElementById('eContent').textContent = content.length >= 10 ? '' : 'Nội dung cần tối thiểu 10 ký tự';
      if (title.length < 5 || content.length < 10) { UI.toast('Biểu mẫu chưa hợp lệ', 'error'); return; }

      addLog(title, type, { title, content, actor: user.fullName });
      document.getElementById('updForm').reset();
      UI.toast('Đã đăng ' + (type === 'announcement' ? 'bản tin' : 'bản cập nhật'));
      render();
    });

    async function editLog(l0) {
      const values = await UI.dialog({
        title: 'Sửa ' + (l0.type === 'announcement' ? 'bản tin' : 'bản cập nhật'),
        submitLabel: 'Lưu',
        fields: [
          { name: 'title', label: 'Tiêu đề', type: 'text', required: true, value: l0.title || '' },
          { name: 'content', label: 'Nội dung', type: 'textarea', required: true, value: l0.content || '' },
          { name: 'type', label: 'Loại', type: 'select', value: l0.type,
            options: [{ value: 'update', label: 'Bản cập nhật' }, { value: 'announcement', label: 'Bản tin' }] }
        ]
      });
      if (!values) return;
      const logs = Store.get('systemLogs');
      const l = logs.find(x => x.id === l0.id);
      l.title = values.title;
      l.content = values.content;
      l.type = values.type;
      l.action = values.title;
      Store.set('systemLogs', logs);
      addLog('Quản trị viên chỉnh sửa "' + values.title + '"', 'account');
      UI.toast('Đã lưu chỉnh sửa');
      render();
    }

    async function removeLog(l0) {
      const ok = await UI.confirm('Xóa "' + (l0.title || l0.action) + '"?', { title: 'Xóa bản ghi', okLabel: 'Xóa' });
      if (!ok) return;
      const logs = Store.get('systemLogs').filter(x => x.id !== l0.id);
      Store.set('systemLogs', logs);
      UI.toast('Đã xóa bản ghi');
      render();
    }

    function render() {
      UI.skeleton(listEl, 3, 'card');
      setTimeout(() => {
        try {
          const logs = Store.get('systemLogs')
            .filter(l => ['update', 'announcement'].includes(l.type))
            .sort((a, b) => b.at - a.at);
          if (!logs.length) {
            UI.empty(listEl, { icon: '🛠️', title: 'Chưa có bản cập nhật nào', message: 'Đăng bản cập nhật hoặc bản tin đầu tiên từ biểu mẫu phía trên.' });
            return;
          }
          listEl.innerHTML = logs.map(l => `
            <div class="card req-card">
              <div class="req-top">
                <span class="req-icon">${l.type === 'announcement' ? '📢' : '🛠️'}</span>
                <b>${UI.esc(l.title || l.action)}</b>
                <span class="badge badge-outline">${l.type === 'announcement' ? 'Bản tin' : 'Bản cập nhật'}</span>
              </div>
              <p class="req-desc">${UI.esc(l.content || '')}</p>
              <div class="req-meta"><span>${UI.esc(l.actor)}</span><span>·</span><span>${UI.timeAgo(l.at)}</span></div>
              <div class="req-actions">
                <button class="btn btn-sm btn-outline" data-edit="${l.id}">Sửa</button>
                <button class="btn btn-sm btn-danger" data-del="${l.id}">Xóa</button>
              </div>
            </div>`).join('');
          listEl.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => editLog(logs.find(x => x.id === b.dataset.edit))));
          listEl.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', () => removeLog(logs.find(x => x.id === b.dataset.del))));
        } catch (err) {
          UI.error(listEl, { onRetry: render });
        }
      }, 350);
    }

    renderMaint();
    render();
  }

  if (page === 'admin-dashboard') initDashboard();
  else if (page === 'admin-user-management') initUsers();
  else if (page === 'admin-system-updates') initUpdates();
})();
