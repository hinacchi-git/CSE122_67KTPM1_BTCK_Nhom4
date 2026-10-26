// StayFlow – Quản lý: Quản lý loại dịch vụ
(function () {
  if (!window.ManagerApp || document.body.dataset.page !== 'manager-service-type-management') return;
  const { user } = ManagerApp;

  function initServiceTypes() {
    const app = document.getElementById('app');

    async function openDialog(existing) {
      const values = await UI.dialog({
        title: existing ? 'Sửa loại dịch vụ' : 'Thêm loại dịch vụ',
        submitLabel: existing ? 'Lưu thay đổi' : 'Thêm mới',
        fields: [
          { name: 'name', label: 'Tên dịch vụ', type: 'text', required: true, value: existing ? existing.name : '', placeholder: 'Ví dụ: Dọn phòng' },
          { name: 'department', label: 'Bộ phận xử lý', type: 'select', value: existing ? existing.department : 'housekeeping',
            options: Object.keys(DEPARTMENTS).map(k => ({ value: k, label: DEPARTMENTS[k].icon + ' ' + DEPARTMENTS[k].name })) },
          { name: 'sla', label: 'Thời gian SLA (phút, 5–240)', type: 'number', required: true, value: existing ? existing.slaMinutes : 30,
            validate: v => (v >= 5 && v <= 240) ? '' : 'SLA phải từ 5 đến 240 phút' },
          { name: 'icon', label: 'Biểu tượng (emoji)', type: 'text', value: existing ? existing.icon : '⭐' }
        ]
      });
      if (!values) return;
      const types = Store.get('serviceTypes');
      if (existing) {
        const t = types.find(x => x.id === existing.id);
        Object.assign(t, { name: values.name, department: values.department, slaMinutes: Number(values.sla), icon: values.icon || '⭐' });
        addLog('Quản lý ' + user.fullName + ' sửa loại dịch vụ "' + values.name + '"', 'account');
        UI.toast('Đã cập nhật loại dịch vụ');
      } else {
        types.push({ id: newId('sv'), name: values.name, department: values.department, slaMinutes: Number(values.sla), active: true, icon: values.icon || '⭐' });
        addLog('Quản lý ' + user.fullName + ' thêm loại dịch vụ "' + values.name + '"', 'account');
        UI.toast('Đã thêm loại dịch vụ mới');
      }
      Store.set('serviceTypes', types);
      render();
    }

    function render() {
      UI.skeleton(app, 4, 'row');
      setTimeout(() => {
        try {
          const types = Store.get('serviceTypes');
          app.innerHTML = `
            <div class="table-wrap">
              <table>
                <thead><tr><th>Dịch vụ</th><th>Bộ phận</th><th>SLA (phút)</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
                <tbody>
                  ${types.map(t => `
                    <tr class="${t.active ? '' : 'row-disabled'}">
                      <td>${t.icon} <b>${UI.esc(t.name)}</b></td>
                      <td>${UI.deptBadge(t.department)}</td>
                      <td>${t.slaMinutes}</td>
                      <td>${t.active ? '<span class="badge badge-success">Đang hoạt động</span>' : '<span class="badge badge-muted">Vô hiệu hóa</span>'}</td>
                      <td>
                        <button class="btn btn-sm btn-outline" data-edit="${t.id}">Sửa</button>
                        <button class="btn btn-sm ${t.active ? 'btn-danger' : 'btn-primary'}" data-toggle="${t.id}">${t.active ? 'Vô hiệu hóa' : 'Kích hoạt'}</button>
                      </td>
                    </tr>`).join('')}
                </tbody>
              </table>
            </div>`;
          app.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => openDialog(Store.get('serviceTypes').find(x => x.id === b.dataset.edit))));
          app.querySelectorAll('[data-toggle]').forEach(b => b.addEventListener('click', async () => {
            const types = Store.get('serviceTypes');
            const t = types.find(x => x.id === b.dataset.toggle);
            const ok = await UI.confirm((t.active ? 'Vô hiệu hóa' : 'Kích hoạt') + ' dịch vụ "' + t.name + '"?', { danger: t.active, okLabel: 'Xác nhận' });
            if (!ok) return;
            t.active = !t.active;
            Store.set('serviceTypes', types);
            addLog('Quản lý ' + user.fullName + (t.active ? ' kích hoạt' : ' vô hiệu hóa') + ' dịch vụ "' + t.name + '"', 'account');
            UI.toast('Đã cập nhật trạng thái dịch vụ');
            render();
          }));
        } catch (err) {
          UI.error(app, { onRetry: render });
        }
      }, 350);
    }

    document.getElementById('addBtn').addEventListener('click', () => openDialog(null));
    render();
  }

  initServiceTypes();
})();
