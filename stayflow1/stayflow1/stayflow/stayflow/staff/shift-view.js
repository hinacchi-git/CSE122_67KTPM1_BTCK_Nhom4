// StayFlow – Nhân viên: Ca làm việc
(function () {
  if (!window.StaffApp || document.body.dataset.page !== 'staff-shift-view') return;
  const { me } = StaffApp;

  function initShifts() {
    const app = document.getElementById('app');
    if (!me()) { UI.empty(app, { icon: '🧹', title: 'Chưa có hồ sơ nhân viên', actionLabel: 'Về bảng nhiệm vụ', actionHref: appUrl('staff/task-board.html') }); return; }
    
    let currentTab = 'shifts';
    const typeLabels = {
      morning: 'Ca sáng ☀️',
      afternoon: 'Ca chiều 🌤',
      night: 'Ca đêm 🌙',
      office: 'Ca hành chính 🏢'
    };
    const swapStatus = {
      pending: { label: 'Chờ duyệt', cls: 'badge-warn' },
      approved: { label: 'Đã duyệt', cls: 'badge-success' },
      rejected: { label: 'Bị từ chối', cls: 'badge-danger' }
    };

    async function openReportDialog(s) {
      const shiftDateStr = UI.fmtDate(Date.now() + s.dayOffset * 86400000);
      const values = await UI.dialog({
        title: 'Báo cáo ca làm việc',
        description: 'Ca ' + (typeLabels[s.type] || s.type) + ' (' + s.start + '–' + s.end + ') · Ngày: ' + shiftDateStr + '. Báo cáo sẽ được gửi tới Quản lý.',
        submitLabel: 'Gửi báo cáo ca',
        fields: [
          {
            name: 'summary',
            label: 'Tóm tắt công việc đã thực hiện trong ca',
            type: 'textarea',
            required: true,
            placeholder: 'Ví dụ: Đã hoàn thành 5 yêu cầu dọn phòng, kiểm tra đầy đủ tiện nghi.'
          },
          {
            name: 'issues',
            label: 'Vấn đề / Sự cố phát sinh (nếu có)',
            type: 'textarea',
            placeholder: 'Ví dụ: Phòng 503 điều hòa bị rò nước, bóng đèn phòng 501 cần thay thế...'
          },
          {
            name: 'handover',
            label: 'Nội dung bàn giao ca tiếp theo',
            type: 'textarea',
            placeholder: 'Ví dụ: Bàn giao chìa khóa tầng 5 và 3 bộ ga giường mới cho ca chiều.'
          },
          {
            name: 'status',
            label: 'Đánh giá chất lượng ca làm',
            type: 'select',
            required: true,
            value: 'good',
            options: [
              { value: 'good', label: '✅ Ca làm thuận lợi, hoàn thành tốt' },
              { value: 'issue', label: '⚠️ Có sự cố phát sinh cần Quản lý lưu ý' }
            ]
          }
        ]
      });

      if (!values) return;

      const reports = Store.get('shiftReports') || [];
      const newRep = {
        id: newId('sr'),
        shiftId: s.id,
        staffId: me().id,
        staffName: me().name,
        department: me().position,
        shiftDate: Date.now() + s.dayOffset * 86400000,
        shiftType: s.type,
        hours: s.start + '–' + s.end,
        summary: values.summary,
        issues: values.issues || '',
        handover: values.handover || '',
        status: values.status,
        createdAt: Date.now()
      };

      reports.push(newRep);
      Store.set('shiftReports', reports);
      UI.toast('Đã gửi báo cáo ca làm việc tới Quản lý!');
      render();
    }

    async function viewReport(r) {
      await UI.dialog({
        title: 'Chi tiết báo cáo ca làm',
        description: 'Ca ' + (typeLabels[r.shiftType] || r.shiftType) + ' (' + (r.hours || '') + ') · Gửi lúc: ' + UI.fmtDateTime(r.createdAt),
        submitLabel: 'Đóng',
        fields: [
          { name: '_sum', label: 'Công việc đã làm', type: 'textarea', value: r.summary },
          { name: '_iss', label: 'Sự cố / Lưu ý', type: 'textarea', value: r.issues || 'Không có' },
          { name: '_han', label: 'Bàn giao ca', type: 'textarea', value: r.handover || 'Không có' }
        ]
      });
    }

    function render() {
      UI.skeleton(app, 3, 'card');

      setTimeout(function () {
        try {
          const shifts = Store.get('shifts').filter(s => s.staffId === me().id).sort((a, b) => a.dayOffset - b.dayOffset);
          const swaps = Store.get('swapRequests').filter(s => s.staffId === me().id).sort((a, b) => b.createdAt - a.createdAt);
          const allReports = Store.get('shiftReports') || [];
          const myReports = allReports.filter(r => r.staffId === me().id).sort((a, b) => b.createdAt - a.createdAt);

          if (!shifts.length && !swaps.length && !myReports.length) {
            UI.empty(app, { icon: '🗓️', title: 'Chưa có lịch ca nào', message: 'Quản lý chưa xếp ca làm việc cho bạn.' });
            return;
          }

          app.innerHTML = `
            <div class="tabs" style="margin-bottom:20px">
              <button class="tab-btn ${currentTab === 'shifts' ? 'active' : ''}" data-tab="shifts">📅 Lịch ca của tôi (${shifts.length})</button>
              <button class="tab-btn ${currentTab === 'myReports' ? 'active' : ''}" data-tab="myReports">📋 Báo cáo ca đã gửi (${myReports.length})</button>
              <button class="tab-btn ${currentTab === 'swaps' ? 'active' : ''}" data-tab="swaps">🔄 Yêu cầu đổi ca (${swaps.length})</button>
            </div>

            <div id="tabContent"></div>
          `;

          app.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
              currentTab = btn.dataset.tab;
              render();
            });
          });

          const tabContent = document.getElementById('tabContent');

          // ---------- TAB 1: LỊCH CA CỦA TÔI ----------
          if (currentTab === 'shifts') {
            if (!shifts.length) {
              UI.empty(tabContent, { icon: '🗓️', title: 'Chưa có ca làm việc nào', message: 'Bạn chưa được xếp ca làm việc trong thời gian này.' });
              return;
            }

            tabContent.innerHTML = `
              <div class="grid-2">
                ${shifts.map(s => {
                  const hasPending = swaps.some(w => w.shiftId === s.id && w.status === 'pending');
                  const report = allReports.find(r => r.shiftId === s.id);
                  const isToday = s.dayOffset === 0;
                  const dateStr = UI.fmtDate(Date.now() + s.dayOffset * 86400000);

                  return `
                    <div class="card shift-card ${isToday ? 'today' : ''}" style="margin-bottom:12px; display:flex; flex-direction:column; align-items:stretch; gap:12px">
                      <div style="display:flex; justify-content:space-between; align-items:center">
                        <span class="shift-time" style="font-size:1.15rem">${s.start} – ${s.end}</span>
                        ${isToday ? '<span class="badge badge-danger">HÔM NAY</span>' : (s.dayOffset === 1 ? '<span class="badge badge-info">NGÀY MAI</span>' : '')}
                      </div>

                      <div class="shift-info">
                        <b style="font-size:1rem; color:var(--text-dark)">${dateStr}</b>
                        <p style="color:var(--muted); font-size:.88rem; margin-top:3px">${typeLabels[s.type] || s.type}</p>
                      </div>

                      <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:4px; padding-top:10px; border-top:1px solid var(--border)">
                        ${report ? `
                          <button class="btn btn-sm btn-mint" data-view-report="${report.id}">
                            👁️ Xem lại báo cáo ca
                          </button>
                        ` : `
                          <button class="btn btn-sm btn-primary" data-report-shift="${s.id}">
                            📝 Báo cáo ca làm
                          </button>
                        `}

                        ${!hasPending ? `
                          <button class="btn btn-sm btn-outline" data-swap="${s.id}" data-date="${UI.esc(dateStr)}">
                            Đề xuất đổi ca
                          </button>
                        ` : '<span class="badge badge-warn" style="align-self:center">Chờ duyệt đổi ca</span>'}
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            `;

            tabContent.querySelectorAll('[data-report-shift]').forEach(btn => {
              btn.addEventListener('click', () => {
                const s = shifts.find(x => x.id === btn.dataset.reportShift);
                if (s) openReportDialog(s);
              });
            });

            tabContent.querySelectorAll('[data-view-report]').forEach(btn => {
              btn.addEventListener('click', () => {
                const r = allReports.find(x => x.id === btn.dataset.viewReport);
                if (r) viewReport(r);
              });
            });

            tabContent.querySelectorAll('[data-swap]').forEach(btn => {
              btn.addEventListener('click', async () => {
                const values = await UI.dialog({
                  title: 'Đề xuất đổi ca',
                  description: 'Ca ' + btn.dataset.date + '. Quản lý sẽ xem xét và phê duyệt.',
                  submitLabel: 'Gửi đề xuất',
                  fields: [
                    { name: 'reason', label: 'Lý do đổi ca', type: 'textarea', required: true, placeholder: 'Ví dụ: Có việc gia đình đột xuất buổi chiều' }
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
          }

          // ---------- TAB 2: BÁO CÁO CA LÀM ĐÃ GỬI ----------
          else if (currentTab === 'myReports') {
            if (!myReports.length) {
              UI.empty(tabContent, {
                icon: '📋',
                title: 'Chưa có báo cáo ca làm nào',
                message: 'Sau khi hoàn thành ca làm việc, bạn có thể gửi báo cáo công việc và bàn giao tại tab "Lịch ca của tôi".'
              });
              return;
            }

            tabContent.innerHTML = `
              <div class="grid-2">
                ${myReports.map(rep => {
                  const isGood = rep.status === 'good';
                  return `
                    <div class="card req-card" style="border-left:4px solid ${isGood ? 'var(--mint)' : 'var(--coral)'}">
                      <div class="req-top">
                        <span class="req-icon">${isGood ? '✅' : '⚠️'}</span>
                        <div>
                          <b style="font-size:1rem">Ca ${rep.hours || ''}</b>
                          <small style="display:block; color:var(--muted)">Ngày ca: ${UI.fmtDate(rep.shiftDate)}</small>
                        </div>
                        <span class="badge ${isGood ? 'badge-success' : 'badge-danger'}" style="margin-left:auto">
                          ${isGood ? 'Hoàn thành tốt' : 'Có sự cố'}
                        </span>
                      </div>

                      <div style="margin:12px 0; font-size:.92rem">
                        <div style="margin-bottom:8px">
                          <b style="color:var(--text-dark)">📝 Công việc trong ca:</b>
                          <p style="color:var(--text); margin-top:2px">${UI.esc(rep.summary)}</p>
                        </div>

                        ${rep.issues ? `
                          <div style="margin-bottom:8px; background:#fff5f5; padding:8px 12px; border-radius:8px; border:1px solid #fed7da">
                            <b style="color:var(--coral)">⚠️ Vấn đề / Sự cố:</b>
                            <p style="color:var(--text-dark); margin-top:2px">${UI.esc(rep.issues)}</p>
                          </div>` : ''}

                        ${rep.handover ? `
                          <div style="background:var(--mint-light); padding:8px 12px; border-radius:8px; border:1px solid var(--mint-border)">
                            <b style="color:var(--mint)">🤝 Bàn giao ca:</b>
                            <p style="color:var(--text-dark); margin-top:2px">${UI.esc(rep.handover)}</p>
                          </div>` : ''}
                      </div>

                      <div class="req-meta">
                        <span>Đã gửi lúc: ${UI.fmtDateTime(rep.createdAt)} (${UI.timeAgo(rep.createdAt)})</span>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            `;
          }

          // ---------- TAB 3: YÊU CẦU ĐỔI CA ----------
          else if (currentTab === 'swaps') {
            if (!swaps.length) {
              UI.empty(tabContent, { icon: '🔄', title: 'Chưa có yêu cầu đổi ca nào', message: 'Bạn chưa gửi đề xuất đổi ca nào.' });
              return;
            }

            tabContent.innerHTML = `
              <div class="grid-2">
                ${swaps.map(w => {
                  const s = Store.get('shifts').find(x => x.id === w.shiftId);
                  const si = swapStatus[w.status] || { label: w.status, cls: 'badge-muted' };
                  return `
                    <div class="card req-card">
                      <div class="req-top">
                        <span class="req-icon">🔄</span>
                        <b style="font-size:1rem">Ca ${s ? s.start + '–' + s.end : '?'}</b>
                        <span class="badge ${si.cls}">${si.label}</span>
                      </div>
                      <p class="req-desc" style="margin:10px 0"><b>Lý do:</b> ${UI.esc(w.reason)}</p>
                      <div class="req-meta">
                        <span>Ngày ca: <b>${s ? UI.fmtDate(Date.now() + s.dayOffset * 86400000) : '?'}</b></span>
                        <span>·</span>
                        <span>Gửi ${UI.timeAgo(w.createdAt)}</span>
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
      }, 350);
    }

    render();
  }

  initShifts();
})();
