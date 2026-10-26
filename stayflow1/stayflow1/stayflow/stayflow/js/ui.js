// StayFlow – Giao diện dùng chung: thanh điều hướng theo vai trò, toast,
// hộp thoại, trạng thái (đang tải / rỗng / lỗi) và trợ lý AI theo vai trò.

const NAV_LINKS = role => {
  const map = {
    guest: [
      { href: appUrl('guest/dashboard.html'),        label: 'Bảng tin',          page: 'guest-dashboard' },
      { href: appUrl('guest/service-request.html'),  label: 'Tạo yêu cầu',       page: 'guest-service-request' },
      { href: appUrl('guest/my-requests.html'),      label: 'Yêu cầu của tôi',   page: 'guest-my-requests' }
    ],
    staff: [
      { href: appUrl('staff/task-board.html'),  label: 'Bảng nhiệm vụ', page: 'staff-task-board' },
      { href: appUrl('staff/shift-view.html'),  label: 'Ca làm việc',    page: 'staff-shift-view' }
    ],
    manager: [
      { href: appUrl('manager/dispatch-board.html'),        label: 'Điều phối',    page: 'manager-dispatch-board' },
      { href: appUrl('manager/shift-management.html'),      label: 'Xếp ca làm',   page: 'manager-shift-management' },
      { href: appUrl('manager/sla-monitor.html'),           label: 'Theo dõi SLA', page: 'manager-sla-monitor' },
      { href: appUrl('manager/service-report.html'),        label: 'Báo cáo',      page: 'manager-service-report' },
      { href: appUrl('manager/service-type-management.html'), label: 'Loại dịch vụ', page: 'manager-service-type-management' },
      { href: appUrl('manager/user-management.html'),       label: 'Nhân sự',      page: 'manager-user-management' }
    ],
    admin: [
      { href: appUrl('admin/dashboard.html'),       label: 'Bảng điều khiển', page: 'admin-dashboard' },
      { href: appUrl('admin/user-management.html'), label: 'Tài khoản',       page: 'admin-user-management' },
      { href: appUrl('admin/system-updates.html'),  label: 'Cập nhật hệ thống', page: 'admin-system-updates' }
    ]
  };
  return map[role] || map.guest;
};

