// StayFlow – Quản lý: Theo dõi SLA
(function () {
  if (!window.ManagerApp || document.body.dataset.page !== 'manager-sla-monitor') return;
  const { allRequests } = ManagerApp;

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

  initSla();
})();
