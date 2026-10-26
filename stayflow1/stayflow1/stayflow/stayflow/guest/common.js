// StayFlow – Khu Khách: xác thực, khung trang và dữ liệu dùng chung cho 3 màn hình
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

  window.GuestApp = { user, myStay, myRequests };
})();