const UI = {
  init(activePage) {
    const user = Auth.current();
    this.renderTopbar(user, activePage);
    this.renderMaintenanceBanner();
    this.renderFooter();
    if (user) this.mountAssistant(user);
  },

  renderTopbar(user, active) {
    const header = document.createElement('header');
    header.className = 'topbar';
    let links;
    if (user) {
      const cfg = typeof NAV_LINKS === 'function' ? NAV_LINKS(user.role) : (NAV_LINKS[user.role] || NAV_LINKS.guest);
      links = cfg.map(l => l.divider
        ? '<span class="nav-divider"></span>'
        : `<a href="${l.href}" class="${l.page === active ? 'active' : ''}">${l.label}</a>`
      ).join('');
    } else {
      links = `<a href="${appUrl('index.html')}" class="${active === 'index' ? 'active' : ''}">Trang chủ</a>
               <a href="${appUrl('login.html')}" class="${active === 'login' ? 'active' : ''}">Đăng nhập</a>
               <a href="${appUrl('register.html')}" class="${active === 'register' ? 'active' : ''}">Đăng ký</a>`;
    }
    header.innerHTML = `
      <div class="topbar-inner">
        <a class="brand" href="${user ? Auth.homeFor(user) : appUrl('index.html')}">Stay<span>Flow</span></a>
        <nav class="nav" id="mainNav">${links}</nav>
        <div class="topbar-right">
          ${user ? `
            <span class="user-chip">
              <span class="avatar">${this.esc(user.fullName.charAt(0))}</span>
              <span class="user-meta">
                <b>${this.esc(user.fullName)}</b>
                <small>${Auth.roleLabel(user)}</small>
              </span>
            </span>
            <button class="btn btn-ghost btn-sm" id="logoutBtn">Đăng xuất</button>`
          : `<a class="btn btn-accent btn-sm" href="${appUrl('login.html')}">Đăng nhập</a>`}
          <button class="nav-toggle" id="navToggle" aria-label="Mở menu">☰</button>
        </div>
      </div>`;
    document.body.prepend(header);
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', () => Auth.logout());
    document.getElementById('navToggle').addEventListener('click', () => {
      document.getElementById('mainNav').classList.toggle('open');
    });
  },

  renderMaintenanceBanner() {
    const flags = Store.get('flags');
    if (!flags.maintenance) return;
    const banner = document.createElement('div');
    banner.className = 'maintenance-banner';
    banner.textContent = '⚠️ Hệ thống đang trong chế độ bảo trì. Một số tính năng có thể hoạt động chậm.';
    document.body.prepend(banner);
  },

  renderFooter() {
    if (document.querySelector('.site-footer')) return;
    const footer = document.createElement('footer');
    footer.className = 'site-footer';
    footer.innerHTML = `
      <div class="footer-inner">
        <p><b>StayFlow</b> – BTL-08 · Điều phối dịch vụ trong thời gian lưu trú</p>
        <p>Môn học CSE122 – Phát triển ứng dụng web cơ bản · Nhóm 3</p>
        <nav aria-label="Liên kết chân trang">
          <a href="${appUrl('index.html')}">Trang chủ</a>
          <a href="${appUrl('login.html')}">Đăng nhập</a>
          <a href="${appUrl('register.html')}">Đăng ký</a>
        </nav>
      </div>`;
    document.body.append(footer);
  },

  // ---------- tiện ích chung ----------
  esc(str) {
    return String(str ?? '').replace(/[&<>"']/g, c => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
  },

  toast(message, type) {
    let box = document.getElementById('toasts');
    if (!box) {
      box = document.createElement('div');
      box.id = 'toasts';
      document.body.append(box);
    }
    const t = document.createElement('div');
    t.className = 'toast toast-' + (type || 'success');
    t.textContent = message;
    box.append(t);
    setTimeout(() => t.remove(), 3200);
  },

  fmtDateTime(ts) {
    return new Date(ts).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  },

  fmtDate(ts) {
    const d = new Date(ts);
    const days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    return `${days[d.getDay()]}, ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  },

  timeAgo(ts) {
    const m = Math.round((Date.now() - ts) / 60000);
    if (m < 1) return 'vừa xong';
    if (m < 60) return m + ' phút trước';
    const h = Math.floor(m / 60);
    if (h < 24) return h + ' giờ trước';
    return Math.floor(h / 24) + ' ngày trước';
  },

  slaInfo(req) {
    const total = (req.slaDueAt - req.createdAt) / 60000;
    const elapsed = (Date.now() - req.createdAt) / 60000;
    if (total <= 0) return { pct: 0, label: 'Không có SLA', cls: 'sla-ok' };
    const pct = Math.min(100, Math.round(elapsed / total * 100));
    const left = Math.round(total - elapsed);
    let cls = 'sla-ok';
    if (left <= 0) cls = 'sla-danger';
    else if (pct >= 75) cls = 'sla-warn';
    const label = left > 0 ? `Còn ${left} phút` : `Trễ ${-left} phút`;
    return { pct, label, cls };
  },

  statusBadge(s)   { const i = STATUS[s] || { label: s, cls: 'badge-muted' };   return `<span class="badge ${i.cls}">${i.label}</span>`; },
  priorityBadge(p) { const i = PRIORITY[p] || { label: p, cls: 'badge-muted' }; return `<span class="badge ${i.cls}">${i.label}</span>`; },
  deptBadge(d)     { const i = DEPARTMENTS[d] || { name: d, icon: '⭐' };       return `<span class="badge badge-outline">${i.icon} ${i.name}</span>`; },

  // ---------- trạng thái giao diện ----------
  skeleton(el, n, type) {
    el.innerHTML = Array(n || 3).fill(`<div class="skeleton skel-${type || 'card'}"></div>`).join('');
  },

  empty(el, opts) {
    const o = opts || {};
    el.innerHTML = `
      <div class="state-box">
        <div class="state-icon">${o.icon || '📭'}</div>
        <h3>${this.esc(o.title || 'Chưa có dữ liệu')}</h3>
        ${o.message ? `<p>${this.esc(o.message)}</p>` : ''}
        ${o.actionLabel
          ? (o.onclick
              ? `<button type="button" class="btn btn-primary" id="stateAction">${this.esc(o.actionLabel)}</button>`
              : `<a class="btn btn-primary" href="${o.actionHref || '#'}">${this.esc(o.actionLabel)}</a>`)
          : ''}
      </div>`;
    if (o.onclick) el.querySelector('#stateAction').addEventListener('click', o.onclick);
  },

  error(el, opts) {
    const o = opts || {};
    el.innerHTML = `
      <div class="state-box state-error">
        <div class="state-icon">⚠️</div>
        <h3>Đã có lỗi xảy ra</h3>
        <p>${this.esc(o.message || 'Không tải được dữ liệu.')}</p>
        ${o.onRetry ? `<button class="btn btn-primary" id="retryBtn">Thử lại</button>` : ''}
      </div>`;
    if (o.onRetry) el.querySelector('#retryBtn').addEventListener('click', o.onRetry);
  },

  // ---------- hộp thoại ----------
  _closeDialog(overlay, resolve, value) {
    overlay.remove();
    resolve(value);
  },

  dialog(opts) {
    const o = opts || {};
    return new Promise(resolve => {
      const previousFocus = document.activeElement;
      const overlay = document.createElement('div');
      overlay.className = 'dialog-overlay';
      const fieldsHtml = (o.fields || []).map(f => {
        const requiredMark = f.required ? ' <span class="req">*</span>' : '';
        let input = '';
        if (f.type === 'textarea') {
          input = `<textarea name="${f.name}" rows="3" placeholder="${this.esc(f.placeholder || '')}">${this.esc(f.value || '')}</textarea>`;
        } else if (f.type === 'select') {
          input = `<select name="${f.name}">${(f.options || []).map(op =>
            `<option value="${this.esc(op.value)}" ${op.value === f.value ? 'selected' : ''}>${this.esc(op.label)}</option>`).join('')}</select>`;
        } else if (f.type === 'radio') {
          input = `<div class="radio-list">${(f.options || []).map((op, i) =>
            `<label class="radio-item"><input type="radio" name="${f.name}" value="${this.esc(op.value)}" ${i === 0 ? 'checked' : ''}> <span>${this.esc(op.label)}</span></label>`).join('')}</div>`;
        } else {
          input = `<input type="${f.type || 'text'}" name="${f.name}" value="${this.esc(f.value || '')}" placeholder="${this.esc(f.placeholder || '')}">`;
        }
        return `<label class="field"><span class="field-label">${this.esc(f.label)}${requiredMark}</span>${input}<small class="field-err"></small></label>`;
      }).join('');

      overlay.innerHTML = `
        <div class="dialog" role="dialog" aria-modal="true">
          <h3>${this.esc(o.title || '')}</h3>
          ${o.description ? `<p class="dialog-desc">${this.esc(o.description)}</p>` : ''}
          <form id="dlgForm">${fieldsHtml}
            <div class="dialog-actions">
              <button type="button" class="btn btn-ghost" id="dlgCancel">Hủy</button>
              <button type="submit" class="btn ${o.danger ? 'btn-danger' : 'btn-primary'}">${this.esc(o.submitLabel || 'Xác nhận')}</button>
            </div>
          </form>
        </div>`;
      document.body.append(overlay);

      const close = value => {
        document.removeEventListener('keydown', onKey);
        this._closeDialog(overlay, resolve, value);
        if (previousFocus && typeof previousFocus.focus === 'function') previousFocus.focus();
      };
      const onKey = e => {
        if (e.key === 'Escape') { e.preventDefault(); close(null); }
        else if (e.key === 'Tab') {
          const focusables = Array.from(overlay.querySelectorAll('button, input, select, textarea, [href]'))
            .filter(el => !el.disabled && el.offsetParent !== null);
          if (!focusables.length) return;
          const first = focusables[0];
          const last = focusables[focusables.length - 1];
          if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
          else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
      };
      document.addEventListener('keydown', onKey);

      overlay.addEventListener('click', e => { if (e.target === overlay) close(null); });
      overlay.querySelector('#dlgCancel').addEventListener('click', () => close(null));
      const firstField = overlay.querySelector('input, select, textarea');
      if (firstField) firstField.focus();

      overlay.querySelector('#dlgForm').addEventListener('submit', e => {
        e.preventDefault();
        const values = {};
        let valid = true;
        (o.fields || []).forEach(f => {
          let input = overlay.querySelector(`[name="${f.name}"]`);
          let val;
          if (f.type === 'radio') {
            const checked = overlay.querySelector(`input[name="${f.name}"]:checked`);
            val = checked ? checked.value : '';
          } else if (f.type === 'number') {
            val = input.value.trim() === '' ? '' : Number(input.value);
          } else {
            val = input.value.trim();
          }
          const errEl = input.closest('.field').querySelector('.field-err');
          let msg = '';
          if (f.required && (val === '' || val === null)) msg = 'Bắt buộc nhập';
          if (!msg && f.validate) msg = f.validate(val, values) || '';
          if (msg) { valid = false; errEl.textContent = msg; }
          else errEl.textContent = '';
          values[f.name] = val;
        });
        if (valid) close(values);
      });
    });
  },

  confirm(message, opts) {
    const o = opts || {};
    return new Promise(resolve => {
      const previousFocus = document.activeElement;
      const overlay = document.createElement('div');
      overlay.className = 'dialog-overlay';
      overlay.innerHTML = `
        <div class="dialog" role="alertdialog" aria-modal="true">
          <h3>${this.esc(o.title || 'Xác nhận')}</h3>
          <p class="dialog-desc">${this.esc(message)}</p>
          <div class="dialog-actions">
            <button class="btn btn-ghost" id="cNo">Hủy</button>
            <button class="btn ${o.danger === false ? 'btn-primary' : 'btn-danger'}" id="cYes">${this.esc(o.okLabel || 'Đồng ý')}</button>
          </div>
        </div>`;
      document.body.append(overlay);

      const close = value => {
        document.removeEventListener('keydown', onKey);
        overlay.remove();
        resolve(value);
        if (previousFocus && typeof previousFocus.focus === 'function') previousFocus.focus();
      };
      const onKey = e => { if (e.key === 'Escape') { e.preventDefault(); close(false); } };
      document.addEventListener('keydown', onKey);

      overlay.addEventListener('click', e => { if (e.target === overlay) close(false); });
      overlay.querySelector('#cNo').addEventListener('click', () => close(false));
      overlay.querySelector('#cYes').addEventListener('click', () => close(true));
      overlay.querySelector('#cNo').focus();
    });
  },

  // ---------- Trợ lý AI theo vai trò ----------
  mountAssistant(user) {
    const fab = document.createElement('button');
    fab.id = 'ai-fab';
    fab.className = 'ai-fab';
    fab.title = 'Trợ lý AI StayFlow';
    fab.textContent = '✨';

    const panel = document.createElement('div');
    panel.id = 'ai-panel';
    panel.className = 'ai-panel';
    panel.hidden = true;
    panel.innerHTML = `
      <div class="ai-head">
        <div><b>Trợ lý AI StayFlow</b><small>Hỗ trợ theo vai trò: ${Auth.roleLabel(user)}</small></div>
        <button id="aiClose" aria-label="Đóng">×</button>
      </div>
      <div class="ai-msgs" id="aiMsgs"></div>
      <div class="ai-chips" id="aiChips"></div>
      <form class="ai-form" id="aiForm">
        <input id="aiInput" placeholder="Nhập câu hỏi của bạn..." autocomplete="off">
        <button class="btn btn-accent btn-sm" type="submit">Gửi</button>
      </form>`;
    document.body.append(fab, panel);

    const msgs = panel.querySelector('#aiMsgs');
    const chipsBox = panel.querySelector('#aiChips');

    const addMsg = (who, html) => {
      const div = document.createElement('div');
      div.className = 'ai-msg ai-' + who;
      div.innerHTML = html;
      msgs.append(div);
      msgs.scrollTop = msgs.scrollHeight;
      return div;
    };

    const setChips = (chips) => {
      chipsBox.innerHTML = '';
      (chips || []).forEach(c => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'chip';
        b.textContent = c.label;
        b.addEventListener('click', () => {
          if (c.href) location.href = c.href;
          else if (c.ask) send(c.ask);
          else if (c.reset) setChips(defaultChips());
        });
        chipsBox.append(b);
      });
    };

    const typing = () => {
      const div = addMsg('ai', '<span class="typing"><span></span><span></span><span></span></span>');
      return div;
    };

    const send = async (raw) => {
      const text = String(raw || '').trim();
      if (!text) return;
      addMsg('user', UI.esc(text));
      const typingEl = typing();
      await AI.wait(700);
      const reply = assistantReply(user, text);
      typingEl.innerHTML = reply.html;
      msgs.scrollTop = msgs.scrollHeight;
      setChips(reply.chips);
    };

    panel.querySelector('#aiForm').addEventListener('submit', e => {
      e.preventDefault();
      const input = panel.querySelector('#aiInput');
      send(input.value);
      input.value = '';
    });
    panel.querySelector('#aiClose').addEventListener('click', () => { panel.hidden = true; });
    fab.addEventListener('click', () => {
      panel.hidden = !panel.hidden;
      if (!panel.hidden && !msgs.children.length) {
        const typingEl = typing();
        AI.wait(600).then(() => {
          typingEl.innerHTML = `<p>Xin chào <b>${UI.esc(user.fullName)}</b>! Mình là trợ lý AI của StayFlow. Mình có thể hỗ trợ gì cho bạn hôm nay?</p>`;
          setChips(defaultChips());
        });
      }
    });

    function defaultChips() {
      const common = [
        { label: '💡 Xem gợi ý', reset: true },
      ];
      const byRole = {
        guest: [
          { label: '🛁 Cần thêm khăn tắm', ask: 'Cho mình xin thêm khăn tắm' },
          { label: '🍚 Đặt đồ ăn', ask: 'Mình muốn gọi đồ ăn' },
          { label: '⏱ Tiến độ yêu cầu?', ask: 'Tiến độ các yêu cầu của tôi thế nào?' },
          { label: '🎯 Gợi ý hoạt động', ask: 'Gợi ý hoạt động cho mình' }
        ],
        staff: [
          { label: '📋 Nhiệm vụ hôm nay', ask: 'Mình có nhiệm vụ gì hôm nay?' },
          { label: '🚨 Việc nào gấp nhất?', ask: 'Nhiệm vụ nào gấp nhất' },
          { label: '🗓 Ca làm việc', ask: 'Ca làm việc của mình' },
          { label: '💡 Mẹo xử lý', ask: 'Mẹo xử lý nhiệm vụ trễ SLA' }
        ],
        manager: [
          { label: '📥 Yêu cầu chờ điều phối', ask: 'Có bao nhiêu yêu cầu chờ điều phối' },
          { label: '⏰ SLA sắp trễ', ask: 'SLA nào sắp trễ' },
          { label: '💬 Tóm tắt phản hồi', ask: 'Tóm tắt phản hồi khách' },
          { label: '👤 Phân quyền nhân sự', ask: 'Phân quyền nhân sự thế nào' }
        ],
        admin: [
          { label: '👥 Danh sách tài khoản', ask: 'Cho mình xem tổng quan tài khoản' },
          { label: '🔑 Cấp vai trò', ask: 'Cách cấp vai trò cho tài khoản' },
          { label: '🛠 Cập nhật hệ thống', ask: 'Trạng thái cập nhật hệ thống' },
          { label: '🏨 Dữ liệu khách sạn', ask: 'Cho mình xem dữ liệu khách sạn' }
        ]
      };
      return (byRole[user.role] || byRole.guest).concat(common);
    }

    // Cỗ máy trả lời theo quy tắc – mỗi vai trò một bộ ý định, kèm dữ liệu thật
    function assistantReply(u, raw) {
      const t = String(raw || '').toLowerCase();
      const has = (...kws) => kws.some(k => t.includes(k));
      const fail = {
        html: `<p>😢 Mình chưa hiểu câu hỏi này — <b>không đủ dữ liệu để đưa ra đề xuất</b>.</p><p>Bạn thử diễn đạt khác hoặc chọn gợi ý bên dưới nhé.</p>`,
        chips: [
          { label: '🔄 Thử lại', ask: raw },
          { label: '💡 Xem gợi ý', reset: true }
        ]
      };

      if (u.role === 'guest') {
        const stay = Store.get('stays').find(s => s.userId === u.id);
        const reqs = stay ? Store.get('requests').filter(r => r.stayId === stay.id) : [];
        const open = reqs.filter(r => ['pending', 'confirmed', 'in-progress'].includes(r.status));

        if (has('khăn', 'towel', 'dọn', 'sạch', 'giặt', 'ủi')) {
          return { html: `<p>Bạn cần dịch vụ <b>Buồng phòng</b>. Mình gợi ý: chọn "Dọn phòng" (SLA 45 phút) và ghi rõ số lượng đồ cần thay trong mô tả nhé.</p>`, chips: [{ label: '➕ Tạo yêu cầu', href: appUrl('guest/service-request.html?type=sv1') }, { label: '💡 Xem gợi ý', reset: true }] };
        }
        if (has('ăn', 'đồ ăn', 'cơm', 'phở', 'menu', 'trà', 'cà phê', 'nước', 'bia')) {
          return { html: `<p>Món ăn & đồ uống do bộ phận <b>Dịch vụ ăn uống</b> phục vụ (SLA 30 phút). Mẹo: đặt trước 30–45 phút để giao đúng giờ.</p>`, chips: [{ label: '➕ Gọi đồ ăn', href: appUrl('guest/service-request.html?type=sv2') }, { label: '💆 Xem Spa', href: appUrl('guest/service-request.html?type=sv6') }] };
        }
        if (has('spa', 'massage', 'gym', 'hoạt động', 'gợi ý', 'giải trí', 'chơi')) {
          return { html: `<p>Gợi ý cho bạn: <b>Spa & Massage</b> (khoảng 2 giờ) rất hợp để thư giãn cuối ngày. Bạn cũng có thể yêu cầu bữa sáng tại phòng cho ngày mai.</p>`, chips: [{ label: '💆 Đặt Spa', href: appUrl('guest/service-request.html?type=sv6') }, { label: '🍚 Đặt bữa sáng', href: appUrl('guest/service-request.html?type=sv2') }] };
        }
        if (has('hỏng', 'sửa', 'điều hòa', 'đèn', 'tivi', 'khóa')) {
          return { html: `<p>Sự cố thiết bị do bộ phận <b>Bảo trì</b> xử lý (SLA 60 phút). Nếu là sự cố nguy hiểm (rò rỉ, cháy) hãy gọi trực tiếp lễ tân.</p>`, chips: [{ label: '🔧 Báo sự cố', href: appUrl('guest/service-request.html?type=sv3') }] };
        }
        if (has('tiến độ', 'trạng thái', 'yêu cầu', 'xong', 'bao giờ')) {
          if (!open.length) {
            return { html: `<p>Hiện bạn <b>không có yêu cầu nào đang xử lý</b>. ${reqs.length ? 'Các yêu cầu trước đó đều đã hoàn thành hoặc bị hủy.' : 'Bạn chưa tạo yêu cầu nào.'}</p>`, chips: [{ label: '➕ Tạo yêu cầu', href: appUrl('guest/service-request.html') }] };
          }
          const lines = open.map(r => {
            const sv = serviceTypeById(r.serviceTypeId);
            return `<li>${sv ? sv.icon : '⭐'} <b>${UI.esc(r.title)}</b> — ${STATUS[r.status].label}</li>`;
          }).join('');
          return { html: `<p>Bạn đang có <b>${open.length} yêu cầu</b> đang xử lý:</p><ul class="ai-list">${lines}</ul>`, chips: [{ label: '📋 Xem chi tiết', href: appUrl('guest/my-requests.html') }] };
        }
        if (has('trả phòng', 'check-out', 'check out', 'giờ')) {
          return { html: `<p>Giờ trả phòng là <b>trước 12:00</b>. Muốn trả phòng muộn hơn, hãy tạo yêu cầu <b>Hỗ trợ lễ tân</b> (SLA 15 phút) để được xét.</p>`, chips: [{ label: '🛎️ Liên hệ lễ tân', href: appUrl('guest/service-request.html?type=sv4') }] };
        }
        if (!stay) {
          return { html: `<p>Tài khoản của bạn chưa gắn với phiếu lưu trú nào nên mình chưa có dữ liệu phòng. Bạn có thể liên hệ lễ tân để được hỗ trợ.</p>`, chips: [{ label: '💡 Xem gợi ý', reset: true }] };
        }
        return fail;
      }

      if (u.role === 'staff') {
        const me = Auth.staffProfile(u);
        if (!me) {
          return { html: `<p>Tài khoản của bạn chưa được gắn hồ sơ nhân viên. Hãy liên hệ Quản lý để hoàn tất.</p>`, chips: [{ label: '💡 Xem gợi ý', reset: true }] };
        }
        const tasks = Store.get('tasks').filter(x => x.staffId === me.id && ['assigned', 'in-progress'].includes(x.status));
        const withReq = tasks.map(tk => ({ tk, req: Store.get('requests').find(r => r.id === tk.requestId) }))
          .filter(x => x.req)
          .sort((a, b) => a.req.slaDueAt - b.req.slaDueAt);

        if (has('nhiệm vụ', 'task', 'việc', 'hôm nay')) {
          if (!withReq.length) return { html: `<p>Hiện <b>không có nhiệm vụ nào</b> đang mở. Khi Quản lý điều phối, nhiệm vụ mới sẽ xuất hiện trên bảng của bạn.</p>`, chips: [{ label: '📋 Mở bảng nhiệm vụ', href: appUrl('staff/task-board.html') }] };
          const lines = withReq.slice(0, 5).map(x => `<li>${serviceTypeById(x.req.serviceTypeId)?.icon || '⭐'} <b>${UI.esc(x.req.title)}</b> — ${STATUS[x.tk.status].label}</li>`).join('');
          return { html: `<p>Bạn đang có <b>${withReq.length} nhiệm vụ</b>:</p><ul class="ai-list">${lines}</ul>`, chips: [{ label: '📋 Mở bảng nhiệm vụ', href: appUrl('staff/task-board.html') }] };
        }
        if (has('gấp', 'ưu tiên', 'sla', 'trễ', 'mẹo')) {
          if (!withReq.length) return { html: `<p>Không có nhiệm vụ nào sắp trễ SLA — tốt lắm! 🎉</p>`, chips: [{ label: '💡 Xem gợi ý', reset: true }] };
          const top = withReq[0];
          const info = UI.slaInfo(top.req);
          return {
            html: `<p>Nhiệm vụ cần ưu tiên nhất: <b>${UI.esc(top.req.title)}</b> (${info.label} SLA). Mẹo: cập nhật trạng thái đúng lúc trên <b>Chi tiết nhiệm vụ</b> và ghi chú cụ thể để Quản lý theo dõi SLA chính xác.</p>`,
            chips: [{ label: '🚨 Mở nhiệm vụ', href: appUrl(`staff/task-detail.html?id=${top.tk.id}`) }]
          };
        }
        if (has('ca', 'shift', 'đổi ca')) {
          const shifts = Store.get('shifts').filter(s => s.staffId === me.id).sort((a, b) => a.dayOffset - b.dayOffset);
          if (!shifts.length) return { html: `<p>Chưa có lịch ca nào được xếp cho bạn.</p>`, chips: [{ label: '🗓 Xem ca làm việc', href: appUrl('staff/shift-view.html') }] };
          const s = shifts[0];
          return { html: `<p>Ca gần nhất của bạn: <b>${UI.fmtDate(Date.now() + s.dayOffset * 86400000)}</b>, giờ <b>${s.start}–${s.end}</b>. Cần đổi ca thì gửi đề xuất ngay trên trang Ca làm việc để Quản lý duyệt.</p>`, chips: [{ label: '🗓 Xem ca làm việc', href: appUrl('staff/shift-view.html') }] };
        }
        return fail;
      }

      if (u.role === 'manager') {
        const reqs = Store.get('requests');
        if (has('chờ', 'điều phối', 'pending', 'mới')) {
          const pending = reqs.filter(r => r.status === 'pending');
          if (!pending.length) return { html: `<p>Không có yêu cầu nào đang chờ điều phối. Tuyệt! ✅</p>`, chips: [{ label: '📥 Mở bảng điều phối', href: appUrl('manager/dispatch-board.html') }] };
          const urgent = pending.filter(r => r.priority === 'urgent' || r.priority === 'high').length;
          return { html: `<p>Đang có <b>${pending.length} yêu cầu</b> chờ điều phối, trong đó <b>${urgent} yêu cầu</b> mức Cao/Khẩn cấp. Nên xử lý các yêu cầu sắp trễ SLA trước.</p>`, chips: [{ label: '📥 Mở bảng điều phối', href: appUrl('manager/dispatch-board.html') }] };
        }
        if (has('sla', 'trễ', 'muộn')) {
          const active = reqs.filter(r => ['confirmed', 'in-progress'].includes(r.status));
          const breach = active.filter(r => Date.now() > r.slaDueAt).length;
          const warn = active.filter(r => { const i = UI.slaInfo(r); return i.cls === 'sla-warn'; }).length;
          return { html: `<p>Hiện có <b>${active.length}</b> yêu cầu đang xử lý: <b>${warn} sắp trễ</b>, <b>${breach} đã trễ SLA</b>. Xem chi tiết trên trang Theo dõi SLA.</p>`, chips: [{ label: '⏰ Theo dõi SLA', href: appUrl('manager/sla-monitor.html') }] };
        }
        if (has('phản hồi', 'feedback', 'tóm tắt')) {
          const fb = Store.get('feedback');
          const avg = fb.length ? (fb.reduce((s, f) => s + f.rating, 0) / fb.length).toFixed(1) : '—';
          return { html: `<p>Hiện có <b>${fb.length} phản hồi</b>, điểm trung bình <b>${avg}/5</b>. Dùng tính năng <b>Tóm tắt phản hồi bằng AI</b> trên trang Báo cáo để nhận diện chủ đề nổi bật kèm lý do.</p>`, chips: [{ label: '💬 Mở báo cáo', href: appUrl('manager/service-report.html') }] };
        }
        if (has('nhân sự', 'phân quyền', 'role', 'cấp', 'tài khoản')) {
          return { html: `<p>Quản lý được <b>tạo tài khoản Nhân viên</b> và <b>cấp vị trí</b> (Buồng phòng, Ăn uống, Bảo trì, Lễ tân) trên trang Nhân sự. Việc cấp vai trò Quản lý / Quản trị viên chỉ do Quản trị viên thực hiện.</p>`, chips: [{ label: '👤 Mở trang Nhân sự', href: appUrl('manager/user-management.html') }] };
        }
        return fail;
      }

      if (u.role === 'admin') {
        if (has('dữ liệu', 'khách sạn', 'yêu cầu', 'nhiệm vụ', 'vận hành', 'phản hồi', 'lưu trú')) {
          return { html: `<p>Theo chính sách phân quyền của hệ thống, <b>Quản trị viên không được truy cập dữ liệu vận hành</b> (yêu cầu dịch vụ, nhiệm vụ, lưu trú, phản hồi khách). Quyền hạn của bạn: quản lý <b>tài khoản & vai trò</b> và <b>cập nhật hệ thống</b>.</p>`, chips: [{ label: '👥 Quản lý tài khoản', href: appUrl('admin/user-management.html') }] };
        }
        if (has('tài khoản', 'account', 'vai trò', 'role', 'phân quyền', 'cấp')) {
          const users = Store.get('users');
          const count = r => users.filter(x => x.role === r).length;
          return { html: `<p>Tổng <b>${users.length} tài khoản</b>: Khách ${count('guest')} · Nhân viên ${count('staff')} · Quản lý ${count('manager')} · Quản trị viên ${count('admin')}. Bạn có thể tạo tài khoản mới và cấp vai trò tại trang Tài khoản.</p>`, chips: [{ label: '👥 Mở trang Tài khoản', href: appUrl('admin/user-management.html') }] };
        }
        if (has('cập nhật', 'update', 'bảo trì', 'phiên bản', 'hệ thống')) {
          const flags = Store.get('flags');
          return { html: `<p>Hệ thống đang ở phiên bản <b>v${flags.version}</b>, chế độ bảo trì: <b>${flags.maintenance ? 'ĐANG BẬT' : 'tắt'}</b>. Bạn có thể đăng bản tin, bật/tắt bảo trì tại trang Cập nhật hệ thống.</p>`, chips: [{ label: '🛠 Mở trang Cập nhật', href: appUrl('admin/system-updates.html') }] };
        }
        return fail;
      }

      return fail;
    }
  }
};
