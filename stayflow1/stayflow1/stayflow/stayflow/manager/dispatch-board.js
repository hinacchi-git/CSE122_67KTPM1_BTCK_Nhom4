// StayFlow – Quản lý: Bảng điều phối
(function () {
  if (!window.ManagerApp || document.body.dataset.page !== 'manager-dispatch-board') return;
  const { user, allRequests, allTasks, allStaff, reqCard } = ManagerApp;

  function initDispatch() {
    let currentTab = 'pending';
    const listEl = document.getElementById('tabList');
    const deptFilter = document.getElementById('deptFilter');
    const prioFilter = document.getElementById('prioFilter');
    const countEl = document.getElementById('resultCount');

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
          ${result.unsure ? '<span class="badge badge-warn">AI chưa chắc chắn</span>' : ''}
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
          const prio = prioFilter.value;
          let reqs = allRequests();
          if (dept) reqs = reqs.filter(r => { const sv = serviceTypeById(r.serviceTypeId); return sv && sv.department === dept; });
          if (prio) reqs = reqs.filter(r => r.priority === prio);

          if (currentTab === 'swaps') {
            countEl.textContent = '';
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
          let total;
          if (currentTab === 'pending') {
            const pool = reqs.filter(r => r.status === 'pending').sort((a, b) => a.slaDueAt - b.slaDueAt);
            list = pool;
            total = pool.length;
            actionsFor = r => `
              <div class="req-actions">
                <button class="btn btn-sm btn-accent" data-priority="${r.id}">⚡ AI gợi ý ưu tiên</button>
                <button class="btn btn-sm btn-primary" data-assign="${r.id}">👉 Điều phối</button>
              </div>`;
          } else if (currentTab === 'active') {
            const pool = reqs.filter(r => ['confirmed', 'in-progress'].includes(r.status)).sort((a, b) => a.slaDueAt - b.slaDueAt);
            list = pool;
            total = pool.length;
            actionsFor = r => `<p class="req-meta" style="margin:0">👷 Đang xử lý bởi: <b>${UI.esc(staffName(r))}</b></p>`;
          } else {
            const pool = reqs.filter(r => r.status === 'completed').sort((a, b) => b.completedAt - a.completedAt);
            total = pool.length;
            list = pool.slice(0, 10);
            actionsFor = r => {
              const onTime = r.completedAt <= r.slaDueAt;
              return `<p class="req-meta" style="margin:0">${onTime ? '✅ Đúng SLA' : '⚠️ Trễ SLA'} · Hoàn thành ${UI.timeAgo(r.completedAt)} bởi <b>${UI.esc(staffName(r))}</b></p>`;
            };
          }

          countEl.textContent = total ? `Đang hiển thị ${list.length}/${total} yêu cầu` : '';

          if (!list.length) {
            const titles = { pending: 'Không có yêu cầu chờ điều phối', active: 'Không có yêu cầu đang xử lý', done: 'Chưa có yêu cầu hoàn thành' };
            const filtered = dept || prio;
            UI.empty(listEl, {
              icon: currentTab === 'pending' ? '📭' : '✅',
              title: filtered ? 'Không có yêu cầu phù hợp bộ lọc' : titles[currentTab],
              message: filtered ? 'Thử đổi bộ phận hoặc mức ưu tiên.' : '',
              actionLabel: filtered ? 'Xóa bộ lọc' : '',
              onclick: filtered ? () => { deptFilter.value = ''; prioFilter.value = ''; render(); } : null
            });
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
    prioFilter.addEventListener('change', render);
    render();
  }

  initDispatch();
})();
