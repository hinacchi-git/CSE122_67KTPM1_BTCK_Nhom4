// StayFlow – Quản trị: Quản lý tài khoản & phân quyền
(function () {
  if (!window.AdminApp || document.body.dataset.page !== 'admin-user-management') return;
  const { user, roleText } = AdminApp;

  function initUsers() {
    const app = document.getElementById('app');
    const qSearch = document.getElementById('qSearch');
    const roleFilter = document.getElementById('roleFilter');
    const sortBy = document.getElementById('sortBy');
    const countEl = document.getElementById('resultCount');

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
          const sb = sortBy.value;
          const all = Store.get('users');
          let users = all.slice();
          if (q) users = users.filter(u => (u.username + ' ' + u.fullName).toLowerCase().includes(q));
          if (rf) users = users.filter(u => u.role === rf);
          if (sb === 'old') users.sort((a, b) => a.createdAt - b.createdAt);
          else if (sb === 'name') users.sort((a, b) => a.fullName.localeCompare(b.fullName, 'vi'));
          else users.sort((a, b) => b.createdAt - a.createdAt);
          countEl.textContent = `Đang hiển thị ${users.length}/${all.length} tài khoản`;

          if (!users.length) {
            const filtered = q || rf;
            UI.empty(app, {
              icon: '🔍', title: 'Không tìm thấy tài khoản',
              message: 'Thử đổi từ khóa hoặc bộ lọc vai trò.',
              actionLabel: filtered ? 'Xóa bộ lọc' : '',
              onclick: filtered ? () => { qSearch.value = ''; roleFilter.value = ''; sortBy.value = 'new'; render(); } : null
            });
            return;
          }

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
    sortBy.addEventListener('change', render);
    render();
  }

  initUsers();
})();
