// StayFlow – Khách: Yêu cầu của tôi
(function () {
  if (!window.GuestApp || document.body.dataset.page !== 'guest-my-requests') return;
  const { myStay, myRequests } = GuestApp;

  function initMyRequests() {
    const listEl = document.getElementById('list');
    const countEl = document.getElementById('resultCount');
    const qSearch = document.getElementById('qSearch');
    const qStatus = document.getElementById('qStatus');
    const qPriority = document.getElementById('qPriority');
    const qSort = document.getElementById('qSort');
    const stay = myStay();

    function render() {
      UI.skeleton(listEl, 3, 'card');
      setTimeout(() => {
        try {
          if (!stay) {
            countEl.textContent = '';
            UI.empty(listEl, {
              icon: '🏨', title: 'Bạn chưa có phiếu lưu trú',
              message: 'Không thể xem yêu cầu khi chưa lưu trú.',
              actionLabel: 'Về bảng tin', actionHref: appUrl('guest/dashboard.html')
            });
            return;
          }
          const q = qSearch.value.trim().toLowerCase();
          const st = qStatus.value;
          const qp = qPriority.value;
          const sortBy = qSort.value;
          const all = myRequests(stay.id);
          if (!all.length) {
            countEl.textContent = '';
            UI.empty(listEl, {
              icon: '📝', title: 'Bạn chưa có yêu cầu nào',
              message: 'Hãy tạo yêu cầu dịch vụ đầu tiên của mình nhé!',
              actionLabel: '➕ Tạo yêu cầu', actionHref: appUrl('guest/service-request.html')
            });
            return;
          }
          let reqs = all.slice();
          if (q) reqs = reqs.filter(r => (r.title + ' ' + r.description).toLowerCase().includes(q));
          if (st) reqs = reqs.filter(r => r.status === st);
          if (qp) reqs = reqs.filter(r => r.priority === qp);
          reqs.sort((a, b) => sortBy === 'old' ? a.createdAt - b.createdAt : b.createdAt - a.createdAt);
          countEl.textContent = `Đang hiển thị ${reqs.length}/${all.length} yêu cầu`;
          if (!reqs.length) {
            UI.empty(listEl, {
              icon: '🔍', title: 'Không tìm thấy yêu cầu phù hợp',
              message: 'Thử đổi từ khóa hoặc bộ lọc trạng thái, mức ưu tiên.',
              actionLabel: 'Xóa bộ lọc',
              onclick: () => {
                qSearch.value = '';
                qStatus.value = '';
                qPriority.value = '';
                qSort.value = 'new';
                render();
              }
            });
            return;
          }

          listEl.innerHTML = reqs.map(r => {
            const sv = serviceTypeById(r.serviceTypeId);
            const active = ['pending', 'confirmed', 'in-progress'].includes(r.status);
            const sla = active ? UI.slaInfo(r) : null;
            const canCancel = ['pending', 'confirmed'].includes(r.status);
            return `
              <div class="card req-card">
                <div class="req-top">
                  <span class="req-icon">${sv ? sv.icon : '⭐'}</span>
                  <b>${UI.esc(r.title)}</b>
                  ${UI.priorityBadge(r.priority)}
                  ${UI.statusBadge(r.status)}
                </div>
                <p class="req-desc">${UI.esc(r.description)}</p>
                <div class="req-meta">
                  <span>${sv ? UI.esc(sv.name) : ''}</span><span>·</span>
                  <span>Tạo ${UI.timeAgo(r.createdAt)}</span>
                  ${r.completedAt ? `<span>·</span><span>Hoàn thành ${UI.timeAgo(r.completedAt)}</span>` : ''}
                </div>
                ${sla ? `<div class="sla-row ${sla.cls}"><div class="sla-bar"><div class="sla-fill" style="width:${sla.pct}%"></div></div><span class="sla-label">SLA ${sla.label}</span></div>` : ''}
                <details style="margin-top:10px">
                  <summary>Xem tiến độ xử lý</summary>
                  <ul class="timeline">
                    ${r.timeline.map(t => `<li>${UI.esc(t.note)}<small>${UI.esc(t.by)} · ${UI.fmtDateTime(t.at)}</small></li>`).join('')}
                  </ul>
                </details>
                ${canCancel ? `<div class="req-actions"><button class="btn btn-sm btn-danger" data-cancel="${r.id}">✖ Hủy yêu cầu</button></div>` : ''}
              </div>`;
          }).join('');

          listEl.querySelectorAll('[data-cancel]').forEach(btn => {
            btn.addEventListener('click', async () => {
              const ok = await UI.confirm('Hủy yêu cầu này? Bộ phận xử lý sẽ không nhận yêu cầu nữa.', { title: 'Xác nhận hủy', okLabel: 'Hủy yêu cầu' });
              if (!ok) return;
              const reqs = Store.get('requests');
              const r = reqs.find(x => x.id === btn.dataset.cancel);
              if (r) {
                r.status = 'cancelled';
                r.timeline.push({ at: Date.now(), by: 'Khách', note: 'Khách hủy yêu cầu' });
                Store.set('requests', reqs);
                UI.toast('Đã hủy yêu cầu');
                render();
              }
            });
          });
        } catch (err) {
          UI.error(listEl, { onRetry: render });
        }
      }, 350);
    }

    qSearch.addEventListener('input', render);
    qStatus.addEventListener('change', render);
    qPriority.addEventListener('change', render);
    qSort.addEventListener('change', render);
    render();
  }

  initMyRequests();
})();
