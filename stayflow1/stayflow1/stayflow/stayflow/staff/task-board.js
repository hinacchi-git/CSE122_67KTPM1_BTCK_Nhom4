// StayFlow – Nhân viên: Bảng nhiệm vụ
(function () {
  if (!window.StaffApp || document.body.dataset.page !== 'staff-task-board') return;
  const { me, myTasks, reqOf, taskCard, bindActions } = StaffApp;

  function initBoard() {
    const app = document.getElementById('app');
    const qSearch = document.getElementById('qSearch');
    const qPriority = document.getElementById('qPriority');
    const countEl = document.getElementById('resultCount');
    if (!me()) {
      countEl.textContent = '';
      UI.empty(app, {
        icon: '🧹', title: 'Tài khoản chưa có hồ sơ nhân viên',
        message: 'Hãy liên hệ Quản lý để hoàn tất gắn hồ sơ nhân viên với tài khoản của bạn.',
        actionLabel: 'Về bảng nhiệm vụ', actionHref: appUrl('staff/task-board.html')
      });
      return;
    }

    function render() {
      UI.skeleton(app, 3, 'card');
      setTimeout(() => {
        try {
          const all = myTasks()
            .map(t => ({ t, r: reqOf(t) }))
            .filter(x => x.r)
            .sort((a, b) => a.r.slaDueAt - b.r.slaDueAt);
          const q = qSearch.value.trim().toLowerCase();
          const qp = qPriority.value;
          let tasks = all.slice();
          if (q) tasks = tasks.filter(x => (x.r.title + ' ' + x.r.description).toLowerCase().includes(q));
          if (qp) tasks = tasks.filter(x => x.r.priority === qp);
          countEl.textContent = all.length ? `Đang hiển thị ${tasks.length}/${all.length} nhiệm vụ` : '';

          if (!tasks.length) {
            UI.empty(app, {
              icon: all.length ? '🔍' : '📭',
              title: all.length ? 'Không có nhiệm vụ phù hợp bộ lọc' : 'Chưa có nhiệm vụ nào',
              message: all.length ? 'Thử đổi từ khóa hoặc mức ưu tiên.' : 'Khi Quản lý điều phối, nhiệm vụ sẽ xuất hiện ở đây.',
              actionLabel: all.length ? 'Xóa bộ lọc' : '',
              onclick: all.length ? () => { qSearch.value = ''; qPriority.value = ''; render(); } : null
            });
            return;
          }

          const cols = { assigned: [], 'in-progress': [], done: [] };
          tasks.forEach(x => { if (cols[x.t.status]) cols[x.t.status].push(x); });

          const colTitles = {
            assigned: '📥 Cần nhận',
            'in-progress': '⚙️ Đang xử lý',
            done: '✅ Hoàn thành'
          };
          app.innerHTML = `
            <p class="page-sub" style="margin-bottom:12px">Vị trí của bạn: <b>${DEPARTMENTS[me().position].icon} ${DEPARTMENTS[me().position].name}</b> · Chỉ hiển thị nhiệm vụ được điều phối cho bạn.</p>
            <div class="board-cols">
              ${Object.keys(cols).map(k => `
                <div class="board-col">
                  <h3>${colTitles[k]} <span class="count">${cols[k].length}</span></h3>
                  ${cols[k].length ? cols[k].map(x => taskCard(x.t, x.r, k !== 'done')).join('')
                    : '<div class="col-empty">Chưa có nhiệm vụ nào</div>'}
                </div>`).join('')}
            </div>`;
          bindActions(app, render);
        } catch (err) {
          UI.error(app, { onRetry: render });
        }
      }, 400);
    }

    qSearch.addEventListener('input', render);
    qPriority.addEventListener('change', render);
    render();
  }

  initBoard();
})();
