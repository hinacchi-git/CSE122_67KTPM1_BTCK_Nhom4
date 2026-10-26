// StayFlow – Khu Quản lý: xác thực, khung trang và truy vấn dữ liệu dùng chung
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

  window.ManagerApp = { user, allRequests, allTasks, allStaff, reqCard };
})();
