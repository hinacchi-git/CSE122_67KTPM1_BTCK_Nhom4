// StayFlow – Quản lý: Sắp xếp ca làm việc
(function () {
  if (!window.ManagerApp || document.body.dataset.page !== 'manager-shift-management') return;
  const { user } = ManagerApp;

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

  initShiftManagement();
})();
