// StayFlow – Trợ lý AI mô phỏng (chạy theo quy tắc, không cần máy chủ)
// Luồng bắt buộc theo đề: Nhập -> Đang xử lý -> Kết quả -> Giải thích -> Người dùng kiểm soát.
// Mỗi tính năng đều có trạng thái thất bại ("Không đủ dữ liệu..." / "AI chưa chắc chắn...").

const AI = {
  wait(ms) { return new Promise(r => setTimeout(r, ms || 900)); },

  // AI-1: Phân loại yêu cầu vào đúng bộ phận
  async classify(text) {
    await this.wait();
    const t = String(text || '').toLowerCase().trim();
    if (t.length < 10) {
      return {
        ok: false,
        code: 'not-enough',
        message: 'Không đủ dữ liệu để phân loại. Hãy mô tả rõ hơn (ví dụ: "Cho mình xin thêm 2 khăn tắm và 1 chai nước suối").'
      };
    }
    const rules = [
      { cat: 'housekeeping', kw: ['dọn', 'khăn', 'chăn', 'gối', 'sạch', 'giặt', 'ủi', 'lau'] },
      { cat: 'roomservice',  kw: ['ăn', 'đồ ăn', 'cơm', 'phở', 'mì', 'trà', 'cà phê', 'nước', 'snack', 'bia', 'rượu', 'spa', 'massage'] },
      { cat: 'maintenance',  kw: ['hỏng', 'sửa', 'điều hòa', 'máy lạnh', 'đèn', 'vòi', 'nóng lạnh', 'tivi', 'cửa', 'khóa', 'rò', 'điện'] },
      { cat: 'frontdesk',    kw: ['thẻ', 'lễ tân', 'gửi xe', 'hóa đơn', 'check', 'trả phòng', 'đón', 'taxi', 'đặt bàn', 'đặt lịch'] }
    ];
    let best = null;
    for (const r of rules) {
      const hit = r.kw.filter(k => t.includes(k));
      if (hit.length && (!best || hit.length > best.hit.length)) best = { cat: r.cat, hit };
    }
    if (!best) {
      return {
        ok: false,
        code: 'unsure',
        message: 'AI chưa chắc chắn về kết quả này (không tìm thấy từ khóa dịch vụ nào). Bạn hãy chọn loại dịch vụ thủ công.'
      };
    }
    const conf = best.hit.length >= 2 ? 'độ tin cậy cao' : 'độ tin cậy trung bình';
    return {
      ok: true,
      category: best.cat,
      confidence: conf,
      reason: 'Mô tả chứa các từ khóa "' + best.hit.join('", "') + '" – thường thuộc dịch vụ ' + DEPARTMENTS[best.cat].name + '.'
    };
  },

  // AI-2: Gợi ý mức ưu tiên kèm lý do
  async suggestPriority(req) {
    await this.wait();
    const text = ((req.title || '') + ' ' + (req.description || '')).toLowerCase();
    const stay = stayById(req.stayId);
    const reasons = [];
    let score = 1;

    const urgentKw = ['gấp', 'khẩn cấp', 'ngay', 'rò rỉ', 'không lạnh', 'cháy', 'điện', 'ngạt', 'không bật'];
    const hit = urgentKw.filter(k => text.includes(k));
    if (hit.length) { score += 2; reasons.push('Mô tả có từ ngữ cấp bách: "' + hit.join('", "') + '"'); }
    if (stay && stay.vip) { score += 1; reasons.push('Khách lưu trú là VIP'); }
    const leftMin = (req.slaDueAt - Date.now()) / 60000;
    if (leftMin < 15) { score += 1; reasons.push('SLA chỉ còn khoảng ' + Math.max(0, Math.round(leftMin)) + ' phút'); }

    const level = score >= 4 ? 'urgent' : score >= 3 ? 'high' : score >= 2 ? 'medium' : 'low';
    if (!reasons.length) {
      return {
        ok: true, unsure: true, level: 'medium',
        reason: 'AI chưa chắc chắn về kết quả này – không thấy dấu hiệu ưu tiên rõ ràng. Đề xuất mức Trung bình, bạn nên xem xét lại.'
      };
    }
    return { ok: true, unsure: false, level, reason: reasons.join('. ') + '.' };
  },

  // AI-3: Tóm tắt chủ đề phản hồi của khách
  async summarize(list) {
    await this.wait(1200);
    if (!list || list.length < 3) {
      return { ok: false, message: 'Không đủ dữ liệu để tóm tắt (cần ít nhất 3 phản hồi).' };
    }
    const topics = [
      { name: 'Tốc độ phục vụ',     kw: ['chậm', 'nhanh', 'lâu', 'chờ', 'đúng giờ', 'nguội'] },
      { name: 'Chất lượng đồ ăn',   kw: ['ăn', 'ngon', 'đồ ăn', 'cơm', 'phở', 'bữa sáng'] },
      { name: 'Sạch sẽ',            kw: ['sạch', 'thơm', 'bụi'] },
      { name: 'Thái độ nhân viên',  kw: ['thân thiện', 'nhân viên', 'nhiệt tình', 'thái độ', 'lịch sự'] },
      { name: 'Cơ sở vật chất',     kw: ['điều hòa', 'hỏng', 'sửa', 'tivi', 'máy'] }
    ];
    const avg = (list.reduce((s, f) => s + f.rating, 0) / list.length).toFixed(1);
    const result = topics.map(tp => {
      const matched = list.filter(f => tp.kw.some(k => (f.comment || '').toLowerCase().includes(k)));
      return matched.length
        ? { name: tp.name, count: matched.length, sample: matched[0].comment }
        : null;
    }).filter(Boolean).sort((a, b) => b.count - a.count).slice(0, 3);

    if (!result.length) {
      return { ok: false, message: 'AI chưa chắc chắn về kết quả này – chưa nhận diện được chủ đề nổi bật trong các phản hồi.' };
    }
    return { ok: true, total: list.length, avg, topics: result };
  }
};
