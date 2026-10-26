// StayFlow – Khu Nhân viên: xác thực, khung trang và nghiệp vụ nhiệm vụ dùng chung
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
          <a class="btn btn-sm btn-outline" href="${appUrl('staff/task-detail.html?id=' + t.id)}">Chi tiết</a>
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

  window.StaffApp = {
    user, me, myTasks, reqOf, saveTasks, saveRequests, pushTimeline,
    startTask, completeTask, rejectTask, taskCard, bindActions
  };
})();
