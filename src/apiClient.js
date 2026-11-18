/**
 * Client penyimpanan ringan. Semua data sensitif hanya diakses lewat endpoint
 * same-origin (/api/*), tidak pernah lewat koneksi langsung dari browser.
 */

export class ThaloriaApiClient {
  constructor(options = {}) {
    this.localUrl = options.localUrl || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
      ? 'http://127.0.0.1:3333' 
      : `http://${window.location.hostname}:3333`);
    
    // Semua operasi akun/room memakai endpoint same-origin. Tidak ada URL
    // database maupun kunci API yang disimpan di browser.
    this.authUrl = options.authUrl !== undefined ? options.authUrl : '';

    this.activeMode = 'probing'; // 'local' | 'offline' | 'probing'
    this.token = localStorage.getItem('thaloria_jwt_token') || null;
    this.currentUser = JSON.parse(localStorage.getItem('thaloria_user_profile') || 'null');

    this.probeBackend();
  }

  // Probe local server with a fast 1.5s timeout
  async probeBackend() {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 1500);

      const res = await fetch(`${this.localUrl}/api/health`, {
        signal: controller.signal
      });
      clearTimeout(timer);

      if (res.ok) {
        this.activeMode = 'local';
        return 'local';
      }
    } catch {
      // Local server down or network unreachable
    }

    this.activeMode = 'offline';
    return 'offline';
  }

  getHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;
    return headers;
  }

  _saveSession(data) {
    if (data && data.success && data.token) {
      this.token = data.token;
      this.currentUser = data.user;
      localStorage.setItem('thaloria_jwt_token', data.token);
      localStorage.setItem('thaloria_user_profile', JSON.stringify(data.user));
    }
    return data;
  }

  async _authFetch(path, options = {}) {
    try {
      const res = await fetch(`${this.authUrl}/api/auth/${path}`, {
        method: options.method || 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.token && path !== 'login' ? { Authorization: `Bearer ${this.token}` } : {})
        },
        body: options.body ? JSON.stringify(options.body) : undefined
      });
      return await res.json();
    } catch (err) {
      return { success: false, error: 'Tidak bisa terhubung ke server akun' };
    }
  }

  // 1. REGISTER ACCOUNT
  async register(username, password, displayName, avatarData) {
    return this._saveSession(await this._authFetch('register', {
      body: { username, password, displayName, avatarData }
    }));
  }

  // 2. LOGIN ACCOUNT
  async login(username, password) {
    return this._saveSession(await this._authFetch('login', {
      body: { username, password }
    }));
  }

  // 2b. CEK SESI
  async me() {
    if (!this.token) return { success: false, error: 'Belum login' };
    const data = await this._authFetch('me', { method: 'GET' });
    if (data.success && data.user) {
      this.currentUser = data.user;
      localStorage.setItem('thaloria_user_profile', JSON.stringify(data.user));
    } else {
      this.logout();
    }
    return data;
  }

  logout() {
    this.token = null;
    this.currentUser = null;
    localStorage.removeItem('thaloria_jwt_token');
    localStorage.removeItem('thaloria_user_profile');
  }

  // 3. CREATE ROOM
  async createRoom(params = {}) {
    await this.probeBackend();

    if (this.activeMode === 'local') {
      const res = await fetch(`${this.localUrl}/api/rooms/create`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(params)
      });
      return await res.json();
    }

    // Cloud fallback: RLS hanya mengizinkan anon membaca room publik.
    // Penulisan harus lewat endpoint service_role (Vercel function), jadi di sini
    // kita kembalikan room lokal untuk dipakai UI tanpa menyimpan ke Supabase.
    return {
      success: true,
      persisted: false,
      room: {
        room_code: params.roomCode || `RM-${Math.floor(1000 + Math.random() * 9000)}`,
        room_name: params.roomName || 'Villa Hangout Cloud',
        current_scene: params.initialScene || 'terrace'
      }
    };
  }

  // 4. GET ROOM STATE
  async getRoom(roomCode) {
    await this.probeBackend();

    if (this.activeMode === 'local') {
      const res = await fetch(`${this.localUrl}/api/rooms/${encodeURIComponent(roomCode)}`);
      return await res.json();
    }

    return { success: false, error: 'Server tidak tersedia' };
  }

  // 5b. DAFTAR ROOM PUBLIK (via view aman, tanpa password/passcode)
  async listRooms(limit = 20) {
    await this.probeBackend();

    if (this.activeMode === 'local') {
      const res = await fetch(`${this.localUrl}/api/rooms`);
      return await res.json();
    }

    return { success: false, rooms: [], error: 'Server tidak tersedia' };
  }

  // 5. UPDATE ROOM STATE (Scene, Music, Siren)
  async updateRoomState(roomCode, state) {
    if (this.activeMode === 'local') {
      try {
        const res = await fetch(`${this.localUrl}/api/rooms/${encodeURIComponent(roomCode)}/state`, {
          method: 'PATCH',
          headers: this.getHeaders(),
          body: JSON.stringify(state)
        });
        return await res.json();
      } catch (err) {
        console.warn('Gagal sync ke local backend:', err);
      }
    }
  }

  /** Pastikan room permanen milik akun ini ada di Supabase (teras-akun-<id>). */
  async ensureRoom(params = {}) {
    try {
      const res = await fetch(`${this.authUrl}/api/rooms/ensure`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.token ? { Authorization: `Bearer ${this.token}` } : {})
        },
        body: JSON.stringify(params)
      });
      return await res.json();
    } catch {
      return { success: false, error: 'Gagal menyiapkan room permanen' };
    }
  }

  /** Tulis kehadiran akun. Dipakai juga dengan keepalive saat tab ditutup. */
  updatePresence(roomCode, payload = {}, options = {}) {
    if (!this.token) return Promise.resolve({ success: false, error: 'Belum login' });
    const body = JSON.stringify({ roomCode, ...payload });
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.token}`
    };
    if (options.keepalive && typeof fetch === 'function') {
      try {
        // fetch keepalive bisa membawa header Authorization (sendBeacon tidak bisa).
        return fetch(`${this.authUrl}/api/room/presence`, {
          method: 'POST', headers, body, keepalive: true
        }).then((r) => r.json()).catch(() => ({ success: false }));
      } catch {
        return Promise.resolve({ success: false });
      }
    }
    return fetch(`${this.authUrl}/api/room/presence`, {
      method: 'POST', headers, body
    }).then((r) => r.json()).catch(() => ({ success: false, error: 'Gagal menyimpan kehadiran' }));
  }

  async getOccupants(roomCode) {
    if (!this.token) return { success: false, error: 'Belum login', occupants: [] };
    try {
      const res = await fetch(
        `${this.authUrl}/api/room/occupants?roomCode=${encodeURIComponent(roomCode)}`,
        { headers: { Authorization: `Bearer ${this.token}` } }
      );
      return await res.json();
    } catch {
      return { success: false, error: 'Gagal membaca penghuni', occupants: [] };
    }
  }
}
