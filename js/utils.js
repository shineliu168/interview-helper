/**
 * 公共工具库 - Toast 通知、模态框、日期格式化等
 */

// ==================== Toast 通知 ====================

function showToast(message, type = 'info', duration = 3000) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'toastSlideOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ==================== 模态框 ====================

function showModal(title, contentHTML, onSave) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h3 class="modal-title">${title}</h3>
        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
      </div>
      <div class="modal-body">${contentHTML}</div>
      <div class="modal-footer">
        <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">取消</button>
        <button class="btn btn-primary" id="modal-save-btn">保存</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });

  if (onSave) {
    overlay.querySelector('#modal-save-btn').addEventListener('click', async () => {
      const btn = overlay.querySelector('#modal-save-btn');
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner spinner-sm"></span> 保存中...';
      try { await onSave(overlay); } catch(err) { showToast(err.message || '操作失败', 'error'); }
    });
  }
  return overlay;
}

function showConfirm(message) {
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal" style="max-width:400px;">
        <div class="modal-body" style="text-align:center;font-size:1rem;padding:24px;">
          <p>${message}</p>
        </div>
        <div class="modal-footer" style="justify-content:center;">
          <button class="btn btn-outline cancel-btn">取消</button>
          <button class="btn btn-danger confirm-btn">确认</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.querySelector('.cancel-btn').onclick = () => { overlay.remove(); resolve(false); };
    overlay.querySelector('.confirm-btn').onclick = () => { overlay.remove(); resolve(true); };
    overlay.addEventListener('click', e => { if (e.target === overlay) { overlay.remove(); resolve(false); }});
  });
}

// ==================== 格式化工具 ====================

function formatDate(dateStr) {
  if (!dateStr || dateStr === '至今') return '至今';
  try {
    const [y, m] = dateStr.split('-');
    return `${y}年${parseInt(m)}月`;
  } catch { return dateStr; }
}

function calcDuration(start, end) {
  if (!start) return '';
  try {
    const [sy, sm] = start.split('-').map(Number);
    let ey, em;
    if (end && end !== '至今') { [ey, em] = end.split('-').map(Number); }
    else { const n = new Date(); ey = n.getFullYear(); em = n.getMonth() + 1; }
    const total = (ey - sy) * 12 + (em - sm);
    const y = Math.floor(total / 12), m = total % 12;
    if (y > 0 && m > 0) return `${y}年${m}个月`;
    if (y > 0) return `${y}年`;
    return `${m}个月`;
  } catch { return ''; }
}

function escapeHtml(text) {
  if (!text) return '';
  const d = document.createElement('div');
  d.textContent = text;
  return d.innerHTML;
}
