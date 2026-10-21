// StayFlow – Khu Nhân viên vận hành: bảng nhiệm vụ, chi tiết nhiệm vụ, ca làm việc
(function () {
  const page = document.body.dataset.page || '';
  if (!page.startsWith('staff-')) return;
  const user = Auth.require(['staff']);
  if (!user) return;
  UI.init(page);

  const me = () => Auth.staffProfile(user);
  const myTasks = () => Store.get('tasks').filter(t => t.staffId === (me() || {}).id);
  const reqOf = t => Store.get('requests').find(r => r.id === t.requestId);

  function saveTasks(tasks) { Store.set('tasks', tasks); }
  function saveRequests(reqs) { Store.set('requests', reqs); }

  function pushTimeline(req, by, note) {
    req.timeline.push({ at: Date.now(), by, note });
  }

  // ---------- Hành động trên nhiệm vụ (dùng chung cho bảng và trang chi tiết) ----------
  async function startTask(taskId, done) {
    const tasks = Store.get('tasks');
    const reqs = Store.get('requests');
    const t = tasks.find(x => x.id === taskId);
    const r = reqs.find(x => x.id === t.requestId);
    t.status = 'in-progress';
    r.status = 'in-progress';
    pushTimeline(r, me().name, 'Bắt đầu xử lý');
    saveTasks(tasks); saveRequests(reqs);
    UI.toast('Đã bắt đầu nhiệm vụ "' + r.title + '"');
    done();
  }

  async function completeTask(taskId, done) {
    const tasks = Store.get('tasks');
    const reqs = Store.get('requests');
    const t = tasks.find(x => x.id === taskId);
    const r = reqs.find(x => x.id === t.requestId);
    t.status = 'done';
    r.status = 'completed';
    r.completedAt = Date.now();
    pushTimeline(r, me().name, 'Hoàn thành nhiệm vụ');
    saveTasks(tasks); saveRequests(reqs);
    UI.toast('🎉 Đã hoàn thành "' + r.title + '"');
    done();
  }

  async function rejectTask(taskId, done) {
    const ok = await UI.confirm('Từ chối nhiệm vụ này? Yêu cầu sẽ quay lại hàng chờ điều phối của Quản lý.', { title: 'Từ chối nhiệm vụ', okLabel: 'Từ chối' });
    if (!ok) return;
    const tasks = Store.get('tasks');
    const reqs = Store.get('requests');
    const t = tasks.find(x => x.id === taskId);
    const r = reqs.find(x => x.id === t.requestId);
    t.status = 'rejected';
    r.status = 'pending';
    r.assignedTo = null;
    pushTimeline(r, me().name, 'Nhân viên từ chối nhiệm vụ – yêu cầu quay lại hàng chờ');
    saveTasks(tasks); saveRequests(reqs);
    UI.toast('Đã từ chối nhiệm vụ', 'info');
    done();
  }

  function taskCard(t, r, withButtons) {
    const sv = serviceTypeById(r.serviceTypeId);
    const stay = stayById(r.stayId);
    const sla = ['assigned', 'in-progress'].includes(t.status) ? UI.slaInfo(r) : null;
    const slaHtml = sla
      ? `<div class="sla-row ${sla.cls}"><div class="sla-bar"><div class="sla-fill" style="width:${sla.pct}%"></div></div><span class="sla-label">SLA ${sla.label}</span></div>`
      : (t.status === 'done' ? '<span class="badge badge-success">✔ Đã xong</span>' : '');
    let buttons = '';
    if (withButtons) {
      if (t.status === 'assigned') {
        buttons = `<button class="btn btn-sm btn-primary" data-act="start" data-id="${t.id}">▶ Bắt đầu</button>
                   <button class="btn btn-sm btn-danger" data-act="reject" data-id="${t.id}">Từ chối</button>`;
      } else if (t.status === 'in-progress') {
        buttons = `<button class="btn btn-sm btn-primary" data-act="done" data-id="${t.id}">✔ Hoàn thành</button>`;
      }
    }
    return `
      <div class="card req-card" style="margin-top:12px">
        <div class="req-top">
          <span class="req-icon">${sv ? sv.icon : '⭐'}</span>
          <b style="font-size:.95rem">${UI.esc(r.title)}</b>
          ${UI.priorityBadge(r.priority)}
        </div>
        <div class="req-meta">
          <span>Phòng ${stay ? stay.room : '?'}</span><span>·</span>
          <span>${sv ? UI.esc(sv.name) : ''}</span><span>·</span>
          <span>${UI.timeAgo(r.createdAt)}</span>
        </div>
        ${slaHtml}
        <div class="req-actions">
          ${buttons}
          <a class="btn btn-sm btn-outline" href="staff-task-detail.html?id=${t.id}">Chi tiết</a>
        </div>
      </div>`;
  }

  function bindActions(container, onChange) {
    container.querySelectorAll('[data-act]').forEach(btn => {
      btn.addEventListener('click', () => {
        const act = btn.dataset.act, id = btn.dataset.id;
        if (act === 'start') startTask(id, onChange);
        else if (act === 'done') completeTask(id, onChange);
        else if (act === 'reject') rejectTask(id, onChange);
      });
    });
  }

  // ---------- Bảng nhiệm vụ ----------
  function initBoard() {
    const app = document.getElementById('app');
    if (!me()) {
      UI.empty(app, {
        icon: '🧹', title: 'Tài khoản chưa có hồ sơ nhân viên',
        message: 'Hãy liên hệ Quản lý để hoàn tất gắn hồ sơ nhân viên với tài khoản của bạn.',
        actionLabel: 'Về bảng tin', actionHref: 'guest-dashboard.html'
      });
      return;
    }
    UI.skeleton(app, 3, 'card');

    setTimeout(function render() {
      try {
        const tasks = myTasks()
          .map(t => ({ t, r: reqOf(t) }))
          .filter(x => x.r)
          .sort((a, b) => a.r.slaDueAt - b.r.slaDueAt);
        const cols = { assigned: [], 'in-progress': [], done: [] };
        tasks.forEach(x => { if (cols[x.t.status]) cols[x.t.status].push(x); });

        const colTitles = {
          assigned: '📥 Cần nhận',
          'in-progress': '⚙️ Đang xử lý',
          done: '✅ Hoàn thành'
        };
        app.innerHTML = `
          <p class="page-sub" style="margin-bottom:12px">Vị trí của bạn: <b>${DEPARTMENTS[me().position].icon} ${DEPARTMENTS[me().position].name}</b> · Chỉ hiển thị nhiệm vụ được điều phối cho bạn.</p>
          <div class="board-cols">
            ${Object.keys(cols).map(k => `
              <div class="board-col">
                <h3>${colTitles[k]} <span class="count">${cols[k].length}</span></h3>
                ${cols[k].length ? cols[k].map(x => taskCard(x.t, x.r, k !== 'done')).join('')
                  : '<div class="col-empty">Chưa có nhiệm vụ nào</div>'}
              </div>`).join('')}
          </div>`;
        bindActions(app, render);
      } catch (err) {
        UI.error(app, { onRetry: render });
      }
    }, 400);
  }

  // ---------- Chi tiết nhiệm vụ ----------
  function initDetail() {
    const app = document.getElementById('app');
    if (!me()) { UI.empty(app, { icon: '🧹', title: 'Chưa có hồ sơ nhân viên', actionLabel: 'Về bảng tin', actionHref: 'guest-dashboard.html' }); return; }
    const id = new URLSearchParams(location.search).get('id');

    function findPair() {
      const t = Store.get('tasks').find(x => x.id === id && x.staffId === me().id);
      const r = t ? Store.get('requests').find(x => x.id === t.requestId) : null;
      return t && r ? { t, r } : null;
    }

    function renderNotFound() {
      UI.error(app, { message: 'Không tìm thấy nhiệm vụ (có thể đã bị điều phối lại).' });
      app.insertAdjacentHTML('beforeend', '<a class="btn btn-primary" href="staff-task-board.html" style="margin-top:12px">← Về bảng nhiệm vụ</a>');
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
        <a href="staff-task-board.html" style="font-size:.9rem">← Về bảng nhiệm vụ</a>
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

  // ---------- Ca làm việc ----------
  function initShifts() {
    const app = document.getElementById('app');
    if (!me()) { UI.empty(app, { icon: '🧹', title: 'Chưa có hồ sơ nhân viên', actionLabel: 'Về bảng tin', actionHref: 'guest-dashboard.html' }); return; }
    UI.skeleton(app, 3, 'card');

    setTimeout(function render() {
      try {
        const shifts = Store.get('shifts').filter(s => s.staffId === me().id).sort((a, b) => a.dayOffset - b.dayOffset);
        const swaps = Store.get('swapRequests').filter(s => s.staffId === me().id).sort((a, b) => b.createdAt - a.createdAt);
        const typeLabels = { morning: 'Ca sáng ☀️', afternoon: 'Ca chiều 🌤', night: 'Ca đêm 🌙' };
        const swapStatus = { pending: { label: 'Chờ duyệt', cls: 'badge-warn' }, approved: { label: 'Đã duyệt', cls: 'badge-success' }, rejected: { label: 'Bị từ chối', cls: 'badge-danger' } };

        if (!shifts.length) {
          UI.empty(app, { icon: '🗓', title: 'Chưa có lịch ca nào', message: 'Quản lý chưa xếp ca làm việc cho bạn.' });
          return;
        }

        app.innerHTML = `
          <div class="grid-2">
            <div class="card">
              <div class="card-title">📅 Lịch ca của tôi</div>
              ${shifts.map(s => {
                const hasPending = swaps.some(w => w.shiftId === s.id && w.status === 'pending');
                return `
                  <div class="card shift-card ${s.dayOffset === 0 ? 'today' : ''}" style="box-shadow:none; margin-bottom:10px">
                    <span class="shift-time">${s.start}–${s.end}</span>
                    <span class="shift-info">${UI.fmtDate(Date.now() + s.dayOffset * 86400000)}<br><small>${typeLabels[s.type] || s.type}${s.dayOffset === 0 ? ' · HÔM NAY' : ''}</small></span>
                    ${!hasPending ? `<button class="btn btn-sm btn-outline" data-swap="${s.id}" data-date="${UI.esc(UI.fmtDate(Date.now() + s.dayOffset * 86400000))}">Đề xuất đổi ca</button>`
                                  : '<span class="badge badge-warn">Chờ duyệt đổi ca</span>'}
                  </div>`;
              }).join('')}
            </div>

            <div class="card">
              <div class="card-title">🔄 Yêu cầu đổi ca của tôi</div>
              ${swaps.length ? swaps.map(w => {
                const s = Store.get('shifts').find(x => x.id === w.shiftId);
                const si = swapStatus[w.status];
                return `
                  <div class="req-card" style="border-bottom:1px solid var(--border); border-radius:0; box-shadow:none; margin-bottom:10px; padding-bottom:10px">
                    <div class="req-top"><b style="font-size:.92rem">Ca ${s ? s.start + '–' + s.end : '?'}</b><span class="badge ${si.cls}">${si.label}</span></div>
                    <p class="req-desc">Lý do: ${UI.esc(w.reason)}</p>
                    <p class="req-meta">Gửi ${UI.timeAgo(w.createdAt)}</p>
                  </div>`;
              }).join('') : '<p class="card-sub">Chưa có yêu cầu đổi ca nào.</p>'}
            </div>
          </div>`;

        app.querySelectorAll('[data-swap]').forEach(btn => {
          btn.addEventListener('click', async () => {
            const values = await UI.dialog({
              title: 'Đề xuất đổi ca',
              description: 'Ca ' + btn.dataset.date + '. Quản lý sẽ xem xét và phê duyệt.',
              submitLabel: 'Gửi đề xuất',
              fields: [
                { name: 'reason', label: 'Lý do đổi ca', type: 'textarea', required: true, placeholder: 'Ví dụ: Có việc gia đình buổi chiều' }
              ]
            });
            if (!values) return;
            const swapsAll = Store.get('swapRequests');
            swapsAll.push({ id: newId('sw'), staffId: me().id, shiftId: btn.dataset.swap, reason: values.reason, status: 'pending', createdAt: Date.now() });
            Store.set('swapRequests', swapsAll);
            UI.toast('Đã gửi đề xuất đổi ca, chờ Quản lý duyệt');
            render();
          });
        });
      } catch (err) {
        UI.error(app, { onRetry: render });
      }
    }, 400);
  }

  if (page === 'staff-task-board') initBoard();
  else if (page === 'staff-task-detail') initDetail();
  else if (page === 'staff-shift-view') initShifts();
})();
