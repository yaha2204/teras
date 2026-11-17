/**
 * Account gate — user wajib punya akun sebelum bisa masuk / daftar ke teras.
 * Memakai endpoint /api/auth/* (Vercel function + service_role Supabase).
 */

export function initAuthGate(apiClient, onAuthenticated) {
  const overlay = document.getElementById('authOverlay');
  if (!overlay || !apiClient) return;

  const form = document.getElementById('authForm');
  const tabRegister = document.getElementById('authTabRegister');
  const tabLogin = document.getElementById('authTabLogin');
  const displayNameRow = document.getElementById('authDisplayNameRow');
  const displayNameInput = document.getElementById('authDisplayName');
  const usernameInput = document.getElementById('authUsername');
  const passwordInput = document.getElementById('authPassword');
  const errorEl = document.getElementById('authError');
  const submitBtn = document.getElementById('authSubmit');

  let mode = 'register';

  function showOverlay() {
    overlay.classList.remove('hidden');
  }

  function setMode(next) {
    mode = next;
    const isRegister = mode === 'register';
    tabRegister.classList.toggle('active', isRegister);
    tabLogin.classList.toggle('active', !isRegister);
    displayNameRow.style.display = isRegister ? 'block' : 'none';
    submitBtn.textContent = isRegister ? 'Buat Akun & Masuk 🌸' : 'Masuk ke Teras 🔑';
    passwordInput.setAttribute('autocomplete', isRegister ? 'new-password' : 'current-password');
    clearError();
  }

  function clearError() {
    if (!errorEl) return;
    errorEl.textContent = '';
    errorEl.classList.add('hidden');
  }

  function showError(message) {
    if (!errorEl) return;
    errorEl.textContent = message || 'Terjadi kesalahan. Coba lagi.';
    errorEl.classList.remove('hidden');
  }

  function setBusy(busy) {
    if (!submitBtn) return;
    submitBtn.disabled = busy;
    submitBtn.textContent = busy
      ? 'Tunggu ya…'
      : (mode === 'register' ? 'Buat Akun & Masuk 🌸' : 'Masuk ke Teras 🔑');
  }

  function finish(user) {
    overlay.classList.add('hidden');
    clearError();
    if (typeof onAuthenticated === 'function') onAuthenticated(user);
  }

  if (tabRegister) tabRegister.addEventListener('click', () => setMode('register'));
  if (tabLogin) tabLogin.addEventListener('click', () => setMode('login'));
  usernameInput && usernameInput.addEventListener('input', clearError);
  passwordInput && passwordInput.addEventListener('input', clearError);

  if (form) {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      clearError();

      const username = (usernameInput?.value || '').trim();
      const password = passwordInput?.value || '';
      const displayName = (displayNameInput?.value || '').trim();

      if (!username || !password) {
        showError('Username dan password wajib diisi.');
        return;
      }

      setBusy(true);
      try {
        let data;
        if (mode === 'register') {
          let avatarData = {};
          try {
            avatarData = JSON.parse(localStorage.getItem('cozy_user_profile') || '{}');
          } catch { avatarData = {}; }
          data = await apiClient.register(username, password, displayName || username, avatarData);
        } else {
          data = await apiClient.login(username, password);
        }

        if (data && data.success && data.user) {
          finish(data.user);
        } else {
          showError(data?.error || 'Gagal. Periksa koneksi lalu coba lagi.');
        }
      } catch (err) {
        showError(err?.message || 'Gagal. Coba lagi.');
      } finally {
        setBusy(false);
      }
    });
  }

  setMode('register');

  // Kalau sudah punya sesi valid, langsung lewat. Kalau tidak, tampilkan gate.
  (async () => {
    if (!apiClient.token) {
      showOverlay();
      return;
    }
    showOverlay();
    try {
      const data = await apiClient.me();
      if (data && data.success && data.user) {
        finish(data.user);
      }
      // Kalau gagal, apiClient.me() sudah menghapus sesi — biarkan overlay tampil.
    } catch {
      showOverlay();
    }
  })();

  return { show: showOverlay, hide: () => overlay.classList.add('hidden') };
}
