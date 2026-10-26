// StayFlow – Khu Khách lưu trú: bảng tin, tạo yêu cầu, yêu cầu của tôi
(function () {
  const page = document.body.dataset.page || '';
  if (!page.startsWith('guest-')) return;
  const user = Auth.require('any');
  if (!user) return;
  if (user.role !== 'guest') {
    location.replace(Auth.homeFor(user));
    return;
  }
  UI.init(page);

  const myStay = () => Store.get('stays').find(s => s.userId === user.id) || null;
  const myRequests = stayId => Store.get('requests').filter(r => r.stayId === stayId);

  // ---------- Bảng tin ----------
  function initDashboard() {
    const app = document.getElementById('app');
    UI.skeleton(app, 2, 'card');

    setTimeout(() => {
      try {
        const stay = myStay();
        if (!stay) {
          const isGuest = user.role === 'guest';
          UI.empty(app, {
            icon: '🏨',
            title: 'Bạn chưa có phiếu lưu trú',
            message: isGuest
              ? 'Tài khoản của bạn chưa gắn với phòng nào. Hãy liên hệ lễ tân để được hỗ trợ.'
              : 'Tài khoản của bạn là tài khoản làm việc, không có phiếu lưu trú. Hãy chuyển sang khu vực làm việc của bạn.',
            actionLabel: isGuest ? 'Đăng ký tài khoản mới' : 'Khu vực làm việc của bạn',
            actionHref: isGuest ? appUrl('register.html') : Auth.homeFor(user)
          });
          return;
        }

        const reqs = myRequests(stay.id);
        const open = reqs.filter(r => ['pending', 'confirmed', 'in-progress'].includes(r.status));
        const done = reqs.filter(r => r.status === 'completed');
        const types = Store.get('serviceTypes').filter(t => t.active);
        const recent = reqs.slice().sort((a, b) => b.createdAt - a.createdAt).slice(0, 3);
        const hours = new Date().getHours();

        let aiSuggest;
        const msToCheckout = stay.checkOut - Date.now();
        if (msToCheckout < 24 * 3600000) {
          aiSuggest = 'Bạn sắp trả phòng. Mình gợi ý đặt dịch vụ dọn phòng hoặc liên hệ lễ tân để hỗ trợ check-out nhé!';
        } else if (hours >= 11 && hours < 14) {
          aiSuggest = 'Đã đến giờ trưa! Mình gợi ý gọi bữa trưa tại phòng (SLA 30 phút).';
        } else if (hours >= 18) {
          aiSuggest = 'Buổi tối thư giãn: đặt chỗ Spa & Massage hoặc gọi bữa tối tại phòng nhé!';
        } else {
          aiSuggest = 'Chúc bạn buổi sáng tốt lành! Nếu cần thêm khăn tắm hay nước suối, tạo yêu cầu chỉ mất 30 giây.';
        }

        app.innerHTML = `
          <div class="dash-grid">
            <div>
              <div class="card" style="margin-bottom:16px">
                <div class="req-top">
                  <span class="req-icon">🛏️</span>
                  <b>Phòng ${stay.room} – ${UI.esc(stay.guestName)}</b>
                  ${stay.vip ? '<span class="badge badge-vip">VIP</span>' : ''}
                </div>
                <p class="card-sub" style="margin-top:6px">
                  Nhận phòng: ${UI.fmtDateTime(stay.checkIn)} · Trả phòng: ${UI.fmtDateTime(stay.checkOut)}
                </p>
              </div>

              <div class="card">
                <div class="card-title">Yêu cầu gần đây</div>
                ${recent.length ? recent.map(r => {
                  const sv = serviceTypeById(r.serviceTypeId);
                  return `
                    <div class="req-card" style="border-bottom:1px solid var(--border); border-radius:0; box-shadow:none; margin-bottom:10px; padding-bottom:10px">
                      <div class="req-top">
                        <span class="req-icon">${sv ? sv.icon : '⭐'}</span>
                        <b>${UI.esc(r.title)}</b>
                        ${UI.statusBadge(r.status)}
                      </div>
                      <div class="req-meta"><span>${sv ? UI.esc(sv.name) : ''}</span><span>·</span><span>${UI.timeAgo(r.createdAt)}</span></div>
                    </div>`;
                }).join('') : '<p class="card-sub">Bạn chưa tạo yêu cầu nào. Hãy thử ngay!</p>'}
                <a class="btn btn-outline btn-sm" href="${appUrl('guest/my-requests.html')}">Xem tất cả yêu cầu</a>
              </div>
            </div>

            <div>
              <div class="grid-2" style="margin-bottom:16px">
                <div class="card stat-card">
                  <div class="stat-value">${open.length}</div>
                  <div class="stat-label">Đang xử lý</div>
                </div>
                <div class="card stat-card">
                  <div class="stat-value">${done.length}</div>
                  <div class="stat-label">Đã hoàn thành</div>
                </div>
              </div>

              <div class="card ai-result" style="margin-bottom:16px">
                <b>✨ Gợi ý của trợ lý AI</b>
                <p style="margin-top:6px">${aiSuggest}</p>
                <a class="btn btn-accent btn-sm" href="${appUrl('guest/service-request.html')}">Tạo yêu cầu</a>
              </div>

              <div class="card">
                <div class="card-title">Dịch vụ nhanh</div>
                <div style="display:flex; flex-wrap:wrap; gap:8px">
                  ${types.map(t => `<a class="btn btn-outline btn-sm" href="${appUrl('guest/service-request.html?type=' + t.id)}">${t.icon} ${UI.esc(t.name)}</a>`).join('')}
                </div>
              </div>
            </div>
          </div>`;
      } catch (err) {
        UI.error(app, { onRetry: initDashboard });
      }
    }, 400);
  }

  // ---------- Tạo yêu cầu (kèm AI-1 phân loại) ----------
  function initRequest() {
    const stay = myStay();
    const formWrap = document.getElementById('formWrap');
    if (!stay) {
      UI.empty(formWrap, {
        icon: '🏨',
        title: 'Bạn chưa có phiếu lưu trú',
        message: 'Chỉ có khách đang lưu trú mới tạo được yêu cầu dịch vụ.',
        actionLabel: 'Về bảng tin', actionHref: appUrl('guest/dashboard.html')
      });
      return;
    }

    const typeSelect = document.getElementById('fType');
    const types = Store.get('serviceTypes').filter(t => t.active);
    typeSelect.innerHTML = '<option value="">— Chọn loại dịch vụ —</option>' +
      types.map(t => `<option value="${t.id}">${t.icon} ${UI.esc(t.name)} (SLA ${t.slaMinutes} phút)</option>`).join('');
    const preType = new URLSearchParams(location.search).get('type');
    if (preType && types.some(t => t.id === preType)) typeSelect.value = preType;

    const aiPanel = document.getElementById('aiPanel');
    const descInput = document.getElementById('fDesc');
    const aiBtn = document.getElementById('aiClassifyBtn');

    async function runClassify() {
      const desc = descInput.value.trim();
      aiBtn.disabled = true;
      aiPanel.innerHTML = '<div class="ai-processing">✨ Trợ lý AI đang phân loại yêu cầu<span class="dots"></span></div>';
      const result = await AI.classify(desc);
      aiBtn.disabled = false;

      if (!result.ok) {
        aiPanel.innerHTML = `
          <div class="ai-result fail">
            <b>⚠️ ${result.code === 'unsure' ? 'AI chưa chắc chắn về kết quả này' : 'Không đủ dữ liệu để phân loại'}</b>
            <p class="ai-reason">${UI.esc(result.message)}</p>
            <div class="req-actions">
              <button class="btn btn-sm btn-outline" id="aiRetry">🔄 Thử lại</button>
              <button class="btn btn-sm btn-ghost" id="aiSkip">✍️ Chọn thủ công</button>
            </div>
          </div>`;
        aiPanel.querySelector('#aiRetry').addEventListener('click', runClassify);
        aiPanel.querySelector('#aiSkip').addEventListener('click', () => { aiPanel.innerHTML = ''; descInput.focus(); });
        return;
      }

      const d = DEPARTMENTS[result.category];
      aiPanel.innerHTML = `
        <div class="ai-result">
          <b>✨ AI đề xuất: dịch vụ thuộc bộ phận ${d.icon} ${d.name}</b> <span class="badge badge-info">${result.confidence}</span>
          <p class="ai-reason">Vì sao? ${UI.esc(result.reason)}</p>
          <div class="req-actions">
            <button class="btn btn-sm btn-primary" id="aiAccept">✔️ Chấp nhận</button>
            <button class="btn btn-sm btn-ghost" id="aiSkip">✍️ Chọn thủ công</button>
            <button class="btn btn-sm btn-outline" id="aiAgain">🔁 Tạo lại</button>
          </div>
        </div>`;
      aiPanel.querySelector('#aiAccept').addEventListener('click', () => {
        const sv = types.find(t => t.department === result.category && t.active);
        if (sv) typeSelect.value = sv.id;
        aiPanel.innerHTML = '<div class="success-banner">✔️ Đã áp dụng đề xuất của AI vào biểu mẫu.</div>';
        UI.toast('Đã áp dụng phân loại của AI');
      });
      aiPanel.querySelector('#aiSkip').addEventListener('click', () => { aiPanel.innerHTML = ''; typeSelect.focus(); });
      aiPanel.querySelector('#aiAgain').addEventListener('click', runClassify);
    }

    aiBtn.addEventListener('click', runClassify);

    document.getElementById('reqForm').addEventListener('submit', e => {
      e.preventDefault();
      const title = document.getElementById('fTitle').value.trim();
      const desc = descInput.value.trim();
      const type = typeSelect.value;
      let valid = true;

      const setErr = (id, msg) => { document.getElementById(id).textContent = msg; if (msg) valid = false; };
      setErr('eType', type ? '' : 'Vui lòng chọn loại dịch vụ');
      setErr('eTitle', title.length >= 5 ? '' : 'Tiêu đề cần tối thiểu 5 ký tự');
      setErr('eDesc', desc.length >= 10 ? '' : 'Mô tả cần tối thiểu 10 ký tự để bộ phận hiểu rõ yêu cầu');
      if (!valid) { UI.toast('Biểu mẫu chưa hợp lệ, hãy kiểm tra lại', 'error'); return; }

      const sv = serviceTypeById(type);
      const now = Date.now();
      const req = {
        id: newId('r'),
        stayId: stay.id,
        serviceTypeId: type,
        title, description: desc,
        status: 'pending', priority: 'medium',
        createdAt: now,
        slaDueAt: now + sv.slaMinutes * 60000,
        assignedTo: null, completedAt: null,
        aiClassified: aiPanel.querySelector('.success-banner') !== null,
        aiPriorityUsed: false,
        timeline: [{ at: now, by: 'Khách', note: 'Tạo yêu cầu' }]
      };
      const reqs = Store.get('requests');
      reqs.push(req);
      Store.set('requests', reqs);

      formWrap.innerHTML = `
        <div class="success-banner">✔️ Đã gửi yêu cầu "${UI.esc(title)}" đến bộ phận ${DEPARTMENTS[sv.department].name}. Thời gian cam kết: ${sv.slaMinutes} phút.</div>
        <div class="card">
          <p class="card-sub">Bạn có thể theo dõi tiến độ xử lý tại trang "Yêu cầu của tôi". Trợ lý AI cũng có thể trả lời khi nào yêu cầu hoàn thành.</p>
          <div class="req-actions">
            <a class="btn btn-primary" href="${appUrl('guest/my-requests.html')}">Xem yêu cầu của tôi</a>
            <a class="btn btn-outline" href="${appUrl('guest/service-request.html')}">Tạo yêu cầu khác</a>
          </div>
        </div>`;
      UI.toast('Đã gửi yêu cầu thành công!');
    });
  }

  // ---------- Yêu cầu của tôi ----------
  function initMyRequests() {
    const listEl = document.getElementById('list');
    const stay = myStay();

    function render() {
      UI.skeleton(listEl, 3, 'card');
      setTimeout(() => {
        try {
          if (!stay) {
            UI.empty(listEl, {
              icon: '🏨', title: 'Bạn chưa có phiếu lưu trú',
              message: 'Không thể xem yêu cầu khi chưa lưu trú.',
              actionLabel: 'Về bảng tin', actionHref: appUrl('guest/dashboard.html')
            });
            return;
          }
          const q = document.getElementById('qSearch').value.trim().toLowerCase();
          const st = document.getElementById('qStatus').value;
          let reqs = myRequests(stay.id).sort((a, b) => b.createdAt - a.createdAt);
          if (!reqs.length) {
            UI.empty(listEl, {
              icon: '📝', title: 'Bạn chưa có yêu cầu nào',
              message: 'Hãy tạo yêu cầu dịch vụ đầu tiên của mình nhé!',
              actionLabel: '➕ Tạo yêu cầu', actionHref: appUrl('guest/service-request.html')
            });
            return;
          }
          if (q) reqs = reqs.filter(r => (r.title + ' ' + r.description).toLowerCase().includes(q));
          if (st) reqs = reqs.filter(r => r.status === st);
          if (!reqs.length) {
            UI.empty(listEl, {
              icon: '🔍', title: 'Không tìm thấy yêu cầu phù hợp',
              message: 'Thử đổi từ khóa hoặc bộ lọc trạng thái.'
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

    document.getElementById('qSearch').addEventListener('input', render);
    document.getElementById('qStatus').addEventListener('change', render);
    render();
  }

  if (page === 'guest-dashboard') initDashboard();
  else if (page === 'guest-service-request') initRequest();
  else if (page === 'guest-my-requests') initMyRequests();
})();
