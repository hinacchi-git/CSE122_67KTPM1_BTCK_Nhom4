// StayFlow – Quản trị: Cập nhật hệ thống
(function () {
  if (!window.AdminApp || document.body.dataset.page !== 'admin-system-updates') return;
  const { user } = AdminApp;

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

  initUpdates();
})();
