/**
 * STAYFLOW AI INTELLIGENCE SIMULATION ENGINE (stayflow-ai.js)
 * Tích hợp 3 tính năng AI bắt buộc theo chuẩn quy trình:
 * Nhập -> Đang xử lý -> Kết quả -> Giải thích -> Can thiệp người dùng
 */

const StayFlowAI = (function() {

  /**
   * AI-1: REQUEST CLASSIFIER
   * Tự động đọc hiểu yêu cầu của khách và phân loại vào đúng bộ phận
   */
  function classifyRequest(text, callback) {
    if (!text || text.trim().length < 3) {
      if (callback) {
        callback({
          success: false,
          uncertain: true,
          message: 'Văn bản quá ngắn hoặc chưa đủ thông tin để AI nhận diện.',
          rationale: 'Vui lòng nhập mô tả chi tiết hơn (ví dụ: cần thêm đồ dùng, dọn dẹp hoặc sự cố kỹ thuật).'
        });
      }
      return;
    }

    const lower = text.toLowerCase();

    // Mô phỏng độ trễ xử lý AI (400ms - 700ms) để có trạng thái loading thực tế
    setTimeout(() => {
      let result = {
        success: true,
        uncertain: false,
        serviceId: 'SVC-02',
        serviceName: 'Bổ sung đồ dùng tiện ích',
        category: 'Housekeeping',
        department: 'Buồng phòng',
        slaMinutes: 15,
        priority: 'MEDIUM',
        confidence: 96,
        detectedKeywords: [],
        rationale: ''
      };

      // Kỹ thuật / Bảo trì / Điện lạnh / Nước
      if (lower.includes('điều hòa') || lower.includes('máy lạnh') || lower.includes('chảy nước') || 
          lower.includes('rò rỉ') || lower.includes('vòi sen') || lower.includes('hỏng') || 
          lower.includes('bóng đèn') || lower.includes('chập') || lower.includes('wifi') || lower.includes('tivi') || lower.includes('kẹt')) {
        result.serviceId = 'SVC-03';
        result.serviceName = 'Sửa chữa kỹ thuật & Điều hòa';
        result.category = 'Maintenance';
        result.department = 'Kỹ thuật';
        result.slaMinutes = 20;
        result.confidence = 98;
        result.detectedKeywords = ['kỹ thuật', 'sự cố', 'điều hòa/nước'];

        if (lower.includes('chảy nước') || lower.includes('rò rỉ') || lower.includes('chập')) {
          result.priority = 'HIGH';
          result.rationale = 'Phát hiện sự cố rò rỉ nước/điện có nguy cơ ảnh hưởng cơ sở vật chất. Tự động đề xuất chuyển bộ phận Kỹ thuật và nâng ưu tiên lên CAO.';
        } else {
          result.rationale = 'Nhận diện vấn đề tiện nghi phòng liên quan đến thiết bị điện/nước. Đề xuất điều phối đội ngũ Kỹ thuật xử lý trong 20 phút.';
        }
      }
      // Dọn dẹp phòng đầy đủ
      else if (lower.includes('dọn phòng') || lower.includes('thay ga') || lower.includes('hút bụi') || lower.includes('dọn dẹp') || lower.includes('vệ sinh')) {
        result.serviceId = 'SVC-01';
        result.serviceName = 'Dọn dẹp phòng đầy đủ';
        result.category = 'Housekeeping';
        result.department = 'Buồng phòng';
        result.slaMinutes = 30;
        result.confidence = 95;
        result.detectedKeywords = ['dọn dẹp', 'vệ sinh buồng phòng'];
        result.rationale = 'Nhận diện nhu cầu làm sạch buồng phòng tiêu chuẩn. SLA cam kết hoàn thành trong 30 phút.';
      }
      // Ẩm thực tại phòng (Room Service)
      else if (lower.includes('ăn') || lower.includes('phở') || lower.includes('cơm') || lower.includes('bánh mì') || 
               lower.includes('cà phê') || lower.includes('cafe') || lower.includes('nước ép') || lower.includes('đói') || lower.includes('món')) {
        result.serviceId = 'SVC-04';
        result.serviceName = 'Ẩm thực tại phòng (Room Service)';
        result.category = 'F&B';
        result.department = 'Ẩm thực & Bếp';
        result.slaMinutes = 25;
        result.confidence = 94;
        result.detectedKeywords = ['ẩm thực', 'room service', 'đồ ăn/uống'];
        result.rationale = 'Nhận diện yêu cầu đặt món và đồ uống tại phòng. Thời gian chế biến và giao nóng tiêu chuẩn: 25 phút.';
      }
      // Giặt là
      else if (lower.includes('giặt') || lower.includes('ủi') || lower.includes('là áo') || lower.includes('quần áo')) {
        result.serviceId = 'SVC-05';
        result.serviceName = 'Giặt là cao cấp lấy nhanh';
        result.category = 'Laundry';
        result.department = 'Giặt là';
        result.slaMinutes = 90;
        result.confidence = 92;
        result.detectedKeywords = ['giặt là', 'ủi đồ'];
        result.rationale = 'Nhận diện dịch vụ chăm sóc trang phục. Phân loại sang Tổ Giặt là cao cấp.';
      }
      // Tiện ích đồ dùng (Khăn, nước, bàn chải...)
      else if (lower.includes('khăn') || lower.includes('nước') || lower.includes('dép') || lower.includes('bàn chải') || lower.includes('dầu gội') || lower.includes('gối')) {
        result.serviceId = 'SVC-02';
        result.serviceName = 'Bổ sung đồ dùng tiện ích';
        result.category = 'Housekeeping';
        result.department = 'Buồng phòng';
        result.slaMinutes = 15;
        result.confidence = 97;
        result.detectedKeywords = ['amenities', 'tiện ích', 'đồ dùng'];
        result.rationale = 'Yêu cầu vật tư tiêu hao thông thường. Đề xuất nhân viên buồng phòng trực tầng cấp phát trong 15 phút.';
      }
      // Trường hợp không chắc chắn
      else {
        result.uncertain = true;
        result.confidence = 58;
        result.rationale = 'AI chưa chắc chắn về loại dịch vụ này do chưa khớp từ khóa chuẩn. Đề xuất phân loại tạm thời là Tiện ích buồng phòng, người dùng có thể tự chọn lại.';
      }

      if (callback) callback(result);
    }, 450);
  }

  /**
   * AI-2: PRIORITY & DISPATCH ASSISTANT
   * Phân tích rủi ro, mức độ khẩn cấp và đề xuất nhân viên tiếp nhận
   */
  function evaluatePriority(requestData, callback) {
    setTimeout(() => {
      const desc = (requestData.description || '').toLowerCase();
      const isVip = !!requestData.vip;
      const dept = requestData.department || 'Buồng phòng';

      let priority = 'MEDIUM';
      let urgencyScore = 50; // Thang 100
      let reasons = [];

      // 1. Phân tích sự cố cơ sở hạ tầng
      if (desc.includes('chảy nước') || desc.includes('rò rỉ') || desc.includes('ngập') || desc.includes('chập')) {
        urgencyScore += 40;
        reasons.push('Sự cố rò rỉ nước/điện có nguy cơ hư hỏng tài sản phòng');
      }

      // 2. Khách VIP
      if (isVip) {
        urgencyScore += 25;
        reasons.push('Khách hàng hạng VIP - yêu cầu ưu tiên phục vụ hàng đầu');
      }

      // 3. Quyết định mức ưu tiên
      if (urgencyScore >= 75) {
        priority = 'CRITICAL';
      } else if (urgencyScore >= 60) {
        priority = 'HIGH';
      } else if (urgencyScore <= 35) {
        priority = 'LOW';
      }

      // Gợi ý nhân viên phù hợp đang có ít việc nhất trong bộ phận
      let allStaff = StayFlowDB.getStaff().filter(s => s.department === dept);
      if (!allStaff.length) allStaff = StayFlowDB.getStaff();
      let bestStaff = allStaff[0] || null;
      if (allStaff.length > 1) {
        // Tìm nhân viên có ít task nhất
        bestStaff = allStaff.reduce((prev, curr) => (prev.activeTasks < curr.activeTasks ? prev : curr));
      }

      const response = {
        urgencyScore,
        suggestedPriority: priority,
        suggestedStaffId: bestStaff ? bestStaff.id : 'STF-01',
        suggestedStaffName: bestStaff ? bestStaff.name : 'Nguyễn Văn Hoàng',
        reasons: reasons.length ? reasons : ['Yêu cầu tiêu chuẩn trong khung giờ phục vụ thường nhật.'],
        fullRationale: `Đánh giá mức ưu tiên: ${priority} (Điểm khẩn cấp: ${urgencyScore}/100). ${reasons.join('. ')}. Đề xuất nhân viên ${bestStaff ? bestStaff.name : 'phù hợp'} tiếp nhận.`
      };

      if (callback) callback(response);
    }, 400);
  }

  /**
   * AI-3: FEEDBACK SUMMARIZER & SENTIMENT INSIGHTS
   * Tóm tắt phản hồi của khách, phân tích cảm xúc và trích xuất điểm cần cải thiện
   */
  function summarizeFeedback(feedbacks) {
    if (!feedbacks || feedbacks.length === 0) {
      return {
        total: 0,
        positivePercent: 0,
        neutralPercent: 0,
        negativePercent: 0,
        summaryText: 'Chưa có đủ dữ liệu phản hồi để AI tổng hợp.',
        highlights: [],
        painPoints: []
      };
    }

    const total = feedbacks.length;
    let posCount = 0;
    let neuCount = 0;
    let negCount = 0;

    feedbacks.forEach(f => {
      if (f.rating >= 4) posCount++;
      else if (f.rating === 3) neuCount++;
      else negCount++;
    });

    const posPct = Math.round((posCount / total) * 100);
    const neuPct = Math.round((neuCount / total) * 100);
    const negPct = 100 - posPct - neuPct;

    return {
      total,
      avgRating: (feedbacks.reduce((acc, cur) => acc + cur.rating, 0) / total).toFixed(1),
      positivePercent: posPct,
      neutralPercent: neuPct,
      negativePercent: Math.max(0, negPct),
      summaryText: `Dựa trên phân tích ${total} phản hồi gần nhất, chỉ số hài lòng đạt ${posPct}%. Bộ phận Buồng phòng và Phục vụ được đánh giá rất cao về tốc độ phản hồi và thái độ thân thiện. Cần lưu ý bảo dưỡng kỹ thuật định kỳ hệ thống nước nóng và điều hòa tại các tầng trung.`,
      highlights: [
        'Tốc độ cấp phát khăn và tiện ích rất nhanh (< 12 phút trung bình)',
        'Thái độ nhân viên buồng phòng chu đáo, lịch thiệp',
        'Món ăn Room Service giao nóng và đóng gói sạch sẽ'
      ],
      painPoints: [
        'Một số phòng phản ánh nước nóng cần xả 2-3 phút mới ấm',
        'Tín hiệu Wi-Fi cần tăng cường tại các góc ban công tầng cao'
      ]
    };
  }

  return {
    classifyRequest,
    evaluatePriority,
    summarizeFeedback
  };
})();

// Expose to window
window.StayFlowAI = StayFlowAI;
