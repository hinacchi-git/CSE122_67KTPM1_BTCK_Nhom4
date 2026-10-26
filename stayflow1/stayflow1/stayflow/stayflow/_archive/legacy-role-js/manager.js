// StayFlow – Khu Quản lý khách sạn: điều phối, SLA, báo cáo, loại dịch vụ, nhân sự
(function () {
  const page = document.body.dataset.page || '';
  if (!page.startsWith('manager-')) return;
  const user = Auth.require(['manager']);
  if (!user) return;
  UI.init(page);

  const allRequests = () => Store.get('requests');
  const allTasks = () => Store.get('tasks');
  const allStaff = () => Store.get('staff');

  function reqCard(r, opts) {
    const o = opts || {};
    const sv = serviceTypeById(r.serviceTypeId);
    const stay = stayById(r.stayId);
    const lines = `
      <p class="req-desc">${UI.esc(r.description)}</p>
      <div class="req-meta">
        <span>Phòng ${stay ? stay.room : '?'} – ${UI.esc(stay ? stay.guestName : '')}</span><span>·</span>
        <span>${sv ? UI.esc(sv.name) : ''}</span><span>·</span>
        <span>Tạo ${UI.timeAgo(r.createdAt)}</span>
        ${r.aiClassified ? '<span>·</span><span title="Danh mục do AI hỗ trợ phân loại">🤖 Danh mục AI</span>' : ''}
      </div>`;
    const sla = ['pending', 'confirmed', 'in-progress'].includes(r.status) ? UI.slaInfo(r) : null;
    const slaHtml = sla ? `<div class="sla-row ${sla.cls}"><div class="sla-bar"><div class="sla-fill" style="width:${sla.pct}%"></div></div><span class="sla-label">SLA ${sla.label}</span></div>` : '';
    return `
      <div class="card req-card" data-req="${r.id}">
        <div class="req-top">
          <span class="req-icon">${sv ? sv.icon : '⭐'}</span>
          <b>${UI.esc(r.title)}</b>
          ${UI.priorityBadge(r.priority)}
          ${UI.statusBadge(r.status)}
          ${r.aiPriorityUsed ? '<span class="badge badge-outline" title="Mức ưu tiên do AI gợi ý">⚡ AI</span>' : ''}
        </div>
        ${lines}${slaHtml}
        ${o.actions || ''}
        <div class="ai-inline" id="ai-box-${r.id}"></div>
      </div>`;
  }

  // ---------- Bảng điều phối ----------
  function initDispatch() {
    let currentTab = 'pending';
    const listEl = document.getElementById('tabList');
    const deptFilter = document.getElementById('deptFilter');

    function staffName(r) {
      const s = r.assignedTo ? staffById(r.assignedTo) : null;
      return s ? s.name : '';
    }

    async function runPriority(r) {
      const box = document.getElementById('ai-box-' + r.id);
      box.innerHTML = '<div class="ai-processing">⚡ AI đang phân tích mức ưu tiên<span class="dots"></span></div>';
      const result = await AI.suggestPriority(r);
      if (!result.ok) {
        box.innerHTML = `
          <div class="ai-result fail">
            <b>⚠️ ${UI.esc(result.message)}</b>
            <div class="req-actions"><button class="btn btn-sm btn-outline" id="pRetry">🔄 Thử lại</button><button class="btn btn-sm btn-ghost" id="pSkip">Bỏ qua</button></div>
          </div>`;
        box.querySelector('#pRetry').addEventListener('click', () => runPriority(r));
        box.querySelector('#pSkip').addEventListener('click', () => box.innerHTML = '');
        return;
      }
      const p = PRIORITY[result.level];
      box.innerHTML = `
        <div class="ai-result">
          <b>⚡ AI đề xuất mức: <span class="badge ${p.cls}">${p.label}</span></b>
          ${result.unsure ? '' : ''}
          <p class="ai-reason">Vì sao? ${UI.esc(result.reason)}</p>
          <div class="req-actions">
            <button class="btn btn-sm btn-primary" id="pAccept">✔️ Chấp nhận</button>
            <button class="btn btn-sm btn-outline" id="pManual">✍️ Tự chỉnh</button>
            <button class="btn btn-sm btn-ghost" id="pReject">Từ chối</button>
          </div>
          <div id="pManualBox" hidden>
            <label class="field" style="margin-top:8px">
              <span class="field-label">Chọn mức ưu tiên thủ công</span>
              <select id="pSelect">
                <option value="low">Thấp</option><option value="medium">Trung bình</option>
                <option value="high">Cao</option><option value="urgent">Khẩn cấp</option>
              </select>
            </label>
            <button class="btn btn-sm btn-primary" id="pSave">Lưu mức ưu tiên</button>
          </div>
        </div>`;
      box.querySelector('#pAccept').addEventListener('click', () => applyPriority(r.id, result.level, true));
      box.querySelector('#pReject').addEventListener('click', () => { box.innerHTML = ''; UI.toast('Đã từ chối đề xuất của AI', 'info'); });
      box.querySelector('#pManual').addEventListener('click', () => { box.querySelector('#pManualBox').hidden = false; });
      box.querySelector('#pSave').addEventListener('click', () => applyPriority(r.id, box.querySelector('#pSelect').value, false));
    }

    function applyPriority(reqId, level, byAI) {
      const reqs = allRequests();
      const r = reqs.find(x => x.id === reqId);
      r.priority = level;
      r.aiPriorityUsed = byAI;
      r.timeline.push({ at: Date.now(), by: 'Quản lý', note: 'Đặt mức ưu tiên: ' + PRIORITY[level].label + (byAI ? ' (theo đề xuất AI)' : '') });
      Store.set('requests', reqs);
      UI.toast('Đã đặt ưu tiên: ' + PRIORITY[level].label + (byAI ? ' (theo AI)' : ''));
      render();
    }

    async function assign(r) {
      const sv = serviceTypeById(r.serviceTypeId);
      const candidates = allStaff().filter(s => s.position === sv.department && s.status === 'active');
      if (!candidates.length) {
        UI.toast('Không có nhân viên đang hoạt động ở bộ phận ' + DEPARTMENTS[sv.department].name, 'error');
        return;
      }
      const values = await UI.dialog({
        title: 'Điều phối yêu cầu',
        description: '"' + r.title + '" · Bộ phận: ' + DEPARTMENTS[sv.department].name,
        submitLabel: 'Điều phối',
        fields: [
          { name: 'staffId', label: 'Chọn nhân viên xử lý', type: 'radio', required: true,
            options: candidates.map(s => ({ value: s.id, label: s.name + ' · ' + DEPARTMENTS[s.position].name })) }
        ]
      });
      if (!values) return;
      const reqs = allRequests();
      const tasks = allTasks();
      const req = reqs.find(x => x.id === r.id);
      const st = staffById(values.staffId);
      req.status = 'confirmed';
      req.assignedTo = st.id;
      req.timeline.push({ at: Date.now(), by: 'Quản lý', note: 'Điều phối cho ' + st.name + ' (' + DEPARTMENTS[st.position].name + ')' });
      tasks.push({ id: newId('t'), requestId: req.id, staffId: st.id, status: 'assigned', createdAt: Date.now(), notes: [] });
      Store.set('requests', reqs);
      Store.set('tasks', tasks);
      addLog('Quản lý ' + user.fullName + ' điều phối yêu cầu "' + req.title + '" cho ' + st.name, 'dispatch');
      UI.toast('Đã điều phối cho ' + st.name);
      render();
    }

    function approveSwap(sw, approved) {
      const swaps = Store.get('swapRequests');
      const s = swaps.find(x => x.id === sw.id);
      s.status = approved ? 'approved' : 'rejected';
      Store.set('swapRequests', swaps);
      UI.toast(approved ? 'Đã duyệt đề xuất đổi ca' : 'Đã từ chối đề xuất đổi ca', approved ? 'success' : 'info');
      render();
    }

    function render() {
      UI.skeleton(listEl, 2, 'card');
      setTimeout(() => {
        try {
          const dept = deptFilter.value;
          let reqs = allRequests();
          if (dept) reqs = reqs.filter(r => { const sv = serviceTypeById(r.serviceTypeId); return sv && sv.department === dept; });

          if (currentTab === 'swaps') {
            const swaps = Store.get('swapRequests').filter(s => s.status === 'pending');
            if (!swaps.length) {
              UI.empty(listEl, { icon: '🔄', title: 'Không có đề xuất đổi ca nào', message: 'Khi nhân viên gửi đề xuất đổi ca, nó sẽ xuất hiện ở đây để bạn duyệt.' });
              return;
            }
            listEl.innerHTML = swaps.map(sw => {
              const st = staffById(sw.staffId);
              const sh = Store.get('shifts').find(x => x.id === sw.shiftId);
              return `
                <div class="card req-card">
                  <div class="req-top">
                    <span class="req-icon">🔄</span>
                    <b>${UI.esc(st ? st.name : '?')} đề xuất đổi ca</b>
                    <span class="badge badge-warn">Chờ duyệt</span>
                  </div>
                  <p class="req-desc">Lý do: ${UI.esc(sw.reason)}</p>
                  <div class="req-meta">
                    <span>Ca ${sh ? sh.start + '–' + sh.end : '?'}</span><span>·</span>
                    <span>Gửi ${UI.timeAgo(sw.createdAt)}</span>
                  </div>
                  <div class="req-actions">
                    <button class="btn btn-sm btn-primary" data-approve="${sw.id}">✔️ Duyệt</button>
                    <button class="btn btn-sm btn-danger" data-deny="${sw.id}">✖ Từ chối</button>
                  </div>
                </div>`;
            }).join('');
            listEl.querySelectorAll('[data-approve]').forEach(b => b.addEventListener('click', () => approveSwap(Store.get('swapRequests').find(x => x.id === b.dataset.approve), true)));
            listEl.querySelectorAll('[data-deny]').forEach(b => b.addEventListener('click', () => approveSwap(Store.get('swapRequests').find(x => x.id === b.dataset.deny), false)));
            return;
          }

          let list;
          let actionsFor;
          if (currentTab === 'pending') {
            list = reqs.filter(r => r.status === 'pending').sort((a, b) => a.slaDueAt - b.slaDueAt);
            actionsFor = r => `
              <div class="req-actions">
                <button class="btn btn-sm btn-accent" data-priority="${r.id}">⚡ AI gợi ý ưu tiên</button>
                <button class="btn btn-sm btn-primary" data-assign="${r.id}">👉 Điều phối</button>
              </div>`;
          } else if (currentTab === 'active') {
            list = reqs.filter(r => ['confirmed', 'in-progress'].includes(r.status)).sort((a, b) => a.slaDueAt - b.slaDueAt);
            actionsFor = r => `<p class="req-meta" style="margin:0">👷 Đang xử lý bởi: <b>${UI.esc(staffName(r))}</b></p>`;
          } else {
            list = reqs.filter(r => r.status === 'completed').sort((a, b) => b.completedAt - a.completedAt).slice(0, 10);
            actionsFor = r => {
              const onTime = r.completedAt <= r.slaDueAt;
              return `<p class="req-meta" style="margin:0">${onTime ? '✅ Đúng SLA' : '⚠️ Trễ SLA'} · Hoàn thành ${UI.timeAgo(r.completedAt)} bởi <b>${UI.esc(staffName(r))}</b></p>`;
            };
          }

          if (!list.length) {
            const titles = { pending: 'Không có yêu cầu chờ điều phối', active: 'Không có yêu cầu đang xử lý', done: 'Chưa có yêu cầu hoàn thành' };
            UI.empty(listEl, { icon: currentTab === 'pending' ? '📭' : '✅', title: titles[currentTab] });
            return;
          }
          listEl.innerHTML = list.map(r => reqCard(r, { actions: actionsFor(r) })).join('');

          listEl.querySelectorAll('[data-priority]').forEach(b => {
            b.addEventListener('click', () => runPriority(allRequests().find(x => x.id === b.dataset.priority)));
          });
          listEl.querySelectorAll('[data-assign]').forEach(b => {
            b.addEventListener('click', () => assign(allRequests().find(x => x.id === b.dataset.assign)));
          });
        } catch (err) {
          UI.error(listEl, { onRetry: render });
        }
      }, 350);
    }

    document.querySelectorAll('#tabs .tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#tabs .tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentTab = btn.dataset.tab;
        render();
      });
    });
    deptFilter.addEventListener('change', render);
    render();
  }

  // ---------- Theo dõi SLA ----------
  function initSla() {
    const summaryEl = document.getElementById('summary');
    const tableEl = document.getElementById('slaTable');
    const deptFilter = document.getElementById('deptFilter');
    const statusFilter = document.getElementById('statusFilter');

    function render() {
      UI.skeleton(tableEl, 4, 'row');
      setTimeout(() => {
        try {
          const dept = deptFilter.value;
          const st = statusFilter.value;
          let reqs = allRequests().filter(r => ['confirmed', 'in-progress'].includes(r.status));
          if (dept) reqs = reqs.filter(r => { const sv = serviceTypeById(r.serviceTypeId); return sv && sv.department === dept; });
          if (st) reqs = reqs.filter(r => r.status === st);
          reqs.sort((a, b) => a.slaDueAt - b.slaDueAt);

          const active = allRequests().filter(r => ['confirmed', 'in-progress'].includes(r.status));
          const breach = active.filter(r => Date.now() > r.slaDueAt).length;
          const warn = active.filter(r => { const i = UI.slaInfo(r); return i.cls === 'sla-warn'; }).length;

          summaryEl.innerHTML = `
            <div class="card stat-card"><div class="stat-value">${active.length}</div><div class="stat-label">Đang xử lý</div></div>
            <div class="card stat-card"><div class="stat-value" style="color:var(--warn)">${warn}</div><div class="stat-label">Sắp trễ SLA</div></div>
            <div class="card stat-card"><div class="stat-value" style="color:var(--danger)">${breach}</div><div class="stat-label">Đã trễ SLA</div></div>`;

          if (!reqs.length) {
            UI.empty(tableEl, { icon: '⏱️', title: 'Không có yêu cầu đang xử lý', message: 'Mọi yêu cầu đều đã được hoàn thành hoặc hủy. Tuyệt vời!' });
            return;
          }

          tableEl.innerHTML = `
            <div class="table-wrap">
              <table>
                <thead><tr><th>Yêu cầu</th><th>Dịch vụ</th><th>Phòng</th><th>Ưu tiên</th><th>Trạng thái</th><th>Tiến độ SLA</th></tr></thead>
                <tbody>
                  ${reqs.map(r => {
                    const sv = serviceTypeById(r.serviceTypeId);
                    const stay = stayById(r.stayId);
                    const sla = UI.slaInfo(r);
                    return `
                      <tr class="${sla.cls === 'sla-danger' ? 'row-danger' : ''}">
                        <td><b>${UI.esc(r.title)}</b><br><small class="card-sub">NV: ${UI.esc(r.assignedTo ? (staffById(r.assignedTo) || {}).name : '—')}</small></td>
                        <td>${sv ? sv.icon + ' ' + UI.esc(sv.name) : ''}</td>
                        <td>${stay ? stay.room : '?'}</td>
                        <td>${UI.priorityBadge(r.priority)}</td>
                        <td>${UI.statusBadge(r.status)}</td>
                        <td style="min-width:180px"><div class="sla-row ${sla.cls}"><div class="sla-bar"><div class="sla-fill" style="width:${sla.pct}%"></div></div><span class="sla-label">${sla.label}</span></div></td>
                      </tr>`;
                  }).join('')}
                </tbody>
              </table>
            </div>`;
        } catch (err) {
          UI.error(tableEl, { onRetry: render });
        }
      }, 350);
    }

    deptFilter.addEventListener('change', render);
    statusFilter.addEventListener('change', render);
    render();
  }

  // ---------- Báo cáo dịch vụ ----------
  function initReport() {
    const statsEl = document.getElementById('stats');
    const chartEl = document.getElementById('chart');
    const fbEl = document.getElementById('fbList');
    const aiPanel = document.getElementById('aiPanel');

    function render() {
      try {
        const reqs = allRequests();
        const fbs = Store.get('feedback');
        const done = reqs.filter(r => r.status === 'completed');
        const onTime = done.filter(r => r.completedAt <= r.slaDueAt);
        const avg = fbs.length ? (fbs.reduce((s, f) => s + f.rating, 0) / fbs.length).toFixed(1) : '—';

        statsEl.innerHTML = `
          <div class="card stat-card"><div class="stat-value">${reqs.length}</div><div class="stat-label">Tổng yêu cầu</div></div>
          <div class="card stat-card"><div class="stat-value">${done.length}</div><div class="stat-label">Hoàn thành</div></div>
          <div class="card stat-card"><div class="stat-value">${done.length ? Math.round(onTime.length / done.length * 100) : 0}%</div><div class="stat-label">Đúng SLA</div></div>
          <div class="card stat-card"><div class="stat-value">${avg}/5</div><div class="stat-label">Điểm phản hồi TB</div></div>`;

        const types = Store.get('serviceTypes');
        const counts = types.map(t => ({ t, n: reqs.filter(r => r.serviceTypeId === t.id).length }));
        const max = Math.max(1, ...counts.map(c => c.n));
        chartEl.innerHTML = `<div class="bar-chart">${counts.map(c => `
          <div class="bar-row">
            <span>${c.t.icon} ${UI.esc(c.t.name)}</span>
            <div class="bar-track"><div class="bar-fill" style="width:${Math.round(c.n / max * 100)}%"></div></div>
            <b>${c.n}</b>
          </div>`).join('')}</div>`;

        fbEl.innerHTML = fbs.length
          ? fbs.slice().sort((a, b) => b.createdAt - a.createdAt).map(f => `
              <div class="card fb-item">
                <div class="req-top"><b>${UI.esc(f.guestName)}</b><span class="stars">${'★'.repeat(f.rating)}${'☆'.repeat(5 - f.rating)}</span></div>
                <p class="req-desc">${UI.esc(f.comment)}</p>
                <p class="fb-meta">${UI.timeAgo(f.createdAt)}</p>
              </div>`).join('')
          : '<p class="card-sub">Chưa có phản hồi nào.</p>';
      } catch (err) {
        UI.error(statsEl, { onRetry: render });
      }
    }

    async function runSummarize() {
      const btn = document.getElementById('aiSummaryBtn');
      btn.disabled = true;
      aiPanel.innerHTML = '<div class="ai-processing">💬 AI đang đọc và đúc kết phản hồi<span class="dots"></span></div>';
      const fbs = Store.get('feedback');
      const result = await AI.summarize(fbs);
      btn.disabled = false;

      if (!result.ok) {
        aiPanel.innerHTML = `
          <div class="ai-result fail">
            <b>⚠️ Không thực hiện được</b>
            <p class="ai-reason">${UI.esc(result.message)}</p>
            <div class="req-actions">
              <button class="btn btn-sm btn-outline" id="sRetry">🔄 Thử lại</button>
              <button class="btn btn-sm btn-ghost" id="sSkip">Bỏ qua</button>
            </div>
          </div>`;
        aiPanel.querySelector('#sRetry').addEventListener('click', runSummarize);
        aiPanel.querySelector('#sSkip').addEventListener('click', () => aiPanel.innerHTML = '');
        return;
      }
      aiPanel.innerHTML = `
        <div class="ai-result">
          <b>💬 AI đã đúc kết ${result.total} phản hồi (điểm TB ${result.avg}/5) thành các chủ đề:</b>
          <ul class="ai-list" style="margin-top:8px">
            ${result.topics.map(tp => `<li><b>${tp.name}</b> – nhắc đến ${tp.count} lần<br><small class="card-sub">Ví dụ: "${UI.esc(tp.sample)}"</small></li>`).join('')}
          </ul>
          <p class="ai-reason">Vì sao? AI thống kê tần suất các từ khóa chủ đề trong toàn bộ phản hồi và chọn ra 3 chủ đề nổi bật nhất.</p>
          <div class="req-actions">
            <button class="btn btn-sm btn-outline" id="sAgain">🔁 Tạo lại</button>
            <button class="btn btn-sm btn-ghost" id="sSkip2">Đóng</button>
          </div>
        </div>`;
      aiPanel.querySelector('#sAgain').addEventListener('click', runSummarize);
      aiPanel.querySelector('#sSkip2').addEventListener('click', () => aiPanel.innerHTML = '');
      UI.toast('AI đã tóm tắt phản hồi');
    }

    document.getElementById('aiSummaryBtn').addEventListener('click', runSummarize);
    render();
  }

  // ---------- Quản lý loại dịch vụ ----------
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

  // ---------- Quản lý nhân sự (cấp role vị trí cho nhân viên) ----------
  function initUsers() {
    const app = document.getElementById('app');

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
          const users = Store.get('users');
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
    render();
  }

  // ---------- Sắp xếp & Quản lý ca làm việc của Nhân viên ----------
  function initShiftManagement() {
    const app = document.getElementById('app');
    let currentTab = 'schedule';
    let deptFilter = 'all';
    let timeFilter = 'all';

    const typeLabels = {
      morning: 'Ca sáng ☀️ (06:00–14:00)',
      afternoon: 'Ca chiều 🌤 (14:00–22:00)',
      night: 'Ca đêm 🌙 (22:00–06:00)',
      office: 'Ca hành chính 🏢 (08:00–16:00)'
    };

    async function openShiftDialog(existing) {
      const staffList = Store.get('staff').filter(s => s.status === 'active');
      if (!staffList.length) {
        UI.toast('Chưa có nhân viên hoạt động nào trong hệ thống.', 'error');
        return;
      }

      const daysOptions = [
        { value: '0', label: 'Hôm nay (' + UI.fmtDate(Date.now()) + ')' },
        { value: '1', label: 'Ngày mai (' + UI.fmtDate(Date.now() + 86400000) + ')' },
        { value: '2', label: '2 ngày tới (' + UI.fmtDate(Date.now() + 2 * 86400000) + ')' },
        { value: '3', label: '3 ngày tới (' + UI.fmtDate(Date.now() + 3 * 86400000) + ')' },
        { value: '4', label: '4 ngày tới (' + UI.fmtDate(Date.now() + 4 * 86400000) + ')' },
        { value: '5', label: '5 ngày tới (' + UI.fmtDate(Date.now() + 5 * 86400000) + ')' },
        { value: '6', label: '6 ngày tới (' + UI.fmtDate(Date.now() + 6 * 86400000) + ')' },
        { value: '7', label: '7 ngày tới (' + UI.fmtDate(Date.now() + 7 * 86400000) + ')' }
      ];

      const values = await UI.dialog({
        title: existing ? 'Chỉnh sửa ca làm việc' : 'Xếp ca làm việc mới cho Nhân viên',
        description: 'Phân ca làm việc rõ ràng giúp nhân viên nắm lịch và vận hành dịch vụ đúng SLA.',
        submitLabel: existing ? 'Lưu thay đổi' : 'Xác nhận xếp ca',
        fields: [
          {
            name: 'staffId', label: 'Chọn nhân viên', type: 'select', required: true,
            value: existing ? existing.staffId : staffList[0].id,
            options: staffList.map(s => ({
              value: s.id,
              label: (DEPARTMENTS[s.position] ? DEPARTMENTS[s.position].icon + ' ' : '') + s.name + ' (' + (DEPARTMENTS[s.position] ? DEPARTMENTS[s.position].name : s.position) + ')'
            }))
          },
          {
            name: 'dayOffset', label: 'Ngày làm việc', type: 'select', required: true,
            value: existing ? String(existing.dayOffset) : '0',
            options: daysOptions
          },
          {
            name: 'type', label: 'Khung ca làm việc', type: 'select', required: true,
            value: existing ? existing.type : 'morning',
            options: [
              { value: 'morning', label: 'Ca sáng (06:00 – 14:00)' },
              { value: 'afternoon', label: 'Ca chiều (14:00 – 22:00)' },
              { value: 'night', label: 'Ca đêm (22:00 – 06:00)' },
              { value: 'office', label: 'Ca hành chính (08:00 – 16:00)' }
            ]
          },
          {
            name: 'hours', label: 'Khung giờ cụ thể (nếu tùy chỉnh)', type: 'text',
            placeholder: 'Ví dụ: 06:00-14:00 hoặc để trống theo khung ca',
            value: existing ? (existing.start + '-' + existing.end) : ''
          }
        ]
      });

      if (!values) return;

      let start = '06:00', end = '14:00';
      if (values.type === 'morning')   { start = '06:00'; end = '14:00'; }
      if (values.type === 'afternoon') { start = '14:00'; end = '22:00'; }
      if (values.type === 'night')     { start = '22:00'; end = '06:00'; }
      if (values.type === 'office')    { start = '08:00'; end = '16:00'; }

      if (values.hours && values.hours.includes('-')) {
        const parts = values.hours.split('-').map(s => s.trim());
        if (parts[0] && parts[1]) {
          start = parts[0];
          end = parts[1];
        }
      }

      const shifts = Store.get('shifts');
      const staffMember = staffById(values.staffId);
      const dayOffsetNum = parseInt(values.dayOffset, 10) || 0;

      if (existing) {
        const idx = shifts.findIndex(s => s.id === existing.id);
        if (idx >= 0) {
          shifts[idx].staffId = values.staffId;
          shifts[idx].dayOffset = dayOffsetNum;
          shifts[idx].type = values.type;
          shifts[idx].start = start;
          shifts[idx].end = end;
        }
        UI.toast('Đã cập nhật ca làm việc cho ' + (staffMember ? staffMember.name : 'nhân viên'));
      } else {
        shifts.push({
          id: newId('sh'),
          staffId: values.staffId,
          dayOffset: dayOffsetNum,
          start,
          end,
          type: values.type
        });
        UI.toast('Đã xếp ca thành công cho ' + (staffMember ? staffMember.name : 'nhân viên'));
      }

      Store.set('shifts', shifts);
      addLog('Quản lý ' + user.fullName + (existing ? ' cập nhật ca làm' : ' xếp ca làm mới') + ' cho ' + (staffMember ? staffMember.name : 'nhân viên'), 'account');
      render();
    }

    async function deleteShift(shift) {
      const st = staffById(shift.staffId);
      const ok = await UI.confirm('Xóa ca làm ' + shift.start + '–' + shift.end + ' của nhân viên ' + (st ? st.name : '') + '?', { danger: true, okLabel: 'Xác nhận xóa' });
      if (!ok) return;

      const shifts = Store.get('shifts').filter(s => s.id !== shift.id);
      Store.set('shifts', shifts);
      UI.toast('Đã xóa ca làm việc');
      render();
    }

    function approveSwap(sw, approved) {
      const swaps = Store.get('swapRequests');
      const s = swaps.find(x => x.id === sw.id);
      if (s) s.status = approved ? 'approved' : 'rejected';
      Store.set('swapRequests', swaps);
      UI.toast(approved ? 'Đã duyệt đề xuất đổi ca' : 'Đã từ chối đề xuất đổi ca', approved ? 'success' : 'info');
      render();
    }

    function render() {
      UI.skeleton(app, 3, 'card');

      setTimeout(() => {
        try {
          const shifts = Store.get('shifts');
          const allStaff = Store.get('staff');
          const swaps = Store.get('swapRequests');
          const reports = Store.get('shiftReports') || [];

          const pendingSwaps = swaps.filter(s => s.status === 'pending');
          const todayShifts = shifts.filter(s => s.dayOffset === 0);

          app.innerHTML = `
            <div class="grid-4" style="margin-bottom:24px">
              <div class="card stat-card">
                <div class="stat-value">${shifts.length}</div>
                <div class="stat-label">Tổng số ca đã xếp</div>
              </div>
              <div class="card stat-card">
                <div class="stat-value" style="color:var(--mint)">${todayShifts.length}</div>
                <div class="stat-label">Ca làm việc hôm nay</div>
              </div>
              <div class="card stat-card">
                <div class="stat-value" style="color:${pendingSwaps.length ? 'var(--coral)' : 'var(--muted)'}">${pendingSwaps.length}</div>
                <div class="stat-label">Đề xuất đổi ca chờ duyệt</div>
              </div>
              <div class="card stat-card">
                <div class="stat-value" style="color:var(--info)">${reports.length}</div>
                <div class="stat-label">Báo cáo ca làm đã nhận</div>
              </div>
            </div>

            <div class="tabs">
              <button class="tab-btn ${currentTab === 'schedule' ? 'active' : ''}" data-tab="schedule">📅 Lịch phân ca (${shifts.length})</button>
              <button class="tab-btn ${currentTab === 'swaps' ? 'active' : ''}" data-tab="swaps">🔄 Đề xuất đổi ca ${pendingSwaps.length ? `<span class="badge badge-danger" style="margin-left:4px">${pendingSwaps.length}</span>` : ''}</button>
              <button class="tab-btn ${currentTab === 'reports' ? 'active' : ''}" data-tab="reports">📋 Báo cáo ca làm (${reports.length})</button>
            </div>

            <div class="filters" style="margin-bottom:18px">
              <select id="deptFilter">
                <option value="all" ${deptFilter === 'all' ? 'selected' : ''}>Tất cả bộ phận</option>
                ${Object.keys(DEPARTMENTS).map(k => `<option value="${k}" ${deptFilter === k ? 'selected' : ''}>${DEPARTMENTS[k].icon} ${DEPARTMENTS[k].name}</option>`).join('')}
              </select>
              <select id="timeFilter">
                <option value="all" ${timeFilter === 'all' ? 'selected' : ''}>Tất cả các ngày</option>
                <option value="today" ${timeFilter === 'today' ? 'selected' : ''}>Hôm nay</option>
                <option value="tomorrow" ${timeFilter === 'tomorrow' ? 'selected' : ''}>Ngày mai</option>
                <option value="upcoming" ${timeFilter === 'upcoming' ? 'selected' : ''}>Sắp tới (trong 7 ngày)</option>
              </select>
            </div>

            <div id="tabContent"></div>
          `;

          // Bắt sự kiện lọc và tabs
          document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
              currentTab = btn.dataset.tab;
              render();
            });
          });

          document.getElementById('deptFilter').addEventListener('change', e => {
            deptFilter = e.target.value;
            render();
          });

          document.getElementById('timeFilter').addEventListener('change', e => {
            timeFilter = e.target.value;
            render();
          });

          const tabContent = document.getElementById('tabContent');

          // ---------- TAB 1: LỊCH PHÂN CA ----------
          if (currentTab === 'schedule') {
            let filteredShifts = shifts.slice();

            if (deptFilter !== 'all') {
              filteredShifts = filteredShifts.filter(s => {
                const st = staffById(s.staffId);
                return st && st.position === deptFilter;
              });
            }

            if (timeFilter === 'today') {
              filteredShifts = filteredShifts.filter(s => s.dayOffset === 0);
            } else if (timeFilter === 'tomorrow') {
              filteredShifts = filteredShifts.filter(s => s.dayOffset === 1);
            } else if (timeFilter === 'upcoming') {
              filteredShifts = filteredShifts.filter(s => s.dayOffset >= 0 && s.dayOffset <= 7);
            }

            filteredShifts.sort((a, b) => a.dayOffset - b.dayOffset || a.start.localeCompare(b.start));

            if (!filteredShifts.length) {
              UI.empty(tabContent, {
                icon: '🗓️',
                title: 'Không tìm thấy ca làm việc nào',
                message: 'Hãy xếp thêm ca làm mới cho nhân viên để đảm bảo điều phối dịch vụ liên tục.',
                actionLabel: '➕ Xếp ca mới',
                onclick: () => openShiftDialog(null)
              });
              return;
            }

            tabContent.innerHTML = `
              <div class="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Nhân viên</th>
                      <th>Bộ phận</th>
                      <th>Ngày làm</th>
                      <th>Khung giờ</th>
                      <th>Loại ca</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${filteredShifts.map(s => {
                      const st = staffById(s.staffId);
                      const isToday = s.dayOffset === 0;
                      const shiftDateStr = UI.fmtDate(Date.now() + s.dayOffset * 86400000);
                      const typeLabel = typeLabels[s.type] || s.type;

                      return `
                        <tr class="${isToday ? 'row-today' : ''}">
                          <td>
                            <div style="display:flex; align-items:center; gap:8px">
                              <span class="avatar" style="width:28px; height:28px; font-size:.78rem">${st ? st.name.charAt(0) : '?'}</span>
                              <b>${UI.esc(st ? st.name : 'Chưa gán')}</b>
                            </div>
                          </td>
                          <td>${st ? UI.deptBadge(st.position) : '—'}</td>
                          <td>
                            <b>${shiftDateStr}</b>
                            ${isToday ? '<span class="badge badge-danger" style="margin-left:6px">Hôm nay</span>' : (s.dayOffset === 1 ? '<span class="badge badge-info" style="margin-left:6px">Ngày mai</span>' : '')}
                          </td>
                          <td><span class="shift-time" style="font-size:.95rem">${s.start} – ${s.end}</span></td>
                          <td><span class="badge badge-outline">${typeLabel.split(' ')[0]} ${typeLabel.split(' ')[1] || ''}</span></td>
                          <td>
                            <div style="display:flex; gap:6px">
                              <button class="btn btn-sm btn-outline" data-edit-shift="${s.id}">Sửa</button>
                              <button class="btn btn-sm btn-ghost" data-del-shift="${s.id}" style="color:var(--coral)">Xóa</button>
                            </div>
                          </td>
                        </tr>
                      `;
                    }).join('')}
                  </tbody>
                </table>
              </div>
            `;

            tabContent.querySelectorAll('[data-edit-shift]').forEach(btn => {
              btn.addEventListener('click', () => {
                const s = shifts.find(x => x.id === btn.dataset.editShift);
                if (s) openShiftDialog(s);
              });
            });

            tabContent.querySelectorAll('[data-del-shift]').forEach(btn => {
              btn.addEventListener('click', () => {
                const s = shifts.find(x => x.id === btn.dataset.delShift);
                if (s) deleteShift(s);
              });
            });
          }

          // ---------- TAB 2: ĐỀ XUẤT ĐỔI CA ----------
          else if (currentTab === 'swaps') {
            const swapStatus = {
              pending: { label: 'Chờ duyệt', cls: 'badge-warn' },
              approved: { label: 'Đã duyệt', cls: 'badge-success' },
              rejected: { label: 'Bị từ chối', cls: 'badge-danger' }
            };

            if (!swaps.length) {
              UI.empty(tabContent, {
                icon: '🔄',
                title: 'Chưa có đề xuất đổi ca nào',
                message: 'Khi nhân viên gửi đề xuất đổi ca làm việc, thông tin sẽ hiển thị ở đây để Quản lý duyệt.'
              });
              return;
            }

            tabContent.innerHTML = `
              <div class="grid-2">
                ${swaps.map(sw => {
                  const st = staffById(sw.staffId);
                  const sh = shifts.find(x => x.id === sw.shiftId);
                  const si = swapStatus[sw.status] || { label: sw.status, cls: 'badge-muted' };
                  const shiftDate = sh ? UI.fmtDate(Date.now() + sh.dayOffset * 86400000) : '—';

                  return `
                    <div class="card req-card">
                      <div class="req-top">
                        <span class="req-icon">🔄</span>
                        <b style="font-size:1rem">${UI.esc(st ? st.name : 'Nhân viên')} xin đổi ca</b>
                        <span class="badge ${si.cls}">${si.label}</span>
                      </div>
                      <p class="req-desc"><b>Lý do:</b> ${UI.esc(sw.reason)}</p>
                      <div class="req-meta">
                        <span>Ca: <b>${sh ? sh.start + '–' + sh.end : '?'}</b></span>
                        <span>·</span>
                        <span>Ngày: <b>${shiftDate}</b></span>
                        <span>·</span>
                        <span>Gửi ${UI.timeAgo(sw.createdAt)}</span>
                      </div>
                      ${sw.status === 'pending' ? `
                        <div class="req-actions" style="margin-top:12px">
                          <button class="btn btn-sm btn-primary" data-approve="${sw.id}">✅ Duyệt đổi ca</button>
                          <button class="btn btn-sm btn-ghost" data-deny="${sw.id}">❌ Từ chối</button>
                        </div>` : ''}
                    </div>
                  `;
                }).join('')}
              </div>
            `;

            tabContent.querySelectorAll('[data-approve]').forEach(b => {
              b.addEventListener('click', () => {
                const sw = swaps.find(x => x.id === b.dataset.approve);
                if (sw) approveSwap(sw, true);
              });
            });

            tabContent.querySelectorAll('[data-deny]').forEach(b => {
              b.addEventListener('click', () => {
                const sw = swaps.find(x => x.id === b.dataset.deny);
                if (sw) approveSwap(sw, false);
              });
            });
          }

          // ---------- TAB 3: BÁO CÁO CA LÀM CỦA NHÂN VIÊN ----------
          else if (currentTab === 'reports') {
            if (!reports.length) {
              UI.empty(tabContent, {
                icon: '📋',
                title: 'Chưa có báo cáo ca làm nào',
                message: 'Sau khi kết thúc ca làm, nhân viên có thể gửi báo cáo bàn giao công việc và sự cố phát sinh tại đây.'
              });
              return;
            }

            const sortedReports = reports.slice().sort((a, b) => b.createdAt - a.createdAt);

            tabContent.innerHTML = `
              <div class="grid-2">
                ${sortedReports.map(rep => {
                  const st = staffById(rep.staffId);
                  const isGood = rep.status === 'good';

                  return `
                    <div class="card req-card" style="border-left: 4px solid ${isGood ? 'var(--mint)' : 'var(--coral)'}">
                      <div class="req-top">
                        <span class="req-icon">${isGood ? '✅' : '⚠️'}</span>
                        <div>
                          <b style="font-size:1rem">${UI.esc(st ? st.name : rep.staffName || 'Nhân viên')}</b>
                          <small style="display:block; color:var(--muted)">${st ? UI.esc(DEPARTMENTS[st.position]?.name || '') : ''} · Ca ${rep.hours || ''}</small>
                        </div>
                        <span class="badge ${isGood ? 'badge-success' : 'badge-danger'}" style="margin-left:auto">
                          ${isGood ? 'Hoàn thành tốt' : 'Cần lưu ý'}
                        </span>
                      </div>

                      <div style="margin:12px 0; font-size:.92rem">
                        <div style="margin-bottom:8px">
                          <b style="color:var(--text-dark)">📝 Công việc trong ca:</b>
                          <p style="color:var(--text); margin-top:3px">${UI.esc(rep.summary)}</p>
                        </div>

                        ${rep.issues ? `
                          <div style="margin-bottom:8px; background:#fff5f5; padding:8px 12px; border-radius:8px; border:1px solid #fed7da">
                            <b style="color:var(--coral)">⚠️ Vấn đề / Sự cố phát sinh:</b>
                            <p style="color:var(--text-dark); margin-top:2px">${UI.esc(rep.issues)}</p>
                          </div>` : ''}

                        ${rep.handover ? `
                          <div style="background:var(--mint-light); padding:8px 12px; border-radius:8px; border:1px solid var(--mint-border)">
                            <b style="color:var(--mint)">🤝 Bàn giao ca tiếp theo:</b>
                            <p style="color:var(--text-dark); margin-top:2px">${UI.esc(rep.handover)}</p>
                          </div>` : ''}
                      </div>

                      <div class="req-meta">
                        <span>Gửi lúc: ${UI.fmtDateTime(rep.createdAt)} (${UI.timeAgo(rep.createdAt)})</span>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            `;
          }
        } catch (err) {
          UI.error(app, { onRetry: render });
        }
      }, 300);
    }

    const addBtn = document.getElementById('addBtn');
    if (addBtn) addBtn.addEventListener('click', () => openShiftDialog(null));
    render();
  }

  if (page === 'manager-dispatch-board') initDispatch();
  else if (page === 'manager-sla-monitor') initSla();
  else if (page === 'manager-service-report') initReport();
  else if (page === 'manager-service-type-management') initServiceTypes();
  else if (page === 'manager-user-management') initUsers();
  else if (page === 'manager-shift-management') initShiftManagement();
})();
