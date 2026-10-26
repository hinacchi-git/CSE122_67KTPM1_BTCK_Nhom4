// StayFlow – Nhân viên: Chi tiết nhiệm vụ
(function () {
  if (!window.StaffApp || document.body.dataset.page !== 'staff-task-detail') return;
  const { me, bindActions, saveTasks, saveRequests, pushTimeline } = StaffApp;

  function initDetail() {
    const app = document.getElementById('app');
    if (!me()) { UI.empty(app, { icon: '🧹', title: 'Chưa có hồ sơ nhân viên', actionLabel: 'Về bảng nhiệm vụ', actionHref: appUrl('staff/task-board.html') }); return; }
    const id = new URLSearchParams(location.search).get('id');

    function findPair() {
      const t = Store.get('tasks').find(x => x.id === id && x.staffId === me().id);
      const r = t ? Store.get('requests').find(x => x.id === t.requestId) : null;
      return t && r ? { t, r } : null;
    }

    function renderNotFound() {
      UI.error(app, { message: 'Không tìm thấy nhiệm vụ (có thể đã bị điều phối lại).' });
      app.insertAdjacentHTML('beforeend', `<a class="btn btn-primary" href="${appUrl('staff/task-board.html')}" style="margin-top:12px">← Về bảng nhiệm vụ</a>`);
    }

    if (!findPair()) { renderNotFound(); return; }

    function render() {
      const pair = findPair();
      if (!pair) { renderNotFound(); return; }
      const { t, r } = pair;
      const sv = serviceTypeById(r.serviceTypeId);
      const stay = stayById(r.stayId);
      const sla = ['assigned', 'in-progress'].includes(r.status) ? UI.slaInfo(r) : null;
      app.innerHTML = `
        <a href="${appUrl('staff/task-board.html')}" style="font-size:.9rem">← Về bảng nhiệm vụ</a>
        <div class="card" style="margin-top:12px">
          <div class="req-top">
            <span class="req-icon" style="font-size:1.8rem">${sv ? sv.icon : '⭐'}</span>
            <b style="font-size:1.15rem">${UI.esc(r.title)}</b>
            ${UI.statusBadge(r.status)}
            ${UI.priorityBadge(r.priority)}
          </div>
          <p class="req-desc">${UI.esc(r.description)}</p>
          <div class="req-meta">
            <span>Phòng ${stay ? stay.room : '?'} – ${UI.esc(stay ? stay.guestName : '')}</span><span>·</span>
            <span>${sv ? UI.esc(sv.name) : ''}</span><span>·</span>
            <span>Khách tạo ${UI.timeAgo(r.createdAt)}</span>
          </div>
          ${sla ? `<div class="sla-row ${sla.cls}"><div class="sla-bar"><div class="sla-fill" style="width:${sla.pct}%"></div></div><span class="sla-label">SLA ${sla.label}</span></div>` : ''}
          ${r.status === 'completed' ? '<div class="success-banner" style="margin-top:12px">✔ Nhiệm vụ đã hoàn thành. Cảm ơn bạn!</div>' : ''}
          <div class="req-actions" style="margin-top:14px">
            ${t.status === 'assigned' ? '<button class="btn btn-primary" data-act="start" data-id="' + t.id + '">▶ Bắt đầu xử lý</button><button class="btn btn-danger" data-act="reject" data-id="' + t.id + '">Từ chối nhiệm vụ</button>' : ''}
            ${t.status === 'in-progress' ? '<button class="btn btn-primary" data-act="done" data-id="' + t.id + '">✔ Hoàn thành nhiệm vụ</button>' : ''}
          </div>
        </div>

        <div class="card" style="margin-top:16px">
          <div class="card-title">📝 Ghi chú xử lý</div>
          ${t.notes.length ? t.notes.map(n => `<p class="card-sub">• ${UI.esc(n.text)} <small>(${UI.timeAgo(n.at)})</small></p>`).join('') : '<p class="card-sub">Chưa có ghi chú nào.</p>'}
          <form id="noteForm" style="margin-top:12px">
            <label class="field">
              <span class="field-label">Thêm ghi chú</span>
              <textarea id="noteText" rows="2" placeholder="Ví dụ: Đã lấy khăn tắm mới, đang đi lên phòng 502"></textarea>
              <small class="field-err" id="noteErr"></small>
            </label>
            <button class="btn btn-outline btn-sm" type="submit">Lưu ghi chú</button>
          </form>
        </div>

        <div class="card" style="margin-top:16px">
          <div class="card-title">🕒 Tiến độ yêu cầu (khách cũng nhìn thấy)</div>
          <ul class="timeline">
            ${r.timeline.map(x => `<li>${UI.esc(x.note)}<small>${UI.esc(x.by)} · ${UI.fmtDateTime(x.at)}</small></li>`).join('')}
          </ul>
        </div>`;
      bindActions(app, render);

      app.querySelector('#noteForm').addEventListener('submit', e => {
        e.preventDefault();
        const text = app.querySelector('#noteText').value.trim();
        if (text.length < 3) { app.querySelector('#noteErr').textContent = 'Ghi chú cần tối thiểu 3 ký tự'; return; }
        const all = Store.get('tasks');
        const task = all.find(x => x.id === t.id);
        task.notes.push({ at: Date.now(), text });
        saveTasks(all);
        const reqs = Store.get('requests');
        const req = reqs.find(x => x.id === r.id);
        pushTimeline(req, me().name, 'Ghi chú: ' + text);
        saveRequests(reqs);
        UI.toast('Đã lưu ghi chú');
        render();
      });
    }
    render();
  }

  initDetail();
})();
