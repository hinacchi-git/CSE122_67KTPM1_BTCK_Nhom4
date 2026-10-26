// StayFlow – Quản lý: Quản lý nhân sự
(function () {
  if (!window.ManagerApp || document.body.dataset.page !== 'manager-user-management') return;
  const { user } = ManagerApp;

  function initUsers() {
    const app = document.getElementById('app');
    const qSearch = document.getElementById('qSearch');
    const roleFilter = document.getElementById('roleFilter');
    const countEl = document.getElementById('resultCount');

    async function openCreate() {
      const values = await UI.dialog({
        title: 'Tạo tài khoản Nhân viên',
        description: 'Tài khoản mới sẽ có vai trò Nhân viên với vị trí bạn chọn.',
        submitLabel: 'Tạo tài khoản',
        fields: [
          { name: 'fullName', label: 'Họ và tên', type: 'text', required: true },
          { name: 'username', label: 'Tên đăng nhập', type: 'text', required: true,
            validate: v => /\s/.test(v) ? 'Không chứa khoảng trắng' : (Store.get('users').some(u => u.username === v.toLowerCase()) ? 'Tên đăng nhập đã tồn tại' : '') },
          { name: 'position', label: 'Vị trí làm việc', type: 'select', required: true,
            options: Object.keys(DEPARTMENTS).map(k => ({ value: k, label: DEPARTMENTS[k].icon + ' ' + DEPARTMENTS[k].name })) },
          { name: 'password', label: 'Mật khẩu ban đầu (tối thiểu 6 ký tự)', type: 'password', required: true,
            validate: v => v.length >= 6 ? '' : 'Cần tối thiểu 6 ký tự' },
          { name: 'confirm', label: 'Nhập lại mật khẩu', type: 'password', required: true,
            validate: (v, all) => v !== all.password ? 'Mật khẩu chưa khớp' : '' }
        ]
      });
      if (!values) return;
      const users = Store.get('users');
      const u = {
        id: newId('u'), username: values.username.toLowerCase(), password: values.password,
        fullName: values.fullName, role: 'staff', position: values.position,
        status: 'active', createdAt: Date.now()
      };
      users.push(u);
      Store.set('users', users);
      syncStaffProfile(u);
      addLog('Quản lý ' + user.fullName + ' tạo tài khoản nhân viên ' + values.username.toLowerCase() + ' (' + DEPARTMENTS[values.position].name + ')', 'grant');
      UI.toast('Đã tạo tài khoản nhân viên: ' + values.username.toLowerCase());
      render();
    }

    async function changePosition(u) {
      const values = await UI.dialog({
        title: 'Đổi vị trí làm việc',
        description: u.fullName + ' (' + u.username + ')',
        submitLabel: 'Lưu vị trí',
        fields: [
          { name: 'position', label: 'Vị trí mới', type: 'select', value: u.position,
            options: Object.keys(DEPARTMENTS).map(k => ({ value: k, label: DEPARTMENTS[k].icon + ' ' + DEPARTMENTS[k].name })) }
        ]
      });
      if (!values) return;
      const users = Store.get('users');
      const x = users.find(y => y.id === u.id);
      x.position = values.position;
      Store.set('users', users);
      syncStaffProfile(x);
      addLog('Quản lý ' + user.fullName + ' đổi vị trí ' + u.username + ' sang ' + DEPARTMENTS[values.position].name, 'grant');
      UI.toast('Đã đổi vị trí làm việc');
      render();
    }

    async function toggleStatus(u) {
      const disabling = u.status === 'active';
      const ok = await UI.confirm((disabling ? 'Vô hiệu hóa' : 'Kích hoạt lại') + ' tài khoản "' + u.username + '"?', { danger: disabling, okLabel: 'Xác nhận' });
      if (!ok) return;
      const users = Store.get('users');
      const x = users.find(y => y.id === u.id);
      x.status = disabling ? 'disabled' : 'active';
      Store.set('users', users);
      syncStaffProfile(x);
      addLog('Quản lý ' + user.fullName + (disabling ? ' vô hiệu hóa' : ' kích hoạt') + ' tài khoản ' + u.username, 'account');
      UI.toast('Đã cập nhật trạng thái tài khoản');
      render();
    }

    function render() {
      UI.skeleton(app, 4, 'row');
      setTimeout(() => {
        try {
          const all = Store.get('users');
          const q = qSearch.value.trim().toLowerCase();
          const rf = roleFilter.value;
          const users = all.filter(u => {
            const matchQ = !q || u.username.toLowerCase().includes(q) || u.fullName.toLowerCase().includes(q);
            const matchR = !rf || u.role === rf;
            return matchQ && matchR;
          });
          countEl.textContent = `Đang hiển thị ${users.length}/${all.length} tài khoản`;

          if (!users.length) {
            UI.empty(app, {
              icon: '🔍',
              title: 'Không tìm thấy tài khoản phù hợp',
              message: 'Thử từ khóa khác hoặc bỏ bộ lọc để xem toàn bộ danh sách.',
              actionLabel: 'Xóa bộ lọc',
              onclick: () => { qSearch.value = ''; roleFilter.value = ''; render(); }
            });
            return;
          }

          app.innerHTML = `
            <div class="table-wrap">
              <table>
                <thead><tr><th>Tài khoản</th><th>Họ và tên</th><th>Vai trò</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
                <tbody>
                  ${users.map(u => {
                    const canManage = ['guest', 'staff'].includes(u.role);
                    return `
                      <tr class="${u.status === 'active' ? '' : 'row-disabled'}">
                        <td><b>${UI.esc(u.username)}</b></td>
                        <td>${UI.esc(u.fullName)}</td>
                        <td>${u.role === 'staff' ? UI.deptBadge(u.position) : UI.esc(Auth.roleLabel(u))}</td>
                        <td>${u.status === 'active' ? '<span class="badge badge-success">Hoạt động</span>' : '<span class="badge badge-danger">Bị vô hiệu</span>'}</td>
                        <td>
                          ${canManage
                            ? `${u.role === 'staff' ? `<button class="btn btn-sm btn-outline" data-pos="${u.id}">Đổi vị trí</button>` : ''}
                               <button class="btn btn-sm ${u.status === 'active' ? 'btn-danger' : 'btn-primary'}" data-toggle="${u.id}">${u.status === 'active' ? 'Vô hiệu hóa' : 'Kích hoạt'}</button>`
                            : '<small class="card-sub">🔒 Chỉ Quản trị viên được chỉnh</small>'}
                        </td>
                      </tr>`;
                  }).join('')}
                </tbody>
              </table>
            </div>`;
          app.querySelectorAll('[data-pos]').forEach(b => b.addEventListener('click', () => changePosition(users.find(u => u.id === b.dataset.pos))));
          app.querySelectorAll('[data-toggle]').forEach(b => b.addEventListener('click', () => toggleStatus(users.find(u => u.id === b.dataset.toggle))));
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

  initUsers();
})();
