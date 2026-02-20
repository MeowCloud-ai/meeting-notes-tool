const CONTAINER_ID = 'meowmeet-compliance-overlay';
const STORAGE_KEY = 'meowmeet-skip-compliance';

export function showCompliancePrompt(): Promise<boolean> {
  return new Promise((resolve) => {
    // Check "don't show again"
    chrome.storage.local.get(STORAGE_KEY, (result) => {
      if (result[STORAGE_KEY]) {
        resolve(true);
        return;
      }

      // Remove existing overlay if any
      removeOverlay();

      const container = document.createElement('div');
      container.id = CONTAINER_ID;
      Object.assign(container.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: '2147483647',
        fontFamily: 'system-ui, sans-serif',
      });

      const dialog = document.createElement('div');
      Object.assign(dialog.style, {
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        maxWidth: '400px',
        width: '90%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      });

      dialog.innerHTML = `
        <h2 style="margin:0 0 12px;font-size:18px;font-weight:600;">🐱 MeowMeet 錄音提示</h2>
        <p style="margin:0 0 16px;color:#555;font-size:14px;line-height:1.5;">
          此通話將被 MeowMeet 錄音，請確認所有參與者已知悉。
        </p>
        <label style="display:flex;align-items:center;gap:8px;margin-bottom:16px;font-size:13px;color:#666;cursor:pointer;">
          <input type="checkbox" id="meowmeet-skip-checkbox" />
          不再提示
        </label>
        <div style="display:flex;gap:8px;justify-content:flex-end;">
          <button id="meowmeet-cancel-btn" style="padding:8px 16px;border:1px solid #ddd;border-radius:6px;background:white;cursor:pointer;font-size:14px;">取消</button>
          <button id="meowmeet-confirm-btn" style="padding:8px 16px;border:none;border-radius:6px;background:#EF4444;color:white;cursor:pointer;font-size:14px;">確認錄音</button>
        </div>
      `;

      container.appendChild(dialog);
      document.body.appendChild(container);

      const confirmBtn = document.getElementById('meowmeet-confirm-btn');
      const cancelBtn = document.getElementById('meowmeet-cancel-btn');
      const checkbox = document.getElementById('meowmeet-skip-checkbox') as HTMLInputElement | null;

      confirmBtn?.addEventListener('click', () => {
        if (checkbox?.checked) {
          chrome.storage.local.set({ [STORAGE_KEY]: true });
        }
        removeOverlay();
        resolve(true);
      });

      cancelBtn?.addEventListener('click', () => {
        removeOverlay();
        resolve(false);
      });
    });
  });
}

export function removeOverlay(): void {
  document.getElementById(CONTAINER_ID)?.remove();
}

export function resetSkipPreference(): void {
  chrome.storage.local.remove(STORAGE_KEY);
}
