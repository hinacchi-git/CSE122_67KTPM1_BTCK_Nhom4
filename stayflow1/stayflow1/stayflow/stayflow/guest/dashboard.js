// StayFlow – Khách: Bảng tin
(function () {
  if (!window.GuestApp || document.body.dataset.page !== 'guest-dashboard') return;
  const { user, myStay, myRequests } = GuestApp;

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

  initDashboard();
})();
