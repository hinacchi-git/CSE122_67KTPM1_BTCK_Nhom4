// StayFlow – Khách: Tạo yêu cầu dịch vụ (kèm AI-1 phân loại)
(function () {
  if (!window.GuestApp || document.body.dataset.page !== 'guest-service-request') return;
  const { myStay } = GuestApp;

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

  initRequest();
})();
