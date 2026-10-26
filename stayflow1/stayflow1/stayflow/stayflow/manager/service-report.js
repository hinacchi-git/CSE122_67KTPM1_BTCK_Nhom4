// StayFlow – Quản lý: Báo cáo dịch vụ (kèm AI-3 tóm tắt phản hồi)
(function () {
  if (!window.ManagerApp || document.body.dataset.page !== 'manager-service-report') return;
  const { allRequests, user } = ManagerApp;

  function initReport() {
    const statsEl = document.getElementById('stats');
    const chartEl = document.getElementById('chart');
    const fbEl = document.getElementById('fbList');
    const aiPanel = document.getElementById('aiPanel');
    const savedEl = document.getElementById('savedSummaries');

    function renderSaved() {
      const list = Store.get('aiSummaries') || [];
      savedEl.innerHTML = list.length
        ? list.slice().sort((a, b) => b.at - a.at).map(s => `
            <div class="card fb-item">
              <div class="req-top">
                <b>💬 Tóm tắt ${s.total} phản hồi · điểm TB ${s.avg}/5</b>
                <span class="badge badge-info">${UI.fmtDateTime(s.at)}</span>
              </div>
              <ul class="ai-list" style="margin-top:8px">
                ${s.topics.map(tp => `<li><b>${UI.esc(tp.name)}</b> – ${tp.count} lần</li>`).join('')}
              </ul>
              <p class="fb-meta">Lưu bởi ${UI.esc(s.by)}</p>
            </div>`).join('')
        : '<p class="card-sub">Chưa có nhận xét AI nào được lưu.</p>';
    }

    function render() {
      try {
        const reqs = allRequests();
        const fbs = Store.get('feedback');
        const done = reqs.filter(r => r.status === 'completed');
        const onTime = done.filter(r => r.completedAt <= r.slaDueAt);
        const avg = fbs.length ? (fbs.reduce((s, f) => s + f.rating, 0) / fbs.length).toFixed(1) : '—';

        statsEl.innerHTML = `
          <div class="card stat-card"><div class="stat-value">${reqs.length}</div><div class="stat-label">Tổng yêu cầu</div></div>
          <div class="card stat-card"><div class="stat-value">${done.length}</div><div class="stat-label">Hoàn thành</div></div>
          <div class="card stat-card"><div class="stat-value">${done.length ? Math.round(onTime.length / done.length * 100) : 0}%</div><div class="stat-label">Đúng SLA</div></div>
          <div class="card stat-card"><div class="stat-value">${avg}/5</div><div class="stat-label">Điểm phản hồi TB</div></div>`;

        const types = Store.get('serviceTypes');
        const counts = types.map(t => ({ t, n: reqs.filter(r => r.serviceTypeId === t.id).length }));
        const max = Math.max(1, ...counts.map(c => c.n));
        chartEl.innerHTML = `<div class="bar-chart">${counts.map(c => `
          <div class="bar-row">
            <span>${c.t.icon} ${UI.esc(c.t.name)}</span>
            <div class="bar-track"><div class="bar-fill" style="width:${Math.round(c.n / max * 100)}%"></div></div>
            <b>${c.n}</b>
          </div>`).join('')}</div>`;

        fbEl.innerHTML = fbs.length
          ? fbs.slice().sort((a, b) => b.createdAt - a.createdAt).map(f => `
              <div class="card fb-item">
                <div class="req-top"><b>${UI.esc(f.guestName)}</b><span class="stars">${'★'.repeat(f.rating)}${'☆'.repeat(5 - f.rating)}</span></div>
                <p class="req-desc">${UI.esc(f.comment)}</p>
                <p class="fb-meta">${UI.timeAgo(f.createdAt)}</p>
              </div>`).join('')
          : '<p class="card-sub">Chưa có phản hồi nào.</p>';
      } catch (err) {
        UI.error(statsEl, { onRetry: render });
      }
    }

    async function runSummarize() {
      const btn = document.getElementById('aiSummaryBtn');
      btn.disabled = true;
      aiPanel.innerHTML = '<div class="ai-processing">💬 AI đang đọc và đúc kết phản hồi<span class="dots"></span></div>';
      const fbs = Store.get('feedback');
      const result = await AI.summarize(fbs);
      btn.disabled = false;

      if (!result.ok) {
        aiPanel.innerHTML = `
          <div class="ai-result fail">
            <b>⚠️ Không thực hiện được</b>
            <p class="ai-reason">${UI.esc(result.message)}</p>
            <div class="req-actions">
              <button class="btn btn-sm btn-outline" id="sRetry">🔄 Thử lại</button>
              <button class="btn btn-sm btn-ghost" id="sSkip">Bỏ qua</button>
            </div>
          </div>`;
        aiPanel.querySelector('#sRetry').addEventListener('click', runSummarize);
        aiPanel.querySelector('#sSkip').addEventListener('click', () => aiPanel.innerHTML = '');
        return;
      }
      aiPanel.innerHTML = `
        <div class="ai-result">
          <b>💬 AI đã đúc kết ${result.total} phản hồi (điểm TB ${result.avg}/5) thành các chủ đề:</b>
          <ul class="ai-list" style="margin-top:8px">
            ${result.topics.map(tp => `<li><b>${tp.name}</b> – nhắc đến ${tp.count} lần<br><small class="card-sub">Ví dụ: "${UI.esc(tp.sample)}"</small></li>`).join('')}
          </ul>
          <p class="ai-reason">Vì sao? AI thống kê tần suất các từ khóa chủ đề trong toàn bộ phản hồi và chọn ra 3 chủ đề nổi bật nhất.</p>
          <div class="req-actions">
            <button class="btn btn-sm btn-primary" id="sSave">💾 Lưu nhận xét</button>
            <button class="btn btn-sm btn-outline" id="sAgain">🔁 Tạo lại</button>
            <button class="btn btn-sm btn-ghost" id="sSkip2">Đóng</button>
          </div>
        </div>`;
      aiPanel.querySelector('#sAgain').addEventListener('click', runSummarize);
      aiPanel.querySelector('#sSkip2').addEventListener('click', () => aiPanel.innerHTML = '');
      aiPanel.querySelector('#sSave').addEventListener('click', () => {
        const saved = Store.get('aiSummaries') || [];
        saved.push({
          id: newId('sm'), at: Date.now(), by: user.fullName,
          total: result.total, avg: result.avg, topics: result.topics
        });
        Store.set('aiSummaries', saved);
        addLog('Quản lý ' + user.fullName + ' lưu nhận xét AI từ ' + result.total + ' phản hồi', 'report');
        UI.toast('Đã lưu nhận xét vào báo cáo');
        renderSaved();
        aiPanel.innerHTML = '';
      });
      UI.toast('AI đã tóm tắt phản hồi');
    }

    document.getElementById('aiSummaryBtn').addEventListener('click', runSummarize);
    render();
    renderSaved();
  }

  initReport();
})();
